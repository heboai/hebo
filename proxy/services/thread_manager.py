import asyncio
import logging
import re
import uuid
from collections import deque
from datetime import datetime, timedelta
from typing import List

import asyncpg
from fastapi import HTTPException
from langchain_core.messages import (
    AIMessage,
    BaseMessage as LangchainBaseMessage,
    HumanMessage,
    ToolMessage,
)

from db.database import DB
from db.vectorstore import VectorStore
from schemas.ai import Session
from schemas.agent_settings import AgentSetting
from schemas.threads import (
    AddMessageRequest,
    BaseMessage,
    CreateThreadRequest,
    Message,
    MessageContent,
    MessageContentType,
    MessageType,
    Run,
    RunRequest,
    RunResponse,
    RunStatus,
    Thread,
)
from .ai.conversations import execute_conversation, execute_summary
from .ai.vision import get_content_from_human_message
from .exceptions import ColleagueHandoffException
from .retriever import Retriever


logger = logging.getLogger(__name__)
FALLBACK_TEXT = "Acknowledged. How can I help you further?"


class ThreadManager:
    def __init__(
        self,
        conn: asyncpg.Connection,
    ):
        self.db: DB = DB(conn)
        self.vectorstore: VectorStore = VectorStore(conn)

    async def create_thread(
        self, request: CreateThreadRequest, organization_id: str
    ) -> Thread:
        """Create a new thread"""
        thread = Thread(
            organization_id=organization_id,
            is_open=True,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            contact_name=request.contact_name,
            contact_identifier=request.contact_identifier,
        )
        thread_id = await self.db.create_thread(thread)
        thread.id = thread_id

        logger.info(
            "Created new thread %s for organization %s", thread_id, organization_id
        )
        return thread

    async def _generate_summary(
        self, thread: Thread, organization_id: str, agent_version: str | None = None
    ) -> str | None:
        if not thread.id:
            return None

        messages = await self.db.get_valid_thread_messages(thread.id)

        if not messages:
            return None

        if not agent_version:
            agent_version = await self.db.get_agent_version_from_run(
                thread.id, organization_id
            )

        if not agent_version:
            return None

        agent_settings = await self.db.get_agent_settings(
            agent_version, organization_id
        )

        if not agent_settings:
            return None

        session = Session(
            contact_identifier=thread.contact_identifier,
            thread_id=str(thread.id),
            trace_id=uuid.uuid4(),
            agent_version=agent_version,
            organization_id=organization_id,
        )

        # We add a dot to the end of the conversation to make sure the last agent message is not skipped.
        # TODO: This is a hack. We should find a better way to do this.
        messages.append(
            Message(
                message_type=MessageType.HUMAN,
                content=[MessageContent(type=MessageContentType.TEXT, text=".")],
                thread_id=thread.id,
                created_at=datetime.now(messages[-1].created_at.tzinfo),
            )
        )
        llm_conversation = await self._messages_to_llm_conversation(
            messages, agent_settings, session
        )
        llm_conversation: List[LangchainBaseMessage] = [
            msg
            for msg in llm_conversation
            if isinstance(msg, (AIMessage, HumanMessage))
        ]
        summary = await execute_summary(agent_settings, llm_conversation[:-1], session)

        return summary

    async def close_thread(
        self, thread_id: int, organization_id: str, agent_version: str | None = None
    ) -> tuple[Thread, str | None]:
        await self.db.close_thread(thread_id, organization_id)
        thread = await self.db.get_thread(thread_id, organization_id)

        if not thread:
            logger.warning("Thread %s not found", thread_id)
            raise HTTPException(status_code=404, detail="Thread not found")

        logger.info("Thread %s closed", thread_id)

        summary = None
        try:
            summary = await self._generate_summary(
                thread, organization_id, agent_version
            )

            if not summary:
                logger.warning("Thread %s has no summary", thread_id)

            else:
                await self.db.add_thread_summary(thread_id, summary)
                logger.info("Thread %s has been added a summary", thread_id)

        except Exception as e:
            logger.error("Error generating summary for thread %s: %s", thread_id, e)
            return thread, None

        return thread, summary

    async def _add_message(self, message: Message) -> Message:
        message = await self._format_message(message)
        id = await self.db.add_message(message)
        message.id = id
        logger.info("added message to thread %s", message.thread_id)
        return message

    async def add_message(
        self,
        message_request: AddMessageRequest,
        thread_id: int,
        organization_id: str,
    ) -> Message:
        thread = await self.db.get_thread(thread_id, organization_id)

        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")

        for content in message_request.content:
            content_type = self._get_content_type(content)
            if content_type not in ["text", "image", "image_url"]:
                return await self._handle_unsupported_message(content_type, thread_id)

        message = Message(
            message_type=message_request.message_type,
            content=message_request.content,
            thread_id=thread_id,
            created_at=datetime.now(),
        )

        message = await self._add_message(message)
        await self.db.expire_runs(thread_id, organization_id)
        return message

    async def remove_message(
        self, message_id: int, thread_id: int, organization_id: str
    ) -> int:
        thread = await self.db.get_thread(thread_id, organization_id)

        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")

        await self.db.remove_message(message_id, thread_id)
        return message_id

    @staticmethod
    async def _replace_image_url_with_text(
        message: LangchainBaseMessage,
        agent_setting: AgentSetting,
        session: Session,
    ) -> LangchainBaseMessage:
        if isinstance(message, AIMessage):
            for content in message.content:
                if isinstance(content, dict) and content.get("type") == "image_url":
                    # Create a new HumanMessage with the content
                    # human_message = HumanMessage(content=[content])
                    # Execute vision with a list containing the HumanMessage
                    # vision_response = await execute_vision(
                    #     [human_message], session, agent_setting
                    # )
                    # Currently were getting a timeout error when closing a thread because the execute vision is taking too long and causing failure.
                    # TODO: Find a better way to handle this and reenable the code above.
                    vision_response = "[image]"
                    content["text"] = (
                        f"I'm sharing an image with you. Here is the description:\n{vision_response}"
                    )
                    content["type"] = "text"
                    content.pop("image_url", None)
        return message

    async def _messages_to_llm_conversation(
        self, messages: List[Message], agent_setting: AgentSetting, session: Session
    ) -> List[LangchainBaseMessage]:
        llm_conversation: List[LangchainBaseMessage] = []

        # Merge messages
        conversation_messages = self._merge_sanitize_messages(messages)
        for message in conversation_messages:
            if message.message_type.value in ["ai", "human", "tool", "human_agent"]:
                message_class = {
                    "ai": AIMessage,
                    "human": HumanMessage,
                    "tool": ToolMessage,
                    "human_agent": AIMessage,
                }[message.message_type.value]
                formatted_message = await self._replace_image_url_with_text(
                    message_class(**message.to_langchain_format()),
                    agent_setting,
                    session,
                )
                llm_conversation.append(formatted_message)
        return llm_conversation

    async def run_thread(
        self, run_request: RunRequest, thread_id: int, organization_id: str
    ):
        logger.info("load conversation detail from DB")
        run_id = None
        thread = await self.db.get_thread(thread_id, organization_id)
        if not thread or thread.id is None:
            logger.info("thread %s not found", thread_id)
            raise HTTPException(status_code=404, detail="Thread not found")
        try:
            # Init the retriever
            agent_settings = await self.db.get_agent_settings(
                run_request.agent_version, organization_id
            )

            if not agent_settings:
                raise HTTPException(status_code=404, detail="Agent settings not found")
            if not agent_settings.core_llm:
                raise HTTPException(status_code=404, detail="Core LLM not found")
            if not agent_settings.embeddings:
                raise HTTPException(status_code=404, detail="Embeddings not found")

            retriever = Retriever(
                vector_store=self.vectorstore, agent_settings=agent_settings
            )
            # Create the run
            run = Run(
                organization_id=organization_id,
                version_id=agent_settings.version_id,
                thread_id=thread_id,
                status=RunStatus.CREATED,
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
            # First, expire previous runs for this thread
            await self.db.expire_runs(thread_id, organization_id)
            # Then, create the new run
            run_id = await self.db.create_run(run)
            run_response = RunResponse(
                agent_version=run_request.agent_version,
                status=RunStatus.CREATED,
            )
            yield f"data: {run_response.model_dump_json(exclude_none=True)}\n\n"

            messages = []

            if agent_settings.include_last_24h_history and thread.contact_identifier:
                last_24h_history = await self.db.get_last_24h_history(
                    thread.contact_identifier, organization_id
                )
                if last_24h_history:
                    messages.extend(last_24h_history)

            else:
                valid_messages = await self.db.get_valid_thread_messages(thread_id)

                if valid_messages:
                    messages.extend(valid_messages)

            # TODO: refactor the following: we can reduce code duplication here.
            # TODO: Hint: raise colleague handoff exception if the last message is not human.
            if not messages or messages[-1].message_type != MessageType.HUMAN:
                run_status = await self._get_run_status(run_id, organization_id)
                run_status = (
                    RunStatus.COMPLETED
                    if run_status in [RunStatus.CREATED, RunStatus.RUNNING]
                    else run_status
                )
                run_response = RunResponse(
                    agent_version=run_request.agent_version,
                    status=run_status,
                    message=BaseMessage(
                        message_type=MessageType.COMMENT,
                        content=[
                            MessageContent(
                                type=MessageContentType.ERROR,
                                error="Last message in thread is not human. Skipping processing.",
                            ),
                        ],
                    ),
                )
                await self.db.update_run_status(
                    run_id, run_status.value, organization_id
                )
                yield f"data: {run_response.model_dump_json(exclude_none=True)}\n\n"
                message = Message(
                    message_type=MessageType.COMMENT,
                    content=[
                        MessageContent(
                            type=MessageContentType.ERROR,
                            error="Last message in thread is not human. Skipping processing.",
                        ),
                    ],
                    created_at=datetime.now(),
                    thread_id=thread.id,
                    run_status=run_status,
                )
                await self._add_message(message)
                return

            # We include a small latency to make sure the user has finished typing their multi-part message
            # This is more art than science. We should think about a more robust solution in the future. (And patent it eventually)
            # The solution should handle cases where users are sending multi-part messages.
            if len(messages) > 1:
                await asyncio.sleep(8)
            run_status = await self._get_run_status(run_id, organization_id)
            if run_status != RunStatus.CREATED:
                run_response = RunResponse(
                    agent_version=run_request.agent_version,
                    status=run_status,
                )
                yield f"data: {run_response.model_dump_json(exclude_none=True)}\n\n"
                logger.info("Run %s is not in CREATED status", run_id)

            # Create a session to trace the thread execution
            session = Session(
                contact_identifier=thread.contact_identifier,
                thread_id=str(thread.id),
                trace_id=uuid.uuid4(),
                agent_version=run_request.agent_version,
                organization_id=organization_id,
            )

            llm_conversation = await self._messages_to_llm_conversation(
                messages, agent_settings, session
            )

            # Retrieve relevant context
            context = await retriever.get_relevant_sources(llm_conversation, session)
            behaviour_parts = await self.db.get_behaviour_parts(
                agent_settings.version_id, organization_id
            )
            behaviour = "\n\n".join([part["content"] for part in behaviour_parts])

            logger.info("conversation has %s messages", len(llm_conversation))
            logger.info("process conversation with LLM")

            history_summaries_str = None
            if thread.contact_identifier:
                history_summaries = await self.db.get_thread_summaries(
                    thread.contact_identifier, organization_id
                )

                if history_summaries:
                    history_summaries_str = "\n\n".join(
                        [
                            f"{summary.created_at.strftime('%Y-%m-%d %H:%M:%S')} \n {summary.content}"
                            for summary in history_summaries
                        ]
                    )

            reply_messages = []
            async for _reply in execute_conversation(
                agent_settings_or_llm=agent_settings,
                conversation=llm_conversation,
                behaviour=behaviour,
                context=context,
                history_summaries=history_summaries_str,
                session=session,
            ):
                # Replies from execute_conversation are of type AiMessage or ToolMessage
                # AiMessages may contain tool calls, ToolMessages are 1 single text message
                message_type = (
                    MessageType.AI
                    if isinstance(_reply, AIMessage)
                    else MessageType.TOOL_ANSWER
                )
                message_content = []
                for content in _reply.content:
                    if isinstance(content, dict):
                        message_content_type = (
                            MessageContentType.TEXT
                            if content.get("type", "") == "text"
                            else MessageContentType.TOOL_USE
                        )
                        if message_content_type == MessageContentType.TOOL_USE:
                            message_content.append(
                                MessageContent(
                                    type=message_content_type,
                                    name=content.get("name", ""),
                                    input=content.get("input", {}),
                                    id=content.get("id", ""),
                                )
                            )
                        else:
                            message_content.append(
                                MessageContent(
                                    type=message_content_type,
                                    text=content.get("text", ""),
                                )
                            )
                    else:
                        message_content.append(
                            MessageContent(
                                type=MessageContentType.TEXT,
                                text=content,
                            )
                        )

                reply = Message(
                    message_type=message_type,
                    content=message_content,
                    thread_id=thread.id,
                    created_at=datetime.now(),
                )

                if isinstance(_reply, ToolMessage):
                    reply.tool_call_id = _reply.tool_call_id
                    reply.tool_call_name = _reply.additional_kwargs.get(
                        "tool_call_name"
                    )

                reply_messages.append(reply)
                run_status = await self._get_run_status(run_id, organization_id)
                should_send = self._should_send_message(
                    reply_messages,
                    llm_conversation,
                    run_status,
                    agent_settings.hide_tool_messages,
                )

                message_parts = self._split_message(reply)
                for i, part in enumerate(message_parts):
                    if part.text:
                        if (
                            await self._get_run_status(run_id, organization_id)
                            == RunStatus.CREATED
                        ):
                            await self.db.update_run_status(
                                run_id, RunStatus.RUNNING.value, organization_id
                            )
                            run_response = RunResponse(
                                agent_version=run_request.agent_version,
                                status=RunStatus.RUNNING,
                            )
                            yield f"data: {run_response.model_dump_json(exclude_none=True)}\n\n"
                            logger.info("Run %s running", run_id)

                        if not re.search(r"call \w+ tool", part.text):
                            # Calculate delay based on word count and reading speed
                            word_count = len(part.text.split())
                            # Convert WPM to seconds
                            delay = (word_count / 100) * 60
                            # Add a delay of -30 seconds for the first part to account for the system latency
                            delay -= 30 if i == 0 else 0
                            await asyncio.sleep(
                                max(0, delay)
                                if (
                                    agent_settings.delay
                                    and message_type != MessageType.TOOL_ANSWER
                                    and should_send
                                )
                                else 0.75
                            )
                            base_message = BaseMessage(
                                message_type=message_type,
                                content=[part],
                            )
                            run_status = await self._get_run_status(
                                run_id, organization_id
                            )

                            if run_status != RunStatus.RUNNING:
                                should_send = False

                            run_response = RunResponse(
                                agent_version=run_request.agent_version,
                                status=run_status,
                                message=base_message,
                                should_send=should_send,
                            )
                            yield f"data: {run_response.model_dump_json(exclude_none=True)}\n\n"
                            message = Message(
                                message_type=reply.message_type,
                                content=[part],
                                created_at=datetime.now(),
                                thread_id=thread.id,
                                run_status=run_status,
                            )
                            if message_type == MessageType.TOOL_ANSWER:
                                message.tool_call_id = reply.tool_call_id
                                message.tool_call_name = reply.tool_call_name
                                if reply.tool_call_name == "colleague_handoff":
                                    # in case of handoff we also yield a comment
                                    run_response = RunResponse(
                                        agent_version=run_request.agent_version,
                                        status=run_status,
                                        message=BaseMessage(
                                            message_type=MessageType.COMMENT,
                                            content=[part],
                                        ),
                                        should_send=False,
                                    )
                                    yield f"data: {run_response.model_dump_json(exclude_none=True)}\n\n"
                            await self._add_message(message)

                        else:
                            logger.warning("Irregular handover from the agent.")
                            raise ColleagueHandoffException(
                                "The agent is handing over the conversation, please read the conversation history carefully."
                            )
                    if part.type == MessageContentType.TOOL_USE:
                        run_status = await self._get_run_status(run_id, organization_id)
                        run_response = RunResponse(
                            agent_version=run_request.agent_version,
                            status=run_status,
                            message=BaseMessage(
                                message_type=MessageType.AI,
                                content=[part],
                            ),
                            should_send=False,
                        )
                        yield f"data: {run_response.model_dump_json(exclude_none=True)}\n\n"
                        message = Message(
                            message_type=MessageType.AI,
                            content=[part],
                            created_at=datetime.now(),
                            thread_id=thread.id,
                            run_status=run_status,
                        )
                        await self._add_message(message)

            run_status = await self._get_run_status(run_id, organization_id)
            if run_status in [RunStatus.RUNNING, RunStatus.CREATED]:
                await self.db.update_run_status(
                    run_id, RunStatus.COMPLETED.value, organization_id
                )
                run_response = RunResponse(
                    agent_version=run_request.agent_version,
                    status=RunStatus.COMPLETED,
                )
                yield f"data: {run_response.model_dump_json(exclude_none=True)}\n\n"
                logger.info("Run %s is completed", run_id)

        except Exception as e:
            logger.error("Error running thread: %s", e, exc_info=True)

            logger.warning("Handing off thread because of Exception.")

            run_status = RunStatus.ERROR
            if run_id:
                run_status = await self._get_run_status(run_id, organization_id)
                run_status = (
                    RunStatus.ERROR
                    if run_status not in [RunStatus.CREATED, RunStatus.RUNNING]
                    else run_status
                )
                await self.db.update_run_status(
                    run_id, run_status.value, organization_id
                )

            run_response = RunResponse(
                agent_version=run_request.agent_version,
                status=run_status,
                message=BaseMessage(
                    message_type=MessageType.COMMENT,
                    content=[
                        MessageContent(
                            type=MessageContentType.TEXT,
                            text=(
                                e.message
                                if isinstance(e, ColleagueHandoffException)
                                else "Something went wrong. Please, take over the conversation."
                            ),
                        ),
                        MessageContent(
                            type=MessageContentType.ERROR,
                            error=str(e),
                        ),
                    ],
                ),
            )
            yield f"data: {run_response.model_dump_json(exclude_none=True)}\n\n"
            message = Message(
                message_type=MessageType.COMMENT,
                content=[
                    MessageContent(
                        type=MessageContentType.TEXT,
                        text=(
                            e.message
                            if isinstance(e, ColleagueHandoffException)
                            else "Something went wrong. Please, take over the conversation."
                        ),
                    ),
                    MessageContent(
                        type=MessageContentType.ERROR,
                        error=str(e),
                    ),
                ],
                created_at=datetime.now(),
                thread_id=thread.id,
                run_status=run_status,
            )
            await self._add_message(message)
            return

    async def _get_run_status(self, run_id: int, organization_id: str) -> RunStatus:
        run = await self.db.get_run(run_id, organization_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        return run.status

    @staticmethod
    def _should_send_message(
        replies: List[Message],
        conversation_messages: List[
            AIMessage | LangchainBaseMessage | HumanMessage | ToolMessage
        ],
        run_status: RunStatus,
        hide_tool_messages: bool = False,
    ) -> bool:
        if run_status in [RunStatus.ERROR, RunStatus.EXPIRED, RunStatus.COMPLETED]:
            return False

        if replies[-1].message_type != MessageType.AI:
            return False

        # The first message is always sent
        if len([m for m in conversation_messages if isinstance(m, AIMessage)]) == 0:
            if (
                len(
                    [
                        reply
                        for reply in replies
                        if reply.message_type == MessageType.TOOL_ANSWER
                    ]
                )
                == 0
            ):
                return True

        if not hide_tool_messages:
            return True

        # We send message between two tool calls, unless the tool call is an error
        if len(replies) > 1 and replies[-2].message_type == MessageType.TOOL_ANSWER:
            if any(
                "error" in c.text.lower()
                for c in replies[-2].content
                if c.text is not None
            ) and any(
                tool_call.name == replies[-2].tool_call_name
                for tool_call in replies[-1].content
            ):
                return False

            return True

        # We send AI messages as long as they do not introduce a tool use (at this point hide_tool_messages is True)
        elif not any(
            c.type == MessageContentType.TOOL_USE for c in replies[-1].content
        ):
            return True

        return False

    @staticmethod
    def _split_message(message: Message) -> List[MessageContent]:
        if message.message_type == MessageType.TOOL_ANSWER:
            return message.content

        response_text = str(
            "\n\n".join(
                [item.text for item in message.content if item.text is not None]
            )
        )

        # Split the response text into parts and format each part as a MessageContent
        return [
            MessageContent(type=MessageContentType.TEXT, text=part)
            for part in response_text.split("\n\n")
        ] + [c for c in message.content if c.type == MessageContentType.TOOL_USE]

    @staticmethod
    def _ai_fallback(after_msg: Message) -> Message:
        """Create a plain-text AI reply that covers any missing assistant turn."""
        return Message(
            message_type=MessageType.AI,
            content=[
                MessageContent(
                    type=MessageContentType.TEXT,
                    text=FALLBACK_TEXT,
                )
            ],
            created_at=after_msg.created_at + timedelta(milliseconds=1),
            thread_id=after_msg.thread_id,
        )

    @staticmethod
    def _tool_placeholder(tool_use: MessageContent, base_msg: Message) -> Message:
        """Generate a dummy TOOL_ANSWER when the tool never replied."""
        return Message(
            message_type=MessageType.TOOL_ANSWER,
            content=[
                MessageContent(
                    type=MessageContentType.TEXT,
                    text="The tool was called but no response was received. Try again.",
                )
            ],
            created_at=base_msg.created_at + timedelta(milliseconds=1),
            thread_id=base_msg.thread_id,
            tool_call_id=tool_use.id,
            tool_call_name=tool_use.name,
        )

    def _sanitize_messages(self, messages: list[Message]) -> list[Message]:
        """
        Enforces the sequence:

            AI(tool_use …N)
            → TOOL_ANSWER …N  (one per id, any order)
            → AI(any text - tool_use allowed)  [fallback inserted *only if missing*]

        • No other message type is allowed until all pending tool ids are answered.
        • Missing answers are patched with placeholders.
        • Conversation is trimmed so it ends on a HUMAN message (policy choice).
        """

        cleaned: list[Message] = []
        pending: deque[str] = deque()  # tool_call_ids awaiting answer

        i = 0
        while i < len(messages):
            msg = messages[i]

            # ── 1. Assistant message ────────────────────────────────────────────
            if msg.message_type == MessageType.AI:
                cleaned.append(msg)

                # Register any tool_use ids
                pending.extend(
                    c.id
                    for c in msg.content
                    if c.type == MessageContentType.TOOL_USE and c.id is not None
                )
                i += 1
                continue

            # ── 2. Expected tool answers ────────────────────────────────────────
            if (
                pending
                and msg.message_type == MessageType.TOOL_ANSWER
                and msg.tool_call_id in pending
            ):
                cleaned.append(msg)
                pending.remove(msg.tool_call_id)

                # If that was the *last* expected answer,
                # peek ahead: do we already have an assistant next?
                if not pending:
                    next_is_ai = (
                        i + 1 < len(messages)
                        and messages[i + 1].message_type == MessageType.AI
                    )
                    if not next_is_ai:
                        cleaned.append(self._ai_fallback(msg))
                i += 1
                continue

            # ── 3. A NON-tool-answer arrived while answers still pending ────────
            if pending:
                # Close the gap with placeholders for every still-pending id
                last_ai = next(
                    m for m in reversed(cleaned) if m.message_type == MessageType.AI
                )
                id_to_tool = {
                    c.id: c
                    for c in last_ai.content
                    if c.type == MessageContentType.TOOL_USE
                }
                for tid in list(pending):
                    cleaned.append(self._tool_placeholder(id_to_tool[tid], last_ai))
                    pending.remove(tid)

                # Insert fallback only if *this* very message is not assistant
                if msg.message_type != MessageType.AI:
                    cleaned.append(self._ai_fallback(cleaned[-1]))

                # ↓ Do not consume msg yet; process it in the next loop
                continue

            # ── 4. Normal copy once nothing is pending ──────────────────────────
            cleaned.append(msg)
            i += 1

        # ── 5. End-of-list: still missing answers? ──────────────────────────────
        if pending:
            last_ai = next(
                m for m in reversed(cleaned) if m.message_type == MessageType.AI
            )
            id_to_tool = {
                c.id: c
                for c in last_ai.content
                if c.type == MessageContentType.TOOL_USE
            }
            for tid in list(pending):
                cleaned.append(self._tool_placeholder(id_to_tool[tid], last_ai))
                pending.remove(tid)

            # No more messages, so definitely add the fallback assistant
            cleaned.append(self._ai_fallback(cleaned[-1]))

        # ── 6. Ensure the conversation ends with HUMAN ───────
        if cleaned and cleaned[-1].message_type != MessageType.HUMAN:
            cleaned.pop()

        return cleaned

    @staticmethod
    def _merge_messages(messages: List[Message]) -> List[Message]:
        """
        Merges consecutive messages of the same type (excluding tool answers) into single messages.

        Messages are sorted by creation time. Consecutive messages of the same type, except for tool answer messages, are merged by concatenating their content. The first human and human agent messages are prefixed for clarity.
        """
        formatted_messages = []
        previous_message = None
        previous_message_type = None
        added_first_human_message = False
        # Sort messages by created_at in ascending order
        messages = sorted(messages, key=lambda x: x.created_at)
        for message in messages:
            if message.message_type != MessageType.TOOL_ANSWER and (
                not previous_message_type
                or message.message_type == previous_message_type
            ):
                if previous_message:
                    prev_content = previous_message.content
                    curr_content = message.content
                    if (
                        prev_content
                        and curr_content
                        and prev_content[-1].type == MessageContentType.TEXT
                        and curr_content[0].type == MessageContentType.TEXT
                        and curr_content[0].text is not None
                        and prev_content[-1].text is not None
                    ):
                        # Add a newline between the AI message and the human message
                        message.content[0].text = (
                            prev_content[-1].text + "\n\n" + curr_content[0].text
                        )
                    else:
                        message.content = prev_content + curr_content

                elif message.message_type == MessageType.HUMAN_AGENT:
                    curr_content = message.content
                    if curr_content[0].type == MessageContentType.TEXT:
                        message.content[
                            0
                        ].text = f"Human colleague: {curr_content[0].text}"
                    else:
                        message.content.insert(
                            0,
                            MessageContent(
                                type=MessageContentType.TEXT,
                                text="Human colleague: ",
                            ),
                        )

                elif message.message_type == MessageType.HUMAN:
                    if not added_first_human_message:
                        added_first_human_message = True
                        curr_content = message.content
                        if curr_content[0].type == MessageContentType.TEXT:
                            message.content[
                                0
                            ].text = f"(first message) {curr_content[0].text}"
                        else:
                            message.content.insert(
                                0,
                                MessageContent(
                                    type=MessageContentType.TEXT,
                                    text="(first message)",
                                ),
                            )

                previous_message = message
                previous_message_type = message.message_type
            else:
                if previous_message:
                    formatted_messages.append(previous_message)
                previous_message = message
                previous_message_type = message.message_type

        # Add the last human message if it exists
        if previous_message:
            formatted_messages.append(previous_message)

        return formatted_messages

    def _merge_sanitize_messages(self, messages: List[Message]) -> List[Message]:
        messages = self._merge_messages(messages)
        return self._sanitize_messages(messages)

    @staticmethod
    def _get_content_type(message_content: MessageContent) -> str:
        return message_content.type.value

    async def _handle_unsupported_message(
        self,
        content_type: str,
        thread_id: int,
    ) -> Message:
        # Log the full message object for later investigation
        logger.warning(f"Unexpected message type received: {content_type}. ")

        # Create a concise comment for operations
        comment_text = f"Message type '{content_type}' is not supported. The message will be ignored."

        return Message(
            message_type=MessageType.COMMENT,
            content=[MessageContent(type=MessageContentType.TEXT, text=comment_text)],
            created_at=datetime.now(),
            thread_id=thread_id,
        )

    async def _format_message(self, message: Message) -> Message:
        format_message_map = {
            MessageType.AI: self._format_ai_message,
            MessageType.HUMAN: self._format_human_message,
            MessageType.HUMAN_AGENT: self._format_human_agent_message,
            MessageType.TOOL_ANSWER: self._format_tool_message,
            MessageType.COMMENT: self._format_comment_message,
        }

        return await format_message_map[message.message_type](message)

    @staticmethod
    async def _format_human_message(message: Message) -> Message:
        content = await get_content_from_human_message(message)
        message.content = content
        message.message_type = MessageType.HUMAN
        return message

    @staticmethod
    async def _format_human_agent_message(message: Message) -> Message:
        content = await get_content_from_human_message(message)
        message.content = content
        message.message_type = MessageType.HUMAN_AGENT
        return message

    @staticmethod
    async def _format_tool_message(message: Message) -> Message:
        content = await get_content_from_human_message(message)
        message.content = content
        message.message_type = MessageType.TOOL_ANSWER
        return message

    @staticmethod
    async def _format_comment_message(message: Message) -> Message:
        message.message_type = MessageType.COMMENT
        return message

    @staticmethod
    async def _format_ai_message(message: Message) -> Message:
        message.message_type = MessageType.AI
        return message

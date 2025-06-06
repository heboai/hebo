import anyio
import logging
from anyio.abc import ObjectSendStream
from typing import List, Optional, AsyncGenerator

from langchain_core.language_models import BaseChatModel, LanguageModelInput
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.runnables import Runnable
from langchain_mcp_adapters.tools import load_mcp_tools
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

from config import settings
from schemas.ai import Session
from schemas.agent_settings import AgentSetting, MCPParams
from services.exceptions import ColleagueHandoffException

from .chat_models.bedrock import get_bedrock_client
from .dummy import (
    DummyClientSession,
    dummy_load_mcp_tools,
    dummy_streamablehttp_client,
)
from .langfuse_utils import get_langfuse_config
from .llms import init_llm, BEDROCK_ARN_PATTERN, OPENAI_PATTERN
from .prompts.condense import get_condense_prompt
from .prompts.summary import get_summary_prompt
from .prompts.system import get_system_prompt
from .prompts.vision import get_vision_prompt
from .tools import colleague_handoff
from .utils import clean_ai_message

MAX_RECURSION_DEPTH = settings.MAX_RECURSION_DEPTH

logger = logging.getLogger(__name__)


def _extract_root_exception(
    exc: BaseExceptionGroup[Exception] | Exception,
) -> Exception:
    """Extract the root cause from potentially nested ExceptionGroups."""
    if isinstance(exc, BaseExceptionGroup):
        root_exc = exc.exceptions[0]
        return _extract_root_exception(root_exc)
    return exc


def get_llm(
    agent_settings: Optional[AgentSetting],
    model_name: Optional[str] = None,
    llm_type: str = "core",  # can be "core", "condense", or "vision"
) -> BaseChatModel:
    """Initialize the LLM based on provider settings and return the instance."""
    if not agent_settings:
        raise ValueError("Agent settings are required")

    # Get the appropriate LLM settings based on type
    llm_settings = None
    if llm_type == "core":
        llm_settings = agent_settings.core_llm
    elif llm_type == "condense":
        llm_settings = agent_settings.condense_llm
    elif llm_type == "vision":
        llm_settings = agent_settings.vision_llm
    else:
        raise ValueError(f"Invalid LLM type: {llm_type}")

    if not model_name and llm_settings:
        model_name = llm_settings.name

    if not model_name:
        raise ValueError("Model name not found")

    # Validate the model name
    if not validate_model_name(model_name):
        raise ValueError(f"Invalid model name: {model_name}")

    if llm_settings:
        if llm_settings.provider == "openai":
            if not llm_settings.api_key:
                raise ValueError("OpenAI API key not found in agent settings")

            return init_llm(
                client=None,
                model_name=model_name,
                api_key=llm_settings.api_key,
                base_url=llm_settings.api_base or None,
            )
        else:
            # Handle Bedrock case
            conversation_client = get_bedrock_client(
                llm_settings.aws_access_key_id or "",
                llm_settings.aws_secret_access_key or "",
                llm_settings.aws_region or "",
            )
            return init_llm(conversation_client, model_name)

    raise ValueError("Invalid agent settings configuration")


async def execute_conversation(  # noqa: C901 – long but clear
    agent_settings_or_llm: (
        AgentSetting | BaseChatModel | Runnable[LanguageModelInput, BaseMessage]
    ),
    conversation: List[BaseMessage],
    session: Session,
    behaviour: str,
    context: str,
    history_summaries: Optional[str] = None,
    mcp_server_params: Optional[MCPParams] = None,
    recursion_depth: int = 0,
) -> AsyncGenerator[AIMessage | BaseMessage | ToolMessage, None]:
    """
    Streams messages to the caller **incrementally** while ensuring
    AnyIO cancel-scopes are exited in the same task that entered them.
    """

    agent_settings = (
        agent_settings_or_llm
        if isinstance(agent_settings_or_llm, AgentSetting)
        else None
    )
    llm = agent_settings_or_llm if isinstance(agent_settings_or_llm, Runnable) else None
    mcp_server_params = (
        mcp_server_params
        if isinstance(mcp_server_params, MCPParams)
        else agent_settings.mcp_params
        if agent_settings
        else None
    )

    if recursion_depth >= MAX_RECURSION_DEPTH:
        raise ColleagueHandoffException(
            "Agent ran out of time. Please, take over the conversation."
        )

    langfuse_config = get_langfuse_config("conversation", session)

    if recursion_depth == 0:
        conversation = [
            SystemMessage(
                content=get_system_prompt(context, behaviour, history_summaries)
            )
        ] + conversation

    if not llm and agent_settings:
        llm = get_llm(agent_settings)
    if not llm:
        raise ValueError("LLM not found")

    if not mcp_server_params:
        active_streamablehttp_client = dummy_streamablehttp_client
        active_session = DummyClientSession
        active_tools_loader = dummy_load_mcp_tools
    else:
        active_streamablehttp_client = streamablehttp_client
        active_session = ClientSession
        active_tools_loader = load_mcp_tools

    async def _worker(send_stream: ObjectSendStream):
        """Runs in its own task; pushes every new message to `send_stream`."""
        nonlocal llm, conversation
        if not llm:
            raise ValueError("LLM not initialized")

        async with active_streamablehttp_client(
            url=mcp_server_params.sse_url if mcp_server_params else "",
            headers=mcp_server_params.sse_headers if mcp_server_params else {},
        ) as (read, write, _):
            async with active_session(read, write) as client_session:  # type: ignore
                await client_session.initialize()
                tools = await active_tools_loader(client_session)  # type: ignore

                # TODO: make colleague_handoff optional. Maybe another flag on the agent settings?
                tools.append(colleague_handoff)

                if isinstance(llm, BaseChatModel):
                    llm = llm.bind_tools(tools)

                # ---------- first agent reply ----------
                # This has been introduce as a hotfix for the bedrock -> mcp tools integration.
                # It's a workaround to remove the run_manager from the tool_calls.
                # TODO: Remove this once the tools integration is fixed (on Langchain side).
                cleaned_conv = [
                    clean_ai_message(m) if isinstance(m, AIMessage) else m
                    for m in conversation
                ]
                response = await llm.ainvoke(cleaned_conv, config=langfuse_config)

                # We retry because LLMs sometimes return an empty reponse content.
                if not response.content:
                    logger.warning("LLM returned an empty response. Retrying...")
                    response = await llm.ainvoke(cleaned_conv, config=langfuse_config)

                if isinstance(response.content, str):
                    response.content = [{"type": "text", "text": response.content}]
                conversation.append(response)
                await send_stream.send(response)

                # ---------- tool calls (if any) ----------
                if isinstance(response, AIMessage) and response.tool_calls:
                    for tc in response.tool_calls:
                        try:
                            tool = next(t for t in tools if t.name == tc["name"])
                            tool_reply = await tool.ainvoke(tc["args"])
                        except StopIteration:
                            logger.error(f"Tool {tc['name']} not found in tools list")
                            tool_reply = f"Tool ({tc['name']}): not found"
                        except ColleagueHandoffException:
                            raise
                        except Exception as exc:
                            tool_reply = f"Tool ({tc['name']}): {exc}"

                        tm = ToolMessage(
                            content=[{"type": "text", "text": tool_reply}],  # type: ignore  # noqa: E501
                            tool_call_id=tc["id"],
                            additional_kwargs={"tool_call_name": tc["name"]},
                        )
                        conversation.append(tm)
                        await send_stream.send(tm)

                    # ---------- second agent reply (recursive) ----------
                    async for msg in execute_conversation(
                        llm,
                        conversation,
                        session,
                        behaviour,
                        context,
                        history_summaries,
                        mcp_server_params,
                        recursion_depth + 1,
                    ):
                        await send_stream.send(msg)

        await send_stream.aclose()  # signals EOF to the receiver

    # ---------------------- supervisor / relay task --------------------------
    send, receive = anyio.create_memory_object_stream(20)

    async with anyio.create_task_group() as tg:
        tg.start_soon(_worker, send)  # worker lives *inside* TaskGroup
        async for message in receive:  # relay lives *outside* the scope
            yield message  # ← incremental streaming continues


async def execute_vision(
    conversation: List[BaseMessage],
    session: Session,
    agent_settings: AgentSetting,
) -> str:
    langfuse_config = get_langfuse_config("vision", session)

    # Use the vision LLM settings
    llm = get_llm(agent_settings, llm_type="vision")

    try:
        logger.info("Invoking Vision LLM...")
        messages = [SystemMessage(content=get_vision_prompt())] + conversation
        response = await llm.ainvoke(
            messages,
            config=langfuse_config,
        )
    except Exception as e:
        logger.error(f"Error invoking LLM: {e}")
        raise

    logger.info(f"Vision LLM response: {response}")
    content = response.content
    return content if isinstance(content, str) else ""


async def _format_conversation(
    conversation: List[BaseMessage],
    session: Session,
    agent_settings: AgentSetting,
    operation: str = "condense",
) -> List[str]:
    """
    Asynchronously formats a conversation into a list of speaker-prefixed strings.

    Depending on the operation, formats each message with appropriate speaker labels and handles messages containing images by either inserting a placeholder or invoking a vision model to convert images to text.
    """
    if not conversation:
        return [""]

    async def format_message(
        message: BaseMessage,
    ) -> str:
        """
        Formats a single conversation message as a string with appropriate speaker prefix.

        For messages containing multiple content items, text is included directly. Image URLs are replaced with a placeholder for summary operations or converted to text using a vision model for condense operations.
        """
        first_person = "A" if operation == "condense" else "User"
        second_person = "B" if operation == "condense" else "You (Assistant)"
        prefix = (
            f"{first_person}: "
            if isinstance(message, HumanMessage)
            else f"{second_person}: "
        )

        if isinstance(message.content, list):
            content = ""
            for item in message.content:
                if isinstance(item, dict):
                    if item.get("type") == "text":
                        content += f"{item['text']}\n"
                    elif item.get("type") == "image_url" and isinstance(
                        message, HumanMessage
                    ):
                        if operation == "summary":
                            # Use placeholder for summary operation
                            content += "[image]\n"
                        else:
                            # Use vision conversion for condense operation
                            content += f"{await execute_vision([message], session, agent_settings)}\n"
            return f"{prefix}{content.replace('\n', ' ')}" if content else ""
        else:
            return f"{prefix}{message.content.replace('\n', ' ')}"

    # Process all messages and join them with newlines
    formatted_messages = []
    for message in conversation:
        formatted = await format_message(message)
        if formatted:
            formatted_messages.append(formatted)
    return formatted_messages


async def execute_condense(
    conversation: List[BaseMessage],
    session: Session,
    # TODO: agent_settings is used just for the model name. Client depends on AgentSettings.
    # TODO: This should refactored and implemented in a more elegant way.
    agent_settings: AgentSetting,
) -> str:
    """Execute a conversation with the LLM and yield messages to be returned."""

    langfuse_config = get_langfuse_config("condense", session)

    # Use the main get_llm function with condense_llm settings
    llm = get_llm(
        agent_settings,
        model_name=(
            agent_settings.condense_llm.name if agent_settings.condense_llm else None
        ),
    )

    messages = await _format_conversation(conversation, session, agent_settings)
    chat_history = "\n".join(messages[:-1])
    follow_up_question = messages[-1].replace("B: ", "")

    try:
        logger.info("Invoking Condense LLM...")
        response = llm.invoke(
            [
                SystemMessage(
                    content=get_condense_prompt(chat_history, follow_up_question)
                ),
                HumanMessage(
                    content=(
                        "What is the standalone question? "
                        "Respond with the question only. "
                        "No comments or other text. "
                        "If only one question is present, respond with that question."
                        "If the user is asking multiple questions in their last message, respond with all of them."
                    )
                ),
            ],
            config=langfuse_config,
        )
    except Exception as e:
        logger.error(f"Error invoking LLM: {e}")
        raise

    logger.debug(f"Condense LLM response: {response}")
    content = response.content
    return content if isinstance(content, str) else ""


async def execute_summary(
    agent_settings: AgentSetting,
    conversation: List[BaseMessage],
    session: Session,
):
    langfuse_config = get_langfuse_config("summary", session)

    llm = get_llm(agent_settings, llm_type="condense")

    messages = await _format_conversation(
        conversation, session, agent_settings, operation="summary"
    )

    try:
        logger.info("Invoking Summary LLM...")
        response = llm.invoke(
            [
                SystemMessage(content=get_summary_prompt("\n".join(messages))),
                HumanMessage(
                    content=(
                        "Generate a detailed summary of the conversation. "
                        "Respond with the summary only. "
                        "No comments or other text. "
                        "Remember to generate it in English and to add the primary language of the conversation at the end of the summary."
                    )
                ),
            ],
            config=langfuse_config,
        )
    except Exception as e:
        logger.error(f"Error invoking LLM: {e}")
        raise

    logger.debug(f"Summary LLM response: {response}")
    content = response.content
    return content if isinstance(content, str) else ""


def validate_model_name(model_name: str) -> bool:
    """Validate the model name using regex patterns."""
    if BEDROCK_ARN_PATTERN.match(model_name):
        return True
    elif OPENAI_PATTERN.match(model_name):
        return True
    return False

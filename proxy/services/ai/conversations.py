import logging
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
from mcp.client.session import ClientSession
from mcp.client.sse import sse_client

from config import settings
from schemas.ai import Session
from schemas.agent_settings import AgentSetting, MCPParams
from services.exceptions import ColleagueHandoffException

from .chat_models.bedrock import get_bedrock_client
from .dummy import dummy_sse_client, DummyClientSession, dummy_load_mcp_tools
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


async def execute_conversation(
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
    """Execute a conversation with the LLM and yield messages asynchronously."""

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

    logger.debug(f"Executing conversation. Recursion depth: {recursion_depth}")

    if recursion_depth >= MAX_RECURSION_DEPTH:
        logger.warning(f"Max recursion depth reached: {recursion_depth}")
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
        active_sse_client = dummy_sse_client
        active_session = DummyClientSession
        active_tools_loader = dummy_load_mcp_tools
    else:
        active_sse_client = sse_client
        active_session = ClientSession
        active_tools_loader = load_mcp_tools

    try:
        async with active_sse_client(
            url=mcp_server_params.sse_url if mcp_server_params else ""
        ) as (read, write):
            async with active_session(read, write) as client_session:  # type: ignore
                await client_session.initialize()
                tools = await active_tools_loader(client_session)  # type: ignore

                # TODO: make colleague_handoff optional. Maybe another flag on the agent settings?
                tools.append(colleague_handoff)

                if isinstance(llm, BaseChatModel):
                    llm = llm.bind_tools(tools)

                try:
                    conversation = [
                        (
                            # This has been introduce as a hotfix for the bedrock -> mcp tools integration.
                            # It's a workaround to remove the run_manager from the tool_calls.
                            # TODO: Remove this once the tools integration is fixed (on Langchain side).
                            clean_ai_message(message)
                            if isinstance(message, AIMessage)
                            else message
                        )
                        for message in conversation
                    ]
                    response = await llm.ainvoke(
                        conversation,
                        config=langfuse_config,
                    )
                except Exception as e:
                    logger.error(f"Error invoking LLM: {e}")
                    raise
                # we retry because LLMs sometimes return empty response content
                if not response.content:
                    logger.warning("LLM response content is empty. Retrying...")
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
                        yield msg
                    return

                if isinstance(response.content, str):
                    response.content = [{"type": "text", "text": response.content}]
                conversation.append(response)
                yield response

                if isinstance(response, AIMessage) and response.tool_calls:
                    for tool_call in response.tool_calls:
                        try:
                            tool = next(t for t in tools if t.name == tool_call["name"])
                            response_text = await tool.ainvoke(tool_call["args"])
                        except StopIteration:
                            logger.error(
                                f"Tool {tool_call['name']} not found in tools list"
                            )
                            response_text = (
                                f"Tool ({tool_call['name']}): Error - tool not found"
                            )
                        except ColleagueHandoffException as e:
                            raise e
                        except Exception as e:
                            logger.warning(
                                f"Error invoking tool {tool_call['name']}: {e}"
                            )
                            response_text = (
                                f"Tool ({tool_call['name']}): Error invoking tool: {e}"
                            )

                        tool_message_content = [
                            {
                                "type": "text",
                                "text": response_text,
                            }
                        ]

                        tool_message = ToolMessage(
                            content=tool_message_content,  # type: ignore
                            tool_call_id=tool_call["id"],
                            additional_kwargs={"tool_call_name": tool_call["name"]},
                        )
                        conversation.append(tool_message)
                        yield tool_message

                    # Recursive call
                    logger.debug(
                        f"Making recursive call. Current depth: {recursion_depth}"
                    )
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
                        yield msg

    except* Exception as e:
        raise _extract_root_exception(e) from None


# TODO: make this async
def execute_vision(
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
        response = llm.invoke(
            messages,
            config=langfuse_config,
        )
    except Exception as e:
        logger.error(f"Error invoking LLM: {e}")
        raise

    logger.info(f"Vision LLM response: {response}")
    content = response.content
    return content if isinstance(content, str) else ""


def _format_conversation(
    conversation: List[BaseMessage],
    session: Session,
    agent_settings: AgentSetting,
    operation: str = "condense",
) -> List[str]:
    """Format conversation and return tuple of (previous_chat_history, last_message)"""
    if not conversation:
        return [""]

    def format_message(
        message: BaseMessage,
    ) -> str:
        """Helper function to format a single message"""
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
                        content += (
                            f"{execute_vision([message], session, agent_settings)}\n"
                        )
            return f"{prefix}{content.replace('\n', ' ')}" if content else ""
        else:
            return f"{prefix}{message.content.replace('\n', ' ')}"

    # Process all messages and join them with newlines
    return [
        msg
        for msg in (format_message(message) for message in conversation)
        if msg  # Filter out empty messages
    ]


# TODO: make this async
def execute_condense(
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
        model_name=agent_settings.condense_llm.name
        if agent_settings.condense_llm
        else None,
    )

    messages = _format_conversation(conversation, session, agent_settings)
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


def execute_summary(
    agent_settings: AgentSetting,
    conversation: List[BaseMessage],
    session: Session,
):
    langfuse_config = get_langfuse_config("summary", session)

    llm = get_llm(agent_settings, llm_type="condense")

    messages = _format_conversation(
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

import logging

from langchain_core.tools import tool

logger = logging.getLogger(__name__)


@tool
def colleague_handoff(english_query: str) -> str:
    """
    Use this tool to hand off the conversation to your colleague.

    Args:
        query: The query in english to hand off to your colleague.
    """
    return f"Tool (colleague handoff): {english_query}"

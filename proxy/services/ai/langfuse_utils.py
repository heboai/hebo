from functools import wraps
from typing import Any, Callable

from langchain_core.runnables.config import RunnableConfig
from langfuse import Langfuse
from langfuse.callback import CallbackHandler

from config import settings
from schemas.ai import Session

LANGFUSE_PUBLIC_KEY = settings.LANGFUSE_PUBLIC_KEY
LANGFUSE_SECRET_KEY = settings.LANGFUSE_SECRET_KEY
LANGFUSE_HOST = settings.LANGFUSE_HOST
TARGET_ENV = settings.TARGET_ENV

langfuse = Langfuse()

# Create a single global handler that will be reused across all sessions
GLOBAL_HANDLER = CallbackHandler(
    public_key=LANGFUSE_PUBLIC_KEY,
    secret_key=LANGFUSE_SECRET_KEY,
    host=LANGFUSE_HOST,
    trace_name="HeboConversation",
)

def get_langfuse_handler(session: Session) -> CallbackHandler:
    """Always reuse the same handler; attach session metadata dynamically."""
    GLOBAL_HANDLER.session_id = session.thread_id
    GLOBAL_HANDLER.user_id = session.contact_identifier
    GLOBAL_HANDLER.tags = [session.organization_id, session.agent_version]
    return GLOBAL_HANDLER


def get_langfuse_config(name: str, session: Session) -> RunnableConfig:
    return RunnableConfig(
        callbacks=[get_langfuse_handler(session)],
        run_id=session.trace_id,
        run_name=name,
    )


def trace(
    name: str = "embeddings", model: str = "voyage-multimodal-3", session=None
) -> Callable:
    """Decorator to trace embedding operations with langfuse.

    Args:
        name: Name of the generation trace
        model: Model name used for the embedding
        session: Optional session object containing trace_id for linking traces
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Pop 'session' from kwargs for the decorator's use
            session = kwargs.pop("session", None)
            # Use session from decorator if provided
            trace = (
                langfuse.trace(id=str(session.trace_id))
                if session
                else langfuse.trace(name="DocumentLoader", tags=[TARGET_ENV])
            )

            # Get inputs from first positional argument or kwargs
            inputs = kwargs.get("inputs") if "inputs" in kwargs else args[1]

            generation = trace.generation(
                name=name,
                model=model,
                model_metadata=kwargs,
                input=[
                    {"role": "user", "content": str(item)}
                    for sublist in (inputs or [])
                    for item in sublist
                    if isinstance(item, str)
                ],
            )

            try:
                result = func(*args, **kwargs)

                if hasattr(result, "text_tokens"):
                    generation.update(
                        usage={
                            "input": result.text_tokens,  # type: ignore
                            "input_cost": 0.00000012,
                        }
                    )

                return result

            except Exception as e:
                generation.update(
                    level="ERROR",
                    status_message=str(e),
                )
                raise
            finally:
                generation.end()

        return wrapper

    return decorator

import functools
import logging
from time import perf_counter
from typing import Callable, Awaitable, Any

logger = logging.getLogger(__name__)


def timeit(
    name: str | None = None,
) -> Callable[[Callable[..., Awaitable[Any]]], Callable[..., Awaitable[Any]]]:
    """
    Decorator that logs wall-clock execution time of an *async* function.
    Usage:
        @timeit()                     # logs func.__name__
        @timeit("open_thread")        # custom label
    """

    def wrapper(func: Callable[..., Awaitable[Any]]) -> Callable[..., Awaitable[Any]]:
        label = name or func.__name__

        @functools.wraps(func)
        async def timed(*args, **kwargs):  # noqa: ANN001
            t0 = perf_counter()
            try:
                return await func(*args, **kwargs)
            finally:
                elapsed = perf_counter() - t0
                logger.info("%s finished in %.3f s", label, elapsed)

        return timed

    return wrapper

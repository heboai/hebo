import asyncio
import logging
import signal
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from starlette.background import BackgroundTask

from auth.middleware import APIKeyMiddleware
from config import settings
from db.database import wait_for_database_connection
from schemas.knowledge import CreateVectorRequest, CreateVectorResponse
from schemas.responses import Error, Response, ResponseRequest
from schemas.server import HealthResponse
from schemas.threads import (
    AddMessageRequest,
    AddMessageResponse,
    CloseThreadRequest,
    CloseThreadResponse,
    CreateThreadRequest,
    CreateThreadResponse,
    RemoveMessageResponse,
    RunRequest,
)
from services import HEBO
from services.middleware import (
    MaxBodySizeMiddleware,
    TaskTracker,
    TaskTrackerMiddleware,
)
from services.response_manager import ResponseManager
from services.thread_manager import ThreadManager
from services.utils import timeit
from services.vector_manager import VectorManager

from __version__ import __version__


logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def graceful_shutdown(app: FastAPI):
    logger.info("Initiating graceful shutdown...")
    logger.info("Ensuring all pending runs are completed...")
    await app.state.task_tracker.wait_for_tasks(timeout=120)
    logger.info("Closing database connections...")
    await app.state.db_pool.close()
    logger.info("Shutdown complete")


def handle_shutdown_signal(sig, frame):
    logger.info(f"Received shutdown signal: {sig}")
    global app
    asyncio.create_task(graceful_shutdown(app))


async def create_db_pool():
    db_pool = await asyncpg.create_pool(
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        database=settings.POSTGRES_DB,
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
    )
    if db_pool:
        async with db_pool.acquire() as db_conn:
            await wait_for_database_connection(db_conn)
        return db_pool

    raise Exception("Failed to create database pool")


# This is applicable for expensive operations such as db connection pool, ML models..
# that needed to be loaded once and shared between requests
# refer to https://fastapi.tiangolo.com/advanced/events/#async-context-manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load shared data
    app.state.db_pool = await create_db_pool()
    app.state.task_tracker = TaskTracker()

    # Set up signal handlers for graceful shutdown
    for sig in (signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, handle_shutdown_signal)

    logger.info(HEBO)
    logger.info("Application startup complete v%s", __version__)

    try:
        yield
    finally:
        logger.info("Lifespan context manager is closing")
        await graceful_shutdown(app)


app = FastAPI(
    title="hebo - proxy",
    description="hebo - proxy",
    version=__version__,
    lifespan=lifespan,
)

# Configure CORS based on environment
origins = []
if settings.TARGET_ENV != "prod":
    # Allow all origins in non-production environments
    origins = ["*"]
elif settings.ADDITIONAL_CORS_ORIGINS:
    # Add any additional allowed origins from environment settings
    origins.extend(settings.ADDITIONAL_CORS_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(APIKeyMiddleware)
app.add_middleware(TaskTrackerMiddleware)
app.add_middleware(MaxBodySizeMiddleware, max_size=3 * 1024 * 1024)  # 3MB limit


@app.get("/health", response_model=HealthResponse, tags=["monitoring"])
async def health_check(request: Request):
    """Check the health of the application and its dependencies."""
    try:
        # Test database connection
        async with app.state.db_pool.acquire() as conn:
            await conn.execute("SELECT 1")
            db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        db_status = "unhealthy"
        raise HTTPException(status_code=503, detail="Database connection failed")

    return HealthResponse(status="healthy", version=__version__, database=db_status)


@app.post("/vector", response_model=CreateVectorResponse)
@timeit("create_vector")
async def create_vector(request: CreateVectorRequest, req: Request):
    """Create a new vector"""
    organization_id = req.state.organization["id"]
    logger.info("Creating vector for organization %s", organization_id)

    # Create DB instance for this request
    async with app.state.db_pool.acquire() as conn:
        vector_manager = VectorManager(conn)

        # Create vector
        vector = await vector_manager.create_vector(request, organization_id)

        return vector


@app.post("/threads", response_model=CreateThreadResponse)
@timeit("create_thread")
async def create_thread(request: CreateThreadRequest, req: Request):
    """Create a new thread"""
    organization_id = req.state.organization["id"]
    logger.info("Creating thread for organization %s", organization_id)

    # Create DB instance for this request
    async with app.state.db_pool.acquire() as conn:
        thread_manager = ThreadManager(conn)

        # Create thread
        thread = await thread_manager.create_thread(request, organization_id)

        return CreateThreadResponse(
            thread_id=thread.id,
            contact_name=thread.contact_name,
            contact_identifier=thread.contact_identifier,
            is_open=thread.is_open,
        )


@app.post("/threads/{thread_id}/close", response_model=CloseThreadResponse)
@timeit("close_thread")
async def close_thread(request: CloseThreadRequest, req: Request, thread_id: int):
    """Close a thread"""
    organization_id = req.state.organization["id"]
    logger.info("Closing thread %s for organization %s", thread_id, organization_id)

    agent_version = request.agent_version

    async with app.state.db_pool.acquire() as conn:
        thread_manager = ThreadManager(conn)

        # Close thread
        thread, summary = await thread_manager.close_thread(
            thread_id, organization_id, agent_version
        )

        if not thread or not thread.id:
            raise HTTPException(status_code=404, detail="Thread not found")

        return CloseThreadResponse(
            thread_id=thread.id,
            is_open=thread.is_open,
            summary=summary,
        )


@app.post(
    "/threads/{thread_id}/messages",
    response_model=AddMessageResponse,
    response_model_exclude_none=True,
)
@timeit("add_message")
async def add_message(request: AddMessageRequest, req: Request, thread_id: int):
    organization = req.state.organization
    async with app.state.db_pool.acquire() as conn:
        thread_manager = ThreadManager(conn)
        message = await thread_manager.add_message(
            request, thread_id, organization["id"]
        )
        return AddMessageResponse(
            id=message.id, message_type=message.message_type, content=message.content
        )


@app.post(
    "/threads/{thread_id}/messages/{message_id}/remove",
    response_model=RemoveMessageResponse,
)
@timeit("remove_message")
async def remove_message(message_id: int, req: Request, thread_id: int):
    organization = req.state.organization
    async with app.state.db_pool.acquire() as conn:
        thread_manager = ThreadManager(conn)
        message_id = await thread_manager.remove_message(
            message_id, thread_id, organization["id"]
        )
        return RemoveMessageResponse(message_id=message_id)


@app.post("/threads/{thread_id}/run")
async def run(request: RunRequest, req: Request, thread_id: int):
    """Run the agent.

    The connection will be held open until the streaming is complete.
    """
    organization = req.state.organization
    # Create a connection that will be held open for the entire stream
    conn = await app.state.db_pool.acquire()

    async def cleanup_connection():
        await app.state.db_pool.release(conn)
        logger.info("Database connection released after stream completion")

    try:
        thread_manager = ThreadManager(conn)
        return StreamingResponse(
            thread_manager.run_thread(request, thread_id, organization["id"]),
            media_type="text/event-stream",
            background=BackgroundTask(cleanup_connection),
        )
    except Exception as e:
        await cleanup_connection()
        raise e


@app.post("/responses", response_model=Response)
@timeit("create_response")
async def create_response(request: ResponseRequest, req: Request):
    """Create a new response"""
    organization_id = req.state.organization["id"]
    logger.info("Creating response for organization %s", organization_id)

    # Validate unsupported parameters
    unsupported_params = {
        "max_output_tokens": request.max_output_tokens is not None,
        "temperature": request.temperature != 1.0,
        "top_p": request.top_p != 1.0,
        "n": request.n != 1,
        "stop": request.stop is not None,
        "presence_penalty": request.presence_penalty != 0.0,
        "frequency_penalty": request.frequency_penalty != 0.0,
        "logit_bias": request.logit_bias is not None,
        "logprobs": request.logprobs is not None,
        "tool_choice": request.tool_choice is not None,
        "tools": request.tools is not None,
        "parallel_tool_calls": request.parallel_tool_calls,
        "truncation": request.truncation != "disabled",
        "include": request.include is not None,
        "reasoning": request.reasoning is not None,
        "stream": request.stream,
    }

    for param, is_unsupported in unsupported_params.items():
        if is_unsupported:
            raise HTTPException(
                status_code=400,
                detail=Error(
                    message=f"Unsupported parameter '{param}'. This API currently does not support setting the '{param}' parameter.",
                    type="invalid_request_error",
                    param=param,
                    code="unsupported_parameter",
                ),
            )

    # Create DB instance for this request
    async with app.state.db_pool.acquire() as conn:
        response_manager = ResponseManager(conn)
        return await response_manager.create_response(request, organization_id)

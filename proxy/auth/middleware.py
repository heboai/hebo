from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from datetime import datetime


class APIKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for preflight requests.
        if request.method == "OPTIONS":
            return await call_next(request)

        # Skip authentication for health check endpoints if needed
        if request.url.path == "/health":
            return await call_next(request)

        # Get API key from various sources
        api_key = request.headers.get("X-API-Key") or request.query_params.get(
            "api_key"
        )

        # Handle Authorization header with Bearer token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            api_key = auth_header.replace("Bearer ", "")
        elif auth_header:
            api_key = auth_header

        if not api_key:
            return JSONResponse(
                status_code=403,
                content={"detail": "API key is required"},
            )

        # Get database connection from app state
        db_pool = request.app.state.db_pool
        async with db_pool.acquire() as conn:
            # Check API key and get organization
            query = """
                SELECT
                    ak.id as key_id,
                    ak.organization_id,
                    o.name as organization_name,
                    ak.is_active
                FROM api_keys_apikey ak
                JOIN hebo_organizations_organization o ON ak.organization_id = o.id
                WHERE ak.key = $1
            """
            row = await conn.fetchrow(query, api_key)

            if not row or not row["is_active"]:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Invalid or inactive API key"},
                )

            # Update last_used_at
            await conn.execute(
                """
                UPDATE api_keys_apikey
                SET last_used_at = $1
                WHERE id = $2
                """,
                datetime.now(),
                row["key_id"],
            )

            # Store organization in request state
            request.state.organization = {
                "id": row["organization_id"],
                "name": row["organization_name"],
            }

        return await call_next(request)

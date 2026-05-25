"""
Request/response logging middleware for observability and audit trails.
"""

import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("trust.gateway")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs method, path, status, duration, and correlation id per request."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        start = time.perf_counter()
        timestamp = datetime.now(timezone.utc).isoformat()
        logger.info(
            "request.start id=%s at=%s method=%s path=%s client=%s",
            request_id,
            timestamp,
            request.method,
            request.url.path,
            request.client.host if request.client else "unknown",
        )

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = (time.perf_counter() - start) * 1000
            logger.exception(
                "request.error id=%s method=%s path=%s duration_ms=%.2f",
                request_id,
                request.method,
                request.url.path,
                duration_ms,
            )
            raise

        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "request.end id=%s at=%s method=%s path=%s status=%s duration_ms=%.2f",
            request_id,
            datetime.now(timezone.utc).isoformat(),
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        response.headers["X-Request-Id"] = request_id
        return response

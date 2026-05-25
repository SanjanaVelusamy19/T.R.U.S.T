"""
Reject identical POST auth requests within a short window (double-submit guard).
"""

import hashlib
import logging
import time
from datetime import datetime, timezone
from typing import Callable

from fastapi import status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("trust.gateway.duplicate_guard")

_DEDUP_PATHS = frozenset({"/api/auth/register", "/api/auth/login"})
_DEDUP_WINDOW_SEC = 3.0
_recent_signatures: dict[str, float] = {}


def _prune_expired(now: float) -> None:
    expired = [key for key, seen_at in _recent_signatures.items() if now - seen_at > _DEDUP_WINDOW_SEC]
    for key in expired:
        _recent_signatures.pop(key, None)


def _request_signature(method: str, path: str, client: str, body: bytes) -> str:
    digest = hashlib.sha256(body).hexdigest() if body else ""
    return f"{method}:{path}:{client}:{digest}"


class DuplicateRequestGuardMiddleware(BaseHTTPMiddleware):
    """Block duplicate identical auth POSTs within a few seconds."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        method = request.method.upper()

        if method == "POST" and path in _DEDUP_PATHS:
            body = await request.body()

            async def receive() -> dict:
                return {"type": "http.request", "body": body, "more_body": False}

            request = Request(request.scope, receive)

            client = request.client.host if request.client else "unknown"
            now = time.time()
            _prune_expired(now)
            signature = _request_signature(method, path, client, body)

            seen_at = _recent_signatures.get(signature)
            if seen_at is not None and now - seen_at < _DEDUP_WINDOW_SEC:
                request_id = getattr(request.state, "request_id", None)
                logger.warning(
                    "request.duplicate_blocked id=%s method=%s path=%s at=%s",
                    request_id,
                    method,
                    path,
                    datetime.now(timezone.utc).isoformat(),
                )
                return JSONResponse(
                    status_code=status.HTTP_409_CONFLICT,
                    content={
                        "success": False,
                        "error": "duplicate_request",
                        "message": "Identical request was already received. Please wait.",
                    },
                )

            _recent_signatures[signature] = now

        return await call_next(request)

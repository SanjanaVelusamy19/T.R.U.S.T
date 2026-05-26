"""Shared CORS origin list and response header helpers."""

from starlette.requests import Request
from starlette.responses import Response

ALLOWED_ORIGINS: tuple[str, ...] = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "https://t-r-u-s-t.vercel.app",
    "https://www.t-r-u-s-t.vercel.app",
)


def _origin_allowed(origin: str | None) -> bool:
    if not origin:
        return False
    if origin in ALLOWED_ORIGINS:
        return True
    return origin.endswith(".vercel.app") and origin.startswith("https://")


def apply_cors_headers(request: Request, response: Response) -> Response:
    """Ensure browser clients receive CORS headers even on error responses."""
    origin = request.headers.get("origin")
    if _origin_allowed(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    return response

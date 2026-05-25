"""
Proxy routes for the Auth microservice (registration, login, token verification).
"""

import httpx
from fastapi import APIRouter, HTTPException, Request, Response, status

from utils.config import get_settings
from utils.limiter import limiter

router = APIRouter(
    prefix="/api/auth",
    tags=["auth-proxy"],
)

settings = get_settings()


async def _forward(request: Request, path: str) -> Response:
    """
    Forward incoming request to auth microservice.
    """

    base_url = settings.auth_service_url.rstrip("/")

    # IMPORTANT FIX
    url = f"{base_url}/api/auth{path}"

    body = await request.body()

    headers = {
        k: v
        for k, v in request.headers.items()
        if k.lower() not in {"host", "content-length"}
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:

            resp = await client.request(
                method=request.method,
                url=url,
                content=body if body else None,
                headers=headers,
                params=request.query_params,
            )

        return Response(
            content=resp.content,
            status_code=resp.status_code,
            media_type=resp.headers.get(
                "content-type",
                "application/json",
            ),
        )

    except httpx.RequestError as exc:

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Auth service unavailable: {str(exc)}",
        )


@router.api_route(
    "/register",
    methods=["POST", "OPTIONS"],
)
@limiter.limit(settings.rate_limit_default)
async def proxy_register(request: Request) -> Response:

    return await _forward(request, "/register")


@router.api_route(
    "/login",
    methods=["POST", "OPTIONS"],
)
@limiter.limit(settings.rate_limit_default)
async def proxy_login(request: Request) -> Response:

    return await _forward(request, "/login")


@router.api_route(
    "/verify-token",
    methods=["GET", "OPTIONS"],
)
@limiter.limit(settings.rate_limit_default)
async def proxy_verify_token(request: Request) -> Response:

    return await _forward(request, "/verify-token")
"""
Proxy routes for the Auth microservice (registration, login, token verification).
"""

import httpx
from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from utils.config import get_settings
from utils.limiter import limiter

router = APIRouter(
    prefix="/api/auth",
    tags=["auth-proxy"],
)

settings = get_settings()


async def _forward(request: Request, path: str) -> Response:

    base_url = settings.auth_service_url.rstrip("/")

    url = f"{base_url}{path}"

    try:
        body = await request.json()
    except Exception:
        body = None

    headers = {
        "content-type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:

            resp = await client.request(
                method=request.method,
                url=url,
                json=body,
                headers=headers,
                params=request.query_params,
            )

        return JSONResponse(
            status_code=resp.status_code,
            content=resp.json(),
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
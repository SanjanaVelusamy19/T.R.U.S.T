import logging
"""
Proxy routes for the Auth microservice
(registration, login, token verification).
"""

import httpx

logger = logging.getLogger("trust.gateway.auth")

from fastapi import (
    APIRouter,
    HTTPException,
    Request,
    status,
)

from pydantic import BaseModel
from fastapi.responses import JSONResponse

from utils.config import get_settings
from utils.limiter import limiter
from utils.proxy_response import downstream_json_response

router = APIRouter(
    prefix="/api/auth",
    tags=["auth-proxy"],
)

settings = get_settings()


# =========================================================
# REQUEST SCHEMAS
# =========================================================

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


# =========================================================
# FORWARD FUNCTION
# =========================================================

async def _forward(
    request: Request,
    path: str,
    body: dict | None = None,
) -> JSONResponse:

    base_url = settings.auth_service_url.rstrip("/")

    url = f"{base_url}{path}"
    logger.info("Proxy request downstream_url=%s method=%s", url, request.method)

    if body is None:
        try:
            body = await request.json()
        except Exception:
            body = None

    headers = {}

    auth_header = request.headers.get("authorization")

    if auth_header:
        headers["authorization"] = auth_header

    try:

        kwargs = {
            "method": request.method,
            "url": url,
            "headers": headers,
            "params": request.query_params,
        }

        if body is not None:
            kwargs["json"] = body

        async with httpx.AsyncClient(timeout=30.0) as client:

            resp = await client.request(**kwargs)

        return downstream_json_response(resp, downstream_url=url)

    except httpx.RequestError as exc:
        logger.error("Proxy FAILURE downstream_url=%s error=%s", url, str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Auth service unavailable: {str(exc)}",
        )


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
@limiter.limit(settings.rate_limit_default)
async def proxy_register(
    payload: RegisterRequest,
    request: Request,
) -> JSONResponse:

    return await _forward(
        request,
        "/register",
        body=payload.model_dump(),
    )


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
@limiter.limit(settings.rate_limit_default)
async def proxy_login(
    payload: LoginRequest,
    request: Request,
) -> JSONResponse:

    return await _forward(
        request,
        "/login",
        body=payload.model_dump(),
    )


# =========================================================
# VERIFY TOKEN
# =========================================================

@router.get("/verify-token")
@limiter.limit(settings.rate_limit_default)
async def proxy_verify_token(
    request: Request,
) -> JSONResponse:

    return await _forward(
        request,
        "/verify-token",
    )

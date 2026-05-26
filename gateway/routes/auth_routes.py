"""
Proxy routes for the Auth microservice
(registration, login, token verification).
"""

import logging

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from utils.config import get_settings
from utils.limiter import limiter
from utils.proxy_response import proxy_downstream_request

router = APIRouter(
    prefix="/api/auth",
    tags=["auth-proxy"],
)

settings = get_settings()
logger = logging.getLogger("trust.gateway.auth")


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


async def _forward(
    request: Request,
    path: str,
    body: dict | None = None,
) -> JSONResponse:
    return await proxy_downstream_request(
        request,
        base_url=settings.auth_service_url,
        downstream_path=path,
        log=logger,
        json_body=body,
    )


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


@router.get("/verify-token")
@limiter.limit(settings.rate_limit_default)
async def proxy_verify_token(
    request: Request,
) -> JSONResponse:
    return await _forward(
        request,
        "/verify-token",
    )

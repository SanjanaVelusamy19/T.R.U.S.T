"""
Proxy routes for the Auth microservice
(registration, login, token verification).
"""

import logging

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field

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
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def _normalize_auth_body(body: dict) -> dict:
    normalized = dict(body)
    if "email" in normalized and isinstance(normalized["email"], str):
        normalized["email"] = normalized["email"].lower().strip()
    if "full_name" in normalized and isinstance(normalized["full_name"], str):
        normalized["full_name"] = normalized["full_name"].strip()
    return normalized


async def _forward(
    request: Request,
    path: str,
    body: dict | None = None,
) -> JSONResponse:
    payload = _normalize_auth_body(body) if body is not None else None
    return await proxy_downstream_request(
        request,
        base_url=settings.auth_service_url,
        downstream_path=path,
        log=logger,
        json_body=payload,
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

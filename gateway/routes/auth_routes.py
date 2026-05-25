"""
Proxy routes for the Auth microservice
(registration, login, token verification).
"""

import httpx

from fastapi import (
    APIRouter,
    HTTPException,
    Request,
    Response,
    status,
)

from fastapi.responses import JSONResponse

from pydantic import BaseModel

from utils.config import get_settings
from utils.limiter import limiter


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
) -> Response:

    base_url = settings.auth_service_url.rstrip("/")

    # auth-service routes:
    # /register
    # /login
    # /verify-token

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

        try:
            response_content = resp.json()
        except Exception:
            response_content = {
                "success": False,
                "message": resp.text,
            }

        return JSONResponse(
            status_code=resp.status_code,
            content=response_content,
        )

    except httpx.RequestError as exc:

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
) -> Response:

    return await _forward(
        request,
        "/register",
    )


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
@limiter.limit(settings.rate_limit_default)
async def proxy_login(
    payload: LoginRequest,
    request: Request,
) -> Response:

    return await _forward(
        request,
        "/login",
    )


# =========================================================
# VERIFY TOKEN
# =========================================================

@router.get("/verify-token")
@limiter.limit(settings.rate_limit_default)
async def proxy_verify_token(
    request: Request,
) -> Response:

    return await _forward(
        request,
        "/verify-token",
    )
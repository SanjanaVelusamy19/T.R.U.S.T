"""
TRUST API Gateway — single entry point for the TRUST fintech platform.

Responsibilities:
- Route requests to downstream microservices
- JWT verification
- Rate limiting
- Structured logging
- Centralized error handling
"""

import logging
import sys
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from middleware.logging_middleware import RequestLoggingMiddleware
from routes import (
    advisor_routes,
    auth_routes,
    fraud_routes,
    gold_loan_routes,
    loan_routes,
    monitoring_routes,
    trust_routes,
    twin_routes,
)
from utils.config import get_settings
from utils.limiter import limiter

# =========================================================
# LOGGING
# =========================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("trust.gateway")

# =========================================================
# SETTINGS
# =========================================================

settings = get_settings()

# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Enterprise API Gateway for TRUST microservices.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# =========================================================
# RATE LIMITER
# =========================================================

app.state.limiter = limiter

# =========================================================
# CORS CONFIGURATION
# IMPORTANT: MUST BE FIRST MIDDLEWARE
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://t-r-u-s-t.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# CUSTOM MIDDLEWARES
# =========================================================

app.add_middleware(RequestLoggingMiddleware)

# SlowAPI MUST BE LAST
app.add_middleware(SlowAPIMiddleware)

# =========================================================
# RATE LIMIT HANDLER
# =========================================================

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(
    request: Request,
    exc: RateLimitExceeded,
) -> JSONResponse:

    response = _rate_limit_exceeded_handler(request, exc)

    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "error": "rate_limit_exceeded",
            "message": str(exc),
        },
    )

# =========================================================
# HTTP ERROR HANDLER
# =========================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request,
    exc: HTTPException,
) -> JSONResponse:

    request_id = getattr(request.state, "request_id", None)

    detail = exc.detail
    message = detail if isinstance(detail, str) else "Request failed"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": "http_error",
            "message": message,
            "detail": detail,
            "request_id": request_id,
        },
    )

# =========================================================
# VALIDATION ERROR HANDLER
# =========================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "validation_error",
            "message": "Request validation failed",
            "detail": exc.errors(),
        },
    )

# =========================================================
# GLOBAL ERROR HANDLER
# =========================================================

@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:

    request_id = getattr(request.state, "request_id", None)

    logger.exception(
        "Unhandled error path=%s id=%s",
        request.url.path,
        request_id,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "internal_server_error",
            "message": "An unexpected error occurred.",
            "request_id": request_id,
        },
    )

# =========================================================
# ROUTES
# =========================================================

app.include_router(auth_routes.router)
app.include_router(loan_routes.router)
app.include_router(trust_routes.router)
app.include_router(advisor_routes.router)
app.include_router(fraud_routes.router)
app.include_router(twin_routes.router)
app.include_router(monitoring_routes.router)
app.include_router(gold_loan_routes.router)

# =========================================================
# HEALTH ENDPOINTS
# =========================================================

@app.get("/health", tags=["health"])
async def health() -> dict[str, Any]:

    return {
        "status": "healthy",
        "service": "gateway",
    }

@app.get("/", tags=["health"])
async def root() -> dict[str, str]:

    return {
        "service": settings.app_name,
        "docs": "/docs",
    }
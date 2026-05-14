"""
TRUST API Gateway — single entry point for the TRUST fintech platform.

Responsibilities:
- Route /api/auth/* and /api/loan/* to downstream microservices
- Verify JWT for protected loan routes
- Apply rate limiting (SlowAPI)
- Structured request logging
- Centralized error responses
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
from routes import auth_routes, loan_routes
from utils.config import get_settings
from utils.limiter import limiter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("trust.gateway")

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Enterprise API Gateway for TRUST microservices.",
    docs_url="/docs",
    redoc_url="/redoc",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request,
    exc: HTTPException,
) -> JSONResponse:
    """Normalize HTTP errors raised by gateway dependencies and filters."""
    request_id = getattr(request.state, "request_id", None)
    detail = exc.detail
    message = detail if isinstance(detail, str) else "Request could not be completed"
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


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Normalize validation errors to a stable JSON shape for clients."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "validation_error",
            "detail": exc.errors(),
            "message": "Request validation failed",
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler to avoid leaking internals while returning a trace id."""
    request_id = getattr(request.state, "request_id", None)
    logger.exception("Unhandled error path=%s id=%s", request.url.path, request_id)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "internal_server_error",
            "message": "An unexpected error occurred. Please try again later.",
            "request_id": request_id,
        },
    )


app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(loan_routes.router)


@app.get("/health", tags=["health"])
async def health() -> dict[str, Any]:
    """Liveness probe for orchestrators and load balancers."""
    return {"status": "healthy", "service": "gateway"}


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    return {"service": settings.app_name, "docs": "/docs"}

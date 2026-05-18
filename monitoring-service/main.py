"""
TRUST Monitoring Service — standalone system metrics microservice.
"""

import logging
import sys

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import MetricsResponse, ServicesStatusResponse, SystemStatusResponse
from monitor_engine import (
    build_metrics_response,
    build_services_status_response,
    build_system_status_response,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("trust.monitor")

app = FastAPI(
    title="TRUST Monitoring Service",
    version="1.0.0",
    description="Standalone CPU, RAM, disk, and process monitoring for TRUST.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
            "detail": exc.errors(),
            "message": "Request validation failed",
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error path=%s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "internal_server_error",
            "message": "Monitoring service encountered an unexpected error",
        },
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "monitoring-service"}


@app.get("/metrics", response_model=MetricsResponse)
def metrics() -> MetricsResponse:
    """CPU, RAM, disk, and top process statistics."""
    result = build_metrics_response()
    logger.info(
        "monitor.metrics cpu=%s mem=%s disk=%s processes=%s",
        result.cpu.percent,
        result.memory.percent,
        result.disk.percent,
        result.process_count,
    )
    return result


@app.get("/system-status", response_model=SystemStatusResponse)
def system_status() -> SystemStatusResponse:
    """Aggregated system health summary."""
    return build_system_status_response()


@app.get("/services-status", response_model=ServicesStatusResponse)
def services_status() -> ServicesStatusResponse:
    """Status of monitored resource domains."""
    return build_services_status_response()

"""
TRUST Self-Healing Monitoring — observable, resilient infrastructure intelligence.
"""

import logging
import sys

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import (
    HealthHistoryResponse,
    LatencyResponse,
    MonitorAlertsResponse,
    ServicesResponse,
    SystemHealthResponse,
)
from monitor_engine import (
    build_alerts_response,
    build_health_history_response,
    build_latency_response,
    build_services_response,
    collect_ecosystem_health,
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
    description="Self-healing ecosystem observability for the TRUST fintech platform.",
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


@app.get("/monitor/system-health", response_model=SystemHealthResponse)
async def system_health() -> SystemHealthResponse:
    """Full ecosystem health dashboard snapshot."""
    result = await collect_ecosystem_health()
    logger.info(
        "monitor.system_health status=%s healthy=%s/%s latency_gateway=%s",
        result.system_status,
        result.healthy_services,
        result.active_services,
        result.gateway_latency_ms,
    )
    return result


@app.get("/monitor/services", response_model=ServicesResponse)
async def monitor_services() -> ServicesResponse:
    return await build_services_response()


@app.get("/monitor/alerts", response_model=MonitorAlertsResponse)
async def monitor_alerts() -> MonitorAlertsResponse:
    return await build_alerts_response()


@app.get("/monitor/latency", response_model=LatencyResponse)
async def monitor_latency() -> LatencyResponse:
    return await build_latency_response()


@app.get("/monitor/health-history", response_model=HealthHistoryResponse)
async def monitor_health_history() -> HealthHistoryResponse:
    return await build_health_history_response()

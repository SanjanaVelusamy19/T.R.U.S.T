"""
Protected proxy routes for the Monitoring microservice.
JWT is verified at the gateway before forwarding.

Downstream monitoring-service routes (see monitoring-service/main.py):
  GET /metrics
  GET /system-status
  GET /services-status
"""

import logging

from fastapi import APIRouter, Depends, Request, Response

from middleware.jwt_middleware import require_jwt
from utils.config import get_settings
from utils.limiter import limiter
from utils.proxy_response import proxy_downstream_request

router = APIRouter(prefix="/api/monitoring", tags=["monitoring-proxy"])

settings = get_settings()
logger = logging.getLogger("trust.gateway.monitoring")


async def _proxy_to_monitoring_service(request: Request, downstream_path: str) -> Response:
    return await proxy_downstream_request(
        request,
        base_url=settings.monitoring_service_url,
        downstream_path=downstream_path,
        log=logger,
    )


@router.get("/metrics")
@limiter.limit(settings.rate_limit_default)
async def proxy_monitoring_metrics(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_monitoring_service(request, "/metrics")


@router.get("/system-status")
@limiter.limit(settings.rate_limit_default)
async def proxy_monitoring_system_status(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_monitoring_service(request, "/system-status")


@router.get("/services-status")
@limiter.limit(settings.rate_limit_default)
async def proxy_monitoring_services_status(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_monitoring_service(request, "/services-status")

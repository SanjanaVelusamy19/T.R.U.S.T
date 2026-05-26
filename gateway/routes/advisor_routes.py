"""
Protected proxy routes for the AI Financial Advisor microservice.
JWT is verified at the gateway before forwarding.

Downstream advisor-service routes (see advisor-service/main.py):
  GET /advisor/summary
  GET /advisor/recommendations
  GET /advisor/risk-analysis
  GET /advisor/financial-health
"""

import logging

from fastapi import APIRouter, Depends, Request, Response

from middleware.jwt_middleware import require_jwt
from utils.config import get_settings
from utils.limiter import limiter
from utils.proxy_response import proxy_downstream_request

router = APIRouter(prefix="/api/advisor", tags=["advisor-proxy"])

settings = get_settings()
logger = logging.getLogger("trust.gateway.advisor")

# Exact path prefix on advisor-service (not the gateway /api/advisor prefix).
_ADVISOR_SERVICE_PREFIX = "/advisor"


def _advisor_downstream_path(route_suffix: str) -> str:
    """Map gateway /api/advisor/<suffix> to downstream /advisor/<suffix>."""
    suffix = route_suffix.lstrip("/")
    return f"{_ADVISOR_SERVICE_PREFIX}/{suffix}"


async def _proxy_to_advisor_service(request: Request, route_suffix: str) -> Response:
    downstream_path = _advisor_downstream_path(route_suffix)
    return await proxy_downstream_request(
        request,
        base_url=settings.advisor_service_url,
        downstream_path=downstream_path,
        log=logger,
    )


@router.get("/summary")
@limiter.limit(settings.rate_limit_default)
async def proxy_advisor_summary(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_advisor_service(request, "summary")


@router.get("/recommendations")
@limiter.limit(settings.rate_limit_default)
async def proxy_advisor_recommendations(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_advisor_service(request, "recommendations")


@router.get("/risk-analysis")
@limiter.limit(settings.rate_limit_default)
async def proxy_advisor_risk_analysis(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_advisor_service(request, "risk-analysis")


@router.get("/financial-health")
@limiter.limit(settings.rate_limit_default)
async def proxy_advisor_financial_health(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_advisor_service(request, "financial-health")


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@limiter.limit(settings.rate_limit_default)
async def proxy_advisor_catch_all(
    request: Request,
    path: str,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_advisor_service(request, path)

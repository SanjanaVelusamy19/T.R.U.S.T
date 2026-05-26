"""
Protected proxy routes for the Financial Digital Twin microservice.
JWT is verified at the gateway before forwarding.

Downstream digital-twin-service routes (see digital-twin-service/main.py):
  GET /twin/forecast, /twin/trust-projection, /twin/risk-simulation, etc.
"""

import logging

from fastapi import APIRouter, Depends, Request, Response

from middleware.jwt_middleware import require_jwt
from utils.config import get_settings
from utils.limiter import limiter
from utils.proxy_response import proxy_downstream_request

router = APIRouter(prefix="/api/twin", tags=["twin-proxy"])

settings = get_settings()
logger = logging.getLogger("trust.gateway.twin")

_TWIN_SERVICE_PREFIX = "/twin"


def _twin_downstream_path(route_suffix: str) -> str:
    suffix = route_suffix.lstrip("/")
    return f"{_TWIN_SERVICE_PREFIX}/{suffix}"


async def _proxy_to_twin_service(request: Request, route_suffix: str) -> Response:
    return await proxy_downstream_request(
        request,
        base_url=settings.digital_twin_service_url,
        downstream_path=_twin_downstream_path(route_suffix),
        log=logger,
    )


@router.get("/forecast")
@limiter.limit(settings.rate_limit_default)
async def proxy_twin_forecast(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_twin_service(request, "forecast")


@router.get("/trust-projection")
@limiter.limit(settings.rate_limit_default)
async def proxy_twin_trust_projection(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_twin_service(request, "trust-projection")


@router.get("/risk-simulation")
@limiter.limit(settings.rate_limit_default)
async def proxy_twin_risk_simulation(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_twin_service(request, "risk-simulation")


@router.get("/savings-growth")
@limiter.limit(settings.rate_limit_default)
async def proxy_twin_savings_growth(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_twin_service(request, "savings-growth")


@router.get("/scenarios")
@limiter.limit(settings.rate_limit_default)
async def proxy_twin_scenarios(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_twin_service(request, "scenarios")


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@limiter.limit(settings.rate_limit_default)
async def proxy_twin_catch_all(
    request: Request,
    path: str,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_twin_service(request, path)

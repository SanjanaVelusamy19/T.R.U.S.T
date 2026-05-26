"""
Protected proxy routes for the Trust Score microservice.
JWT is verified at the gateway before forwarding.
"""

import logging

from fastapi import APIRouter, Depends, Request, Response

from middleware.jwt_middleware import require_jwt
from utils.config import get_settings
from utils.limiter import limiter
from utils.proxy_response import proxy_downstream_request

router = APIRouter(prefix="/api/trust", tags=["trust-proxy"])

settings = get_settings()
logger = logging.getLogger("trust.gateway.trust")


async def _proxy_to_trust_service(request: Request, downstream_path: str) -> Response:
    return await proxy_downstream_request(
        request,
        base_url=settings.trust_score_service_url,
        downstream_path=downstream_path,
        log=logger,
    )


@router.api_route("/calculate", methods=["POST"])
@limiter.limit(settings.rate_limit_default)
async def proxy_calculate_trust(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    """Forward TRUST index calculation; requires valid JWT."""
    return await _proxy_to_trust_service(request, "/calculate")


@router.get("/analytics/timeline")
@limiter.limit(settings.rate_limit_default)
async def proxy_trust_timeline(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    """Forward trust timeline analytics; requires valid JWT."""
    return await _proxy_to_trust_service(request, "/analytics/timeline")


@router.get("/analytics/dashboard")
@limiter.limit(settings.rate_limit_default)
async def proxy_trust_dashboard(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    """Forward full trust graph dashboard payload; requires valid JWT."""
    return await _proxy_to_trust_service(request, "/analytics/dashboard")


@router.get("/score")
@limiter.limit(settings.rate_limit_default)
async def proxy_trust_score(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    """Forward trust score endpoint; requires valid JWT."""
    return await _proxy_to_trust_service(request, "/score")


@router.get("/history")
@limiter.limit(settings.rate_limit_default)
async def proxy_trust_history(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    """Forward trust history endpoint; requires valid JWT."""
    return await _proxy_to_trust_service(request, "/history")


@router.get("/analytics")
@limiter.limit(settings.rate_limit_default)
async def proxy_trust_analytics(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    """Forward generic analytics endpoint; requires valid JWT."""
    return await _proxy_to_trust_service(request, "/analytics")


@router.get("/recommendations")
@limiter.limit(settings.rate_limit_default)
async def proxy_trust_recommendations(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    """Forward trust recommendations endpoint; requires valid JWT."""
    return await _proxy_to_trust_service(request, "/recommendations")


@router.get("/radar")
@limiter.limit(settings.rate_limit_default)
async def proxy_trust_radar(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    """Forward trust radar endpoint; requires valid JWT."""
    return await _proxy_to_trust_service(request, "/radar")


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@limiter.limit(settings.rate_limit_default)
async def proxy_trust_catch_all(
    request: Request,
    path: str,
    _claims: dict = Depends(require_jwt),
) -> Response:
    """Forward additional trust service paths under /api/trust/*."""
    return await _proxy_to_trust_service(request, f"/{path}")

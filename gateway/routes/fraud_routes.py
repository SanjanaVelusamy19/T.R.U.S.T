"""
Protected proxy routes for the Behavioral Fraud Detection microservice.
JWT is verified at the gateway before forwarding.

Downstream fraud-detection-service routes (see fraud-detection-service/main.py):
  GET /fraud/analysis, /fraud/alerts, /fraud/risk-score, /fraud/behavior-check
"""

import logging

from fastapi import APIRouter, Depends, Request, Response

from middleware.jwt_middleware import require_jwt
from utils.config import get_settings
from utils.limiter import limiter
from utils.proxy_response import proxy_downstream_request

router = APIRouter(prefix="/api/fraud", tags=["fraud-proxy"])

settings = get_settings()
logger = logging.getLogger("trust.gateway.fraud")

_FRAUD_SERVICE_PREFIX = "/fraud"


def _fraud_downstream_path(route_suffix: str) -> str:
    suffix = route_suffix.lstrip("/")
    return f"{_FRAUD_SERVICE_PREFIX}/{suffix}"


async def _proxy_to_fraud_service(request: Request, route_suffix: str) -> Response:
    return await proxy_downstream_request(
        request,
        base_url=settings.fraud_detection_service_url,
        downstream_path=_fraud_downstream_path(route_suffix),
        log=logger,
    )


@router.get("/analysis")
@limiter.limit(settings.rate_limit_default)
async def proxy_fraud_analysis(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_fraud_service(request, "analysis")


@router.get("/alerts")
@limiter.limit(settings.rate_limit_default)
async def proxy_fraud_alerts(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_fraud_service(request, "alerts")


@router.get("/risk-score")
@limiter.limit(settings.rate_limit_default)
async def proxy_fraud_risk_score(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_fraud_service(request, "risk-score")


@router.get("/behavior-check")
@limiter.limit(settings.rate_limit_default)
async def proxy_fraud_behavior_check(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_fraud_service(request, "behavior-check")


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@limiter.limit(settings.rate_limit_default)
async def proxy_fraud_catch_all(
    request: Request,
    path: str,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_fraud_service(request, path)

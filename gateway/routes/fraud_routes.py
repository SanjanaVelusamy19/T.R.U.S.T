"""
Protected proxy routes for the Behavioral Fraud Detection microservice.
JWT is verified at the gateway before forwarding.
"""

import json
import logging

import httpx
from fastapi import APIRouter, HTTPException, Depends, Request, Response, status
from fastapi.responses import JSONResponse

from middleware.jwt_middleware import require_jwt
from utils.config import get_settings
from utils.cors import apply_cors_headers
from utils.limiter import limiter
from utils.proxy_response import downstream_json_response

router = APIRouter(prefix="/api/fraud", tags=["fraud-proxy"])

settings = get_settings()
logger = logging.getLogger("trust.gateway.fraud")


def _error_response(
    request: Request,
    *,
    status_code: int,
    error: str,
    message: str,
    detail: str | None = None,
) -> JSONResponse:
    payload: dict = {
        "success": False,
        "error": error,
        "message": message,
    }
    if detail:
        payload["detail"] = detail
    response = JSONResponse(status_code=status_code, content=payload)
    return apply_cors_headers(request, response)


async def _proxy_to_fraud_service(request: Request, downstream_path: str) -> Response:
    base = settings.fraud_detection_service_url.rstrip("/")
    url = f"{base}{downstream_path}"
    logger.info("Proxy request downstream_url=%s method=%s", url, request.method)

    try:
        body = await request.json()
    except Exception:
        body = None
        
    headers = {}
    auth_header = request.headers.get("authorization")
    if auth_header:
        headers["authorization"] = auth_header
        
    try:
        kwargs = {
            "method": request.method,
            "url": url,
            "headers": headers,
            "params": request.query_params,
        }
        if body is not None:
            kwargs["json"] = body
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.request(**kwargs)

        return downstream_json_response(resp, downstream_url=url)
    except httpx.RequestError as exc:
        logger.error("Proxy FAILURE downstream_url=%s error=%s", url, str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Downstream service unavailable: {str(exc)}",
        )


@router.get("/analysis")
@limiter.limit(settings.rate_limit_default)
async def proxy_fraud_analysis(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_fraud_service(request, "/fraud/analysis")


@router.get("/alerts")
@limiter.limit(settings.rate_limit_default)
async def proxy_fraud_alerts(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_fraud_service(request, "/fraud/alerts")


@router.get("/risk-score")
@limiter.limit(settings.rate_limit_default)
async def proxy_fraud_risk_score(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_fraud_service(request, "/fraud/risk-score")


@router.get("/behavior-check")
@limiter.limit(settings.rate_limit_default)
async def proxy_fraud_behavior_check(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_fraud_service(request, "/fraud/behavior-check")


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@limiter.limit(settings.rate_limit_default)
async def proxy_fraud_catch_all(
    request: Request,
    path: str,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_fraud_service(request, f"/fraud/{path}")

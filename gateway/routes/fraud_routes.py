"""
Protected proxy routes for the Behavioral Fraud Detection microservice.
JWT is verified at the gateway before forwarding.
"""

import json
import logging

import httpx
from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import JSONResponse

from middleware.jwt_middleware import require_jwt
from utils.config import get_settings
from utils.cors import apply_cors_headers
from utils.limiter import limiter

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
    """Forward request to fraud-detection-service with safe error handling."""
    base = settings.fraud_detection_service_url.rstrip("/")
    url = f"{base}{downstream_path}"

    try:
        body = await request.body()
    except Exception as exc:
        logger.exception("Failed to read fraud proxy request body path=%s", downstream_path)
        return _error_response(
            request,
            status_code=status.HTTP_400_BAD_REQUEST,
            error="invalid_request",
            message="Unable to read request body",
            detail=str(exc),
        )

    headers = {
        k: v
        for k, v in request.headers.items()
        if k.lower() not in {"host", "content-length"}
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.request(
                request.method,
                url,
                content=body if body else None,
                headers=headers,
                params=request.query_params,
            )
            logger.info("Proxy SUCCESS downstream_url=%s status=%s", url, resp.status_code)
    except httpx.TimeoutException:
        logger.error("Fraud service timeout url=%s", url)
        return _error_response(
            request,
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            error="fraud_service_timeout",
            message="Fraud detection service did not respond in time",
        )
    except httpx.RequestError as exc:
        logger.error("Fraud service unavailable url=%s error=%s", url, exc)
        return _error_response(
            request,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error="fraud_service_unavailable",
            message="Fraud detection service is unavailable. Start fraud-detection-service on port 8005.",
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Unexpected fraud proxy failure url=%s", url)
        return _error_response(
            request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error="fraud_proxy_error",
            message="Failed to reach fraud detection service",
            detail=str(exc),
        )

    response = Response(
        content=resp.content,
        status_code=resp.status_code,
        headers={
            k: v for k, v in resp.headers.items()
            if k.lower() not in {"content-length", "content-encoding", "transfer-encoding"}
        },
        media_type=resp.headers.get("content-type", "application/json"),
    )
    return apply_cors_headers(request, response)


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

"""
Protected proxy routes for the Monitoring microservice.
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

router = APIRouter(prefix="/api/monitoring", tags=["monitoring-proxy"])

settings = get_settings()
logger = logging.getLogger("trust.gateway.monitoring")


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


async def _proxy_to_monitoring_service(request: Request, downstream_path: str) -> Response:
    base = settings.monitoring_service_url.rstrip("/")
    url = f"{base}{downstream_path}"

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
                headers=headers,
                params=request.query_params,
            )
            logger.info("Proxy SUCCESS downstream_url=%s status=%s", url, resp.status_code)
    except httpx.TimeoutException:
        logger.error("Monitoring service timeout url=%s", url)
        return _error_response(
            request,
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            error="monitoring_service_timeout",
            message="Monitoring service did not respond in time",
        )
    except httpx.RequestError as exc:
        logger.error("Monitoring service unavailable url=%s error=%s", url, exc)
        return _error_response(
            request,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error="monitoring_service_unavailable",
            message="Monitoring service is unavailable. Start monitoring-service on port 8006.",
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Unexpected monitoring proxy failure url=%s", url)
        return _error_response(
            request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error="monitoring_proxy_error",
            message="Failed to reach monitoring service",
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

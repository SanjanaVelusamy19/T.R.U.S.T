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

    content_type = resp.headers.get("content-type", "application/json")
    if resp.status_code >= 500:
        logger.error(
            "Monitoring service returned %s for %s body=%s",
            resp.status_code,
            downstream_path,
            resp.text[:500],
        )
        return _error_response(
            request,
            status_code=status.HTTP_502_BAD_GATEWAY,
            error="monitoring_service_error",
            message="Monitoring service returned an error",
            detail=resp.text[:500] if resp.text else None,
        )

    if content_type.startswith("application/json") and resp.content:
        try:
            json.loads(resp.content)
        except json.JSONDecodeError:
            logger.error("Monitoring service returned invalid JSON for %s", downstream_path)
            return _error_response(
                request,
                status_code=status.HTTP_502_BAD_GATEWAY,
                error="invalid_downstream_response",
                message="Monitoring service returned invalid JSON",
            )

    response = Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=content_type,
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

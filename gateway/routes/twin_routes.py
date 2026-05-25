"""
Protected proxy routes for the Financial Digital Twin microservice.
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

router = APIRouter(prefix="/api/twin", tags=["twin-proxy"])

settings = get_settings()
logger = logging.getLogger("trust.gateway.twin")


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


async def _proxy_to_twin_service(request: Request, downstream_path: str) -> Response:
    base = settings.digital_twin_service_url.rstrip("/")
    url = f"{base}{downstream_path}"

    try:
        body = await request.body()
    except Exception as exc:
        logger.exception("Failed to read twin proxy request body path=%s", downstream_path)
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
        logger.error("Digital twin service timeout url=%s", url)
        return _error_response(
            request,
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            error="digital_twin_service_timeout",
            message="Digital twin service did not respond in time",
        )
    except httpx.RequestError as exc:
        logger.error("Digital twin service unavailable url=%s error=%s", url, exc)
        return _error_response(
            request,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error="digital_twin_service_unavailable",
            message="Digital twin service is unavailable. Start digital-twin-service on port 8007.",
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Unexpected twin proxy failure url=%s", url)
        return _error_response(
            request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error="digital_twin_proxy_error",
            message="Failed to reach digital twin service",
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


@router.get("/forecast")
@limiter.limit(settings.rate_limit_default)
async def proxy_twin_forecast(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_twin_service(request, "/twin/forecast")


@router.get("/trust-projection")
@limiter.limit(settings.rate_limit_default)
async def proxy_twin_trust_projection(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_twin_service(request, "/twin/trust-projection")


@router.get("/risk-simulation")
@limiter.limit(settings.rate_limit_default)
async def proxy_twin_risk_simulation(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_twin_service(request, "/twin/risk-simulation")


@router.get("/savings-growth")
@limiter.limit(settings.rate_limit_default)
async def proxy_twin_savings_growth(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_twin_service(request, "/twin/savings-growth")


@router.get("/scenarios")
@limiter.limit(settings.rate_limit_default)
async def proxy_twin_scenarios(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_twin_service(request, "/twin/scenarios")


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@limiter.limit(settings.rate_limit_default)
async def proxy_twin_catch_all(
    request: Request,
    path: str,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_twin_service(request, f"/twin/{path}")

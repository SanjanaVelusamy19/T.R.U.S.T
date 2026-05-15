"""
Protected proxy routes for the Trust Score microservice.
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

router = APIRouter(prefix="/api/trust", tags=["trust-proxy"])

settings = get_settings()
logger = logging.getLogger("trust.gateway.trust")


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


async def _proxy_to_trust_service(request: Request, downstream_path: str) -> Response:
    """Forward request to trust-score-service with safe error handling."""
    base = settings.trust_score_service_url.rstrip("/")
    url = f"{base}{downstream_path}"

    try:
        body = await request.body()
    except Exception as exc:
        logger.exception("Failed to read trust proxy request body path=%s", downstream_path)
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
    except httpx.TimeoutException:
        logger.error("Trust service timeout url=%s", url)
        return _error_response(
            request,
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            error="trust_service_timeout",
            message="Trust score service did not respond in time",
        )
    except httpx.RequestError as exc:
        logger.error("Trust service unavailable url=%s error=%s", url, exc)
        return _error_response(
            request,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error="trust_service_unavailable",
            message="Trust score service is unavailable. Start trust-score-service on port 8003.",
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Unexpected trust proxy failure url=%s", url)
        return _error_response(
            request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error="trust_proxy_error",
            message="Failed to reach trust score service",
            detail=str(exc),
        )

    content_type = resp.headers.get("content-type", "application/json")
    if resp.status_code >= 500:
        logger.error(
            "Trust service returned %s for %s body=%s",
            resp.status_code,
            downstream_path,
            resp.text[:500],
        )
        return _error_response(
            request,
            status_code=status.HTTP_502_BAD_GATEWAY,
            error="trust_service_error",
            message="Trust score service returned an error",
            detail=resp.text[:500] if resp.text else None,
        )

    if content_type.startswith("application/json") and resp.content:
        try:
            json.loads(resp.content)
        except json.JSONDecodeError:
            logger.error("Trust service returned invalid JSON for %s", downstream_path)
            return _error_response(
                request,
                status_code=status.HTTP_502_BAD_GATEWAY,
                error="invalid_downstream_response",
                message="Trust score service returned invalid JSON",
            )

    response = Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=content_type,
    )
    return apply_cors_headers(request, response)


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

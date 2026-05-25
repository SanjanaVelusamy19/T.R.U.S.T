"""
Protected proxy routes for the Trust Score microservice.
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
    base = settings.trust_score_service_url.rstrip("/")
    url = f"{base}{downstream_path}"
    
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
            logger.info("Proxy SUCCESS downstream_url=%s status=%s", url, resp.status_code)
            
        return JSONResponse(
            status_code=resp.status_code,
            content=resp.json(),
     )
    except httpx.RequestError as exc:
        logger.error("Proxy FAILURE downstream_url=%s error=%s", url, str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Downstream service unavailable: {str(exc)}",
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

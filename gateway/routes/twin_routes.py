"""
Protected proxy routes for the Financial Digital Twin microservice.
JWT is verified at the gateway before forwarding.
"""

import json
import logging

import httpx
from fastapi import APIRouter, HTTPException, Depends, Request, Response, status
from fastapi.responses import JSONResponse, Response as FastAPIResponse

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

"""
Protected proxy routes for the AI Financial Advisor microservice.
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

router = APIRouter(prefix="/api/advisor", tags=["advisor-proxy"])

settings = get_settings()
logger = logging.getLogger("trust.gateway.advisor")


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


async def _proxy_to_advisor_service(request: Request, downstream_path: str) -> Response:
    base = settings.advisor_service_url.rstrip("/")
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


@router.get("/summary")
@limiter.limit(settings.rate_limit_default)
async def proxy_advisor_summary(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_advisor_service(request, "/advisor/summary")


@router.get("/recommendations")
@limiter.limit(settings.rate_limit_default)
async def proxy_advisor_recommendations(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_advisor_service(request, "/advisor/recommendations")


@router.get("/risk-analysis")
@limiter.limit(settings.rate_limit_default)
async def proxy_advisor_risk_analysis(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_advisor_service(request, "/advisor/risk-analysis")


@router.get("/financial-health")
@limiter.limit(settings.rate_limit_default)
async def proxy_advisor_financial_health(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_advisor_service(request, "/advisor/financial-health")


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@limiter.limit(settings.rate_limit_default)
async def proxy_advisor_catch_all(
    request: Request,
    path: str,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_advisor_service(request, f"/advisor/{path}")

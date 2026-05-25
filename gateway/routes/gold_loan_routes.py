"""
Protected proxy routes for the Gold Loan microservice.
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

router = APIRouter(prefix="/api/gold-loan", tags=["gold-loan-proxy"])

settings = get_settings()
logger = logging.getLogger("trust.gateway.gold_loan")


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


async def _proxy_to_gold_loan_service(request: Request, downstream_path: str) -> Response:
    base = settings.gold_loan_service_url.rstrip("/")
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
            
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            media_type=resp.headers.get("content-type", "application/json"),
        )
    except httpx.RequestError as exc:
        logger.error("Proxy FAILURE downstream_url=%s error=%s", url, str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Downstream service unavailable: {str(exc)}",
        )


@router.post("/evaluate")
@limiter.limit(settings.rate_limit_default)
async def proxy_gold_loan_evaluate(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_gold_loan_service(request, "/gold-loan/evaluate")


@router.get("/risk-analysis")
@limiter.limit(settings.rate_limit_default)
async def proxy_gold_loan_risk_analysis(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_gold_loan_service(request, "/gold-loan/risk-analysis")


@router.get("/interest-rates")
@limiter.limit(settings.rate_limit_default)
async def proxy_gold_loan_interest_rates(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_gold_loan_service(request, "/gold-loan/interest-rates")


@router.get("/recommendations")
@limiter.limit(settings.rate_limit_default)
async def proxy_gold_loan_recommendations(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_gold_loan_service(request, "/gold-loan/recommendations")

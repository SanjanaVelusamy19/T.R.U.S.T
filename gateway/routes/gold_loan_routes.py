"""
Protected proxy routes for the Gold Loan microservice.
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
        body = await request.body()
    except Exception as exc:
        logger.exception("Failed to read gold loan proxy body path=%s", downstream_path)
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
        logger.error("Gold loan service timeout url=%s", url)
        return _error_response(
            request,
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            error="gold_loan_service_timeout",
            message="Gold loan service did not respond in time",
        )
    except httpx.RequestError as exc:
        logger.error("Gold loan service unavailable url=%s error=%s", url, exc)
        return _error_response(
            request,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error="gold_loan_service_unavailable",
            message="Gold loan service is unavailable. Start gold-loan-service on port 8008.",
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Unexpected gold loan proxy failure url=%s", url)
        return _error_response(
            request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error="gold_loan_proxy_error",
            message="Failed to reach gold loan service",
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

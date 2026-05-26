"""
Protected proxy routes for the Gold Loan microservice.
JWT is verified at the gateway before forwarding.
"""

import logging

from fastapi import APIRouter, Depends, Request, Response

from middleware.jwt_middleware import require_jwt
from utils.config import get_settings
from utils.limiter import limiter
from utils.proxy_response import proxy_downstream_request

router = APIRouter(prefix="/api/gold-loan", tags=["gold-loan-proxy"])

settings = get_settings()
logger = logging.getLogger("trust.gateway.gold_loan")


async def _proxy_to_gold_loan_service(request: Request, downstream_path: str) -> Response:
    return await proxy_downstream_request(
        request,
        base_url=settings.gold_loan_service_url,
        downstream_path=downstream_path,
        log=logger,
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

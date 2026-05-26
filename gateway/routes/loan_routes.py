"""
Protected proxy routes for the Loan microservice.
JWT is verified at the gateway before forwarding.
"""

import logging

from fastapi import APIRouter, Depends, Request, Response

from middleware.jwt_middleware import require_jwt
from utils.config import get_settings
from utils.limiter import limiter
from utils.proxy_response import proxy_downstream_request

router = APIRouter(prefix="/api/loan", tags=["loan-proxy"])

settings = get_settings()
logger = logging.getLogger("trust.gateway.loan")


async def _proxy_to_loan_service(request: Request, downstream_path: str) -> Response:
    return await proxy_downstream_request(
        request,
        base_url=settings.loan_service_url,
        downstream_path=downstream_path,
        log=logger,
    )


@router.api_route("/check-loan", methods=["POST"])
@limiter.limit(settings.rate_limit_default)
async def proxy_check_loan(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    return await _proxy_to_loan_service(request, "/check-loan")

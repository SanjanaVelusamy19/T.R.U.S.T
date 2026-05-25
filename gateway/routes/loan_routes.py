import logging
"""
Protected proxy routes for the Loan microservice.
JWT is verified at the gateway before forwarding.
"""

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
logger = logging.getLogger("trust.gateway.loan")

from middleware.jwt_middleware import require_jwt
from utils.config import get_settings
from utils.limiter import limiter
from utils.proxy_response import downstream_json_response

router = APIRouter(prefix="/api/loan", tags=["loan-proxy"])

settings = get_settings()


async def _proxy_to_loan_service(request: Request, downstream_path: str) -> Response:
    base = settings.loan_service_url.rstrip("/")
    url = f"{base}{downstream_path}"
    logger.info("Proxy request downstream_url=%s method=%s", url, request.method)

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

        return downstream_json_response(resp, downstream_url=url)
    except httpx.RequestError as exc:
        logger.error("Proxy FAILURE downstream_url=%s error=%s", url, str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Downstream service unavailable: {str(exc)}",
        )


@router.api_route("/check-loan", methods=["POST"])
@limiter.limit(settings.rate_limit_default)
async def proxy_check_loan(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
        return await _proxy_to_loan_service(request, "/check-loan")

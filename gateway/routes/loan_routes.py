"""
Protected proxy routes for the Loan microservice.
JWT is verified at the gateway before forwarding.
"""

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from middleware.jwt_middleware import require_jwt
from utils.config import get_settings
from utils.limiter import limiter

router = APIRouter(prefix="/api/loan", tags=["loan-proxy"])

settings = get_settings()


@router.api_route("/check-loan", methods=["POST"])
@limiter.limit(settings.rate_limit_default)
async def proxy_check_loan(
    request: Request,
    _claims: dict = Depends(require_jwt),
) -> Response:
    """Forward loan eligibility check; requires valid JWT (verified by dependency)."""
    url = f"{settings.loan_service_url.rstrip('/')}/check-loan"
    body = await request.body()

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
            )

        return Response(
            content=resp.content,
            status_code=resp.status_code,
            media_type=resp.headers.get("content-type", "application/json"),
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Downstream loan service unavailable: {str(exc)}",
        )

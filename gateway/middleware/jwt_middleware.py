"""
JWT verification dependency for protected gateway routes.
"""

from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException, status

from utils.jwt_utils import verify_bearer_token


async def require_jwt(authorization: Annotated[str | None, Header()] = None) -> dict:
    """
    FastAPI dependency that validates Bearer JWT and returns decoded claims.

    Use on routes that proxy to protected downstream services.
    """
    try:
        return verify_bearer_token(authorization)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

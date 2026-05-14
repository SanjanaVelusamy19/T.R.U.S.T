"""
JWT verification helpers used by the gateway before proxying to protected routes.
"""

from typing import Any

import jwt
from jwt import PyJWTError

from utils.config import get_settings


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT access token.

    Raises jwt.PyJWTError on invalid or expired tokens.
    """
    settings = get_settings()
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )


def verify_bearer_token(authorization: str | None) -> dict[str, Any]:
    """
    Extract Bearer token from Authorization header and verify it.

    Returns decoded payload on success.
    Raises ValueError for missing/malformed header, PyJWTError for bad tokens.
    """
    if not authorization:
        raise ValueError("Missing Authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise ValueError("Authorization header must be Bearer <token>")

    return decode_token(parts[1])

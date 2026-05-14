"""
JWT creation and validation for the Auth service.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from pydantic_settings import BaseSettings, SettingsConfigDict


class JwtSettings(BaseSettings):
    """JWT configuration aligned with the API Gateway."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    jwt_secret: str = "change-me-in-production-use-long-random-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60


def get_jwt_settings() -> JwtSettings:
    return JwtSettings()


def create_access_token(subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    """Issue a signed JWT access token."""
    settings = get_jwt_settings()
    now = datetime.now(UTC)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode token or raise PyJWTError."""
    settings = get_jwt_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def verify_token(token: str) -> dict[str, Any]:
    """Public helper used by verify-token endpoint."""
    return decode_access_token(token)

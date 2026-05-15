"""
Centralized configuration for the API Gateway.
Loads environment variables with sensible defaults for local development.
"""

from functools import lru_cache
from typing import Any

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings sourced from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "TRUST API Gateway"
    debug: bool = False

    # Downstream microservice base URLs (Docker service names in compose)
    auth_service_url: str = "http://localhost:8001"
    loan_service_url: str = "http://localhost:8002"
    trust_score_service_url: str = "http://localhost:8003"
    advisor_service_url: str = "http://localhost:8004"

    # Must match auth-service signing secret for token verification
    jwt_secret: str = "change-me-in-production-use-long-random-secret"
    jwt_algorithm: str = "HS256"

    # Rate limiting (SlowAPI uses in-memory storage by default)
    rate_limit_default: str = "100/minute"

    @model_validator(mode="before")
    @classmethod
    def _normalize_env_aliases(cls, data: Any) -> Any:
        """Accept legacy TRUST_SERVICE_URL / RATE_LIMIT env names."""
        if not isinstance(data, dict):
            return data

        normalized = dict(data)
        if "TRUST_SCORE_SERVICE_URL" not in normalized:
            legacy_trust = normalized.get("TRUST_SERVICE_URL")
            if legacy_trust:
                normalized["TRUST_SCORE_SERVICE_URL"] = legacy_trust
        if "RATE_LIMIT_DEFAULT" not in normalized:
            legacy_rate = normalized.get("RATE_LIMIT")
            if legacy_rate:
                normalized["RATE_LIMIT_DEFAULT"] = legacy_rate
        return normalized


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()

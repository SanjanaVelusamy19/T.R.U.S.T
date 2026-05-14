"""
Centralized configuration for the API Gateway.
Loads environment variables with sensible defaults for local development.
"""

from functools import lru_cache

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

    # Must match auth-service signing secret for token verification
    jwt_secret: str = "change-me-in-production-use-long-random-secret"
    jwt_algorithm: str = "HS256"

    # Rate limiting (SlowAPI uses in-memory storage by default)
    rate_limit_default: str = "100/minute"


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()

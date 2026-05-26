"""
Centralized configuration for the API Gateway.
Loads environment variables with sensible defaults for local development.
"""

import logging
from functools import lru_cache
from typing import Any
from urllib.parse import urlparse

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_SERVICE_URL_FIELDS = (
    "auth_service_url",
    "loan_service_url",
    "trust_score_service_url",
    "advisor_service_url",
    "fraud_detection_service_url",
    "digital_twin_service_url",
    "monitoring_service_url",
    "gold_loan_service_url",
)


def _strip_url_path(url: str) -> str:
    """Keep scheme + host only; gateway appends paths internally."""
    cleaned = url.strip().rstrip("/")
    parsed = urlparse(cleaned)
    if not parsed.scheme or not parsed.netloc:
        return cleaned
    if parsed.path and parsed.path != "/":
        return f"{parsed.scheme}://{parsed.netloc}"
    return cleaned


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
    fraud_detection_service_url: str = "http://localhost:8005"
    digital_twin_service_url: str = "http://localhost:8007"
    monitoring_service_url: str = "http://localhost:8006"
    gold_loan_service_url: str = "http://localhost:8008"

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

    @model_validator(mode="after")
    def _normalize_service_base_urls(self) -> "Settings":
        """Ensure downstream base URLs have no path segments or trailing slashes."""
        log = logging.getLogger("trust.gateway.config")
        for field in _SERVICE_URL_FIELDS:
            value = getattr(self, field, None)
            if isinstance(value, str) and value:
                normalized = _strip_url_path(value)
                if normalized != value.strip().rstrip("/"):
                    log.warning(
                        "Stripped path from %s (was %r, now %r)",
                        field,
                        value,
                        normalized,
                    )
                object.__setattr__(self, field, normalized)
        return self


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()

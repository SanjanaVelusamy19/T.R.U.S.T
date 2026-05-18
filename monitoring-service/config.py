"""Configuration for the monitoring microservice."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    auth_service_url: str = "http://localhost:8001"
    loan_service_url: str = "http://localhost:8002"
    trust_score_service_url: str = "http://localhost:8003"
    advisor_service_url: str = "http://localhost:8004"
    fraud_detection_service_url: str = "http://localhost:8005"
    gateway_service_url: str = "http://localhost:8000"

    health_check_retries: int = 3
    health_check_timeout_sec: float = 4.0
    latency_warning_delta_ms: int = 15


@lru_cache
def get_settings() -> Settings:
    return Settings()

"""Configuration for the gold loan microservice."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    trust_score_service_url: str = "http://localhost:8003"
    market_rate_per_gram_22k: float = 6400.0
    max_loan_to_value_ratio: float = 0.75
    base_annual_interest_rate: float = 0.095
    default_tenure_months: int = 12


@lru_cache
def get_settings() -> Settings:
    return Settings()

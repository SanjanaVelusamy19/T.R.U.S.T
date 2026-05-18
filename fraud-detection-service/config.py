"""Configuration for the fraud detection microservice."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    trust_score_service_url: str = "http://localhost:8003"


@lru_cache
def get_settings() -> Settings:
    return Settings()

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
    )

    APP_NAME: str = "FastAPI JWT RBAC"

    DATABASE_URL: str = (
        "postgresql://postgres:Swaraj%4039@localhost:5432/fastapiall"
    )

    SECRET_KEY: str = (
        "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    )

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    LOG_DIR: str = "logs"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

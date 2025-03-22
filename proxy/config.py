from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # Environment settings
    TARGET_ENV: str = "dev"
    LOG_LEVEL: str = "INFO"

    # Database settings
    POSTGRES_DB: str | None = None
    POSTGRES_USER: str | None = None
    POSTGRES_PASSWORD: str | None = None
    POSTGRES_PORT: str | None = None
    POSTGRES_HOST: str | None = None
    # Langfuse settings
    LANGFUSE_SECRET_KEY: str | None = None
    LANGFUSE_PUBLIC_KEY: str | None = None
    LANGFUSE_HOST: str | None = None

    # General settings
    MAX_RECURSION_DEPTH: int = 5

    # CORS settings
    ADDITIONAL_CORS_ORIGINS: list[str] = []

    @field_validator("ADDITIONAL_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Handle empty string case
            if not v.strip():
                return []
            # Split and clean the origins
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v or []  # Return empty list if v is None

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

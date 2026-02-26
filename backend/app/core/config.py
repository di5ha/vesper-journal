"""
Vesper — Application Configuration.
Loads settings from environment variables via pydantic-settings.
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""         # anon/public key
    supabase_service_key: str = "" # service role key

    # LiteLLM Proxy (OpenAI-compatible endpoint)
    litellm_api_key: str = ""
    litellm_base_url: str = ""     # must end with /v1
    litellm_model: str = "gpt-5-nano"

    # App
    app_env: str = "development"

    # CORS — reads FRONTEND_URL env var (comma-separated list of allowed origins)
    # Example: FRONTEND_URL=https://vesper.vercel.app,http://localhost:5173
    @property
    def cors_origins(self) -> list[str]:
        raw = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return [o.strip() for o in raw.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

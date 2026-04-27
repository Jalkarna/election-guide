"""
Settings loaded from backend/.env — never hardcoded.
"""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_FILE = Path(__file__).resolve().with_name(".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    google_api_key: str | None = None
    database_url: str = "sqlite+aiosqlite:///./election_guide.db"
    gemini_model: str = "gemini-3-flash-preview"
    gemini_fallback_model: str = "gemini-2.5-flash"
    use_vertex_ai: bool = False
    gcp_project_id: str | None = None
    gcp_location: str = "us-central1"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8080"]

    @property
    def gemini_model_candidates(self) -> list[str]:
        seen: set[str] = set()
        candidates: list[str] = []
        for model in (self.gemini_model, self.gemini_fallback_model):
            name = (model or "").strip()
            if not name or name in seen:
                continue
            seen.add(name)
            candidates.append(name)
        return candidates or ["gemini-2.5-flash"]

    @property
    def gemini_transport(self) -> str:
        if self.google_api_key:
            return "vertex-express-api-key"
        if self.use_vertex_ai:
            return "vertex-adc"
        return "missing-auth"


settings = Settings()

# skillswap-backend/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    FRONTEND_URL: str = "http://localhost:5173"
    PORT: int = 10000

    # pydantic v2+ way to point to .env
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()

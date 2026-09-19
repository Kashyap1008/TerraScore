"""
pipeline/config.py
------------------
Loads environment variables (from .env or shell) using pydantic-settings.
All pipeline scripts should import settings from here — do not read os.environ
directly.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    db_url: str = "postgresql+psycopg://geo:geo@localhost:5432/sitereadiness"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # OSRM
    osrm_url: str = "http://localhost:5000"

    # Metro AOI
    metro_name: str = "Austin, TX"
    metro_bbox: str = "-98.05,30.10,-97.55,30.55"
    utm_epsg: int = 32614
    h3_resolution: int = 9


settings = Settings()

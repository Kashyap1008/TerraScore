from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Tuple

class Settings(BaseSettings):
    db_url: str = "postgresql+psycopg://geo:geo@localhost:5432/sitereadiness"
    redis_url: str = "redis://localhost:6379/0"
    osrm_url: str = "http://localhost:5000"
    metro_name: str = "Austin, TX"
    metro_bbox: str = "-98.05,30.10,-97.55,30.55"
    utm_epsg: int = 32614
    h3_resolution: int = 9
    api_version: str = "0.1.0"
    static_dir: str = "static"
    presets_path: str = "config/presets.json"

    @property
    def metro_bbox_tuple(self) -> Tuple[float, float, float, float]:
        coords = [float(x.strip()) for x in self.metro_bbox.split(',')]
        return (coords[0], coords[1], coords[2], coords[3])

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

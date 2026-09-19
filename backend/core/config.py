from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Tuple

class Settings(BaseSettings):
    db_url: str
    redis_url: str
    osrm_url: str
    metro_name: str
    metro_bbox: str
    utm_epsg: int
    h3_resolution: int
    api_version: str = "0.1.0"
    static_dir: str = "static"
    presets_path: str = "config/presets.json"

    @property
    def metro_bbox_tuple(self) -> Tuple[float, float, float, float]:
        coords = [float(x.strip()) for x in self.metro_bbox.split(',')]
        return (coords[0], coords[1], coords[2], coords[3])

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

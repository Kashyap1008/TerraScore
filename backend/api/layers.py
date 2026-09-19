import os
import json
from typing import List, Dict, Any
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from core.config import settings

router = APIRouter()

@router.get("/layers")
async def get_layers() -> List[Dict[str, Any]]:
    manifest_path = os.path.join(settings.static_dir, "tiles", "manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as f:
            return json.load(f)
            
    return [
        {"id": "h3_grid", "name": "Site Scores", "type": "fill", "url": "/static/tiles/h3_grid.pmtiles", "default_opacity": 0.75, "default_visible": True},
        {"id": "roads", "name": "Road Network", "type": "line", "url": "/static/tiles/roads.pmtiles", "default_opacity": 0.6, "default_visible": True},
        {"id": "flood_zones", "name": "Flood Zones", "type": "fill", "url": "/static/tiles/flood_zones.pmtiles", "default_opacity": 0.35, "default_visible": False},
        {"id": "pois", "name": "Competitors", "type": "circle", "url": "/static/tiles/pois.pmtiles", "default_opacity": 1.0, "default_visible": False},
        {"id": "transit_stops", "name": "Transit Stops", "type": "circle", "url": "/static/tiles/transit_stops.pmtiles", "default_opacity": 1.0, "default_visible": False}
    ]

@router.get("/tiles/{layer}/{z}/{x}/{y}")
async def get_tiles(layer: str, z: int, x: int, y: int):
    return JSONResponse(status_code=404, content={"message": "Tiles not implemented yet"})

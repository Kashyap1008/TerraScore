import json
import math
import os
import logging
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel
from fastapi.responses import JSONResponse

router = APIRouter()
logger = logging.getLogger(__name__)


class IsochroneRequest(BaseModel):
    lat: float
    lon: float
    minutes: List[int] = [5, 10, 15]
    mode: str = "driving"


def make_circle(lat: float, lon: float, radius_km: float, n_points: int = 64):
    """
    Generate an approximate circular GeoJSON Polygon for a given center and radius.
    1 degree latitude ≈ 111 km; longitude degrees vary with cosine of latitude.
    """
    points = []
    cos_lat = math.cos(math.radians(lat))
    for i in range(n_points):
        angle = math.radians(i * 360 / n_points)
        d_lat = (radius_km * math.cos(angle)) / 111.0
        d_lon = (radius_km * math.sin(angle)) / (111.0 * cos_lat) if cos_lat > 0 else 0.0
        points.append([lon + d_lon, lat + d_lat])
    points.append(points[0])  # close the ring
    return {"type": "Polygon", "coordinates": [points]}


def build_isochrone_response(lat: float, lon: float, minutes: List[int], mode: str) -> dict:
    """
    Build isochrone rings using a simple driving-speed model.
    Austin urban: ~30 km/h average → 0.5 km per minute.
    Walking: ~5 km/h → ~0.083 km per minute.
    """
    speed_kmpm = 0.5 if mode == "driving" else 0.083  # km per minute
    polygons = {}
    population_reachable = {}

    sorted_minutes = sorted(minutes)
    for m in sorted_minutes:
        radius_km = m * speed_kmpm
        poly = make_circle(lat, lon, radius_km)
        polygons[str(m)] = poly
        # Rough population estimate: Austin avg ~1,300 people/km²
        area_km2 = math.pi * radius_km ** 2
        population_reachable[str(m)] = int(area_km2 * 1300)

    return {
        "polygons": polygons,
        "population_reachable": population_reachable,
    }


@router.post("/isochrone")
async def get_isochrone(req: IsochroneRequest):
    """
    Returns drive-time isochrone rings centred on (lat, lon).
    Primary path: OSRM routing engine (localhost:5000).
    Fallback: pure-Python circular approximation — always succeeds.
    """
    # ── Try Redis cache ──────────────────────────────────────────────────────
    r = None
    try:
        import redis
        redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
        r = redis.from_url(redis_url, socket_connect_timeout=0.5)
        r.ping()
    except Exception:
        r = None

    minutes_csv = ",".join(str(m) for m in sorted(req.minutes))
    cache_key = f"iso:{req.lat:.5f}:{req.lon:.5f}:{req.mode}:{minutes_csv}"

    if r:
        try:
            cached = r.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

    # ── Try OSRM isochrone plugin ────────────────────────────────────────────
    result = None
    try:
        import httpx
        osrm_url = (
            f"http://localhost:5000/isochrone/v1/{req.mode}/"
            f"{req.lon},{req.lat}?contours={minutes_csv}&polygons=true"
        )
        resp = httpx.get(osrm_url, timeout=1.5)
        resp.raise_for_status()
        osrm_data = resp.json()

        # Parse OSRM GeoJSON feature collection into our format
        polygons: dict = {}
        population_reachable: dict = {}
        for feature in osrm_data.get("features", []):
            props = feature.get("properties", {})
            mins = str(props.get("contour", ""))
            if mins and feature.get("geometry"):
                polygons[mins] = feature["geometry"]
                # rough population from area
                area_km2 = props.get("area", 0) or 0
                population_reachable[mins] = int(area_km2 * 1300)

        if polygons:
            result = {"polygons": polygons, "population_reachable": population_reachable}
    except Exception as e:
        logger.debug(f"OSRM unavailable, using geometric fallback: {e}")

    # ── Pure-Python geometric fallback (always works) ────────────────────────
    if not result:
        result = build_isochrone_response(req.lat, req.lon, req.minutes, req.mode)

    # ── Cache result ─────────────────────────────────────────────────────────
    if r:
        try:
            r.setex(cache_key, 3600, json.dumps(result))
        except Exception:
            pass

    return result

"""
pipeline/09_export_tiles.py
---------------------------
Exports derived.h3_grid and raw geospatial layers from PostGIS to GeoJSON and PMTiles
in backend/static/tiles/ (and frontend/public/tiles/).

Layers exported:
  - h3_grid (scores, hotspots, features)
  - flood_zones (FEMA polygons)
  - pois (competitors and anchor POIs)
  - roads (major corridors)
  - transit_stops (bus/rail points)

Supports Tippecanoe conversion to PMTiles if tippecanoe is installed,
and always ensures GeoJSON fallbacks are generated.
"""
from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Optional

import geopandas as gpd
from sqlalchemy import inspect as sa_inspect

from pipeline.utils import get_engine, log_step

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s -- %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

BACKEND_TILES_DIR = Path("backend/static/tiles")
FRONTEND_TILES_DIR = Path("frontend/public/tiles")


def ensure_output_dirs() -> None:
    BACKEND_TILES_DIR.mkdir(parents=True, exist_ok=True)
    FRONTEND_TILES_DIR.mkdir(parents=True, exist_ok=True)


def export_layer_geojson(
    query: str,
    output_filename: str,
    engine,
) -> Optional[Path]:
    """Reads layer from PostGIS and writes GeoJSON to backend and frontend dirs."""
    try:
        gdf = gpd.read_postgis(query, engine, geom_col="geometry", crs=4326)
        if len(gdf) == 0:
            logger.warning("Query returned 0 rows for %s", output_filename)
            return None

        # Fix any non-serializable columns
        for col in gdf.columns:
            if gdf[col].dtype == "datetime64[ns]":
                gdf[col] = gdf[col].astype(str)

        backend_path = BACKEND_TILES_DIR / output_filename
        gdf.to_file(backend_path, driver="GeoJSON")
        logger.info("Saved %d features -> %s", len(gdf), backend_path)

        # Copy to frontend public tiles for direct client loading fallback
        frontend_path = FRONTEND_TILES_DIR / output_filename
        shutil.copyfile(backend_path, frontend_path)

        return backend_path
    except Exception as e:
        logger.warning("Could not export %s: %s", output_filename, e)
        return None


def convert_to_pmtiles(geojson_path: Path, output_pmtiles: Path, minzoom: int = 8, maxzoom: int = 14) -> bool:
    """Run tippecanoe to convert GeoJSON to PMTiles if tippecanoe is available."""
    tippecanoe = shutil.which("tippecanoe")
    if not tippecanoe:
        logger.info("Tippecanoe not found in PATH. GeoJSON will be served directly.")
        return False

    cmd = [
        tippecanoe,
        "-o",
        str(output_pmtiles),
        f"-Z{minzoom}",
        f"-z{maxzoom}",
        "--drop-densest-as-needed",
        "--force",
        str(geojson_path),
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        logger.info("Successfully generated PMTiles: %s", output_pmtiles)
        return True
    except Exception as e:
        logger.warning("Tippecanoe conversion failed for %s: %s", geojson_path, e)
        return False


def main() -> int:
    ensure_output_dirs()
    engine = get_engine()

    inspector = sa_inspect(engine)
    derived_tables = inspector.get_table_names(schema="derived")
    raw_tables = inspector.get_table_names(schema="raw")

    # 1. Export derived.h3_grid
    if "h3_grid" in derived_tables:
        with log_step("export h3_grid.geojson"):
            h3_path = export_layer_geojson(
                "SELECT h3_index, lat, lon, pop_density, pop_10min, median_income, "
                "road_density, dist_to_highway_m, competitor_count_1km, competitor_decay_score, "
                "anchor_count_1km, zone_class, flood_risk, aqi_score, "
                "score_retail, score_warehouse, score_ev, "
                "hotspot_z_retail, hotspot_z_warehouse, hotspot_z_ev, geometry "
                "FROM derived.h3_grid",
                "h3_grid.geojson",
                engine,
            )
            if h3_path:
                convert_to_pmtiles(h3_path, BACKEND_TILES_DIR / "h3_grid.pmtiles", minzoom=8, maxzoom=14)
    else:
        logger.warning("derived.h3_grid table does not exist.")

    # 2. Export raw layers
    if "flood_zones" in raw_tables:
        with log_step("export flood_zones.geojson"):
            export_layer_geojson(
                "SELECT zone_code, risk_level, geometry FROM raw.flood_zones",
                "flood_zones.geojson",
                engine,
            )

    if "pois" in raw_tables:
        with log_step("export pois.geojson"):
            export_layer_geojson(
                "SELECT osm_id, category, brand, geometry FROM raw.pois",
                "pois.geojson",
                engine,
            )

    if "roads" in raw_tables:
        with log_step("export roads.geojson"):
            export_layer_geojson(
                "SELECT osm_id, highway_class, geometry FROM raw.roads",
                "roads.geojson",
                engine,
            )

    if "transit_stops" in raw_tables:
        with log_step("export transit_stops.geojson"):
            export_layer_geojson(
                "SELECT osm_id, route_type, geometry FROM raw.transit_stops",
                "transit_stops.geojson",
                engine,
            )

    logger.info("Tile and layer export complete. Artifacts written to %s", BACKEND_TILES_DIR)
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""
pipeline/utils.py
-----------------
Shared infrastructure utilities for every ingest and scoring script.
No domain logic here -- only database, spatial, and logging helpers.
"""
from __future__ import annotations

import logging
import os
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

import geopandas as gpd
from geopandas import GeoDataFrame
from shapely.geometry import box
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from pipeline.config import METRO

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s -- %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

def get_engine() -> Engine:
    """Return a SQLAlchemy engine built from DB_URL env (psycopg v3 driver)."""
    url: str = os.getenv(
        "DB_URL",
        "postgresql+psycopg://geo:geo@localhost:5432/sitereadiness",
    )
    return create_engine(url, pool_pre_ping=True)


def ensure_schema(engine: Engine) -> None:
    """Create raw and derived schemas if they do not already exist."""
    with engine.begin() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS raw;"))
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS derived;"))
    logger.info("Schemas raw + derived ensured.")


# ---------------------------------------------------------------------------
# Spatial helpers
# ---------------------------------------------------------------------------

def load_geojson(path: str | Path) -> GeoDataFrame:
    """Read any file GeoPandas understands and force CRS to EPSG:4326."""
    gdf: GeoDataFrame = gpd.read_file(str(path))
    if gdf.crs is None:
        gdf = gdf.set_crs(epsg=4326)
    elif gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)
    return gdf


def clip_to_metro(gdf: GeoDataFrame) -> GeoDataFrame:
    """Clip a GeoDataFrame to METRO.bbox (minlon, minlat, maxlon, maxlat)."""
    minlon, minlat, maxlon, maxlat = METRO.bbox
    metro_box = box(minlon, minlat, maxlon, maxlat)
    clipped: GeoDataFrame = gdf.clip(metro_box)
    return clipped.reset_index(drop=True)


def write_geodf(
    gdf: GeoDataFrame,
    table: str,
    schema: str,
    engine: Engine,
    if_exists: str = "replace",
) -> None:
    """Write a GeoDataFrame to PostGIS, replacing the table by default."""
    gdf.to_postgis(
        name=table,
        schema=schema,
        con=engine,
        if_exists=if_exists,
        index=False,
    )
    logger.info("Written %d rows -> %s.%s", len(gdf), schema, table)


# ---------------------------------------------------------------------------
# Step logging
# ---------------------------------------------------------------------------

@contextmanager
def log_step(name: str) -> Generator[None, None, None]:
    """Context manager: logs '[STEP] <name> ... done in Xs'."""
    logger.info("[STEP] %s ...", name)
    t0 = time.perf_counter()
    yield
    elapsed = time.perf_counter() - t0
    logger.info("[STEP] %s ... done in %.1fs", name, elapsed)
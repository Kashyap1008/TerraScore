"""
pipeline/03_ingest_fema.py
---------------------------
Ingest FEMA National Flood Hazard Layer (NFHL) shapefile into
PostGIS table raw.flood_zones.

REQUIRES (place in pipeline/data/raw/fema/):
  NFHL shapefile (.shp) — any layer containing FLD_ZONE column.
  Download: https://msc.fema.gov/portal/advanceSearch
    > National Flood Hazard Layer (NFHL) > Texas > Download GDB or SHP

If no shapefile is found the script prints the download URL and exits 1.
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

import geopandas as gpd
from sqlalchemy import text

from pipeline.utils import clip_to_metro, ensure_schema, get_engine, log_step, write_geodf

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s -- %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

RAW_DIR = Path(__file__).parent / "data" / "raw" / "fema"
TABLE   = "flood_zones"
SCHEMA  = "raw"

DOWNLOAD_MSG = """
============================================================
MISSING DATA -- ACTION REQUIRED
============================================================
Download the FEMA NFHL shapefile and place it in:
  {raw_dir}

URL: https://msc.fema.gov/portal/advanceSearch
  > Product: National Flood Hazard Layer (NFHL)
  > State: Texas
  > Download as Shapefile or GDB, then unzip into the fema/ folder.

After downloading re-run:
  python pipeline/03_ingest_fema.py
============================================================
""".strip()

HIGH_RISK   = frozenset({"A", "AE", "AO", "AH", "A99", "VE", "V"})
MEDIUM_RISK = frozenset({"X500", "0.2PCT", "X"})


def _risk_level(zone: str) -> str:
    z = str(zone).strip().upper()
    if z in HIGH_RISK:
        return "high"
    if z in MEDIUM_RISK:
        return "medium"
    return "low"


def main() -> int:
    shp_files = list(RAW_DIR.glob("*.shp"))
    if not shp_files:
        logger.error("No shapefile found in %s", RAW_DIR)
        print(DOWNLOAD_MSG.format(raw_dir=RAW_DIR.resolve()))
        return 1

    shp_path = shp_files[0]
    logger.info("Shapefile: %s", shp_path)

    engine = get_engine()
    ensure_schema(engine)

    with log_step("load FEMA shapefile"):
        gdf: gpd.GeoDataFrame = gpd.read_file(str(shp_path))
        if gdf.crs is None:
            gdf = gdf.set_crs(epsg=4326)
        elif gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(epsg=4326)

    # Detect flood zone column (varies between NFHL layers)
    fld_col: str | None = None
    for col in gdf.columns:
        if col.upper() in ("FLD_ZONE", "FLOOD_ZONE", "ZONE_", "ZONE"):
            fld_col = col
            break
    if fld_col is None:
        logger.error(
            "Cannot find FLD_ZONE column. Available columns: %s",
            list(gdf.columns),
        )
        return 1

    with log_step("clip + derive risk_level"):
        gdf = clip_to_metro(gdf)
        gdf["zone_code"]  = gdf[fld_col].astype(str).str.strip().str.upper()
        gdf["risk_level"] = gdf["zone_code"].map(_risk_level)
        gdf = gdf[["zone_code", "risk_level", "geometry"]].copy()

    if len(gdf) == 0:
        logger.error("No flood zones remain after clipping to metro bbox.")
        return 1

    with log_step(f"write PostGIS {SCHEMA}.{TABLE}"):
        write_geodf(gdf, table=TABLE, schema=SCHEMA, engine=engine)

    with log_step("create GiST index"):
        with engine.begin() as conn:
            conn.execute(text(
                f"CREATE INDEX IF NOT EXISTS idx_{TABLE}_geom "
                f"ON {SCHEMA}.{TABLE} USING GIST (geometry);"
            ))

    logger.info(
        "Done. rows=%d  risk breakdown: high=%d medium=%d low=%d",
        len(gdf),
        (gdf["risk_level"] == "high").sum(),
        (gdf["risk_level"] == "medium").sum(),
        (gdf["risk_level"] == "low").sum(),
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
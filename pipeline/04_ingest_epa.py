"""
pipeline/04_ingest_epa.py
--------------------------
Ingest EPA Air Quality System (AQS) annual summary CSV into
PostGIS table raw.air_quality.

REQUIRES (place in pipeline/data/raw/epa/):
  Annual AQS summary CSV, e.g. annual_conc_by_monitor_YYYY.csv
  Download: https://aqs.epa.gov/aqsweb/airdata/download_files.html
    > Annual Summary Files > annual_conc_by_monitor_YYYY.zip

If no CSV is found the script prints the download URL and exits 1.
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point
from sqlalchemy import text

from pipeline.config import METRO
from pipeline.utils import clip_to_metro, ensure_schema, get_engine, log_step, write_geodf

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s -- %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

RAW_DIR = Path(__file__).parent / "data" / "raw" / "epa"
TABLE   = "air_quality"
SCHEMA  = "raw"

DOWNLOAD_MSG = """
============================================================
MISSING DATA -- ACTION REQUIRED
============================================================
Download the EPA AQS annual summary CSV and place it in:
  {raw_dir}

URL: https://aqs.epa.gov/aqsweb/airdata/download_files.html
  > Annual Summary Files
  > File: annual_conc_by_monitor_YYYY.zip  (pick the most recent year)
  > Unzip and place the .csv into the epa/ folder.

After downloading re-run:
  python pipeline/04_ingest_epa.py
============================================================
""".strip()

# Column name mappings across AQS CSV versions
_COL_ALIASES: dict[str, list[str]] = {
    "monitor_id":   ["State Code", "state_code", "Site Num", "site_num"],
    "pollutant":    ["Parameter Name", "parameter_name", "Pollutant"],
    "value":        ["Arithmetic Mean", "arithmetic_mean", "Mean Value"],
    "latitude":     ["Latitude", "latitude", "lat"],
    "longitude":    ["Longitude", "longitude", "lon"],
    "site_num":     ["Site Num", "site_num"],
    "state_code":   ["State Code", "state_code"],
    "county_code":  ["County Code", "county_code"],
}


def _find_col(df: pd.DataFrame, candidates: list[str]) -> str | None:
    for c in candidates:
        if c in df.columns:
            return c
    return None


def main() -> int:
    csv_files = list(RAW_DIR.glob("*.csv"))
    if not csv_files:
        logger.error("No CSV found in %s", RAW_DIR)
        print(DOWNLOAD_MSG.format(raw_dir=RAW_DIR.resolve()))
        return 1

    csv_path = csv_files[0]
    logger.info("CSV: %s", csv_path)

    engine = get_engine()
    ensure_schema(engine)

    with log_step("load AQS CSV"):
        df = pd.read_csv(csv_path, low_memory=False)
        logger.info("Raw rows: %d", len(df))

    # Resolve column names
    lat_col  = _find_col(df, _COL_ALIASES["latitude"])
    lon_col  = _find_col(df, _COL_ALIASES["longitude"])
    poll_col = _find_col(df, _COL_ALIASES["pollutant"])
    val_col  = _find_col(df, _COL_ALIASES["value"])
    state_col  = _find_col(df, _COL_ALIASES["state_code"])
    site_col   = _find_col(df, _COL_ALIASES["site_num"])
    county_col = _find_col(df, _COL_ALIASES["county_code"])

    missing = [k for k, v in {
        "latitude": lat_col, "longitude": lon_col,
        "pollutant": poll_col, "value": val_col,
    }.items() if v is None]
    if missing:
        logger.error("Missing expected columns: %s. Available: %s", missing, list(df.columns[:20]))
        return 1

    with log_step("build monitor_id + geometry"):
        df["latitude"]  = pd.to_numeric(df[lat_col],  errors="coerce")
        df["longitude"] = pd.to_numeric(df[lon_col],  errors="coerce")
        df["value"]     = pd.to_numeric(df[val_col],  errors="coerce")
        df["pollutant"] = df[poll_col].astype(str)

        # Build composite monitor_id: state-county-site
        if state_col and site_col and county_col:
            df["monitor_id"] = (
                df[state_col].astype(str).str.zfill(2) + "-"
                + df[county_col].astype(str).str.zfill(3) + "-"
                + df[site_col].astype(str).str.zfill(4)
            )
        else:
            df["monitor_id"] = df.index.astype(str)

        df = df.dropna(subset=["latitude", "longitude", "value"])
        df["geometry"] = df.apply(
            lambda r: Point(r["longitude"], r["latitude"]), axis=1
        )

    with log_step("filter to Austin bbox"):
        gdf = gpd.GeoDataFrame(
            df[["monitor_id", "pollutant", "value", "geometry"]],
            geometry="geometry",
            crs=4326,
        )
        gdf = clip_to_metro(gdf)

    if len(gdf) == 0:
        logger.warning(
            "No AQI monitors within METRO.bbox=%s. "
            "The AQI table will be empty — h3_grid will use aqi_score=0.",
            METRO.bbox,
        )

    # Deduplicate: keep the row with highest value per monitor+pollutant
    gdf = (
        gdf.sort_values("value", ascending=False)
        .drop_duplicates(subset=["monitor_id", "pollutant"])
        .reset_index(drop=True)
    )

    with log_step(f"write PostGIS {SCHEMA}.{TABLE}"):
        write_geodf(gdf, table=TABLE, schema=SCHEMA, engine=engine)

    with log_step("create GiST index"):
        with engine.begin() as conn:
            conn.execute(text(
                f"CREATE INDEX IF NOT EXISTS idx_{TABLE}_geom "
                f"ON {SCHEMA}.{TABLE} USING GIST (geometry);"
            ))

    logger.info("Done. rows=%d  pollutants=%s", len(gdf), sorted(gdf["pollutant"].unique().tolist()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
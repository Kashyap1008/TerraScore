"""
pipeline/01_ingest_census.py
-----------------------------
Ingest ACS 5-yr demographics + TIGER/Line block-group shapefiles for
Travis County, TX into PostGIS table raw.demographics_blocks.

REQUIRES (place files in pipeline/data/raw/census/):
  - ACS CSV  : e.g. ACSST5Y2022.S0101_data.csv
               https://data.census.gov/table/ACSST5Y2022.S0101
  - TIGER shp: e.g. tl_2022_48453_bg.shp  (Travis County FIPS 48453)
               https://www2.census.gov/geo/tiger/TIGER2022/BG/tl_2022_48453_bg.zip

If either file is missing the script prints clear download instructions and
exits 1.  It NEVER auto-downloads or fabricates data.
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

import geopandas as gpd
import pandas as pd
from sqlalchemy import text

from pipeline.config import METRO
from pipeline.utils import (
    clip_to_metro,
    ensure_schema,
    get_engine,
    log_step,
    write_geodf,
)

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s -- %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

RAW_DIR = Path(__file__).parent / "data" / "raw" / "census"
TABLE   = "demographics_blocks"
SCHEMA  = "raw"

DOWNLOAD_MSG = """
============================================================
MISSING DATA -- ACTION REQUIRED
============================================================
Place the following files in:
  {raw_dir}

1. ACS 5-Year Estimates -- Travis County, TX
   Table S0101 (Age & Sex) or DP03 (Economic Characteristics)
   URL : https://data.census.gov/table/ACSST5Y2022.S0101
   File: ACSST5Y2022.S0101_data.csv

2. TIGER/Line Block Groups -- Travis County (FIPS 48453)
   URL : https://www2.census.gov/geo/tiger/TIGER2022/BG/tl_2022_48453_bg.zip
   File: tl_2022_48453_bg.shp  (unzip into the census/ folder)

After downloading re-run:
  python pipeline/01_ingest_census.py
============================================================
""".strip()


def _find_csv(directory: Path) -> Path | None:
    candidates = list(directory.glob("*data*.csv")) + list(directory.glob("*.csv"))
    return candidates[0] if candidates else None


def _find_shapefile(directory: Path) -> Path | None:
    candidates = list(directory.glob("*.shp"))
    return candidates[0] if candidates else None


def _load_acs(csv_path: Path) -> pd.DataFrame:
    """
    Load an ACS CSV.  Row 1 is a human-readable label row -- skip it.
    Returns a DataFrame with columns: geoid, population, median_income, median_age.
    """
    df = pd.read_csv(csv_path, dtype=str, low_memory=False)
    # Drop the Census label row (second row, value starts with 'Geography')
    if len(df) > 0 and str(df.iloc[0, 0]).lower().startswith(("id", "geo")):
        df = df.iloc[1:].reset_index(drop=True)

    # Normalise GEOID: Census exports "1500000US480530001001" -- strip prefix
    if "GEO_ID" in df.columns:
        df["geoid"] = df["GEO_ID"].str.replace(r".*US", "", regex=True)
    elif "GEOID" in df.columns:
        df["geoid"] = df["GEOID"].astype(str)
    else:
        raise KeyError("Cannot find GEO_ID or GEOID column in ACS CSV.")

    # Best-effort column detection (table layout varies by year/table code)
    col_pop = col_inc = col_age = None
    for col in df.columns:
        cu = col.upper()
        if col_pop is None and any(k in cu for k in ("B01003", "S0101_C01_001", "DP05_0001")):
            col_pop = col
        if col_inc is None and any(k in cu for k in ("B19013", "DP03_0062", "MEDIAN_HOUSEHOLD")):
            col_inc = col
        if col_age is None and any(k in cu for k in ("B01002", "S0101_C01_032", "MEDIAN_AGE")):
            col_age = col

    out = pd.DataFrame()
    out["geoid"]        = df["geoid"]
    out["population"]   = pd.to_numeric(df[col_pop]  if col_pop else None, errors="coerce").astype("Int64")
    out["median_income"]= pd.to_numeric(df[col_inc]  if col_inc else None, errors="coerce").astype("Int64")
    out["median_age"]   = pd.to_numeric(df[col_age]  if col_age else None, errors="coerce")
    return out


def main() -> int:
    csv_path = _find_csv(RAW_DIR)
    shp_path = _find_shapefile(RAW_DIR)

    if csv_path is None or shp_path is None:
        missing = []
        if csv_path is None:
            missing.append("ACS CSV")
        if shp_path is None:
            missing.append("TIGER shapefile (.shp)")
        logger.error("Missing raw data: %s", ", ".join(missing))
        print(DOWNLOAD_MSG.format(raw_dir=RAW_DIR.resolve()))
        return 1

    logger.info("ACS CSV   : %s", csv_path)
    logger.info("Shapefile : %s", shp_path)

    engine = get_engine()
    ensure_schema(engine)

    with log_step("load ACS CSV"):
        acs = _load_acs(csv_path)
        logger.info("ACS rows loaded: %d", len(acs))

    with log_step("load TIGER shapefile"):
        gdf: gpd.GeoDataFrame = gpd.read_file(str(shp_path))
        if gdf.crs is None:
            gdf = gdf.set_crs(epsg=4326)
        elif gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(epsg=4326)
        if "GEOID" in gdf.columns:
            gdf = gdf.rename(columns={"GEOID": "geoid"})
        gdf["geoid"] = gdf["geoid"].astype(str)

    with log_step("join ACS + TIGER on geoid"):
        merged = gdf.merge(acs, on="geoid", how="inner")
        merged = merged[["geoid", "population", "median_income", "median_age", "geometry"]]

    with log_step("clip to metro bbox"):
        merged = clip_to_metro(merged)

    if len(merged) == 0:
        logger.error(
            "No block groups remain after clipping to METRO.bbox=%s -- "
            "check that your shapefile covers Travis County.", METRO.bbox
        )
        return 1

    with log_step(f"write PostGIS {SCHEMA}.{TABLE}"):
        write_geodf(merged, table=TABLE, schema=SCHEMA, engine=engine)

    with log_step("create GiST index on geometry"):
        with engine.begin() as conn:
            conn.execute(text(
                f"CREATE INDEX IF NOT EXISTS idx_{TABLE}_geom "
                f"ON {SCHEMA}.{TABLE} USING GIST (geometry);"
            ))

    logger.info(
        "Done. rows=%d  bbox=%s",
        len(merged),
        merged.total_bounds.tolist(),
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
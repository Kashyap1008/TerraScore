"""
pipeline/01_ingest_census.py
-----------------------------
Ingest ACS 5-yr demographic data + TIGER block-group shapefiles for
Travis County, TX into PostGIS table raw.demographics_blocks.

REQUIRES (place in pipeline/data/raw/census/):
  - ACS CSV:   e.g. ACSST5Y2022.S0101_data.csv  (DP03/S0101 tables)
  - TIGER shp: e.g. tl_2022_48453_bg.shp         (Travis County, FIPS 48453)

If either file is missing the script prints download instructions and exits 1.
Never auto-downloads data.
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

import geopandas as gpd
import pandas as pd
from sqlalchemy import text

from pipeline.config import METRO
from pipeline.utils import clip_to_metro, ensure_schema, get_engine, log_step, write_geodf

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s -- %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

RAW_DIR = Path(__file__).parent / "data" / "raw" / "census"
TABLE = "demographics_blocks"
SCHEMA = "raw"

DOWNLOAD_MSG = """
============================================================
MISSING DATA — ACTION REQUIRED
============================================================
Download the following files and place them in:
  {raw_dir}

1. ACS 5-Year Estimates — Travis County, TX
   Table: S0101 (Age & Sex) and/or DP03 (Economic Characteristics)
   URL:   https://data.census.gov/table/ACSST5Y2022.S0101
   File:  ACSST5Y2022.S0101_data.csv  (download CSV + metadata)

2. TIGER/Line Block Groups — Travis County, TX (FIPS: 48453)
   URL:   https://www2.census.gov/geo/tiger/TIGER2022/BG/tl_2022_48453_bg.zip
   File:  tl_2022_48453_bg.shp (unzip into the census/ folder)

After downloading, re-run:  python pipeline/01_ingest_census.py
============================================================
""".strip()


def _find_csv(directory: Path) -> Path | None:
    """Return the first CSV that looks like an ACS data file."""
    candidates = list(directory.glob("*data*.csv")) + list(directory.glob("*.csv"))
    return candidates[0] if candidates else None


def _find_shapefile(directory: Path) -> Path | None:
    """Return the first .shp file found."""
    candidates = list(directory.glob("*.shp"))
    return candidates[0] if candidates else None


def _load_acs(csv_path: Path) -> pd.DataFrame:
    """
    Load an ACS CSV export.
    Row 0 is the header, row 1 is the column-description row (skip it).
    Extracts: GEO_ID -> geoid, population, median_income, median_age.
    """
    df = pd.read_csv(csv_path, dtype=str, low_memory=False)
    # Drop the human-readable label row that Census CSVs include
    if df.iloc[0, 0].startswith("id"):
        df = df.iloc[1:].reset_index(drop=True)

    # Normalise GEOID: Census uses "1500000US480530001001" format — strip prefix
    if "GEO_ID" in df.columns:
        df["geoid"] = df["GEO_ID"].str.replace(r".*US", "", regex=True)
    elif "GEOID" in df.columns:
        df["geoid"] = df["GEOID"].astype(str)
    else:
        raise KeyError("Cannot find GEO_ID or GEOID column in ACS CSV.")

    # Best-effort column mapping — Census table layouts vary by year/table
    col_map: dict[str, str] = {}
    for col in df.columns:
        cu = col.upper()
        if "B01003" in cu or ("S0101_C01_001" in cu and "population" not in col_map):
            col_map["population"] = col
        if "B19013" in cu or "MEDIAN_HOUSEHOLD_INCOME" in cu or "DP03_0062" in cu:
            col_map["median_income"] = col
        if "B01002" in cu or "MEDIAN_AGE" in cu or "S0101_C01_032" in cu:
            col_map["median_age"] = col

    out = pd.DataFrame()
    out["geoid"] = df["geoid"]
    out["population"] = pd.to_numeric(df.get(col_map.get("population", "__missing__"), None), errors="coerce").astype("Int64")
    out["median_income"] = pd.to_numeric(df.get(col_map.get("median_income", "__missing__"), None), errors="coerce").astype("Int64")
    out["median_age"] = pd.to_numeric(df.get(col_map.get("median_age", "__missing__"), None), errors="coerce")
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
        logger.error("Missing: %s", ", ".join(missing))
        print(DOWNLOAD_MSG.format(raw_dir=RAW_DIR.resolve()))
        return 1

    logger.info("ACS CSV:  %s", csv_path)
    logger.info("Shapefile: %s", shp_path)

    engine = get_engine()
    ensure_schema(engine)

    with log_step("load ACS CSV"):
        acs = _load_acs(csv_path)
        logger.info("ACS rows: %d", len(acs))

    with log_step("load TIGER shapefile"):
        gdf = gpd.read_file(str(shp_path))
        if gdf.crs is None:
            gdf = gdf.set_crs(epsg=4326)
        elif gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(epsg=4326)
        # Normalise GEOID column name
        if "GEOID" in gdf.columns:
            gdf = gdf.rename(columns={"GEOID": "geoid"})
        gdf["geoid"] = gdf["geoid"].astype(str)

    with log_step("join ACS + TIGER"):
        merged = gdf.merge(acs, on="geoid", how="inner")
        merged = merged[["geoid", "population", "median_income", "median_age", "geometry"]]

    with log_step("clip to metro bbox"):
        merged = clip_to_metro(merged)
        logger.info("Rows after clip: %d", len(merged))

    if len(merged) == 0:
        logger.error("No block groups remain after clipping to METRO.bbox=%s", METRO.bbox)
        return 1

    with log_step(f"write PostGIS {SCHEMA}.{TABLE}"):
        write_geodf(merged, table=TABLE, schema=SCHEMA, engine=engine)

    with log_step("create GiST index"):
        with engine.begin() as conn:
            conn.execute(text(
                f"CREATE INDEX IF NOT EXISTS idx_{TABLE}_geom "
                f"ON {SCHEMA}.{TABLE} USING GIST (geometry);"
            ))

    logger.info(
        "Done. %d rows written. bbox=%s",
        len(merged),
        merged.total_bounds.tolist(),
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

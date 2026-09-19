"""
pipeline/06_build_h3_grid.py
-----------------------------
THE MASTER GRID BUILDER.

Generates one row per H3 res-9 cell covering the Austin metro and populates
all raw feature columns. Score columns (score_retail, etc.) remain NULL here
-- they are filled by 07_score_grid.py.

Raw tables consumed (must already exist -- run ingest scripts first):
  raw.demographics_blocks
  raw.roads
  raw.transit_stops
  raw.pois
  raw.flood_zones
  raw.air_quality

Output: derived.h3_grid  (see DESIGN.md §2 for full schema)

Vectorized throughout: spatial joins via GeoPandas sjoin / sjoin_nearest.
No Python for-loops over individual cells for spatial operations.
"""
from __future__ import annotations

import logging
import math
import sys
from typing import Any

import geopandas as gpd
import h3
import numpy as np
import pandas as pd
from shapely.geometry import Polygon
from sqlalchemy import inspect as sa_inspect, text

from pipeline.config import METRO
from pipeline.utils import ensure_schema, get_engine, log_step

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s -- %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

COMPETITOR_CATEGORIES = frozenset({
    "supermarket", "convenience", "department_store", "mall",
    "fuel", "restaurant", "fast_food", "cafe",
    "car", "electronics", "clothes",
})
ANCHOR_CATEGORIES = frozenset({
    "department_store", "mall", "university", "hospital", "cinema",
})
HIGHWAY_MAJOR = frozenset({"motorway", "trunk"})

HALF_LIFE_COMP_M = 500.0   # Gaussian decay half-life for competitor scoring


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _check_table(engine: Any, schema: str, table: str) -> None:
    """Raise RuntimeError if a required raw table is missing or empty."""
    inspector = sa_inspect(engine)
    tables = inspector.get_table_names(schema=schema)
    if table not in tables:
        raise RuntimeError(
            f"Required table '{schema}.{table}' does not exist. "
            f"Run the corresponding ingest script first."
        )
    with engine.connect() as conn:
        n = conn.execute(text(f"SELECT COUNT(*) FROM {schema}.{table};")).scalar()
    if n == 0:
        raise RuntimeError(
            f"Table '{schema}.{table}' exists but has 0 rows. "
            f"Re-run the ingest script to populate it."
        )
    logger.info("  %s.%s: %d rows OK", schema, table, n)


def _gaussian_decay(dist_m: np.ndarray, half_life_m: float) -> np.ndarray:
    """f(d) = exp( -ln(2) * (d / h)^2 )"""
    return np.exp(-math.log(2) * (dist_m / half_life_m) ** 2)


def _h3_cells_for_metro() -> list[str]:
    """Return all H3 res-9 cells whose center falls within METRO.bbox."""
    minlon, minlat, maxlon, maxlat = METRO.bbox
    # h3.polyfill_box is available in h3-py 4.x
    # Fall back to manual polyfill with bbox polygon
    try:
        cells = list(h3.geo_to_cells(
            {"type": "Polygon", "coordinates": [[
                [minlon, minlat], [maxlon, minlat],
                [maxlon, maxlat], [minlon, maxlat],
                [minlon, minlat],
            ]]},
            METRO.h3_resolution,
        ))
    except AttributeError:
        # h3-py 3.x API
        cells = list(h3.polyfill_geojson(
            {"type": "Polygon", "coordinates": [[
                [minlon, minlat], [maxlon, minlat],
                [maxlon, maxlat], [minlon, maxlat],
                [minlon, minlat],
            ]]},
            METRO.h3_resolution,
        ))
    return cells


def _cells_to_gdf(cells: list[str]) -> gpd.GeoDataFrame:
    """Build a GeoDataFrame with one row per H3 cell."""
    rows = []
    for cell in cells:
        try:
            lat, lon = h3.cell_to_latlng(cell)
        except AttributeError:
            lat, lon = h3.h3_to_geo(cell)
        try:
            boundary = h3.cell_to_boundary(cell)
        except AttributeError:
            boundary = h3.h3_to_geo_boundary(cell)
        # boundary is list of (lat, lon) -- shapely wants (lon, lat)
        poly = Polygon([(lng, lat_) for lat_, lng in boundary])
        rows.append({"h3_index": cell, "lat": lat, "lon": lon, "geometry": poly})

    return gpd.GeoDataFrame(rows, geometry="geometry", crs=4326)


def _cell_area_km2(gdf: gpd.GeoDataFrame) -> pd.Series:
    """Return approximate area in km2 for each cell via UTM projection."""
    gdf_proj = gdf.to_crs(epsg=METRO.utm_epsg)
    return gdf_proj.geometry.area / 1_000_000  # m2 -> km2


# ---------------------------------------------------------------------------
# Feature builders (all vectorized)
# ---------------------------------------------------------------------------

def build_population_features(
    grid: gpd.GeoDataFrame,
    engine: Any,
) -> gpd.GeoDataFrame:
    """Attach pop_density, pop_10/20/30min, median_income, median_age."""
    logger.info("  Loading demographics_blocks ...")
    blocks = gpd.read_postgis(
        "SELECT geoid, population, median_income, median_age, geometry "
        "FROM raw.demographics_blocks",
        engine, geom_col="geometry", crs=4326,
    )
    blocks["pop"] = pd.to_numeric(blocks["population"], errors="coerce").fillna(0)
    blocks["inc"] = pd.to_numeric(blocks["median_income"], errors="coerce")
    blocks["age"] = pd.to_numeric(blocks["median_age"], errors="coerce")
    blocks["centroid"] = blocks.geometry.centroid
    centroids = blocks.copy()
    centroids["geometry"] = blocks["centroid"]

    # pop_density: blocks whose centroid falls inside each cell
    joined = gpd.sjoin(centroids, grid[["h3_index", "geometry"]], how="inner", predicate="within")
    pop_per_cell = joined.groupby("h3_index").agg(
        pop_sum=("pop", "sum"),
        inc_mean=("inc", "mean"),
        age_mean=("age", "mean"),
    )

    cell_areas = _cell_area_km2(grid)
    grid = grid.copy()
    grid["cell_area_km2"] = cell_areas.values

    grid = grid.merge(pop_per_cell, on="h3_index", how="left")
    grid["pop_density"]   = (grid["pop_sum"] / grid["cell_area_km2"]).fillna(0)
    grid["median_income"] = grid["inc_mean"]
    grid["median_age"]    = grid["age_mean"]

    # pop_10/20/30 min: approximate via H3 ring distance
    # ring 1 ≈ 10 min walk, ring 2 ≈ 20 min, ring 3 ≈ 30 min
    h3_to_pop: dict[str, float] = dict(zip(joined["h3_index"], joined["pop"]))

    def ring_pop(cell: str, k: int) -> float:
        try:
            ring = h3.grid_disk(cell, k)
        except AttributeError:
            ring = h3.k_ring(cell, k)
        return sum(h3_to_pop.get(c, 0) for c in ring)

    # Build lookup from h3_index -> pop_sum for this grid
    idx_pop = dict(zip(joined["h3_index"], joined["pop"]))
    grid["pop_10min"] = grid["h3_index"].apply(lambda c: ring_pop(c, 1))
    grid["pop_20min"] = grid["h3_index"].apply(lambda c: ring_pop(c, 2))
    grid["pop_30min"] = grid["h3_index"].apply(lambda c: ring_pop(c, 3))

    return grid


def build_accessibility_features(
    grid: gpd.GeoDataFrame,
    engine: Any,
) -> gpd.GeoDataFrame:
    """Attach road_density, dist_to_highway_m, transit_count_800m."""
    logger.info("  Loading roads + transit_stops ...")
    roads = gpd.read_postgis(
        "SELECT osm_id, highway_class, geometry FROM raw.roads",
        engine, geom_col="geometry", crs=4326,
    )
    transit = gpd.read_postgis(
        "SELECT osm_id, route_type, geometry FROM raw.transit_stops",
        engine, geom_col="geometry", crs=4326,
    )

    grid = grid.copy()
    grid_proj = grid.to_crs(epsg=METRO.utm_epsg)
    roads_proj = roads.to_crs(epsg=METRO.utm_epsg)

    # road_density: total road length in cell / cell_area_km2
    road_in_cell = gpd.sjoin(roads_proj, grid_proj[["h3_index", "geometry"]], how="inner", predicate="intersects")
    road_in_cell["length_m"] = road_in_cell.geometry.length
    density = road_in_cell.groupby("h3_index")["length_m"].sum() / grid.set_index("h3_index")["cell_area_km2"]
    grid["road_density"] = grid["h3_index"].map(density).fillna(0)

    # dist_to_highway_m: nearest motorway/trunk to cell center
    major_roads = roads_proj[roads_proj["highway_class"].isin(HIGHWAY_MAJOR)].copy()
    cell_centers = grid_proj.copy()
    cell_centers["geometry"] = grid_proj.geometry.centroid

    if len(major_roads) > 0:
        nearest = gpd.sjoin_nearest(
            cell_centers[["h3_index", "geometry"]],
            major_roads[["geometry"]],
            how="left",
            distance_col="dist_hw",
        )
        nearest = nearest.drop_duplicates("h3_index")
        grid["dist_to_highway_m"] = grid["h3_index"].map(
            dict(zip(nearest["h3_index"], nearest["dist_hw"]))
        ).fillna(99999)
    else:
        grid["dist_to_highway_m"] = 99999.0

    # transit_count_800m: count of transit stops within 800 m of center
    transit_proj = transit.to_crs(epsg=METRO.utm_epsg)
    cell_centers_800 = cell_centers.copy()
    cell_centers_800["geometry"] = cell_centers_800.geometry.buffer(800)
    tc = gpd.sjoin(transit_proj, cell_centers_800[["h3_index", "geometry"]], how="inner", predicate="within")
    tc_count = tc.groupby("h3_index").size()
    grid["transit_count_800m"] = grid["h3_index"].map(tc_count).fillna(0).astype(int)

    return grid


def build_competition_features(
    grid: gpd.GeoDataFrame,
    engine: Any,
) -> gpd.GeoDataFrame:
    """Attach competitor_count_1km, competitor_decay_score, anchor_count_1km."""
    logger.info("  Loading pois ...")
    pois = gpd.read_postgis(
        "SELECT osm_id, category, brand, geometry FROM raw.pois",
        engine, geom_col="geometry", crs=4326,
    )

    competitors = pois[pois["category"].isin(COMPETITOR_CATEGORIES)].copy()
    anchors     = pois[pois["category"].isin(ANCHOR_CATEGORIES)].copy()

    grid = grid.copy()
    grid_proj = grid.to_crs(epsg=METRO.utm_epsg)
    cell_centers = grid_proj.copy()
    cell_centers["geometry"] = grid_proj.geometry.centroid
    cell_1km = cell_centers.copy()
    cell_1km["geometry"] = cell_centers.geometry.buffer(1000)

    def _count_in_buffer(
        poi_gdf: gpd.GeoDataFrame,
        buffer_gdf: gpd.GeoDataFrame,
    ) -> pd.Series:
        if len(poi_gdf) == 0:
            return pd.Series(0, index=buffer_gdf["h3_index"])
        poi_proj = poi_gdf.to_crs(epsg=METRO.utm_epsg)
        joined = gpd.sjoin(poi_proj, buffer_gdf[["h3_index", "geometry"]], how="inner", predicate="within")
        return joined.groupby("h3_index").size()

    comp_count = _count_in_buffer(competitors, cell_1km)
    anch_count = _count_in_buffer(anchors, cell_1km)

    grid["competitor_count_1km"] = grid["h3_index"].map(comp_count).fillna(0).astype(int)
    grid["anchor_count_1km"]     = grid["h3_index"].map(anch_count).fillna(0).astype(int)

    # competitor_decay_score: Gaussian decay sum over competitors within 1 km
    if len(competitors) > 0:
        comp_proj = competitors.to_crs(epsg=METRO.utm_epsg)
        joined_decay = gpd.sjoin_nearest(
            comp_proj[["geometry"]],
            cell_centers[["h3_index", "geometry"]],
            how="left",
            distance_col="dist_m",
        )
        joined_decay["decay"] = _gaussian_decay(
            joined_decay["dist_m"].values, HALF_LIFE_COMP_M
        )
        decay_sum = joined_decay.groupby("h3_index")["decay"].sum()
        grid["competitor_decay_score"] = grid["h3_index"].map(decay_sum).fillna(0)
    else:
        grid["competitor_decay_score"] = 0.0

    return grid


def build_landuse_features(
    grid: gpd.GeoDataFrame,
    engine: Any,
) -> gpd.GeoDataFrame:
    """Attach zone_class: dominant landuse category by overlap area."""
    logger.info("  Loading landuse ...")
    landuse = gpd.read_postgis(
        "SELECT osm_id, zone_class, geometry FROM raw.landuse",
        engine, geom_col="geometry", crs=4326,
    )
    grid = grid.copy()
    if len(landuse) == 0:
        grid["zone_class"]     = "unknown"
        grid["zone_suitability"] = 0.5
        return grid

    lu_proj   = landuse.to_crs(epsg=METRO.utm_epsg)
    grid_proj = grid.to_crs(epsg=METRO.utm_epsg)
    overlaps  = gpd.overlay(grid_proj[["h3_index", "geometry"]], lu_proj[["zone_class", "geometry"]], how="intersection")
    overlaps["area"] = overlaps.geometry.area
    dominant = (
        overlaps.sort_values("area", ascending=False)
        .drop_duplicates("h3_index")
        .set_index("h3_index")["zone_class"]
    )
    grid["zone_class"] = grid["h3_index"].map(dominant).fillna("unknown")

    # Simple suitability score (retail-oriented default)
    suit_map = {
        "commercial": 0.9, "retail": 0.95, "mixed": 0.8,
        "industrial": 0.5, "residential": 0.4,
        "recreation_ground": 0.3, "park": 0.2,
        "farmland": 0.1, "unknown": 0.5,
    }
    grid["zone_suitability"] = grid["zone_class"].map(suit_map).fillna(0.5)
    return grid


def build_environmental_features(
    grid: gpd.GeoDataFrame,
    engine: Any,
    has_flood: bool,
    has_aqi: bool,
) -> gpd.GeoDataFrame:
    """Attach flood_risk and aqi_score."""
    grid = grid.copy()

    # flood_risk
    if has_flood:
        logger.info("  Loading flood_zones ...")
        flood = gpd.read_postgis(
            "SELECT zone_code, risk_level, geometry FROM raw.flood_zones",
            engine, geom_col="geometry", crs=4326,
        )
        flood["risk_val"] = flood["risk_level"].map(
            {"high": 1.0, "medium": 0.5, "low": 0.0}
        ).fillna(0.0)

        risk_join = gpd.sjoin(
            flood[["risk_val", "geometry"]],
            grid[["h3_index", "geometry"]],
            how="right",
            predicate="intersects",
        )
        max_risk = risk_join.groupby("h3_index")["risk_val"].max()
        grid["flood_risk"] = grid["h3_index"].map(max_risk).fillna(0.0)
    else:
        logger.warning("flood_zones table missing -- flood_risk set to 0.")
        grid["flood_risk"] = 0.0

    # aqi_score: IDW from monitors within 5 km
    if has_aqi:
        logger.info("  Loading air_quality ...")
        aqi = gpd.read_postgis(
            "SELECT monitor_id, pollutant, value, geometry FROM raw.air_quality",
            engine, geom_col="geometry", crs=4326,
        )
        if len(aqi) > 0:
            aqi_proj  = aqi.to_crs(epsg=METRO.utm_epsg)
            grid_proj = grid.to_crs(epsg=METRO.utm_epsg)
            cell_centers = grid_proj.copy()
            cell_centers["geometry"] = grid_proj.geometry.centroid

            # sjoin_nearest for each monitor -> cell; then IDW aggregate
            joined = gpd.sjoin_nearest(
                aqi_proj[["value", "geometry"]],
                cell_centers[["h3_index", "geometry"]],
                how="left",
                distance_col="dist_m",
                max_distance=5000,
            )
            joined = joined[joined["dist_m"] > 0]  # avoid div/0
            joined["weight"] = 1.0 / joined["dist_m"]
            joined["wval"]   = joined["weight"] * joined["value"]
            idw = joined.groupby("h3_index").apply(
                lambda g: g["wval"].sum() / g["weight"].sum()
            )
            grid["aqi_score"] = grid["h3_index"].map(idw).fillna(0.0)
        else:
            grid["aqi_score"] = 0.0
    else:
        logger.warning("air_quality table missing -- aqi_score set to 0.")
        grid["aqi_score"] = 0.0

    return grid


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> int:  # noqa: C901
    engine = get_engine()
    ensure_schema(engine)

    # --- Validate required tables ---
    REQUIRED = [
        ("raw", "demographics_blocks"),
        ("raw", "roads"),
        ("raw", "transit_stops"),
        ("raw", "pois"),
    ]
    OPTIONAL = [
        ("raw", "flood_zones"),
        ("raw", "air_quality"),
    ]

    logger.info("Checking required raw tables ...")
    for schema, table in REQUIRED:
        try:
            _check_table(engine, schema, table)
        except RuntimeError as e:
            logger.error(str(e))
            return 1

    has_flood = has_aqi = True
    inspector = sa_inspect(engine)
    for schema, table in OPTIONAL:
        tables = inspector.get_table_names(schema=schema)
        if table not in tables:
            logger.warning("Optional table %s.%s missing -- will use fallback.", schema, table)
            if table == "flood_zones":
                has_flood = False
            if table == "air_quality":
                has_aqi = False

    # --- Generate H3 cells ---
    with log_step("generate H3 cells"):
        cells = _h3_cells_for_metro()
        logger.info("H3 cells in bbox: %d", len(cells))
        grid = _cells_to_gdf(cells)

    # --- Feature blocks ---
    with log_step("population features"):
        grid = build_population_features(grid, engine)

    with log_step("accessibility features"):
        grid = build_accessibility_features(grid, engine)

    with log_step("competition + complementarity features"):
        grid = build_competition_features(grid, engine)

    with log_step("land use features"):
        grid = build_landuse_features(grid, engine)

    with log_step("environmental features (flood + AQI)"):
        grid = build_environmental_features(grid, engine, has_flood, has_aqi)

    # --- Add NULL score columns (filled by 07_score_grid.py) ---
    for col in ["score_retail", "score_warehouse", "score_ev",
                "hotspot_z_retail", "hotspot_z_warehouse", "hotspot_z_ev"]:
        grid[col] = np.nan

    # --- Write to derived.h3_grid ---
    with log_step("write derived.h3_grid"):
        grid.to_postgis(
            name="h3_grid",
            schema="derived",
            con=engine,
            if_exists="replace",
            index=False,
        )

    with log_step("create indexes"):
        with engine.begin() as conn:
            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_h3_grid_geom "
                "ON derived.h3_grid USING GIST (geometry);"
            ))
            conn.execute(text(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_h3_grid_h3index "
                "ON derived.h3_grid (h3_index);"
            ))

    logger.info(
        "Done. rows=%d  pop_density: mean=%.1f  dist_highway: min=%.0f max=%.0f",
        len(grid),
        grid["pop_density"].mean(),
        grid["dist_to_highway_m"].min(),
        grid["dist_to_highway_m"].max(),
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
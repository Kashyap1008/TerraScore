"""
pipeline/07_score_grid.py
-------------------------
Calculates readiness scores (0-100) for all H3 cells in derived.h3_grid across
all presets (retail, warehouse, ev_charging) using the multi-factor spatial model:

Factors:
  1. Demand (population density, income, age)
  2. Accessibility (road density, highway proximity, transit access)
  3. Competition (Inverted-U sweet-spot model based on competitor decay score)
  4. Complementarity (Anchor tenants & complementary POIs saturating curve)
  5. Land Use (Zoning suitability)
  6. Risk & Constraints (Flood risk & AQI multiplier penalties)

Updates:
  derived.h3_grid (score_retail, score_warehouse, score_ev)
"""
from __future__ import annotations

import json
import logging
import math
import os
import sys
from pathlib import Path
from typing import Any, Dict

import geopandas as gpd
import numpy as np
import pandas as pd
from sqlalchemy import text

from pipeline.utils import get_engine, log_step

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s -- %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

PRESETS_PATH = Path("backend/config/presets.json")

DEFAULT_PRESETS = {
    "retail": {
        "label": "Retail Store",
        "weights": {
            "demand": 0.30,
            "accessibility": 0.15,
            "competition": 0.20,
            "complementarity": 0.20,
            "landuse": 0.10,
            "risk": 0.05,
        },
        "params": {
            "competition_optimum": 3.0,
            "competition_sigma": 2.0,
            "walk_half_life_m": 600,
            "drive_half_life_m": 3000,
        },
    },
    "warehouse": {
        "label": "Warehouse",
        "weights": {
            "demand": 0.05,
            "accessibility": 0.45,
            "competition": 0.05,
            "complementarity": 0.05,
            "landuse": 0.25,
            "risk": 0.15,
        },
        "params": {
            "drive_half_life_m": 8000,
            "highway_weight": 3.0,
        },
    },
    "ev_charging": {
        "label": "EV Charging",
        "weights": {
            "demand": 0.25,
            "accessibility": 0.30,
            "competition": 0.25,
            "complementarity": 0.05,
            "landuse": 0.10,
            "risk": 0.05,
        },
        "params": {
            "competition_optimum": 1.0,
            "competition_sigma": 1.5,
        },
    },
}


def load_presets() -> Dict[str, Any]:
    """Load use-case presets from backend/config/presets.json or return defaults."""
    if PRESETS_PATH.exists():
        try:
            with open(PRESETS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning("Could not read %s (%s). Using defaults.", PRESETS_PATH, e)
    return DEFAULT_PRESETS


def min_max_normalize(series: pd.Series) -> pd.Series:
    """Normalize series to [0, 1]. Returns 0.5 if all values equal."""
    s_min = series.min()
    s_max = series.max()
    if pd.isna(s_min) or pd.isna(s_max) or s_max == s_min:
        return pd.Series(0.5, index=series.index)
    return (series - s_min) / (s_max - s_min)


def calculate_preset_score(df: pd.DataFrame, preset_key: str, preset_cfg: Dict[str, Any]) -> pd.Series:
    """
    Calculate 0-100 score for a single preset using vectorized operations.
    """
    weights = preset_cfg.get("weights", {})
    params = preset_cfg.get("params", {})

    w_demand = weights.get("demand", 0.0)
    w_access = weights.get("accessibility", 0.0)
    w_comp = weights.get("competition", 0.0)
    w_comp_ment = weights.get("complementarity", 0.0)
    w_landuse = weights.get("landuse", 0.0)
    w_risk = weights.get("risk", 0.0)

    # 1. Demand Sub-Score (0..1)
    # pop_density (normalized) + median_income fit
    pop_norm = min_max_normalize(df["pop_density"].fillna(0))
    inc_norm = min_max_normalize(df["median_income"].fillna(df["median_income"].median() or 50000))
    s_demand = 0.7 * pop_norm + 0.3 * inc_norm

    # 2. Accessibility Sub-Score (0..1)
    road_norm = min_max_normalize(df["road_density"].fillna(0))
    # Distance to highway: Gaussian decay (closer is better)
    hw_dist = df["dist_to_highway_m"].fillna(99999).clip(lower=0)
    hw_decay = np.exp(-np.log(2) * (hw_dist / params.get("drive_half_life_m", 3000)) ** 2)
    # Transit stops 800m
    transit_norm = min_max_normalize(df["transit_count_800m"].fillna(0))
    if preset_key == "warehouse":
        s_access = 0.2 * road_norm + 0.7 * hw_decay + 0.1 * transit_norm
    else:
        s_access = 0.4 * road_norm + 0.3 * hw_decay + 0.3 * transit_norm

    # 3. Competition Sub-Score (0..1) - Inverted-U
    c_opt = params.get("competition_optimum", 3.0)
    c_sigma = params.get("competition_sigma", 2.0)
    comp_pressure = df["competitor_decay_score"].fillna(0)
    s_comp = np.exp(-((comp_pressure - c_opt) ** 2) / (2 * (c_sigma ** 2)))

    # 4. Complementarity Sub-Score (0..1) - Saturating curve: 1 - exp(-lambda * C)
    anchors = df["anchor_count_1km"].fillna(0)
    s_comp_ment = 1.0 - np.exp(-0.5 * anchors)

    # 5. Land Use Sub-Score (0..1)
    if preset_key == "warehouse":
        lu_map = {
            "industrial": 1.0,
            "commercial": 0.7,
            "mixed": 0.5,
            "retail": 0.4,
            "residential": 0.1,
            "farmland": 0.3,
            "unknown": 0.5,
        }
        s_landuse = df["zone_class"].map(lu_map).fillna(0.5)
    elif preset_key == "ev_charging":
        lu_map = {
            "commercial": 1.0,
            "retail": 0.95,
            "mixed": 0.85,
            "industrial": 0.7,
            "residential": 0.6,
            "unknown": 0.5,
        }
        s_landuse = df["zone_class"].map(lu_map).fillna(0.5)
    else:  # retail
        s_landuse = df["zone_suitability"].fillna(0.5)

    # Weighted Sum of sub-scores (0..1)
    raw_score = (
        w_demand * s_demand
        + w_access * s_access
        + w_comp * s_comp
        + w_comp_ment * s_comp_ment
        + w_landuse * s_landuse
    )

    # 6. Multiplier Penalties (Hard Constraints)
    # Flood risk (0.0 to 1.0) -> high flood reduces score by up to 65%
    flood_risk = df["flood_risk"].fillna(0.0).clip(0.0, 1.0)
    flood_mult = 1.0 - 0.65 * flood_risk

    # AQI penalty: worst decile gets up to 15% reduction
    aqi = df["aqi_score"].fillna(0.0)
    aqi_90th = aqi.quantile(0.90) if len(aqi) > 0 else 0
    aqi_mult = np.where(aqi >= aqi_90th, 0.85, 1.0)

    # Combined penalty multiplier
    penalty_multiplier = flood_mult * aqi_mult

    final_score = np.clip(100.0 * raw_score * penalty_multiplier, 0.0, 100.0).round(1)
    return final_score


def main() -> int:
    engine = get_engine()
    logger.info("Connecting to PostGIS to read derived.h3_grid ...")

    with engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM derived.h3_grid;")).scalar()
    if not count:
        logger.error("derived.h3_grid is empty. Run 06_build_h3_grid.py first.")
        return 1

    logger.info("Found %d cells in derived.h3_grid. Reading features...", count)
    df = pd.read_sql(
        "SELECT h3_index, pop_density, median_income, road_density, dist_to_highway_m, "
        "transit_count_800m, competitor_decay_score, anchor_count_1km, zone_class, "
        "zone_suitability, flood_risk, aqi_score FROM derived.h3_grid",
        engine,
    )

    presets = load_presets()

    with log_step("calculate scores for retail, warehouse, ev_charging"):
        score_retail = calculate_preset_score(df, "retail", presets.get("retail", {}))
        score_warehouse = calculate_preset_score(df, "warehouse", presets.get("warehouse", {}))
        score_ev = calculate_preset_score(df, "ev_charging", presets.get("ev_charging", presets.get("ev", {})))

        df["score_retail"] = score_retail
        df["score_warehouse"] = score_warehouse
        df["score_ev"] = score_ev

    with log_step("write scores to derived.h3_grid in PostGIS"):
        temp_table = "temp_scores"
        df[["h3_index", "score_retail", "score_warehouse", "score_ev"]].to_sql(
            temp_table,
            engine,
            schema="derived",
            if_exists="replace",
            index=False,
        )
        with engine.begin() as conn:
            conn.execute(text("""
                UPDATE derived.h3_grid g
                SET score_retail = t.score_retail,
                    score_warehouse = t.score_warehouse,
                    score_ev = t.score_ev
                FROM derived.temp_scores t
                WHERE g.h3_index = t.h3_index;
            """))
            conn.execute(text("DROP TABLE IF EXISTS derived.temp_scores;"))

    logger.info(
        "Successfully updated scores: retail (mean=%.1f), warehouse (mean=%.1f), EV (mean=%.1f)",
        score_retail.mean(),
        score_warehouse.mean(),
        score_ev.mean(),
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""
pipeline/08_hotspot_gi.py
-------------------------
Calculates Getis-Ord Gi* hot-spot / cold-spot spatial statistics on the H3 grid
for each preset score (retail, warehouse, ev).

Gi* Formula:
  Gi* = ( sum_{j in N(i)} x_j  -  X_bar * W_i ) / ( S * sqrt((n * W_i - W_i^2) / (n - 1)) )

where:
  - N(i) = H3 1-ring neighbors including cell i itself (h3.grid_disk(i, 1))
  - W_i = count of valid grid cells in N(i)
  - X_bar = global mean of scores
  - S = global standard deviation of scores
  - n = total number of cells in the metro grid

Cells with z > +1.96 are statistically significant hot-spots (p < 0.05).
Cells with z < -1.96 are statistically significant cold-spots (p < 0.05).

Updates:
  derived.h3_grid (hotspot_z_retail, hotspot_z_warehouse, hotspot_z_ev)
"""
from __future__ import annotations

import logging
import math
import sys
from typing import Dict, List, Set

import h3
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


def get_h3_disk(cell: str, k: int = 1) -> Set[str]:
    """Return k-ring disk around cell (including cell itself)."""
    try:
        return set(h3.grid_disk(cell, k))
    except AttributeError:
        return set(h3.k_ring(cell, k))


def compute_getis_ord_gi(
    cells: List[str],
    scores: np.ndarray,
) -> np.ndarray:
    """
    Computes Getis-Ord Gi* z-scores for all cells using H3 1-ring neighborhood.
    """
    n = len(cells)
    if n == 0:
        return np.array([], dtype=float)

    cell_to_idx: Dict[str, int] = {c: i for i, c in enumerate(cells)}

    x = np.nan_to_num(scores, nan=0.0)
    x_bar = np.mean(x)
    s = np.std(x)

    if s == 0 or n <= 1:
        return np.zeros(n, dtype=float)

    # Pre-build neighbor indices for each cell
    # Gi* includes cell i itself (queen contiguity + self)
    neighbor_indices: List[List[int]] = []
    for cell in cells:
        disk = get_h3_disk(cell, 1)
        valid_nbrs = [cell_to_idx[nbr] for nbr in disk if nbr in cell_to_idx]
        neighbor_indices.append(valid_nbrs)

    z_scores = np.zeros(n, dtype=float)

    for i in range(n):
        nbr_idx = neighbor_indices[i]
        w_i = len(nbr_idx)
        sum_xj = np.sum(x[nbr_idx])

        # Variance denominator component
        var_num = (n * w_i) - (w_i ** 2)
        var_denom = n - 1
        denom = s * math.sqrt(var_num / var_denom)

        if denom > 0:
            z_scores[i] = (sum_xj - x_bar * w_i) / denom
        else:
            z_scores[i] = 0.0

    return np.round(z_scores, 2)


def main() -> int:
    engine = get_engine()
    logger.info("Connecting to PostGIS to read derived.h3_grid ...")

    with engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM derived.h3_grid;")).scalar()
    if not count:
        logger.error("derived.h3_grid is empty. Run 06_build_h3_grid.py first.")
        return 1

    logger.info("Loading scores for %d cells ...", count)
    df = pd.read_sql(
        "SELECT h3_index, score_retail, score_warehouse, score_ev FROM derived.h3_grid",
        engine,
    )

    cells = df["h3_index"].tolist()

    with log_step("compute Getis-Ord Gi* for retail"):
        df["hotspot_z_retail"] = compute_getis_ord_gi(
            cells, df["score_retail"].fillna(0).to_numpy()
        )

    with log_step("compute Getis-Ord Gi* for warehouse"):
        df["hotspot_z_warehouse"] = compute_getis_ord_gi(
            cells, df["score_warehouse"].fillna(0).to_numpy()
        )

    with log_step("compute Getis-Ord Gi* for EV charging"):
        df["hotspot_z_ev"] = compute_getis_ord_gi(
            cells, df["score_ev"].fillna(0).to_numpy()
        )

    with log_step("write Gi* z-scores to derived.h3_grid in PostGIS"):
        temp_table = "temp_hotspots"
        df[["h3_index", "hotspot_z_retail", "hotspot_z_warehouse", "hotspot_z_ev"]].to_sql(
            temp_table,
            engine,
            schema="derived",
            if_exists="replace",
            index=False,
        )
        with engine.begin() as conn:
            conn.execute(text("""
                UPDATE derived.h3_grid g
                SET hotspot_z_retail = t.hotspot_z_retail,
                    hotspot_z_warehouse = t.hotspot_z_warehouse,
                    hotspot_z_ev = t.hotspot_z_ev
                FROM derived.temp_hotspots t
                WHERE g.h3_index = t.h3_index;
            """))
            conn.execute(text("DROP TABLE IF EXISTS derived.temp_hotspots;"))

    hot_retail = (df["hotspot_z_retail"] > 1.96).sum()
    cold_retail = (df["hotspot_z_retail"] < -1.96).sum()
    logger.info(
        "Done. Retail hotspots: %d (z>1.96), coldspots: %d (z<-1.96). Mean z=%.2f",
        hot_retail,
        cold_retail,
        df["hotspot_z_retail"].mean(),
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

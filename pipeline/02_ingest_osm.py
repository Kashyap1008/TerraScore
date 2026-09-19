"""
pipeline/02_ingest_osm.py
--------------------------
Stream texas-latest.osm.pbf once with pyosmium and write 4 raw layers:

  raw.roads          motorway / trunk / primary / secondary / tertiary / residential
  raw.transit_stops  bus stops, rail stations, public-transport platforms
  raw.pois           shops, amenities, tourism, leisure (nodes + way centroids)
  raw.landuse        landuse=* / building=* polygons

REQUIRES (place in pipeline/data/raw/osm/):
  texas-latest.osm.pbf
  URL: https://download.geofabrik.de/north-america/us/texas-latest.osm.pbf

If the file is missing the script prints the URL and exits 1.
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any

import geopandas as gpd
import osmium
import pandas as pd
from shapely.geometry import LineString, Point, Polygon
from shapely.wkb import loads as wkb_loads
from sqlalchemy import text

from pipeline.config import METRO
from pipeline.utils import clip_to_metro, ensure_schema, get_engine, log_step, write_geodf

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s -- %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

PBF_PATH  = Path(__file__).parent / "data" / "raw" / "osm" / "texas-latest.osm.pbf"
SCHEMA    = "raw"
GEOFABRIK = "https://download.geofabrik.de/north-america/us/texas-latest.osm.pbf"

DOWNLOAD_MSG = f"""
============================================================
MISSING DATA -- ACTION REQUIRED
============================================================
Download the Texas OSM PBF extract (~1 GB) and place it at:
  {PBF_PATH}

Download URL:
  {GEOFABRIK}

Example:
  wget -P pipeline/data/raw/osm/ {GEOFABRIK}

After downloading re-run:
  python pipeline/02_ingest_osm.py
============================================================
""".strip()

HIGHWAY_KEEP = frozenset({
    "motorway", "trunk", "primary", "secondary", "tertiary", "residential"
})

_wkb = osmium.geom.WKBFactory()
_minlon, _minlat, _maxlon, _maxlat = METRO.bbox


def _in_bbox(lon: float, lat: float) -> bool:
    return _minlon <= lon <= _maxlon and _minlat <= lat <= _maxlat


# ---------------------------------------------------------------------------
# Single-pass OSM handler
# ---------------------------------------------------------------------------

class MultiLayerHandler(osmium.SimpleHandler):
    """One PBF pass -- populates roads, transit, pois, and landuse lists."""

    def __init__(self) -> None:
        super().__init__()
        self.roads:   list[dict[str, Any]] = []
        self.transit: list[dict[str, Any]] = []
        self.pois:    list[dict[str, Any]] = []
        self.landuse: list[dict[str, Any]] = []

    # -- nodes ---------------------------------------------------------------
    def node(self, n: osmium.osm.Node) -> None:
        if not _in_bbox(n.location.lon, n.location.lat):
            return
        tags = {t.k: t.v for t in n.tags}
        pt: Point = Point(n.location.lon, n.location.lat)

        # Transit stops
        hw      = tags.get("highway", "")
        rw      = tags.get("railway", "")
        pt_tag  = tags.get("public_transport", "")
        if hw == "bus_stop" or rw in ("station", "halt") or pt_tag == "platform":
            self.transit.append({
                "osm_id":     n.id,
                "route_type": "rail" if rw in ("station", "halt") else "bus",
                "geometry":   pt,
            })

        # POIs
        if any(k in tags for k in ("shop", "amenity", "tourism", "leisure")):
            category = (
                tags.get("shop") or tags.get("amenity")
                or tags.get("tourism") or tags.get("leisure") or "unknown"
            )
            self.pois.append({
                "osm_id":   n.id,
                "category": category,
                "brand":    tags.get("brand", ""),
                "geometry": pt,
            })

    # -- ways ----------------------------------------------------------------
    def way(self, w: osmium.osm.Way) -> None:
        tags = {t.k: t.v for t in w.tags}

        # Build linestring geometry
        try:
            line_geom: LineString = wkb_loads(
                _wkb.create_linestring(w), hex=True
            )
        except Exception:
            return

        cx, cy = line_geom.centroid.x, line_geom.centroid.y
        if not _in_bbox(cx, cy):
            return

        hw  = tags.get("highway", "")
        lu  = tags.get("landuse", "")
        bld = tags.get("building", "")

        # Roads
        if hw in HIGHWAY_KEEP:
            self.roads.append({
                "osm_id":       w.id,
                "highway_class": hw,
                "geometry":     line_geom,
            })

        # Landuse / buildings (attempt polygon, fall back to line centroid)
        if lu or bld:
            try:
                poly_geom: Polygon = wkb_loads(
                    _wkb.create_multipolygon(w), hex=True
                )
            except Exception:
                poly_geom = line_geom
            self.landuse.append({
                "osm_id":    w.id,
                "zone_class": lu or bld,
                "geometry":  poly_geom,
            })

        # Way-level POIs (e.g. supermarket buildings)
        if any(k in tags for k in ("shop", "amenity", "tourism", "leisure")):
            category = (
                tags.get("shop") or tags.get("amenity")
                or tags.get("tourism") or tags.get("leisure") or "unknown"
            )
            self.pois.append({
                "osm_id":   w.id,
                "category": category,
                "brand":    tags.get("brand", ""),
                "geometry": line_geom.centroid,
            })


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_gdf(records: list[dict[str, Any]], crs: int = 4326) -> gpd.GeoDataFrame:
    df = pd.DataFrame(records)
    return gpd.GeoDataFrame(df, geometry="geometry", crs=crs)


def _gist(engine: Any, schema: str, table: str) -> None:
    with engine.begin() as conn:
        conn.execute(text(
            f"CREATE INDEX IF NOT EXISTS idx_{table}_geom "
            f"ON {schema}.{table} USING GIST (geometry);"
        ))
    logger.info("GiST index OK: %s.%s", schema, table)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> int:
    if not PBF_PATH.exists():
        print(DOWNLOAD_MSG)
        return 1

    engine = get_engine()
    ensure_schema(engine)

    with log_step("stream PBF -- single pass"):
        handler = MultiLayerHandler()
        handler.apply_file(str(PBF_PATH), locations=True, idx="flex_mem")

    layers: list[tuple[str, list[dict[str, Any]], str]] = [
        ("roads",         handler.roads,   "raw.roads"),
        ("transit_stops", handler.transit, "raw.transit_stops"),
        ("pois",          handler.pois,    "raw.pois"),
        ("landuse",       handler.landuse, "raw.landuse"),
    ]

    for table_name, records, label in layers:
        with log_step(f"write {label}"):
            gdf = _to_gdf(records)
            if not gdf.empty:
                gdf = clip_to_metro(gdf)
            logger.info("%s: %d rows after bbox clip", label, len(gdf))
            write_geodf(gdf, table=table_name, schema=SCHEMA, engine=engine)
            _gist(engine, SCHEMA, table_name)

    logger.info("OSM ingest complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
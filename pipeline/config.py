"""
pipeline/config.py
------------------
Metro-area configuration dataclass loaded from environment variables.
Import the module-level singleton ``METRO`` everywhere in the pipeline.
Never read os.environ directly in scripts.
"""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class MetroConfig:
    """Immutable description of the metro area being analysed."""

    name: str
    """Human-readable metro label, e.g. "Austin, TX"."""

    bbox: tuple[float, float, float, float]
    """(minlon, minlat, maxlon, maxlat) in EPSG:4326."""

    utm_epsg: int
    """Projected CRS for distance computations, e.g. 32614 (UTM 14N)."""

    h3_resolution: int
    """H3 grid resolution 0-15. Resolution 9 gives ~174 m edge length."""

    def __post_init__(self) -> None:
        minlon, minlat, maxlon, maxlat = self.bbox
        if not (-180 <= minlon < maxlon <= 180):
            raise ValueError(f"Invalid bbox longitude range: {minlon}, {maxlon}")
        if not (-90 <= minlat < maxlat <= 90):
            raise ValueError(f"Invalid bbox latitude range: {minlat}, {maxlat}")
        if not (0 <= self.h3_resolution <= 15):
            raise ValueError(f"H3 resolution must be 0-15, got {self.h3_resolution}")

    @property
    def shapely_box(self):
        """Return a Shapely box polygon for bbox clipping."""
        from shapely.geometry import box
        minlon, minlat, maxlon, maxlat = self.bbox
        return box(minlon, minlat, maxlon, maxlat)


def _parse_bbox(raw: str) -> tuple[float, float, float, float]:
    """Parse a comma-separated bbox string into a 4-tuple of floats."""
    parts = [s.strip() for s in raw.split(",")]
    if len(parts) != 4:
        raise ValueError(
            f"METRO_BBOX must be 'minlon,minlat,maxlon,maxlat'; got {raw!r}"
        )
    minlon, minlat, maxlon, maxlat = map(float, parts)
    return (minlon, minlat, maxlon, maxlat)


def _load() -> MetroConfig:
    bbox_raw: str = os.getenv("METRO_BBOX", "-98.05,30.10,-97.55,30.55")
    return MetroConfig(
        name=os.getenv("METRO_NAME", "Austin, TX"),
        bbox=_parse_bbox(bbox_raw),
        utm_epsg=int(os.getenv("UTM_EPSG", "32614")),
        h3_resolution=int(os.getenv("H3_RESOLUTION", "9")),
    )


#: Module-level singleton -- import this, do not construct MetroConfig yourself.
METRO: MetroConfig = _load()
"""
pipeline/utils.py
-----------------
Shared utilities for the offline ingestion pipeline.
No ingest logic here — only helpers consumed by multiple scripts.
"""
from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def get_data_dir(sub: str = "") -> Path:
    """Return absolute path to pipeline/data/<sub>, creating it if needed."""
    base = Path(__file__).parent / "data"
    target = base / sub if sub else base
    target.mkdir(parents=True, exist_ok=True)
    return target


def setup_logging(level: int = logging.INFO) -> None:
    """Configure root logger with a timestamped format."""
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

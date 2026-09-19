#!/usr/bin/env bash
set -e

echo "==> Exporting geospatial layers and tiles..."
python pipeline/09_export_tiles.py

echo "==> Tiles export complete."

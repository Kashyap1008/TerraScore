# Site Readiness Analyzer — PS-2

> Data-driven site selection for Austin, TX — powered by H3, PostGIS, OSRM, and a cyberpunk map.

## Team

| Name    | Role     |
|---------|----------|
| Kashyap | Data     |
| Megh    | Backend  |
| Rudra   | Map      |
| Aary    | UI       |

## Getting Started in 3 Commands

```bash
cp .env.example .env
make up
make demo
```

## What This Does

Site Readiness Analyzer scores every H3 cell (res 9, ~174 m edge) across the Austin metro for retail, warehouse, and EV-charging suitability, combining demand, accessibility, competition, land-use, and risk signals into a single 0–100 score. The backend serves sub-300 ms point lookups via a PostGIS primary-key join on a precomputed scoring grid, while the map frontend renders a neon choropleth over a dark base map and exposes weight sliders for live re-scoring. Hotspot detection (Getis-Ord Gi*) and OSRM-backed isochrones are computed on demand and cached in Redis.

## Prerequisites

The following tools must be installed and on your `PATH` before running `make ingest` or `make tiles`:

| Tool         | Used for                            | Install reference                              |
|--------------|-------------------------------------|------------------------------------------------|
| `ogr2ogr`    | Vector format conversion (GDAL)     | https://gdal.org/download.html                 |
| `osmium`     | OSM extract clipping & filtering    | https://osmcode.org/osmium-tool/               |
| `tippecanoe` | GeoJSON → PMTiles vector tile export| https://github.com/felt/tippecanoe             |
| `osrm-extract` / `osrm-partition` / `osrm-customize` | Preprocessing the Texas OSM road graph for OSRM | bundled in `osrm/osrm-backend` Docker image (run manually before `make up`) |

> **Note:** If any tool is missing, the relevant `make` target will fail at the first missing command. All other targets (`make up`, `make dev-backend`, `make dev-frontend`) work without these tools.

## Architecture

```
Raw sources  →  Ingest pipeline (Python)  →  PostGIS  →  H3 scoring grid
                                                              │
                                        Tippecanoe  →  PMTiles (vector tiles)
                                                              │
                                               FastAPI backend  ←→  Redis
                                                              │
                                        React + MapLibre + deck.gl frontend
```

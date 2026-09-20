# 🌐 TerraScore (Site Readiness Analyzer)

> **"Credit score for land"** — An enterprise-grade, cyberpunk geospatial terminal providing instant, explainable site suitability intelligence for Austin, TX.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostGIS](https://img.shields.io/badge/PostGIS-16--3.4-336791.svg?logo=postgresql&logoColor=white)](https://postgis.net)
[![Uber H3](https://img.shields.io/badge/H3-Resolution%209-FF6F00.svg)](https://h3geo.org)
[![deck.gl](https://img.shields.io/badge/deck.gl-9.4+-green.svg)](https://deck.gl)
[![MapLibre GL](https://img.shields.io/badge/MapLibre-6.10+-blue.svg)](https://maplibre.org)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED.svg?logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📑 Table of Contents

- [The Big Picture](#-the-big-picture)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Geospatial Data Sources](#-geospatial-data-sources)
- [Scoring Engine & Mathematical Formulation](#-scoring-engine--mathematical-formulation)
- [API Reference](#-api-reference)
- [Tech Stack](#-tech-stack)
- [Directory Structure](#-directory-structure)
- [Quickstart Guide](#-quickstart-guide)
  - [Prerequisites](#prerequisites)
  - [1. Environment Configuration](#1-environment-configuration)
  - [2. Infrastructure Services (Docker)](#2-infrastructure-services-docker)
  - [3. Data Pipeline & Ingestion](#3-data-pipeline--ingestion)
  - [4. Backend Server](#4-backend-server)
  - [5. Frontend Application](#5-frontend-application)
- [Configuration Reference](#-configuration-reference)
- [3-Minute Demo Walkthrough](#-3-minute-demo-walkthrough)
- [Team & Roles](#-team--roles)
- [License](#-license)

---

## 💡 The Big Picture

Picking the optimal location for a retail store, distribution warehouse, or EV supercharger network currently requires cross-referencing disparate GIS datasets, running ad-hoc demographic analyses, filtering zoning maps, and authoring static reports over weeks.

**TerraScore transforms this into a sub-second decision engine:**
- **Pinpoint Evaluation:** Drop a pin anywhere in the Austin metro area to receive an instant **0–100 Readiness Score** with letter grade ($A^+$ to $F$) and spatial archetype classification.
- **Explainable by Design:** Every score breaks down into factor contributions (Demand, Accessibility, Competition, Complementarity, Land Use, Environmental Risk) with human-readable natural language explanations and hazard alerts.
- **Dynamic Calibration:** Real-time weight sliders let expansion analysts calibrate weights on the fly or toggle between curated industry presets (Retail, Warehouse, EV Charging).
- **Macro-Scale Spatial Statistics:** City-wide Getis-Ord $G_i^*$ hotspot and coldspot clustering, drive-time isochrones via OSRM, freeform polygon spatial batch queries, and instant printable audit dossiers.

```
"X-ray vision for site selection — paste a coordinate or click the map, get a score, see the reasons, in seconds."
```

---

## ⚡ Key Features

| Feature | Description |
| :--- | :--- |
| **Hexagonal Spatial Grid** | Partitioned into **Uber H3 Resolution 9** (~174 m edge length, ~0.1 km² area), eliminating boundary edge-effects common in rectangular grids. |
| **Sub-300 ms Lookups** | Precomputed scoring grid indexed in PostGIS with spatial indexing (`GIST`) and primary key lookups for near-instant point evaluation. |
| **Multi-Factor Explainability** | Transparent spatial reasoning model calculating SHAP-style factor contributions, penalty multipliers, and plain-English verdicts. |
| **Interactive Drive Isochrones** | Real-time 5, 10, and 15-minute drive-time catchment areas powered by self-hosted **OSRM** and Redis caching, detailing reachable population. |
| **Spatial Hotspot Analysis** | Statistically significant spatial clustering computed using **Getis-Ord $G_i^*$** ($z$-scores) to identify macro investment opportunities and oversaturated dead zones. |
| **Polygon Batch Screening** | Freeform bounding polygon drawing to query, rank, and export the top-$N$ candidate sites inside custom search areas. |
| **Side-by-Side Comparison** | Multi-pin comparison matrix with category-by-category radar benchmarks and automated winner identification. |
| **Cyberpunk Command Center** | High-contrast dark theme with neon data layers, GPU-accelerated **deck.gl** rendering for 20,000+ hexagons, and an interactive onboarding terminal. |
| **Instant Printable Dossier** | One-click printable HTML/PDF executive site readiness summary with SVG vector scores and factor breakdowns. |

---

## 🏛️ System Architecture

```
                       ┌─────────────────────────────────────────────────────────┐
                       │                   RAW GEOSPATIAL DATA                   │
                       │  • US Census (Demographics)  • OpenStreetMap (Roads/POI)│
                       │  • FEMA (Flood Hazard Zones) • EPA (Air Quality / AQI)  │
                       └────────────────────────────┬────────────────────────────┘
                                                    │
                                                    ▼
                       ┌─────────────────────────────────────────────────────────┐
                       │           ETL & SPATIAL PIPELINE (Python / GDAL)        │
                       │  • Ingest & Clip to Austin Metro Bounding Box           │
                       │  • H3 Hexagonal Grid Indexing (Resolution 9)            │
                       │  • Gaussian Competition Decay & Proximity Calculations  │
                       │  • Getis-Ord Gi* Hotspot Statistics (esda / libpysal)   │
                       └──────────────┬───────────────────────────┬──────────────┘
                                      │                           │
                                      ▼                           ▼
                       ┌─────────────────────────┐  ┌────────────────────────────┐
                       │  PostgreSQL 16 + PostGIS│  │   Tippecanoe Tile Export   │
                       │   derived.h3_grid Table │  │    PMTiles (Static Vector) │
                       └──────────────┬──────────┘  └─────────────┬──────────────┘
                                      │                           │
                                      ▼                           ▼
    ┌──────────────┐   ┌─────────────────────────────────────────────────────────┐
    │  Redis Cache │◄─►│                 FastAPI BACKEND (Python 3.11)           │
    │  (Isochrones)│   │  • /api/v1/score (Dynamic & Point Evaluation)           │
    └──────────────┘   │  • /api/v1/score/batch (Polygon Intersect Screening)   │
    ┌──────────────┐   │  • /api/v1/hotspots (Getis-Ord Gi* Spatial Clusters)    │
    │  OSRM Engine │◄─►│  • /api/v1/isochrone (Drive-time Reach Analysis)        │
    │ (5000: MLD)  │   │  • /api/v1/compare & /api/v1/report (Dossiers)          │
    └──────────────┘   └────────────────────────────┬────────────────────────────┘
                                                    │ (REST / JSON)
                                                    ▼
                       ┌─────────────────────────────────────────────────────────┐
                       │              REACT 19 + VITE + TYPESCRIPT               │
                       │  • MapLibre GL JS (Dark Cyberpunk Basemap)              │
                       │  • deck.gl H3HexagonLayer & ScatterplotLayer            │
                       │  • Zustand Global State Management                      │
                       │  • Tailwind CSS + Framer Motion UI Components           │
                       └─────────────────────────────────────────────────────────┘
```

---

## 🗺️ Geospatial Data Sources

| Source | Dataset | Purpose in TerraScore |
| :--- | :--- | :--- |
| **US Census Bureau** | Decennial Census & ACS 5-Year Estimates | Population density, demographic catchment, income distribution |
| **OpenStreetMap (OSM)** | Geofabrik Texas Extract (`.osm.pbf`) | Road network density, highway access distances, retail/warehouse competitor locations, transit stops |
| **FEMA NFHL** | National Flood Hazard Layer | 100-year and 500-year flood zone spatial intersection (AE/A zones) |
| **EPA Air Quality** | Toxic Release Inventory & AQI Monitoring | Environmental risk indexing and industrial hazard proximity |

---

## 📐 Scoring Engine & Mathematical Formulation

Each H3 cell is evaluated across 6 normalized factor dimensions $\in [0, 1]$:

$$S_{\text{base}} = \sum_{k \in \mathcal{F}} w_k \cdot f_k$$

Where $\sum w_k = 1.0$ and $\mathcal{F} = \{\text{demand}, \text{accessibility}, \text{competition}, \text{complementarity}, \text{landuse}, \text{risk}\}$.

### 1. Factor Formulations

1. **Demand ($f_{\text{demand}}$):** Scaled percentile normalization of population density against metro limits:
   $$f_{\text{demand}} = \min\left(\max\left(\frac{\rho - P_{1}}{P_{99} - P_{1}}, 0\right), 1\right)$$
2. **Accessibility ($f_{\text{accessibility}}$):** Combined road network density, transit stop count within 800 m, and highway proximity:
   $$f_{\text{accessibility}} = \min\left(\frac{\text{road\_density}}{20000} + \max\left(1 - \frac{d_{\text{highway}}}{5000}, 0\right) + \frac{\text{transit\_stops}}{20}, 1\right)$$
3. **Competition Decay ($f_{\text{competition}}$):** Optimal competitor clustering model via Gaussian curve centered around target density $c^*$ with bandwidth $\sigma$:
   $$f_{\text{competition}} = \exp\left(-\frac{(C_{\text{decay}} - c^*)^2}{2\sigma^2}\right)$$
4. **Anchor Complementarity ($f_{\text{complementarity}}$):** Diminishing returns from nearby synergy generators (grocery stores, retail hubs):
   $$f_{\text{complementarity}} = 1 - \exp\left(-\frac{\text{anchor\_count}_{1\text{km}}}{3.0}\right)$$
5. **Land Use & Zoning ($f_{\text{landuse}}$):** Suitability lookup based on municipal zoning classification (Commercial, Industrial, Residential, Mixed-Use).
6. **Environmental Risk ($f_{\text{risk}}$):** Base safety score derived from FEMA flood zone intersections:
   $$f_{\text{risk}} = 1.0 - \text{flood\_risk}$$

### 2. Penalty Multipliers & Final Grade

Environmental and regulatory red-flags apply multiplicative hard penalties:
$$\text{Penalty} = \prod p_i \quad \begin{cases} 
p_{\text{flood}} = 0.35 & \text{if inside 100-yr flood zone} \\
p_{\text{aqi}} = 0.85 & \text{if AQI in worst decile} 
\end{cases}$$

$$\text{Final Score} = \min(\max(100 \cdot S_{\text{base}} \cdot \text{Penalty}, 0), 100)$$

| Score Range | Grade | Spatial Interpretation |
| :---: | :---: | :--- |
| **90 – 100** | **$A^+$** | Prime opportunity; unmatched demand and infrastructure with negligible risk |
| **80 – 89** | **$A$** | High potential; strong overall readiness with minor optimization trade-offs |
| **70 – 79** | **$B$** | Viable site; solid fundamentals requiring minor mitigations |
| **60 – 69** | **$C$** | Average viability; noticeable competition or moderate infrastructure deficit |
| **50 – 59** | **$D$** | Sub-optimal; major headwinds in accessibility, zoning, or demand |
| **< 50** | **$F$** | Critical risk / Severe deficit; flood hazard, regulatory blocks, or isolated |

---

## 🔌 API Reference

The FastAPI service runs at `http://localhost:8000` with automated interactive OpenAPI documentation at `/docs`.

### Core Endpoints

#### `POST /api/v1/score`
Evaluate a single coordinate point under selected presets or customized factor weights.
```json
// Request Body
{
  "lat": 30.2672,
  "lon": -97.7431,
  "preset": "retail",
  "weights": {
    "demand": 0.30,
    "accessibility": 0.25,
    "competition": 0.15,
    "complementarity": 0.15,
    "landuse": 0.10,
    "risk": 0.05
  }
}
```
```json
// Response Body (200 OK)
{
  "h3": "8928308280fffff",
  "score": 82.4,
  "grade": "A",
  "archetype": "Urban Core",
  "factors": [
    {
      "key": "demand",
      "label": "Demand",
      "raw": 0.91,
      "weight": 0.30,
      "contribution": 27.3,
      "explanation": "High population density (8,420/km²) provides strong customer catchment."
    }
  ],
  "flags": []
}
```

#### `POST /api/v1/score/batch`
Score and rank all H3 cells intersecting a GeoJSON polygon boundary.
```json
// Request Body
{
  "polygon": {
    "type": "Polygon",
    "coordinates": [[[-97.76, 30.25], [-97.72, 30.25], [-97.72, 30.28], [-97.76, 30.28], [-97.76, 30.25]]]
  },
  "preset": "warehouse",
  "limit": 100
}
```

#### `GET /api/v1/hotspots`
Retrieve statistically significant hot or cold clusters across the metro area.
- **Query Parameters:**
  - `preset`: `retail` | `warehouse` | `ev`
  - `type`: `hot` | `cold`
  - `min_z`: Z-score threshold (default: `1.96` for 95% confidence)

#### `POST /api/v1/compare`
Side-by-side multi-site benchmarking with category winner computation.
```json
// Request Body
{
  "sites": [
    {"lat": 30.2672, "lon": -97.7431},
    {"lat": 30.3000, "lon": -97.7000}
  ],
  "preset": "retail"
}
```

#### `POST /api/v1/isochrone`
Generate driving-time reach polygons and estimated reachable population.
```json
// Request Body
{
  "lat": 30.2672,
  "lon": -97.7431,
  "minutes": [5, 10, 15],
  "mode": "driving"
}
```

#### `GET /api/v1/report/{h3_index}`
Renders a printable, executive-ready HTML dossier for the specified H3 hexagon.

#### `GET /healthz`
System health check verifying database and cache connectivity.

---

## 🛠️ Tech Stack

| Layer | Technologies | Role in System |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite | Modern UI component rendering and typed API interaction |
| **Map Rendering** | MapLibre GL JS, deck.gl 9.4 | High-performance WebGL/WebGPU hexagonal choropleths & vector tiles |
| **State & Styling** | Zustand, Tailwind CSS, Framer Motion | Global application state, cyberpunk HUD styling, smooth transitions |
| **Backend Framework** | Python 3.11, FastAPI, Pydantic v2 | High-throughput asynchronous REST API with automatic validation |
| **Spatial Database** | PostgreSQL 16, PostGIS 3.4 | Primary geospatial data store, geometry spatial indexing, spatial joins |
| **Spatial Indexing** | Uber H3 (`h3-py`, `h3-js`) | Hexagonal discrete global grid system (Resolution 9) |
| **Spatial Analysis & ML** | GeoPandas, Shapely, PySAL (`esda`), scikit-learn | Data wrangling, buffer operations, Getis-Ord $G_i^*$ clustering |
| **Routing & Isochrones** | OSRM (Open Source Routing Machine) | Self-hosted graph routing engine for drive-time catchments |
| **Caching Layer** | Redis 7 Alpine | In-memory memoization of drive-time polygons and batch queries |
| **Tile Generation** | Tippecanoe, PMTiles | Single-file cloud-optimized vector tile archives |
| **Orchestration** | Docker Compose, GNU Make | Unified multi-container deployment and task execution |

---

## 📁 Directory Structure

```
terraScorer/
├── Makefile                       # Top-level automation targets
├── docker-compose.yml             # Container orchestration (PostGIS, Redis, OSRM)
├── .env.example                   # Environment configuration template
│
├── backend/                       # FastAPI REST API Backend
│   ├── main.py                    # Application entry point, lifespan, & routing
│   ├── requirements.txt           # Python dependency specifications
│   ├── api/                       # Modular route controllers
│   │   ├── score.py               # Point and polygon scoring endpoints
│   │   ├── analysis.py            # Hotspot and comparison controllers
│   │   ├── routing.py             # Isochrone computation (OSRM + fallback)
│   │   ├── layers.py              # PMTiles layer manifests & metadata
│   │   └── report.py              # Printable HTML report generator
│   ├── core/                      # Domain logic & algorithms
│   │   ├── scoring.py             # Multi-factor score & penalty calculator
│   │   ├── mock_cell.py           # Deterministic offline mock generator
│   │   ├── explanations.py        # Natural language NLG rule builder
│   │   └── config.py              # Pydantic environment settings
│   ├── db/                        # Database connectivity
│   │   ├── session.py             # SQLAlchemy 2.0 engine & connection pool
│   │   └── models.py              # Database table definitions
│   └── config/
│       └── presets.json           # Default weights & params for presets
│
├── frontend/                      # React 19 + Vite + TypeScript Frontend
│   ├── package.json               # Node.js dependencies & scripts
│   ├── vite.config.ts             # Vite bundler configuration & proxy
│   ├── tailwind.config.js         # Cyberpunk theme color & font tokens
│   └── src/
│       ├── App.tsx                # Main HUD shell & layout coordinator
│       ├── components/            # UI components
│       │   ├── MapView.tsx        # MapLibre + deck.gl visualization canvas
│       │   ├── SiteScoreCard.tsx  # Score readout, radar, SHAP, & flags
│       │   ├── WeightSliders.tsx  # Dynamic weight tuner & preset picker
│       │   ├── CompareView.tsx    # Multi-site comparison benchmark table
│       │   ├── LayerPanel.tsx     # Layer opacity & visibility controller
│       │   ├── OnboardingWizard.tsx # Boot terminal & interactive guide
│       │   ├── ProfileSettings.tsx# User customization modal
│       │   └── TopBar.tsx         # Header, search, & quick status
│       ├── layers/                # deck.gl custom layer builders
│       │   ├── hexLayer.ts        # H3 hexagonal choropleth layer
│       │   └── poiLayer.ts        # POI and infrastructure point layers
│       ├── store/
│       │   └── useAppStore.ts     # Central Zustand state store
│       └── utils/
│           └── shapExplainer.ts   # Local feature contribution heuristics
│
└── pipeline/                      # Geospatial ETL & Data Pipeline
    ├── config.py                  # Pipeline bounding box & DB configuration
    ├── utils.py                   # Spatial helper routines
    ├── 01_ingest_census.py        # US Census demographic ingestion
    ├── 02_ingest_osm.py           # OSM road & POI network processing
    ├── 03_ingest_fema.py          # FEMA flood hazard layer ingestion
    ├── 04_ingest_epa.py           # EPA air quality index ingestion
    ├── 06_build_h3_grid.py        # Spatial aggregation into H3 Resolution 9
    ├── 07_score_grid.py           # Precomputation of baseline scores
    ├── 08_hotspot_gi.py           # Getis-Ord Gi* hotspot spatial statistics
    └── 09_export_tiles.py         # PMTiles vector tile generation
```

---

## 🚀 Quickstart Guide

Get the complete system running locally with live database, cache, backend, and frontend.

### Prerequisites

Ensure you have installed:
- [Docker & Docker Compose](https://www.docker.com/) (v24+)
- [Python](https://www.python.org/) (v3.11+)
- [Node.js](https://nodejs.org/) (v18+) and `npm`

*(Optional for raw data tile generation: `GDAL (ogr2ogr)`, `osmium-tool`, and `tippecanoe`).*

---

### 1. Environment Configuration

Clone the repository and copy the environment configuration:
```bash
git clone https://github.com/Kashyap1008/TerraScore.git
cd TerraScore
cp .env.example .env
```

---

### 2. Infrastructure Services (Docker)

Spin up PostGIS, Redis, and OSRM in the background:
```bash
docker compose up -d
```
Check status:
```bash
docker compose ps
```

---

### 3. Data Pipeline & Ingestion

Run the end-to-end ingestion and scoring pipeline (or use built-in mock fallbacks during development):
```bash
# Ingest raw layers, build H3 grid, compute scores and hotspots
python pipeline/01_ingest_census.py
python pipeline/02_ingest_osm.py
python pipeline/03_ingest_fema.py
python pipeline/04_ingest_epa.py
python pipeline/06_build_h3_grid.py
python pipeline/07_score_grid.py
python pipeline/08_hotspot_gi.py
```

---

### 4. Backend Server

In a dedicated terminal:
```bash
cd backend
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API will be live at `http://localhost:8000` (Docs: `http://localhost:8000/docs`).

---

### 5. Frontend Application

In another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ⚙️ Configuration Reference

Key variables configurable via `.env`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `POSTGRES_DB` | `sitereadiness` | PostgreSQL database name |
| `POSTGRES_USER` | `geo` | Database user |
| `POSTGRES_PASSWORD` | `geo` | Database password |
| `DB_URL` | `postgresql+psycopg://geo:geo@localhost:5432/sitereadiness` | Database connection string for SQLAlchemy |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis caching connection URL |
| `OSRM_URL` | `http://localhost:5000` | OSRM routing service endpoint |
| `METRO_NAME` | `Austin, TX` | Metro area identifier |
| `METRO_BBOX` | `-98.05,30.10,-97.55,30.55` | Geographic bounding box `[min_lon, min_lat, max_lon, max_lat]` |
| `UTM_EPSG` | `32614` | Local projected coordinate reference system (UTM Zone 14N) |
| `H3_RESOLUTION` | `9` | H3 indexing resolution level (~174 m edge length) |

---

## 🎬 3-Minute Demo Walkthrough

Follow this sequence for presentations and live evaluations:

1. **Terminal Boot Sequence:** Launch the app to observe the high-tech terminal initialization sequence loading the Austin H3 grid.
2. **Hexagonal Choropleth:** Observe the city-wide choropleth map. Neon green cells denote high readiness; magenta cells highlight risk or oversaturation.
3. **Preset Switching:** Switch the business preset from **Retail** to **Logistics / Warehouse**. Notice the dynamic weight recalculation and map score shift.
4. **Point Inspection:** Click any candidate hexagon in downtown or North Austin. The right-hand HUD expands showing:
   - Overall Score (0–100) & Grade ($A^+$ to $F$)
   - Factor contribution breakdown (Demand, Road Access, Competition, Complementarity)
   - Plain-English natural language justification
   - Active risk flags (e.g. FEMA 100-year flood zone warning)
5. **Layer Toggling:** Toggle on the **Flood Zones** or **Road Network** layers to visually verify why scores shift across boundaries.
6. **Isochrone Generation:** Review the 5, 10, and 15-minute drive-time catchments showing total reachable population.
7. **Polygon Screening:** Use the polygon tool to outline a target development corridor and review ranked candidates.
8. **Multi-Site Comparison & PDF Export:** Pin 2 candidate sites to open the comparison matrix, inspect winner highlights, and click **Export Dossier** to produce a printable report.

---

## 👥 Team & Roles

| Contributor | Focus Area | Core Responsibilities |
| :--- | :--- | :--- |
| **Kashyap** | **Data & Ingestion Pipeline** | PostGIS schema, ETL scripts, H3 spatial grid indexing, PMTiles export |
| **Megh** | **Backend & Algorithms** | FastAPI endpoints, dynamic scoring mathematical engine, OSRM & Redis integration |
| **Rudra** | **Map & Geospatial Visuals** | MapLibre GL JS dark canvas, deck.gl GPU H3 hexagonal layer, polygon tools |
| **Aary** | **UI/UX & Integration** | Cyberpunk HUD design, weight sliders, compare tray, report generation |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

🗺️ 1. System Architecture (The Big Picture)
text
[ RAW DATA ] (Census, OSM, FEMA, EPA)
      │
      ▼
┌──────────────────────────────────────────────┐
│  ROLE A: KASHYAP (Data Pipeline)             │
│  Python, GeoPandas, H3, PostGIS, Tippecanoe  │
│  Output: PostGIS DB + .pmtiles files         │
└──────────────────────────────────────────────┘
      │                                │
      ▼ (DB Credentials)               ▼ (.pmtiles URLs)
┌───────────────────────────┐    ┌──────────────────────────────┐
│  ROLE B: MEGH (Backend)   │    │  ROLE C: RUDRA (Map)         │
│  FastAPI, scikit-learn,   │    │  React, MapLibre, deck.gl    │
│  OSRM, Redis              │    │  Output: <MapView />         │
│  Output: JSON APIs        │    └──────────────────────────────┘
└───────────────────────────┘                │
      │                                      ▼
      │ (OpenAPI Schema)         ┌──────────────────────────────┐
      └─────────────────────────►│  ROLE D: AARY (UI/Integration)│
                                 │  React, Tailwind, Framer     │
                                 │  Output: Final App Shell     │
                                 └──────────────────────────────┘
🛠️ 2. The Locked Tech Stack
Layer	Technology	Why This Was Chosen
Backend Framework	Python 3.11 + FastAPI	Async, auto OpenAPI docs (/docs is a free demo asset), Pydantic validation.
Geospatial Core	GeoPandas, Shapely 2.x, H3-py	The industry standard for vector manipulation. H3 provides the hexagonal grid.
Database	PostgreSQL 16 + PostGIS 3.4	Spatial indexes, ST_Contains for isochrone population, single source of truth.
Clustering / ML	scikit-learn, libpysal/esda	DBSCAN/KMeans for clusters. esda for Getis-Ord Gi* hot-spot analysis.
Routing Engine	OSRM (Docker)	Self-hosted = no rate limits during demo. Fast drive-time isochrones.
Cache	Redis	Isochrone and batch-result memoization.
Tiling	Tippecanoe → PMTiles	Single-file tiles, no tile server needed, serve as static files.
Frontend	React 18 + Vite + TypeScript	Fast HMR, typed API contracts to prevent runtime errors.
Map Engine	MapLibre GL JS + deck.gl	MapLibre for base map/layers. deck.gl for GPU-accelerated 20k+ H3 hexagons.
UI & Styling	Tailwind CSS + Framer Motion	Speed to build the custom "Cyberpunk" UI. Framer for polished animations.
Orchestration	Docker Compose	One docker compose up = PostGIS + Redis + OSRM. Eliminates "works on my machine".
👤 3. Role-Specific Ownership (Zero-Overlap)
🟢 ROLE A: KASHYAP — Data & Pipeline
Mission: Turn raw geospatial data into a pre-computed, scored PostGIS database and PMTiles.

Your Tech Stack: Python, GeoPandas, Shapely, H3-py, PostGIS, Tippecanoe, Docker Compose.

Your Files (Only touch these):

pipeline/* (All 9 ingest and scoring scripts)

docker-compose.yml

Makefile

backend/static/tiles/*

Your Milestones:

Hr 8: PostGIS running, all 5+ raw layers ingested, clipped to Austin.

Hr 16: h3_grid table fully populated with raw features + pre-computed scores.

Hr 20: .pmtiles files exported.

🚫 DO NOT: Write FastAPI endpoints, write React code, adjust UI logic.

🔵 ROLE B: MEGH — Backend & Algorithms
Mission: Build the FastAPI that reads from Kashyap's DB, applies dynamic scoring, runs spatial clustering, and returns JSON.

Your Tech Stack: FastAPI, Uvicorn, Pydantic, scikit-learn, libpysal/esda, Redis, OSRM Client, SQLAlchemy, GeoAlchemy2.

Your Files (Only touch these):

backend/main.py

backend/api/* (score.py, layers.py, analysis.py, routing.py)

backend/core/* (scoring.py, decay.py, explanations.py, config.py)

backend/db/* (session.py, models.py, queries.py)

backend/config/presets.json

Your Milestones:

Hr 12: FastAPI server running, /docs available. Use mocked JSON if DB isn't ready.

Hr 20: All P0 endpoints (/score, /score/batch, /hotspots) live.

Hr 24: OSRM isochrones and Gi* calculations working.

🚫 DO NOT: Modify Kashyap's pipeline scripts or DB schema. Write any frontend code.

🟡 ROLE C: RUDRA — Map & Geospatial Frontend
Mission: Render the interactive map, the glowing H3 hexagons, the data layers, and handle map-based user interactions.

Your Tech Stack: React, TypeScript, MapLibre GL JS, deck.gl (H3HexagonLayer, ScatterplotLayer), terra-draw, Zustand (Map slices).

Your Files (Only touch these):

frontend/src/components/MapView.tsx

frontend/src/layers/* (hexLayer.ts, poiLayer.ts, floodLayer.ts, isoLayer.ts)

frontend/src/components/DrawTool.tsx

Map-specific state in useAppStore.ts

Your Milestones:

Hr 12: MapLibre rendering a dark cyberpunk basemap.

Hr 18: deck.gl H3 layer rendering with neon glow effects.

Hr 24: Layer toggles, opacity, and terra-draw polygon working.

🚫 DO NOT: Build side panels, sliders, or the compare tray. Style the overall app layout. Write backend logic.

🔴 ROLE D: AARY — UI/UX & Integration
Mission: Build the "Cyberpunk Terminal" aesthetic, the side panels, the weight sliders, the comparison tray, and wire everything together.

Your Tech Stack: React, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide React, Fetch/Axios.

Your Files (Only touch these):

frontend/src/App.tsx

frontend/src/components/SiteScoreCard.tsx

frontend/src/components/WeightSliders.tsx

frontend/src/components/CompareTray.tsx

frontend/src/components/LayerPanel.tsx

frontend/tailwind.config.js

frontend/src/api/client.ts

Your Milestones:

Hr 12: Full app shell styled in Tailwind (Terminal boot sequence implemented).

Hr 18: All UI panels built with mocked data.

Hr 24: API integration complete. Map clicks update the SiteScoreCard.

Hr 28: Export report and Compare tray functional.

🚫 DO NOT: Write deck.gl or MapLibre logic. Write Python or SQL. Touch presets.json.

📜 4. The Interface Contracts (LOCKED AT HOUR 2)
Do not change these without team approval. This is the glue that allows parallel work.

A. Database Schema (Kashyap provides to Megh)

sql
-- Table: h3_grid
h3_index TEXT PRIMARY KEY, lat FLOAT, lon FLOAT,
pop_density FLOAT, pop_10min INT, median_income INT,
road_density FLOAT, dist_to_highway_m FLOAT,
competitor_count_1km INT, competitor_decay_score FLOAT,
zone_class TEXT, flood_risk FLOAT, aqi_score FLOAT,
score_retail FLOAT, score_warehouse FLOAT, score_ev FLOAT,
hotspot_z_retail FLOAT, hotspot_z_warehouse FLOAT
B. API JSON Response (Megh provides to Aary)

json
// POST /api/v1/score
{
  "h3": "8928308280fffff",
  "score": 78.4,
  "grade": "B+",
  "factors": [
    {"key": "demand", "label": "Demand", "raw": 0.82, "weight": 0.30, "contribution": 24.6, "explanation": "Dense residential catchment..."}
  ],
  "flags": [{"type": "flood", "severity": "high", "text": "Inside FEMA AE zone"}],
  "archetype": "Suburban Growth"
}
C. Map Component Props (Rudra provides to Aary)

typescript
// <MapView /> Props
interface MapViewProps {
  activeLayers: string[];
  onMapClick: (lat: number, lon: number) => void;
  onPolygonDraw: (geojson: GeoJSON.Polygon) => void;
  candidatePins: {lat: number, lon: number}[];
}
D. Global State (Aary provides to everyone)

typescript
// Zustand Store (useAppStore.ts)
interface AppState {
  preset: 'retail' | 'warehouse' | 'ev';
  activeLayers: string[];
  selectedSite: {lat: number, lon: number} | null;
  compareList: {lat: number, lon: number}[];
  setPreset: (p: string) => void;
  // ... actions
}
🤝 5. Development & Integration Protocol
1. Git Branching Strategy (Zero Merge Conflicts):

main (Protected. Only merge here when features work).

Kashyap: feat/data-pipeline

Megh: feat/backend-api

Rudra: feat/map-layers

Aary: feat/ui-shell

Rule: Nobody commits to someone else's branch. Use Pull Requests to merge into main.

2. Mocking Strategy (Crucial for Hour 12–20):

Megh can't wait for Kashyap, so Megh uses mock_data.json mimicking the h3_grid table.

Rudra & Aary can't wait for Megh, so they use frontend/src/api/mockData.json to build the UI.

When Megh's real API is ready, Aary flips a switch in client.ts from useMock = true to useMock = false.

3. Integration Checkpoints:

Hr 8: Data in DB (Kashyap hands off to Megh).

Hr 16: API ↔ UI Smoke Test (Megh hands off to Aary).

Hr 24: Feature Freeze. No new features. Only bug fixes.

Hr 28: Demo Rehearsal ×3.

Hr 32: Buffer for the thing that breaks.
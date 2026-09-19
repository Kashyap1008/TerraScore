1. Architecture Overview
text
┌──────────────────────────────────────────────────────────────────┐
│  OFFLINE PIPELINE (run once before the demo, Python)             │
│                                                                  │
│  Raw sources ──► Ingest & normalize ──► PostGIS ──► Feature      │
│  (Census, FEMA,   (GeoPandas/Shapely,    (spatial    engineering │
│   EPA, OSM,        reproject→EPSG:4326,   indexes)   → H3 grid   │
│   synthetic POI)   clean, clip to metro)             scoring     │
│                                                          │       │
│                                     Tippecanoe ──► PMTiles/      │
│                                                    vector tiles  │
└──────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│  BACKEND — FastAPI                                               │
│  /score  /score/batch  /layers  /hotspots  /isochrone  /compare  │
│  GeoPandas · Shapely · H3 · scikit-learn · OSRM client · Redis    │
└─────────────────────────────┬────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│  FRONTEND — React + MapLibre GL JS + deck.gl + Tailwind          │
│  Base map · Neon Hex layer · POI/flood layers · Draw tool        │
│  Score panel · Weight sliders · Compare tray · Export            │
└──────────────────────────────────────────────────────────────────┘
Critical architectural decision: precompute, don't compute live.
The H3 grid over Austin at resolution 9 is ~15–20k cells. We score all of them in the offline pipeline and ship the results as a vector-tile layer + a lookup table. The API's /score endpoint for an arbitrary clicked point is a nearest-cell lookup + on-the-fly refinement, not a full spatial recompute. This is what buys us the < 2 s UX. Only genuinely dynamic things (isochrones, batch-in-polygon, weight-slider re-scoring) hit live computation.

2. Data Model
Spatial reference: store in EPSG:4326; compute distances in a projected CRS (EPSG:32614 / UTM 14N for Austin) or use geodesic distance via H3/Shapely.

sql
-- Ingested raw layers, one table each, all with geom geometry(...,4326)
demographics_blocks   (geoid, population, median_income, median_age, geom)
roads                 (osm_id, highway_class, geom)
transit_stops         (osm_id, route_type, geom)
pois                  (osm_id, category, brand, geom)   -- competitors + anchors
landuse               (osm_id, zone_class, geom)         -- commercial/res/industrial
flood_zones           (zone_code, risk_level, geom)      -- FEMA
air_quality           (value, pollutant, geom)           -- EPA monitors
sql
-- Derived: the scoring grid (the heart of the system)
h3_grid (
  h3_index      TEXT PRIMARY KEY,     -- res 9
  lat, lon      DOUBLE PRECISION,     -- cell center
  geom          GEOMETRY(Polygon,4326),
  -- raw feature values (use-case agnostic, computed once)
  pop_density, pop_10min, pop_20min, pop_30min,
  median_income, median_age,
  road_density, dist_to_highway_m, transit_count_800m,
  competitor_count_1km, competitor_decay_score, anchor_count_1km,
  zone_class, zone_suitability,
  flood_risk, aqi_score, seismic_risk,
  -- precomputed per-preset scores
  score_retail, score_warehouse, score_ev,
  hotspot_z_retail, hotspot_z_warehouse, hotspot_z_ev
)
Storing raw features separately from per-preset scores is the key move: changing a weight doesn't require re-running spatial joins. It's a vectorized re-weight over a table we already have (milliseconds).

3. Scoring Model
3.1 Formula
For a cell *i* with weight vector *w* (Σw = 1) and sub-scores *s* ∈ [0,1]:

text
RawScore_i = Σ_k  w_k · s_k(i)                     # weighted sum, 0..1
Score_i    = 100 · RawScore_i · Π_m  P_m(i)        # penalties multiply
Score_i    = clamp(Score_i, 0, 100)
3.2 The Six Factors
Factor	Signal	Sub-score function
Demand	Pop density, income fit, age fit	min-max normalized, z-scored within metro
Accessibility	Road density, dist to highway, transit within 800 m	Gaussian decay on distance
Competition	Decayed competitor count within 1 km	Inverted-U (see below)
Complementarity	Anchor tenants, complementary POIs within 1 km	Saturating: 1 − e^(−λC)
Land Use	Zoning class suitability for the use case	Lookup table
Risk	Flood zone, AQI, seismic	Penalty multiplier
3.3 Distance Decay
Gaussian, with a half-life parameter *h* configurable per factor and per use case:

text
f(d) = exp( −ln(2) · (d / h)² )
Walk-based factors use h ≈ 400–800 m; drive-based (warehouse catchment) use h ≈ 3–5 km.

3.4 Competitive Density — the Inverted-U
Zero competitors is not automatically best — it can mean no market. We model a sweet spot C*:

text
C(i)   = Σ_j  w_j · f(d_ij)                      # decayed competitor pressure
s_comp = exp( −(C(i) − C*)² / (2σ²) )            # peaks at C*, falls both ways
Defaults: C* = 3.0, σ = 2.0 (tunable in the preset JSON). This lets us honestly detect underserved areas (high demand, C far below C) as a distinct category from saturated areas (C far above C).

3.5 Hard Constraints (multiplier penalties)
Constraint	Multiplier
Inside FEMA SFHA (A/AE zone)	×0.35
Inside protected/conservation land	×0.0 (excluded, greyed out)
Slope > 15% (if DEM loaded)	×0.6
AQI in worst decile	×0.85
The UI shows these as red flags on the site card — they're the most persuasive part of the demo.

3.6 Use-Case Presets (config-as-data, not code)
json
{
  "retail": {
    "label": "Retail Store",
    "weights": { "demand": 0.30, "accessibility": 0.15, "competition": 0.20,
                 "complementarity": 0.20, "landuse": 0.10, "risk": 0.05 },
    "params": { "competition_optimum": 3.0, "competition_sigma": 2.0,
                "walk_half_life_m": 600, "drive_half_life_m": 3000 }
  },
  "warehouse": {
    "weights": { "demand": 0.05, "accessibility": 0.45, "competition": 0.05,
                 "complementarity": 0.05, "landuse": 0.25, "risk": 0.15 },
    "params": { "drive_half_life_m": 8000, "highway_weight": 3.0 }
  },
  "ev_charging": {
    "weights": { "demand": 0.25, "accessibility": 0.30, "competition": 0.25,
                 "complementarity": 0.05, "landuse": 0.10, "risk": 0.05 },
    "params": { "competition_optimum": 1.0, "competition_sigma": 1.5 }
  }
}
Presets live in a JSON file the backend reads at startup → adding a use case is a config edit, and a judge can be shown the file. That's a credibility win.

4. Spatial Analysis Layer
Algorithm	Applied to	Output	Why
H3 (res 9)	Whole metro	Uniform analysis grid, ~174 m edge	Equal-area, fast neighbor ops, perfect for choropleth
DBSCAN	Competitor POIs, anchor POIs	Cluster polygons + density	Finds "retail districts" vs. sparse scatter; eps in meters via haversine
Getis-Ord Gi*	H3 cells, weighted by score	z-score + p-value per cell	Statistically honest hot/cold-spot detection, not just "high value"
KMeans (k=4)	H3 feature vectors	Site archetypes	Labels like "Dense Urban Core", "Suburban Growth" in explanations
Getis-Ord Gi* on the H3 grid using queen-contiguity (H3 grid_disk(k=1) neighbors):

text
Gi* = ( Σ_j w_ij·x_j − X̄·Σ_j w_ij ) / ( S · sqrt( [n·Σw² − (Σw)²] / (n−1) ) )
Cells with Gi* z > 1.96 → hot-spot (95%), z < −1.96 → cold-spot. Rendered as a distinct toggleable layer so it reads differently from the raw score heatmap.

5. Routing & Accessibility
Engine: self-hosted OSRM (Docker, osrm-backend with the Texas OSM extract) with the isochrone plugin, or Valhalla if we need walk profiles too. Fallback: OpenRouteService public API (rate-limited — use only for the 3 demo pins, cached).

Precompute strategy: isochrones are expensive. We compute them on demand for candidate sites only (≤ 20 per session) and cache by rounded coordinate (5 decimal places) in Redis.

Population reachable: isochrone polygon ∩ census block centroids, weighted by block population.

text
pop_reachable(t) = Σ_{blocks b : centroid(b) ∈ isochrone(t)} population_b
To keep it fast, we build a PostGIS spatial index on block centroids and use ST_Contains with a GiST index. For the 500-site batch case, we approximate by H3 ring distance instead of true routing (and label it as approximate in the UI — honesty over fake precision).

6. API Contract
text
GET  /api/v1/layers                      → layer catalog + tile URLs + metadata
GET  /api/v1/tiles/{layer}/{z}/{x}/{y}   → MVT vector tile (PMTiles)

POST /api/v1/score
     { "lat": 30.27, "lon": -97.74, "preset": "retail", "weights": {...}? }
  →  { "h3": "...", "score": 78.4, "grade": "B+",
       "factors": [ {"key":"demand","label":"Demand","raw":0.82,"weight":0.30,
                     "contribution":24.6,"explanation":"..."} ],
       "flags":  [ {"type":"flood","severity":"high","text":"Inside FEMA AE zone"} ],
       "archetype": "Suburban Growth",
       "neighbors": {"hotspot_z": 2.31} }

POST /api/v1/score/batch
     { "polygon": <GeoJSON>, "preset": "retail", "limit": 500 }
  →  { "results": [ {rank, h3, lat, lon, score, top_factor}, ... ] }

GET  /api/v1/hotspots?preset=retail&type=hot|cold&min_z=1.96
  →  GeoJSON FeatureCollection of Gi* significant cells

POST /api/v1/isochrone
     { "lat":..., "lon":..., "minutes":[10,20,30], "mode":"driving" }
  →  { "polygons": {...}, "population_reachable": {"10": 62400, ...} }

POST /api/v1/compare
     { "sites": [ {lat,lon}, {lat,lon}, {lat,lon} ], "preset": "retail" }
  →  side-by-side factor matrix + winner per factor

GET  /api/v1/report/{h3}?preset=retail    → HTML report (print-to-PDF)
7. Frontend Design & UI System
Aesthetic: Cyberpunk GIS / High-Tech Terminal. Deep blacks, neon accents, monospace typography, glowing map elements.

Layout: Full-bleed dark map, floating left panel (controls), right slide-in panel (site detail).

text
┌────────────────────────────────────────────────────────────┐
│  [Logo]  Preset: [RETAIL ▾]      [Search]      [Export]     │
├──────────┬─────────────────────────────────────────────────┤
│ LAYERS   │                                                 │
│ [x] SCORE│           MAP (MapLibre + deck.gl)              │
│ [x] ROADS│    Neon Hex choropleth · POI pins · flood        │
│ [ ] FLOOD│    draw polygon · isochrone rings · pins        │
│ [ ] POIs │                                                 │
│ ──────── │                                       ┌─────────┤
│ WEIGHTS  │                                       │ SITE    │
│ Demand ▓▓│                                       │ 78.4 B+ │
│ Access ▓ │                                       │ ▁▃▅▂▇▄ │
│ Comp   ▓▓│                                       │ [!] flood│
│ [Reset]  │                                       └─────────┤
└──────────┴─────────────────────────────────────────────────┘
7.1 Map Layers (bottom → top)
Base raster: Custom MapLibre style (Black bg, dark grey grids, Cyan roads).

H3 score choropleth: deck.gl H3HexagonLayer. Neon Green for high scores, Cyan for mid, Magenta for low. Glowing borders.

Flood zone polygons: Magenta hatch, 40% opacity.

Road network: Cyan lines (#00E5FF) with a slight glow filter.

POI points: deck.gl ScatterplotLayer. Red/Magenta diamonds for competitors.

Isochrone polygons: Dashed neon green concentric circles.

Candidate pins: Custom SVG markers with neon strokes.

7.2 Component Styling & Code
Tailwind Config:

javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        base: '#050505',        // Deep black background
        panel: '#0F0F0F',       // Slightly lighter panel bg
        neonGreen: '#CCFF00',   // High scores, primary actions
        neonCyan: '#00E5FF',    // Data lines, secondary actions
        neonMagenta: '#FF00FF', // Alerts, cold-spots, penalties
        textMain: '#FFFFFF',
        textMuted: '#8892B0',   // Monospace labels
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  }
}
Key Component Snippet (Site Score Card):

tsx
// SiteScoreCard.tsx
export const SiteScoreCard = ({ score, factors, flags }) => {
  return (
    <div className="absolute top-4 right-4 w-96 bg-black/80 backdrop-blur-md border border-neonGreen/30 p-6 rounded-sm shadow-[0_0_20px_rgba(204,255,0,0.1)]">
      {/* Header Tag */}
      <div className="absolute -top-3 left-4 bg-neonGreen text-black font-mono text-xs px-2 py-1">
        // SITE_ANALYSIS
      </div>

      {/* Main Score */}
      <div className="flex items-baseline gap-4 mb-6">
        <h1 className="text-6xl font-sans font-bold text-neonGreen tracking-tighter">
          {score}
        </h1>
        <span className="text-xl font-mono text-textMuted">/ 100</span>
      </div>

      {/* Factor Breakdown */}
      <div className="space-y-4 font-mono text-sm">
        {factors.map(f => (
          <div key={f.key} className="flex items-center justify-between">
            <span className="text-textMuted">{f.label}</span>
            <div className="flex-1 mx-4 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${f.value > 70 ? 'bg-neonGreen' : f.value > 40 ? 'bg-neonCyan' : 'bg-neonMagenta'}`} 
                style={{ width: `${f.value}%` }} 
              />
            </div>
            <span className="text-white w-8 text-right">{f.value}</span>
          </div>
        ))}
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div className="mt-6 border-t border-gray-800 pt-4">
          {flags.map(flag => (
            <div key={flag.type} className="flex items-center gap-2 text-neonMagenta font-mono text-xs">
              <span>[!]</span>
              <span>{flag.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
Explanation rendering: Each factor row shows a bar, raw value, weight, and a one-line template string.

Demand — 0.82: "Dense residential catchment: 18.4k residents within 1 km, median income $72k (metro p78)."
Competition — 0.61: "6 competitors within 1 km — above the optimal 3. Market is served but not saturated."
Risk — 0.35: "⚠ Site intersects FEMA Zone AE (1% annual flood). Score reduced 65%."

8. Key Sequence: Click → Score
text
User clicks map
  → frontend converts pixel → lat/lon
  → POST /score {lat, lon, preset}
  → backend: latlng_to_cell(lat, lon, 9)      [H3, ~microseconds]
  → SELECT * FROM h3_grid WHERE h3_index = $1 [PK lookup, <5 ms]
  → apply weights (or read precomputed score_x)
  → build factor contributions + explanations + flags
  → return JSON
  → frontend renders panel + drops pin           [total < 300 ms]
No spatial joins at request time. That's the whole trick.

9. Edge Cases & Failure Modes
Case	Handling
Click outside metro bounds	Return {score: null, reason: "outside coverage"} with a friendly toast
Click in a lake / no data cell	Score with "insufficient data" badge, don't show a fake number
Grid cell has zero population (industrial park)	Normalize within metro; don't divide by zero
OSRM container dies mid-demo	Precomputed fallback isochrones for the 3 demo pins shipped as static GeoJSON
Vector tiles fail to load	Fall back to GeoJSON layer over HTTP (slower but works)
Judge changes weights to all-zeros	Clamp: require Σw > 0, auto-normalize
Batch query on a huge polygon	Cap at 500 cells, return truncated: true
10. Performance Budget
Operation	Budget	How
Initial map load	< 3 s	PMTiles, gzip, only 2 layers on by default
Point score	< 300 ms	PK lookup + in-memory math
Choropleth re-render	< 1 s	MVT tiles, client-side fill
Batch 500 sites	< 5 s	Vectorized pandas/numpy re-weight over cached features
Isochrone (1 site, 3 rings)	< 3 s	OSRM, cached in Redis

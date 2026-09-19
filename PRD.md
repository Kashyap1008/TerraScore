1. The Idea in Plain English
Picking a location for a store, warehouse, EV charger, or telecom tower today means an analyst opens five different GIS tools, exports spreadsheets, eyeballs some maps, and writes a memo. It takes weeks, and two analysts get two different answers.

We're building a "credit score for land" with a high-tech terminal interface. Drop a pin anywhere in the city and get a single number from 0 to 100 telling you how ready that site is — plus a plain-English breakdown of why: "Great footfall demand, but 6 competitors within 1 km and it's inside a FEMA flood zone."

You can also zoom out and see the whole city as a glowing heatmap of hot-spots (neon green = build here) and cold-spots (magenta = avoid), tune what "ready" means for your business (a coffee shop and a warehouse weight things differently), draw a polygon around your search area, compare 3 candidate sites side by side, and export a one-page report.

One-line pitch: "X-ray vision for site selection — paste a location, get a score, see the reasons, in seconds."

2. Target Users
Persona	What they need
Retail/Expansion Analyst	Rank 20 candidate neighborhoods fast, defend the pick to leadership
Logistics/Network Planner	Warehouse siting weighted by highway access + drive-time reach
Infrastructure Planner (EV/Telecom)	Underserved-area detection — where is demand high but coverage low
City/Urban Planner	See equity gaps, flood-risk overlap
3. Core User Stories
Must-have (P0 — demo critical)

As a user, I can click anywhere on the map and get a 0–100 readiness score in < 2 seconds.

As a user, I can see the score broken into 5–6 factor contributions (bar/radar) with human-readable explanations.

As a user, I can toggle data layers (demographics, roads, competitors, zoning, flood) and change opacity.

As a user, I can see a city-wide hot-spot / cold-spot heatmap.

As a user, I can switch the use-case preset (Retail / Warehouse / EV Charging) which changes the weights and re-scores instantly.

As a user, I can draw a polygon and get a ranked list of the top-N candidate sites inside it.

Should-have (P1)

As a user, I can view 10/20/30-min drive-time isochrones for a site and the population reachable inside each.

As a user, I can pin 2–3 sites and compare them in a side-by-side table.

As a user, I can adjust factor weights with sliders and see the score change live.

As a user, I can export a PDF/HTML site report.

Nice-to-have (P2 — only if time)

Cluster explanation ("This hot-spot is driven by 3 anchor tenants + 45k residents").

Shareable permalink to a site + config.

Upload-your-own layer (GeoJSON/CSV) to score against.

4. Scope Boundaries
In scope: One metro area · ~5 data layers · H3-grid scoring · on-demand point scoring · 3 use-case presets · hot/cold-spot map · isochrones for candidate sites · compare + export.

Out of scope (v1): Real-time traffic, multi-city comparison, user accounts/auth, ML model training on labeled outcomes, land parcel ownership/title, cost/pricing data, mobile app, write-back to any system.

5. What "AI-Powered" Means Here (be honest in the pitch)
We are not training a black-box neural net on site success — there are no labels in 36 hours. Our intelligence is three layers:

A transparent, weighted spatial reasoning model (the core — explainable by construction).

Unsupervised ML for spatial structure: DBSCAN for competitor/POI clusters, KMeans for site archetypes ("dense-urban", "suburban-sprawl"), Getis-Ord Gi* for statistically significant hot/cold-spots.

A natural-language explanation layer that converts the numeric breakdown into a 2–3 sentence analyst-style verdict (template-based NLG; optionally an LLM call to polish it).

That's defensible, it works, and every number on screen can be traced.

6. UI/UX Vision: "Cyberpunk GIS"
To stand out from standard hackathon projects, the UI will follow a high-tech terminal aesthetic (inspired by developer tools like DefraDB/Source).

Aesthetic: Deep blacks, neon accents (Lime Green for high scores, Cyan for data, Magenta for alerts), monospace typography for technical data, and glassmorphism panels.

Feel: The app should feel like a sophisticated, military-grade geospatial command center.

Demo Impact: A 2-second fake terminal boot-up sequence (> Initializing geospatial engine... > Loading H3 grid... > Ready.) will immediately grab the judges' attention.

7. Success Metrics (hackathon-judging aligned)
Metric	Target
Time from click → score	< 2 s (p95)
Time to score 500 sites in a drawn polygon	< 10 s
Data layers ingested & visualized	≥ 5
Explanations grounded in real data	100% of factors traceable
Live demo runs end-to-end without a crash	Yes
Judge can use it without instructions	Yes
8. The 3-Minute Demo Script
App loads with a terminal boot sequence → Austin heatmap appears as glowing neon hexagons. "This is every 174m hexagon in the city, scored."

Hover a bright green cluster → "High potential: 42k people in 10 min, zero competitors."

Switch preset Retail → Warehouse. "Same city, different answer. Weights are configurable."

Click a specific site → panel slides in with score 78, neon factor bars, and 3 flags including a magenta flood-zone warning.

Toggle the FEMA flood layer on → the flood polygons visibly eat into the high-score zone. "This is why the score dropped."

Draw a polygon over north Austin → ranked top-5 table appears.

Pin 3 sites → comparison table → click Export → PDF opens.

Close on the isochrone: "62,000 people reachable in 10 minutes."
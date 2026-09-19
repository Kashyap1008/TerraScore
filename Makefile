SHELL := /bin/bash
TIMESTAMP = $(shell date "+%Y-%m-%d %T")
BANNER = @echo ""; @echo "==> [$(TIMESTAMP)] $@"; @echo ""

.PHONY: up down logs ingest tiles dev-backend dev-frontend demo types

up:
	$(BANNER)
	docker compose up -d && docker compose ps

down:
	$(BANNER)
	docker compose down

logs:
	$(BANNER)
	docker compose logs -f --tail=50

ingest:
	$(BANNER)
	set -e; \
	bash scripts/01_fetch_census.sh; \
	bash scripts/02_fetch_osm.sh; \
	bash scripts/03_fetch_fema.sh; \
	bash scripts/04_fetch_epa.sh; \
	bash scripts/05_fetch_landuse.sh; \
	bash scripts/06_load_postgis.sh; \
	bash scripts/07_build_h3_grid.sh; \
	bash scripts/08_score_grid.sh

tiles:
	$(BANNER)
	bash scripts/09_export_tiles.sh

dev-backend:
	$(BANNER)
	cd backend && uvicorn main:app --reload --port 8000

dev-frontend:
	$(BANNER)
	cd frontend && npm run dev

demo:
	$(BANNER)
	$(MAKE) up && $(MAKE) ingest && $(MAKE) tiles

types:
	$(BANNER)
	npx openapi-typescript http://localhost:8000/openapi.json -o frontend/src/api/types.ts

SHELL := /bin/bash
TIMESTAMP = $(shell date "+%Y-%m-%d %T")
BANNER = @echo ""; @echo "==> [$(TIMESTAMP)] $@"; @echo ""

.PHONY: up down logs ingest pipeline score tiles dev-backend dev-frontend demo types

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
	python pipeline/01_ingest_census.py; \
	python pipeline/02_ingest_osm.py; \
	python pipeline/03_ingest_fema.py; \
	python pipeline/04_ingest_epa.py

score:
	$(BANNER)
	set -e; \
	python pipeline/06_build_h3_grid.py; \
	python pipeline/07_score_grid.py; \
	python pipeline/08_hotspot_gi.py

tiles:
	$(BANNER)
	python pipeline/09_export_tiles.py

pipeline:
	$(BANNER)
	$(MAKE) ingest && $(MAKE) score && $(MAKE) tiles

dev-backend:
	$(BANNER)
	cd backend && uvicorn main:app --reload --port 8000

dev-frontend:
	$(BANNER)
	cd frontend && npm run dev

demo:
	$(BANNER)
	$(MAKE) up && $(MAKE) pipeline

types:
	$(BANNER)
	npx openapi-typescript http://localhost:8000/openapi.json -o frontend/src/api/types.ts

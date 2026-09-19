import os
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
import redis.asyncio as redis
from core.config import settings
from db.session import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    global redis_client
    
    # Check DB
    app.state.db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        app.state.db_ok = True
    except Exception as e:
        logger.warning(f"Database connection failed at startup: {e}")
        
    # Check Redis
    app.state.redis_ok = False
    try:
        redis_client = redis.from_url(settings.redis_url)
        await redis_client.ping()
        app.state.redis_ok = True
    except Exception as e:
        logger.warning(f"Redis connection failed at startup: {e}")

    # Load Metro percentiles
    app.state.p1_pop_density = 0.0
    app.state.p99_pop_density = 10000.0
    app.state.worst_decile_aqi = 0.1
    if app.state.db_ok:
        try:
            with engine.connect() as conn:
                res = conn.execute(text("""
                    SELECT
                        percentile_cont(0.01) WITHIN GROUP (ORDER BY pop_density_km2),
                        percentile_cont(0.99) WITHIN GROUP (ORDER BY pop_density_km2)
                    FROM derived.h3_grid WHERE pop_density_km2 > 0
                """)).first()
                if res and res[0] is not None:
                    app.state.p1_pop_density = res[0]
                    app.state.p99_pop_density = res[1]
        except Exception as e:
            logger.warning(f"Failed to load percentiles from DB: {e}")

    # Warm isochrone cache for 3 demo pins
    import json
    import httpx
    import asyncio
    
    demo_pins_path = os.path.join("..", "fixtures", "demo_pins.json")
    if os.path.exists(demo_pins_path):
        try:
            with open(demo_pins_path, "r") as f:
                demo_pins = json.load(f)
            
            async def warm_pin(pin_data):
                lat = pin_data["lat"]
                lon = pin_data["lon"]
                async with httpx.AsyncClient() as client:
                    await client.post(
                        "http://localhost:8000/api/v1/isochrone",
                        json={"lat": lat, "lon": lon, "minutes": [10, 20, 30], "mode": "driving"},
                        timeout=5.0
                    )
            
            # Fire in parallel
            await asyncio.gather(*(warm_pin(p) for p in demo_pins.values()))
            logger.info("cache warmed for 3 demo pins")
        except Exception as e:
            logger.warning(f"Failed to warm cache for demo pins: {e}")
            
    if app.state.db_ok and app.state.redis_ok:
        logger.info("backend ready on http://localhost:8000")
        
    yield
    
    # Shutdown
    try:
        engine.dispose()
    except Exception as e:
        logger.warning(f"Error disposing engine: {e}")
        
    try:
        if redis_client:
            await redis_client.close()
    except Exception as e:
        logger.warning(f"Error closing redis: {e}")

from api.layers import router as layers_router
from api.score import router as score_router
from api.analysis import router as analysis_router
from api.routing import router as routing_router
from api.report import router as report_router

app = FastAPI(
    title="Site Readiness Analyzer API",
    version=settings.api_version,
    docs_url="/docs",
    lifespan=lifespan
)

app.include_router(layers_router, prefix="/api/v1")
app.include_router(score_router, prefix="/api/v1")
app.include_router(analysis_router, prefix="/api/v1")
app.include_router(routing_router, prefix="/api/v1")
app.include_router(report_router, prefix="/api/v1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")

@app.get("/healthz")
async def health_check() -> Dict[str, Any]:
    return {
        "status": "ok",
        "db": app.state.db_ok,
        "redis": app.state.redis_ok,
        "version": settings.api_version
    }

@app.get("/")
async def root() -> Dict[str, str]:
    return {
        "service": "site-readiness",
        "docs": "/docs"
    }

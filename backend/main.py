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

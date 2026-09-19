"""
Site Readiness Analyzer — FastAPI entry point.

Only the /healthz route is implemented here.
All domain routes live in backend/api/ (to be added in subsequent tasks).
"""
from fastapi import FastAPI

app = FastAPI(
    title="Site Readiness Analyzer",
    version="0.1.0",
    description="Data-driven site scoring API for Austin, TX.",
)


@app.get("/healthz", tags=["meta"])
def health_check():
    """Liveness probe — returns 200 when the process is up."""
    return {"status": "ok"}

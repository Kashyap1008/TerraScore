import logging
from typing import Optional, Dict, Literal, Any
from fastapi import APIRouter, Request
from pydantic import BaseModel
from core.scoring import latlng_to_h3, load_preset, compute_score
from core.mock_cell import generate_mock_cell

router = APIRouter()
logger = logging.getLogger(__name__)

class ScoreRequest(BaseModel):
    lat: float
    lon: float
    preset: Literal['retail', 'warehouse', 'ev']
    weights: Optional[Dict[str, float]] = None

@router.post("/score")
async def get_score(req: ScoreRequest, request: Request) -> Dict[str, Any]:
    h3_idx = latlng_to_h3(req.lat, req.lon)
    
    # Mocking DB fetch logic for now
    cell = generate_mock_cell(req.lat, req.lon, h3_idx)
    logger.warning("h3_grid empty — using mock fallback")
    
    preset = load_preset(req.preset)
    
    app_state = request.app.state
    p1 = getattr(app_state, "p1_pop_density", 0.0)
    p99 = getattr(app_state, "p99_pop_density", 10000.0)
    aqi = getattr(app_state, "worst_decile_aqi", 0.1)
    
    cell["p1_pop_density"] = p1
    cell["p99_pop_density"] = p99
    cell["worst_decile_threshold"] = aqi

    result = compute_score(cell, preset, req.weights)
    return result

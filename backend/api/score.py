import logging
from typing import Optional, Dict, Literal, Any
from fastapi import APIRouter, Request, HTTPException
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
    # 1. Unknown preset is handled by Pydantic (Literal) returning 422.
    
    # 2. Weights summing to 0
    if req.weights and sum(req.weights.values()) == 0:
        raise HTTPException(status_code=400, detail="weights must sum to > 0")

    # 3. Check bbox (Austin bbox roughly from config)
    if not (30.1 <= req.lat <= 30.5 and -98.0 <= req.lon <= -97.5):
        return {"score": None, "reason": "outside_coverage"}

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
    result["h3"] = h3_idx
    return result

class BatchScoreRequest(BaseModel):
    polygon: Dict[str, Any]
    preset: Literal['retail', 'warehouse', 'ev']
    limit: int = 500

@router.post("/score/batch")
async def get_score_batch(req: BatchScoreRequest, request: Request):
    from db.session import get_db
    from sqlalchemy import text
    import json
    
    # 4. Empty polygon
    if not req.polygon or "coordinates" not in req.polygon or not req.polygon["coordinates"] or not req.polygon["coordinates"][0]:
        raise HTTPException(status_code=400, detail="polygon required")
        
    preset_col = {
        'retail': 'score_retail',
        'warehouse': 'score_warehouse',
        'ev': 'score_ev'
    }.get(req.preset)
    
    if not preset_col:
        return {"error": "Invalid preset"}

    polygon_json = json.dumps(req.polygon)

    query = text(f"""
        SELECT h3_index, lat, lon, {preset_col} as score
        FROM derived.h3_grid
        WHERE ST_Intersects(geom, ST_GeomFromGeoJSON(:geojson))
        AND {preset_col} IS NOT NULL
        ORDER BY {preset_col} DESC
        LIMIT :limit
    """)
    
    try:
        db_gen = get_db()
        db = next(db_gen)
        
        result = db.execute(query, {"geojson": polygon_json, "limit": req.limit}).fetchall()
        db.close()
        
        results = []
        for rank, row in enumerate(result, 1):
            results.append({
                "rank": rank,
                "h3": row.h3_index,
                "lat": row.lat,
                "lon": row.lon,
                "score": float(row.score) if row.score is not None else 0.0,
                "top_factor": "Unknown" # Placeholder
            })
            
        return {
            "results": results,
            "truncated": len(results) == req.limit
        }
    except Exception as e:
        logger.error(f"Error querying batch score: {e}")
        # Return mock fallback so UI doesn't crash during development
        return {"results": [{"rank": 1, "h3": "mock_h3", "lat": 30.27, "lon": -97.74, "score": 85.0, "top_factor": "Demand"}], "truncated": False, "error": str(e)}

import json
from typing import List, Dict, Any, Literal
from fastapi import APIRouter, Request, Query
from pydantic import BaseModel
from sqlalchemy import text
from core.scoring import compute_score, load_preset
from core.mock_cell import generate_mock_cell

router = APIRouter()

@router.get("/hotspots")
async def get_hotspots(preset: str = "retail", type: Literal["hot", "cold"] = "hot", min_z: float = 1.96):
    from db.session import get_db
    
    preset_col = {
        'retail': 'hotspot_z_retail',
        'warehouse': 'hotspot_z_warehouse',
        'ev': 'hotspot_z_ev'
    }.get(preset)
    
    score_col = {
        'retail': 'score_retail',
        'warehouse': 'score_warehouse',
        'ev': 'score_ev'
    }.get(preset)
    
    if not preset_col:
        return {"error": "Invalid preset"}

    op = ">" if type == "hot" else "<"
    val = min_z if type == "hot" else -min_z
    
    query = text(f"""
        SELECT h3_index, {score_col} as score, {preset_col} as z, ST_AsGeoJSON(geom) as geom_json
        FROM derived.h3_grid
        WHERE {preset_col} {op} :val
        AND {preset_col} IS NOT NULL
    """)
    
    try:
        db_gen = get_db()
        db = next(db_gen)
        result = db.execute(query, {"val": val}).fetchall()
        db.close()
        
        features = []
        for row in result:
            features.append({
                "type": "Feature",
                "properties": {
                    "h3": row.h3_index,
                    "score": float(row.score) if row.score is not None else 0.0,
                    "z": float(row.z) if row.z is not None else 0.0
                },
                "geometry": json.loads(row.geom_json)
            })
            
        return {
            "type": "FeatureCollection",
            "features": features
        }
    except Exception as e:
        # mock fallback
        return {"type": "FeatureCollection", "features": [], "error": str(e)}

class Site(BaseModel):
    lat: float
    lon: float

class CompareRequest(BaseModel):
    sites: List[Site]
    preset: Literal['retail', 'warehouse', 'ev']

@router.post("/compare")
async def compare_sites(req: CompareRequest, request: Request):
    from core.scoring import latlng_to_h3
    preset_data = load_preset(req.preset)
    
    sites_result = []
    
    app_state = request.app.state
    p1 = getattr(app_state, "p1_pop_density", 0.0)
    p99 = getattr(app_state, "p99_pop_density", 10000.0)
    aqi = getattr(app_state, "worst_decile_aqi", 0.1)
    
    for s in req.sites:
        h3_idx = latlng_to_h3(s.lat, s.lon)
        # Ideally fetch from DB, but we mock cell for consistency
        cell = generate_mock_cell(s.lat, s.lon, h3_idx)
        cell["p1_pop_density"] = p1
        cell["p99_pop_density"] = p99
        cell["worst_decile_threshold"] = aqi
        
        res = compute_score(cell, preset_data)
        
        sites_result.append({
            "lat": s.lat,
            "lon": s.lon,
            "score": res["score"],
            "grade": res["grade"],
            "factors": {f["key"]: f["raw"] for f in res["factors"]}
        })
        
    winners = {}
    if sites_result:
        # overall winner
        winners["overall"] = max(range(len(sites_result)), key=lambda i: sites_result[i]["score"])
        # factor winners
        if sites_result[0]["factors"]:
            for factor_key in sites_result[0]["factors"].keys():
                winners[factor_key] = max(range(len(sites_result)), key=lambda i: sites_result[i]["factors"].get(factor_key, 0))
                
    return {
        "sites": sites_result,
        "winners": winners
    }

import h3
import json
import math
from typing import Dict, Any, Optional
from core.config import settings
from core.explanations import build_explanation

def latlng_to_h3(lat: float, lon: float, res: int = 9) -> str:
    return h3.geo_to_h3(lat, lon, res)

def load_preset(name: str) -> dict:
    try:
        with open(settings.presets_path, 'r') as f:
            presets = json.load(f)
        return presets.get(name, presets.get('retail', {}))
    except Exception:
        return {}

def normalize_weights(weights: Dict[str, float]) -> Dict[str, float]:
    total = sum(weights.values())
    if total == 0:
        raise ValueError("Sum of weights cannot be zero.")
    return {k: v / total for k, v in weights.items()}

def compute_score(cell: Dict[str, Any], preset: Dict[str, Any], override_weights: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
    weights = preset.get("weights", {
        "demand": 0.2, "accessibility": 0.2, "competition": 0.2,
        "complementarity": 0.2, "landuse": 0.1, "risk": 0.1
    })
    if override_weights is not None:
        weights = override_weights
    
    weights = normalize_weights(weights)
    params = preset.get("params", {})
    
    # 1. Demand
    p1 = cell.get("p1_pop_density", 0.0)
    p99 = cell.get("p99_pop_density", 10000.0)
    pop_density = cell.get("pop_density", 0.0)
    if p99 > p1:
        raw_demand = min(max((pop_density - p1) / (p99 - p1), 0.0), 1.0)
    else:
        raw_demand = 0.0

    # 2. Accessibility
    road_density = cell.get("road_density", 0.0)
    dist_to_highway_m = cell.get("dist_to_highway_m", 5000.0)
    transit_count_800m = cell.get("transit_count_800m", 0)
    raw_acc_dist = max(1 - (dist_to_highway_m / 5000.0), 0.0)
    raw_accessibility = min((road_density / 20000.0) + raw_acc_dist + (transit_count_800m / 20.0), 1.0)

    # 3. Competition
    competitor_decay_score = cell.get("competitor_decay_score", 0.0)
    c_star = params.get("c_star", 3.0)
    sigma = params.get("sigma", 2.0)
    raw_competition = math.exp(-((competitor_decay_score - c_star) ** 2) / (2 * sigma ** 2))

    # 4. Complementarity
    anchor_count_1km = cell.get("anchor_count_1km", 0)
    raw_complementarity = 1 - math.exp(-anchor_count_1km / 3.0)

    # 5. Landuse
    zone_class = cell.get("zone_class", "unknown")
    suitability = params.get("suitability", {"commercial": 1.0, "industrial": 0.5, "residential": 0.2, "unknown": 0.1})
    raw_landuse = suitability.get(zone_class, 0.1)

    # 6. Risk
    flood_risk = cell.get("flood_risk", 0.0)
    raw_risk = 1.0 - flood_risk

    raw_scores = {
        "demand": raw_demand,
        "accessibility": raw_accessibility,
        "competition": raw_competition,
        "complementarity": raw_complementarity,
        "landuse": raw_landuse,
        "risk": raw_risk
    }

    factors = []
    base = 0.0
    
    for k in ['demand', 'accessibility', 'competition', 'complementarity', 'landuse', 'risk']:
        raw_k = raw_scores[k]
        weight_k = weights.get(k, 0.0)
        contribution_k = weight_k * raw_k
        base += contribution_k
        factors.append({
            "key": k,
            "label": k.capitalize(),
            "raw": raw_k,
            "weight": weight_k,
            "contribution": contribution_k,
            "explanation": build_explanation(k, raw_k, cell)
        })

    penalty = 1.0
    flags = []
    if flood_risk == 1.0:
        penalty *= 0.35
        flags.append("High Flood Risk")
    
    aqi_score = cell.get("aqi_score", 0.5)
    worst_decile_threshold = cell.get("worst_decile_threshold", 0.1)
    if aqi_score < worst_decile_threshold:
        penalty *= 0.85
        flags.append("Poor Air Quality")

    final_score = max(min(100 * base * penalty, 100), 0)

    if final_score >= 90:
        grade = "A+"
    elif final_score >= 80:
        grade = "A"
    elif final_score >= 70:
        grade = "B"
    elif final_score >= 60:
        grade = "C"
    elif final_score >= 50:
        grade = "D"
    else:
        grade = "F"

    if pop_density > p99 * 0.5 and transit_count_800m > 5:
        archetype = "Urban Core"
    elif road_density > 10000:
        archetype = "Transit Hub"
    elif raw_competition < 0.3 and raw_demand > 0.5:
        archetype = "Underserved Suburb"
    else:
        archetype = "Standard"

    return {
        "score": final_score,
        "grade": grade,
        "factors": factors,
        "flags": flags,
        "archetype": archetype
    }

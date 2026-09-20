import hashlib
from typing import Dict, Any

def generate_mock_cell(lat: float, lon: float, h3_idx: str) -> Dict[str, Any]:
    # Deterministic pseudo-random based on h3_idx so all points in a hex share the same mock data
    seed_str = h3_idx
    hash_val = int(hashlib.md5(seed_str.encode()).hexdigest()[:8], 16)
    
    def r(offset: int) -> float:
        return ((hash_val + offset) % 1000) / 1000.0

    return {
        "h3_index": h3_idx,
        "pop_density": r(1) * 15000,
        "median_income": 40000 + r(2) * 80000,
        "road_density": r(3) * 20000,
        "dist_to_highway_m": r(4) * 10000,
        "transit_count_800m": int(r(5) * 50),
        "competitor_decay_score": r(6) * 10,
        "competitor_count_1km": int(r(6) * 20),
        "anchor_count_1km": int(r(7) * 5),
        "zone_class": ["commercial", "residential", "industrial", "unknown"][int(r(8) * 4)],
        "flood_risk": 1.0 if r(9) > 0.9 else 0.0,
        "aqi_score": 0.05 + r(10) * 0.9,
    }

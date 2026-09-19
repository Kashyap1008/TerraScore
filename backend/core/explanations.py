from typing import Dict, Any

def build_explanation(factor_key: str, raw: float, row: Dict[str, Any]) -> str:
    if factor_key == 'demand':
        pop = int(row.get('pop_density', 0))
        income = int(row.get('median_income', 0) / 1000)
        percentile = int(raw * 100)
        return f"Dense residential catchment: {pop} residents within 1 km, median income ${income}k (metro p{percentile})."
    
    elif factor_key == 'competition':
        n = row.get('competitor_count_1km', 0)
        c_star = 3
        if n < c_star - 1:
            verdict = f"below the optimal {c_star} — underserved market"
        elif n > c_star + 1:
            verdict = f"above the optimal {c_star} — market is served"
        else:
            verdict = "at the optimal sweet spot"
        return f"{n} competitors within 1 km — {verdict}."
        
    elif factor_key == 'risk':
        flood_risk = row.get('flood_risk', 0.0)
        if flood_risk == 1.0:
            return "⚠ Site intersects a FEMA high-risk flood zone. Score reduced 65%."
        else:
            return "Outside FEMA high-risk zones."
            
    elif factor_key == 'accessibility':
        transit = row.get('transit_count_800m', 0)
        road = int(row.get('road_density', 0))
        return f"{transit} transit stops within 800 m; {road} m road per km²."
        
    elif factor_key == 'complementarity':
        n = row.get('anchor_count_1km', 0)
        return f"{n} anchor tenants within 1 km."
        
    elif factor_key == 'landuse':
        zone_class = row.get('zone_class', 'unknown')
        return f"Zoned {zone_class}."
        
    return ""

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
import datetime
from core.scoring import compute_score, load_preset
from core.mock_cell import generate_mock_cell

router = APIRouter()

@router.get("/report/{h3_index}")
async def get_report(h3_index: str, request: Request, preset: str = "retail"):
    import h3
    
    if not h3.h3_is_valid(h3_index):
        return HTMLResponse(
            content="""
            <html>
                <body style="background: #050505; color: #FFF; font-family: monospace; text-align: center; padding: 50px;">
                    <h1 style="color: #FF00FF;">404 - CELL NOT FOUND</h1>
                    <p>The requested H3 index does not exist in the active coverage area.</p>
                </body>
            </html>
            """,
            status_code=404
        )
        
    try:
        lat, lon = h3.h3_to_geo(h3_index)
    except Exception:
        lat, lon = 30.2672, -97.7431
        
    cell = generate_mock_cell(lat, lon, h3_index)
    preset_data = load_preset(preset)
    
    app_state = request.app.state
    cell["p1_pop_density"] = getattr(app_state, "p1_pop_density", 0.0)
    cell["p99_pop_density"] = getattr(app_state, "p99_pop_density", 10000.0)
    cell["worst_decile_threshold"] = getattr(app_state, "worst_decile_aqi", 0.1)
    
    result = compute_score(cell, preset_data)
    
    score = int(result["score"])
    grade = result["grade"]
    
    # Simple inline SVG hexagon
    hex_svg = f"""
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="{"#CCFF00" if score >= 80 else "#00E5FF" if score >= 60 else "#FF00FF"}" stroke="none" />
        <text x="50" y="55" font-family="monospace" font-size="24" font-weight="bold" fill="#000" text-anchor="middle" dominant-baseline="middle">{score}</text>
    </svg>
    """
    
    factors_html = ""
    for f in result["factors"]:
        width = int(f["raw"] * 100)
        factors_html += f"""
        <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #888;">
                <span>{f['label'].upper()}</span>
                <span style="color: #CCFF00;">{width}/100</span>
            </div>
            <div style="background: #111; height: 8px; width: 100%;">
                <div style="background: #CCFF00; height: 100%; width: {width}%;"></div>
            </div>
            <div style="font-size: 10px; color: #666; margin-top: 4px;">{f['explanation']}</div>
        </div>
        """
        
    flags_html = ""
    if result["flags"]:
        flags_html = '<div style="margin-top: 20px; border: 1px solid #FF0000; padding: 10px; color: #FF0000;">'
        flags_html += '<div style="font-weight: bold; margin-bottom: 5px;">⚠ WARNINGS</div>'
        for flag in result["flags"]:
            flags_html += f'<div>• {flag}</div>'
        flags_html += '</div>'
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Site Report - {h3_index}</title>
        <style>
            body {{
                background-color: #050505;
                color: #FFF;
                font-family: 'JetBrains Mono', monospace;
                margin: 0;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
            }}
            .header {{
                display: flex;
                align-items: center;
                border-bottom: 1px solid #333;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }}
            .grade {{
                font-size: 48px;
                font-weight: bold;
                color: #CCFF00;
                margin-left: 20px;
            }}
            .title {{
                flex-grow: 1;
                margin-left: 20px;
            }}
            .title h1 {{ margin: 0; font-size: 24px; color: #CCFF00; }}
            .title p {{ margin: 5px 0 0 0; color: #888; font-size: 14px; }}
            .footer {{
                margin-top: 50px;
                border-top: 1px solid #333;
                padding-top: 20px;
                color: #666;
                font-size: 10px;
                text-align: center;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            {hex_svg}
            <div class="grade">{grade}</div>
            <div class="title">
                <h1>SITE READINESS REPORT</h1>
                <p>H3: {h3_index} | Preset: {preset.upper()}</p>
                <p>Archetype: <span style="color: #00E5FF;">{result['archetype']}</span></p>
            </div>
        </div>
        
        <div class="factors">
            {factors_html}
        </div>
        
        {flags_html}
        
        <div class="footer">
            Site Readiness Analyzer // Austin, TX // {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html)

"""
Zone / heatmap endpoints.

GET  /api/zones/heatmap
GET  /api/zones/{zone_id}/details
GET  /api/zones/accidents
POST /api/zones/recalculate  (internal)
"""
import json
from datetime import date, timedelta
from fastapi import APIRouter, Query, HTTPException
from app.services.risk_engine import ZoneData, calculate_api_score, forecast_api_score

router = APIRouter()

# ── Demo seed data (used when DB is not yet seeded) ───────────────────────────
DEMO_ZONES = [
    {
        "zone_id": "zone-001",
        "zone_name": "Silk Board Junction",
        "city": "Bengaluru",
        "road_type": "SH",
        "last_relaying_date": "2022-03-15",
        "api_score": 83.0,
        "api_score_7day_forecast": 91.0,
        "risk_category": "Critical",
        "damage_reports_count": 23,
        "accident_count_1yr": 12,
        "fatal_count": 2,
        "repair_status": "pending",
        "lat": 12.9176,
        "lng": 77.6228,
        "geom": {
            "type": "Polygon",
            "coordinates": [[[77.620, 12.915], [77.626, 12.915],
                              [77.626, 12.921], [77.620, 12.921], [77.620, 12.915]]]
        },
        "contributing_factors": {"infrastructure": 40, "accidents": 30, "weather": 8, "context": 5},
    },
    {
        "zone_id": "zone-002",
        "zone_name": "Marathahalli Bridge",
        "city": "Bengaluru",
        "road_type": "NH",
        "last_relaying_date": "2023-07-01",
        "api_score": 61.0,
        "api_score_7day_forecast": 67.0,
        "risk_category": "High",
        "damage_reports_count": 14,
        "accident_count_1yr": 6,
        "fatal_count": 0,
        "repair_status": "assigned",
        "lat": 12.9591,
        "lng": 77.7006,
        "geom": {
            "type": "Polygon",
            "coordinates": [[[77.698, 12.957], [77.703, 12.957],
                              [77.703, 12.962], [77.698, 12.962], [77.698, 12.957]]]
        },
        "contributing_factors": {"infrastructure": 28, "accidents": 18, "weather": 10, "context": 5},
    },
    {
        "zone_id": "zone-003",
        "zone_name": "Koramangala 5th Block",
        "city": "Bengaluru",
        "road_type": "MDR",
        "last_relaying_date": "2024-01-10",
        "api_score": 38.0,
        "api_score_7day_forecast": 42.0,
        "risk_category": "Medium",
        "damage_reports_count": 7,
        "accident_count_1yr": 3,
        "fatal_count": 0,
        "repair_status": "in_progress",
        "lat": 12.9352,
        "lng": 77.6245,
        "geom": {
            "type": "Polygon",
            "coordinates": [[[77.622, 12.933], [77.627, 12.933],
                              [77.627, 12.938], [77.622, 12.938], [77.622, 12.933]]]
        },
        "contributing_factors": {"infrastructure": 18, "accidents": 9, "weather": 6, "context": 5},
    },
    {
        "zone_id": "zone-004",
        "zone_name": "Indiranagar 100ft Road",
        "city": "Bengaluru",
        "road_type": "Urban",
        "last_relaying_date": "2024-09-20",
        "api_score": 15.0,
        "api_score_7day_forecast": 17.0,
        "risk_category": "Low",
        "damage_reports_count": 2,
        "accident_count_1yr": 1,
        "fatal_count": 0,
        "repair_status": "completed",
        "lat": 12.9784,
        "lng": 77.6408,
        "geom": {
            "type": "Polygon",
            "coordinates": [[[77.638, 12.976], [77.643, 12.976],
                              [77.643, 12.981], [77.638, 12.981], [77.638, 12.976]]]
        },
        "contributing_factors": {"infrastructure": 8, "accidents": 3, "weather": 2, "context": 2},
    },
    {
        "zone_id": "zone-005",
        "zone_name": "Electronic City Phase 1",
        "city": "Bengaluru",
        "road_type": "NH",
        "last_relaying_date": "2021-11-05",
        "api_score": 72.0,
        "api_score_7day_forecast": 79.0,
        "risk_category": "High",
        "damage_reports_count": 18,
        "accident_count_1yr": 9,
        "fatal_count": 1,
        "repair_status": "pending",
        "lat": 12.8399,
        "lng": 77.6770,
        "geom": {
            "type": "Polygon",
            "coordinates": [[[77.675, 12.838], [77.680, 12.838],
                              [77.680, 12.843], [77.675, 12.843], [77.675, 12.838]]]
        },
        "contributing_factors": {"infrastructure": 35, "accidents": 22, "weather": 10, "context": 5},
    },
]

DEMO_ACCIDENTS = [
    {"id": "acc-001", "zone_id": "zone-001", "lat": 12.9178, "lng": 77.6230,
     "severity": "fatal", "accident_date": "2024-08-12", "weather_condition": "Rain"},
    {"id": "acc-002", "zone_id": "zone-001", "lat": 12.9174, "lng": 77.6225,
     "severity": "serious", "accident_date": "2024-06-03", "weather_condition": "Clear"},
    {"id": "acc-003", "zone_id": "zone-002", "lat": 12.9593, "lng": 77.7008,
     "severity": "minor", "accident_date": "2024-09-20", "weather_condition": "Fog"},
    {"id": "acc-004", "zone_id": "zone-005", "lat": 12.8401, "lng": 77.6772,
     "severity": "fatal", "accident_date": "2024-07-15", "weather_condition": "Rain"},
    {"id": "acc-005", "zone_id": "zone-003", "lat": 12.9354, "lng": 77.6247,
     "severity": "minor", "accident_date": "2024-10-01", "weather_condition": "Clear"},
]


@router.get("/heatmap")
async def get_heatmap(
    city: str = Query("Bengaluru"),
    bounds: str = Query(None),
    country: str = Query("IN"),
):
    """
    Return GeoJSON FeatureCollection of road zones with API scores.
    Uses demo data when DB is not seeded.
    """
    features = []
    for z in DEMO_ZONES:
        features.append({
            "type": "Feature",
            "geometry": z["geom"],
            "properties": {
                "zone_id": z["zone_id"],
                "zone_name": z["zone_name"],
                "road_type": z["road_type"],
                "api_score": z["api_score"],
                "api_score_7day_forecast": z["api_score_7day_forecast"],
                "risk_category": z["risk_category"],
                "damage_reports_count": z["damage_reports_count"],
                "accident_count_1yr": z["accident_count_1yr"],
                "last_relaying_date": z["last_relaying_date"],
                "repair_status": z["repair_status"],
            },
        })
    return {"type": "FeatureCollection", "features": features}


@router.get("/accidents")
async def get_accidents(city: str = Query("Bengaluru")):
    """Return historical accident markers for the map."""
    return DEMO_ACCIDENTS


@router.get("/{zone_id}/details")
async def get_zone_details(zone_id: str):
    """Return full risk breakdown for a single zone."""
    zone = next((z for z in DEMO_ZONES if z["zone_id"] == zone_id), None)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone


@router.post("/recalculate")
async def recalculate_scores():
    """
    Internal endpoint — recalculates API Score for all zones.
    Called by Celery beat scheduler.
    """
    updated = 0
    for z in DEMO_ZONES:
        zone_data = ZoneData(
            reports_last_30_days=z["damage_reports_count"],
            avg_ai_severity=6.0,
            days_since_relay=365,
            accidents_last_year=z["accident_count_1yr"],
            fatal_count=z["fatal_count"],
            current_rainfall_mm=0.0,
        )
        score, category = calculate_api_score(zone_data)
        forecast = forecast_api_score(score, zone_data)
        z["api_score"] = score
        z["api_score_7day_forecast"] = forecast
        z["risk_category"] = category
        updated += 1
    return {"updated": updated}

"""
Emergency / RoadSoS endpoints.
GET  /api/emergency/nearby
POST /api/emergency/incident
"""
from fastapi import APIRouter, Query, HTTPException

router = APIRouter()


@router.get("/nearby")
async def get_nearby_resources(
    lat: float = Query(...),
    lng: float = Query(...),
    type: str = Query("hospital,ambulance", description="Comma-separated resource types"),
):
    """
    Return nearest emergency resources sorted by distance.
    Uses PostGIS ST_Distance for proximity calculation.
    """
    # TODO: query emergency_resources with PostGIS
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/incident")
async def report_incident(body: dict):
    """
    One-tap incident report.
    Returns nearest hospital, driving route, ambulance + police contacts.
    """
    # TODO: call routing_service.get_emergency_route
    raise HTTPException(status_code=501, detail="Not implemented yet")

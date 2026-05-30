"""
SENTINEL SOS — SOS API Routes.

GET  /api/sos/nearby     — Fetch nearby emergency services (Overpass)
POST /api/sos/analyze    — AI triage analysis
POST /api/sos/create     — Create SOS event
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.pydantic_schemas import (
    TriageRequest,
    SOSCreateRequest,
    SOSCreateResponse,
)
from app.services.location_service import get_location_provider, ALL_CATEGORIES
from app.services.sos_service import get_sos_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/nearby")
async def get_nearby_services(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius: int = Query(default=5000, ge=500, le=50000, description="Search radius in meters"),
    categories: Optional[str] = Query(
        default=None,
        description="Comma-separated categories: hospital,ambulance,police,fire_station,mechanic,fuel_station,puncture_shop,towing"
    ),
):
    """
    Fetch nearby emergency services from OpenStreetMap via Overpass API.
    Returns REAL data — no mock data.
    """
    if categories:
        cat_list = [c.strip() for c in categories.split(",") if c.strip()]
        invalid = [c for c in cat_list if c not in ALL_CATEGORIES]
        if invalid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid categories: {invalid}. Valid: {ALL_CATEGORIES}"
            )
    else:
        cat_list = ALL_CATEGORIES

    try:
        provider = get_location_provider()
        results = await provider.get_nearby(lat=lat, lon=lon, radius=radius, categories=cat_list)

        return {
            cat: [r.to_dict() for r in locs]
            for cat, locs in results.items()
        }
    except Exception as e:
        logger.error("Nearby services fetch failed: %s", e)
        raise HTTPException(status_code=503, detail=f"Location service unavailable: {str(e)}")


@router.post("/analyze")
async def analyze_emergency(body: TriageRequest):
    """
    AI triage analysis of emergency description.
    Returns severity, recommendations, and nearby services for required categories.
    """
    try:
        sos_service = get_sos_service()
        result = await sos_service.analyze_only(
            description=body.description,
            lat=body.latitude,
            lon=body.longitude,
        )
        return result
    except Exception as e:
        logger.error("Triage analysis failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/create")
async def create_sos_event(
    body: SOSCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a full SOS event:
    1. Triage analysis
    2. Fetch nearby services
    3. Persist to DB
    4. Return combined response
    """
    valid_types = [
        "accident", "ambulance", "police", "breakdown",
        "flat_tire", "fuel", "medical", "fire"
    ]
    if body.incident_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid incident_type. Must be one of: {valid_types}"
        )

    try:
        sos_service = get_sos_service()
        result = await sos_service.trigger_sos(
            incident_type=body.incident_type,
            lat=body.latitude,
            lon=body.longitude,
            description=body.description or "",
            user_id=body.user_id,
            db_session=db,
        )
        return result
    except Exception as e:
        logger.error("SOS creation failed: %s", e)
        raise HTTPException(status_code=500, detail=f"SOS creation failed: {str(e)}")

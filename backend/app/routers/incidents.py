"""
SENTINEL SOS — Incident History Routes.

GET /api/incidents — User's SOS event history
GET /api/incidents/{id} — Single incident detail
PATCH /api/incidents/{id}/resolve — Mark incident as resolved
"""
import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.db_models import SOSEvent, User
from app.routers.contacts import get_or_create_user
from app.schemas.pydantic_schemas import IncidentHistoryItem

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", response_model=List[IncidentHistoryItem])
async def get_incidents(
    x_user_id: Optional[str] = Header(default=None),
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Get incident history for the current user, newest first."""
    user = await get_or_create_user(x_user_id, db)
    result = await db.execute(
        select(SOSEvent)
        .where(SOSEvent.user_id == user.id)
        .order_by(desc(SOSEvent.created_at))
        .limit(limit)
    )
    events = result.scalars().all()
    return events


@router.get("/{incident_id}")
async def get_incident(
    incident_id: UUID,
    x_user_id: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Get a single incident with full triage details."""
    user = await get_or_create_user(x_user_id, db)
    result = await db.execute(
        select(SOSEvent).where(
            SOSEvent.id == incident_id,
            SOSEvent.user_id == user.id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Incident not found")

    return {
        "id": str(event.id),
        "incident_type": event.incident_type,
        "severity": event.severity,
        "latitude": event.latitude,
        "longitude": event.longitude,
        "description": event.description,
        "status": event.status,
        "triage_result": event.triage_result,
        "created_at": event.created_at.isoformat(),
        "resolved_at": event.resolved_at.isoformat() if event.resolved_at else None,
    }


@router.patch("/{incident_id}/resolve")
async def resolve_incident(
    incident_id: UUID,
    x_user_id: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Mark an incident as resolved."""
    from datetime import datetime

    user = await get_or_create_user(x_user_id, db)
    result = await db.execute(
        select(SOSEvent).where(
            SOSEvent.id == incident_id,
            SOSEvent.user_id == user.id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Incident not found")

    event.status = "resolved"
    event.resolved_at = datetime.utcnow()
    await db.flush()

    return {"id": str(event.id), "status": "resolved"}

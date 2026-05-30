"""
SENTINEL SOS — Pydantic v2 request/response schemas.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field


# ── Location schemas ───────────────────────────────────────────────────────────

class LocationResultSchema(BaseModel):
    osm_id: str
    name: str
    category: str
    latitude: float
    longitude: float
    distance_km: float
    phone: Optional[str] = None
    address: Optional[str] = None
    opening_hours: Optional[str] = None
    website: Optional[str] = None


# ── Triage schemas ─────────────────────────────────────────────────────────────

class TriageRequest(BaseModel):
    description: str = Field(..., min_length=1)
    latitude: float
    longitude: float


class TriageResultSchema(BaseModel):
    severity: str                          # LOW|MEDIUM|HIGH|CRITICAL
    call_emergency: bool
    recommendations: List[str]
    required_services: List[str]
    first_aid_topic: Optional[str] = None
    score: int = 0


# ── SOS schemas ────────────────────────────────────────────────────────────────

class SOSCreateRequest(BaseModel):
    incident_type: str = Field(..., description="accident|ambulance|police|breakdown|flat_tire|fuel|medical|fire")
    latitude: float
    longitude: float
    description: Optional[str] = ""
    user_id: Optional[UUID] = None


class SOSEventSchema(BaseModel):
    id: UUID
    incident_type: str
    severity: str
    latitude: float
    longitude: float
    description: Optional[str]
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SOSCreateResponse(BaseModel):
    event: SOSEventSchema
    triage: TriageResultSchema
    nearby_services: Dict[str, List[LocationResultSchema]]


class NearbyRequest(BaseModel):
    lat: float
    lon: float
    radius: int = Field(default=5000, ge=500, le=50000)
    categories: Optional[str] = None  # comma-separated


# ── Emergency Contact schemas ──────────────────────────────────────────────────

class EmergencyContactCreate(BaseModel):
    name: str = Field(..., min_length=1)
    phone: str = Field(..., min_length=5)
    relationship: str = Field(default="family")


class EmergencyContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    relationship: Optional[str] = None


class EmergencyContactSchema(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    phone: str
    relationship: str

    class Config:
        from_attributes = True


# ── User schemas ───────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None


class UserSchema(BaseModel):
    id: UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Incident history schemas ───────────────────────────────────────────────────

class IncidentHistoryItem(BaseModel):
    id: UUID
    incident_type: str
    severity: str
    latitude: float
    longitude: float
    description: Optional[str]
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

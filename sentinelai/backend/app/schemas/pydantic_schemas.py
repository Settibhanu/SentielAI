"""
Pydantic v2 schemas for request/response validation.
Covers all endpoints from the HTML spec.
"""
from datetime import datetime, date
from typing import Optional, List, Any
from uuid import UUID

from pydantic import BaseModel, Field


# ── Report schemas ─────────────────────────────────────────────────────────────

class ReportSubmit(BaseModel):
    image: Optional[str] = Field(None, description="Base64-encoded image string")
    lat: float
    lng: float
    damage_type: str = Field(..., description="pothole|crack|flooding|broken_signal|missing_divider")
    manual_severity: str = Field("medium", description="low|medium|high")
    road_type: str = Field("Urban", description="NH|SH|MDR|Urban|Local")
    country_code: str = Field("IN")
    description: Optional[str] = None
    synced_from_offline: bool = False
    offline_queued_at: Optional[datetime] = None

    @property
    def manual_severity_numeric(self) -> float:
        return {"low": 2.0, "medium": 5.0, "high": 8.0}.get(self.manual_severity, 5.0)


class RoutingInfo(BaseModel):
    routed_to: str
    division: str
    ee_email: str
    ee_phone: str
    sla_days: int
    expected_resolution: str
    message: str


class ReportSubmitResponse(BaseModel):
    report_id: UUID
    ai_severity_score: float
    ai_damage_class: str
    zone_id: Optional[UUID] = None
    zone_risk_level: str
    routing: Optional[RoutingInfo] = None


class ReportStatus(BaseModel):
    status: str
    repair_assigned: bool
    eta: Optional[str] = None


class OfflineSyncBatch(BaseModel):
    reports: List[ReportSubmit]


# ── Zone schemas ───────────────────────────────────────────────────────────────

class ZoneSummary(BaseModel):
    zone_id: str
    zone_name: str
    road_type: str
    api_score: float
    api_score_7day_forecast: float
    risk_category: str
    damage_reports_count: int
    accident_count_1yr: int
    last_relaying_date: Optional[str] = None
    repair_status: Optional[str] = None


class ContributingFactors(BaseModel):
    infrastructure: float
    accidents: float
    weather: float
    context: float


class ZoneDetail(ZoneSummary):
    fatal_count: int
    contributing_factors: ContributingFactors
    weather_risk_multiplier: Optional[float] = None


# ── Repair schemas ─────────────────────────────────────────────────────────────

class RepairAssign(BaseModel):
    zone_id: UUID
    contractor: str
    budget: int = Field(..., description="Budget in local currency")
    deadline: date
    fund_source: str = Field("State PWD")
    fund_source_url: Optional[str] = None


class RepairRecord(BaseModel):
    id: str
    zone_id: str
    zone_name: Optional[str] = None
    status: str
    contractor_name: Optional[str] = None
    amount_sanctioned_inr: Optional[int] = None
    amount_spent_inr: Optional[int] = None
    fund_source: Optional[str] = None
    fund_source_url: Optional[str] = None
    estimated_completion: Optional[str] = None
    actual_completion: Optional[str] = None
    quality_score: Optional[float] = None
    recurring_damage: bool = False

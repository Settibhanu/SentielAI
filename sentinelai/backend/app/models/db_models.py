"""
SQLAlchemy ORM models — all 8 tables from the HTML spec (Section 05).
Uses GeoAlchemy2 for PostGIS geometry columns.
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, BigInteger, Column, Date, DateTime, Float,
    ForeignKey, Integer, String, Text, ARRAY, JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship
from geoalchemy2 import Geometry


class Base(DeclarativeBase):
    pass


# ── 1. countries ──────────────────────────────────────────────────────────────
class Country(Base):
    __tablename__ = "countries"

    code = Column(String(5), primary_key=True)          # "IN", "KE"
    name = Column(String(100), nullable=False)
    road_type_system = Column(JSON)                      # {"NH": "National Highway", ...}
    authority_hierarchy = Column(JSON)                   # {"NH": "NHAI", "SH": "PWD", ...}
    currency = Column(String(10), default="INR")
    sla_days = Column(JSON)                              # {"NH": 3, "SH": 5, "MDR": 7}
    fund_sources = Column(ARRAY(String))
    config_json_path = Column(String(200))               # path to full config file

    jurisdictions = relationship("Jurisdiction", back_populates="country")
    road_zones = relationship("RoadZone", back_populates="country")


# ── 2. jurisdictions ──────────────────────────────────────────────────────────
class Jurisdiction(Base):
    __tablename__ = "jurisdictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country_code = Column(String(5), ForeignKey("countries.code"))
    road_type = Column(String(50))                       # NH, SH, MDR, Urban
    ee_name = Column(String(200))
    ee_email = Column(String(200))
    ee_phone = Column(String(50))
    division_name = Column(String(200))
    geom = Column(Geometry("POLYGON", srid=4326))        # jurisdiction boundary

    country = relationship("Country", back_populates="jurisdictions")
    complaint_routings = relationship("ComplaintRouting", back_populates="jurisdiction")


# ── 3. road_zones ─────────────────────────────────────────────────────────────
class RoadZone(Base):
    __tablename__ = "road_zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_name = Column(Text)
    geom = Column(Geometry("POLYGON", srid=4326))
    city = Column(String(100))
    country_code = Column(String(5), ForeignKey("countries.code"), default="IN")
    road_type = Column(String(50))                       # NH, SH, MDR, Urban, Local
    last_relaying_date = Column(Date, nullable=True)     # P0 judging criterion
    api_score = Column(Float, default=0.0)
    api_score_7day_forecast = Column(Float, default=0.0) # 7-day deterioration forecast
    risk_category = Column(String(20), default="Low")
    near_school = Column(Boolean, default=False)
    near_junction = Column(Boolean, default=False)
    has_streetlight = Column(Boolean, default=True)
    last_updated = Column(DateTime, default=datetime.utcnow)

    country = relationship("Country", back_populates="road_zones")
    reports = relationship("Report", back_populates="zone")
    accidents = relationship("AccidentHistory", back_populates="zone")
    repairs = relationship("Repair", back_populates="zone")


# ── 4. reports ────────────────────────────────────────────────────────────────
class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("road_zones.id"))
    reporter_type = Column(String(20), default="citizen")
    image_url = Column(Text)
    lat = Column(Float)
    lng = Column(Float)
    damage_type = Column(String(50))
    ai_severity_score = Column(Float)                    # 0–10 from YOLOv8
    ai_damage_class = Column(String(100))                # YOLOv8 class label
    manual_severity = Column(String(10))
    road_type_reported = Column(String(50))              # road type as reported by citizen
    status = Column(String(30), default="pending")       # pending→verified→routed→resolved
    synced_from_offline = Column(Boolean, default=False) # was this queued offline?
    offline_queued_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("RoadZone", back_populates="reports")
    routing = relationship("ComplaintRouting", back_populates="report", uselist=False)
    contributor = relationship("CitizenContributor", back_populates="reports", foreign_keys="[Report.reporter_id]")
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("citizen_contributors.id"), nullable=True)


# ── 5. complaint_routing ──────────────────────────────────────────────────────
class ComplaintRouting(Base):
    __tablename__ = "complaint_routing"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id"), unique=True)
    jurisdiction_id = Column(UUID(as_uuid=True), ForeignKey("jurisdictions.id"))
    routed_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    escalated_at = Column(DateTime, nullable=True)
    escalation_level = Column(Integer, default=0)        # 0=none, 1=SE, 2=CE
    sla_deadline = Column(DateTime)
    sla_breached = Column(Boolean, default=False)

    report = relationship("Report", back_populates="routing")
    jurisdiction = relationship("Jurisdiction", back_populates="complaint_routings")


# ── 6. repairs ────────────────────────────────────────────────────────────────
class Repair(Base):
    __tablename__ = "repairs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("road_zones.id"))
    contractor_name = Column(String(200))                # P0 judging criterion
    assigned_date = Column(DateTime)
    estimated_completion = Column(Date)
    actual_completion = Column(Date, nullable=True)
    amount_sanctioned_inr = Column(BigInteger)           # P0: sanctioned vs spent
    amount_spent_inr = Column(BigInteger, nullable=True)
    fund_source = Column(String(100))                    # PMGSY, NHAI, State PWD, etc.
    fund_source_url = Column(Text, nullable=True)        # link to govt order / tender
    quality_score = Column(Float, nullable=True)
    recurring_damage = Column(Boolean, default=False)    # same zone repaired before?
    status = Column(String(30), default="pending")       # pending→assigned→in_progress→completed→verified
    source_report_ids = Column(ARRAY(UUID(as_uuid=True)))

    zone = relationship("RoadZone", back_populates="repairs")


# ── 7. accident_history ───────────────────────────────────────────────────────
class AccidentHistory(Base):
    __tablename__ = "accident_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("road_zones.id"))
    accident_date = Column(Date)
    severity = Column(String(20))                        # minor, serious, fatal
    vehicle_types = Column(ARRAY(String))
    weather_condition = Column(String(50))
    lat = Column(Float)
    lng = Column(Float)

    zone = relationship("RoadZone", back_populates="accidents")


# ── 8. citizen_contributors ───────────────────────────────────────────────────
class CitizenContributor(Base):
    __tablename__ = "citizen_contributors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(String(200), unique=True)         # anonymous device fingerprint
    trust_score = Column(Float, default=1.0)             # 0–5; weights AI severity
    badges = Column(ARRAY(String), default=list)         # ["first_report", "100_reports", ...]
    reports_submitted = Column(Integer, default=0)
    reports_verified = Column(Integer, default=0)
    city = Column(String(100))
    joined_at = Column(DateTime, default=datetime.utcnow)

    reports = relationship("Report", back_populates="contributor",
                           foreign_keys="[Report.reporter_id]")

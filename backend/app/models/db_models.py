"""
SENTINEL SOS — Database Models.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship as orm_relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    phone = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    contacts = orm_relationship("EmergencyContact", back_populates="user", cascade="all, delete-orphan")
    sos_events = orm_relationship("SOSEvent", back_populates="user", cascade="all, delete-orphan")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    relationship = Column(String, nullable=False)  # family|friend|colleague|doctor

    # Relationships
    user = orm_relationship("User", back_populates="contacts")


class SOSEvent(Base):
    __tablename__ = "sos_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    incident_type = Column(String, nullable=False)  # accident|ambulance|police|breakdown|flat_tire|fuel|medical|fire
    severity = Column(String, nullable=False)  # LOW|MEDIUM|HIGH|CRITICAL
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="active", nullable=False)  # active|resolved|cancelled
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Combined triage result cached in JSONB
    triage_result = Column(JSONB, nullable=True)

    # Relationships
    user = orm_relationship("User", back_populates="sos_events")


class CachedLocation(Base):
    __tablename__ = "cached_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String, nullable=False)  # hospital|ambulance|police|fire_station|towing|mechanic|fuel_station|puncture_shop
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    osm_id = Column(String, nullable=True)
    country_code = Column(String, nullable=False, default="ALL")
    osm_metadata = Column(JSONB, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

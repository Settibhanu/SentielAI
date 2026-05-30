"""
SENTINEL SOS — SOS Service.

Orchestrates triage analysis + location fetching + event persistence.
"""
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from app.services.triage_service import get_triage_engine, TriageResult
from app.services.location_service import get_location_provider, LocationResult

logger = logging.getLogger(__name__)


class SOSService:
    """
    Orchestrates the full SOS response pipeline:
    1. Triage analysis
    2. Nearby service lookup (Overpass)
    3. DB persistence
    4. Redis caching
    """

    def __init__(self):
        self.triage = get_triage_engine()
        self.location = get_location_provider()

    async def trigger_sos(
        self,
        incident_type: str,
        lat: float,
        lon: float,
        description: str = "",
        user_id: Optional[UUID] = None,
        db_session=None,
        radius: int = 5000,
    ) -> dict:
        """
        Full SOS pipeline:
        1. Triage
        2. Fetch nearby services
        3. Persist event
        4. Return combined response
        """
        # 1. Triage analysis
        triage_result = self.triage.analyze(
            description=description or incident_type.replace("_", " "),
            lat=lat,
            lon=lon,
            incident_type=incident_type,
        )

        # 2. Fetch nearby services for required categories
        nearby_services: Dict[str, List[LocationResult]] = {}
        try:
            nearby_services = await self.location.get_nearby(
                lat=lat,
                lon=lon,
                radius=radius,
                categories=triage_result.required_services,
            )
        except Exception as e:
            logger.error("Location fetch failed during SOS: %s", e)

        # 3. Persist SOS event to DB
        event_id = str(uuid.uuid4())
        event_data = {
            "id": event_id,
            "incident_type": incident_type,
            "severity": triage_result.severity,
            "latitude": lat,
            "longitude": lon,
            "description": description,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "resolved_at": None,
        }

        if db_session:
            try:
                from app.models.db_models import SOSEvent
                event = SOSEvent(
                    id=uuid.UUID(event_id),
                    user_id=user_id,
                    incident_type=incident_type,
                    severity=triage_result.severity,
                    latitude=lat,
                    longitude=lon,
                    description=description,
                    status="active",
                    triage_result=triage_result.to_dict(),
                )
                db_session.add(event)
                await db_session.flush()
                logger.info("SOS event %s persisted to DB", event_id)
            except Exception as e:
                logger.error("Failed to persist SOS event: %s", e)

        # 4. Cache in Redis
        self._cache_sos_result(event_id, triage_result, nearby_services)

        # 5. Build response
        nearby_serialized = {
            cat: [r.to_dict() for r in results]
            for cat, results in nearby_services.items()
        }

        return {
            "event": event_data,
            "triage": triage_result.to_dict(),
            "nearby_services": nearby_serialized,
        }

    def _cache_sos_result(
        self,
        event_id: str,
        triage: TriageResult,
        nearby: Dict[str, List[LocationResult]],
        ttl: int = 600,
    ):
        """Cache SOS result in Redis for quick retrieval."""
        try:
            from app.services.location_service import get_location_provider
            provider = get_location_provider()
            if not provider._redis_available:
                return

            cache_data = {
                "triage": triage.to_dict(),
                "nearby": {
                    cat: [r.to_dict() for r in results]
                    for cat, results in nearby.items()
                },
            }
            provider._redis.setex(
                f"sos:{event_id}",
                ttl,
                json.dumps(cache_data),
            )
        except Exception as e:
            logger.debug("SOS cache write failed: %s", e)

    async def analyze_only(
        self,
        description: str,
        lat: float,
        lon: float,
        radius: int = 5000,
    ) -> dict:
        """
        Analyze emergency without creating an SOS event.
        Returns triage + nearby services for recommended categories.
        """
        triage_result = self.triage.analyze(description=description, lat=lat, lon=lon)

        nearby_services: Dict[str, List[LocationResult]] = {}
        try:
            nearby_services = await self.location.get_nearby(
                lat=lat,
                lon=lon,
                radius=radius,
                categories=triage_result.required_services,
            )
        except Exception as e:
            logger.error("Location fetch failed during analysis: %s", e)

        return {
            "triage": triage_result.to_dict(),
            "nearby_services": {
                cat: [r.to_dict() for r in results]
                for cat, results in nearby_services.items()
            },
        }


# ── Singleton ─────────────────────────────────────────────────────────────────
_sos_service: Optional[SOSService] = None


def get_sos_service() -> SOSService:
    global _sos_service
    if _sos_service is None:
        _sos_service = SOSService()
    return _sos_service

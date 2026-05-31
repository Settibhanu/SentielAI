"""
SENTINEL SOS — Celery Background Tasks.

Tasks:
  refresh_location_cache     — Pre-warm Redis cache for a given area
  generate_incident_summary  — Generate text summary of SOS event
  preload_nearby_services    — Proactively cache all 8 service categories
  update_emergency_dataset   — Scheduled: refresh cached DB locations for major cities
"""
import asyncio
import logging
from typing import Optional

from app.celery_app import celery

logger = logging.getLogger(__name__)

# Major cities to pre-cache (lat, lon, country_code)
MAJOR_CITIES = [
    # India
    (28.6139, 77.2090, "IN", "New Delhi"),
    (19.0760, 72.8777, "IN", "Mumbai"),
    (12.9716, 77.5946, "IN", "Bengaluru"),
    (13.0827, 80.2707, "IN", "Chennai"),
    (22.5726, 88.3639, "IN", "Kolkata"),
    (17.3850, 78.4867, "IN", "Hyderabad"),
    (23.0225, 72.5714, "IN", "Ahmedabad"),
    (18.5204, 73.8567, "IN", "Pune"),
    # Kenya
    (-1.2921, 36.8219, "KE", "Nairobi"),
    (-4.0435, 39.6682, "KE", "Mombasa"),
    # Nigeria
    (6.5244, 3.3792, "NG", "Lagos"),
    (9.0765, 7.3986, "NG", "Abuja"),
    # South Africa
    (-26.2041, 28.0473, "ZA", "Johannesburg"),
    (-33.9249, 18.4241, "ZA", "Cape Town"),
    # UK
    (51.5074, -0.1278, "GB", "London"),
    # Germany
    (52.5200, 13.4050, "DE", "Berlin"),
    # Brazil
    (-23.5505, -46.6333, "BR", "São Paulo"),
    # Indonesia
    (-6.2088, 106.8456, "ID", "Jakarta"),
]


@celery.task(bind=True, name="tasks.refresh_location_cache")
def refresh_location_cache(self, lat: float, lon: float, radius: int = 5000):
    """
    Pre-warm Redis cache for a given area by fetching all service categories.
    """
    from app.services.location_service import get_location_provider, ALL_CATEGORIES

    logger.info("Refreshing location cache for (%.4f, %.4f) radius=%dm", lat, lon, radius)

    async def _run():
        provider = get_location_provider()
        results = await provider.get_nearby(lat=lat, lon=lon, radius=radius, categories=ALL_CATEGORIES)
        total = sum(len(v) for v in results.values())
        return total

    try:
        total = asyncio.run(_run())
        logger.info("Cache warmed: %d locations for (%.4f, %.4f)", total, lat, lon)
        return {"status": "success", "lat": lat, "lon": lon, "total_cached": total}
    except Exception as exc:
        logger.error("Cache refresh failed for (%.4f, %.4f): %s", lat, lon, exc)
        raise self.retry(exc=exc)


@celery.task(bind=True, name="tasks.generate_incident_summary")
def generate_incident_summary(self, event_id: str):
    """
    Generate a human-readable text summary of a SOS event for user history.
    Stores summary in the SOS event's triage_result JSON.
    """
    import asyncio
    from datetime import datetime

    async def _run():
        from app.database import AsyncSessionLocal
        from app.models.db_models import SOSEvent
        from sqlalchemy import select

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(SOSEvent).where(SOSEvent.id == event_id)
            )
            event = result.scalar_one_or_none()
            if not event:
                return {"status": "not_found", "event_id": event_id}

            severity_labels = {
                "CRITICAL": "Life-threatening emergency",
                "HIGH": "Serious emergency",
                "MEDIUM": "Moderate incident",
                "LOW": "Minor roadside issue",
            }

            summary = (
                f"{severity_labels.get(event.severity, 'Emergency')} — "
                f"{event.incident_type.replace('_', ' ').title()} "
                f"at ({event.latitude:.4f}, {event.longitude:.4f}) "
                f"on {event.created_at.strftime('%d %b %Y %H:%M')}. "
                f"Status: {event.status.title()}."
            )

            triage = event.triage_result or {}
            triage["summary"] = summary
            triage["summary_generated_at"] = datetime.utcnow().isoformat()
            event.triage_result = triage
            await session.commit()

            return {"status": "success", "event_id": event_id, "summary": summary}

    try:
        return asyncio.run(_run())
    except Exception as exc:
        logger.error("Summary generation failed for event %s: %s", event_id, exc)
        raise self.retry(exc=exc)


@celery.task(bind=True, name="tasks.preload_nearby_services")
def preload_nearby_services(self, lat: float, lon: float):
    """
    Proactively cache all 8 service categories for a location.
    Called when a user opens the app to pre-warm their area.
    """
    return refresh_location_cache.apply(args=[lat, lon, 10000]).get()


@celery.task(name="update_emergency_dataset")
def update_emergency_dataset():
    """
    Scheduled task: refresh cached DB locations for major cities worldwide.
    Runs every 6 hours via Celery Beat.
    Fetches from Overpass and stores in cached_locations table.
    """
    import asyncio
    from app.services.location_service import get_location_provider, ALL_CATEGORIES
    from datetime import datetime

    logger.info("Starting emergency dataset update for %d cities", len(MAJOR_CITIES))
    results = []

    async def _update_city(lat: float, lon: float, country_code: str, city_name: str):
        provider = get_location_provider()
        try:
            nearby = await provider.get_nearby(
                lat=lat, lon=lon, radius=10000, categories=ALL_CATEGORIES
            )
            total = sum(len(v) for v in nearby.values())

            # Persist to DB
            from app.database import AsyncSessionLocal
            from app.models.db_models import CachedLocation
            from sqlalchemy import select

            async with AsyncSessionLocal() as session:
                for category, locations in nearby.items():
                    for loc in locations:
                        # Upsert by osm_id
                        existing = await session.execute(
                            select(CachedLocation).where(
                                CachedLocation.osm_id == loc.osm_id
                            )
                        )
                        cached = existing.scalar_one_or_none()
                        if cached:
                            cached.name = loc.name
                            cached.latitude = loc.latitude
                            cached.longitude = loc.longitude
                            cached.phone = loc.phone
                            cached.address = loc.address
                            cached.last_updated = datetime.utcnow()
                        else:
                            new_loc = CachedLocation(
                                category=category,
                                name=loc.name,
                                latitude=loc.latitude,
                                longitude=loc.longitude,
                                phone=loc.phone,
                                address=loc.address,
                                osm_id=loc.osm_id,
                                country_code=country_code,
                                osm_metadata={
                                    "opening_hours": loc.opening_hours,
                                    "website": loc.website,
                                },
                            )
                            session.add(new_loc)
                await session.commit()

            logger.info("Updated %d locations for %s", total, city_name)
            return {"city": city_name, "total": total, "status": "success"}

        except Exception as e:
            logger.error("Failed to update %s: %s", city_name, e)
            return {"city": city_name, "status": "failed", "error": str(e)}

    async def _run_all():
        tasks = [
            _update_city(lat, lon, cc, name)
            for lat, lon, cc, name in MAJOR_CITIES
        ]
        return await asyncio.gather(*tasks)

    try:
        city_results = asyncio.run(_run_all())
        success_count = sum(1 for r in city_results if r.get("status") == "success")
        logger.info(
            "Emergency dataset update complete: %d/%d cities updated",
            success_count, len(MAJOR_CITIES)
        )
        return {
            "status": "complete",
            "cities_updated": success_count,
            "cities_total": len(MAJOR_CITIES),
            "results": city_results,
        }
    except Exception as exc:
        logger.error("Emergency dataset update failed: %s", exc)
        return {"status": "failed", "error": str(exc)}

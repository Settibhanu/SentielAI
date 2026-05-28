"""
SentinelAI Celery tasks.

process_report_image  — run YOLOv8 on a saved report image and store results
refresh_zone_weather  — fetch live rainfall for all zones, recompute API scores
"""
import os
import logging
from pathlib import Path

from app.celery_app import celery

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("uploads")


# ── Task 1: YOLOv8 damage detection ──────────────────────────────────────────

@celery.task(bind=True, name="tasks.process_report_image")
def process_report_image(self, report_id: str, image_filename: str):
    """
    Run YOLOv8 inference on a saved report image.

    Args:
        report_id:       UUID string of the report
        image_filename:  filename under uploads/ (e.g. "abc123.jpg")

    Returns:
        dict with ai_severity_score, ai_damage_class, detections list
    """
    image_path = UPLOAD_DIR / image_filename

    if not image_path.exists():
        logger.error("Image not found for report %s: %s", report_id, image_path)
        raise FileNotFoundError(f"Image not found: {image_path}")

    try:
        from app.services.damage_detector import detect_damage
        detections = detect_damage(str(image_path))
    except FileNotFoundError as exc:
        # YOLO model weights not present — log and return manual fallback
        logger.warning("YOLO model not available: %s", exc)
        return {
            "report_id": report_id,
            "ai_severity_score": None,
            "ai_damage_class": None,
            "detections": [],
            "status": "model_unavailable",
        }
    except Exception as exc:
        logger.exception("YOLO inference failed for report %s", report_id)
        raise self.retry(exc=exc)

    if not detections:
        return {
            "report_id": report_id,
            "ai_severity_score": 0.0,
            "ai_damage_class": "no_damage_detected",
            "detections": [],
            "status": "completed",
        }

    top = max(detections, key=lambda d: d["severity_score"])

    logger.info(
        "Report %s — top detection: %s (severity %.1f, conf %.2f)",
        report_id, top["class"], top["severity_score"], top["confidence"],
    )

    # TODO: persist results to DB when ORM layer is wired up
    # await db.execute(
    #     "UPDATE reports SET ai_severity=:s, ai_class=:c WHERE id=:id",
    #     {"s": top["severity_score"], "c": top["class"], "id": report_id}
    # )

    return {
        "report_id": report_id,
        "ai_severity_score": top["severity_score"],
        "ai_damage_class": top["class"],
        "detections": detections,
        "status": "completed",
    }


# ── Task 2: Zone weather refresh ─────────────────────────────────────────────

@celery.task(name="tasks.refresh_zone_weather")
def refresh_zone_weather():
    """
    Fetch current rainfall for all active zones and recompute their API scores.
    Runs periodically (configure beat schedule below if needed).

    This is a sync wrapper — httpx async calls are run via asyncio.run().
    """
    import asyncio
    from app.services.weather_service import get_current_weather
    from app.services.risk_engine import ZoneData, calculate_api_score

    # Demo zone coordinates (replace with DB query when ORM is wired)
    ZONE_COORDS = [
        {"zone_id": "zone-001", "lat": 12.9176, "lng": 77.6227, "name": "Silk Board Junction"},
        {"zone_id": "zone-002", "lat": 12.9591, "lng": 77.6974, "name": "Marathahalli Bridge"},
        {"zone_id": "zone-003", "lat": 12.9352, "lng": 77.6245, "name": "Koramangala 5th Block"},
    ]

    results = []
    for zone in ZONE_COORDS:
        try:
            weather = asyncio.run(get_current_weather(zone["lat"], zone["lng"]))
            zone_data = ZoneData(
                current_rainfall_mm=weather["rainfall_mm"],
                # Other fields would come from DB; using defaults here
            )
            score, category = calculate_api_score(zone_data)
            results.append({
                "zone_id": zone["zone_id"],
                "rainfall_mm": weather["rainfall_mm"],
                "api_score": score,
                "risk_category": category,
                "status": "refreshed",
            })
            logger.info("Zone %s refreshed — score %.1f (%s)", zone["zone_id"], score, category)
        except Exception as exc:
            logger.warning("Weather refresh failed for zone %s: %s", zone["zone_id"], exc)
            results.append({"zone_id": zone["zone_id"], "status": "failed", "error": str(exc)})

    return results

"""
Citizen reporting endpoints.

POST /api/reports/submit
GET  /api/reports/{report_id}/status
POST /api/reports/sync-offline   ← batch sync from IndexedDB queue
"""
import base64
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.schemas.pydantic_schemas import (
    ReportSubmit, ReportSubmitResponse, ReportStatus, OfflineSyncBatch,
)
from app.services import routing_service, risk_engine

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def _save_image(base64_str: str, report_id: str) -> str:
    """Decode base64 image and save to disk. Returns relative URL."""
    # Strip data URI prefix if present
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]
    img_bytes = base64.b64decode(base64_str)
    filename = f"{report_id}.jpg"
    path = UPLOAD_DIR / filename
    path.write_bytes(img_bytes)
    return f"/uploads/{filename}"


@router.post("/submit", response_model=ReportSubmitResponse)
async def submit_report(body: ReportSubmit, background_tasks: BackgroundTasks):
    """
    Accept a citizen damage report:
    1. Save image
    2. Run YOLOv8 damage detection
    3. Find matching road zone
    4. Route complaint to correct EE
    5. Return AI verdict + routing info
    """
    report_id = str(uuid.uuid4())

    # 1. Save image
    image_url = None
    ai_severity = body.manual_severity_numeric  # fallback
    ai_damage_class = body.damage_type

    if body.image:
        try:
            image_url = _save_image(body.image, report_id)
            image_filename = f"{report_id}.jpg"
            # Dispatch YOLO inference as a background task (non-blocking)
            from app.tasks import process_report_image
            process_report_image.delay(report_id, image_filename)
            # ai_severity and ai_damage_class will be updated async;
            # citizen gets immediate response with manual_severity as fallback
        except Exception as e:
            # Don't fail the whole report if task dispatch fails
            pass

    # 3. Routing info (PostGIS lookup — returns None if DB not seeded)
    routing_info = None
    # routing_info = await routing_service.find_jurisdiction(
    #     body.lat, body.lng, body.road_type, body.country_code, db
    # )

    routing_msg = None
    if routing_info:
        routing_msg = routing_service.build_routing_message(routing_info, body.road_type)

    return ReportSubmitResponse(
        report_id=uuid.UUID(report_id),
        ai_severity_score=ai_severity or 0.0,
        ai_damage_class=ai_damage_class or body.damage_type,
        zone_id=None,
        zone_risk_level="Unknown",
        routing=routing_msg,
    )


@router.get("/{report_id}/status", response_model=ReportStatus)
async def get_report_status(report_id: str):
    """Return current status and repair ETA for a submitted report."""
    # TODO: query DB
    raise HTTPException(status_code=404, detail="Report not found")


@router.post("/sync-offline")
async def sync_offline_reports(batch: OfflineSyncBatch):
    """
    Batch endpoint for syncing reports queued in IndexedDB while offline.
    Accepts a list of reports and processes each one.
    """
    results = []
    for report in batch.reports:
        report.synced_from_offline = True
        # Re-use submit logic
        result = await submit_report(report, BackgroundTasks())
        results.append({"report_id": str(result.report_id), "status": "synced"})
    return {"synced": len(results), "results": results}

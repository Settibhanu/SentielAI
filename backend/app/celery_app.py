"""
SENTINEL SOS — Celery application instance.

Background tasks:
  refresh_location_cache     — Pre-warm Redis cache for a given area
  generate_incident_summary  — Generate text summary of SOS event
  preload_nearby_services    — Proactively cache all 8 service categories
  update_emergency_dataset   — Scheduled: refresh cached DB locations (every 6h)
"""
import os
from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery = Celery(
    "sentinel_sos",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.workers.tasks"],
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_retry_delay=30,
    task_max_retries=3,
    # Celery Beat schedule
    beat_schedule={
        "update-emergency-dataset-every-6h": {
            "task": "update_emergency_dataset",
            "schedule": crontab(minute=0, hour="*/6"),  # every 6 hours
        },
    },
)

"""
Celery application instance for SentinelAI.

Background tasks:
  - process_report_image  : run YOLOv8 on a submitted report image,
                            update the report record with AI severity + class
  - refresh_zone_weather  : fetch rainfall for all zones and recompute API scores
"""
import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery = Celery(
    "sentinelai",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks"],
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # Retry failed tasks up to 3 times with 30s delay
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_retry_delay=30,
    task_max_retries=3,
)

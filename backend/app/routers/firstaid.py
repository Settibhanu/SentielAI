"""
SENTINEL SOS — First Aid Guide Routes.

GET /api/firstaid        — All first aid topics
GET /api/firstaid/{id}   — Single topic by ID
"""
import json
import logging
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException

router = APIRouter()
logger = logging.getLogger(__name__)

FIRSTAID_PATH = Path(__file__).parent.parent / "data" / "firstaid.json"

_firstaid_cache: List[dict] = []


def _load_firstaid() -> List[dict]:
    global _firstaid_cache
    if _firstaid_cache:
        return _firstaid_cache
    try:
        with open(FIRSTAID_PATH, "r", encoding="utf-8") as f:
            _firstaid_cache = json.load(f)
        logger.info("Loaded %d first aid topics", len(_firstaid_cache))
        return _firstaid_cache
    except Exception as e:
        logger.error("Failed to load firstaid.json: %s", e)
        return []


@router.get("")
async def get_all_firstaid():
    """Return all first aid topics."""
    guides = _load_firstaid()
    if not guides:
        raise HTTPException(status_code=503, detail="First aid data unavailable")
    return guides


@router.get("/{topic_id}")
async def get_firstaid_topic(topic_id: str):
    """Return a single first aid topic by ID."""
    guides = _load_firstaid()
    topic = next((g for g in guides if g["id"] == topic_id), None)
    if not topic:
        raise HTTPException(status_code=404, detail=f"Topic '{topic_id}' not found")
    return topic

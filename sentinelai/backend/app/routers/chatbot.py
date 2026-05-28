"""
Chatbot endpoint.

POST /api/chatbot/message
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.chatbot_service import classify_intent, generate_response, QUICK_ACTIONS

router = APIRouter()


class ChatMessage(BaseModel):
    message: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    zone_id: Optional[str] = None
    language: str = "en"


class ChatResponse(BaseModel):
    intent: str
    reply: str
    actions: list
    zone_id: Optional[str]
    metadata: dict
    quick_actions: list


@router.post("/message", response_model=ChatResponse)
async def chat(body: ChatMessage):
    """
    Process a citizen message and return an intent-classified response.
    Uses keyword matching — no external LLM API required.
    """
    intent = classify_intent(body.message)
    response = generate_response(
        intent=intent,
        message=body.message,
        zone_id=body.zone_id,
        lat=body.lat,
        lng=body.lng,
        language=body.language,
    )
    return response


@router.get("/quick-actions")
async def get_quick_actions():
    """Return the default quick action chips for the chatbot UI."""
    return QUICK_ACTIONS

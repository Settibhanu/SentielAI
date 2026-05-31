"""
SENTINEL SOS — AI Emergency Assistant Chatbot.

POST /api/chatbot/message
GET  /api/chatbot/quick-actions
"""
import logging
import re
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.triage_service import get_triage_engine

router = APIRouter()
logger = logging.getLogger(__name__)

# ── SENTINEL intent patterns ──────────────────────────────────────────────────

INTENT_PATTERNS = [
    ("accident", [
        r"\baccident\b", r"\bcrash\b", r"\bcollision\b", r"\bhit\b.*\bcar\b",
        r"\bcar.*\bhit\b", r"\bvehicle.*\baccident\b",
    ]),
    ("medical", [
        r"\bunconsci\b", r"\bnot breathing\b", r"\bno pulse\b", r"\bcpr\b",
        r"\bheart attack\b", r"\bstroke\b", r"\bbleeding\b", r"\binjured\b",
        r"\bmedical\b", r"\bambulance\b", r"\bhospital\b",
    ]),
    ("breakdown", [
        r"\bbreakdown\b", r"\bwon.t start\b", r"\bstalled\b", r"\bengine\b",
        r"\bbattery\b", r"\btow\b", r"\bmechanic\b",
    ]),
    ("flat_tire", [
        r"\bflat tire\b", r"\bpuncture\b", r"\btyre\b", r"\btire\b",
        r"\bflat\b.*\btire\b", r"\bpunctured\b",
    ]),
    ("fuel", [
        r"\bfuel\b", r"\bpetrol\b", r"\bdiesel\b", r"\bempty tank\b",
        r"\bout of gas\b", r"\bno fuel\b", r"\bgas station\b",
    ]),
    ("police", [
        r"\bpolice\b", r"\bcop\b", r"\blaw enforcement\b", r"\btheft\b",
        r"\bstolen\b", r"\bfight\b", r"\bdanger\b",
    ]),
    ("fire", [
        r"\bfire\b", r"\bburning\b", r"\bsmoke\b", r"\bflames\b",
    ]),
    ("firstaid", [
        r"\bfirst aid\b", r"\bhow to\b.*\btreat\b", r"\bwhat to do\b",
        r"\bsteps\b", r"\bguide\b", r"\bhelp.*injured\b",
    ]),
    ("location", [
        r"\bwhere\b.*\bhospital\b", r"\bnearest\b", r"\bnearby\b",
        r"\bfind\b.*\b(hospital|police|mechanic|fuel)\b",
        r"\bclose\b.*\b(hospital|police|mechanic)\b",
    ]),
    ("help", [
        r"\bhelp\b", r"\bhi\b", r"\bhello\b", r"\bsos\b",
        r"\bwhat can you\b", r"\bstart\b", r"^\s*$",
    ]),
]

QUICK_ACTIONS = [
    {"label": "🚗 Accident", "message": "I've been in an accident"},
    {"label": "🔧 Flat Tire", "message": "I have a flat tire"},
    {"label": "🚑 Need Ambulance", "message": "Someone is injured and needs an ambulance"},
    {"label": "❤️ Medical Emergency", "message": "Medical emergency, person is unconscious"},
]


def classify_intent(message: str) -> str:
    msg = message.lower().strip()
    for intent, patterns in INTENT_PATTERNS:
        for pattern in patterns:
            if re.search(pattern, msg):
                return intent
    return "help"


def generate_sentinel_response(
    intent: str,
    message: str,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
) -> dict:
    """Generate SENTINEL emergency assistant response."""

    triage_engine = get_triage_engine()
    actions = []
    metadata = {}

    if intent == "accident":
        triage = triage_engine.analyze(message, lat or 0, lon or 0, "accident")
        severity_emoji = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🟢"}.get(triage.severity, "⚪")
        reply = (
            f"{severity_emoji} **ACCIDENT DETECTED — Severity: {triage.severity}**\n\n"
            f"**Immediate actions:**\n"
            + "\n".join(f"• {r}" for r in triage.recommendations[:4])
            + "\n\n**Nearby services being located...**\n"
            "Use the Map tab to see hospitals, police, and ambulances near you."
        )
        if triage.call_emergency:
            reply += "\n\n🚨 **CALL 112 / 108 NOW**"
        actions = [
            {"type": "navigate", "label": "🗺 Open Emergency Map", "path": "/map"},
            {"type": "navigate", "label": "📋 First Aid Guide", "path": "/firstaid/road_accident_response"},
        ]
        metadata = {"severity": triage.severity, "required_services": triage.required_services}

    elif intent == "medical":
        triage = triage_engine.analyze(message, lat or 0, lon or 0, "medical")
        reply = (
            "🚨 **MEDICAL EMERGENCY**\n\n"
            "**Critical steps:**\n"
            "• Call 112 / 108 immediately\n"
            "• Check if the person is breathing\n"
            "• If not breathing — begin CPR now\n"
            "• If breathing — place in recovery position\n"
            "• Do not move if spinal injury suspected\n\n"
            "🚨 **CALL 112 / 108 NOW**"
        )
        actions = [
            {"type": "navigate", "label": "❤️ CPR Guide", "path": "/firstaid/cpr"},
            {"type": "navigate", "label": "😴 Unconscious Person", "path": "/firstaid/unconscious_person"},
            {"type": "navigate", "label": "🗺 Find Hospitals", "path": "/map?category=hospital"},
        ]

    elif intent == "breakdown":
        reply = (
            "🔧 **VEHICLE BREAKDOWN**\n\n"
            "**Safety first:**\n"
            "• Move vehicle off the road if possible\n"
            "• Turn on hazard lights immediately\n"
            "• Place warning triangles 45m behind\n"
            "• Stay inside if on a busy road\n\n"
            "**Finding nearby mechanics and towing services...**\n"
            "Check the Map tab for the nearest help."
        )
        actions = [
            {"type": "navigate", "label": "🗺 Find Mechanics", "path": "/map?category=mechanic"},
        ]

    elif intent == "flat_tire":
        reply = (
            "🔧 **FLAT TIRE**\n\n"
            "**Immediate steps:**\n"
            "• Pull over safely — do not brake suddenly\n"
            "• Turn on hazard lights\n"
            "• Move well off the road\n"
            "• If you have a spare — change it in a safe location\n"
            "• If not — call a puncture repair shop\n\n"
            "**Finding nearby puncture shops...**"
        )
        actions = [
            {"type": "navigate", "label": "🗺 Find Puncture Shops", "path": "/map?category=puncture_shop"},
        ]

    elif intent == "fuel":
        reply = (
            "⛽ **OUT OF FUEL**\n\n"
            "• Turn on hazard lights and pull over safely\n"
            "• Do not leave the vehicle on a busy road\n"
            "• Finding nearest fuel stations...\n\n"
            "Check the Map tab for fuel stations near you."
        )
        actions = [
            {"type": "navigate", "label": "🗺 Find Fuel Stations", "path": "/map?category=fuel_station"},
        ]

    elif intent == "police":
        reply = (
            "👮 **POLICE ASSISTANCE**\n\n"
            "• Emergency: **Call 112 / 100**\n"
            "• For non-emergency: visit the nearest police station\n\n"
            "**Finding nearest police stations...**"
        )
        actions = [
            {"type": "navigate", "label": "🗺 Find Police Stations", "path": "/map?category=police"},
        ]

    elif intent == "fire":
        reply = (
            "🔥 **FIRE EMERGENCY**\n\n"
            "🚨 **CALL 112 / 101 IMMEDIATELY**\n\n"
            "• Get everyone away from the vehicle\n"
            "• Do NOT attempt to retrieve belongings\n"
            "• Stay upwind of smoke\n"
            "• Do NOT open the hood if engine is on fire\n"
            "• Wait at a safe distance for fire services\n\n"
            "🚨 **CALL 112 / 101 NOW**"
        )
        actions = [
            {"type": "navigate", "label": "🗺 Find Fire Stations", "path": "/map?category=fire_station"},
        ]

    elif intent == "firstaid":
        reply = (
            "📋 **FIRST AID GUIDES**\n\n"
            "Available guides:\n"
            "• ❤️ CPR\n"
            "• 🩸 Bleeding Control\n"
            "• 🦴 Fractures\n"
            "• 🔥 Burns\n"
            "• ⚡ Shock\n"
            "• 😴 Unconscious Person\n"
            "• 🚗 Road Accident Response\n"
            "• 🫁 Choking\n"
            "• 🦷 Spinal Injury\n\n"
            "All guides are available offline."
        )
        actions = [
            {"type": "navigate", "label": "📋 Open First Aid", "path": "/firstaid"},
        ]

    elif intent == "location":
        reply = (
            "🗺 **FINDING NEARBY SERVICES**\n\n"
            "The Emergency Map shows real-time locations of:\n"
            "• 🏥 Hospitals & Clinics\n"
            "• 🚑 Ambulance Stations\n"
            "• 👮 Police Stations\n"
            "• 🔥 Fire Stations\n"
            "• 🔧 Mechanics\n"
            "• ⛽ Fuel Stations\n"
            "• 🔧 Puncture Shops\n"
            "• 🚛 Towing Services\n\n"
            "All data is from OpenStreetMap — real locations, no mock data."
        )
        actions = [
            {"type": "navigate", "label": "🗺 Open Emergency Map", "path": "/map"},
        ]

    else:  # help / fallback
        reply = (
            "🛡 **SENTINEL SOS — Emergency Assistant**\n\n"
            "I'm here to help in road emergencies. Tell me what's happening:\n\n"
            "• 🚗 **Accident** — 'I've been in an accident'\n"
            "• 🚑 **Medical** — 'Someone is injured'\n"
            "• 🔧 **Breakdown** — 'My car won't start'\n"
            "• 🔧 **Flat Tire** — 'I have a flat tire'\n"
            "• ⛽ **Fuel** — 'I'm out of fuel'\n"
            "• 👮 **Police** — 'I need police'\n"
            "• 🔥 **Fire** — 'Vehicle is on fire'\n"
            "• 📋 **First Aid** — 'How do I treat a wound?'\n\n"
            "For life-threatening emergencies: **CALL 112 / 108 / 100**"
        )

    return {
        "intent": intent,
        "reply": reply,
        "actions": actions,
        "metadata": metadata,
        "quick_actions": QUICK_ACTIONS,
    }


# ── Request/Response models ───────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    language: str = "en"


@router.post("/message")
async def chat(body: ChatMessage):
    """
    SENTINEL emergency assistant — keyword-based intent classification.
    No external LLM API required.
    """
    intent = classify_intent(body.message)
    response = generate_sentinel_response(
        intent=intent,
        message=body.message,
        lat=body.lat,
        lon=body.lon,
    )
    return response


@router.get("/quick-actions")
async def get_quick_actions():
    """Return quick action chips for the chat UI."""
    return QUICK_ACTIONS

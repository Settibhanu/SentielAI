"""
SentinelAI Chatbot Service — Lightweight intent-based conversational assistant.

No external LLM APIs required. Uses keyword matching + rule-based parsing
to classify citizen intents and generate contextual responses from live data.

Supported intents:
  road_authority_lookup   — "Who maintains this road?"
  road_risk_lookup        — "Why is this area red?" / "What is the risk here?"
  report_issue            — "Report pothole" / "I want to report damage"
  repair_status           — "What is the repair status?"
  budget_lookup           — "What is the repair budget?"
  contractor_lookup       — "Who is the contractor?"
  emergency_contacts      — "Emergency contact" / "Who do I call?"
  help                    — fallback / "help" / "what can you do?"
"""
import re
from typing import Optional

# ── Intent keyword map ────────────────────────────────────────────────────────
INTENT_PATTERNS = [
    ("report_issue", [
        r"\breport\b", r"\bpothole\b", r"\bcrack\b", r"\bflooding\b",
        r"\bdamage\b", r"\bbroken\b", r"\bsubmit\b", r"\bfile\b",
    ]),
    ("road_authority_lookup", [
        r"\bwho\b.*\bmaintain", r"\bauthority\b", r"\bee\b", r"\bengineer\b",
        r"\bbbmp\b", r"\bnhai\b", r"\bpwd\b", r"\bjurisdiction\b",
        r"\bwho.*responsible\b", r"\bwho.*manage\b", r"\bwho.*owns\b",
    ]),
    ("road_risk_lookup", [
        r"\brisk\b", r"\bscore\b", r"\bapi\b", r"\bred\b.*\bzone\b",
        r"\bdanger\b", r"\bhazard\b", r"\bwhy.*red\b", r"\bwhy.*marked\b",
        r"\baccident\b", r"\bsafe\b",
    ]),
    ("repair_status", [
        r"\brepair\b.*\bstatus\b", r"\bstatus\b", r"\bprogress\b",
        r"\bwhen.*fix\b", r"\bwhen.*repair\b", r"\bfixed\b", r"\bwork.*done\b",
    ]),
    ("budget_lookup", [
        r"\bbudget\b", r"\bsanction\b", r"\bspent\b", r"\bfund\b",
        r"\bmoney\b", r"\bcost\b", r"\bexpenditure\b", r"\ballocation\b",
    ]),
    ("contractor_lookup", [
        r"\bcontractor\b", r"\bcompany\b", r"\bfirm\b", r"\bwho.*built\b",
        r"\bwho.*construct\b", r"\bvendor\b",
    ]),
    ("emergency_contacts", [
        r"\bemergency\b", r"\bcontact\b", r"\bphone\b", r"\bcall\b",
        r"\bhelp.*number\b", r"\bsos\b", r"\bambulance\b", r"\bpolice\b",
    ]),
    ("help", [
        r"\bhelp\b", r"\bwhat can you\b", r"\bcommands\b", r"\bhi\b",
        r"\bhello\b", r"\bstart\b", r"\bguide\b", r"^\s*$",
    ]),
]


def classify_intent(message: str) -> str:
    """Classify user message into one of the supported intents."""
    msg = message.lower().strip()
    for intent, patterns in INTENT_PATTERNS:
        for pattern in patterns:
            if re.search(pattern, msg):
                return intent
    return "help"


# ── Demo zone data (mirrors zones.py demo data) ───────────────────────────────
DEMO_ZONES = {
    "zone-001": {
        "name": "Silk Board Junction", "road_type": "SH", "api_score": 83,
        "risk_category": "Critical", "reports": 23, "accidents": 12, "fatal": 2,
        "last_relay": "March 2022", "forecast": 91,
        "ee": "PWD EE, Bengaluru South Division 3",
        "ee_phone": "+91-80-22345678",
        "contractor": "M/s Deccan Infra Ltd",
        "sanctioned": 2500000, "spent": None, "fund": "State PWD",
        "repair_status": "pending",
    },
    "zone-002": {
        "name": "Marathahalli Bridge", "road_type": "NH", "api_score": 61,
        "risk_category": "High", "reports": 14, "accidents": 6, "fatal": 0,
        "last_relay": "July 2023", "forecast": 67,
        "ee": "NHAI EE, Bengaluru NH-44 Division",
        "ee_phone": "+91-80-26521234",
        "contractor": "M/s Bharat Road Works Pvt Ltd",
        "sanctioned": 1200000, "spent": None, "fund": "NHAI",
        "repair_status": "assigned",
    },
    "zone-003": {
        "name": "Koramangala 5th Block", "road_type": "MDR", "api_score": 38,
        "risk_category": "Medium", "reports": 7, "accidents": 3, "fatal": 0,
        "last_relay": "January 2024", "forecast": 42,
        "ee": "Zilla Parishad EE, Bengaluru Rural",
        "ee_phone": "+91-80-27654321",
        "contractor": "M/s Karnataka Road Corp",
        "sanctioned": 600000, "spent": 320000, "fund": "State PWD",
        "repair_status": "in_progress",
    },
}

DEFAULT_ZONE = DEMO_ZONES["zone-001"]

QUICK_ACTIONS = [
    {"label": "Report pothole", "message": "Report pothole"},
    {"label": "Road risk", "message": "What is the risk here?"},
    {"label": "Who maintains this road?", "message": "Who maintains this road?"},
    {"label": "Repair budget", "message": "What is the repair budget?"},
]


def _fmt_inr(amount: Optional[int]) -> str:
    if amount is None:
        return "Not yet spent"
    return f"₹{amount:,}".replace(",", ",")


def generate_response(
    intent: str,
    message: str,
    zone_id: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    language: str = "en",
) -> dict:
    """
    Generate a structured chatbot response for the given intent.

    Returns:
        {
          intent, reply, actions, zone_id, metadata, quick_actions
        }
    """
    # Resolve zone from zone_id or use default demo zone
    zone = DEMO_ZONES.get(zone_id or "", DEFAULT_ZONE)
    actions = []
    metadata = {}

    # ── Intent handlers ───────────────────────────────────────────
    if intent == "road_authority_lookup":
        reply = (
            f"🏛 **Road Authority for {zone['name']}**\n\n"
            f"Road type: **{zone['road_type']}**\n"
            f"Executive Engineer: **{zone['ee']}**\n"
            f"📞 {zone['ee_phone']}\n\n"
            f"Contractor: **{zone['contractor']}**\n"
            f"Last relayed: {zone['last_relay']}"
        )
        metadata = {"ee": zone["ee"], "ee_phone": zone["ee_phone"], "road_type": zone["road_type"]}

    elif intent == "road_risk_lookup":
        risk_emoji = {"Critical": "🔴", "High": "🟠", "Medium": "🟡", "Low": "🟢"}.get(zone["risk_category"], "⚪")
        reply = (
            f"{risk_emoji} **{zone['name']} — {zone['risk_category'].upper()} RISK**\n\n"
            f"API Score: **{zone['api_score']} / 100**\n"
            f"7-day forecast: **{zone['forecast']}**\n\n"
            f"Contributing factors:\n"
            f"• {zone['reports']} pothole/damage reports (30 days)\n"
            f"• {zone['accidents']} accidents in last year"
            + (f" ({zone['fatal']} fatal)" if zone["fatal"] else "") + "\n"
            f"• Last road relay: {zone['last_relay']}\n\n"
            f"Repair status: **{zone['repair_status'].replace('_', ' ').title()}**"
        )
        metadata = {"api_score": zone["api_score"], "risk_category": zone["risk_category"]}
        actions = [{"type": "navigate", "label": "View zone details", "path": f"/zone/{zone_id or 'zone-001'}"}]

    elif intent == "report_issue":
        reply = (
            "📋 **Let's file your report!**\n\n"
            "I'll take you to the report form where you can:\n"
            "• 📷 Capture a photo of the damage\n"
            "• 📍 Confirm your GPS location\n"
            "• 🏷 Select damage type and road type\n\n"
            "Your report will be AI-classified and automatically routed to the correct Executive Engineer."
        )
        actions = [{"type": "navigate", "label": "Open Report Form", "path": "/report"}]

    elif intent == "repair_status":
        status_map = {
            "pending": "⏳ Pending — not yet assigned",
            "assigned": "📋 Assigned to contractor",
            "in_progress": "🔧 Repair in progress",
            "completed": "✅ Repair completed",
            "verified": "✅ Verified and closed",
        }
        status_label = status_map.get(zone["repair_status"], zone["repair_status"])
        reply = (
            f"🔧 **Repair Status — {zone['name']}**\n\n"
            f"Status: {status_label}\n"
            f"Contractor: **{zone['contractor']}**\n"
            f"Fund source: {zone['fund']}\n\n"
            f"Sanctioned: **{_fmt_inr(zone['sanctioned'])}**\n"
            f"Spent: **{_fmt_inr(zone['spent'])}**"
        )
        metadata = {"repair_status": zone["repair_status"], "contractor": zone["contractor"]}

    elif intent == "budget_lookup":
        utilization = ""
        if zone["spent"] and zone["sanctioned"]:
            pct = round(zone["spent"] / zone["sanctioned"] * 100)
            utilization = f"\nUtilization: **{pct}%**"
        reply = (
            f"💰 **Budget Transparency — {zone['name']}**\n\n"
            f"Sanctioned Budget: **{_fmt_inr(zone['sanctioned'])}**\n"
            f"Amount Spent: **{_fmt_inr(zone['spent'])}**"
            + utilization + "\n\n"
            f"Fund Source: **{zone['fund']}**\n"
            f"Contractor: {zone['contractor']}"
        )
        metadata = {"sanctioned": zone["sanctioned"], "spent": zone["spent"], "fund": zone["fund"]}
        actions = [{"type": "navigate", "label": "View full transparency table", "path": "/authority"}]

    elif intent == "contractor_lookup":
        reply = (
            f"🏗 **Contractor Information — {zone['name']}**\n\n"
            f"Contractor: **{zone['contractor']}**\n"
            f"Fund source: {zone['fund']}\n"
            f"Sanctioned: {_fmt_inr(zone['sanctioned'])}\n"
            f"Status: {zone['repair_status'].replace('_', ' ').title()}\n\n"
            f"⚠ Recurring damage flag: {'Yes — same zone repaired before' if zone.get('recurring') else 'No'}"
        )
        metadata = {"contractor": zone["contractor"]}

    elif intent == "emergency_contacts":
        reply = (
            "🚨 **Emergency Contacts**\n\n"
            f"Executive Engineer: {zone['ee']}\n"
            f"📞 {zone['ee_phone']}\n\n"
            "National Emergency: **112**\n"
            "Road Accident Helpline: **1033**\n"
            "NHAI Helpline: **1033**\n\n"
            "For road damage emergencies, call the EE directly or use the report form to escalate."
        )
        metadata = {"ee_phone": zone["ee_phone"]}

    else:  # help / fallback
        reply = (
            "👋 **Hi! I'm the SentinelAI Road Assistant.**\n\n"
            "I can help you with:\n"
            "• 🗺 **Road risk** — \"What is the risk here?\"\n"
            "• 🏛 **Authority** — \"Who maintains this road?\"\n"
            "• 📋 **Report** — \"Report a pothole\"\n"
            "• 🔧 **Repair status** — \"What is the repair status?\"\n"
            "• 💰 **Budget** — \"What is the repair budget?\"\n"
            "• 🏗 **Contractor** — \"Who is the contractor?\"\n"
            "• 🚨 **Emergency** — \"Emergency contacts\"\n\n"
            "Try one of the quick actions below!"
        )

    return {
        "intent": intent,
        "reply": reply,
        "actions": actions,
        "zone_id": zone_id,
        "metadata": metadata,
        "quick_actions": QUICK_ACTIONS,
    }

"""
SENTINEL SOS — AI Triage Engine.

Keyword-weighted severity classification with actionable recommendations.
No external AI API required — deterministic, fast, offline-capable.
"""
import re
from dataclasses import dataclass, field
from typing import List, Optional


# ── Keyword banks ─────────────────────────────────────────────────────────────

CRITICAL_KEYWORDS = [
    "unconscious", "not breathing", "no pulse", "head injury",
    "multiple vehicles", "severe bleeding", "trapped", "spine",
    "neck injury", "major accident", "rollover", "fire",
    "on fire", "burning", "cardiac", "heart attack", "stroke",
    "not responding", "unresponsive", "stopped breathing",
    "crushed", "ejected", "overturned", "multiple casualties",
    "mass casualty", "explosion",
]

HIGH_KEYWORDS = [
    "bleeding", "fracture", "broken bone", "can't move",
    "loss of mobility", "hit", "collision", "injured", "crash",
    "accident", "fell", "fallen", "impact", "concussion",
    "chest pain", "difficulty breathing", "shortness of breath",
    "severe pain", "deep cut", "wound", "laceration",
    "broken", "smashed", "totaled",
]

MEDIUM_KEYWORDS = [
    "minor injury", "scratch", "bruise", "dent", "damage",
    "pain", "hurt", "sprain", "limp", "twisted",
    "sore", "ache", "bump", "swollen", "swelling",
    "fender bender", "minor accident", "scraped",
]

LOW_KEYWORDS = [
    "flat tire", "puncture", "fuel", "petrol", "diesel",
    "empty tank", "breakdown", "won't start", "stalled",
    "battery dead", "out of gas", "no fuel", "tyre",
    "tire", "flat", "engine", "overheating", "smoke from engine",
    "locked out", "keys locked", "tow", "towing needed",
]

# ── Severity → recommendations + services ────────────────────────────────────

SEVERITY_CONFIG = {
    "CRITICAL": {
        "recommendations": [
            "🚨 CALL 112 / 911 IMMEDIATELY — this is a life-threatening emergency",
            "Do NOT move the victim unless there is immediate danger (fire, traffic)",
            "Check for breathing — if absent, begin CPR immediately",
            "Apply firm pressure to any severe bleeding wounds",
            "Keep the victim still — suspect spinal injury until ruled out",
            "Keep victim warm and calm — treat for shock",
            "Clear the area of bystanders — maintain a safe perimeter",
            "Send someone to the road to flag down emergency vehicles",
        ],
        "required_services": ["hospital", "ambulance", "police", "fire_station"],
        "call_emergency": True,
        "first_aid_topic": "road_accident_response",
    },
    "HIGH": {
        "recommendations": [
            "🚨 Call emergency services now — dial 112 / 911",
            "Do not move injured persons unless in immediate danger",
            "Apply direct pressure to bleeding wounds with clean cloth",
            "Immobilize suspected fractures — do not attempt to straighten",
            "Monitor breathing and pulse continuously",
            "Keep the victim warm and still",
            "Document the scene — photos of vehicles, road conditions",
        ],
        "required_services": ["hospital", "ambulance", "police"],
        "call_emergency": True,
        "first_aid_topic": "bleeding_control",
    },
    "MEDIUM": {
        "recommendations": [
            "Assess injuries carefully — check for hidden pain or swelling",
            "Move vehicles off the road if safe to do so",
            "Exchange insurance and contact information with all parties",
            "Take photos of all vehicles, damage, and road conditions",
            "File a police report — required for insurance claims",
            "Seek medical evaluation even for minor injuries",
            "Watch for delayed symptoms: headache, dizziness, neck pain",
        ],
        "required_services": ["hospital", "police", "mechanic"],
        "call_emergency": False,
        "first_aid_topic": "fractures",
    },
    "LOW": {
        "recommendations": [
            "Move vehicle to a safe location off the road",
            "Turn on hazard lights and place warning triangles if available",
            "Stay inside the vehicle if on a busy road",
            "Contact roadside assistance or a towing service",
            "Do not attempt repairs on a busy highway",
            "Keep emergency contact numbers accessible",
        ],
        "required_services": ["mechanic", "towing", "fuel_station", "puncture_shop"],
        "call_emergency": False,
        "first_aid_topic": None,
    },
}

# ── Incident type → default severity ─────────────────────────────────────────

INCIDENT_TYPE_SEVERITY = {
    "accident": "HIGH",
    "ambulance": "CRITICAL",
    "police": "MEDIUM",
    "breakdown": "LOW",
    "flat_tire": "LOW",
    "fuel": "LOW",
    "medical": "HIGH",
    "fire": "CRITICAL",
}

INCIDENT_TYPE_SERVICES = {
    "accident": ["hospital", "ambulance", "police"],
    "ambulance": ["hospital", "ambulance"],
    "police": ["police"],
    "breakdown": ["mechanic", "towing"],
    "flat_tire": ["puncture_shop", "mechanic", "towing"],
    "fuel": ["fuel_station"],
    "medical": ["hospital", "ambulance"],
    "fire": ["fire_station", "ambulance", "police"],
}


# ── Result dataclass ──────────────────────────────────────────────────────────

@dataclass
class TriageResult:
    severity: str
    call_emergency: bool
    recommendations: List[str]
    required_services: List[str]
    first_aid_topic: Optional[str]
    score: int = 0

    def to_dict(self) -> dict:
        return {
            "severity": self.severity,
            "call_emergency": self.call_emergency,
            "recommendations": self.recommendations,
            "required_services": self.required_services,
            "first_aid_topic": self.first_aid_topic,
            "score": self.score,
        }


# ── Triage Engine ─────────────────────────────────────────────────────────────

class TriageEngine:
    """
    Keyword-weighted severity classifier.
    Checks CRITICAL → HIGH → MEDIUM → LOW in order.
    Returns TriageResult with actionable recommendations.
    """

    def _count_matches(self, text: str, keywords: List[str]) -> int:
        """Count how many keywords appear in the text."""
        text_lower = text.lower()
        return sum(1 for kw in keywords if kw in text_lower)

    def _classify_severity(self, description: str) -> tuple[str, int]:
        """Return (severity, score) based on keyword matching."""
        text = description.lower().strip()

        critical_count = self._count_matches(text, CRITICAL_KEYWORDS)
        high_count = self._count_matches(text, HIGH_KEYWORDS)
        medium_count = self._count_matches(text, MEDIUM_KEYWORDS)
        low_count = self._count_matches(text, LOW_KEYWORDS)

        # Weighted score
        score = critical_count * 40 + high_count * 20 + medium_count * 10 + low_count * 5

        # Priority: CRITICAL first
        if critical_count > 0:
            return "CRITICAL", score
        if high_count > 0:
            return "HIGH", score
        if medium_count > 0:
            return "MEDIUM", score
        if low_count > 0:
            return "LOW", score

        # Default: MEDIUM if description is non-empty, else LOW
        if len(text) > 10:
            return "MEDIUM", 10
        return "LOW", 5

    def analyze(
        self,
        description: str,
        lat: float,
        lon: float,
        incident_type: Optional[str] = None,
    ) -> TriageResult:
        """
        Analyze emergency description and return triage result.

        Args:
            description: Free-text description of the emergency
            lat: Latitude of incident
            lon: Longitude of incident
            incident_type: Optional pre-classified type (accident|ambulance|etc.)

        Returns:
            TriageResult with severity, recommendations, required services
        """
        severity, score = self._classify_severity(description)

        # If incident_type is provided, use it to potentially upgrade severity
        if incident_type and incident_type in INCIDENT_TYPE_SEVERITY:
            type_severity = INCIDENT_TYPE_SEVERITY[incident_type]
            severity_order = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
            # Take the higher of the two
            if severity_order.index(type_severity) > severity_order.index(severity):
                severity = type_severity

        config = SEVERITY_CONFIG[severity]

        # Merge required services from incident type if available
        required_services = list(config["required_services"])
        if incident_type and incident_type in INCIDENT_TYPE_SERVICES:
            for svc in INCIDENT_TYPE_SERVICES[incident_type]:
                if svc not in required_services:
                    required_services.append(svc)

        # Determine first aid topic
        first_aid_topic = config.get("first_aid_topic")
        if not first_aid_topic and incident_type:
            topic_map = {
                "accident": "road_accident_response",
                "medical": "cpr",
                "ambulance": "unconscious_person",
                "fire": "burns",
            }
            first_aid_topic = topic_map.get(incident_type)

        return TriageResult(
            severity=severity,
            call_emergency=config["call_emergency"],
            recommendations=config["recommendations"],
            required_services=required_services,
            first_aid_topic=first_aid_topic,
            score=score,
        )

    def analyze_incident_type(self, incident_type: str) -> TriageResult:
        """Quick triage based on incident type alone (no description)."""
        return self.analyze(
            description=incident_type.replace("_", " "),
            lat=0.0,
            lon=0.0,
            incident_type=incident_type,
        )


# ── Singleton ─────────────────────────────────────────────────────────────────
_engine: Optional[TriageEngine] = None


def get_triage_engine() -> TriageEngine:
    global _engine
    if _engine is None:
        _engine = TriageEngine()
    return _engine

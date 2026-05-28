"""
Complaint Routing Service (Step 4 from HTML spec).

Maps (lat, lng, road_type, country_code) → jurisdiction → EE contact.
Uses PostGIS ST_Within to find the matching jurisdiction polygon.

SLA days (from country config):
  NH  → 3 days
  SH  → 5 days
  MDR → 7 days
  Urban / Local → 10 days
"""
from datetime import datetime, timedelta
from typing import Optional
import math


# Default SLA days per road type (overridden by country config)
DEFAULT_SLA = {
    "NH": 3,
    "SH": 5,
    "MDR": 7,
    "Urban": 10,
    "Local": 10,
}


def get_sla_deadline(road_type: str, country_sla: Optional[dict] = None) -> datetime:
    """Return the SLA deadline datetime for a given road type."""
    sla_map = country_sla or DEFAULT_SLA
    days = sla_map.get(road_type, 10)
    return datetime.utcnow() + timedelta(days=days)


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Straight-line distance in km between two coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


async def find_jurisdiction(
    lat: float,
    lng: float,
    road_type: str,
    country_code: str,
    db_session,
) -> Optional[dict]:
    """
    PostGIS lookup: find the jurisdiction whose polygon contains (lat, lng)
    and matches road_type + country_code.

    Returns jurisdiction dict with EE contact info, or None if not found.
    """
    from sqlalchemy import text

    query = text("""
        SELECT
            j.id,
            j.ee_name,
            j.ee_email,
            j.ee_phone,
            j.division_name,
            j.road_type
        FROM jurisdictions j
        WHERE j.country_code = :country_code
          AND j.road_type = :road_type
          AND ST_Within(
              ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
              j.geom
          )
        LIMIT 1
    """)

    result = await db_session.execute(
        query,
        {"lat": lat, "lng": lng, "road_type": road_type, "country_code": country_code},
    )
    row = result.fetchone()
    if not row:
        return None

    return {
        "jurisdiction_id": str(row.id),
        "ee_name": row.ee_name,
        "ee_email": row.ee_email,
        "ee_phone": row.ee_phone,
        "division_name": row.division_name,
        "road_type": row.road_type,
    }


def build_routing_message(jurisdiction: dict, road_type: str, country_sla: Optional[dict] = None) -> dict:
    """
    Build the routing response shown to the citizen after report submission.
    e.g. "Complaint routed to: PWD EE, Bengaluru South Division 3"
    """
    sla_days = (country_sla or DEFAULT_SLA).get(road_type, 10)
    deadline = datetime.utcnow() + timedelta(days=sla_days)

    return {
        "routed_to": jurisdiction["ee_name"],
        "division": jurisdiction["division_name"],
        "ee_email": jurisdiction["ee_email"],
        "ee_phone": jurisdiction["ee_phone"],
        "sla_days": sla_days,
        "expected_resolution": deadline.strftime("%Y-%m-%d"),
        "message": (
            f"Complaint routed to: {jurisdiction['ee_name']}, "
            f"{jurisdiction['division_name']}. "
            f"Expected resolution within {sla_days} days."
        ),
    }

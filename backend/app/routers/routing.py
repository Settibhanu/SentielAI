"""
Complaint routing endpoints.

GET  /api/routing/jurisdictions
POST /api/routing/find-ee
"""
from fastapi import APIRouter, Query
from app.services.routing_service import build_routing_message, DEFAULT_SLA

router = APIRouter()

# Demo jurisdiction data for Bengaluru
DEMO_JURISDICTIONS = [
    {
        "id": "jur-001",
        "country_code": "IN",
        "road_type": "NH",
        "ee_name": "NHAI EE, Bengaluru NH-44 Division",
        "ee_email": "ee.nh44.blr@nhai.gov.in",
        "ee_phone": "+91-80-26521234",
        "division_name": "NHAI Bengaluru NH-44 Division",
    },
    {
        "id": "jur-002",
        "country_code": "IN",
        "road_type": "SH",
        "ee_name": "PWD EE, Bengaluru South Division 3",
        "ee_email": "ee.south3.blr@pwd.karnataka.gov.in",
        "ee_phone": "+91-80-22345678",
        "division_name": "PWD Bengaluru South Division 3",
    },
    {
        "id": "jur-003",
        "country_code": "IN",
        "road_type": "MDR",
        "ee_name": "Zilla Parishad EE, Bengaluru Rural",
        "ee_email": "ee.rural@zpbengaluru.gov.in",
        "ee_phone": "+91-80-27654321",
        "division_name": "Zilla Parishad Bengaluru Rural",
    },
    {
        "id": "jur-004",
        "country_code": "IN",
        "road_type": "Urban",
        "ee_name": "BBMP EE, East Zone Division 2",
        "ee_email": "ee.east2@bbmp.gov.in",
        "ee_phone": "+91-80-22660000",
        "division_name": "BBMP East Zone Division 2",
    },
    {
        "id": "jur-005",
        "country_code": "IN",
        "road_type": "Urban",
        "ee_name": "BBMP EE, South Zone Division 1",
        "ee_email": "ee.south1@bbmp.gov.in",
        "ee_phone": "+91-80-22661111",
        "division_name": "BBMP South Zone Division 1",
    },
]


@router.get("/jurisdictions")
async def list_jurisdictions(country: str = Query("IN")):
    """List all jurisdictions for a country."""
    return [j for j in DEMO_JURISDICTIONS if j["country_code"] == country]


@router.post("/find-ee")
async def find_ee(body: dict):
    """
    Given lat, lng, road_type, country_code — return the correct EE.
    Uses demo data; production uses PostGIS ST_Within.
    """
    road_type = body.get("road_type", "Urban")
    country_code = body.get("country_code", "IN")

    # Find matching jurisdiction by road type (demo: no spatial lookup)
    match = next(
        (j for j in DEMO_JURISDICTIONS
         if j["road_type"] == road_type and j["country_code"] == country_code),
        None,
    )

    if not match:
        return {"message": "No jurisdiction found for this road type", "routed_to": None}

    return build_routing_message(match, road_type)

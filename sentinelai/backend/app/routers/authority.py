"""
Authority dashboard endpoints.

GET  /api/dashboard/priority-queue
GET  /api/dashboard/transparency
GET  /api/dashboard/repairs
POST /api/dashboard/repairs/assign
GET  /api/dashboard/complaints
"""
from fastapi import APIRouter, HTTPException
from app.schemas.pydantic_schemas import RepairAssign

router = APIRouter()

# ── Demo data ─────────────────────────────────────────────────────────────────
DEMO_PRIORITY = [
    {
        "zone_id": "zone-001", "zone_name": "Silk Board Junction",
        "road_type": "SH", "api_score": 83.0, "risk_category": "Critical",
        "damage_reports_count": 23, "accident_count_1yr": 12,
        "last_relaying_date": "2022-03-15", "repair_status": "pending",
        "repair_cost_estimate_inr": 2500000, "lives_at_risk": "High",
    },
    {
        "zone_id": "zone-005", "zone_name": "Electronic City Phase 1",
        "road_type": "NH", "api_score": 72.0, "risk_category": "High",
        "damage_reports_count": 18, "accident_count_1yr": 9,
        "last_relaying_date": "2021-11-05", "repair_status": "pending",
        "repair_cost_estimate_inr": 1800000, "lives_at_risk": "High",
    },
    {
        "zone_id": "zone-002", "zone_name": "Marathahalli Bridge",
        "road_type": "NH", "api_score": 61.0, "risk_category": "High",
        "damage_reports_count": 14, "accident_count_1yr": 6,
        "last_relaying_date": "2023-07-01", "repair_status": "assigned",
        "repair_cost_estimate_inr": 1200000, "lives_at_risk": "Medium",
    },
    {
        "zone_id": "zone-003", "zone_name": "Koramangala 5th Block",
        "road_type": "MDR", "api_score": 38.0, "risk_category": "Medium",
        "damage_reports_count": 7, "accident_count_1yr": 3,
        "last_relaying_date": "2024-01-10", "repair_status": "in_progress",
        "repair_cost_estimate_inr": 600000, "lives_at_risk": "Low",
    },
    {
        "zone_id": "zone-004", "zone_name": "Indiranagar 100ft Road",
        "road_type": "Urban", "api_score": 15.0, "risk_category": "Low",
        "damage_reports_count": 2, "accident_count_1yr": 1,
        "last_relaying_date": "2024-09-20", "repair_status": "completed",
        "repair_cost_estimate_inr": 200000, "lives_at_risk": "Low",
    },
]

DEMO_REPAIRS = [
    {
        "id": "rep-001", "zone_id": "zone-002", "zone_name": "Marathahalli Bridge",
        "status": "assigned", "contractor_name": "M/s Bharat Road Works Pvt Ltd",
        "amount_sanctioned_inr": 1200000, "amount_spent_inr": None,
        "fund_source": "NHAI", "fund_source_url": "https://nhai.gov.in/tenders/2024/BLR-NH-44",
        "estimated_completion": "2025-03-15", "actual_completion": None,
        "quality_score": None, "recurring_damage": False,
    },
    {
        "id": "rep-002", "zone_id": "zone-003", "zone_name": "Koramangala 5th Block",
        "status": "in_progress", "contractor_name": "M/s Karnataka Road Corp",
        "amount_sanctioned_inr": 600000, "amount_spent_inr": 320000,
        "fund_source": "State PWD", "fund_source_url": "https://pwd.karnataka.gov.in/orders/2024/KOR-MDR-12",
        "estimated_completion": "2025-02-28", "actual_completion": None,
        "quality_score": None, "recurring_damage": True,
    },
    {
        "id": "rep-003", "zone_id": "zone-004", "zone_name": "Indiranagar 100ft Road",
        "status": "completed", "contractor_name": "M/s BBMP Works Division 4",
        "amount_sanctioned_inr": 200000, "amount_spent_inr": 185000,
        "fund_source": "Municipal Corp", "fund_source_url": None,
        "estimated_completion": "2024-11-30", "actual_completion": "2024-11-25",
        "quality_score": 7.8, "recurring_damage": False,
    },
]

DEMO_COMPLAINTS = [
    {
        "id": "comp-001", "zone_name": "Silk Board Junction",
        "road_type": "SH", "routed_to": "PWD EE, Bengaluru South Division 3",
        "ee_phone": "+91-80-22345678", "routed_at": "2025-01-10T09:30:00",
        "acknowledged_at": None, "sla_deadline": "2025-01-15T09:30:00",
        "sla_breached": False, "escalation_level": 0, "status": "pending",
    },
    {
        "id": "comp-002", "zone_name": "Electronic City Phase 1",
        "road_type": "NH", "routed_to": "NHAI EE, Bengaluru NH-44 Division",
        "ee_phone": "+91-80-26521234", "routed_at": "2025-01-08T14:00:00",
        "acknowledged_at": "2025-01-09T10:00:00", "sla_deadline": "2025-01-11T14:00:00",
        "sla_breached": True, "escalation_level": 1, "status": "escalated",
    },
]


@router.get("/priority-queue")
async def get_priority_queue():
    """Zones sorted by api_score DESC with repair cost estimate."""
    return sorted(DEMO_PRIORITY, key=lambda z: z["api_score"], reverse=True)


@router.get("/transparency")
async def get_transparency():
    """Repair records with contractor, cost, quality score, fund source."""
    return DEMO_REPAIRS


@router.get("/repairs")
async def get_repairs():
    """All repair records for the Kanban tracker."""
    return DEMO_REPAIRS


@router.post("/repairs/assign")
async def assign_repair(body: RepairAssign):
    """Assign a repair job to a contractor for a given zone."""
    # TODO: insert into repairs table
    return {
        "status": "assigned",
        "zone_id": str(body.zone_id),
        "contractor": body.contractor,
        "message": f"Repair assigned to {body.contractor}",
    }


@router.get("/complaints")
async def get_complaints():
    """Complaint routing inbox for authority view."""
    return DEMO_COMPLAINTS

"""
Country config endpoints.

GET /api/config/countries
GET /api/config/countries/{code}
"""
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter()

CONFIG_DIR = Path(__file__).parent.parent.parent / "config" / "countries"


@router.get("/countries")
async def list_countries():
    """List all available country configs."""
    configs = []
    if CONFIG_DIR.exists():
        for f in CONFIG_DIR.glob("*.json"):
            try:
                data = json.loads(f.read_text())
                configs.append({"code": f.stem, "name": data.get("name", f.stem)})
            except Exception:
                pass
    # Fallback if files not found
    if not configs:
        configs = [
            {"code": "IN", "name": "India"},
            {"code": "KE", "name": "Kenya"},
        ]
    return configs


@router.get("/countries/{code}")
async def get_country_config(code: str):
    """Return full country config JSON."""
    config_file = CONFIG_DIR / f"{code.upper()}.json"
    if config_file.exists():
        return json.loads(config_file.read_text())

    # Inline fallback configs
    FALLBACK = {
        "IN": {
            "code": "IN", "name": "India", "currency": "INR", "currency_symbol": "₹",
            "road_types": ["NH", "SH", "MDR", "Urban", "Local"],
            "road_type_labels": {
                "NH": "National Highway", "SH": "State Highway",
                "MDR": "Major District Road", "Urban": "Urban Road", "Local": "Local Road",
            },
            "authority_hierarchy": {
                "NH": "NHAI", "SH": "State PWD", "MDR": "Zilla Parishad",
                "Urban": "Municipal Corporation", "Local": "Gram Panchayat",
            },
            "sla_days": {"NH": 3, "SH": 5, "MDR": 7, "Urban": 10, "Local": 14},
            "fund_sources": ["PMGSY", "NHAI", "State PWD", "Municipal Corp",
                             "CRIF", "MLA LAD Fund", "MP LAD Fund"],
        },
        "KE": {
            "code": "KE", "name": "Kenya", "currency": "KES", "currency_symbol": "KSh",
            "road_types": ["A", "B", "C", "D", "Urban"],
            "road_type_labels": {
                "A": "Class A (National)", "B": "Class B (Regional)",
                "C": "Class C (County)", "D": "Class D (Rural)", "Urban": "Urban Road",
            },
            "authority_hierarchy": {
                "A": "KeNHA", "B": "KURA", "C": "KeRRA County Engineer",
                "D": "KeRRA County Engineer", "Urban": "County Government",
            },
            "sla_days": {"A": 3, "B": 5, "C": 7, "D": 10, "Urban": 10},
            "fund_sources": ["National Budget", "World Bank", "AfDB",
                             "County Government", "KENHA Budget"],
        },
    }

    config = FALLBACK.get(code.upper())
    if not config:
        raise HTTPException(status_code=404, detail=f"Country config '{code}' not found")
    return config

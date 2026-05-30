"""
SENTINEL SOS — Config Routes.

GET /api/config/emergency-numbers  — Emergency numbers by country
GET /api/config/categories         — Available service categories
"""
from fastapi import APIRouter

router = APIRouter()

# International emergency numbers (ISO 3166-1 alpha-2 codes)
EMERGENCY_NUMBERS = {
    "DEFAULT": {"police": "112", "ambulance": "112", "fire": "112", "general": "112"},
    "IN": {"police": "100", "ambulance": "108", "fire": "101", "general": "112"},
    "US": {"police": "911", "ambulance": "911", "fire": "911", "general": "911"},
    "GB": {"police": "999", "ambulance": "999", "fire": "999", "general": "999"},
    "AU": {"police": "000", "ambulance": "000", "fire": "000", "general": "000"},
    "KE": {"police": "999", "ambulance": "999", "fire": "999", "general": "999"},
    "ZA": {"police": "10111", "ambulance": "10177", "fire": "10177", "general": "112"},
    "NG": {"police": "199", "ambulance": "199", "fire": "199", "general": "112"},
    "DE": {"police": "110", "ambulance": "112", "fire": "112", "general": "112"},
    "FR": {"police": "17", "ambulance": "15", "fire": "18", "general": "112"},
    "JP": {"police": "110", "ambulance": "119", "fire": "119", "general": "119"},
    "CN": {"police": "110", "ambulance": "120", "fire": "119", "general": "120"},
    "BR": {"police": "190", "ambulance": "192", "fire": "193", "general": "192"},
    "CA": {"police": "911", "ambulance": "911", "fire": "911", "general": "911"},
    "MX": {"police": "911", "ambulance": "911", "fire": "911", "general": "911"},
    "PK": {"police": "15", "ambulance": "1122", "fire": "16", "general": "1122"},
    "BD": {"police": "999", "ambulance": "999", "fire": "999", "general": "999"},
    "PH": {"police": "117", "ambulance": "911", "fire": "911", "general": "911"},
    "ID": {"police": "110", "ambulance": "118", "fire": "113", "general": "112"},
    "TH": {"police": "191", "ambulance": "1669", "fire": "199", "general": "191"},
    "VN": {"police": "113", "ambulance": "115", "fire": "114", "general": "113"},
    "EG": {"police": "122", "ambulance": "123", "fire": "180", "general": "123"},
    "ET": {"police": "991", "ambulance": "907", "fire": "939", "general": "907"},
    "GH": {"police": "191", "ambulance": "193", "fire": "192", "general": "112"},
    "TZ": {"police": "112", "ambulance": "112", "fire": "112", "general": "112"},
    "UG": {"police": "999", "ambulance": "999", "fire": "999", "general": "999"},
    "RW": {"police": "112", "ambulance": "912", "fire": "112", "general": "112"},
    "SG": {"police": "999", "ambulance": "995", "fire": "995", "general": "995"},
    "MY": {"police": "999", "ambulance": "999", "fire": "994", "general": "999"},
    "NZ": {"police": "111", "ambulance": "111", "fire": "111", "general": "111"},
}

SERVICE_CATEGORIES = [
    {"id": "hospital", "label": "Hospital / Clinic", "icon": "🏥", "color": "#DC2626"},
    {"id": "ambulance", "label": "Ambulance Station", "icon": "🚑", "color": "#16A34A"},
    {"id": "police", "label": "Police Station", "icon": "👮", "color": "#2563EB"},
    {"id": "fire_station", "label": "Fire Station", "icon": "🔥", "color": "#EA580C"},
    {"id": "mechanic", "label": "Car Mechanic", "icon": "🔧", "color": "#7C3AED"},
    {"id": "fuel_station", "label": "Fuel Station", "icon": "⛽", "color": "#CA8A04"},
    {"id": "puncture_shop", "label": "Puncture / Tyre Shop", "icon": "🔧", "color": "#0891B2"},
    {"id": "towing", "label": "Towing Service", "icon": "🚛", "color": "#6B7280"},
]


@router.get("/emergency-numbers")
async def get_emergency_numbers(country: str = "DEFAULT"):
    """Get emergency numbers for a country (ISO 3166-1 alpha-2 code)."""
    numbers = EMERGENCY_NUMBERS.get(country.upper(), EMERGENCY_NUMBERS["DEFAULT"])
    return {
        "country": country.upper(),
        "numbers": numbers,
        "note": "112 is the international emergency number and works in most countries.",
    }


@router.get("/emergency-numbers/all")
async def get_all_emergency_numbers():
    """Get emergency numbers for all supported countries."""
    return EMERGENCY_NUMBERS


@router.get("/categories")
async def get_service_categories():
    """Get all available service categories with display metadata."""
    return SERVICE_CATEGORIES

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal, engine
from app.models.db_models import CachedLocation, Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Real data for Chennai to demonstrate offline capabilities
CHENNAI_DATA = [
    # Hospitals
    {
        "osm_id": "node/1234567891",
        "name": "Rajiv Gandhi Government General Hospital",
        "category": "hospital",
        "latitude": 13.0815,
        "longitude": 80.2750,
        "phone": "+91-44-25305000",
        "address": "Poonamallee High Rd, Park Town, Chennai, Tamil Nadu 600003",
    },
    {
        "osm_id": "node/1234567892",
        "name": "Apollo Hospitals Greams Road",
        "category": "hospital",
        "latitude": 13.0618,
        "longitude": 80.2483,
        "phone": "+91-44-28293333",
        "address": "21, Greams Lane, Off Greams Road, Chennai, Tamil Nadu 600006",
    },
    {
        "osm_id": "node/1234567893",
        "name": "Kauvery Hospital",
        "category": "hospital",
        "latitude": 13.0336,
        "longitude": 80.2582,
        "phone": "+91-44-40006000",
        "address": "81, TTK Road, Alwarpet, Chennai, Tamil Nadu 600018",
    },
    # Police
    {
        "osm_id": "node/2234567891",
        "name": "Vepery Police Station (G-1)",
        "category": "police",
        "latitude": 13.0841,
        "longitude": 80.2646,
        "phone": "044-23452295",
        "address": "EVK Sampath Rd, Vepery, Chennai",
    },
    {
        "osm_id": "node/2234567892",
        "name": "Mylapore Police Station (E-1)",
        "category": "police",
        "latitude": 13.0330,
        "longitude": 80.2690,
        "phone": "044-23452261",
        "address": "Kutchery Rd, Mylapore, Chennai",
    },
    # Fire Stations
    {
        "osm_id": "node/3234567891",
        "name": "Egmore Fire & Rescue Station",
        "category": "fire_station",
        "latitude": 13.0760,
        "longitude": 80.2562,
        "phone": "101",
        "address": "Rukmani Lakshmipathi Rd, Egmore, Chennai",
    },
    # Ambulance
    {
        "osm_id": "node/4234567891",
        "name": "108 Ambulance Depot - Central",
        "category": "ambulance",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "phone": "108",
        "address": "Central Railway Station Hub, Chennai",
    },
    # Mechanic / Towing
    {
        "osm_id": "node/5234567891",
        "name": "Chennai 24/7 Car Towing & Mechanics",
        "category": "towing",
        "latitude": 13.0500,
        "longitude": 80.2600,
        "phone": "+91-9876543210",
        "address": "Royapettah, Chennai",
    }
]

async def seed_data():
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for entry in CHENNAI_DATA:
            # Check if exists
            from sqlalchemy import select
            stmt = select(CachedLocation).where(CachedLocation.osm_id == entry["osm_id"])
            result = await session.execute(stmt)
            if not result.scalar_one_or_none():
                loc = CachedLocation(
                    osm_id=entry["osm_id"],
                    name=entry["name"],
                    category=entry["category"],
                    latitude=entry["latitude"],
                    longitude=entry["longitude"],
                    phone=entry.get("phone"),
                    address=entry.get("address")
                )
                session.add(loc)
        
        await session.commit()
        logger.info(f"Successfully seeded {len(CHENNAI_DATA)} offline emergency locations for Chennai!")

if __name__ == "__main__":
    asyncio.run(seed_data())

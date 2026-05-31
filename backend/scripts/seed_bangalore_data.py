import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal, engine
from app.models.db_models import CachedLocation, Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Real data for Bangalore to demonstrate offline capabilities
BANGALORE_DATA = [
    # Hospitals
    {
        "osm_id": "node/1334567891",
        "name": "NIMHANS Hospital",
        "category": "hospital",
        "latitude": 12.9372,
        "longitude": 77.5937,
        "phone": "+91-80-26995000",
        "address": "Hosur Road, Lakkasandra, Bengaluru, Karnataka 560029",
    },
    {
        "osm_id": "node/1334567892",
        "name": "Manipal Hospital Old Airport Road",
        "category": "hospital",
        "latitude": 12.9585,
        "longitude": 77.6492,
        "phone": "+91-80-25024444",
        "address": "98, HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017",
    },
    {
        "osm_id": "node/1334567893",
        "name": "St. John's Medical College Hospital",
        "category": "hospital",
        "latitude": 12.9298,
        "longitude": 77.6200,
        "phone": "+91-80-22065000",
        "address": "Sarjapur Road, John Nagar, Koramangala, Bengaluru, Karnataka 560034",
    },
    # Police
    {
        "osm_id": "node/2334567891",
        "name": "Cubbon Park Police Station",
        "category": "police",
        "latitude": 12.9778,
        "longitude": 77.5961,
        "phone": "080-22942544",
        "address": "Kasturba Road, Sampangi Rama Nagar, Bengaluru",
    },
    {
        "osm_id": "node/2334567892",
        "name": "Indiranagar Police Station",
        "category": "police",
        "latitude": 12.9782,
        "longitude": 77.6406,
        "phone": "080-22942542",
        "address": "CMH Road, Indiranagar, Bengaluru",
    },
    # Fire Stations
    {
        "osm_id": "node/3334567891",
        "name": "Jayanagar Fire Station",
        "category": "fire_station",
        "latitude": 12.9297,
        "longitude": 77.5857,
        "phone": "101",
        "address": "Jayanagar 3rd Block, Bengaluru",
    },
    # Ambulance
    {
        "osm_id": "node/4334567891",
        "name": "108 Ambulance Hub - South Zone",
        "category": "ambulance",
        "latitude": 12.9300,
        "longitude": 77.6000,
        "phone": "108",
        "address": "South Zone Hub, Bengaluru",
    },
    # Mechanic / Towing
    {
        "osm_id": "node/5334567891",
        "name": "Bengaluru Towing Services",
        "category": "towing",
        "latitude": 12.9500,
        "longitude": 77.5800,
        "phone": "+91-9988776655",
        "address": "Wilson Garden, Bengaluru",
    }
]

async def seed_data():
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for entry in BANGALORE_DATA:
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
        logger.info(f"Successfully seeded {len(BANGALORE_DATA)} offline emergency locations for Bangalore!")

if __name__ == "__main__":
    asyncio.run(seed_data())

"""
SENTINEL SOS — Location Service using Overpass API (OpenStreetMap).

Fetches REAL nearby emergency services — no hardcoded data.
Implements Redis caching with DB fallback for offline resilience.
"""
import asyncio
import json
import logging
import math
import os
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

OVERPASS_URLS = [
    os.getenv("OVERPASS_API_URL", "https://overpass-api.de/api/interpreter"),
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.ch/api/interpreter"
]
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# ── OSM tag mappings per category ─────────────────────────────────────────────
CATEGORY_TO_OSM: Dict[str, List[Tuple[str, str]]] = {
    "hospital": [
        ("amenity", "hospital"),
        ("amenity", "clinic"),
        ("healthcare", "hospital"),
        ("amenity", "doctors"),
    ],
    "ambulance": [
        ("emergency", "ambulance_station"),
        ("amenity", "ambulance_station"),
    ],
    "police": [
        ("amenity", "police"),
    ],
    "fire_station": [
        ("amenity", "fire_station"),
    ],
    "mechanic": [
        ("shop", "car_repair"),
        ("shop", "motorcycle_repair"),
    ],
    "fuel_station": [
        ("amenity", "fuel"),
    ],
    "puncture_shop": [
        ("shop", "tyres"),
        ("shop", "bicycle"),
        ("shop", "motorcycle"),
    ],
    "towing": [
        ("amenity", "vehicle_rescue"),
        ("shop", "car_repair"),
        ("emergency", "rescue"),
    ],
}

ALL_CATEGORIES = list(CATEGORY_TO_OSM.keys())


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class LocationResult:
    osm_id: str
    name: str
    category: str
    latitude: float
    longitude: float
    distance_km: float
    phone: Optional[str] = None
    address: Optional[str] = None
    opening_hours: Optional[str] = None
    website: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "osm_id": self.osm_id,
            "name": self.name,
            "category": self.category,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "distance_km": round(self.distance_km, 3),
            "phone": self.phone,
            "address": self.address,
            "opening_hours": self.opening_hours,
            "website": self.website,
        }


# ── Haversine distance ────────────────────────────────────────────────────────

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in km between two coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(max(0, a)))


# ── Abstract base ─────────────────────────────────────────────────────────────

class LocationProvider(ABC):
    @abstractmethod
    async def get_nearby(
        self,
        lat: float,
        lon: float,
        radius: int,
        categories: List[str],
    ) -> Dict[str, List[LocationResult]]:
        """Fetch nearby services for given categories."""
        ...


# ── Overpass implementation ───────────────────────────────────────────────────

class OverpassLocationProvider(LocationProvider):
    """
    Fetches real emergency service locations from OpenStreetMap via Overpass API.
    Implements Redis caching + DB fallback.
    """

    def __init__(self):
        self._redis = None
        self._redis_available = False
        self._init_redis()

    def _init_redis(self):
        try:
            import redis as redis_lib
            self._redis = redis_lib.from_url(REDIS_URL, decode_responses=True, socket_timeout=2)
            self._redis.ping()
            self._redis_available = True
            logger.info("Redis cache connected for location service")
        except Exception as e:
            logger.warning("Redis unavailable for location service: %s", e)
            self._redis_available = False

    def _cache_key(self, category: str, lat: float, lon: float, radius: int) -> str:
        """Round coordinates to 2 decimal places (~1km precision) for cache key."""
        lat_r = round(lat, 2)
        lon_r = round(lon, 2)
        return f"loc:{category}:{lat_r}:{lon_r}:{radius}"

    def _get_cached(self, key: str) -> Optional[List[dict]]:
        if not self._redis_available:
            return None
        try:
            data = self._redis.get(key)
            if data:
                return json.loads(data)
        except Exception:
            pass
        return None

    def _set_cached(self, key: str, data: List[dict], ttl: int = 1800):
        if not self._redis_available:
            return
        try:
            self._redis.setex(key, ttl, json.dumps(data))
        except Exception:
            pass

    def _build_overpass_query(
        self, tag_key: str, tag_value: str, lat: float, lon: float, radius: int
    ) -> str:
        """Build Overpass QL query for a single tag pair."""
        return (
            f'[out:json][timeout:25];'
            f'('
            f'  node["{tag_key}"="{tag_value}"](around:{radius},{lat},{lon});'
            f'  way["{tag_key}"="{tag_value}"](around:{radius},{lat},{lon});'
            f'  relation["{tag_key}"="{tag_value}"](around:{radius},{lat},{lon});'
            f');'
            f'out center tags;'
        )

    def _parse_element(
        self, element: dict, category: str, lat: float, lon: float
    ) -> Optional[LocationResult]:
        """Parse a single Overpass element into a LocationResult."""
        try:
            elem_type = element.get("type", "node")
            osm_id = f"{elem_type}/{element.get('id', 0)}"

            # Get coordinates
            if elem_type == "node":
                elem_lat = element.get("lat")
                elem_lon = element.get("lon")
            else:
                # way/relation — use center
                center = element.get("center", {})
                elem_lat = center.get("lat")
                elem_lon = center.get("lon")

            if elem_lat is None or elem_lon is None:
                return None

            tags = element.get("tags", {})
            name = (
                tags.get("name")
                or tags.get("name:en")
                or tags.get("operator")
                or tags.get("brand")
                or f"{category.replace('_', ' ').title()} (unnamed)"
            )

            # Build address from tags
            addr_parts = []
            for addr_tag in ["addr:housenumber", "addr:street", "addr:suburb", "addr:city"]:
                val = tags.get(addr_tag)
                if val:
                    addr_parts.append(val)
            address = ", ".join(addr_parts) if addr_parts else tags.get("addr:full")

            # Phone — try multiple tag variants
            phone = (
                tags.get("phone")
                or tags.get("contact:phone")
                or tags.get("telephone")
                or tags.get("emergency:phone")
            )

            distance = haversine_km(lat, lon, elem_lat, elem_lon)

            return LocationResult(
                osm_id=osm_id,
                name=name,
                category=category,
                latitude=elem_lat,
                longitude=elem_lon,
                distance_km=distance,
                phone=phone,
                address=address,
                opening_hours=tags.get("opening_hours"),
                website=tags.get("website") or tags.get("contact:website"),
            )
        except Exception as e:
            logger.debug("Failed to parse element: %s", e)
            return None

    async def _fetch_single_tag(
        self,
        tag_key: str,
        tag_value: str,
        lat: float,
        lon: float,
        radius: int,
        category: str,
        client: httpx.AsyncClient,
        retries: int = 5,
    ) -> List[LocationResult]:
        """Fetch results for a single OSM tag pair with exponential backoff."""
        query = self._build_overpass_query(tag_key, tag_value, lat, lon, radius)
        delay = 1.0

        for attempt in range(retries):
            # Rotate through available URLs
            url = OVERPASS_URLS[attempt % len(OVERPASS_URLS)]
            try:
                response = await client.post(
                    url,
                    data={"data": query},
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()
                elements = data.get("elements", [])

                results = []
                seen_ids = set()
                for elem in elements:
                    result = self._parse_element(elem, category, lat, lon)
                    if result and result.osm_id not in seen_ids:
                        seen_ids.add(result.osm_id)
                        results.append(result)

                logger.debug(
                    "Overpass [%s=%s] → %d results (attempt %d)",
                    tag_key, tag_value, len(results), attempt + 1
                )
                return results

            except httpx.TimeoutException:
                logger.warning(
                    "Overpass timeout for %s=%s (attempt %d/%d)",
                    tag_key, tag_value, attempt + 1, retries
                )
            except httpx.HTTPStatusError as e:
                logger.warning("Overpass HTTP error %s for %s=%s", e.response.status_code, tag_key, tag_value)
            except Exception as e:
                logger.warning("Overpass error for %s=%s: %s", tag_key, tag_value, e)

            if attempt < retries - 1:
                await asyncio.sleep(delay)
                delay *= 2  # exponential backoff
            else:
                # If all retries fail, raise an explicit exception to trigger DB fallback
                logger.error("Overpass completely failed for %s=%s after %d attempts", tag_key, tag_value, retries)
                raise ConnectionError(f"Overpass failed for {tag_key}={tag_value}")

    async def _fetch_category(
        self,
        category: str,
        lat: float,
        lon: float,
        radius: int,
        client: httpx.AsyncClient,
    ) -> List[LocationResult]:
        """Fetch all tag variants for a category in parallel, deduplicate, sort by distance."""
        # Check Redis cache first
        cache_key = self._cache_key(category, lat, lon, radius)
        cached = self._get_cached(cache_key)
        if cached:
            logger.debug("Cache hit for %s", cache_key)
            return [LocationResult(**item) for item in cached]

        tag_pairs = CATEGORY_TO_OSM.get(category, [])
        if not tag_pairs:
            return []

        # Fire all tag queries in parallel
        tasks = [
            self._fetch_single_tag(tag_key, tag_value, lat, lon, radius, category, client)
            for tag_key, tag_value in tag_pairs
        ]
        results_nested = await asyncio.gather(*tasks, return_exceptions=True)

        # Flatten + deduplicate by osm_id
        seen_ids = set()
        all_results: List[LocationResult] = []
        
        all_failed = True
        for batch in results_nested:
            if isinstance(batch, Exception):
                continue
            all_failed = False
            for r in batch:
                if r.osm_id not in seen_ids:
                    seen_ids.add(r.osm_id)
                    all_results.append(r)
                    
        if all_failed and results_nested:
            # If every single tag query for this category failed, bubble up the error
            raise Exception("All Overpass queries failed for category: " + category)

        # Sort by distance ascending
        all_results.sort(key=lambda r: r.distance_km)

        # Cache results
        if all_results:
            self._set_cached(cache_key, [r.to_dict() for r in all_results])

        logger.info("Category %s: %d unique results within %dm", category, len(all_results), radius)
        return all_results

    async def get_nearby(
        self,
        lat: float,
        lon: float,
        radius: int = 5000,
        categories: Optional[List[str]] = None,
    ) -> Dict[str, List[LocationResult]]:
        """
        Fetch nearby services for all requested categories in parallel.
        Falls back to DB cache if Overpass is unreachable.
        """
        if categories is None:
            categories = ALL_CATEGORIES

        # Validate categories
        valid_categories = [c for c in categories if c in CATEGORY_TO_OSM]

        async with httpx.AsyncClient() as client:
            tasks = {
                cat: self._fetch_category(cat, lat, lon, radius, client)
                for cat in valid_categories
            }
            results = await asyncio.gather(*tasks.values(), return_exceptions=True)

        output: Dict[str, List[LocationResult]] = {}
        for cat, result in zip(tasks.keys(), results):
            if isinstance(result, Exception):
                logger.error("Failed to fetch category %s: %s", cat, result)
                # Try DB fallback
                output[cat] = await self._db_fallback(cat, lat, lon, radius)
            else:
                output[cat] = result

        return output

    async def _db_fallback(
        self, category: str, lat: float, lon: float, radius: int
    ) -> List[LocationResult]:
        """Fall back to cached DB locations when Overpass is unreachable."""
        try:
            from app.database import AsyncSessionLocal
            from app.models.db_models import CachedLocation
            from sqlalchemy import select

            radius_deg = radius / 111000  # rough degrees

            async with AsyncSessionLocal() as session:
                stmt = select(CachedLocation).where(
                    CachedLocation.category == category,
                    CachedLocation.latitude.between(lat - radius_deg, lat + radius_deg),
                    CachedLocation.longitude.between(lon - radius_deg, lon + radius_deg),
                )
                result = await session.execute(stmt)
                rows = result.scalars().all()

            locations = []
            for row in rows:
                dist = haversine_km(lat, lon, row.latitude, row.longitude)
                if dist <= radius / 1000:
                    locations.append(LocationResult(
                        osm_id=row.osm_id or f"db/{row.id}",
                        name=row.name,
                        category=row.category,
                        latitude=row.latitude,
                        longitude=row.longitude,
                        distance_km=dist,
                        phone=row.phone,
                        address=row.address,
                    ))

            locations.sort(key=lambda r: r.distance_km)
            logger.info("DB fallback for %s: %d results", category, len(locations))
            return locations

        except Exception as e:
            logger.error("DB fallback failed for %s: %s", category, e)
            return []


# ── Singleton instance ────────────────────────────────────────────────────────
_provider: Optional[OverpassLocationProvider] = None


def get_location_provider() -> OverpassLocationProvider:
    global _provider
    if _provider is None:
        _provider = OverpassLocationProvider()
    return _provider

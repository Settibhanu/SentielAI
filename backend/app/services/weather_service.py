"""
Weather service — wraps OpenWeatherMap free tier API.
Provides current rainfall and weather condition for a lat/lng.

Set OPENWEATHER_API_KEY in your .env file.
Free tier: 1000 calls/day.
"""
import os
import httpx
from typing import Optional

OWM_BASE = "https://api.openweathermap.org/data/2.5"


async def get_current_weather(lat: float, lng: float) -> dict:
    """
    Fetch current weather for a coordinate.

    Returns:
        {
          rainfall_mm: float,       # rain in last 1h (0 if none)
          weather_condition: str,   # e.g. "Rain", "Clear"
          description: str,
          temp_celsius: float,
        }
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        # Return safe defaults when key is not configured
        return {"rainfall_mm": 0.0, "weather_condition": "Unknown", "description": "", "temp_celsius": 30.0}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{OWM_BASE}/weather",
            params={"lat": lat, "lon": lng, "appid": api_key, "units": "metric"},
        )
        resp.raise_for_status()
        data = resp.json()

    rainfall_mm = data.get("rain", {}).get("1h", 0.0)
    weather_main = data.get("weather", [{}])[0].get("main", "Unknown")
    description = data.get("weather", [{}])[0].get("description", "")
    temp = data.get("main", {}).get("temp", 30.0)

    return {
        "rainfall_mm": rainfall_mm,
        "weather_condition": weather_main,
        "description": description,
        "temp_celsius": temp,
    }

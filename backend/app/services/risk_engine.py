"""
Risk Engine — Accident Probability Index (API Score) calculator.
Implements the exact formula from the HTML spec (Section 04).

Components:
  Infrastructure decay  0–40 pts
  Accident history      0–30 pts
  Weather risk          0–20 pts
  Contextual risk       0–10 pts

7-day forecast:
  min(100, current_score + (decay_rate × days × rain_multiplier))
  decay_rate = 0.8 if unresolved_reports > 5, else 0.3
"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ZoneData:
    # Infrastructure
    reports_last_30_days: int = 0
    avg_ai_severity: float = 0.0          # 0–10
    days_since_relay: int = 0             # days since last road relaying

    # Accident history
    accidents_last_year: int = 0
    fatal_count: int = 0

    # Weather
    current_rainfall_mm: float = 0.0

    # Contextual
    near_school: bool = False
    near_junction: bool = False
    is_night: bool = False
    has_streetlight: bool = True
    road_type: str = "Urban"              # NH, SH, MDR, Urban, Local

    # For forecast
    unresolved_reports: int = 0
    rain_forecast_mm: float = 0.0


def calculate_api_score(zone: ZoneData) -> tuple[float, str]:
    """
    Compute API Score (0–100) and risk category.

    Returns:
        (score, category)  category ∈ {Low, Medium, High, Critical}
    """
    # Component 1: Infrastructure decay (0–40 pts)
    relay_penalty = min(10, zone.days_since_relay / 365)
    infra = min(40,
        zone.reports_last_30_days * 1.5
        + zone.avg_ai_severity * 1.5
        + relay_penalty
    )

    # Component 2: Accident history (0–30 pts)
    accident = min(30,
        zone.accidents_last_year * 3
        + zone.fatal_count * 5
    )

    # Component 3: Weather risk (0–20 pts)
    weather = min(20, zone.current_rainfall_mm / 5)

    # Component 4: Contextual risk (0–10 pts)
    ctx = 0
    if zone.near_school:
        ctx += 2
    if zone.near_junction:
        ctx += 2
    if zone.is_night and not zone.has_streetlight:
        ctx += 3
    if zone.road_type in ("MDR", "Rural", "Local"):
        ctx += 3
    ctx = min(10, ctx)

    total = round(infra + accident + weather + ctx, 1)
    return total, _category(total)


def forecast_api_score(current_score: float, zone: ZoneData, days: int = 7) -> float:
    """
    7-day deterioration forecast.
    decay_rate = 0.8 if unresolved_reports > 5, else 0.3
    rain_multiplier = 1 + (rain_forecast_mm / 100)
    """
    decay_rate = 0.8 if zone.unresolved_reports > 5 else 0.3
    rain_multiplier = 1 + (zone.rain_forecast_mm / 100)
    forecast = current_score + (decay_rate * days * rain_multiplier)
    return round(min(100.0, forecast), 1)


def _category(score: float) -> str:
    if score >= 75:
        return "Critical"
    if score >= 50:
        return "High"
    if score >= 25:
        return "Medium"
    return "Low"

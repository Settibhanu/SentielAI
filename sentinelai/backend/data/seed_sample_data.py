"""
Seed script — inserts demo data:
  - 5 Bengaluru road zones
  - 5 jurisdiction records (EEs)
  - 30 accident records
  - 10 repair records with contractor + fund source

Usage:
    python -m data.seed_sample_data
"""
import os
import uuid
import random
from datetime import datetime, timedelta, date

import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sentinel:sentinel123@localhost/sentinelai")

ZONES = [
    ("Silk Board Junction",     "Bengaluru", "SH",    12.9176, 77.6228, "2022-03-15"),
    ("Marathahalli Bridge",     "Bengaluru", "NH",    12.9591, 77.7006, "2023-07-01"),
    ("Koramangala 5th Block",   "Bengaluru", "MDR",   12.9352, 77.6245, "2024-01-10"),
    ("Indiranagar 100ft Road",  "Bengaluru", "Urban", 12.9784, 77.6408, "2024-09-20"),
    ("Electronic City Phase 1", "Bengaluru", "NH",    12.8399, 77.6770, "2021-11-05"),
]

JURISDICTIONS = [
    ("IN", "NH",    "NHAI EE, Bengaluru NH-44 Division",
     "ee.nh44.blr@nhai.gov.in", "+91-80-26521234", "NHAI Bengaluru NH-44 Division"),
    ("IN", "SH",    "PWD EE, Bengaluru South Division 3",
     "ee.south3.blr@pwd.karnataka.gov.in", "+91-80-22345678", "PWD Bengaluru South Division 3"),
    ("IN", "MDR",   "Zilla Parishad EE, Bengaluru Rural",
     "ee.rural@zpbengaluru.gov.in", "+91-80-27654321", "Zilla Parishad Bengaluru Rural"),
    ("IN", "Urban", "BBMP EE, East Zone Division 2",
     "ee.east2@bbmp.gov.in", "+91-80-22660000", "BBMP East Zone Division 2"),
    ("IN", "Urban", "BBMP EE, South Zone Division 1",
     "ee.south1@bbmp.gov.in", "+91-80-22661111", "BBMP South Zone Division 1"),
]

REPAIRS = [
    ("zone-002", "M/s Bharat Road Works Pvt Ltd",  1200000, None,   "NHAI",
     "https://nhai.gov.in/tenders/2024/BLR-NH-44", "assigned",    False),
    ("zone-003", "M/s Karnataka Road Corp",         600000, 320000, "State PWD",
     "https://pwd.karnataka.gov.in/orders/2024/KOR-MDR-12", "in_progress", True),
    ("zone-004", "M/s BBMP Works Division 4",       200000, 185000, "Municipal Corp",
     None, "completed", False),
    ("zone-001", "M/s Deccan Infra Ltd",           2500000, None,   "State PWD",
     "https://pwd.karnataka.gov.in/orders/2024/SB-SH-35", "pending", True),
    ("zone-005", "M/s NH Constructions Ltd",       1800000, None,   "NHAI",
     "https://nhai.gov.in/tenders/2024/BLR-EC-NH", "pending", False),
]

ACCIDENT_SEVERITIES = ["minor", "serious", "fatal"]
WEATHER_CONDITIONS = ["Clear", "Rain", "Fog", "Cloudy"]
VEHICLE_TYPES = ["car", "motorcycle", "truck", "bus", "auto"]


def seed():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # ── Countries ──────────────────────────────────────────────────
    print("Inserting countries…")
    for code, name in [("IN", "India"), ("KE", "Kenya")]:
        cur.execute("""
            INSERT INTO countries (code, name, currency)
            VALUES (%s, %s, %s) ON CONFLICT DO NOTHING
        """, (code, name, "INR" if code == "IN" else "KES"))

    # ── Zones ──────────────────────────────────────────────────────
    print("Inserting road zones…")
    zone_ids = {}
    for name, city, road_type, lat, lng, relay_date in ZONES:
        zid = str(uuid.uuid4())
        zone_ids[name] = zid
        # Create a small polygon around the point
        d = 0.003
        geom = f"POLYGON(({lng-d} {lat-d},{lng+d} {lat-d},{lng+d} {lat+d},{lng-d} {lat+d},{lng-d} {lat-d}))"
        cur.execute("""
            INSERT INTO road_zones
              (id, zone_name, geom, city, country_code, road_type, last_relaying_date,
               api_score, risk_category)
            VALUES (%s, %s, ST_GeomFromText(%s, 4326), %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (zid, name, geom, city, "IN", road_type, relay_date, 0.0, "Low"))

    # ── Jurisdictions ──────────────────────────────────────────────
    print("Inserting jurisdictions…")
    for country_code, road_type, ee_name, ee_email, ee_phone, division in JURISDICTIONS:
        # Broad polygon covering Bengaluru
        geom = "POLYGON((77.4 12.7, 77.9 12.7, 77.9 13.2, 77.4 13.2, 77.4 12.7))"
        cur.execute("""
            INSERT INTO jurisdictions
              (id, country_code, road_type, ee_name, ee_email, ee_phone, division_name, geom)
            VALUES (%s, %s, %s, %s, %s, %s, %s, ST_GeomFromText(%s, 4326))
            ON CONFLICT DO NOTHING
        """, (str(uuid.uuid4()), country_code, road_type, ee_name, ee_email, ee_phone, division, geom))

    # ── Accident records ───────────────────────────────────────────
    print("Inserting 30 accident records…")
    zone_id_list = list(zone_ids.values())
    for _ in range(30):
        n = random.randint(1, 3)
        vehicles = random.sample(VEHICLE_TYPES, n)
        cur.execute("""
            INSERT INTO accident_history
              (id, zone_id, accident_date, severity, vehicle_types, weather_condition, lat, lng)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            str(uuid.uuid4()),
            random.choice(zone_id_list),
            date.today() - timedelta(days=random.randint(1, 365)),
            random.choice(ACCIDENT_SEVERITIES),
            vehicles,
            random.choice(WEATHER_CONDITIONS),
            12.85 + random.random() * 0.35,
            77.55 + random.random() * 0.25,
        ))

    # ── Repair records ─────────────────────────────────────────────
    print("Inserting 10 repair records…")
    zone_name_map = {
        "zone-001": zone_ids.get("Silk Board Junction"),
        "zone-002": zone_ids.get("Marathahalli Bridge"),
        "zone-003": zone_ids.get("Koramangala 5th Block"),
        "zone-004": zone_ids.get("Indiranagar 100ft Road"),
        "zone-005": zone_ids.get("Electronic City Phase 1"),
    }
    for zone_key, contractor, sanctioned, spent, fund_src, fund_url, status, recurring in REPAIRS:
        zid = zone_name_map.get(zone_key)
        if not zid:
            continue
        cur.execute("""
            INSERT INTO repairs
              (id, zone_id, contractor_name, assigned_date, estimated_completion,
               amount_sanctioned_inr, amount_spent_inr, fund_source, fund_source_url,
               status, recurring_damage, source_report_ids)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            str(uuid.uuid4()), zid, contractor,
            datetime.utcnow() - timedelta(days=random.randint(10, 60)),
            date.today() + timedelta(days=random.randint(30, 90)),
            sanctioned, spent, fund_src, fund_url, status, recurring, [],
        ))

    conn.commit()
    cur.close()
    conn.close()
    print("✅ All seed data inserted successfully")


if __name__ == "__main__":
    seed()

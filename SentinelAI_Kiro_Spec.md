# SentinelAI — Complete Project Specification for Kiro
## Road Safety Hackathon 2026 | IIT Madras | Problem: RoadWatch + RoadSoS

---

## 0. NORTH STAR (Read This First)

**The one-line pitch:**
> "SentinelAI doesn't fix potholes — it prevents the accidents that potholes cause, before they happen."

**The core differentiator** is NOT pothole detection (everyone does that).
The differentiator is the **Accident Probability Index (API Score)** — a zone-level risk score
computed from infrastructure decay + historical accident data + weather + time-of-day.

**Scope discipline:** Build 3 things deeply, not 7 things shallowly.
1. Citizen reporting pipeline with AI damage classification
2. Risk scoring engine per road zone
3. Authority dashboard + emergency routing

---

## 1. SYSTEM ARCHITECTURE

```
[Citizen App / Web]
        |
   Report Submission
  (image + GPS + severity)
        |
        v
[FastAPI Backend]
        |
    ┌───┴────────────────────┐
    |                        |
[AI Service]          [Data Ingestion]
YOLOv8 damage         Weather API
classification        iRAD accident data
Severity scoring      OSM road data
    |                        |
    └───────┬────────────────┘
            |
    [Risk Engine]
    Accident Probability Index (API Score)
    per 500m road grid cell
            |
    ┌───────┴───────────────┐
    |                       |
[Heatmap Dashboard]   [Alert Engine]
Authority view        Citizen warnings
Repair prioritization Emergency dispatch
Transparency layer    Ambulance routing
```

---

## 2. TECH STACK (Exact, No Ambiguity)

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Maps:** Leaflet.js + react-leaflet (free, no API key needed for MVP)
- **Charts:** Recharts
- **State:** Zustand

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL + PostGIS extension (for geospatial queries)
- **File Storage:** Local filesystem for MVP (S3-compatible path for future)
- **Task Queue:** Celery + Redis (for async AI processing)

### AI/ML
- **Object Detection:** YOLOv8n (nano — fast, runs on CPU)
  - Pre-trained on: RDD2022 dataset (Road Damage Detection, publicly available)
  - Classes: longitudinal_crack, transverse_crack, alligator_crack, pothole
- **Risk Engine:** XGBoost classifier (tabular data)
  - Input features: damage_count_30d, avg_severity, accident_history_count,
    rainfall_mm, traffic_density_estimate, road_type, hour_of_day, near_junction
  - Output: API Score (0–100), Risk Category (Low/Medium/High/Critical)
- **Fallback (if no GPU):** Rule-based severity scoring using damage_count + severity_weights

### External APIs
- **Weather:** OpenWeatherMap free tier (1000 calls/day)
- **Maps/Geocoding:** Nominatim (OpenStreetMap, free)
- **Accident Data:** MoRTH iRAD open dataset (download once, seed DB)

---

## 3. DATABASE SCHEMA

```sql
-- Road grid cells (500m x 500m zones)
CREATE TABLE road_zones (
  id UUID PRIMARY KEY,
  zone_name TEXT,
  geom GEOMETRY(POLYGON, 4326),  -- PostGIS polygon
  city TEXT,
  road_type TEXT,  -- highway, arterial, local
  api_score FLOAT DEFAULT 0,
  risk_category TEXT DEFAULT 'Low',
  last_updated TIMESTAMP
);

-- Citizen reports
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  zone_id UUID REFERENCES road_zones(id),
  reporter_type TEXT,  -- citizen, authority, automated
  image_url TEXT,
  lat FLOAT,
  lng FLOAT,
  damage_type TEXT,  -- pothole, crack, flooding, broken_signal, missing_divider
  ai_severity_score FLOAT,  -- 0-10 from YOLOv8
  manual_severity TEXT,  -- low/medium/high
  status TEXT DEFAULT 'pending',  -- pending, verified, repair_assigned, repaired
  created_at TIMESTAMP DEFAULT NOW()
);

-- Historical accidents (seeded from iRAD/MoRTH data)
CREATE TABLE accident_history (
  id UUID PRIMARY KEY,
  zone_id UUID REFERENCES road_zones(id),
  accident_date DATE,
  severity TEXT,  -- minor, serious, fatal
  vehicle_types TEXT[],
  weather_condition TEXT,
  lat FLOAT,
  lng FLOAT
);

-- Repair tracking
CREATE TABLE repairs (
  id UUID PRIMARY KEY,
  zone_id UUID REFERENCES road_zones(id),
  assigned_date TIMESTAMP,
  contractor TEXT,
  estimated_completion DATE,
  actual_completion DATE,
  quality_score FLOAT,  -- null until post-repair reports assessed
  cost_inr BIGINT,
  source_report_ids UUID[]
);

-- Emergency resources
CREATE TABLE emergency_resources (
  id UUID PRIMARY KEY,
  name TEXT,
  type TEXT,  -- hospital, ambulance_station, police_station
  lat FLOAT,
  lng FLOAT,
  contact TEXT,
  available BOOLEAN DEFAULT TRUE
);
```

---

## 4. API ENDPOINTS (FastAPI)

### Citizen Reporting
```
POST /api/reports/submit
  Body: { image: base64, lat, lng, damage_type, manual_severity, description }
  Response: { report_id, ai_severity_score, zone_id, zone_risk_level }

GET /api/reports/{report_id}/status
  Response: { status, repair_assigned, eta }
```

### Risk Engine
```
GET /api/zones/heatmap
  Query: ?city=Chennai&bounds=lat1,lng1,lat2,lng2
  Response: [{ zone_id, geom, api_score, risk_category, top_hazards[] }]

GET /api/zones/{zone_id}/details
  Response: {
    api_score, risk_category, damage_reports_count,
    accident_count_1yr, repair_status, weather_risk_multiplier,
    contributing_factors: { infrastructure: 40, accidents: 35, weather: 15, traffic: 10 }
  }

POST /api/zones/recalculate  (internal, called by Celery)
  Recalculates API Score for all zones using latest data
```

### Authority Dashboard
```
GET /api/dashboard/priority-queue
  Response: [zones sorted by api_score DESC, with repair_cost_estimate, lives_at_risk]

GET /api/dashboard/transparency
  Response: [repairs with contractor, cost, quality_score, delay_days]

POST /api/repairs/assign
  Body: { zone_id, contractor, budget, deadline }
```

### Emergency (RoadSoS)
```
GET /api/emergency/nearby
  Query: ?lat=12.97&lng=80.24&type=hospital,ambulance
  Response: [{ name, type, distance_km, eta_minutes, contact }]

POST /api/emergency/incident
  Body: { lat, lng, severity }
  Response: { nearest_hospital, route, ambulance_contact, police_contact }
```

---

## 5. AI RISK ENGINE — DETAILED LOGIC

### API Score Formula (for MVP if XGBoost not trained)

```python
def calculate_api_score(zone_data):
    # Component 1: Infrastructure decay (0-40 points)
    recent_reports = zone_data['reports_last_30_days']
    avg_severity = zone_data['avg_ai_severity']  # 0-10
    infra_score = min(40, (recent_reports * 2) + (avg_severity * 2))

    # Component 2: Accident history (0-30 points)
    accidents_1yr = zone_data['accidents_last_year']
    fatal_weight = zone_data['fatal_count'] * 5
    accident_score = min(30, accidents_1yr * 3 + fatal_weight)

    # Component 3: Weather risk (0-20 points)
    rainfall_mm = zone_data['current_rainfall_mm']
    weather_score = min(20, rainfall_mm / 5)  # 100mm rain = max 20pts

    # Component 4: Contextual risk (0-10 points)
    ctx = 0
    if zone_data['near_school']: ctx += 3
    if zone_data['near_junction']: ctx += 3
    if zone_data['is_night'] and zone_data['no_streetlight']: ctx += 4

    total = infra_score + accident_score + weather_score + ctx

    if total >= 75: category = "Critical"
    elif total >= 50: category = "High"
    elif total >= 25: category = "Medium"
    else: category = "Low"

    return total, category
```

### YOLOv8 Integration
```python
# model/damage_detector.py
from ultralytics import YOLO
import cv2

model = YOLO("yolov8n_rdd2022.pt")  # fine-tuned on RDD2022

def detect_damage(image_path):
    results = model(image_path)
    detections = []
    for box in results[0].boxes:
        detections.append({
            "class": model.names[int(box.cls)],
            "confidence": float(box.conf),
            "severity_score": compute_severity(box)
        })
    return detections

def compute_severity(box):
    # Larger bounding box relative to image = more severe
    area_ratio = (box.xywh[0][2] * box.xywh[0][3]) / (640 * 640)
    confidence = float(box.conf)
    return round(min(10, area_ratio * 100 + confidence * 3), 1)
```

---

## 6. FRONTEND PAGES & COMPONENTS

### Page 1: Citizen Report Page (`/report`)
**Components:**
- CameraCapture — opens device camera, captures image
- LocationPicker — shows current GPS on mini-map, allow drag-adjust
- DamageTypeSelector — icon grid: Pothole / Crack / Flooding / Broken Signal / Missing Divider
- SeveritySlider — Low / Medium / High
- SubmitButton — POST to /api/reports/submit
- ResultCard — shows AI verdict + zone risk level after submit

### Page 2: Live Heatmap Dashboard (`/map`)
**Components:**
- LeafletMap — fullscreen map with PostGIS zone polygons
- ZoneLayer — color-coded by risk: green/yellow/orange/red
- ZonePopup — on click: zone name, API score, top hazards, pending reports count
- FilterBar — filter by city, risk level, road type
- WeatherOverlay — toggle rainfall layer (from OpenWeatherMap tiles)
- AccidentMarkers — toggle historical accident pins
- LiveUpdateBanner — "Last updated X mins ago"

### Page 3: Authority Dashboard (`/authority`)
**Components:**
- PriorityQueue — ranked table of zones: Zone | Risk Score | Reports | Accidents | Repair Status | Action
- RepairTracker — kanban: Pending → Assigned → In Progress → Completed → Verified
- TransparencyTable — contractor | budget | deadline | actual completion | quality score
- ExportButton — download priority list as PDF/CSV
- AlertComposer — send alert SMS/notification to citizens in a zone (simulated)

### Page 4: Emergency Finder (`/sos`)
**Components:**
- AutoLocate — gets user GPS
- ResourceMap — shows nearest hospitals, ambulance stations, police
- ResourceCards — sorted by distance: name, ETA, phone number tap-to-call
- IncidentReporter — one-tap "I'm in an accident" button
- RouteDisplay — shows driving route to nearest trauma center

### Page 5: Zone Detail (`/zone/:id`)
**Components:**
- RiskBreakdownChart — donut chart showing 4 contributing factors
- ReportTimeline — last 30 days of reports on this zone
- WeatherRiskBadge — current weather multiplier
- RepairHistoryTimeline — past repairs, quality scores, recurring damage flag
- PredictionNote — "Based on current trends, risk will increase by X% in next 7 days if unrepaired"

---

## 7. FOLDER STRUCTURE

```
sentinelai/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Report.jsx
│   │   │   ├── Heatmap.jsx
│   │   │   ├── Authority.jsx
│   │   │   ├── Emergency.jsx
│   │   │   └── ZoneDetail.jsx
│   │   ├── components/
│   │   │   ├── map/
│   │   │   │   ├── LeafletMap.jsx
│   │   │   │   ├── ZoneLayer.jsx
│   │   │   │   └── AccidentMarkers.jsx
│   │   │   ├── report/
│   │   │   │   ├── CameraCapture.jsx
│   │   │   │   └── DamageTypeSelector.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── PriorityQueue.jsx
│   │   │   │   └── RepairTracker.jsx
│   │   │   └── shared/
│   │   │       ├── RiskBadge.jsx
│   │   │       └── ApiScoreGauge.jsx
│   │   ├── store/
│   │   │   └── useAppStore.js  (Zustand)
│   │   └── api/
│   │       └── client.js  (axios instance)
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── reports.py
│   │   │   ├── zones.py
│   │   │   ├── authority.py
│   │   │   └── emergency.py
│   │   ├── services/
│   │   │   ├── risk_engine.py      ← API Score calculator
│   │   │   ├── damage_detector.py  ← YOLOv8
│   │   │   ├── weather_service.py  ← OpenWeatherMap
│   │   │   └── routing_service.py  ← Emergency routing
│   │   ├── models/
│   │   │   └── db_models.py        ← SQLAlchemy models
│   │   └── schemas/
│   │       └── pydantic_schemas.py
│   ├── ml/
│   │   ├── yolov8n_rdd2022.pt      ← download from HuggingFace
│   │   └── xgboost_risk_model.pkl  ← train locally
│   ├── data/
│   │   └── seed_accident_data.py   ← seeds iRAD data into DB
│   └── requirements.txt
│
├── docker-compose.yml
└── README.md
```

---

## 8. SEED DATA SOURCES (Real, Downloadable)

These are real public datasets. Using them = your risk model is evidence-based.

1. **RDD2022** — Road Damage Detection dataset
   - URL: https://github.com/sekilab/RoadDamageDetector
   - Use: Fine-tune YOLOv8 on Indian road images subset

2. **MoRTH iRAD** — India Road Accident Database
   - URL: https://irad.nic.in (request download or use published reports)
   - Use: Seed accident_history table, train XGBoost risk model

3. **OpenStreetMap** — Road network for Chennai/any city
   - Tool: osmnx Python library (`pip install osmnx`)
   - Use: Generate road_zones grid, road_type attribute

4. **IMD Rainfall Data** — India Meteorological Department
   - Use: Historical rainfall for training weather component

### Quick Seed Script
```python
# backend/data/seed_chennai_zones.py
import osmnx as ox
import geopandas as gpd

G = ox.graph_from_place("Chennai, India", network_type="drive")
zones = ox.graph_to_gdfs(G, nodes=False, edges=True)
# Convert edges to 500m grid cells using PostGIS
# Insert into road_zones table
```

---

## 9. DOCKER SETUP

```yaml
# docker-compose.yml
version: "3.9"
services:
  db:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: sentinelai
      POSTGRES_USER: sentinel
      POSTGRES_PASSWORD: sentinel123
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [db, redis]
    environment:
      DATABASE_URL: postgresql://sentinel:sentinel123@db/sentinelai
      OPENWEATHER_API_KEY: ${OPENWEATHER_API_KEY}

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      VITE_API_URL: http://localhost:8000
```

---

## 10. WHAT TO MOCK vs WHAT TO BUILD REAL

| Feature | Build Real | Mock OK |
|---|---|---|
| Report submission form | ✅ Real | |
| Image upload + storage | ✅ Real | |
| YOLOv8 damage detection | ✅ Real (use pre-trained RDD2022) | |
| API Score formula | ✅ Real | |
| Leaflet heatmap | ✅ Real | |
| Weather API call | ✅ Real (free tier) | |
| iRAD accident data | ✅ Seed real data | |
| XGBoost trained model | | ✅ Formula-based for demo |
| SMS alerts | | ✅ Console log / UI simulation |
| Real-time ambulance dispatch | | ✅ Show routing on map |
| Contractor quality scoring | | ✅ Hardcode sample data |

---

## 11. PRESENTATION SLIDE STRUCTURE (7 Slides)

1. **Problem** — "India has 1.7L road deaths/year. 60% involve road defects. Systems today react after death, not before."
2. **Solution Overview** — SentinelAI architecture diagram (the flow from Citizen → AI → Risk Engine → Action)
3. **AI Pipeline** — YOLOv8 damage detection → API Score components → Risk category output (with real numbers)
4. **Heatmap Demo** — Screenshot/live of Leaflet dashboard with color-coded zones
5. **Authority Dashboard** — Priority repair queue + transparency tracker
6. **Emergency Integration** — RoadSoS screen, nearest hospital routing
7. **Impact + Scale** — "If deployed across 10 cities, estimated X high-risk zones identified per month. Open-source, integrates with existing MoRTH iRAD infrastructure."

---

## 12. THE ONE THING THAT WILL GET YOU SHORTLISTED

In your AI pipeline slide, show **real output numbers**:

```
Zone: Silk Board Junction, Bengaluru
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reports (30d):     23 pothole reports
Avg AI Severity:   7.4 / 10
Accidents (1yr):   12 (2 fatal)
Rainfall (today):  34mm
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API Score:         83 / 100
Risk Category:     CRITICAL ⚠️
Recommended:       Emergency repair within 48hrs
Pre-position:      Ambulance at NIMHANS (2.1km)
```

This one card, shown on screen, is worth more than 20 slides of architecture diagrams.

---

## 13. INSTRUCTIONS FOR KIRO

When giving this to Kiro, prompt it in this order:

1. "Set up the project folder structure as defined in Section 7"
2. "Create the Docker Compose and database schema from Section 3 and Section 9"
3. "Build the FastAPI backend with all endpoints from Section 4. Use SQLAlchemy + PostGIS."
4. "Implement the risk_engine.py using the formula in Section 5"
5. "Integrate YOLOv8n with the RDD2022 weights for damage detection per Section 5"
6. "Build the React frontend starting with the Heatmap page (Section 6, Page 2), then Report page, then Authority dashboard"
7. "Add the Emergency page last — it can use static seed data for hospital locations"
8. "Seed the database with Chennai OSM road zones using osmnx as shown in Section 8"
9. "Write a seed script for 50 sample reports and 30 sample accident records to demo the heatmap"

---
*SentinelAI | Road Safety Hackathon 2026 | IIT Madras*

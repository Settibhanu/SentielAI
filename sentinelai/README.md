# 🛡 SentinelAI — Road Safety Intelligence Platform

> **"SentinelAI detects road damage, predicts deterioration before accidents happen, routes complaints to the correct authority, and makes infrastructure spending transparent — works offline, works globally."**

**Road Safety Hackathon 2026 | IIT Madras | Problem: RoadWatch**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+PostGIS-336791?logo=postgresql)](https://postgis.net)
[![PWA](https://img.shields.io/badge/PWA-Offline--first-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)

---

## Problem Statement

India records **1.7 lakh road deaths per year** — 60% involve infrastructure defects. Existing systems:
- React **after** accidents, not before
- Have **no automatic routing** to the correct authority
- Provide **zero budget transparency** to citizens
- **Don't work offline** in rural areas

SentinelAI solves all four.

---

## Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Damage Detection** | YOLOv8n classifies potholes, cracks, flooding from photos |
| 📊 **API Score Engine** | Predictive zone-level risk score (0–100) from 4 data sources |
| 🏛 **EE Auto-Routing** | Complaint → correct Executive Engineer (NH→NHAI, SH→PWD, MDR→ZP) |
| 💰 **Budget Transparency** | Sanctioned vs spent, fund source URL, contractor, recurring damage flag |
| 📶 **Offline-First PWA** | IndexedDB queue, auto-sync on reconnect, installable on Android |
| 🌍 **Global Config** | Country JSON drives road types, authority hierarchy, SLA days |
| 💬 **AI Chatbot** | Intent-based road assistant — no external API needed |
| 🗺 **Live Heatmap** | Leaflet map with color-coded risk zones + 7-day forecast |
| ♿ **WCAG AA** | aria-labels, 44px tap targets, ≥4.5:1 contrast, keyboard nav |
| 🌐 **i18n** | English + Hindi, auto-detected from browser |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Citizen PWA (React + Vite)                │
│  Heatmap │ Report │ Authority │ ZoneDetail │ Community       │
│  Offline IndexedDB queue │ Service Worker │ i18n EN+HI       │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────────┐
│                   FastAPI Backend                            │
│  /reports  /zones  /dashboard  /routing  /config  /chatbot  │
└──────┬──────────────┬──────────────────────┬────────────────┘
       │              │                      │
┌──────▼──────┐ ┌─────▼──────┐ ┌────────────▼────────────────┐
│ PostgreSQL  │ │   Redis    │ │      AI Services             │
│ + PostGIS   │ │  + Celery  │ │  YOLOv8n damage detection   │
│ 8 tables    │ │  workers   │ │  API Score risk engine       │
└─────────────┘ └────────────┘ │  Intent-based chatbot        │
                                └─────────────────────────────┘
```

---

## Tech Stack

**Frontend**
- React 18 + Vite 5
- Tailwind CSS 3
- Leaflet.js + react-leaflet
- Recharts (risk breakdown charts)
- Zustand (state management)
- vite-plugin-pwa + Workbox (service worker)
- idb (IndexedDB offline queue)
- react-i18next (EN + HI)

**Backend**
- FastAPI (Python 3.11)
- PostgreSQL 15 + PostGIS 3.3
- SQLAlchemy 2 + GeoAlchemy2
- Celery + Redis (async AI jobs)
- Pydantic v2 (schema validation)

**AI / ML**
- YOLOv8n (ultralytics) — fine-tuned on RDD2022 dataset
- Formula-based API Score engine (4 components)
- Intent-based chatbot (keyword matching, no external API)
- XGBoost (stretch goal — formula fallback used for demo)

**External APIs (free tier)**
- OpenWeatherMap — rainfall data for weather risk component
- Nominatim / OSM — geocoding and road network data
- OSRM — routing (no API key needed)

---

## Folder Structure

```
sentinelai/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Heatmap.jsx          Live risk heatmap
│   │   │   ├── Report.jsx           Citizen damage report
│   │   │   ├── Authority.jsx        Authority dashboard
│   │   │   ├── ZoneDetail.jsx       Zone risk breakdown
│   │   │   └── Community.jsx        Leaderboard + impact
│   │   ├── components/
│   │   │   ├── chatbot/
│   │   │   │   ├── ChatbotWidget.jsx Floating FAB + overlay
│   │   │   │   ├── ChatWindow.jsx   Chat panel
│   │   │   │   ├── ChatMessage.jsx  Message bubble
│   │   │   │   ├── QuickActions.jsx Chip suggestions
│   │   │   │   └── TypingIndicator.jsx Animated dots
│   │   │   ├── map/
│   │   │   │   ├── LeafletMap.jsx
│   │   │   │   ├── ZoneLayer.jsx    Color-coded polygons
│   │   │   │   └── AccidentMarkers.jsx
│   │   │   ├── report/
│   │   │   │   ├── CameraCapture.jsx
│   │   │   │   ├── DamageTypeSelector.jsx
│   │   │   │   └── RoadTypeSelector.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── PriorityQueue.jsx
│   │   │   │   ├── RepairTracker.jsx
│   │   │   │   ├── BudgetTransparencyTable.jsx
│   │   │   │   └── ComplaintInbox.jsx
│   │   │   └── shared/
│   │   │       ├── RiskBadge.jsx
│   │   │       ├── ApiScoreGauge.jsx
│   │   │       ├── FundSourceBadge.jsx
│   │   │       ├── OfflineBanner.jsx
│   │   │       ├── CountrySelector.jsx
│   │   │       └── PwaInstallPrompt.jsx
│   │   ├── lib/
│   │   │   ├── offlineQueue.js      IndexedDB queue + sync
│   │   │   └── i18n.js              EN + HI translations
│   │   └── store/
│   │       ├── useAppStore.js       Global app state
│   │       └── useChatStore.js      Chat message state
│   ├── package.json
│   └── vite.config.js               PWA + proxy config
│
├── backend/
│   ├── app/
│   │   ├── main.py                  FastAPI app + CORS
│   │   ├── routers/
│   │   │   ├── reports.py           POST /api/reports/submit
│   │   │   ├── zones.py             GET  /api/zones/heatmap
│   │   │   ├── authority.py         GET  /api/dashboard/*
│   │   │   ├── routing.py           POST /api/routing/find-ee
│   │   │   ├── config.py            GET  /api/config/countries
│   │   │   └── chatbot.py           POST /api/chatbot/message
│   │   ├── services/
│   │   │   ├── risk_engine.py       API Score formula
│   │   │   ├── damage_detector.py   YOLOv8n inference
│   │   │   ├── weather_service.py   OpenWeatherMap
│   │   │   ├── routing_service.py   PostGIS EE lookup
│   │   │   └── chatbot_service.py   Intent classification
│   │   ├── models/
│   │   │   └── db_models.py         8 SQLAlchemy tables
│   │   └── schemas/
│   │       └── pydantic_schemas.py  Request/response models
│   ├── config/
│   │   └── countries/
│   │       ├── IN.json              India config
│   │       └── KE.json              Kenya config
│   ├── data/
│   │   ├── seed_chennai_zones.py    OSM → 500m grid
│   │   └── seed_sample_data.py      Demo zones + accidents
│   ├── ml/
│   │   └── .gitkeep                 Place yolov8n_rdd2022.pt here
│   └── requirements.txt
│
└── docker-compose.yml
```

---

## Setup Instructions

### Prerequisites
- Docker Desktop (recommended) **or** Python 3.11 + Node.js 20 + PostgreSQL 15
- Git

### 1. Clone and configure

```bash
git clone <repo-url>
cd sentinelai
cp .env.example .env
```

Edit `.env`:
```env
OPENWEATHER_API_KEY=your_key_here   # https://openweathermap.org/api (free)
DATABASE_URL=postgresql://sentinel:sentinel123@localhost/sentinelai
REDIS_URL=redis://localhost:6379/0
```

### 2. Docker (recommended — one command)

```bash
docker compose up --build
```

This starts:
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### 3. Seed the database

```bash
# Inside the backend container:
docker compose exec backend python -m data.seed_sample_data
```

Or locally:
```bash
cd backend
python -m data.seed_sample_data
```

---

## Running Without Docker

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start PostgreSQL + PostGIS (must be running)
# Create DB: createdb sentinelai && psql sentinelai -c "CREATE EXTENSION postgis;"

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

### Redis + Celery workers

```bash
# Terminal 1 — Redis
redis-server

# Terminal 2 — Celery worker
cd backend
celery -A app.celery_app worker --loglevel=info
```

---

## Database Setup

The schema uses 8 tables:

| Table | Purpose |
|---|---|
| `countries` | Country config (road types, authority hierarchy, SLA days) |
| `jurisdictions` | EE contact + PostGIS polygon per road type |
| `road_zones` | 500m grid cells with API Score + 7-day forecast |
| `reports` | Citizen damage reports with AI severity + offline sync flag |
| `complaint_routing` | EE routing with SLA deadline + escalation level |
| `repairs` | Contractor, sanctioned/spent amounts, fund source |
| `accident_history` | Historical accidents (seeded from iRAD/MoRTH) |
| `citizen_contributors` | Trust score + badges for data quality weighting |

Run migrations:
```bash
cd backend
alembic upgrade head
```

---

## YOLOv8 Model Setup

1. Download `yolov8n_rdd2022.pt` from [RoadDamageDetector](https://github.com/sekilab/RoadDamageDetector)
2. Place it at `backend/ml/yolov8n_rdd2022.pt`

The model detects 4 damage classes:
- `pothole`
- `alligator_crack`
- `longitudinal_crack`
- `transverse_crack`

If the model file is absent, the system falls back to manual severity scoring.

---

## API Score Formula

```
API Score (0–100) =
  Infrastructure decay  (0–40 pts)
    = reports_30d × 1.5 + avg_severity × 1.5 + min(10, days_since_relay/365)

+ Accident history      (0–30 pts)
    = accidents_1yr × 3 + fatal_count × 5

+ Weather risk          (0–20 pts)
    = min(20, rainfall_mm / 5)

+ Contextual risk       (0–10 pts)
    = +2 near school, +2 near junction, +3 poor lighting, +3 MDR/Rural
```

**7-day forecast:**
```
min(100, current_score + decay_rate × 7 × rain_multiplier)
decay_rate = 0.8 if unresolved_reports > 5, else 0.3
```

Risk categories: **Low** (<25) · **Medium** (25–49) · **High** (50–74) · **Critical** (≥75)

---

## Chatbot

The AI chatbot requires **no external API** — it uses keyword matching + rule-based intent classification.

**Endpoint:** `POST /api/chatbot/message`

```json
{
  "message": "Who maintains this road?",
  "lat": 12.97,
  "lng": 77.59,
  "zone_id": "zone-001",
  "language": "en"
}
```

**Supported intents:**

| Intent | Example queries |
|---|---|
| `road_authority_lookup` | "Who maintains this road?", "Which EE is responsible?" |
| `road_risk_lookup` | "Why is this area red?", "What is the risk score?" |
| `report_issue` | "Report pothole", "I want to file a complaint" |
| `repair_status` | "What is the repair status?", "Is it fixed?" |
| `budget_lookup` | "What is the repair budget?", "How much was sanctioned?" |
| `contractor_lookup` | "Who is the contractor?", "Which company did the work?" |
| `emergency_contacts` | "Emergency contact", "Who do I call?" |
| `help` | "Help", "Hi", "What can you do?" |

---

## Offline Functionality

SentinelAI works fully offline:

1. **Service Worker** (Workbox via vite-plugin-pwa) caches:
   - App shell (HTML, JS, CSS)
   - OSM map tiles (CacheFirst, 500 entries, 7-day TTL)
   - API responses (StaleWhileRevalidate)

2. **IndexedDB queue** (`idb` library) stores reports submitted offline

3. **Auto-sync** fires on `window.addEventListener('online', ...)` — batch POSTs to `/api/reports/sync-offline`

4. **OfflineBanner** shows pending count: "📶 Offline — 3 report(s) queued"

---

## PWA Installation

On Android Chrome:
1. Open http://localhost:3000
2. Tap the browser menu → "Add to Home Screen"
3. Or wait for the in-app install prompt

The app works fully offline after installation.

---

## Country Config System

Country configs live in `backend/config/countries/`:

```json
// IN.json (India)
{
  "road_types": ["NH", "SH", "MDR", "Urban", "Local"],
  "authority_hierarchy": {
    "NH": "NHAI",
    "SH": "State PWD",
    "MDR": "Zilla Parishad"
  },
  "sla_days": { "NH": 3, "SH": 5, "MDR": 7 },
  "fund_sources": ["PMGSY", "NHAI", "State PWD", "CRIF", "MLA LAD Fund"]
}
```

The frontend `CountrySelector` switches the entire taxonomy. Kenya (`KE.json`) is also included.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reports/submit` | Submit damage report with image |
| POST | `/api/reports/sync-offline` | Batch sync from IndexedDB |
| GET | `/api/zones/heatmap` | GeoJSON zones with API scores |
| GET | `/api/zones/{id}/details` | Full zone risk breakdown |
| GET | `/api/zones/accidents` | Historical accident markers |
| GET | `/api/dashboard/priority-queue` | Zones ranked by API score |
| GET | `/api/dashboard/transparency` | Budget + contractor records |
| GET | `/api/dashboard/complaints` | Complaint routing inbox |
| POST | `/api/routing/find-ee` | Find EE for lat/lng + road type |
| GET | `/api/config/countries/{code}` | Country config JSON |
| POST | `/api/chatbot/message` | Chatbot intent + response |
| GET | `/health` | Health check |

Full interactive docs: http://localhost:8000/docs

---

## Accessibility (WCAG AA)

- All interactive elements have `aria-label`
- Minimum 44px tap targets throughout
- Color contrast ≥ 4.5:1 (dark theme)
- `role="status"` + `aria-live="polite"` on OfflineBanner
- `role="dialog"` + `aria-modal` on ChatWindow
- `role="radiogroup"` on damage/road type selectors
- Keyboard navigation: Tab, Enter, Escape (closes chatbot)
- Screen reader tested with NVDA

---

## Demo Accounts / Sample Data

No login required for the demo. Sample data includes:

| Zone | Road Type | API Score | Risk |
|---|---|---|---|
| Silk Board Junction | SH-35 | 83 | Critical |
| Electronic City Phase 1 | NH | 72 | High |
| Marathahalli Bridge | NH | 61 | High |
| Koramangala 5th Block | MDR | 38 | Medium |
| Indiranagar 100ft Road | Urban | 15 | Low |

---

## 90-Second Demo Script

| Time | Action | Criterion |
|------|--------|-----------|
| 0:00 | Open heatmap — Bengaluru zones colored by risk | Heatmap |
| 0:10 | Click Silk Board → SH-35, API 83, last relay 2022, forecast 91 | Road type, last relay |
| 0:20 | Click "Report Damage" — camera opens | Report form |
| 0:30 | AI verdict: "Pothole, severity 7.4/10" | AI accuracy |
| 0:50 | "Routed to: PWD EE, Bengaluru South Division 3" | EE routing |
| 1:00 | Authority Dashboard — zone at top of queue | Priority queue |
| 1:10 | Transparency table: contractor, ₹ sanctioned, fund source | Budget transparency |
| 1:20 | Airplane mode → submit → "Queued offline" | Offline PWA |
| 1:30 | Airplane mode off → "1 report synced" | Auto-sync |

---

## Hackathon Alignment

| Judging Criterion | SentinelAI Implementation |
|---|---|
| Road type (NH/SH/MDR) | Stored per zone; shown in UI; affects API Score weight |
| Last relaying date | `road_zones.last_relaying_date`; shown in zone detail |
| Contractor name | `repairs.contractor_name`; shown in transparency table |
| Routing to correct EE | `routing_service.py` + PostGIS ST_Within |
| Sanctioned vs spent | `repairs.amount_sanctioned_inr` + `amount_spent_inr` |
| Global applicability | IN.json + KE.json; CountrySelector in UI |
| Offline functionality | PWA + IndexedDB + auto-sync |
| Data accuracy | YOLOv8 AI + formula-based API Score |
| Complaint routing | ComplaintInbox + SLA + 72hr escalation |
| Budget transparency | BudgetTransparencyTable + FundSourceBadge |
| UI & accessibility | WCAG AA; multilingual; 44px tap targets |
| Cross-country info | Country config JSON system |

---

## Future Scope

- **XGBoost risk model** — replace formula with trained ML model on iRAD data
- **Real-time WebSocket** — live zone updates as reports come in
- **SMS escalation** — Twilio integration for 72hr SLA breach alerts
- **PDF export** — authority priority queue as printable report
- **Citizen trust scoring** — weight AI severity by contributor trust score
- **More countries** — Nigeria (NG.json), Bangladesh (BD.json)
- **Satellite imagery** — periodic road condition assessment via Sentinel-2

---

*SentinelAI | Road Safety Hackathon 2026 | IIT Madras*

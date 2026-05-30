# 🛡 SentinelAI — Road Safety Intelligence Platform

> **"SentinelAI detects road damage, predicts deterioration before accidents happen, routes complaints to the correct authority, and makes infrastructure spending transparent — works offline, works globally."**

**Road Safety Hackathon 2026 | IIT Madras | Problem: RoadWatch**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org)
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

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Docker (infrastructure only)                    │
│   PostgreSQL :5432          Redis :6379                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Local (Windows)                             │
│                                                              │
│   FastAPI backend  :8000    Celery worker                    │
│   React frontend   :5173    YOLO inference (CPU)             │
└─────────────────────────────────────────────────────────────┘
```

Docker runs **only** PostgreSQL and Redis — no ML images, no large builds.
Everything else runs directly on your machine, keeping Docker storage minimal.

---

## Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Damage Detection** | YOLOv8s classifies potholes, cracks, flooding from photos |
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

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Docker Desktop | Latest | PostgreSQL + Redis only |
| Python | 3.11 | Backend + Celery |
| Node.js | 20+ | Frontend |
| Git | Any | Clone repo |

---

## Quick Start

### 1. Clone and configure

```bash
git clone <repo-url>
cd SentielAI
cp .env.example .env
```

Edit `.env` — at minimum set your OpenWeatherMap key (the DB defaults work as-is):

```env
POSTGRES_DB=sentielai
POSTGRES_USER=sentinel
POSTGRES_PASSWORD=sentinel123
DATABASE_URL=postgresql://sentinel:sentinel123@localhost:5432/sentielai
REDIS_URL=redis://localhost:6379/0
OPENWEATHER_API_KEY=your_key_here
```

### 2. Start infrastructure (Docker)

```bash
docker compose up -d
```

This starts only PostgreSQL (port 5432) and Redis (port 6379).
No backend image, no ML image — minimal storage footprint.

Verify they're running:
```bash
docker compose ps
```

### 3. Backend

Open a terminal in the `backend/` folder:

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows CMD
# or: venv\Scripts\Activate.ps1   (PowerShell)

# Install dependencies (CPU-only PyTorch installed first to avoid CUDA download)
pip install torch==2.2.2 torchvision==0.17.2 --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# Run FastAPI
uvicorn app.main:app --reload --port 8000
```

API available at: http://localhost:8000
Swagger docs at: http://localhost:8000/docs

### 4. Celery worker

Open a second terminal in `backend/` with the venv activated:

```bash
cd backend
venv\Scripts\activate

celery -A app.celery_app:celery worker --loglevel=info --pool=solo
```

> `--pool=solo` is required on Windows (Celery's default prefork pool doesn't work on Windows).

### 5. Frontend

Open a third terminal in `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: http://localhost:5173

---

## YOLO Model Setup

Place your model weights file in `backend/ml/`:

```
backend/
└── ml/
    └── yolov8_rdd2022.pt    ← your model file goes here
```

The damage detector loads it automatically on first inference. If the file is absent, the system falls back to manual severity scoring — the app still runs.

> This setup avoids packaging large model weights inside Docker images, saving several GB of Docker storage.

---

## Services at a Glance

| Service | How it runs | URL / Port |
|---|---|---|
| PostgreSQL | Docker | localhost:5432 |
| Redis | Docker | localhost:6379 |
| FastAPI backend | Local (uvicorn) | http://localhost:8000 |
| React frontend | Local (Vite) | http://localhost:5173 |
| Celery worker | Local | — |
| YOLO inference | Local (CPU) | — |

---

## Folder Structure

```
SentielAI/
├── docker-compose.yml           PostgreSQL + Redis only
├── .env.example                 Copy to .env
│
├── backend/
│   ├── app/
│   │   ├── main.py              FastAPI entry point
│   │   ├── celery_app.py        Celery instance + config
│   │   ├── tasks.py             Background tasks (YOLO, weather refresh)
│   │   ├── routers/             API route handlers
│   │   ├── services/            Business logic
│   │   │   ├── damage_detector.py   YOLOv8 inference
│   │   │   ├── risk_engine.py       API Score formula
│   │   │   ├── weather_service.py   OpenWeatherMap
│   │   │   ├── routing_service.py   EE jurisdiction lookup
│   │   │   └── chatbot_service.py   Intent classification
│   │   ├── models/              SQLAlchemy ORM models
│   │   └── schemas/             Pydantic request/response schemas
│   ├── config/countries/        IN.json, KE.json
│   ├── data/                    DB seed scripts
│   ├── ml/                      ← place yolov8_rdd2022.pt here
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── pages/               Heatmap, Report, Authority, ZoneDetail, Community
    │   ├── components/          chatbot/, map/, report/, dashboard/, shared/
    │   └── lib/                 offlineQueue.js, i18n.js
    └── package.json
```

---

## Database Setup

Run migrations after the backend venv is active and Postgres is running:

```bash
cd backend
venv\Scripts\activate
alembic upgrade head
```

Seed sample data:

```bash
python -m data.seed_sample_data
```

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

---

## Chatbot

No external LLM API required — keyword matching + rule-based intent classification.

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

1. **Service Worker** (Workbox) caches app shell, map tiles, and API responses
2. **IndexedDB queue** stores reports submitted while offline
3. **Auto-sync** fires on reconnect — batch POSTs to `/api/reports/sync-offline`
4. **OfflineBanner** shows pending count: "📶 Offline — 3 report(s) queued"

---

## Migrating to Full Docker Later

When you're ready to containerise everything, re-add the backend/frontend/celery services to `docker-compose.yml`. The `Dockerfile` files in `backend/` and `frontend/` are already written and ready to use — this hybrid setup doesn't break anything.

---

## Tech Stack

**Frontend:** React 18 · Vite 5 · Tailwind CSS · Leaflet.js · Recharts · Zustand · vite-plugin-pwa · idb · react-i18next

**Backend:** FastAPI · Python 3.11 · SQLAlchemy 2 · Celery · Pydantic v2

**AI / ML:** YOLOv8s (ultralytics, CPU) · Formula-based API Score · Intent-based chatbot

**Infrastructure:** PostgreSQL 16 · Redis 7 · Docker (infra only)

**External APIs (free tier):** OpenWeatherMap · Nominatim/OSM · OSRM

---

## Demo Zones (Sample Data)

| Zone | Road Type | API Score | Risk |
|---|---|---|---|
| Silk Board Junction | SH-35 | 83 | Critical |
| Electronic City Phase 1 | NH | 72 | High |
| Marathahalli Bridge | NH | 61 | High |
| Koramangala 5th Block | MDR | 38 | Medium |
| Indiranagar 100ft Road | Urban | 15 | Low |

---

*SentinelAI | Road Safety Hackathon 2026 | IIT Madras*

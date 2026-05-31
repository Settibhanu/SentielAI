# 🛡️ SENTINEL SOS
> **"AI-Powered Emergency Roadside Assistance & Accident Response Platform"**
> Designed and built for the **IITM Road Safety Hackathon 2026**.

SENTINEL SOS provides high-speed, offline-resilient, AI-powered triage and real-time open-source emergency services locating (via OpenStreetMap's Overpass API) directly to citizens and responders during critical roadside incidents.

---

## 🏗️ Architecture

```
                               ┌────────────────────────────────────────────────────────────┐
                               │                    DOCKER CONTAINERS                       │
                               │  PostgreSQL (Port 5432)         Redis Cache (Port 6379)    │
                               └─────────────────────────────┬──────────────────────────────┘
                                                             │
                                                             │
                              ┌──────────────────────────────▼──────────────────────────────┐
                              │                    BACKEND (FastAPI App)                    │
                              │  • Port 8000                                                │
                              │  • SQLAlchemy 2.x ORM                                       │
                              │  • Overpass API Client (Haversine Distance matching)        │
                              │  • Deterministic Keyword AI Triage Engine                   │
                              │  • Background Celery Workers & Beat Scheduler               │
                              └──────────────────────────────┬──────────────────────────────┘
                                                             │
                                                             │
                              ┌──────────────────────────────▼──────────────────────────────┐
                              │                    FRONTEND (Vite/React)                    │
                              │  • Port 3000 / 5173 (Nginx deployment option)               │
                              │  • Leaflet Map Category Filters                             │
                              │  • Chatbot Widget Interface                                 │
                              │  • Offline localStorage & Service Worker Cache              │
                              └─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Features

*   **🤖 AI Triage Engine:** High-performance keyword-weighted emergency description analysis. Instant severity categorization (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) with actionable medical/first aid recommendations.
*   **🌍 Real OSM Overpass API Integration:** Queries live OpenStreetMap interpreter servers. Maximizes fetching of hospitals, ambulances, police, fire stations, mechanics, fuel stations, puncture shops, and towing services with zero placeholder data.
*   **📶 100% Offline Resilience:** Service Worker caches static assets and first aid guides. Features dual-caching (Redis in backend, `localStorage` in browser) and an offline banner, letting search fallback to local databases if network connection is lost.
*   **🚨 International Adaptability:** Supports any country code. Emergency hotline overrides default to international `112` but allow local overrides (e.g. `911`, `100`, `999`) dynamically loaded into first aid recommendations.
*   **❤️ Medically Accurate Guidelines:** Includes Red Cross / WHO standard first aid steps for CPR (adult, child, infant), bleeding control, fractures, burns, shock, choking, unconscious person, spinal injury, and road accident scene protection.
*   **💬 Persistent Timelines & Contacts:** Scope incident logs and emergency contacts per-user with robust CRUD operations.

---

## 🔧 Prerequisites

*   **Docker Desktop:** Running PostgreSQL and Redis containers.
*   **Python:** version `3.11`
*   **Node.js:** version `20+`

---

## 🚀 Setup & Execution Instructions

### 1. Copy Environment Configuration
Create your `.env` file in the root workspace folder:
```bash
cp .env.example .env
```
Ensure your database URLs and service API endpoints are set:
```env
DATABASE_URL=postgresql://sentinel:sentinel123@localhost:5432/sentielai
REDIS_URL=redis://localhost:6379/0
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
NOMINATIM_URL=https://nominatim.openstreetmap.org
SECRET_KEY=3eb634de-c866-4190-b18c-8cb0b60b299e
```

### 2. Launch Infrastructure (Docker)
Build and spin up the database, cache, backend, and background workers using Docker Compose:
```bash
docker compose up -d --build
```
This launches:
*   **PostgreSQL 16** on port `5432`
*   **Redis 7** on port `6379`
*   **FastAPI Backend** on port `8000`
*   **React Frontend** on port `3000`
*   **Celery Worker & Celery Beat** (scheduled pre-warm tasks run every 6 hours)

### 3. Quick Start (Windows)
For the fastest setup on Windows, we provide an automated batch script that launches all necessary terminals at once.

1. Ensure **Docker Desktop** is open and running.
2. Double-click the `start.bat` file in the root directory.
3. This will automatically open 4 separate command prompt windows:
   - **Database & Redis**: Starts the PostgreSQL and Redis Docker containers.
   - **FastAPI Backend**: Activates the virtual environment and starts the backend on port `8000`.
   - **Celery Worker**: Activates the virtual environment and starts the background worker.
   - **React Frontend**: Starts the Vite dev server on port `5173`.

> [!TIP]
> Swagger UI Docs will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)
> Frontend application will be available at: [http://localhost:5173](http://localhost:5173)

### 4. Verification & Local Manual Launch (Alternative)
If you prefer running services directly in separate command line terminals:

**Backend Setup:**
```bash
cd backend
python -m venv venv
# Activate virtualenv (Windows CMD):
venv\Scripts\activate
# Install deps:
pip install -r requirements.txt
# Run API dev server:
uvicorn app.main:app --reload --port 8000
```
Swagger UI Docs will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

**Celery Worker Setup:**
```bash
cd backend
venv\Scripts\activate
celery -A app.celery_app.celery worker --loglevel=info --pool=solo
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```
Dev environment accessible at: [http://localhost:5173](http://localhost:5173)

---

## 📡 API Reference Documentation

### SOS & Location Endpoints

#### `GET /api/sos/nearby`
Fetches real emergency service coordinate locations within a specified radius.
*   **Query Parameters:**
    *   `lat` (float, required): Latitude
    *   `lon` (float, required): Longitude
    *   `radius` (int, default `5000`): Search radius in meters
    *   `categories` (str, optional): Comma-separated list of amenities to query
*   **Returns:** JSON dictionary matching requested categories to active listings.

#### `POST /api/sos/analyze`
Submits free-text accident details for triage analysis.
*   **Request Body:** `{ "description": string, "latitude": float, "longitude": float }`
*   **Returns:** Recommended first-aid topic, emergency severity category, and nearby services.

#### `POST /api/sos/create`
Triggers a live SOS event, persisting coordinates and severity details to the PostgreSQL database.
*   **Request Body:** `{ "incident_type": string, "latitude": float, "longitude": float, "description": string, "user_id": UUID }`

---

### First Aid & Config Endpoints

#### `GET /api/firstaid`
Returns complete medically-accurate first aid guide topics (CPR, fractures, shock, burns, choking) for local storage offline cache synchronizations.

#### `GET /api/emergency-contacts`
Returns a list of primary user contacts. Supports full CRUD operations (`POST`, `PUT`, `DELETE`). Scoped via `X-User-ID` header.

#### `GET /api/incidents`
Fetches past SOS trigger timeline history. Scoped via `X-User-ID` header.

---

*SENTINEL SOS | AI-Powered Emergency Response Platform | IIT Madras Road Safety Hackathon 2026*

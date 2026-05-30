"""
SENTINEL SOS — FastAPI application entry point.
AI-Powered Emergency Roadside Assistance & Accident Response Platform.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.routers import sos, firstaid, contacts, incidents, chatbot, config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables if they don't exist."""
    try:
        from app.database import create_tables
        await create_tables()
        logger.info("Database tables verified/created")
    except Exception as e:
        logger.warning("DB table creation skipped: %s", e)
    yield
    logger.info("SENTINEL SOS shutting down")


app = FastAPI(
    title="SENTINEL SOS API",
    description=(
        "AI-Powered Emergency Roadside Assistance & Accident Response Platform. "
        "Real-time emergency services via OpenStreetMap Overpass API. "
        "IITM Road Safety Hackathon 2026."
    ),
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Register routers ──────────────────────────────────────────────────────────
app.include_router(sos.router,       prefix="/api/sos",                tags=["SOS"])
app.include_router(firstaid.router,  prefix="/api/firstaid",           tags=["First Aid"])
app.include_router(contacts.router,  prefix="/api/emergency-contacts", tags=["Contacts"])
app.include_router(incidents.router, prefix="/api/incidents",          tags=["Incidents"])
app.include_router(chatbot.router,   prefix="/api/chatbot",            tags=["Chatbot"])
app.include_router(config.router,    prefix="/api/config",             tags=["Config"])


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "SENTINEL SOS",
        "version": "3.0.0",
        "description": "AI-Powered Emergency Roadside Assistance",
    }

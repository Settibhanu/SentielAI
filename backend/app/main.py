"""
SentinelAI — FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.routers import reports, zones, authority, routing, config, chatbot

app = FastAPI(
    title="SentinelAI API",
    description="Road Safety Intelligence — Accident Probability Index + EE Complaint Routing",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routers
app.include_router(reports.router,   prefix="/api/reports",   tags=["Reports"])
app.include_router(zones.router,     prefix="/api/zones",     tags=["Zones"])
app.include_router(authority.router, prefix="/api/dashboard", tags=["Authority"])
app.include_router(routing.router,   prefix="/api/routing",   tags=["Routing"])
app.include_router(config.router,    prefix="/api/config",    tags=["Config"])
app.include_router(chatbot.router,   prefix="/api/chatbot",   tags=["Chatbot"])


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "SentinelAI", "version": "2.0.0"}

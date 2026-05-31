@echo off
echo ===================================================
echo      Starting Sentinel SOS Development Environment
echo ===================================================
echo.

echo [1/4] Starting PostgreSQL and Redis (Docker)...
start "Database & Redis" cmd /k "docker-compose up db redis"

echo Waiting 10 seconds for databases to initialize...
timeout /t 10 /nobreak >nul

echo [2/4] Starting FastAPI Backend...
start "FastAPI Backend" cmd /k "cd backend && ..\venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo [3/4] Starting Celery Worker...
start "Celery Worker" cmd /k "cd backend && ..\venv\Scripts\activate && celery -A app.celery_app.celery worker --loglevel=info -P threads"

echo [4/4] Starting Vite Frontend...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo All services are launching in separate windows!
echo - Frontend: http://localhost:5173
echo - Backend : http://localhost:8000
echo ===================================================
echo.
pause

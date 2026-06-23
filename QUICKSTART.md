# Quick Start (Windows)

## One-click launch

1. Open File Explorer → `Documents\AI Interview`
2. **Double-click `start-all.bat`**
3. Wait for 3 terminal windows to open
4. Browser opens at **http://localhost:5173**

## Login

| Email | Password |
|-------|----------|
| alice@example.com | Password123! |
| recruiter1@aiinterview.com | Password123! |
| admin@aiinterview.com | Password123! |

## Requirements

- **Node.js 20+** — https://nodejs.org
- **Python 3.11+** — https://python.org (check "Add to PATH" during install)

**Docker is optional.** The backend uses in-memory MongoDB by default (`USE_MEMORY_DB=true`).

## Verify services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend health | http://localhost:5000/api/v1/health |
| AI service health | http://localhost:8000/health |

## Troubleshooting

### ERR_CONNECTION_REFUSED
Nothing is running. Run `start-all.bat` and wait 15 seconds.

### Backend window shows errors
- Run `npm install` inside the `backend` folder
- If MongoDB error persists, ensure `USE_MEMORY_DB=true` is in `backend\.env`

### AI service fails
```bat
cd ai-service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend fails
```bat
cd frontend
npm install
npm run dev
```

### Login fails / no users
```bat
cd backend
npm run seed
```

## Manual start (4 terminals)

```bat
cd backend && npm run dev
cd ai-service && python -m uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

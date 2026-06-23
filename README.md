# AI Interview Selection Platform

A production-ready AI-powered interview and candidate selection platform built with React, Node.js, FastAPI, and MongoDB.

## Features

- **Authentication**: Email/password, Google OAuth, JWT, role-based access (Admin, Recruiter, Candidate), forgot password, email verification
- **Candidate Portal**: Profile management, resume upload, skills tracking, job applications, status tracker
- **Resume AI Analysis**: ATS scoring, skill extraction, job matching, improvement suggestions
- **Aptitude Tests**: Dynamic questions across 4 categories with timer and anti-cheat
- **Technical Assessment**: MCQ, coding challenges (Java, Python, JavaScript, C++), SQL, code execution via Piston
- **AI HR Interview**: Voice/text interaction, STT/TTS, follow-up questions, behavioral & technical questions
- **AI Evaluation**: Section-wise scores, strengths/weaknesses, recruiter summary
- **Recruiter Dashboard**: Job management, candidate pipeline, reports, analytics, shortlist/reject
- **Admin Panel**: User management, question bank CRUD
- **Modern UI**: Dark/light mode, Framer Motion animations, glassmorphism, responsive design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express, TypeScript, Mongoose, JWT |
| AI Service | Python, FastAPI, OpenAI-compatible API |
| Database | MongoDB |
| File Storage | Cloudinary |
| Email | Resend / SMTP |
| Code Execution | Piston API |

## Project Structure

```
├── frontend/          # React + Vite frontend
├── backend/           # Express API server
├── ai-service/        # FastAPI AI microservice
├── docs/              # Documentation
├── docker-compose.yml # Local MongoDB
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker (for MongoDB)
- OpenAI-compatible API key (optional — fallback responses work without it)

### 1. Start MongoDB

```bash
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run seed    # Load sample data
npm run dev     # http://localhost:5000
```

### 3. AI Service Setup

```bash
cd ai-service
cp .env.example .env
# Edit .env with your OPENAI_API_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev     # http://localhost:5173
```

## Demo Accounts

After running `npm run seed` in the backend:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aiinterview.com | Password123! |
| Recruiter | recruiter1@aiinterview.com | Password123! |
| Candidate | alice@example.com | Password123! |

## Environment Variables

See `.env.example` files in each service directory:
- `backend/.env.example` — MongoDB, JWT, Google OAuth, Cloudinary, Resend
- `ai-service/.env.example` — OpenAI API key and model
- `frontend/.env.example` — API URL, Google client ID

## API Documentation

Full API reference: [docs/API.md](docs/API.md)

## Deployment

Deployment guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

- Frontend → Vercel
- Backend → Render
- AI Service → Render
- Database → MongoDB Atlas

## Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# AI Service
cd ai-service && pytest tests/ -v
```

## Phase 2 Features (Complete)

- Face & emotion analysis (webcam proctoring during AI interview)
- Full admin dashboard with AI config (`/admin/ai-config`)
- Printable PDF reports + CSV candidate export
- Interview scheduling (recruiter → candidate notifications)
- Advanced proctoring (tab-switch detection on assessments & interviews)
- CI/CD pipelines (GitHub Actions build + Docker Compose)

## License

MIT

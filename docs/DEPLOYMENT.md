# Deployment Guide

## MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user and whitelist IP `0.0.0.0/0` (or specific IPs)
3. Copy the connection string: `mongodb+srv://user:pass@cluster.mongodb.net/ai_interview`

## Backend — Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=<generate-strong-secret>
   JWT_REFRESH_SECRET=<generate-strong-secret>
   FRONTEND_URL=https://your-app.vercel.app
   BACKEND_URL=https://your-api.onrender.com
   AI_SERVICE_URL=https://your-ai.onrender.com
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALLBACK_URL=https://your-api.onrender.com/api/v1/auth/google/callback
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   RESEND_API_KEY=...
   EMAIL_FROM=noreply@yourdomain.com
   ```

## AI Service — Render

1. Create another **Web Service**
2. Settings:
   - **Root Directory**: `ai-service`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3
3. Environment variables:
   ```
   OPENAI_API_KEY=sk-...
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_MODEL=gpt-4o-mini
   ```

## Frontend — Vercel

1. Import project on [vercel.com](https://vercel.com)
2. Settings (choose **one** approach):

   **Option A — Root deploy (recommended, uses `vercel.json` at repo root):**
   - **Root Directory**: leave as `.` (repository root)
   - Vercel reads `vercel.json` and builds `frontend/` automatically

   **Option B — Frontend-only deploy:**
   - **Root Directory**: `frontend`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. Environment variables (required for production API calls):
   ```
   # Use either one (both work):
   VITE_API_URL=https://your-api.onrender.com/api/v1
   BACKEND_URL=https://your-api.onrender.com
   VITE_GOOGLE_CLIENT_ID=...
   ```

   On your **backend** (Render), set:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```

4. **Troubleshooting Vercel build failures:**
   - If install fails at repo root: set **Root Directory** to `frontend` OR push the root `vercel.json` (included in this repo)
   - Ensure `VITE_API_URL` points to your deployed backend (e.g. Render), not `localhost`
   - Use **Node.js 20** (`.nvmrc` is included)
   - Redeploy after adding env vars — Vite bakes `VITE_*` vars at build time

## Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Copy Cloud Name, API Key, API Secret to backend env

## Resend Email Setup

1. Create account at [resend.com](https://resend.com)
2. Verify your domain
3. Copy API key to backend env

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-api.onrender.com/api/v1/auth/google/callback`
4. Copy Client ID to frontend and backend env

## Post-Deploy Checklist

- [ ] Run seed script against production DB (one time)
- [ ] Verify health endpoints: `/api/v1/health` and AI `/health`
- [ ] Test login flow end-to-end
- [ ] Test resume upload and analysis
- [ ] Test assessment and interview flows
- [ ] Verify CORS and cookie settings work across domains

## Local Development with Docker

```bash
docker-compose up -d   # Starts MongoDB on port 27017
```

## CI/CD

GitHub Actions workflow at `.github/workflows/ci.yml` runs tests on push/PR for all three services.

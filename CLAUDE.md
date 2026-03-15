# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FaceWallet — a biometric-first digital wallet using face-api.js for passwordless authentication. React+Vite frontend, Node.js+Express backend, SQLite database.

## Development Commands

### Backend (backend/)
```bash
cd backend
npm install
cp .env.example .env          # first-time setup, edit JWT_SECRET
node server.js                # starts on :5000, waits for DB init before accepting requests
node scripts/seed_mock_users.js  # creates 4 test users (sarah_w, james_c, elena_r, marcus_t)
docker compose up --build     # alternative: run via Docker
```

### Frontend (frontend/)
```bash
cd frontend
npm install
npm run dev    # starts on :5173
npm run build  # production build
```

### Verify Backend Health
```bash
curl http://localhost:5000/api/health
```

### Database Utilities (backend/)
```bash
node checkDb.js    # inspect DB state
node clearDb.js    # reset database
```

## Architecture

### Two-Process Development
Frontend (Vite :5173) and backend (Express :5000) run as separate processes. Frontend calls backend via `API_BASE` configured in `frontend/src/app/config.ts` (reads `VITE_API_URL` env var, defaults to `http://localhost:5000`). CORS is configured on the backend to accept requests from `FRONTEND_URL`.

### Frontend State Machine
`App.tsx` manages navigation through a `useState<AppState>` with states: `start`, `faceRegistration`, `faceRegistrationInfo`, `traditionalRegistration`, `traditionalLogin`, `login`, `dashboard`. There is no router library — state transitions drive which component renders.

### Face Recognition Flow
1. Browser loads SSD MobileNet v1 + FaceLandmark68Net + FaceRecognitionNet models from `frontend/public/models/`
2. `FaceRegistration.tsx` captures a 128-dimensional face descriptor via webcam using face-api.js
3. Descriptor (float array) is sent to `POST /api/face/register` or `POST /api/face/login`
4. Backend (`routes/face.js`) compares against all stored descriptors using Euclidean distance
5. Match threshold: distance <= 0.55 (tighter than face-api.js default of 0.6)

### Backend Route Structure
All routes are mounted under `/api/` in `server.js`:
- `routes/auth.js` — login/logout/session (`/api/auth`)
- `routes/register.js` — user creation (`/api/register`)
- `routes/face.js` — face descriptor storage and matching (`/api/face`)
- `routes/wallet.js` — balance, history, transfers (`/api/wallet`)
- `routes/user.js` — contacts list (`/api/users`)

Auth middleware in `middleware/auth.js` validates JWT from HttpOnly cookies.

### Database (SQLite)
Schema in `backend/db/schema.sql`: three tables — `users`, `face_descriptors`, `transactions`. DB connection in `db/index.js` exports an `initPromise` that the server awaits before listening. Money transfers use atomic SQL (decrement sender + increment recipient in one operation).

### Environment Variables
- Backend `.env`: `PORT`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV`
- Frontend `.env` (optional): `VITE_API_URL`

## Key Conventions

- **Commit format**: `type(scope): description` (e.g., `feat(phase-3): add face auth`)
- **Backend**: CommonJS (`require`), no TypeScript
- **Frontend**: ES modules, TypeScript, Tailwind CSS v4, Radix UI components in `components/ui/`
- **Auth**: JWT stored in HttpOnly cookies, 24h expiry
- **No test framework configured** — backend `package.json` has no test runner
- **GSD methodology**: project planning docs live in `.gsd/` (SPEC.md, ROADMAP.md, STATE.md) — reference PROJECT_RULES.md for the workflow

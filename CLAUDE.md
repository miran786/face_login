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
`App.tsx` manages navigation through a `useState<AppState>` with states: `start`, `faceRegistration`, `faceRegistrationInfo`, `traditionalRegistration`, `traditionalLogin`, `forgotPassword`, `login`, `dashboard`. There is no router library — state transitions drive which component renders.

`Dashboard.tsx` has its own inner `activeView` state (`dashboard` | `send` | `receive` | `history` | `profile`) that swaps between sub-components without touching `App.tsx`.

### Face Recognition Flow
1. Browser loads SSD MobileNet v1 + FaceLandmark68Net + FaceRecognitionNet models from `frontend/public/models/`
2. `FaceRegistration.tsx` captures a 128-dimensional face descriptor via webcam using face-api.js
3. Descriptor (float array) is sent to `POST /api/face/register` or `POST /api/face/login`
4. Backend (`routes/face.js`) compares against all stored descriptors using Euclidean distance
5. Match threshold: distance <= 0.55 (tighter than face-api.js default of 0.6)

### Backend Route Structure
All routes are mounted under `/api/` in `server.js`:
- `routes/auth.js` — login/logout/session/verify-password/reset-password (`/api/auth`)
- `routes/register.js` — user creation (`/api/register`)
- `routes/face.js` — face descriptor storage and matching (`/api/face`)
- `routes/wallet.js` — balance, history, transfers (`/api/wallet`)
- `routes/user.js` — contacts list + profile GET/PUT (`/api/users`)
- `routes/admin.js` — destructive ops: `DELETE /api/admin/clear-data` wipes all tables

Auth middleware in `middleware/auth.js` validates JWT from HttpOnly cookies.

Key auth endpoints:
- `POST /api/auth/verify-password` — verifies password for the *currently logged-in* user (used as transaction auth fallback when face fails); does **not** issue a new cookie
- `POST /api/auth/reset-password` — updates password given `{email, newPassword}`; no login required (used after frontend OTP verification)

### Database (SQLite)
Schema in `backend/db/schema.sql`: three tables — `users`, `face_descriptors`, `transactions`. DB connection in `db/index.js` exports an `initPromise` that the server awaits before listening. Money transfers use atomic SQL (decrement sender + increment recipient in one operation).

### EmailJS (frontend/src/utils/email-service.ts)
Credentials are hardcoded with env-var overrides (`VITE_EMAILJS_*`). Two active flows:
1. **Forgot password**: `sendPasswordResetOTP(email, otp)` — frontend generates a 6-digit OTP, sends it via `template_p4qx7ob`, then calls `POST /api/auth/reset-password` after the user verifies the OTP client-side
2. **Suspicious login alert**: `sendSuspiciousLoginAlert(email, metadata)` — fires after 3 consecutive failed password login attempts via `template_avr2cqo`

### Environment Variables
- Backend `.env`: `PORT`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV`
- Frontend `.env` (optional): `VITE_API_URL`, `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`

## Key Conventions

- **Backend**: CommonJS (`require`), no TypeScript
- **Frontend**: ES modules, TypeScript, Tailwind CSS v4, Radix UI components in `components/ui/`; Figma-originated components in `components/figma/`
- **Auth**: JWT stored in HttpOnly cookies, 24h expiry
- **No test framework configured** — backend `package.json` has no test runner

## Commit Format

`type(scope): description` — scope is the phase number for phase work (e.g., `feat(phase-3): add face auth`)

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code restructure, no behavior change |
| `test` | Adding/updating tests |
| `chore` | Maintenance, dependencies |

## GSD Workflow

Project planning docs live in `.gsd/` (`SPEC.md`, `ROADMAP.md`, `STATE.md`). The methodology follows **SPEC → PLAN → EXECUTE → VERIFY → COMMIT**:

- No implementation until `SPEC.md` has `Status: FINALIZED`
- Every change requires empirical proof (curl output, screenshot, build output)
- One task = one commit; update `STATE.md` after each wave of work
- See `PROJECT_RULES.md` for the full canonical rules

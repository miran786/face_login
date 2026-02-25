---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Dashboard Integration & API endpoints

## Objective
Build a protected dashboard API route to serve simulated wallet balance and transaction history, and integrate it into the React frontend.

## Context
- .gsd/SPEC.md
- backend/server.js
- frontend/src/app/components/Dashboard.tsx

## Tasks

<task type="auto">
  <name>Create Wallet API Routes</name>
  <files>
    - backend/routes/wallet.js
    - backend/server.js
  </files>
  <action>
    - Create a new Express router in `backend/routes/wallet.js`.
    - Add a GET `/wallet/balance` endpoint returning simulated balance (e.g. `{ balance: 12847.50 }`).
    - Add a GET `/wallet/history` endpoint returning a JSON array of simulated recent transactions.
    - Ensure these routes are protected by JWT authentication (using an auth middleware). Check `backend/routes/auth.js` or create `backend/middleware/auth.js` for JWT verification.
    - Update `backend/server.js` to mount the `wallet` routes at `/api/wallet` or `/api`.
  </action>
  <verify>curl http://localhost:5000/api/wallet/balance (should return 401 without token, or 200 with token)</verify>
  <done>Wallet API endpoints exist and return simulated data</done>
</task>

<task type="auto">
  <name>Integrate Dashboard UI with Wallet API</name>
  <files>
    - frontend/src/app/components/Dashboard.tsx
  </files>
  <action>
    - Update `Dashboard.tsx` to fetch the balance and transaction history from the backend APIs `http://localhost:5000/api/wallet/balance` and `http://localhost:5000/api/wallet/history` on component mount (or combined `/api/wallet`).
    - Setup `useEffect` with `credentials: 'include'` to call the API using the existing session cookies.
    - Remove the hardcoded initial state data for balance and transactions, replacing it with the fetched data.
  </action>
  <verify>User can log in and view the Dashboard populated with backend data</verify>
  <done>Dashboard.tsx dynamically fetches balance and history</done>
</task>

## Success Criteria
- [ ] Wallet endpoint returns simulated balance.
- [ ] History endpoint returns simulated transactions.
- [ ] Dashboard UI successfully displays the data dynamically from the backend.

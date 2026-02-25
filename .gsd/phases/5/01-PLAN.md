---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Polish & Integration Refinement

## Objective
Finalize the user experience by adding a missing Face ID login entry point, implementing fallback UI logic, and ensuring backend error consistency.

## Context
- .gsd/SPEC.md
- frontend/src/app/App.tsx
- frontend/src/app/components/RegistrationStart.tsx
- frontend/src/app/components/FaceAuth.tsx
- backend/routes/auth.js

## Tasks

<task type="auto">
  <name>Add Face ID Login Entry Point</name>
  <files>
    - frontend/src/app/components/RegistrationStart.tsx
    - frontend/src/app/App.tsx
  </files>
  <action>
    - Update `RegistrationStartProps` to include `onFaceLogin`.
    - Add a "Login with Face ID" button to `RegistrationStart.tsx` (below or next to the register button).
    - Update `App.tsx` to pass a callback that sets `appState` to `login`.
  </action>
  <verify>UI shows "Login with Face ID" button and clicking it opens the Face ID scan screen.</verify>
  <done>Entry point for Face ID login exists.</done>
</task>

<task type="auto">
  <name>Implement Fallback for Face ID failure</name>
  <files>
    - frontend/src/app/components/FaceAuth.tsx
    - frontend/src/app/App.tsx
  </files>
  <action>
    - Update `FaceAuthProps` to include `onFallback` callback.
    - In `FaceAuth.tsx`, when an error occurs, show a "Use Password Instead" button.
    - Clicking this button should trigger `onFallback`.
    - Update `App.tsx` to handle `onFallback` by setting `appState` to `traditionalLogin`.
  </action>
  <verify>Failed Face ID scan allows falling back to password login without refreshing.</verify>
  <done>Smooth fallback from Face ID to password exists.</done>
</task>

<task type="auto">
  <name>Backend Error Audit</name>
  <files>
    - backend/routes/auth.js
    - backend/routes/register.js
    - backend/routes/webauthn.js
  </files>
  <action>
    - Audit all error responses (400, 401, 404, 500).
    - Ensure they all return `{ error: "reason" }` as the JSON body.
    - Standardize HTTP status codes for authentication failures (401 for invalid credentials, 404 for user not found if applicable).
  </action>
  <verify>Manual API tests return consistent JSON error objects.</verify>
  <done>Backend error responses are consistent.</done>
</task>

## Success Criteria
- [ ] Users can initiate Face ID login from the start screen.
- [ ] Users can fall back to password login if Face ID fails.
- [ ] All error messages are presented clearly in the UI.
- [ ] Backend API returns consistent error formats.

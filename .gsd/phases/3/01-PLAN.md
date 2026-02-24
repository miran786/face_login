---
phase: 3
plan: 1
wave: 1
depends_on: []
files_modified: ["backend/routes/register.js", "backend/routes/auth.js", "backend/routes/webauthn.js", "frontend/src/app/components/FaceAuth.tsx", "frontend/src/app/components/FaceRegistrationInfo.tsx"]
autonomous: true

must_haves:
  truths:
    - "Users can register a passkey without a password."
    - "Users can authenticate using discoverable credentials (passkeys)."
  artifacts:
    - "/api/register/passkey endpoint exists."
    - "/api/auth/generate-options endpoint exists."
---

# Plan 3.1: WebAuthn Integration (Face ID / Passkeys)

<objective>
Implement full passwordless authentication using WebAuthn.

Purpose: Allow secure, biometric login (Face ID/Touch ID) to reduce friction.
Output: Backend endpoints for Passkey registration and login, Frontend components wired to `@simplewebauthn/browser`.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- backend/routes/webauthn.js
- frontend/src/app/components/FaceAuth.tsx
</context>

<tasks>

<task type="auto">
  <name>Implement WebAuthn Registration</name>
  <files>backend/routes/webauthn.js, frontend/src/app/components/FaceRegistrationInfo.tsx</files>
  <action>
    Create backend endpoints (`/generate-options`, `/verify`) for passkey registration. Wire up `startRegistration` in frontend.
  </action>
  <verify>Frontend receives successfully generated options</verify>
  <done>Passkey saved in SQLite DB linked to user ID</done>
</task>

<task type="auto">
  <name>Implement WebAuthn Authentication</name>
  <files>backend/routes/webauthn.js, frontend/src/app/components/FaceAuth.tsx</files>
  <action>
    Create backend endpoints for discoverable credentials login. Wire up `startAuthentication` in the frontend `FaceAuth.tsx`.
  </action>
  <verify>FaceAuth triggers browser biometric prompt</verify>
  <done>User is authenticated and redirected without password</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [x] WebAuthn logic relies on conditional mediation / discoverable credentials.
- [x] SQLite `passkeys` table properly populated.
</verification>

<success_criteria>
- [x] All tasks verified
- [x] Must-haves confirmed
</success_criteria>

# ROADMAP.md

> **Current Phase**: Not started
> **Milestone**: v1.0

## Must-Haves (from SPEC)
- [ ] Vite (React) front-end structure built using the provided UI template
- [ ] Express (Node.js) API built and connected to DB
- [ ] User sign-up flow supporting Username, Name, Password
- [ ] WebAuthn registration for Face ID passkeys
- [ ] WebAuthn authentication via Face ID passkeys
- [ ] Username and password fallback login
- [ ] Authenticated dashboard displaying simulated wallet balance and history

## Phases

### Phase 1: Environment & Foundation
**Status**: ⬜ Not Started
**Objective**: Scaffold the Vite (React) frontend by copying the provided UI, setup the Node.js/Express backend, and configure the database connection. Start defining models.
**Requirements**: REQ-01, REQ-02, REQ-10

### Phase 2: Core Authentication (Fallback)
**Status**: ⬜ Not Started
**Objective**: Implement traditional Username/Password sign-up and sign-in along with secure session management (JWT/cookies).
**Requirements**: REQ-03, REQ-05, REQ-06

### Phase 3: WebAuthn Integration (Face ID)
**Status**: ✅ Complete Started
**Objective**: Add WebAuthn support using `@simplewebauthn` for registering new passkeys (Face ID) and authenticating existing users.
**Requirements**: REQ-04

### Phase 4: Dashboard & Wallet Features
**Status**: ⬜ Not Started
**Objective**: Build a protected dashboard route in React. Develop API endpoints to serve simulated wallet balance and transaction history.
**Requirements**: REQ-07, REQ-08, REQ-09

### Phase 5: Polish & Final Integration
**Status**: ⬜ Not Started
**Objective**: End-to-end testing, refining the UI/UX for seamless fallback between Face ID and password inputs, and ensuring all error edge cases are smoothly handled.

# DECISIONS.md

## ADR 1: Choose React and Node.js
- **Date**: 2026-02-24
- **Decision**: Use React (Next.js) for the frontend and Node.js (Express) for the backend.
- **Rationale**: User preference and robust ecosystem for building secure web applications.

## ADR 2: Use WebAuthn for Biometrics
- **Date**: 2026-02-24
- **Decision**: Integrate `@simplewebauthn` for passwordless Face ID authentication.
- **Rationale**: Leverages device-native biometrics via standardized browser APIs, ensuring high security and a seamless user experience without requiring custom ML models.

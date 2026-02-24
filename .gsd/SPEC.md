# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
A seamless web application leveraging React and Node.js that enables users to authenticate via secure biometric Face ID (using WebAuthn/Passkeys, similar to Apple ID). Users also have a traditional username and password fallback. Upon authentication, users are directed to a personalized dashboard featuring their wallet balance and transaction history.

## Goals
1. Implement a complete authentication flow (sign-up and sign-in) utilizing Face ID/biometrics with WebAuthn.
2. Provide a reliable and secure fallback mechanism using username and password.
3. Develop a secure user dashboard displaying wallet balance and detailed transaction history.
4. Establish a robust React front-end and Node.js back-end architecture.

## Non-Goals (Out of Scope)
- Actual financial transactions or payment gateway integrations (data is simulated for demonstration).
- A custom machine-learning-based face recognition model (we will use device-native biometrics via standard WebAuthn guidelines).

## Users
Individuals requiring secure, frictionless access to their digital wallet using modern biometric authentication on supporting devices.

## Constraints
- Must rely on Web API standards (WebAuthn/Passkey) to access native device biometrics safely.
- Requires HTTPS (Secure Context) for WebAuthn APIs to function properly.

## Success Criteria
- [ ] Users can successfully register an account providing Name, Username, Password, and set up a Passkey (Face ID/Touch ID).
- [ ] Users can log in seamlessly using their registered biometrics.
- [ ] Users can fall back to logging in with Username and Password if biometrics are unavailable or fail.
- [ ] Upon successful login, users view a dashboard showing their current wallet balance and transaction history.

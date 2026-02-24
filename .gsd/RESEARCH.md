# RESEARCH.md

## WebAuthn Passkeys Integration: React + Node.js

Passkeys offer a secure, passwordless authentication method utilizing public-key cryptography and device-native biometrics (Face ID/Touch ID). For this project, we will use the `@simplewebauthn` library, which provides comprehensive solutions for both the server (Node.js) and the client (React).

### Core Components
- **`@simplewebauthn/server`**: Node.js library for handling the Relying Party (RP) logic, generating challenges, and verifying credentials.
- **`@simplewebauthn/browser`**: JavaScript library for the React frontend to interact with the browser's WebAuthn APIs (`navigator.credentials.create` and `navigator.credentials.get`).

### Database Schema Requirements
To support WebAuthn, our database (e.g., PostgreSQL, SQLite, or MongoDB) must store:
1.  **User Table**: `id`, `username`, `name`, `password_hash` (for fallback).
2.  **Passkey/Credentials Table**:
    - `credentialID` (Base64URL encoded string or binary buffer).
    - `publicKey` (Binary data).
    - `counter` (Integer, for replay protection).
    - `transports` (Array of strings, e.g., `['internal']`).
    - Foreign key linking to the `User`.

*Note: We also need a mechanism (like a session store or a temporary database column/Redis) to temporarily hold the `currentChallenge` during the registration and authentication flows.*

---

### Registration Flow (Sign-up)

1.  **Initiation (Client -> Server)**: The user provides their `username`, `name`, and `password`. The React app sends this to the Node.js server.
2.  **Generate Options (Server)**:
    - The server uses `generateRegistrationOptions` to create the configuration for the browser.
    - Important parameters: `rpName`, `rpID` (domain), `userID`, `userName`, and a freshly generated `challenge`.
    - The server saves the user in the database and temporarily stores the `challenge` associated with the user's session.
    - The options are returned to the client.
3.  **Browser Prompt (Client)**:
    - The React app uses `startRegistration(options)` from `@simplewebauthn/browser`.
    - This triggers the native OS prompt (e.g., Face ID).
    - The browser generates a new key pair, storing the private key securely on the device and returning the public credential to the React app.
4.  **Verification (Client -> Server)**:
    - The React app sends the registration response to the server.
    - The server retrieves the stored `challenge` and uses `verifyRegistrationResponse`.
    - If valid, the server extracts the `credentialID` and `publicKey`, saving them to the database linked to the user.

---

### Authentication Flow (Sign-in)

1.  **Initiation (Client -> Server)**: The user inputs their `username` and clicks "Login with Face ID". The React app requests login options from the server.
2.  **Generate Options (Server)**:
    - The server fetches the user checking if they exist.
    - Uses `generateAuthenticationOptions` to create the configuration.
    - Important parameters: `rpID`, a list of the user's registered `allowCredentials` (fetched from the database), and a new `challenge`.
    - The server temporarily stores the `challenge`.
    - Options are returned to the client.
3.  **Browser Prompt (Client)**:
    - The React app uses `startAuthentication(options)` from `@simplewebauthn/browser`.
    - This triggers the OS prompt for Face ID. The authenticator signs the challenge with the private key.
    - The signed assertion is returned to the React app.
4.  **Verification (Client -> Server)**:
    - The React app sends the assertion to the server.
    - The server retrieves the stored `challenge` and the specific user's stored `publicKey` matching the used `credentialID`.
    - Uses `verifyAuthenticationResponse` to validate the signature and the challenge.
    - If valid, the user is authenticated, and a JWT or session cookie is issued for access to the dashboard.

### Fallback Mechanism
If WebAuthn is unsupported or the user clicks "Cancel" on the native prompt, the React app will display the standard password input field. The backend will perform a traditional bcrypt verification on the `password_hash` provided during step 1 of registration.

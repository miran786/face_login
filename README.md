<p align="center">
  <h1 align="center">🔐 Face ID Transaction Website</h1>
  <p align="center">
    A modern, secure biometric authentication and digital wallet system powered by DeepFace AI
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.128-009688?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/DeepFace-AI-FF6F61" />
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧬 **Face ID Authentication** | AI-powered biometric login using DeepFace (VGG-Face model) |
| 🔑 **Two-Factor Auth (2FA)** | Email OTP verification after every login for extra security |
| 📝 **Unified Registration** | Register face biometrics and password simultaneously |
| 🔓 **Password Fallback** | Alternative login when Face ID is unavailable |
| 💸 **Send & Receive Money** | Peer-to-peer transactions with real-time balance updates |
| 📊 **Interactive Dashboard** | View logins, flagged attempts, balance, and session details |
| 📧 **Email Notifications** | Transaction alerts and OTP codes via EmailJS |
| 🔒 **AES-256 Encryption** | Face descriptors encrypted with AES-GCM before storage |
| 📱 **Responsive Design** | Optimized for mobile and desktop with Framer Motion animations |

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Frontend (React + Vite)"]
        UI["UI Components<br/>Shadcn/Radix UI"]
        Pages["Feature Components<br/>13 Pages"]
        Services["Services Layer"]
        LocalDB["Dexie.js<br/>IndexedDB"]
    end

    subgraph Backend["⚙️ Backend (FastAPI)"]
        API["FastAPI Server<br/>Port 8000"]
        DeepFace["DeepFace Engine<br/>VGG-Face Model"]
        FaceDB["Face Database<br/>face_db/"]
    end

    subgraph External["☁️ External Services"]
        EmailJS["EmailJS API<br/>OTP & Notifications"]
        CDN["face-api.js Models<br/>CDN"]
    end

    subgraph Infra["🐳 Infrastructure"]
        Docker["Docker Container<br/>Python 3.11-slim"]
    end

    UI --> Pages
    Pages --> Services
    Services -->|"HTTP POST<br/>JSON (Base64)"| API
    Services -->|"Email API"| EmailJS
    Services -->|"Load Models"| CDN
    Services --> LocalDB
    API --> DeepFace
    DeepFace --> FaceDB
    API -.->|"Runs inside"| Docker
```

---

## 📊 Data Flow Diagrams

### DFD Level 0 — Context Diagram

```mermaid
graph LR
    User((👤 User)) -->|"Face Image<br/>Credentials<br/>Transactions"| System["🔐 Face ID<br/>Transaction System"]
    System -->|"Auth Result<br/>Dashboard Data<br/>Email Alerts"| User
    System -->|"OTP Emails<br/>Tx Notifications"| Email["📧 Email Service"]
    Email -->|"Delivery Status"| System
```

### DFD Level 1 — Major Processes

```mermaid
graph TB
    User((👤 User))

    User -->|"Face Image"| P1["1.0<br/>Face<br/>Registration"]
    User -->|"Face Image"| P2["2.0<br/>Face<br/>Authentication"]
    User -->|"Email + Password"| P3["3.0<br/>Password<br/>Authentication"]
    User -->|"OTP Code"| P4["4.0<br/>2FA<br/>Verification"]
    User -->|"Amount + Recipient"| P5["5.0<br/>Transaction<br/>Processing"]

    P1 -->|"Store Face"| DS1[("Face DB<br/>(Server)")]
    P1 -->|"Store User"| DS2[("Dexie DB<br/>(Browser)")]
    P2 -->|"Match Face"| DS1
    P2 -->|"Lookup User"| DS2
    P3 -->|"Verify Password"| DS2
    P4 -->|"Send OTP"| ES["📧 EmailJS"]
    P5 -->|"Update Balance"| DS2
    P5 -->|"Log Transaction"| DS2
    P5 -->|"Send Alert"| ES

    P2 -->|"Trigger OTP"| P4
    P3 -->|"Trigger OTP"| P4
    P4 -->|"Grant Access"| P5
```

### DFD Level 2 — Face Authentication Detail

```mermaid
graph TB
    User((👤 User))

    User -->|"Camera Feed"| P2_1["2.1<br/>Capture<br/>Video Frame"]
    P2_1 -->|"JPEG Blob"| P2_2["2.2<br/>Convert to<br/>Base64"]
    P2_2 -->|"Base64 String"| P2_3["2.3<br/>Send to<br/>Backend API"]
    P2_3 -->|"POST /verify"| P2_4["2.4<br/>DeepFace<br/>Find Match"]
    P2_4 -->|"Read Faces"| DS1[("face_db/")]
    P2_4 -->|"Email Match"| P2_5["2.5<br/>Lookup User<br/>in Dexie"]
    P2_5 -->|"Query"| DS2[("Dexie DB")]
    P2_5 -->|"User Object"| P2_6["2.6<br/>Trigger<br/>2FA OTP"]
    P2_6 -->|"Send OTP"| ES["📧 EmailJS"]
    P2_6 -->|"Auth Success"| User
```

---

## 🔄 Application Flow

### User Registration Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as Backend API
    participant DB as face_db/
    participant Dexie as Browser DB

    User->>UI: Choose Registration Method
    alt Face ID Registration
        UI->>UI: Open Camera
        UI->>UI: Detect Face (face-api.js)
        UI->>UI: Capture Face Image
        User->>UI: Enter Name, Email, Password
        UI->>API: POST /register {image, email}
        API->>DB: Save face to face_db/{email}/face.jpg
        API->>API: Clear VGG-Face cache (.pkl)
        API-->>UI: {status: "success"}
        UI->>Dexie: Store user (name, email, encrypted face, password)
    else Traditional Registration
        User->>UI: Enter Name, Email, Phone, Password
        UI->>Dexie: Store user record
    end
    UI-->>User: Redirect to Dashboard
```

### Login & 2FA Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as Backend API
    participant DB as face_db/
    participant Email as EmailJS

    User->>UI: Start Face Login
    UI->>UI: Open Camera & Detect Face
    UI->>API: POST /verify {image: base64}
    API->>API: DeepFace.find(img, db, VGG-Face, cosine)
    API->>DB: Search face_db/ for match
    alt Match Found (distance < threshold)
        API-->>UI: {status: "success", user: email, distance}
        UI->>UI: Generate 6-digit OTP
        UI->>Email: Send OTP to user email
        Email-->>User: 📧 OTP Email
        User->>UI: Enter OTP
        UI->>UI: Verify OTP match
        UI-->>User: ✅ Login Success → Dashboard
    else No Match
        API-->>UI: {status: "failed"}
        UI-->>User: ❌ Face not recognized
    end
```

### Transaction Flow

```mermaid
sequenceDiagram
    actor Sender
    participant UI as Dashboard
    participant Dexie as Browser DB
    participant Email as EmailJS

    Sender->>UI: Click "Send Money"
    UI->>Dexie: Fetch all registered users
    Sender->>UI: Select recipient + enter amount
    UI->>Dexie: Check sender balance
    alt Sufficient Balance
        UI->>Dexie: Debit sender balance
        UI->>Dexie: Credit recipient balance
        UI->>Dexie: Log transaction (sender side)
        UI->>Dexie: Log transaction (recipient side)
        UI->>Email: Send notification to recipient
        UI-->>Sender: ✅ Transaction Complete
    else Insufficient Balance
        UI-->>Sender: ❌ Insufficient funds
    end
```

---

## 🗄️ Database Schema

### Backend — Face Database (File System)

```
face_db/
├── user1@email.com/
│   └── face.jpg
├── user2@email.com/
│   └── face.jpg
└── representations_vgg_face.pkl   ← Auto-generated cache
```

### Frontend — Dexie (IndexedDB) Schema

```mermaid
erDiagram
    USERS {
        int id PK "Auto-increment"
        string fullName
        string email UK
        string phone
        string password "Hashed"
        string faceData "AES-256 Encrypted"
        float balance "Default: 1000"
        string avatar "Base64 Image"
    }

    TRANSACTIONS {
        int id PK "Auto-increment"
        string type "sent | received"
        float amount
        string recipient "Display name"
        string recipientEmail
        string senderEmail
        string date "ISO string"
        string status "completed | pending"
    }

    USERS ||--o{ TRANSACTIONS : "sends/receives"
```

---

## 🔒 Security Architecture

```mermaid
graph LR
    subgraph Encryption["🔐 Security Layers"]
        A["Face Descriptor<br/>(Float32Array)"] -->|"AES-GCM 256-bit"| B["Encrypted String<br/>(Base64)"]
        B -->|"Stored in"| C["IndexedDB"]
        D["Crypto Key"] -->|"JWK Format"| E["localStorage"]
    end

    subgraph TwoFactor["🔑 2FA Flow"]
        F["Login Success"] --> G["Generate 6-digit OTP"]
        G --> H["Send via EmailJS"]
        H --> I["User enters OTP"]
        I -->|"Match?"| J{"Verify"}
        J -->|"✅"| K["Grant Access"]
        J -->|"❌"| L["Reject"]
    end

    subgraph Backend["⚙️ Backend Security"]
        M["CORS: Allow All Origins (Dev)"]
        N["Face matching: Cosine Distance"]
        O["enforce_detection: False"]
    end
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| [React 18.3](https://react.dev/) | UI Framework |
| [Vite 6.3](https://vitejs.dev/) | Build tool & dev server |
| [TailwindCSS 4.1](https://tailwindcss.com/) | Utility-first CSS |
| [Framer Motion](https://www.framer.com/motion/) | Animations & transitions |
| [Shadcn UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) | 48 accessible UI components |
| [Lucide React](https://lucide.dev/) | Icon library |
| [Dexie.js](https://dexie.org/) | IndexedDB wrapper (client-side DB) |
| [face-api.js](https://github.com/justadudewhohacks/face-api.js) | Browser face detection |
| [EmailJS](https://www.emailjs.com/) | Email OTP & notifications |
| Web Crypto API | AES-GCM encryption |

### Backend
| Technology | Purpose |
|-----------|---------|
| [FastAPI](https://fastapi.tiangolo.com/) | Python web framework |
| [Uvicorn](https://www.uvicorn.org/) | ASGI server |
| [DeepFace](https://github.com/serengil/deepface) | Face recognition (VGG-Face) |
| [OpenCV](https://opencv.org/) | Image processing |
| [TensorFlow](https://www.tensorflow.org/) | ML backend for DeepFace |
| [Docker](https://www.docker.com/) | Containerization |

---

## 📁 Project Structure

```
face_login/
├── index.html                    # Entry point
├── vite.config.ts                # Vite config (React + Tailwind)
├── package.json                  # Frontend dependencies
├── tsconfig.json                 # TypeScript config
├── postcss.config.mjs            # PostCSS config
│
├── src/
│   ├── main.tsx                  # React root render
│   ├── db.ts                     # Dexie database (Users + Transactions)
│   │
│   ├── services/
│   │   ├── faceService.ts        # Face detection + backend API calls
│   │   ├── emailService.ts       # EmailJS OTP & notifications
│   │   └── encryptionService.ts  # AES-GCM encryption for face data
│   │
│   ├── app/
│   │   ├── App.tsx               # Main app (state machine, 9 states)
│   │   └── components/
│   │       ├── FaceAuth.tsx           # Face ID login screen
│   │       ├── FaceRegistration.tsx   # Face capture for registration
│   │       ├── FaceRegistrationInfo.tsx # User info after face capture
│   │       ├── PasswordLogin.tsx      # Email + password login
│   │       ├── ForgotPassword.tsx     # Password reset flow
│   │       ├── OTPVerification.tsx    # 2FA OTP input screen
│   │       ├── RegistrationStart.tsx  # Choose registration method
│   │       ├── TraditionalRegistration.tsx # Non-face registration
│   │       ├── Registration.tsx       # Base registration types
│   │       ├── Dashboard.tsx          # Main dashboard
│   │       ├── SendMoney.tsx          # Send money flow
│   │       ├── ReceiveMoney.tsx       # Receive / QR display
│   │       ├── TransactionHistory.tsx # Transaction list
│   │       └── ui/                    # 48 Shadcn UI components
│   │
│   └── styles/
│       ├── index.css             # Root styles
│       ├── tailwind.css          # Tailwind imports
│       ├── theme.css             # Custom theme tokens
│       └── fonts.css             # Font configuration
│
├── backend/
│   ├── main.py                   # FastAPI server (/verify, /register)
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Backend container
│   ├── docker-compose.yml        # Backend-only Docker setup
│   ├── .dockerignore             # Excludes venv, cache
│   └── face_db/                  # Stored face images per user
│
├── start.bat                     # ⚡ One-click start (Windows)
├── start.sh                      # ⚡ One-click start (macOS/Linux)
├── Dockerfile                    # Frontend container
├── docker-compose.yml            # Full-stack Docker setup
├── .dockerignore                 # Root Docker ignore
├── docs/                         # Documentation
└── public/                       # Static assets
```

---

## 🚀 Quick Start

### Option 1: One-Click Script ⚡ (Easiest)

> **Requires:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) + [Node.js](https://nodejs.org/) v16+

**Windows** — Double-click `start.bat`

**macOS / Linux:**
```bash
chmod +x start.sh
./start.sh
```

That's it! The script automatically starts the backend (Docker) and frontend (npm).

---

### Option 2: Full Docker 🐳 (Zero Setup)

> **Requires:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) only — no Node.js or Python needed!

```bash
git clone https://github.com/miran786/face_login.git
cd face_login
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |

To stop: `Ctrl+C` or `docker compose down`

---

### Option 3: Manual Setup 🔧

#### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate         # Windows
# source venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
python main.py
```

> ⚠️ Requires **Python 3.10 or 3.11** (TensorFlow doesn't support 3.12+)

#### Frontend
```bash
# From root directory
npm install
npm run dev
```

---

## 🔌 API Endpoints

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `GET` | `/` | — | `{"status": "Face Recognition Server Running"}` |
| `POST` | `/verify` | `{"image": "<base64>"}` | `{"status": "success", "user": "email", "distance": 0.23}` |
| `POST` | `/register` | `{"image": "<base64>", "email": "user@mail.com"}` | `{"status": "success", "message": "User registered"}` |

---

## ⚙️ Configuration

| Variable | Location | Default | Description |
|----------|----------|---------|-------------|
| Backend URL | `src/services/faceService.ts` | `http://localhost:8000` | Change for cross-machine setup |
| EmailJS Service ID | `src/services/emailService.ts` | `service_du1h5i1` | Your EmailJS service |
| EmailJS Template ID | `src/services/emailService.ts` | `template_wg2bduq` | Your email template |
| EmailJS Public Key | `src/services/emailService.ts` | `5KrNj6cWERlaQuo5Z` | Your EmailJS public key |
| Face Model | `backend/main.py` | `VGG-Face` | DeepFace model (VGG-Face, Facenet, etc.) |
| Distance Metric | `backend/main.py` | `cosine` | Similarity metric |

---

## 📜 Attribution

Original design concept: [Figma](https://www.figma.com/design/ywfTlEqG9EdJ286MjBLA8x/Face-ID-Transaction-Website)
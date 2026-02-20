# Face ID Transaction Website

A modern, secure, and interactive web application demonstrating Face ID authentication and registration flows. This project serves as a frontend implementation of a biometric authentication system, featuring a sleek UI compliant with modern design standards.

## Features

-   **Secure Face ID**: Powered by a Python backend (DeepFace) for high-accuracy, professional-grade biometric authentication.
-   **Two-Factor Authentication (2FA)**: Adds an extra layer of security with Email OTP verification after every login.
-   **Unified Registration**: Register face and password simultaneously for a seamless onboarding experience.
-   **Password Fallback**: A reliable alternative login method if Face ID fails or is unavailable.
-   **Interactive Dashboard**: A user dashboard displaying successful logins, flagged attempts, and session details.
-   **Real-time Notifications**: Transaction alerts sent directly to your email.
-   **Modern UI/UX**: Built with a focus on aesthetics using TailwindCSS, Framer Motion, and Radix UI.
-   **Responsive Design**: Fully responsive layout optimized for mobile and desktop.

## Tech Stack

-   **Frontend Framework**: [React](https://react.dev/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [TailwindCSS](https://tailwindcss.com/)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v16 or higher recommended)
-   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd face_login
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

### Building for Production

To build the application for production:

npm run build
```

## Face Recognition Backend (Python)

This project uses a Python backend for secure and accurate face recognition via **DeepFace**.

### Option 1: Docker (Recommended)

The easiest way to run the backend — no Python version conflicts, works on any machine.

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
cd backend
docker compose up --build
```

The server will start at `http://localhost:8000`. Registered face data is persisted in the `face_db/` volume.

To stop: `Ctrl+C` or `docker compose down`

### Option 2: Manual Setup

**Prerequisites:** Python 3.10 or 3.11, pip

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment and install dependencies:
    ```bash
    python -m venv venv
    venv\Scripts\activate        # Windows
    # source venv/bin/activate   # macOS/Linux
    pip install -r requirements.txt
    ```
3.  Start the server:
    ```bash
    python main.py
    ```

The server will run at `http://localhost:8000`. This must be running for Face ID login and registration to work.

### Frontend
In a separate terminal, run the React app:
```bash
npm run dev
```

## Project Structure

-   `src/app`: Contains the main application logic.
    -   `components`: Reusable UI components and specific feature components (FaceRegistration, Dashboard, etc.).
    -   `ui`: Basic UI building blocks (buttons, inputs, etc.).
    -   `App.tsx`: The main entry point managing user state and navigation flows.

## Attribution

The original design concept is available on [Figma](https://www.figma.com/design/ywfTlEqG9EdJ286MjBLA8x/Face-ID-Transaction-Website).
# Face ID Transaction Website

A modern, secure, and interactive web application demonstrating Face ID authentication and registration flows. This project serves as a frontend implementation of a biometric authentication system, featuring a sleek UI compliant with modern design standards.

## Features

-   **Face ID Registration**: A simulated, interactive face scanning experience with real-time visual feedback and 3D face mesh visualization.
-   **Traditional Registration**: a fallback registration flow for users who prefer standard methods.
-   **Interactive Dashboard**: A user dashboard displaying successful logins, flagged attempts, and session details (mock data).
-   **Modern UI/UX**: Built with a focus on aesthetics using TailwindCSS, Framer Motion for animations, and Radix UI for accessible components.
-   **Responsive Design**: Fully responsive layout optimized for both desktop and mobile devices.

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

```bash
npm run build
```

## Project Structure

-   `src/app`: Contains the main application logic.
    -   `components`: Reusable UI components and specific feature components (FaceRegistration, Dashboard, etc.).
    -   `ui`: Basic UI building blocks (buttons, inputs, etc.).
    -   `App.tsx`: The main entry point managing user state and navigation flows.

## Attribution

The original design concept is available on [Figma](https://www.figma.com/design/ywfTlEqG9EdJ286MjBLA8x/Face-ID-Transaction-Website).
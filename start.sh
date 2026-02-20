#!/bin/bash

echo ""
echo "  ============================================"
echo "   Face ID Transaction Website - Quick Start"
echo "  ============================================"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "  [!] Docker not found. Install Docker Desktop:"
    echo "      https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "  [!] Node.js not found. Install Node.js:"
    echo "      https://nodejs.org/"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "  [1/4] Starting Backend (Docker)..."
cd "$SCRIPT_DIR/backend"
docker compose up --build &
BACKEND_PID=$!

echo "  [2/4] Waiting for backend to initialize..."
sleep 5

echo "  [3/4] Installing frontend dependencies..."
cd "$SCRIPT_DIR"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "        Already installed, skipping..."
fi

echo ""
echo "  [4/4] Starting Frontend..."
echo ""
echo "  ============================================"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo "  ============================================"
echo ""
echo "  Press Ctrl+C to stop everything."
echo ""

# Trap Ctrl+C to stop backend too
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID 2>/dev/null; docker compose -f backend/docker-compose.yml down; exit" INT TERM

npm run dev

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null
docker compose -f "$SCRIPT_DIR/backend/docker-compose.yml" down

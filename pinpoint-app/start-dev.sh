#!/bin/bash
# Fast local dev startup - no Docker builds for frontend/backend

echo "🚀 Starting Pinpoint dev environment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Postgres is running
if ! docker ps | grep -q "pinpoint-db-dev"; then
    echo -e "${BLUE}Starting Postgres in Docker...${NC}"
    docker-compose -f docker-compose.dev.yml up -d db
    
    # Wait for Postgres
    echo "⏳ Waiting for Postgres..."
    sleep 3
    until docker exec pinpoint-db-dev pg_isready -U pinpoint -d pinpoint_dev > /dev/null 2>&1; do
        echo "  Still waiting for Postgres..."
        sleep 2
    done
    echo -e "${GREEN}✓ Postgres ready${NC}"
else
    echo -e "${GREEN}✓ Postgres already running${NC}"
fi

# Create .env for backend if needed
if [ ! -f "backend/.env" ]; then
    echo -e "${BLUE}Creating backend .env...${NC}"
    cat > backend/.env << EOF
DATABASE_URL=postgresql://pinpoint:devpassword@localhost:5432/pinpoint_dev
JWT_SECRET=dev-secret-key-change-in-production
NODE_ENV=development
PORT=3001
EOF
    echo -e "${GREEN}✓ Backend .env created${NC}"
fi

# Start backend in background
echo -e "${BLUE}Starting backend (npm run dev)...${NC}"
cd backend && npm install > /dev/null 2>&1 && npm run dev &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend starting on http://localhost:3001${NC}"

# Wait a moment for backend to init
sleep 2

# Start frontend
echo -e "${BLUE}Starting frontend (npm run dev)...${NC}"
cd ../ && npm install > /dev/null 2>&1 && npm run dev -- --host &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend starting on http://localhost:5173${NC}"

echo ""
echo -e "${GREEN}🎉 Dev servers running!${NC}"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:3001"
echo "  Postgres:  localhost:5432"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Trap Ctrl+C to kill background processes
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Wait
wait

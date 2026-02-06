#!/bin/bash
echo "🛑 Stopping dev servers..."

# Kill Node processes for this project
pkill -f "vite" 2>/dev/null
pkill -f "tsx watch" 2>/dev/null
pkill -f "ts-node-dev" 2>/dev/null

# Stop Docker containers
docker-compose -f docker-compose.dev.yml down

echo "✓ All stopped"

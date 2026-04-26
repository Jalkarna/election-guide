#!/bin/bash
set -e

echo "=== ElectionGuide startup ==="

# Start FastAPI backend
cd /app/backend
echo "Starting FastAPI backend on :8001"
DATABASE_URL="${DATABASE_URL:-sqlite+aiosqlite:////data/election_guide.db}" \
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1 &

# Start Next.js frontend
echo "Starting Next.js frontend on :3000"
cd /app/frontend/standalone
PORT=3000 HOSTNAME=0.0.0.0 node server.js &

# Wait for FastAPI to be ready (up to 30s)
echo "Waiting for FastAPI to be ready..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:8001/api/health > /dev/null 2>&1; then
        echo "FastAPI ready after ${i}s"
        break
    fi
    sleep 1
done

# Start nginx
echo "Starting nginx on :${PORT:-8080}"
nginx -g "daemon off;"

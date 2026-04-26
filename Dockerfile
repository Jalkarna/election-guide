# ──────────────────────────────────────────────
# Stage 1: Build Next.js frontend
# ──────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/ ./
ENV NEXT_PUBLIC_BACKEND_URL=""
RUN npm run build

# ──────────────────────────────────────────────
# Stage 2: Python backend deps
# ──────────────────────────────────────────────
FROM python:3.12-slim AS backend-builder

WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# ──────────────────────────────────────────────
# Final stage: Runtime
# ──────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Install Node.js and nginx
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    nodejs \
    npm \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python packages from builder
COPY --from=backend-builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=backend-builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn

# Frontend standalone build
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend/standalone
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/standalone/.next/static
COPY --from=frontend-builder /app/frontend/public /app/frontend/standalone/public

# Backend source
COPY backend/ /app/backend/

# Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Data dir for SQLite
RUN mkdir -p /data && chmod 777 /data

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080
ENV DATABASE_URL=sqlite+aiosqlite:////data/election_guide.db
ENV NEXT_PUBLIC_BACKEND_URL=""

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]

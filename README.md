# ElectionGuide

ElectionGuide is a full-stack AI assistant for Indian election questions. It combines a Next.js chat interface with a FastAPI backend that streams Gemini responses, persists chat sessions in SQLite, and can use web/source-fetching tools for current election information.

The app is packaged as a single Docker image for local Docker Compose and Google Cloud Run. In production, nginx fronts both the Next.js standalone server and the FastAPI API server on one public port.

## Features

- AI chat experience focused on Indian elections, voting processes, eligibility, schedules, and civic information.
- Gemini response streaming with reasoning, tool-call events, source annotations, and fallback model handling.
- Session persistence with SQLite via SQLAlchemy async models.
- Multilingual response support and UI copy translation for Indian languages.
- Web search, page fetching, PDF text extraction, and Election Commission schedule lookup tools.
- Single-container production runtime with Next.js, FastAPI, and nginx.
- Cloud Run deployment through Cloud Build, Artifact Registry, Secret Manager, and a Cloud Storage mounted data volume.

## Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, Uvicorn, Pydantic, SQLAlchemy async |
| AI | Google Gemini via `google-genai` |
| Storage | SQLite locally or mounted at `/data` in Docker/Cloud Run |
| Runtime | Docker, nginx reverse proxy |
| Cloud | Google Cloud Build, Artifact Registry, Cloud Run, Secret Manager, Cloud Storage |

## Repository Layout

```text
.
|-- backend/
|   |-- main.py              # FastAPI app, streaming chat API, session routes
|   |-- config.py            # Environment-based settings
|   |-- database.py          # SQLAlchemy models and async session setup
|   |-- prompts.py           # ElectionGuide system prompt
|   |-- tools.py             # Search, URL/PDF fetch, election schedule tools
|   `-- requirements.txt     # Python dependencies
|-- frontend/
|   |-- src/app/             # Next.js app routes and global CSS
|   |-- src/components/      # Chat, thinking, citation, and UI components
|   |-- src/lib/             # API client, config, i18n helpers
|   `-- package.json         # Frontend scripts and dependencies
|-- Dockerfile               # Multi-stage production image
|-- docker-compose.yml       # Local single-container deployment
|-- docker-entrypoint.sh     # Starts FastAPI, Next.js, and nginx
|-- nginx.conf               # Routes /api to FastAPI and / to Next.js
|-- cloudbuild.yaml          # Cloud Build + Cloud Run deployment
`-- .env.example             # Required environment variables
```

## Environment Variables

Create `backend/.env` for local development:

```bash
cp .env.example backend/.env
```

Then set the values needed for your environment.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `GOOGLE_API_KEY` | Yes, unless using ADC | none | Gemini or Vertex Express API key. Used as the primary auth path when set. |
| `USE_VERTEX_AI` | No | `false` | Set to `true` to use Vertex AI Application Default Credentials instead of `GOOGLE_API_KEY`. |
| `GCP_PROJECT_ID` | Required for Vertex AI / Cloud Run | none | Google Cloud project ID. |
| `GCP_LOCATION` | No | `us-central1` | Vertex AI and Cloud Run region. |
| `DATABASE_URL` | No | `sqlite+aiosqlite:///./election_guide.db` | Async SQLAlchemy database URL. Docker uses `/data/election_guide.db`. |
| `GEMINI_MODEL` | No | `gemini-3-flash-preview` | Primary Gemini model. |
| `GEMINI_FALLBACK_MODEL` | No | `gemini-2.5-flash` | Fallback model for retryable model errors. |
| `NEXT_PUBLIC_BACKEND_URL` | No | same origin in browser | Frontend API base URL. Leave empty for the Docker/nginx deployment. |
| `PORT` | No | `8080` | Public container port used by nginx. |

Do not commit real secrets. In Cloud Run, `GOOGLE_API_KEY` is read from Secret Manager.

## Local Development

Run the backend and frontend as separate processes while developing.

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

Backend health check:

```bash
curl http://localhost:8001/api/health
```

### Frontend

In a separate shell:

```bash
cd frontend
npm install
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001 npm run dev
```

Open `http://localhost:3000`.

## Docker

Build and run the production container locally:

```bash
docker compose up --build
```

The app will be available at `http://localhost:8080`.

Docker Compose mounts `./data` to `/data`, so the SQLite database persists between container restarts.

## API Overview

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health, configured model candidates, Gemini transport, and grounding tool status. |
| `POST` | `/api/i18n/translate-ui` | Translate frontend UI copy for a supported language. |
| `POST` | `/api/chat/sessions` | Create a new chat session. |
| `GET` | `/api/chat/sessions` | List sessions by most recently updated. |
| `GET` | `/api/chat/sessions/{session_id}` | Read a session and its messages. |
| `DELETE` | `/api/chat/sessions/{session_id}` | Delete a session. |
| `POST` | `/api/chat/sessions/{session_id}/stream` | Stream an assistant response using the Vercel AI SDK data stream protocol. |
| `WS` | `/api/chat/sessions/{session_id}/ws` | WebSocket streaming alternative for chat responses. |

Example request flow:

```bash
SESSION_ID=$(curl -fsS -X POST http://localhost:8001/api/chat/sessions | jq -r .id)

curl -N \
  -H 'Content-Type: application/json' \
  -X POST "http://localhost:8001/api/chat/sessions/${SESSION_ID}/stream" \
  -d '{"message":"How do I check my voter registration status?","language":"English"}'
```

## Cloud Run Deployment

This repo includes a Cloud Build config that:

1. Builds the Docker image.
2. Pushes it to Artifact Registry.
3. Creates a Cloud Storage bucket for the SQLite data volume if needed.
4. Deploys Cloud Run service `election-guide`.
5. Mounts the bucket at `/data`.
6. Injects `GOOGLE_API_KEY` from Secret Manager.

Required Google Cloud resources:

- Artifact Registry repository: `election-guide` in `us-central1`.
- Secret Manager secret: `GOOGLE_API_KEY`.
- Enabled APIs: Cloud Build, Cloud Run, Artifact Registry, Secret Manager, and Cloud Storage.
- Cloud Build service account permissions to push images, deploy Cloud Run, read the secret, and manage/use the storage bucket.

Deploy:

```bash
gcloud builds submit --config cloudbuild.yaml --project=<PROJECT_ID> .
```

After deployment:

```bash
gcloud run services describe election-guide \
  --region=us-central1 \
  --project=<PROJECT_ID> \
  --format='value(status.url,status.latestReadyRevisionName)'
```

The most recent deployment from this workspace targeted project `new-bro-493718` and produced:

```text
https://election-guide-vqa72x3qma-uc.a.run.app
```

## Production Runtime

The production image starts three processes:

- FastAPI on `127.0.0.1:8001`.
- Next.js standalone server on `127.0.0.1:3000`.
- nginx on `${PORT:-8080}`.

nginx routes:

- `/api/*` to FastAPI with buffering disabled for streaming.
- `/` and all frontend routes to Next.js.

## Useful Commands

```bash
# Frontend quality check
cd frontend && npm run lint

# Frontend production build
cd frontend && npm run build

# Backend health check
curl http://localhost:8001/api/health

# Container health check
curl http://localhost:8080/api/health

# Cloud Run logs
gcloud run services logs read election-guide --region=us-central1 --project=<PROJECT_ID>
```

## Notes

- `backend/.env` is the local environment file read by the backend settings loader.
- `NEXT_PUBLIC_BACKEND_URL` should be empty for the single-container Docker/Cloud Run setup because nginx serves frontend and API from the same origin.
- The assistant grounds answers with built-in search, URL fetching, PDF extraction, and election schedule lookup tools.
- The chat stream uses the Vercel AI SDK data stream protocol and includes text deltas, reasoning deltas, tool call events, source annotations, and finish messages.

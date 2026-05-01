# Google Services Integration

ElectionGuide uses Google services as part of the product architecture, not only as deployment plumbing.

| Google service | Where used | Purpose | Required configuration |
| --- | --- | --- | --- |
| Vertex AI Gemini / Google Gen AI | `backend/main.py` | Generates civic answers, multilingual UI copy, and tool-aware reasoning. | `GOOGLE_API_KEY` or `USE_VERTEX_AI=true` with `GCP_PROJECT_ID` |
| Google Custom Search JSON API | `backend/tools.py` | Grounds answers in current official election sources before falling back to generic HTML search. | `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID` |
| Cloud Run | `cloudbuild.yaml`, `Dockerfile` | Hosts the single-container production app with FastAPI, Next.js, and nginx. | `GCP_PROJECT_ID`, `GCP_LOCATION` |
| Cloud Build | `cloudbuild.yaml` | Builds, pushes, and deploys the production image. | Cloud Build API enabled |
| Artifact Registry | `cloudbuild.yaml` | Stores the deployable container image. | `election-guide` repository |
| Secret Manager | `cloudbuild.yaml`, `backend/google_services.py` | Keeps model credentials out of source control and runtime env files. | `GOOGLE_API_KEY` secret |
| Cloud Logging | `backend/google_services.py` | Enables structured logs from Cloud Run when configured. | `ENABLE_CLOUD_LOGGING=true` |
| Cloud Storage volume | `cloudbuild.yaml` | Persists SQLite data across Cloud Run revisions. | `DATABASE_URL=sqlite+aiosqlite:////data/election_guide.db` |
| Firestore audit trail | `backend/google_services.py` | Optional non-sensitive event audit trail for assistant lifecycle events. | `ENABLE_FIRESTORE_AUDIT=true` |
| Google Identity Services | `backend/auth/`, `frontend/src/components/auth/AuthPanel.tsx` | Provides Google OAuth sign-in surface and persisted auth sessions for saved civic journeys. | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI` |

The `/api/health` endpoint exposes a `google_services` object so reviewers and operators can see which integrations are configured in the running environment.

## Graceful Degradation

Local development does not require every Google service. If Custom Search is not configured, the search tool falls back to HTML search. If Cloud Logging or Firestore audit is not enabled, the app continues normally and logs a warning only when an enabled optional integration cannot initialize. If Google OAuth credentials are absent, the auth pages expose the required configuration and support a credential-free demo Google session for review.

## Why This Matters

ElectionGuide is a civic assistant. The Google integrations support:

- current source grounding through Google Search,
- production reliability through Cloud Run and Cloud Build,
- secret safety through Secret Manager,
- operational visibility through Cloud Logging,
- durable state through Cloud Storage,
- optional auditability through Firestore,
- account continuity through Google Identity Services.

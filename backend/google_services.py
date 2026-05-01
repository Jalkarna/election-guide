"""
Google Cloud integration registry for ElectionGuide.

The app is designed to run locally without Google Cloud credentials, while
activating richer Google services automatically in Cloud Run when environment
variables and service-account permissions are present.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from config import Settings, settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class GoogleServiceStatus:
    name: str
    purpose: str
    configured: bool
    required_env: tuple[str, ...]

    def as_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "purpose": self.purpose,
            "configured": self.configured,
            "required_env": list(self.required_env),
        }


def google_service_statuses(active_settings: Settings = settings) -> list[GoogleServiceStatus]:
    return [
        GoogleServiceStatus(
            name="Vertex AI Gemini",
            purpose="Generates grounded civic answers and UI translations.",
            configured=bool(active_settings.google_api_key or active_settings.use_vertex_ai),
            required_env=("GOOGLE_API_KEY", "USE_VERTEX_AI", "GCP_PROJECT_ID"),
        ),
        GoogleServiceStatus(
            name="Google Custom Search JSON API",
            purpose="Grounds election answers in current official web sources.",
            configured=active_settings.google_search_configured,
            required_env=("GOOGLE_SEARCH_API_KEY", "GOOGLE_SEARCH_ENGINE_ID"),
        ),
        GoogleServiceStatus(
            name="Cloud Run",
            purpose="Runs the production container behind a managed HTTPS service.",
            configured=bool(active_settings.gcp_project_id),
            required_env=("GCP_PROJECT_ID", "GCP_LOCATION"),
        ),
        GoogleServiceStatus(
            name="Secret Manager",
            purpose="Supplies Gemini credentials without committing secrets.",
            configured=bool(active_settings.google_secret_name),
            required_env=("GOOGLE_SECRET_NAME",),
        ),
        GoogleServiceStatus(
            name="Cloud Logging",
            purpose="Emits structured application logs from Cloud Run.",
            configured=active_settings.enable_cloud_logging,
            required_env=("ENABLE_CLOUD_LOGGING", "GCP_PROJECT_ID"),
        ),
        GoogleServiceStatus(
            name="Firestore Audit Trail",
            purpose="Optionally records non-sensitive assistant lifecycle events.",
            configured=active_settings.enable_firestore_audit,
            required_env=("ENABLE_FIRESTORE_AUDIT", "GCP_PROJECT_ID"),
        ),
        GoogleServiceStatus(
            name="Cloud Storage Volume",
            purpose="Persists the SQLite database across Cloud Run revisions.",
            configured=active_settings.database_url.startswith("sqlite+aiosqlite:////data/"),
            required_env=("DATABASE_URL",),
        ),
    ]


def google_services_health(active_settings: Settings = settings) -> dict[str, Any]:
    statuses = google_service_statuses(active_settings)
    configured = [status.name for status in statuses if status.configured]
    return {
        "configured_count": len(configured),
        "configured": configured,
        "services": [status.as_dict() for status in statuses],
    }


def configure_cloud_logging(active_settings: Settings = settings) -> bool:
    if not active_settings.enable_cloud_logging:
        return False

    try:
        import google.cloud.logging as cloud_logging

        client = cloud_logging.Client(project=active_settings.gcp_project_id)
        client.setup_logging()
        logger.info("Google Cloud Logging configured")
        return True
    except Exception as exc:
        logger.warning("Cloud Logging was requested but could not be configured: %s", exc)
        return False


def access_secret_version(secret_name: str, active_settings: Settings = settings) -> str:
    """
    Read a Secret Manager version.

    Accepts either a full resource name
    `projects/<project>/secrets/<secret>/versions/<version>` or a short secret
    id, in which case the active project and `latest` version are used.
    """
    if not secret_name:
        raise ValueError("secret_name is required")
    if not active_settings.gcp_project_id and not secret_name.startswith("projects/"):
        raise ValueError("GCP_PROJECT_ID is required for short Secret Manager names")

    resource_name = secret_name
    if not resource_name.startswith("projects/"):
        resource_name = (
            f"projects/{active_settings.gcp_project_id}/secrets/{secret_name}/versions/latest"
        )

    from google.cloud import secretmanager

    client = secretmanager.SecretManagerServiceClient()
    response = client.access_secret_version(request={"name": resource_name})
    return response.payload.data.decode("utf-8")


def write_firestore_audit_event(
    event_type: str,
    payload: dict[str, Any],
    active_settings: Settings = settings,
) -> bool:
    if not active_settings.enable_firestore_audit:
        return False

    try:
        from google.cloud import firestore

        client = firestore.Client(project=active_settings.gcp_project_id)
        collection = client.collection(active_settings.firestore_audit_collection)
        collection.add({
            "event_type": event_type,
            "payload": payload,
            "source": "electionguide",
            "schema_version": 1,
            "created_at": firestore.SERVER_TIMESTAMP,
        })
        return True
    except Exception as exc:
        logger.warning("Firestore audit write failed for %s: %s", event_type, exc)
        return False

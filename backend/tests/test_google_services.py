from config import Settings
from google_services import google_services_health, google_service_statuses


def test_google_services_health_counts_configured_services():
    settings = Settings(
        google_api_key="test-key",
        google_search_api_key="search-key",
        google_search_engine_id="search-engine",
        gcp_project_id="demo-project",
        database_url="sqlite+aiosqlite:////data/election_guide.db",
        enable_cloud_logging=True,
    )

    health = google_services_health(settings)

    assert health["configured_count"] >= 5
    assert "Vertex AI Gemini" in health["configured"]
    assert "Google Custom Search JSON API" in health["configured"]
    assert "Cloud Run" in health["configured"]
    assert "Cloud Storage Volume" in health["configured"]


def test_service_statuses_explain_required_environment():
    statuses = google_service_statuses(Settings())
    search_status = next(
        status for status in statuses if status.name == "Google Custom Search JSON API"
    )

    assert search_status.configured is False
    assert "GOOGLE_SEARCH_API_KEY" in search_status.required_env
    assert "GOOGLE_SEARCH_ENGINE_ID" in search_status.required_env

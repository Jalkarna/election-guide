from config import Settings


def test_model_candidates_are_deduplicated_and_ordered():
    settings = Settings(
        gemini_model="gemini-primary",
        gemini_fallback_model="gemini-primary",
    )

    assert settings.gemini_model_candidates == ["gemini-primary"]


def test_transport_prefers_api_key_over_adc():
    settings = Settings(
        google_api_key="test-key",
        use_vertex_ai=True,
        gcp_project_id="demo-project",
    )

    assert settings.gemini_transport == "vertex-express-api-key"


def test_google_search_requires_key_and_engine_id():
    missing_engine = Settings(google_search_api_key="key", google_search_engine_id=None)
    configured = Settings(google_search_api_key="key", google_search_engine_id="cx")

    assert missing_engine.google_search_configured is False
    assert configured.google_search_configured is True

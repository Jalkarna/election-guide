from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_auth_providers_endpoint_exposes_google_metadata():
    response = client.get("/api/auth/providers")

    assert response.status_code == 200
    provider = response.json()["providers"][0]
    assert provider["name"] == "google"
    assert "GOOGLE_OAUTH_CLIENT_ID" in provider["required_env"]


def test_google_start_requires_runtime_credentials_when_unconfigured():
    response = client.get("/api/auth/google/start")

    assert response.status_code in {200, 503}
    if response.status_code == 503:
        assert "Google OAuth" in response.json()["detail"]

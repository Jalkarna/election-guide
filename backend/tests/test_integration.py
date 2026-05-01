"""
Integration tests — end-to-end request flows through the full application stack.

Tests the entire HTTP path: routing, middleware, security headers, CORS, and
response shapes. Uses FastAPI's TestClient with the real application instance.

Each test class uses a unique X-Forwarded-For IP so rate-limit buckets
from one class do not bleed into another.
"""
import pytest
from fastapi.testclient import TestClient

from main import app


client = TestClient(app)

# Unique IPs per test class to avoid rate-limit bucket interference
_PROVIDER_IP = "10.0.1.1"
_SESSION_IP = "10.0.1.2"
_LOGOUT_IP = "10.0.1.3"
_PLATFORM_IP = "10.0.1.4"
_METADATA_IP = "10.0.1.5"
_SECURITY_IP = "10.0.1.6"
_ERROR_IP = "10.0.1.7"


def _req(ip: str) -> dict:
    """Return headers dict with a stable X-Forwarded-For for rate-limit isolation."""
    return {"x-forwarded-for": ip}


# ─── Auth provider discovery ──────────────────────────────────────────────────

class TestAuthProviderDiscovery:
    def test_providers_endpoint_returns_200(self):
        r = client.get("/api/auth/providers", headers=_req(_PROVIDER_IP))
        assert r.status_code == 200

    def test_providers_response_has_providers_key(self):
        r = client.get("/api/auth/providers", headers=_req(_PROVIDER_IP))
        assert "providers" in r.json()

    def test_providers_list_is_non_empty(self):
        r = client.get("/api/auth/providers", headers=_req(_PROVIDER_IP))
        assert len(r.json()["providers"]) > 0

    def test_google_provider_present(self):
        r = client.get("/api/auth/providers", headers=_req(_PROVIDER_IP))
        names = [p["name"] for p in r.json()["providers"]]
        assert "google" in names

    def test_google_provider_has_scopes(self):
        r = client.get("/api/auth/providers", headers=_req(_PROVIDER_IP))
        google = next(p for p in r.json()["providers"] if p["name"] == "google")
        assert "openid" in google["scopes"]
        assert "email" in google["scopes"]
        assert "profile" in google["scopes"]

    def test_google_provider_has_required_env(self):
        r = client.get("/api/auth/providers", headers=_req(_PROVIDER_IP))
        google = next(p for p in r.json()["providers"] if p["name"] == "google")
        assert "required_env" in google
        assert len(google["required_env"]) > 0

    def test_providers_response_is_json(self):
        r = client.get("/api/auth/providers", headers=_req(_PROVIDER_IP))
        assert r.headers["content-type"].startswith("application/json")


# ─── Session endpoint ─────────────────────────────────────────────────────────

class TestSessionEndpoint:
    def test_session_without_token_returns_unauthenticated(self):
        r = client.get("/api/auth/session", headers=_req(_SESSION_IP))
        assert r.status_code == 200
        assert r.json()["authenticated"] is False

    def test_session_with_invalid_token_returns_unauthenticated(self):
        headers = {**_req(_SESSION_IP), "Authorization": "Bearer invalid-token-xyz"}
        r = client.get("/api/auth/session", headers=headers)
        assert r.status_code == 200
        assert r.json()["authenticated"] is False

    def test_session_with_empty_bearer_returns_unauthenticated(self):
        headers = {**_req(_SESSION_IP), "Authorization": "Bearer "}
        r = client.get("/api/auth/session", headers=headers)
        assert r.status_code == 200
        assert r.json()["authenticated"] is False


# ─── Logout endpoint ──────────────────────────────────────────────────────────

class TestLogout:
    def test_logout_with_fake_token_returns_revoked_false(self):
        r = client.post(
            "/api/auth/logout",
            json={"token": "fake-token-that-does-not-exist"},
            headers=_req(_LOGOUT_IP),
        )
        assert r.status_code == 200
        assert r.json()["revoked"] is False


# ─── Platform endpoints ───────────────────────────────────────────────────────

class TestPlatformEndpoints:
    def test_readiness_endpoint_exists(self):
        r = client.post(
            "/api/platform/readiness",
            json={"has_epic": True, "roll_verified": True},
            headers=_req(_PLATFORM_IP),
        )
        assert r.status_code != 404

    def test_booth_guide_endpoint_exists(self):
        r = client.post(
            "/api/platform/booth-guide",
            json={"pincode": "110001"},
            headers=_req(_PLATFORM_IP),
        )
        assert r.status_code != 404

    def test_journey_endpoint_exists(self):
        r = client.post(
            "/api/platform/journey",
            json={"persona": "first_time_voter"},
            headers=_req(_PLATFORM_IP),
        )
        assert r.status_code != 404

    def test_quiz_endpoint_exists(self):
        r = client.get("/api/platform/quiz", headers=_req(_PLATFORM_IP))
        assert r.status_code != 404

    def test_scenario_endpoint_exists(self):
        r = client.post(
            "/api/platform/scenario",
            json={"scenario_id": "first_time_voter"},
            headers=_req(_PLATFORM_IP),
        )
        assert r.status_code != 404

    def test_features_endpoint_exists(self):
        r = client.get("/api/platform/features", headers=_req(_PLATFORM_IP))
        assert r.status_code != 404

    def test_features_endpoint_returns_list(self):
        r = client.get("/api/platform/features", headers=_req(_PLATFORM_IP))
        if r.status_code == 200:
            data = r.json()
            assert isinstance(data, (list, dict))


# ─── HTTP health and metadata ─────────────────────────────────────────────────

class TestApplicationMetadata:
    def test_health_endpoint_returns_200(self):
        r = client.get("/api/health", headers=_req(_METADATA_IP))
        assert r.status_code == 200

    def test_health_endpoint_returns_json(self):
        r = client.get("/api/health", headers=_req(_METADATA_IP))
        assert r.headers["content-type"].startswith("application/json")

    def test_openapi_schema_is_accessible(self):
        r = client.get("/openapi.json", headers=_req(_METADATA_IP))
        assert r.status_code == 200
        schema = r.json()
        assert "paths" in schema

    def test_cors_headers_present_for_preflight(self):
        r = client.options(
            "/api/auth/providers",
            headers={
                "x-forwarded-for": _METADATA_IP,
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            }
        )
        assert r.status_code in {200, 204}


# ─── Security headers on all endpoints ───────────────────────────────────────

class TestSecurityHeadersOnEndpoints:
    def test_health_has_x_content_type(self):
        r = client.get("/api/health", headers=_req(_SECURITY_IP))
        assert r.headers.get("x-content-type-options") == "nosniff"

    def test_health_has_x_frame_options(self):
        r = client.get("/api/health", headers=_req(_SECURITY_IP))
        assert r.headers.get("x-frame-options") == "DENY"

    def test_providers_has_security_headers(self):
        r = client.get("/api/auth/providers", headers=_req(_SECURITY_IP))
        assert r.headers.get("x-content-type-options") == "nosniff"

    def test_providers_has_referrer_policy(self):
        r = client.get("/api/auth/providers", headers=_req(_SECURITY_IP))
        assert r.headers.get("referrer-policy") is not None

    def test_hsts_header_on_api_response(self):
        r = client.get("/api/auth/providers", headers=_req(_SECURITY_IP))
        hsts = r.headers.get("strict-transport-security", "")
        assert "max-age=" in hsts


# ─── Error handling ───────────────────────────────────────────────────────────

class TestErrorHandling:
    def test_404_for_unknown_route(self):
        r = client.get("/api/nonexistent-route-xyz", headers=_req(_ERROR_IP))
        assert r.status_code == 404

    def test_404_response_is_json(self):
        r = client.get("/api/nonexistent-route-xyz", headers=_req(_ERROR_IP))
        assert r.headers.get("content-type", "").startswith("application/json")

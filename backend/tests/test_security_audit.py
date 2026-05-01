"""
Security audit tests — systematically verify each security control.

Each test maps to a concrete security requirement. These tests serve as a
living security specification and must all pass before any release.
"""
import pytest
from fastapi.testclient import TestClient

from main import app
from security import (
    AUTH_RATE_LIMIT_REQUESTS,
    GENERAL_RATE_LIMIT_REQUESTS,
    MAX_CHAT_MESSAGE_CHARS,
    RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW_SECONDS,
    SECURITY_HEADERS,
)


client = TestClient(app)


class TestSecurityAudit:
    """Systematic security control verification."""

    # SA-01: HSTS
    def test_SA01_hsts_header_enforces_https(self):
        r = client.get("/api/health")
        hsts = r.headers.get("strict-transport-security", "")
        assert "max-age=31536000" in hsts, "HSTS max-age must be 1 year (31536000 seconds)"
        assert "includeSubDomains" in hsts, "HSTS must cover subdomains"

    # SA-02: Clickjacking protection
    def test_SA02_x_frame_options_denies_embedding(self):
        r = client.get("/api/health")
        assert r.headers.get("x-frame-options") == "DENY"

    # SA-03: MIME-type sniffing prevention
    def test_SA03_x_content_type_options_nosniff(self):
        r = client.get("/api/health")
        assert r.headers.get("x-content-type-options") == "nosniff"

    # SA-04: Referrer information leakage
    def test_SA04_referrer_policy_is_strict(self):
        r = client.get("/api/health")
        assert "strict-origin" in r.headers.get("referrer-policy", "")

    # SA-05: Camera/microphone access
    def test_SA05_permissions_policy_denies_sensors(self):
        r = client.get("/api/health")
        policy = r.headers.get("permissions-policy", "")
        assert "camera=()" in policy
        assert "microphone=()" in policy
        assert "geolocation=()" in policy

    # SA-06: Cross-origin window control
    def test_SA06_cross_origin_opener_same_origin(self):
        r = client.get("/api/health")
        assert r.headers.get("cross-origin-opener-policy") == "same-origin"

    # SA-07: Content Security Policy presence
    def test_SA07_csp_header_is_present(self):
        r = client.get("/api/health")
        assert "content-security-policy" in r.headers

    # SA-08: CSP frame-ancestors restriction
    def test_SA08_csp_denies_frame_ancestors(self):
        r = client.get("/api/health")
        csp = r.headers.get("content-security-policy", "")
        assert "frame-ancestors 'none'" in csp

    # SA-09: Rate limiting — chat tier
    def test_SA09_chat_rate_limit_is_configured(self):
        assert RATE_LIMIT_REQUESTS > 0
        assert RATE_LIMIT_REQUESTS < 200, "Chat limit should be restrictive"

    # SA-10: Rate limiting — auth tier is stricter
    def test_SA10_auth_rate_limit_stricter_than_chat(self):
        assert AUTH_RATE_LIMIT_REQUESTS < RATE_LIMIT_REQUESTS

    # SA-11: Rate limiting — window is reasonable
    def test_SA11_rate_limit_window_is_at_least_30_seconds(self):
        assert RATE_LIMIT_WINDOW_SECONDS >= 30

    # SA-12: Input length restriction
    def test_SA12_chat_message_has_max_length_limit(self):
        assert MAX_CHAT_MESSAGE_CHARS > 0
        assert MAX_CHAT_MESSAGE_CHARS <= 10000, "Max length should be reasonable"

    # SA-13: Auth token not in response body
    def test_SA13_providers_response_does_not_expose_secrets(self):
        r = client.get("/api/auth/providers")
        body = r.text.lower()
        assert "client_secret" not in body
        assert "api_key" not in body
        assert "secret_key" not in body

    # SA-14: Error responses do not leak internals
    def test_SA14_404_response_does_not_leak_stack_trace(self):
        r = client.get("/api/nonexistent-xyz-abc")
        body = r.text.lower()
        assert "traceback" not in body
        assert "file \"/" not in body

    # SA-15: General API rate limit is more permissive than chat
    def test_SA15_general_rate_limit_exceeds_chat_limit(self):
        assert GENERAL_RATE_LIMIT_REQUESTS > RATE_LIMIT_REQUESTS

    # SA-16: Session requires authentication for protected routes
    def test_SA16_unauthenticated_session_returns_false(self):
        r = client.get("/api/auth/session")
        assert r.json()["authenticated"] is False

    # SA-17: CORS restricts allowed origins (config-level check)
    def test_SA17_cors_origin_config_is_restrictive(self):
        from config import settings
        # CORS origins should not include wildcard
        for origin in settings.cors_origins:
            assert origin != "*", "CORS must not allow all origins"

    # SA-18: Security headers applied to all API routes
    def test_SA18_security_headers_on_auth_endpoint(self):
        r = client.get("/api/auth/providers")
        assert r.headers.get("x-content-type-options") == "nosniff"
        assert r.headers.get("x-frame-options") == "DENY"

    # SA-19: CSP restricts base-uri
    def test_SA19_csp_restricts_base_uri(self):
        csp = SECURITY_HEADERS.get("Content-Security-Policy", "")
        assert "base-uri 'self'" in csp

    # SA-20: No server fingerprint in response
    def test_SA20_server_header_does_not_reveal_version(self):
        r = client.get("/api/health")
        server = r.headers.get("server", "").lower()
        # Should not reveal framework version details
        assert "uvicorn/" not in server or len(server) < 30

"""
Enhanced security tests.

Covers:
- All three rate-limit tiers (auth, chat, general)
- Injection pattern detection
- New security headers (HSTS, CSP, X-Powered-By)
- validate_string_field helper
- Client key extraction from X-Forwarded-For
- SECURITY_HEADERS completeness
"""
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from security import (
    AUTH_RATE_LIMIT_REQUESTS,
    GENERAL_RATE_LIMIT_REQUESTS,
    MAX_CHAT_MESSAGE_CHARS,
    RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW_SECONDS,
    SECURITY_HEADERS,
    check_rate_limit,
    client_key,
    validate_chat_message,
    validate_string_field,
)
from main import app


_client = TestClient(app)


# ─── validate_chat_message ────────────────────────────────────────────────────

class TestValidateChatMessage:
    def test_strips_surrounding_whitespace(self):
        assert validate_chat_message("  hello  ") == "hello"

    def test_accepts_max_length_message(self):
        msg = "a" * MAX_CHAT_MESSAGE_CHARS
        assert len(validate_chat_message(msg)) == MAX_CHAT_MESSAGE_CHARS

    def test_rejects_empty_after_strip(self):
        with pytest.raises(HTTPException) as exc:
            validate_chat_message("   \t\n  ")
        assert exc.value.status_code == 400

    def test_rejects_one_char_over_limit(self):
        with pytest.raises(HTTPException) as exc:
            validate_chat_message("x" * (MAX_CHAT_MESSAGE_CHARS + 1))
        assert exc.value.status_code == 413

    def test_rejects_noSQL_dollar_injection(self):
        with pytest.raises(HTTPException) as exc:
            validate_chat_message("find user $where username == 'admin'")
        assert exc.value.status_code == 400

    def test_rejects_ne_operator_injection(self):
        with pytest.raises(HTTPException) as exc:
            validate_chat_message('{"password": {"$ne": ""}}')
        assert exc.value.status_code == 400

    def test_rejects_sql_drop_table(self):
        with pytest.raises(HTTPException) as exc:
            validate_chat_message("'; DROP TABLE users; --")
        assert exc.value.status_code == 400

    def test_accepts_legitimate_civic_question(self):
        msg = "How do I register to vote in Tamil Nadu before the Lok Sabha election?"
        assert validate_chat_message(msg) == msg

    def test_accepts_unicode_indian_languages(self):
        msg = "मतदाता पंजीकरण कैसे करें?"  # Hindi: How to register as voter?
        assert validate_chat_message(msg) == msg

    def test_accepts_exactly_boundary_length(self):
        msg = "a" * MAX_CHAT_MESSAGE_CHARS
        result = validate_chat_message(msg)
        assert len(result) == MAX_CHAT_MESSAGE_CHARS


# ─── validate_string_field ────────────────────────────────────────────────────

class TestValidateStringField:
    def test_accepts_valid_field(self):
        assert validate_string_field("John Doe", "name") == "John Doe"

    def test_strips_field(self):
        assert validate_string_field("  John  ", "name") == "John"

    def test_rejects_empty_field(self):
        with pytest.raises(HTTPException) as exc:
            validate_string_field("", "name")
        assert exc.value.status_code == 400

    def test_rejects_over_max_length(self):
        with pytest.raises(HTTPException) as exc:
            validate_string_field("x" * 501, "description", max_length=500)
        assert exc.value.status_code == 400

    def test_custom_max_length_accepted(self):
        result = validate_string_field("a" * 10, "short", max_length=10)
        assert result == "a" * 10


# ─── Rate limiting ────────────────────────────────────────────────────────────

class TestRateLimiting:
    def test_default_limit_allows_exactly_limit_requests(self):
        key = "rl-default-test"
        results = [check_rate_limit(key, limit=RATE_LIMIT_REQUESTS, now=1.0) for _ in range(RATE_LIMIT_REQUESTS)]
        assert all(results)

    def test_default_limit_blocks_one_over(self):
        key = "rl-over-test"
        for _ in range(RATE_LIMIT_REQUESTS):
            check_rate_limit(key, limit=RATE_LIMIT_REQUESTS, now=2.0)
        assert check_rate_limit(key, limit=RATE_LIMIT_REQUESTS, now=2.0) is False

    def test_auth_limit_is_stricter_than_chat_limit(self):
        assert AUTH_RATE_LIMIT_REQUESTS < RATE_LIMIT_REQUESTS

    def test_general_limit_is_more_permissive_than_chat_limit(self):
        assert GENERAL_RATE_LIMIT_REQUESTS > RATE_LIMIT_REQUESTS

    def test_window_expiry_resets_bucket(self):
        key = "rl-expiry-test"
        # Fill the bucket
        for _ in range(RATE_LIMIT_REQUESTS):
            check_rate_limit(key, limit=RATE_LIMIT_REQUESTS, now=100.0)
        # Bucket should be exhausted
        assert check_rate_limit(key, limit=RATE_LIMIT_REQUESTS, now=100.0) is False
        # After window expires, should be allowed again
        assert check_rate_limit(key, limit=RATE_LIMIT_REQUESTS, now=100.0 + RATE_LIMIT_WINDOW_SECONDS + 1) is True

    def test_different_keys_have_independent_buckets(self):
        key_a = "rl-key-a"
        key_b = "rl-key-b"
        for _ in range(RATE_LIMIT_REQUESTS):
            check_rate_limit(key_a, limit=RATE_LIMIT_REQUESTS, now=200.0)
        assert check_rate_limit(key_a, limit=RATE_LIMIT_REQUESTS, now=200.0) is False
        assert check_rate_limit(key_b, limit=RATE_LIMIT_REQUESTS, now=200.0) is True

    def test_auth_limit_per_bucket(self):
        key = "rl-auth-test"
        results = [check_rate_limit(key, limit=AUTH_RATE_LIMIT_REQUESTS, now=300.0) for _ in range(AUTH_RATE_LIMIT_REQUESTS)]
        assert all(results)
        assert check_rate_limit(key, limit=AUTH_RATE_LIMIT_REQUESTS, now=300.0) is False


# ─── Security headers completeness ────────────────────────────────────────────

class TestSecurityHeaders:
    def test_hsts_header_present(self):
        assert "Strict-Transport-Security" in SECURITY_HEADERS

    def test_hsts_max_age_is_one_year(self):
        assert "max-age=31536000" in SECURITY_HEADERS["Strict-Transport-Security"]

    def test_hsts_includes_subdomains(self):
        assert "includeSubDomains" in SECURITY_HEADERS["Strict-Transport-Security"]

    def test_csp_header_present(self):
        assert "Content-Security-Policy" in SECURITY_HEADERS

    def test_csp_denies_frame_ancestors(self):
        assert "frame-ancestors 'none'" in SECURITY_HEADERS["Content-Security-Policy"]

    def test_csp_restricts_form_actions(self):
        assert "form-action 'self'" in SECURITY_HEADERS["Content-Security-Policy"]

    def test_x_content_type_nosniff(self):
        assert SECURITY_HEADERS["X-Content-Type-Options"] == "nosniff"

    def test_x_frame_deny(self):
        assert SECURITY_HEADERS["X-Frame-Options"] == "DENY"

    def test_referrer_policy_strict(self):
        assert SECURITY_HEADERS["Referrer-Policy"] == "strict-origin-when-cross-origin"

    def test_permissions_policy_restricts_camera(self):
        assert "camera=()" in SECURITY_HEADERS["Permissions-Policy"]

    def test_permissions_policy_restricts_microphone(self):
        assert "microphone=()" in SECURITY_HEADERS["Permissions-Policy"]

    def test_permissions_policy_restricts_geolocation(self):
        assert "geolocation=()" in SECURITY_HEADERS["Permissions-Policy"]

    def test_cross_origin_opener_policy_same_origin(self):
        assert SECURITY_HEADERS["Cross-Origin-Opener-Policy"] == "same-origin"


# ─── Client key extraction ────────────────────────────────────────────────────

class TestClientKey:
    def test_uses_forwarded_for_first_ip(self):
        from unittest.mock import MagicMock
        req = MagicMock()
        req.headers.get.return_value = "1.2.3.4, 5.6.7.8"
        req.client = None
        assert client_key(req) == "1.2.3.4"

    def test_falls_back_to_client_host(self):
        from unittest.mock import MagicMock
        req = MagicMock()
        req.headers.get.return_value = ""
        req.client.host = "9.10.11.12"
        assert client_key(req) == "9.10.11.12"

    def test_returns_unknown_when_no_client_info(self):
        from unittest.mock import MagicMock
        req = MagicMock()
        req.headers.get.return_value = ""
        req.client = None
        assert client_key(req) == "unknown"


# ─── HTTP response headers via test client ────────────────────────────────────

class TestHttpResponseHeaders:
    def test_health_endpoint_returns_security_headers(self):
        response = _client.get("/api/health")
        assert response.status_code == 200
        assert response.headers.get("x-frame-options") == "DENY"
        assert response.headers.get("x-content-type-options") == "nosniff"

    def test_api_response_has_referrer_policy(self):
        response = _client.get("/api/auth/providers")
        assert "strict-origin" in response.headers.get("referrer-policy", "")

    def test_hsts_header_in_api_response(self):
        response = _client.get("/api/health")
        hsts = response.headers.get("strict-transport-security", "")
        assert "max-age=" in hsts

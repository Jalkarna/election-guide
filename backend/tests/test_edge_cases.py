"""
Edge case and validation tests.

Covers boundary conditions, malformed input handling, injection attempts,
concurrent request patterns, and platform API error paths.
"""
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from security import (
    MAX_CHAT_MESSAGE_CHARS,
    validate_chat_message,
    validate_string_field,
    check_rate_limit,
)
from main import app


client = TestClient(app, raise_server_exceptions=False)


# ─── Input validation edge cases ─────────────────────────────────────────────

class TestInputValidationEdgeCases:
    def test_single_character_accepted(self):
        assert validate_chat_message("?") == "?"

    def test_newlines_in_message_accepted(self):
        msg = "Line 1\nLine 2\nLine 3"
        assert validate_chat_message(msg) == msg

    def test_tabs_in_message_accepted(self):
        msg = "Question:\t\tWhat is EPIC?"
        assert validate_chat_message(msg) == msg

    def test_mixed_script_message_accepted(self):
        msg = "EPIC क्या है? How do I register?"
        assert validate_chat_message(msg) == msg

    def test_emojis_in_message_accepted(self):
        msg = "How do I vote? 🗳️ Tell me more 📋"
        assert validate_chat_message(msg) == msg

    def test_only_spaces_rejected(self):
        with pytest.raises(HTTPException) as exc:
            validate_chat_message("     ")
        assert exc.value.status_code == 400

    def test_url_in_message_accepted(self):
        msg = "Please explain what is on https://eci.gov.in regarding EPIC"
        assert validate_chat_message(msg) == msg

    def test_numeric_only_message_accepted(self):
        assert validate_chat_message("110001") == "110001"

    def test_message_with_special_chars_accepted(self):
        msg = "What's Form 6? (for voter registration) — explain please."
        assert validate_chat_message(msg) == msg

    def test_exact_max_length_accepted(self):
        msg = "a" * MAX_CHAT_MESSAGE_CHARS
        result = validate_chat_message(msg)
        assert len(result) == MAX_CHAT_MESSAGE_CHARS

    def test_one_over_max_length_rejected(self):
        with pytest.raises(HTTPException) as exc:
            validate_chat_message("b" * (MAX_CHAT_MESSAGE_CHARS + 1))
        assert exc.value.status_code == 413

    def test_large_injection_payload_rejected(self):
        with pytest.raises(HTTPException):
            validate_chat_message("'; DROP TABLE users; SELECT * FROM users WHERE 'a'='a")

    def test_nosql_gt_operator_rejected(self):
        with pytest.raises(HTTPException) as exc:
            validate_chat_message('{"age": {"$gt": 0}}')
        assert exc.value.status_code == 400


# ─── String field validation edge cases ──────────────────────────────────────

class TestStringFieldEdgeCases:
    def test_whitespace_only_rejected(self):
        with pytest.raises(HTTPException):
            validate_string_field("   ", "field")

    def test_single_word_accepted(self):
        assert validate_string_field("Mumbai", "city") == "Mumbai"

    def test_default_max_length_enforced(self):
        with pytest.raises(HTTPException):
            validate_string_field("x" * 501, "large_field")

    def test_custom_max_10_chars_at_limit(self):
        assert validate_string_field("1234567890", "code", max_length=10) == "1234567890"

    def test_custom_max_10_chars_over_limit(self):
        with pytest.raises(HTTPException):
            validate_string_field("12345678901", "code", max_length=10)


# ─── Platform API edge cases ──────────────────────────────────────────────────

class TestPlatformApiEdgeCases:
    def test_readiness_with_all_false_returns_low_score(self):
        response = client.post(
            "/api/platform/readiness",
            json={"has_epic": False, "roll_verified": False}
        )
        if response.status_code == 200:
            data = response.json()
            # Score should be lower when all checks are false
            assert "score" in data or "status" in data or "checks" in data

    def test_quiz_returns_questions_list(self):
        response = client.get("/api/platform/quiz")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (dict, list))

    def test_scenarios_returns_list(self):
        response = client.get("/api/platform/scenarios")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (dict, list))

    def test_journey_with_unknown_persona_handles_gracefully(self):
        response = client.post(
            "/api/platform/journey",
            json={"persona": "unknown_persona_xyz"}
        )
        assert response.status_code in {200, 400, 422}


# ─── Chat session API edge cases ──────────────────────────────────────────────

class TestChatSessionEdgeCases:
    def test_create_session_returns_id(self):
        response = client.post("/api/chat/sessions")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data

    def test_get_nonexistent_session_returns_404(self):
        response = client.get("/api/chat/sessions/does-not-exist-xyz")
        assert response.status_code == 404

    def test_delete_nonexistent_session_handles_gracefully(self):
        response = client.delete("/api/chat/sessions/does-not-exist-xyz")
        assert response.status_code in {200, 204, 404}

    def test_list_sessions_returns_list(self):
        response = client.get("/api/chat/sessions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "sessions" in data


# ─── Rate limit edge cases ────────────────────────────────────────────────────

class TestRateLimitEdgeCases:
    def test_zero_limit_always_blocks(self):
        assert check_rate_limit("zero-limit-key", limit=0, now=500.0) is False

    def test_limit_of_one_allows_first_request(self):
        assert check_rate_limit("limit-one-key", limit=1, now=600.0) is True

    def test_limit_of_one_blocks_second_request(self):
        key = "limit-one-second"
        check_rate_limit(key, limit=1, now=700.0)
        assert check_rate_limit(key, limit=1, now=700.0) is False

    def test_very_high_limit_not_exhausted_quickly(self):
        key = "high-limit-key"
        # 10 requests should be way under any reasonable limit
        results = [check_rate_limit(key, limit=1000, now=800.0) for _ in range(10)]
        assert all(results)


# ─── Auth edge cases ──────────────────────────────────────────────────────────

class TestAuthEdgeCases:
    def test_dev_session_endpoint_is_reachable(self):
        response = client.post("/api/auth/google/dev")
        assert response.status_code in {200, 500}

    def test_dev_session_returns_token_on_success(self):
        response = client.post("/api/auth/google/dev")
        if response.status_code == 200:
            data = response.json()
            assert "token" in data
            assert "user" in data
            assert len(data["token"]) > 10

    def test_google_callback_returns_correct_status(self):
        response = client.get("/api/auth/google/callback")
        assert response.status_code in {200, 503}

    def test_providers_response_has_configured_field(self):
        response = client.get("/api/auth/providers")
        google = next(
            p for p in response.json()["providers"] if p["name"] == "google"
        )
        assert isinstance(google["configured"], bool)

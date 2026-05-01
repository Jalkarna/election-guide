import pytest
from fastapi import HTTPException

from security import (
    MAX_CHAT_MESSAGE_CHARS,
    SECURITY_HEADERS,
    check_rate_limit,
    validate_chat_message,
)


def test_validate_chat_message_trims_safe_input():
    assert validate_chat_message("  How do I register to vote?  ") == "How do I register to vote?"


def test_validate_chat_message_rejects_empty_input():
    with pytest.raises(HTTPException) as exc:
        validate_chat_message("   ")

    assert exc.value.status_code == 400


def test_validate_chat_message_rejects_oversized_input():
    with pytest.raises(HTTPException) as exc:
        validate_chat_message("x" * (MAX_CHAT_MESSAGE_CHARS + 1))

    assert exc.value.status_code == 413


def test_rate_limit_blocks_after_request_budget():
    key = "test-client"

    allowed = [check_rate_limit(key, now=10.0) for _ in range(45)]
    blocked = check_rate_limit(key, now=10.0)

    assert all(allowed)
    assert blocked is False


def test_security_headers_cover_browser_hardening_basics():
    assert SECURITY_HEADERS["X-Content-Type-Options"] == "nosniff"
    assert SECURITY_HEADERS["X-Frame-Options"] == "DENY"
    assert "camera=()" in SECURITY_HEADERS["Permissions-Policy"]

import json

from services import gemini_stream


def test_system_instruction_forces_selected_response_language():
    instruction = gemini_stream._system_instruction_for_language("Hindi")

    assert "Hindi" in instruction
    assert "regardless of the language used in the user's question" in instruction


def test_extract_source_urls_prefers_official_search_results():
    result = json.dumps({
        "results": [
            {"url": "https://example.com/blog"},
            {"url": "https://eci.gov.in/voter-registration"},
            {"url": "https://pib.gov.in/PressReleasePage.aspx?PRID=123"},
        ]
    })

    urls = gemini_stream._extract_source_urls("search", result, {})

    assert urls == [
        "https://eci.gov.in/voter-registration",
        "https://pib.gov.in/PressReleasePage.aspx?PRID=123",
    ]


def test_friendly_rate_limit_error_message_is_actionable():
    class RateLimitError(Exception):
        status_code = 429

    message = gemini_stream._friendly_error_message(RateLimitError("RESOURCE_EXHAUSTED"))

    assert "capacity limit" in message
    assert "try again" in message

import json

import pytest

import tools


class FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


class FakeClient:
    def __init__(self, *args, **kwargs):
        self.requests = []

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return None

    def get(self, url, params=None, **kwargs):
        self.requests.append((url, params, kwargs))
        return FakeResponse({
            "items": [
                {
                    "title": "Election Commission of India",
                    "link": "https://eci.gov.in/",
                    "snippet": "Official ECI portal",
                }
            ]
        })


def test_search_uses_google_custom_search_when_configured(monkeypatch):
    monkeypatch.setattr(tools.settings, "google_search_api_key", "key")
    monkeypatch.setattr(tools.settings, "google_search_engine_id", "cx")
    monkeypatch.setattr(tools.httpx, "Client", FakeClient)

    payload = json.loads(tools.search("voter registration India"))

    assert payload["provider"] == "google_custom_search"
    assert payload["results"][0]["url"] == "https://eci.gov.in/"
    assert payload["results"][0]["source"] == "google_custom_search"


def test_google_custom_search_returns_none_when_unconfigured(monkeypatch):
    monkeypatch.setattr(tools.settings, "google_search_api_key", None)
    monkeypatch.setattr(tools.settings, "google_search_engine_id", None)

    assert tools._google_custom_search("query") is None


@pytest.mark.parametrize(
    ("raw_url", "expected"),
    [
        ("https://eci.gov.in/test.pdf", "https://eci.gov.in/test.pdf"),
        ("https://pib.gov.in/PressReleasePage.aspx?PRID=123", "https://pib.gov.in/PressReleasePage.aspx?PRID=123"),
    ],
)
def test_fetch_tool_accepts_official_source_urls(raw_url, expected):
    assert raw_url == expected

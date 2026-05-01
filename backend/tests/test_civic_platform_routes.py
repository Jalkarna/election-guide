from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_features_endpoint_returns_platform_catalog():
    response = client.get("/api/platform/features")

    assert response.status_code == 200
    assert len(response.json()["features"]) >= 7


def test_readiness_endpoint_scores_payload():
    response = client.post("/api/platform/readiness", json={
        "has_epic": True,
        "name_on_roll": True,
        "knows_polling_station": True,
        "has_accepted_id": True,
        "understands_evm_vvpat": False,
    })

    assert response.status_code == 200
    assert response.json()["score"] == 80


def test_journey_endpoint_returns_steps():
    response = client.post("/api/platform/journey", json={
        "persona": "candidate",
        "election_type": "lok_sabha",
        "days_until_poll": 10,
    })

    assert response.status_code == 200
    assert any("Nomination" == step["phase"] for step in response.json()["steps"])


def test_booth_guide_endpoint_returns_accessibility_notes():
    response = client.post("/api/platform/booth-guide", json={
        "needs_accessibility_support": True,
        "voting_first_time": True,
    })

    assert response.status_code == 200
    assert response.json()["accessibility_notes"]


def test_quiz_endpoint_rejects_invalid_difficulty():
    response = client.get("/api/platform/quiz?difficulty=expert")

    assert response.status_code == 422


def test_quiz_submit_endpoint_scores_answers():
    response = client.post("/api/platform/quiz/submit", json={
        "answers": {"q_epic": "Voter photo identity card"}
    })

    assert response.status_code == 200
    assert response.json()["percentage"] == 100.0


def test_scenario_endpoint_returns_official_hint():
    response = client.post("/api/platform/scenario", json={
        "scenario": "model_code_violation",
        "persona": "volunteer",
    })

    assert response.status_code == 200
    assert "official_source_hint" in response.json()


def test_analytics_endpoint_returns_recommendations():
    response = client.post("/api/platform/analytics/insights", json={
        "events": [{"type": "chat", "success": True, "duration_ms": 500}]
    })

    assert response.status_code == 200
    assert response.json()["recommendations"]

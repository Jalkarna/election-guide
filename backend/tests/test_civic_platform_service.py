import pytest

from civic_platform.schemas import (
    AnalyticsEvent,
    AnalyticsRequest,
    BoothGuideRequest,
    JourneyRequest,
    QuizSubmitRequest,
    ReadinessRequest,
    ScenarioRequest,
)
from civic_platform.service import (
    build_analytics_insights,
    build_booth_guide,
    build_journey,
    build_readiness_score,
    get_feature_catalog,
    get_quiz,
    grade_quiz,
    simulate_scenario,
)


def test_feature_catalog_exposes_platform_breadth():
    feature_ids = {feature["id"] for feature in get_feature_catalog()}

    assert {"chat", "readiness", "journey", "booth", "quiz", "scenario", "analytics"} <= feature_ids


def test_readiness_score_marks_ready_voter():
    response = build_readiness_score(ReadinessRequest(
        has_epic=True,
        name_on_roll=True,
        knows_polling_station=True,
        has_accepted_id=True,
        understands_evm_vvpat=True,
    ))

    assert response.score == 100
    assert response.status == "ready"
    assert response.missing == []


def test_readiness_score_recommends_missing_actions():
    response = build_readiness_score(ReadinessRequest(needs_accessibility_support=True))

    assert response.status == "not_ready"
    assert "EPIC available" in response.missing
    assert any("accessibility" in action for action in response.next_actions)


@pytest.mark.parametrize("persona", ["first_time_voter", "candidate", "nri_voter"])
def test_journey_is_persona_aware(persona):
    response = build_journey(JourneyRequest(persona=persona, days_until_poll=5))
    titles = [step.title for step in response.steps]

    assert response.persona == persona
    assert "Confirm eligibility and electoral roll status" in titles
    if persona == "candidate":
        assert any("nomination" in title.lower() for title in titles)
    if persona == "nri_voter":
        assert any("overseas" in title.lower() for title in titles)


def test_quiz_difficulty_controls_question_count():
    assert len(get_quiz("basic")["questions"]) == 3
    assert len(get_quiz("intermediate")["questions"]) == 4
    assert len(get_quiz("advanced")["questions"]) >= 5


def test_quiz_grading_returns_corrections():
    result = grade_quiz(QuizSubmitRequest(answers={
        "q_epic": "Voter photo identity card",
        "q_mcc": "Finance Ministry",
    }))

    assert result.score == 1
    assert result.total == 2
    assert result.percentage == 50.0
    assert result.corrections[0]["id"] == "q_mcc"


@pytest.mark.parametrize(
    "scenario",
    ["missing_name_on_roll", "candidate_nomination", "model_code_violation", "accessibility_at_booth"],
)
def test_scenarios_have_paths_and_escalations(scenario):
    response = simulate_scenario(ScenarioRequest(scenario=scenario))

    assert response.scenario == scenario
    assert len(response.recommended_path) >= 3
    assert response.escalation
    assert response.official_source_hint


def test_booth_guide_adjusts_for_first_time_and_accessibility():
    response = build_booth_guide(BoothGuideRequest(
        has_epic=False,
        needs_accessibility_support=True,
        voting_first_time=True,
    ))

    assert any("alternate identity" in item for item in response.before_you_go)
    assert any("EVM/VVPAT" in item for item in response.before_you_go)
    assert any("wheelchair" in item for item in response.accessibility_notes)


def test_analytics_empty_events_suggest_starting_point():
    response = build_analytics_insights(AnalyticsRequest(events=[]))

    assert response.engagement_score == 0
    assert response.recommendations


def test_analytics_scores_successful_engagement():
    response = build_analytics_insights(AnalyticsRequest(events=[
        AnalyticsEvent(type="chat", success=True, duration_ms=1000),
        AnalyticsEvent(type="readiness", success=True, duration_ms=800),
        AnalyticsEvent(type="quiz", success=False, duration_ms=1200),
    ]))

    assert response.successful_events == 2
    assert response.average_duration_ms == 1000
    assert response.engagement_score > 50

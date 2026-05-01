from __future__ import annotations

from civic_platform.content import FEATURE_CATALOG, QUIZ_BANK, SCENARIOS
from civic_platform.schemas import (
    AnalyticsRequest,
    AnalyticsResponse,
    BoothGuideRequest,
    BoothGuideResponse,
    JourneyRequest,
    JourneyResponse,
    JourneyStep,
    QuizResult,
    QuizSubmitRequest,
    ReadinessRequest,
    ReadinessResponse,
    ScenarioRequest,
    ScenarioResponse,
)


READINESS_ITEMS = {
    "has_epic": ("EPIC available", "Apply for or locate your EPIC/voter ID details."),
    "name_on_roll": ("Name confirmed on roll", "Check your name in the electoral roll."),
    "knows_polling_station": ("Polling station known", "Find your assigned polling station before poll day."),
    "has_accepted_id": ("Accepted ID ready", "Keep an accepted identity document ready."),
    "understands_evm_vvpat": ("EVM/VVPAT familiar", "Review the EVM/VVPAT voting flow."),
}


def get_feature_catalog() -> list[dict[str, str]]:
    return FEATURE_CATALOG


def build_readiness_score(request: ReadinessRequest) -> ReadinessResponse:
    completed: list[str] = []
    missing: list[str] = []
    next_actions: list[str] = []

    for field, (label, action) in READINESS_ITEMS.items():
        if getattr(request, field):
            completed.append(label)
        else:
            missing.append(label)
            next_actions.append(action)

    if request.needs_accessibility_support:
        next_actions.insert(0, "Confirm accessibility support at your polling station in advance.")

    score = round((len(completed) / len(READINESS_ITEMS)) * 100)
    status = "ready" if score >= 80 else "getting_ready" if score >= 40 else "not_ready"
    return ReadinessResponse(
        score=score,
        status=status,
        completed=completed,
        missing=missing,
        next_actions=next_actions[:5],
    )


def build_journey(request: JourneyRequest) -> JourneyResponse:
    urgency = "high" if request.days_until_poll <= 7 else "medium" if request.days_until_poll <= 30 else "low"
    steps = [
        JourneyStep(
            phase="Verify",
            title="Confirm eligibility and electoral roll status",
            description="Check your registration details and constituency using official voter services.",
            priority="high",
        ),
        JourneyStep(
            phase="Prepare",
            title="Collect ID and polling station details",
            description="Keep accepted identification ready and save polling station information.",
            priority=urgency,
        ),
        JourneyStep(
            phase="Learn",
            title="Review voting process and rights",
            description="Understand EVM/VVPAT flow, queue rules, and accessibility support if needed.",
            priority="medium",
        ),
        JourneyStep(
            phase="Act",
            title="Vote or complete election-role duties",
            description="Follow the official polling-day process for your voter, candidate, or volunteer role.",
            priority=urgency,
        ),
    ]

    if request.persona == "candidate":
        steps.insert(1, JourneyStep(
            phase="Nomination",
            title="Track nomination, affidavit, and scrutiny deadlines",
            description="Coordinate with the Returning Officer and verify all required documents.",
            priority="high",
        ))
    if request.persona == "nri_voter":
        steps.insert(1, JourneyStep(
            phase="Overseas Elector",
            title="Verify overseas elector registration requirements",
            description="Check the latest ECI process for NRI elector registration and voting rules.",
            priority="high",
        ))

    return JourneyResponse(
        persona=request.persona,
        election_type=request.election_type,
        steps=steps,
    )


def get_quiz(difficulty: str = "basic") -> dict:
    count = 3 if difficulty == "basic" else 4 if difficulty == "intermediate" else len(QUIZ_BANK)
    return {"difficulty": difficulty, "questions": QUIZ_BANK[:count]}


def grade_quiz(request: QuizSubmitRequest) -> QuizResult:
    answer_key = {question.id: question for question in QUIZ_BANK}
    corrections: list[dict[str, str]] = []
    correct = 0

    for question_id, selected in request.answers.items():
        question = answer_key.get(question_id)
        if not question:
            continue
        if selected == question.answer:
            correct += 1
        else:
            corrections.append({
                "id": question_id,
                "selected": selected,
                "correct": question.answer,
                "explanation": question.explanation,
            })

    total = len([qid for qid in request.answers if qid in answer_key])
    percentage = round((correct / total) * 100, 2) if total else 0.0
    return QuizResult(score=correct, total=total, percentage=percentage, corrections=corrections)


def simulate_scenario(request: ScenarioRequest) -> ScenarioResponse:
    scenario = SCENARIOS[request.scenario]
    return ScenarioResponse(
        scenario=request.scenario,
        recommended_path=scenario["recommended_path"],
        escalation=scenario["escalation"],
        official_source_hint=scenario["official_source_hint"],
    )


def build_booth_guide(request: BoothGuideRequest) -> BoothGuideResponse:
    before = [
        "Confirm your name and polling station before leaving.",
        "Carry EPIC or another accepted identity document.",
        "Avoid carrying campaign material into the polling area.",
    ]
    if not request.has_epic:
        before.append("Verify which alternate identity documents are accepted for the election.")
    if request.voting_first_time:
        before.append("Review the EVM/VVPAT flow once before poll day.")

    accessibility = []
    if request.needs_accessibility_support:
        accessibility.extend([
            "Reach out to local election staff for wheelchair, ramp, or companion support details.",
            "Plan extra time for queue and assistance coordination.",
        ])
    else:
        accessibility.append("Ask polling staff for assistance if any accessibility issue arises.")

    return BoothGuideResponse(
        before_you_go=before,
        at_the_booth=[
            "Join the correct queue and follow polling staff instructions.",
            "Verify your identity when asked by polling officials.",
            "Cast your vote on the EVM and check the VVPAT slip briefly.",
            "Leave the polling compartment without photographing or disclosing your vote.",
        ],
        accessibility_notes=accessibility,
    )


def build_analytics_insights(request: AnalyticsRequest) -> AnalyticsResponse:
    if not request.events:
        return AnalyticsResponse(
            engagement_score=0,
            successful_events=0,
            average_duration_ms=0,
            recommendations=["Start with the readiness checklist and one verified chat question."],
        )

    successful = sum(1 for event in request.events if event.success)
    average_duration = round(sum(event.duration_ms for event in request.events) / len(request.events))
    engagement_score = min(100, round((successful / len(request.events)) * 70 + min(len(request.events), 6) * 5))
    recommendations = []
    event_types = {event.type for event in request.events}
    if "readiness" not in event_types:
        recommendations.append("Complete the readiness score to identify missing voting steps.")
    if "quiz" not in event_types:
        recommendations.append("Take the civic quiz to reinforce election basics.")
    if "journey" not in event_types:
        recommendations.append("Generate a voting journey for time-bound next actions.")
    if not recommendations:
        recommendations.append("Continue using verified source-backed answers for election-specific questions.")

    return AnalyticsResponse(
        engagement_score=engagement_score,
        successful_events=successful,
        average_duration_ms=average_duration,
        recommendations=recommendations,
    )

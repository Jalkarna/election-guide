from typing import Literal

from pydantic import BaseModel, Field


Persona = Literal["first_time_voter", "returning_voter", "candidate", "volunteer", "nri_voter"]
ElectionType = Literal["lok_sabha", "vidhan_sabha", "local_body", "rajya_sabha"]


class ReadinessRequest(BaseModel):
    persona: Persona = "first_time_voter"
    has_epic: bool = False
    name_on_roll: bool = False
    knows_polling_station: bool = False
    has_accepted_id: bool = False
    understands_evm_vvpat: bool = False
    needs_accessibility_support: bool = False


class ReadinessResponse(BaseModel):
    score: int
    status: Literal["not_ready", "getting_ready", "ready"]
    completed: list[str]
    missing: list[str]
    next_actions: list[str]


class JourneyRequest(BaseModel):
    persona: Persona = "first_time_voter"
    election_type: ElectionType = "lok_sabha"
    days_until_poll: int = Field(default=30, ge=0, le=365)
    state: str | None = None


class JourneyStep(BaseModel):
    phase: str
    title: str
    description: str
    priority: Literal["high", "medium", "low"]


class JourneyResponse(BaseModel):
    persona: Persona
    election_type: ElectionType
    steps: list[JourneyStep]


class QuizQuestion(BaseModel):
    id: str
    question: str
    options: list[str]
    answer: str
    explanation: str


class QuizResponse(BaseModel):
    difficulty: Literal["basic", "intermediate", "advanced"]
    questions: list[QuizQuestion]


class QuizSubmitRequest(BaseModel):
    answers: dict[str, str]


class QuizResult(BaseModel):
    score: int
    total: int
    percentage: float
    corrections: list[dict[str, str]]


class ScenarioRequest(BaseModel):
    scenario: Literal[
        "missing_name_on_roll",
        "candidate_nomination",
        "model_code_violation",
        "accessibility_at_booth",
    ]
    persona: Persona = "first_time_voter"


class ScenarioResponse(BaseModel):
    scenario: str
    recommended_path: list[str]
    escalation: str
    official_source_hint: str


class BoothGuideRequest(BaseModel):
    has_epic: bool = True
    needs_accessibility_support: bool = False
    voting_first_time: bool = False


class BoothGuideResponse(BaseModel):
    before_you_go: list[str]
    at_the_booth: list[str]
    accessibility_notes: list[str]


class AnalyticsEvent(BaseModel):
    type: Literal["chat", "quiz", "readiness", "journey", "scenario"]
    success: bool = True
    duration_ms: int = Field(default=0, ge=0)


class AnalyticsRequest(BaseModel):
    events: list[AnalyticsEvent] = Field(default_factory=list)


class AnalyticsResponse(BaseModel):
    engagement_score: int
    successful_events: int
    average_duration_ms: int
    recommendations: list[str]

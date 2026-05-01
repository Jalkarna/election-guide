from fastapi import APIRouter, Query

from civic_platform.schemas import (
    AnalyticsRequest,
    AnalyticsResponse,
    BoothGuideRequest,
    BoothGuideResponse,
    JourneyRequest,
    JourneyResponse,
    QuizResponse,
    QuizResult,
    QuizSubmitRequest,
    ReadinessRequest,
    ReadinessResponse,
    ScenarioRequest,
    ScenarioResponse,
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


router = APIRouter(prefix="/api/platform", tags=["platform"])


@router.get("/features")
async def features() -> dict:
    return {"features": get_feature_catalog()}


@router.post("/readiness", response_model=ReadinessResponse)
async def readiness(request: ReadinessRequest) -> ReadinessResponse:
    return build_readiness_score(request)


@router.post("/journey", response_model=JourneyResponse)
async def journey(request: JourneyRequest) -> JourneyResponse:
    return build_journey(request)


@router.post("/booth-guide", response_model=BoothGuideResponse)
async def booth_guide(request: BoothGuideRequest) -> BoothGuideResponse:
    return build_booth_guide(request)


@router.get("/quiz", response_model=QuizResponse)
async def quiz(
    difficulty: str = Query(default="basic", pattern="^(basic|intermediate|advanced)$"),
) -> dict:
    return get_quiz(difficulty)


@router.post("/quiz/submit", response_model=QuizResult)
async def quiz_submit(request: QuizSubmitRequest) -> QuizResult:
    return grade_quiz(request)


@router.post("/scenario", response_model=ScenarioResponse)
async def scenario(request: ScenarioRequest) -> ScenarioResponse:
    return simulate_scenario(request)


@router.post("/analytics/insights", response_model=AnalyticsResponse)
async def analytics_insights(request: AnalyticsRequest) -> AnalyticsResponse:
    return build_analytics_insights(request)

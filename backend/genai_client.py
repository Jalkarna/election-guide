from config import settings


def _create_genai_client():
    from google import genai

    if settings.google_api_key:
        return genai.Client(
            vertexai=True,
            api_key=settings.google_api_key,
        )

    if settings.use_vertex_ai:
        if not settings.gcp_project_id:
            raise RuntimeError("GCP_PROJECT_ID is required when USE_VERTEX_AI=true")
        return genai.Client(
            vertexai=True,
            project=settings.gcp_project_id,
            location=settings.gcp_location,
        )

    raise RuntimeError(
        "Missing Gemini auth. Set GOOGLE_API_KEY or USE_VERTEX_AI=true with GCP_PROJECT_ID."
    )


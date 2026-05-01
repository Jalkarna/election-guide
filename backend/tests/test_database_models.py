from datetime import datetime, timezone

from database import AuthSession, Message, Session, User


def test_session_defaults_generate_id_and_timestamps():
    session = Session(id="session-1")

    assert session.id == "session-1"
    assert session.title is None


def test_message_model_keeps_sources_and_work_duration():
    message = Message(
        session_id="session-1",
        role="assistant",
        content="Answer",
        sources=["https://eci.gov.in/"],
        worked_ms=1234,
    )

    assert message.role == "assistant"
    assert message.sources == ["https://eci.gov.in/"]
    assert message.worked_ms == 1234


def test_auth_models_capture_google_identity_and_session_hash():
    user = User(
        email="voter@example.test",
        name="Voter",
        provider="google",
        google_sub="google-sub",
    )
    auth_session = AuthSession(
        user=user,
        token_hash="a" * 64,
        provider="google",
        expires_at=datetime.now(timezone.utc),
    )

    assert user.email == "voter@example.test"
    assert auth_session.provider == "google"
    assert auth_session.user is user

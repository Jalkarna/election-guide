from database import Message, Session


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

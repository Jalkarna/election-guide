import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from auth.service import (
    GOOGLE_OAUTH_SCOPES,
    auth_provider_status,
    build_google_authorization_url,
    create_dev_google_session,
    get_session_by_token,
    revoke_session,
)
from config import Settings
from database import Base


def test_auth_provider_reports_required_google_env():
    status = auth_provider_status(Settings(google_oauth_client_id=None))

    assert status["name"] == "google"
    assert status["configured"] is False
    assert "GOOGLE_OAUTH_CLIENT_ID" in status["required_env"]
    assert "openid" in status["scopes"]


def test_google_authorization_url_contains_oauth_contract():
    config = Settings(
        google_oauth_client_id="client-id",
        google_oauth_client_secret="client-secret",
        google_oauth_redirect_uri="https://example.test/auth/callback",
    )

    url = build_google_authorization_url("state-token", config)

    assert url is not None
    assert "accounts.google.com/o/oauth2/v2/auth" in url
    assert "client_id=client-id" in url
    assert "state=state-token" in url
    assert "openid" in url
    assert GOOGLE_OAUTH_SCOPES == ["openid", "email", "profile"]


@pytest.mark.asyncio
async def test_dev_google_session_persists_and_revokes():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as db:
        token, auth_session = await create_dev_google_session(db)
        loaded = await get_session_by_token(db, token)

        assert auth_session.user.email == "dev.user@electionguide.local"
        assert loaded is not None
        assert loaded.user.name == "Dev User"
        assert await revoke_session(db, token) is True
        assert await get_session_by_token(db, token) is None

    await engine.dispose()

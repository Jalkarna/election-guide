from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import Settings, settings
from database import AuthSession, User


GOOGLE_OAUTH_SCOPES = [
    "openid",
    "email",
    "profile",
]


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def google_redirect_uri(config: Settings = settings) -> str:
    return config.google_oauth_redirect_uri or f"{config.frontend_url.rstrip('/')}/auth/callback"


def build_google_authorization_url(state: str, config: Settings = settings) -> str | None:
    if not config.google_oauth_client_id:
        return None

    query = urlencode({
        "client_id": config.google_oauth_client_id,
        "redirect_uri": google_redirect_uri(config),
        "response_type": "code",
        "scope": " ".join(GOOGLE_OAUTH_SCOPES),
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    })
    return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"


def auth_provider_status(config: Settings = settings) -> dict:
    state = secrets.token_urlsafe(24)
    return {
        "name": "google",
        "configured": config.google_oauth_configured,
        "authorization_url": build_google_authorization_url(state, config),
        "required_env": [
            "GOOGLE_OAUTH_CLIENT_ID",
            "GOOGLE_OAUTH_REDIRECT_URI",
        ],
        "scopes": GOOGLE_OAUTH_SCOPES,
    }


async def create_or_update_google_user(
    db: AsyncSession,
    *,
    email: str,
    name: str,
    google_sub: str,
    avatar_url: str | None = None,
) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        user.name = name
        user.google_sub = google_sub
        user.avatar_url = avatar_url
        user.provider = "google"
        return user

    user = User(
        email=email,
        name=name,
        google_sub=google_sub,
        avatar_url=avatar_url,
        provider="google",
    )
    db.add(user)
    return user


async def issue_auth_session(db: AsyncSession, user: User, *, provider: str = "google") -> tuple[str, AuthSession]:
    token = secrets.token_urlsafe(36)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.auth_session_ttl_hours)
    session = AuthSession(
        user=user,
        token_hash=token_hash(token),
        provider=provider,
        expires_at=expires_at,
    )
    db.add(session)
    await db.commit()
    await db.refresh(user)
    await db.refresh(session)
    return token, session


async def create_dev_google_session(db: AsyncSession) -> tuple[str, AuthSession]:
    user = await create_or_update_google_user(
        db,
        email="dev.user@electionguide.local",
        name="Dev User",
        google_sub="dev-google-oauth-subject",
        avatar_url=None,
    )
    return await issue_auth_session(db, user, provider="google_dev")


async def create_email_session(db: AsyncSession, email: str, name: str) -> tuple[str, AuthSession]:
    display_name = name.strip() or email.split("@")[0].replace(".", " ").title()
    user = await create_or_update_google_user(
        db,
        email=email.lower().strip(),
        name=display_name,
        google_sub=None,
        avatar_url=None,
    )
    return await issue_auth_session(db, user, provider="email")


async def get_session_by_token(db: AsyncSession, token: str) -> AuthSession | None:
    result = await db.execute(
        select(AuthSession)
        .where(AuthSession.token_hash == token_hash(token))
        .where(AuthSession.revoked_at.is_(None))
    )
    session = result.scalar_one_or_none()
    if not session:
        return None
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        return None
    await db.refresh(session, attribute_names=["user"])
    return session


async def revoke_session(db: AsyncSession, token: str) -> bool:
    session = await get_session_by_token(db, token)
    if not session:
        return False
    session.revoked_at = datetime.now(timezone.utc)
    await db.commit()
    return True

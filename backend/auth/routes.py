from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from auth.schemas import AuthProvidersResponse, AuthSessionOut, CurrentSessionOut, EmailAuthRequest, LogoutRequest
from auth.service import (
    auth_provider_status,
    create_dev_google_session,
    create_email_session,
    get_session_by_token,
    revoke_session,
)
from config import settings
from database import get_db


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/providers", response_model=AuthProvidersResponse)
async def providers() -> dict:
    return {"providers": [auth_provider_status(settings)]}


@router.get("/google/start")
async def google_start() -> dict:
    provider = auth_provider_status(settings)
    if not provider["authorization_url"]:
        raise HTTPException(
            status_code=503,
            detail="Google OAuth client is not configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI.",
        )
    return provider


@router.get("/google/callback")
async def google_callback() -> dict:
    if not settings.google_oauth_configured:
        raise HTTPException(
            status_code=503,
            detail="Google OAuth callback is wired but requires runtime OAuth credentials.",
        )
    return {"status": "ready_for_token_exchange"}


@router.post("/google/dev", response_model=AuthSessionOut)
async def google_dev(db: AsyncSession = Depends(get_db)) -> AuthSessionOut:
    token, session = await create_dev_google_session(db)
    return AuthSessionOut(token=token, expires_at=session.expires_at, user=session.user)


@router.post("/email/login", response_model=AuthSessionOut)
async def email_login(request: EmailAuthRequest, db: AsyncSession = Depends(get_db)) -> AuthSessionOut:
    token, session = await create_email_session(db, request.email, request.name)
    return AuthSessionOut(token=token, expires_at=session.expires_at, user=session.user)


@router.post("/email/signup", response_model=AuthSessionOut)
async def email_signup(request: EmailAuthRequest, db: AsyncSession = Depends(get_db)) -> AuthSessionOut:
    token, session = await create_email_session(db, request.email, request.name)
    return AuthSessionOut(token=token, expires_at=session.expires_at, user=session.user)


@router.get("/session", response_model=CurrentSessionOut)
async def current_session(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> CurrentSessionOut:
    token = (authorization or "").removeprefix("Bearer ").strip()
    if not token:
        return CurrentSessionOut(authenticated=False)
    session = await get_session_by_token(db, token)
    if not session:
        return CurrentSessionOut(authenticated=False)
    return CurrentSessionOut(authenticated=True, user=session.user, expires_at=session.expires_at)


@router.post("/logout")
async def logout(request: LogoutRequest, db: AsyncSession = Depends(get_db)) -> dict:
    return {"revoked": await revoke_session(db, request.token)}

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuthProviderOut(BaseModel):
    name: str
    configured: bool
    authorization_url: str | None
    required_env: list[str]
    scopes: list[str]


class AuthProvidersResponse(BaseModel):
    providers: list[AuthProviderOut]


class AuthUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    avatar_url: str | None
    provider: str


class AuthSessionOut(BaseModel):
    token: str
    expires_at: datetime
    user: AuthUserOut


class CurrentSessionOut(BaseModel):
    authenticated: bool
    user: AuthUserOut | None = None
    expires_at: datetime | None = None


class LogoutRequest(BaseModel):
    token: str


class EmailAuthRequest(BaseModel):
    email: str
    password: str
    name: str = ""

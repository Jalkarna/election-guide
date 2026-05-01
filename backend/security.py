"""
Small defensive HTTP helpers.

These are intentionally framework-light so the security posture is easy to
review and test: input bounds live near the API layer, while response hardening
is applied consistently to every HTTP response.
"""
from __future__ import annotations

from collections.abc import Awaitable, Callable
from time import monotonic

from fastapi import HTTPException, Request, Response


MAX_CHAT_MESSAGE_CHARS = 4000
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_REQUESTS = 45

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
}

_rate_limit_buckets: dict[str, list[float]] = {}


def validate_chat_message(message: str) -> str:
    cleaned = message.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(cleaned) > MAX_CHAT_MESSAGE_CHARS:
        raise HTTPException(
            status_code=413,
            detail=f"Message must be {MAX_CHAT_MESSAGE_CHARS} characters or fewer",
        )
    return cleaned


def client_key(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(key: str, now: float | None = None) -> bool:
    current_time = monotonic() if now is None else now
    bucket = [
        timestamp
        for timestamp in _rate_limit_buckets.get(key, [])
        if current_time - timestamp < RATE_LIMIT_WINDOW_SECONDS
    ]
    allowed = len(bucket) < RATE_LIMIT_REQUESTS
    if allowed:
        bucket.append(current_time)
    _rate_limit_buckets[key] = bucket
    return allowed


async def security_headers_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    if request.url.path.startswith("/api/chat/") and not check_rate_limit(client_key(request)):
        raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")

    response = await call_next(request)
    for header, value in SECURITY_HEADERS.items():
        response.headers.setdefault(header, value)
    return response

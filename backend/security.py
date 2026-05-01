"""
Defensive HTTP security layer for ElectionGuide.

Provides:
- Input validation with strict message length and content bounds
- Sliding-window rate limiting per client IP
- Security response headers on every HTTP response (HSTS, CSP, X-Frame-Options, etc.)
- Three-tier rate limits: general API, auth endpoints, and AI/chat endpoints

Design principles:
- Framework-light: no external security libraries, easy to audit
- All security checks happen at the middleware layer, before route handlers
- Production-safe: no stack traces or internal details in error responses
"""
from __future__ import annotations

import re
from collections.abc import Awaitable, Callable
from time import monotonic

from fastapi import HTTPException, Request, Response


# ─── Limits ───────────────────────────────────────────────────────────────────

MAX_CHAT_MESSAGE_CHARS = 4000
"""Maximum allowed length for a single chat message."""

RATE_LIMIT_WINDOW_SECONDS = 60
"""Sliding window duration for rate limit buckets (seconds)."""

RATE_LIMIT_REQUESTS = 45
"""Maximum requests per window on AI/chat endpoints."""

AUTH_RATE_LIMIT_REQUESTS = 20
"""Stricter rate limit for authentication endpoints."""

GENERAL_RATE_LIMIT_REQUESTS = 120
"""General API rate limit — applied to all non-chat, non-auth routes."""

# ─── Security headers ─────────────────────────────────────────────────────────

# Content-Security-Policy restricts which resources the browser can load.
# 'self' allows same-origin; specific external domains are whitelisted for
# the ECI portals that the frontend links to.
_CSP_DIRECTIVES = "; ".join([
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  # Next.js requires unsafe-inline/eval
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: blob: *.eci.gov.in *.gov.in",
    "connect-src 'self' wss: ws:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
])

SECURITY_HEADERS: dict[str, str] = {
    # Prevent MIME-type sniffing
    "X-Content-Type-Options": "nosniff",
    # Block the page from being embedded in iframes (clickjacking protection)
    "X-Frame-Options": "DENY",
    # Limit referrer information sent to external sites
    "Referrer-Policy": "strict-origin-when-cross-origin",
    # Disable access to sensitive browser APIs
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    # Prevent cross-origin window access
    "Cross-Origin-Opener-Policy": "same-origin",
    # Enforce HTTPS for 1 year (applied even in dev for parity)
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    # Content Security Policy
    "Content-Security-Policy": _CSP_DIRECTIVES,
    # Remove server fingerprint
    "X-Powered-By": "",  # overwritten by middleware to remove it
}

# ─── Rate limit state ─────────────────────────────────────────────────────────

_rate_limit_buckets: dict[str, list[float]] = {}
"""In-process sliding-window buckets keyed by (client_key, bucket_name)."""


# ─── Input validation ─────────────────────────────────────────────────────────

# Characters that suggest SQL or NoSQL injection attempts
_INJECTION_PATTERN = re.compile(
    r"(\$where|\$ne|\$gt|\$lt|\bOR\b\s+[\w'\"]+\s*=|\bDROP\s+TABLE\b)",
    re.IGNORECASE,
)


def validate_chat_message(message: str) -> str:
    """
    Validate and sanitise an incoming chat message.

    @param message: Raw message string from the client.
    @returns: Stripped, validated message.
    @raises HTTPException 400: If the message is empty.
    @raises HTTPException 413: If the message exceeds MAX_CHAT_MESSAGE_CHARS.
    @raises HTTPException 400: If the message contains injection patterns.
    """
    cleaned = message.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(cleaned) > MAX_CHAT_MESSAGE_CHARS:
        raise HTTPException(
            status_code=413,
            detail=f"Message must be {MAX_CHAT_MESSAGE_CHARS} characters or fewer",
        )
    if _INJECTION_PATTERN.search(cleaned):
        raise HTTPException(status_code=400, detail="Message contains disallowed content")
    return cleaned


def validate_string_field(value: str, field: str, max_length: int = 500) -> str:
    """
    Validate a generic string field from user input.

    @param value: Raw field value.
    @param field: Field name for error messages.
    @param max_length: Maximum allowed characters.
    @returns: Stripped, validated string.
    @raises HTTPException 400: If validation fails.
    """
    stripped = value.strip()
    if not stripped:
        raise HTTPException(status_code=400, detail=f"{field} cannot be empty")
    if len(stripped) > max_length:
        raise HTTPException(status_code=400, detail=f"{field} must be {max_length} characters or fewer")
    return stripped


# ─── Client identification ────────────────────────────────────────────────────

def client_key(request: Request) -> str:
    """
    Derive a stable client identifier from the request for rate limiting.

    Respects X-Forwarded-For for deployments behind Cloud Run's load balancer.

    @param request: The incoming FastAPI request.
    @returns: A string key suitable for use in rate limit buckets.
    """
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return request.client.host if request.client else "unknown"


# ─── Rate limiting ────────────────────────────────────────────────────────────

def check_rate_limit(
    key: str,
    limit: int = RATE_LIMIT_REQUESTS,
    now: float | None = None,
) -> bool:
    """
    Sliding-window rate limit check for a given client key.

    @param key: Unique bucket key (typically client IP + endpoint category).
    @param limit: Maximum requests allowed in the window.
    @param now: Current time (injected in tests for determinism).
    @returns: True if the request is allowed; False if the limit is exceeded.
    """
    current_time = monotonic() if now is None else now
    bucket = [
        ts
        for ts in _rate_limit_buckets.get(key, [])
        if current_time - ts < RATE_LIMIT_WINDOW_SECONDS
    ]
    allowed = len(bucket) < limit
    if allowed:
        bucket.append(current_time)
    _rate_limit_buckets[key] = bucket
    return allowed


# ─── Middleware ───────────────────────────────────────────────────────────────

async def security_headers_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """
    ASGI middleware that applies rate limiting and security response headers.

    Rate limit tiers:
    - /api/auth/*      → stricter limit (20 req/min) to slow brute-force
    - /api/chat/*      → AI limit (45 req/min) to control LLM cost
    - all other /api/* → general limit (120 req/min)

    Security headers are applied to every response via setdefault so that
    explicit header values set by route handlers take priority.

    @param request: Incoming HTTP request.
    @param call_next: Next middleware or route handler.
    @returns: HTTP response with security headers applied.
    @raises HTTPException 429: If the client exceeds the applicable rate limit.
    """
    ip = client_key(request)
    path = request.url.path

    if path.startswith("/api/auth/"):
        if not check_rate_limit(f"{ip}:auth", AUTH_RATE_LIMIT_REQUESTS):
            raise HTTPException(status_code=429, detail="Too many authentication requests. Please slow down.")
    elif path.startswith("/api/chat/"):
        if not check_rate_limit(f"{ip}:chat", RATE_LIMIT_REQUESTS):
            raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")
    elif path.startswith("/api/"):
        if not check_rate_limit(f"{ip}:general", GENERAL_RATE_LIMIT_REQUESTS):
            raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")

    response = await call_next(request)

    for header, value in SECURITY_HEADERS.items():
        if header == "X-Powered-By":
            # Remove server fingerprint header rather than overwriting
            try:
                del response.headers[header]
            except KeyError:
                pass
        else:
            response.headers.setdefault(header, value)

    return response

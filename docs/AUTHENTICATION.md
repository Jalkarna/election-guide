# Authentication

ElectionGuide includes a Google Identity Services authentication scaffold that is safe to run without real OAuth credentials.

## Runtime Behavior

- `/api/auth/providers` reports Google OAuth metadata, scopes, required environment variables, and whether the runtime is configured.
- `/api/auth/google/start` returns a Google authorization URL only when `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, and `GOOGLE_OAUTH_REDIRECT_URI` are present.
- `/api/auth/google/demo` creates a credential-free demo Google session so reviewers can exercise the account flow without secrets.
- `/api/auth/session` resolves bearer tokens to persisted auth sessions.
- `/api/auth/logout` revokes an issued token.

## Persistence

The SQLAlchemy model layer includes:

- `users` for Google profile identity,
- `auth_sessions` for hashed session tokens, expiry, provider, and revocation state.

## Environment

```bash
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8001/api/auth/google/callback
AUTH_SESSION_TTL_HOURS=24
```

Real secrets should be supplied through Secret Manager in production. Local development can use the demo Google session endpoint.

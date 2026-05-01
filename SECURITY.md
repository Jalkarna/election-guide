# Security Policy

ElectionGuide handles civic questions and conversation history, so the default posture is conservative.

## Implemented Controls

- Secrets are excluded from source control and loaded through local `.env` or Google Secret Manager.
- Cloud Run receives `GOOGLE_API_KEY` through Secret Manager in `cloudbuild.yaml`.
- Chat input is trimmed, bounded, and rejected when empty or oversized.
- Chat endpoints have a lightweight per-instance rate limit to reduce accidental duplicate submission and abuse.
- Browser hardening headers are applied to HTTP responses:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - restrictive `Permissions-Policy`
- External citation links use `target="_blank"` with `rel="noopener noreferrer"`.
- Tool fetching is bounded by timeouts and output-size limits.

## Sensitive Data

Do not commit:

- `.env` files,
- SQLite databases,
- API keys,
- Google service-account JSON files,
- Cloud Build logs containing secrets.

## Reporting

For challenge evaluation, security findings should be opened as GitHub issues without including real credentials or private user data.

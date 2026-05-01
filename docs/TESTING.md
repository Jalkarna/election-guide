# Testing Strategy

ElectionGuide includes focused automated tests for the most important review categories: assistant correctness, Google service configuration, grounding tools, markdown rendering, and backend safety behavior.

## Backend Tests

Run:

```bash
cd backend
pip install -r requirements-dev.txt
pytest --cov=. --cov-report=term-missing
```

Covered areas:

- model and Google configuration behavior,
- Google service registry and health reporting,
- Google Custom Search provider selection,
- official source URL extraction,
- user-facing error messages,
- database model shape.

## Frontend Tests

Run:

```bash
cd frontend
npm test
```

Covered areas:

- malformed markdown cleanup from model responses,
- sidebar-safe markdown stripping.

## Full Quality Gate

Run from the repository root:

```bash
./scripts/run_quality_checks.sh
```

This executes backend tests when `pytest` is installed, frontend lint, frontend tests, frontend production build, and Python compile checks.

## Manual Smoke Checks

- Ask a simple election question and confirm one assistant response appears.
- Rapid-click a suggestion and confirm only one conversation/request is created.
- Ask in Hindi with response language set to English and confirm English output.
- Click source citations and confirm they open externally.
- Check `/api/health` for Google service configuration.

# Submission Checklist

Use this before each challenge submission attempt.

## Challenge Rules

- Public GitHub repository.
- One branch only.
- Repository size below 10 MB.
- No committed secrets or local databases.
- README explains vertical, approach, logic, assumptions, setup, and deployment.

## Evaluation Signals

- Code Quality: small modules, typed config, clear backend/frontend boundaries.
- Security: secrets in `.env` or Secret Manager only, CORS configured, safe external links.
- Efficiency: fallback model handling, bounded fetch/PDF extraction, streaming, Cloud Run min instances at 0.
- Testing: backend pytest suite and frontend Node tests.
- Accessibility: keyboard focus, labels, aria attributes, readable contrast.
- Google Services: Gemini, Cloud Run, Cloud Build, Artifact Registry, Secret Manager, Cloud Logging, Cloud Storage, optional Google Custom Search and Firestore audit.

## Commands

```bash
./scripts/check_repo_size.sh
./scripts/run_quality_checks.sh
git status --short
```

## Deployment

```bash
gcloud builds submit --config cloudbuild.yaml --project=<PROJECT_ID> .
```

Then confirm:

```bash
gcloud run services describe election-guide \
  --region=us-central1 \
  --project=<PROJECT_ID> \
  --format='value(status.url)'
```

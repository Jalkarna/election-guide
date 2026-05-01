#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$repo_root"
python3 -m py_compile backend/main.py backend/config.py backend/database.py backend/google_services.py backend/prompts.py backend/tools.py

if command -v pytest >/dev/null 2>&1; then
  (cd backend && pytest)
else
  echo "pytest not installed; install backend/requirements-dev.txt to run backend tests"
fi

(cd frontend && npm run lint)
(cd frontend && npm test)
(cd frontend && npm run build)

"$repo_root/scripts/check_repo_size.sh"

#!/usr/bin/env bash
set -euo pipefail

limit_bytes=$((10 * 1024 * 1024))

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  size_bytes=$(git ls-files -z | tar --null -cf - --files-from - | wc -c | tr -d ' ')
else
  size_bytes=$(tar \
    --exclude='.git' \
    --exclude='frontend/node_modules' \
    --exclude='frontend/.next' \
    --exclude='node_modules' \
    --exclude='backend/__pycache__' \
    -cf - . | wc -c | tr -d ' ')
fi

echo "Tracked submission payload: ${size_bytes} bytes"

if [ "$size_bytes" -ge "$limit_bytes" ]; then
  echo "Repository payload is at or above the 10 MB challenge limit." >&2
  exit 1
fi

echo "Repository payload is below the 10 MB challenge limit."

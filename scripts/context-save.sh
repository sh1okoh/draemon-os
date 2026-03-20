#!/usr/bin/env bash
set -euo pipefail

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

API_URL="${API_URL:-http://localhost:8080}"
PROJECT="${PROJECT:-default}"
SUMMARY="${1:-Claude session completed. Capture a short summary here.}"

JSON_PAYLOAD="$(python3 - <<'PY' "$PROJECT" "$SUMMARY"
import json
import sys

project = sys.argv[1]
summary = sys.argv[2]

print(json.dumps({
    "project": project,
    "summary": summary,
    "tags": ["claude", "session"],
    "importance": 0.5,
    "source": "hook"
}, ensure_ascii=False))
PY
)"

curl -sS -X POST "$API_URL/episodes" \
  -H 'content-type: application/json' \
  -d "$JSON_PAYLOAD"

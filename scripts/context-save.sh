#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:8080}"
PROJECT="${PROJECT:-default}"
SUMMARY="${1:-Claude session completed. Capture a short summary here.}"

curl -sS -X POST "$API_URL/episodes" \
  -H 'content-type: application/json' \
  -d "{\"project\":\"$PROJECT\",\"summary\":\"$SUMMARY\",\"tags\":[\"claude\",\"session\"],\"importance\":0.5,\"source\":\"hook\"}"

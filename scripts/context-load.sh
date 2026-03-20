#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:8080}"
PROJECT="${PROJECT:-default}"
QUERY="${1:-today priorities}"
ENCODED_QUERY="$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$QUERY")"

curl -sS "$API_URL/recall?q=$ENCODED_QUERY&project=$PROJECT"

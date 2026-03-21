#!/usr/bin/env bash
set -euo pipefail

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

API_URL="${API_URL:-http://localhost:8080}"
PROJECT="${PROJECT:-default}"

# stdinを読み込む（Claude Codeのhookデータ）
STDIN_DATA=$(cat)

# 追加コンテキスト: 直近のgitコミットメッセージ
GIT_LOG=$(git log -3 --pretty=format:"%h %s" 2>/dev/null || echo "")

RAW_CONTENT="$(python3 - <<'PY' "$STDIN_DATA" "$GIT_LOG"
import json, sys

stdin_raw = sys.argv[1]
git_log = sys.argv[2]

try:
    stdin_parsed = json.loads(stdin_raw)
    stdin_section = json.dumps(stdin_parsed, ensure_ascii=False, indent=2)
except Exception:
    stdin_section = stdin_raw

parts = []
if stdin_section and stdin_section != "{}":
    parts.append(f"[hook data]\n{stdin_section}")
if git_log:
    parts.append(f"[recent commits]\n{git_log}")

print("\n\n".join(parts) if parts else "task completed")
PY
)"

JSON_PAYLOAD="$(python3 - <<'PY' "$PROJECT" "$RAW_CONTENT"
import json, sys
print(json.dumps({
    "project": sys.argv[1],
    "rawContent": sys.argv[2],
    "tags": ["claude", "session"],
    "importance": 0.5,
    "source": "hook"
}, ensure_ascii=False))
PY
)"

curl -sS -X POST "$API_URL/queue" \
  -H 'content-type: application/json' \
  -d "$JSON_PAYLOAD"

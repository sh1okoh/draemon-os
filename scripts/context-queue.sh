#!/usr/bin/env bash
set -euo pipefail

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

API_URL="${API_URL:-http://localhost:8080}"
PROJECT="${PROJECT:-default}"

# stdinからClaudeのhookデータを読む
STDIN_DATA=$(cat)

# stop_hook_activeの場合はスキップ（無限ループ防止）
STOP_HOOK_ACTIVE=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('stop_hook_active', False))" "$STDIN_DATA" 2>/dev/null || echo "False")
if [ "$STOP_HOOK_ACTIVE" = "True" ]; then
  exit 0
fi

# last_assistant_message（Claudeの最終回答）を取り出す
LAST_MESSAGE=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('last_assistant_message', ''))" "$STDIN_DATA" 2>/dev/null || echo "")

# transcript_pathからセッション内容を補完（任意）
TRANSCRIPT_PATH=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('transcript_path', ''))" "$STDIN_DATA" 2>/dev/null || echo "")
TRANSCRIPT_SUMMARY=""
if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
  TRANSCRIPT_SUMMARY=$(python3 - "$TRANSCRIPT_PATH" <<'PY'
import json, sys

path = sys.argv[1]
messages = []
with open(path) as f:
    for line in f:
        try:
            d = json.loads(line)
            if d.get("type") == "user":
                data = d.get("data", {})
                if isinstance(data, dict):
                    for block in data.get("content", []):
                        if isinstance(block, dict) and block.get("type") == "text":
                            text = block["text"].strip()
                            if text and not text.startswith("<"):
                                messages.append(f"User: {text[:200]}")
                                break
        except Exception:
            continue

print("\n".join(messages[-5:]))
PY
  )
fi

RAW_CONTENT=$(python3 - <<'PY' "$LAST_MESSAGE" "$TRANSCRIPT_SUMMARY"
import sys
last_msg = sys.argv[1].strip()
transcript = sys.argv[2].strip()

parts = []
if last_msg:
    parts.append(f"[Claude最終回答]\n{last_msg[:2000]}")
if transcript:
    parts.append(f"[直近のユーザー発言]\n{transcript}")

print("\n\n".join(parts) if parts else "task completed")
PY
)

JSON_PAYLOAD=$(python3 -c "
import json, sys
print(json.dumps({
    'project': sys.argv[1],
    'rawContent': sys.argv[2],
    'tags': ['claude', 'session'],
    'importance': 0.5,
    'source': 'hook'
}, ensure_ascii=False))
" "$PROJECT" "$RAW_CONTENT")

curl -sS -X POST "$API_URL/queue" \
  -H 'content-type: application/json' \
  -d "$JSON_PAYLOAD"

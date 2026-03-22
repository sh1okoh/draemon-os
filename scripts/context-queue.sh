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

# transcript_pathからセッションの会話履歴を抽出
TRANSCRIPT_PATH=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('transcript_path', ''))" "$STDIN_DATA" 2>/dev/null || echo "")
RAW_CONTENT="task completed"
if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
  RAW_CONTENT=$(python3 - "$TRANSCRIPT_PATH" <<'PY'
import json, sys

path = sys.argv[1]
exchanges = []
with open(path) as f:
    for line in f:
        try:
            d = json.loads(line)
            role = d.get("type")
            if role == "user":
                data = d.get("data", {})
                if isinstance(data, dict):
                    for block in data.get("content", []):
                        if isinstance(block, dict) and block.get("type") == "text":
                            text = block["text"].strip()
                            if text and not text.startswith("<"):
                                exchanges.append(f"User: {text[:300]}")
                                break
            elif role == "assistant":
                data = d.get("data", {})
                if isinstance(data, dict):
                    for block in data.get("content", []):
                        if isinstance(block, dict) and block.get("type") == "text":
                            text = block["text"].strip()
                            if text:
                                exchanges.append(f"Assistant: {text[:300]}")
                                break
        except Exception:
            continue

result = "\n".join(exchanges[-10:])
print(result if result else "task completed")
PY
  )
fi

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

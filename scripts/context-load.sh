#!/usr/bin/env bash
set -euo pipefail

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

API_URL="${API_URL:-http://localhost:8080}"
PROJECT="${PROJECT:-default}"

# stdinからSessionStartのhookデータを読む
STDIN_DATA=$(cat)

# cwdからクエリを生成（直近の作業コンテキストで検索）
CWD=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('cwd', ''))" "$STDIN_DATA" 2>/dev/null || echo "")
GIT_LOG=$(git -C "$CWD" log -3 --pretty=format:"%s" 2>/dev/null || echo "")
QUERY="${GIT_LOG:-recent work}"

ENCODED_QUERY="$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$QUERY")"

# recall APIを叩く
RECALL_RESULT=$(curl -sS "$API_URL/recall?q=$ENCODED_QUERY&project=$PROJECT" 2>/dev/null || echo '{"vectorEpisodes":[],"graphEpisodes":[]}')

# additionalContextとして整形してClaudeのコンテキストに注入
ADDITIONAL_CONTEXT=$(python3 - <<'PY' "$RECALL_RESULT"
import json, sys

try:
    data = json.loads(sys.argv[1])
except Exception:
    print("")
    sys.exit(0)

episodes = data.get("vectorEpisodes", [])
graph = data.get("graphEpisodes", [])

# 重複除去（summaryで）
seen = set()
items = []
for ep in episodes + graph:
    s = ep.get("summary", "").strip()
    if s and s not in seen:
        seen.add(s)
        items.append({"summary": s, "createdAt": ep.get("createdAt", "")})

if not items:
    print("")
    sys.exit(0)

lines = ["## 過去のセッション記憶"]
for item in items[:5]:
    date = item["createdAt"][:10] if item["createdAt"] else "不明"
    lines.append(f"- [{date}] {item['summary'][:200]}")

print("\n".join(lines))
PY
)

# additionalContextが空なら何も返さない
if [ -z "$ADDITIONAL_CONTEXT" ]; then
  exit 0
fi

# Claudeのコンテキストに注入するJSON形式で返す
python3 -c "
import json, sys
print(json.dumps({
    'hookSpecificOutput': {
        'hookEventName': 'SessionStart',
        'additionalContext': sys.argv[1]
    }
}, ensure_ascii=False))
" "$ADDITIONAL_CONTEXT"

# Draemon OS Starter

Doraemon OS Starter は、LLM を単なる会話相手ではなく、**外部記憶・状態認識・計画生成を持つ OS** として使うための最小構成です。

このプロジェクトの目的は、以下を実現することです。

- 過去の知識を構造化して保持する
- 現在の状態を外部シグナルから持つ
- 今必要な情報を自動想起する
- 今日やることを整理する
- Claude / local LLM / 他 provider を差し替え可能にする

---

## 特徴

### 1. 長期記憶を外部化する
記憶をモデル内部に閉じ込めず、外部ストアに保存します。

- **VectorDB**: 類似検索に使う
- **GraphDB**: 関係性や因果を辿る

これにより、「似ている過去」と「つながっている過去」を両方扱えます。

### 2. 状態を持てる
会話だけでなく、現在の状態を外から保存できます。

例:

- 会議密度
- blocked topic
- GitHub / CI 状況
- energy / focus

### 3. 自動想起できる
人が履歴を探さなくても、今の文脈から必要な過去を取り出すことを前提にしています。

### 4. 計画を作れる
状態と最近の記録をもとに、以下のような brief を生成できます。

- 今日やること 3 つ
- まずやる理由
- 確認質問 1 つ

### 5. マルチプロバイダー
特定モデルに固定しません。

- Claude
- Ollama
- OpenAI-compatible
- 将来の local LLM

のように切り替えられる前提で設計しています。

---

## アーキテクチャ

```text
CLI / Claude Code / Slack / Scheduler
                  ↓
           Memory & State API
      ↓            ↓             ↓
  VectorDB      GraphDB       State Store
      \            |             /
       \           |            /
            Recall / Planner
                  ↓
          Provider Abstraction
(Claude / Ollama / OpenAI-compatible / local)
```

## できること

### 現在
- episode を保存する
- state を保存する
- 類似する記録を引く
- 関連する graph 情報を引く
- state と最近の記録から brief を生成する
- provider を切り替える

### 今後
- 朝昼夜の自発介入
- GitHub / CI / Calendar ingestion
- embedding の本実装
- graph ontology 強化
- notifier 追加
- text / image / embedding の provider routing

## なぜ GraphDB と VectorDB の両方を使うのか
### VectorDB
- 類似する過去を探す
- 曖昧検索に強い
- 似た障害や設計メモを見つける

### GraphDB
- 関係性を辿る
- 因果や依存を表現する
- 判断と影響範囲をつなぐ

この 2 つを分けることで、検索と関係探索を両立できます。

## なぜマルチプロバイダーなのか
- 能力ごとに強いモデルが違う
- ベンダーロックインを避けたい
- 同じ記憶基盤を複数モデルで共有したい
- 将来的に local LLM へ置き換えたい

このため、モデルは固定せず、交換可能な provider として扱います。

## 技術スタック
- Node.js 25
- Fastify
- TypeScript
- PostgreSQL + pgvector
- FalkorDB
- Docker Compose

## Claude Code hook example
Claude Code から記憶基盤を呼ぶ例です。  
セッション開始時に関連コンテキストを読み込み、タスク完了時に要約を保存します。

`.claude/settings.local.json`

```json
{
  "hooks": {
    "SessionStart": [
      {
        "command": "bash scripts/context-load.sh"
      }
    ],
    "TaskCompleted": [
      {
        "command": "bash scripts/context-save.sh \"task completed\""
      }
    ]
  }
}
```

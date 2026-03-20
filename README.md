# Doraemon OS Starter

Claude を 1 つの provider として扱いながら、将来的にローカル LLM に差し替えられるようにした最小構成です。

このスターターは次を含みます。

- Docker Compose で起動する `Postgres + pgvector`
- Docker Compose で起動する `FalkorDB`
- TypeScript 製の `memory/state/planner API`
- provider 抽象化 (`AnthropicCompatibleProvider` と `NoopProvider`)
- GraphDB と VectorDB の両方に episode を保存する基礎実装
- 朝のブリーフを生成する `daily brief` エンドポイント
- Claude Code から叩く前提のサンプル設定

## 何ができるか

- セッション終了時の要約を保存する
- 今日の状態を JSON で入れる
- 似た episode と関連 graph 情報を一緒に引く
- 朝用の brief を生成する
- モデルはあとから Claude / Ollama / OpenAI-compatible に差し替えられる

## ざっくり構成

```text
Claude Code / Slack / CLI
            ↓
     memory & state API
      ↓             ↓
  pgvector       FalkorDB
      ↓             ↓
 類似検索        関係検索
      \\           /
        planner / brief
            ↓
        provider layer
  (Claude / Ollama / local)
```

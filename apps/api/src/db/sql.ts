export const migrationSql = `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY,
  project TEXT NOT NULL,
  summary TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  importance DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  source TEXT NOT NULL DEFAULT 'manual',
  embedding VECTOR(256) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS episodes_project_created_at_idx
  ON episodes (project, created_at DESC);

CREATE TABLE IF NOT EXISTS state_snapshots (
  subject TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

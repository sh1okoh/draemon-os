import crypto from 'node:crypto';
import { pool } from '../db/pg';
import { createHashEmbedding, toPgVectorLiteral } from '../services/hashEmbedding';
import { EpisodeInput, EpisodeRecord } from '../types';

export class EpisodeRepository {
  async create(input: EpisodeInput): Promise<EpisodeRecord> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const embedding = createHashEmbedding(`${input.project} ${input.summary} ${input.tags.join(' ')}`);

    await pool.query(
      `
      INSERT INTO episodes (id, project, summary, tags, importance, source, embedding, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8)
      `,
      [
        id,
        input.project,
        input.summary,
        input.tags,
        input.importance ?? 0.5,
        input.source ?? 'manual',
        toPgVectorLiteral(embedding),
        createdAt
      ]
    );

    return {
      ...input,
      id,
      createdAt,
      importance: input.importance ?? 0.5,
      source: input.source ?? 'manual'
    };
  }

  async search(query: string, project?: string, limit = 8): Promise<EpisodeRecord[]> {
    const embedding = createHashEmbedding(query);
    const clauses = project ? 'WHERE project = $2' : '';
    const values = project
      ? [toPgVectorLiteral(embedding), project, limit]
      : [toPgVectorLiteral(embedding), limit];

    const sql = project
      ? `
        SELECT id, project, summary, tags, importance, source, created_at,
               1 - (embedding <=> $1::vector) AS score
        FROM episodes
        WHERE project = $2
        ORDER BY embedding <=> $1::vector, created_at DESC
        LIMIT $3
      `
      : `
        SELECT id, project, summary, tags, importance, source, created_at,
               1 - (embedding <=> $1::vector) AS score
        FROM episodes
        ORDER BY embedding <=> $1::vector, created_at DESC
        LIMIT $2
      `;

    const result = await pool.query(sql, values);
    return result.rows.map((row) => ({
      id: row.id,
      project: row.project,
      summary: row.summary,
      tags: row.tags,
      importance: row.importance,
      source: row.source,
      createdAt: row.created_at,
      score: Number(row.score)
    }));
  }

  async latest(project?: string, limit = 5): Promise<EpisodeRecord[]> {
    const result = project
      ? await pool.query(
          `
          SELECT id, project, summary, tags, importance, source, created_at
          FROM episodes
          WHERE project = $1
          ORDER BY created_at DESC
          LIMIT $2
          `,
          [project, limit]
        )
      : await pool.query(
          `
          SELECT id, project, summary, tags, importance, source, created_at
          FROM episodes
          ORDER BY created_at DESC
          LIMIT $1
          `,
          [limit]
        );

    return result.rows.map((row) => ({
      id: row.id,
      project: row.project,
      summary: row.summary,
      tags: row.tags,
      importance: row.importance,
      source: row.source,
      createdAt: row.created_at
    }));
  }
}

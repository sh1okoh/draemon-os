import { pool } from '../db/pg';
import { StatePayload } from '../types';

export class StateRepository {
  async upsert(subject: string, state: StatePayload): Promise<void> {
    await pool.query(
      `
      INSERT INTO state_snapshots (subject, state, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (subject)
      DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
      `,
      [subject, JSON.stringify(state)]
    );
  }

  async get(subject: string): Promise<{ subject: string; state: StatePayload; updatedAt: string } | null> {
    const result = await pool.query(
      `
      SELECT subject, state, updated_at
      FROM state_snapshots
      WHERE subject = $1
      `,
      [subject]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      subject: row.subject,
      state: row.state,
      updatedAt: row.updated_at
    };
  }
}

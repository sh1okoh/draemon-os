import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import { EpisodeInput } from '../types';

type GraphEpisode = {
  id: string;
  summary: string;
  project: string;
  createdAt: string;
};

function escapeValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export class GraphRepository {
  private client: RedisClientType | null = null;

  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    this.client = createClient({ url: config.falkor.url });
    this.client.on('error', (error) => {
      console.error('falkordb error', error);
    });
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async saveEpisode(episode: EpisodeInput & { id: string; createdAt: string }): Promise<void> {
    if (!this.client) {
      return;
    }

    const tags = episode.tags.map((tag) => `'${escapeValue(tag)}'`).join(', ');
    const query = `
      MERGE (p:Project {name: '${escapeValue(episode.project)}'})
      CREATE (e:Episode {
        id: '${episode.id}',
        summary: '${escapeValue(episode.summary)}',
        createdAt: '${episode.createdAt}',
        project: '${escapeValue(episode.project)}'
      })
      MERGE (p)-[:HAS_EPISODE]->(e)
      WITH e
      UNWIND [${tags}] AS tag
      MERGE (t:Topic {name: tag})
      MERGE (e)-[:TAGGED_AS]->(t)
      RETURN e.id
    `;

    await this.client.sendCommand(['GRAPH.QUERY', config.falkor.graph, query, '--compact']);
  }

  async searchEpisodes(keyword: string, project?: string, limit = 5): Promise<GraphEpisode[]> {
    if (!this.client) {
      return [];
    }

    const projectClause = project
      ? `AND e.project = '${escapeValue(project)}'`
      : '';
    const query = `
      MATCH (e:Episode)
      WHERE toLower(e.summary) CONTAINS toLower('${escapeValue(keyword)}') ${projectClause}
      RETURN e.id, e.summary, e.project, e.createdAt
      ORDER BY e.createdAt DESC
      LIMIT ${limit}
    `;

    const response = await this.client.sendCommand<string[]>(['GRAPH.QUERY', config.falkor.graph, query, '--compact']);
    const rows = parseCompactRows(response);

    return rows.map((row) => ({
      id: String(row[0] ?? ''),
      summary: String(row[1] ?? ''),
      project: String(row[2] ?? ''),
      createdAt: String(row[3] ?? '')
    }));
  }
}

function parseCompactRows(response: unknown): unknown[][] {
  if (!Array.isArray(response)) {
    return [];
  }

  const rows = response[1];
  return Array.isArray(rows) ? (rows as unknown[][]) : [];
}

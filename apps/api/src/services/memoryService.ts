import { EpisodeRepository } from '../repositories/episodeRepository';
import { GraphRepository } from '../repositories/graphRepository';
import { EpisodeInput, RecallResult } from '../types';

export class MemoryService {
  constructor(
    private readonly episodes: EpisodeRepository,
    private readonly graph: GraphRepository
  ) {}

  async saveEpisode(input: EpisodeInput) {
    const saved = await this.episodes.create(input);
    try {
      await this.graph.saveEpisode(saved);
    } catch (error) {
      console.warn('graph save failed', error);
    }
    return saved;
  }

  async recall(query: string, project?: string): Promise<RecallResult> {
    const [vectorEpisodes, graphEpisodes] = await Promise.all([
      this.episodes.search(query, project),
      this.graph.searchEpisodes(query, project)
    ]);

    return {
      vectorEpisodes,
      graphEpisodes
    };
  }

  async latest(project?: string, limit = 5) {
    return this.episodes.latest(project, limit);
  }
}

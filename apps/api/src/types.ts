export type EpisodeInput = {
  project: string;
  summary: string;
  tags: string[];
  importance?: number;
  source?: string;
};

export type EpisodeRecord = EpisodeInput & {
  id: string;
  createdAt: string;
  score?: number;
};

export type RecallResult = {
  vectorEpisodes: EpisodeRecord[];
  graphEpisodes: Array<{
    id: string;
    summary: string;
    project: string;
    createdAt: string;
  }>;
};

export type StatePayload = Record<string, unknown>;

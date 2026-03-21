import { GenerationProvider } from '../providers/generationProvider';
import { StateRepository } from '../repositories/stateRepository';
import { MemoryService } from './memoryService';

export class PlannerService {
  constructor(
    private readonly stateRepository: StateRepository,
    private readonly memoryService: MemoryService,
    private readonly generationProvider: GenerationProvider
  ) {}

  async dailyBrief(subject: string, project?: string): Promise<{
    brief: string;
    state: Record<string, unknown> | null;
  }> {
    const [stateRecord, latestEpisodes] = await Promise.all([
      this.stateRepository.get(subject),
      this.memoryService.latest(project, 5)
    ]);

    const state = (stateRecord?.state ?? null) as Record<string, unknown> | null;

    const prompt = `
あなたはユーザー専用のドラえもん的な相棒です。
以下の状態と最近の記録を使って、今日の優先順位を 3 つ、確認したい質問を 1 つ、最後に短い励ましを出してください。

# 状態
${JSON.stringify(state ?? {}, null, 2)}

# 最近の記録
${latestEpisodes.map((episode, index) => `${index + 1}. [${episode.project}] ${episode.summary}`).join('\n')}

出力形式:
- 今日やること 3 つ
- まずやるべき理由
- 確認質問 1 つ
- 一言
`.trim();

    const system = '簡潔で具体的に答える。命令ではなく伴走する。';

    let brief: string;
    try {
      brief = await this.generationProvider.generate({ system, prompt });
    } catch (error) {
      console.warn('provider generation failed, fallback template used', error);
      brief = this.fallbackBrief(state, latestEpisodes.map((episode) => episode.summary));
    }

    return { brief, state };
  }

  private fallbackBrief(
    state: Record<string, unknown> | null,
    recentSummaries: string[]
  ): string {
    const topPriority = String(state?.top_priority ?? '最重要タスクを決める');
    const blockedTopic = String(state?.blocked_topic ?? '特になし');
    const energy = String(state?.energy ?? 'unknown');
    const calendarLoad = String(state?.calendar_load ?? 'unknown');

    return [
      '今日やること 3 つ',
      `1. ${topPriority}`,
      `2. ${blockedTopic === '特になし' ? '未解決の詰まり確認' : `${blockedTopic} の再確認`}`,
      `3. 最近の記録から一番再利用価値が高いものを前に進める`,
      '',
      'まずやるべき理由',
      `会議密度は ${calendarLoad}、エネルギーは ${energy} と見ているので、最重要な 1 本を先に片付けるのが良さそうです。`,
      '',
      '確認質問 1 つ',
      `今日は ${topPriority} を先にやる前提でよさそう？`,
      '',
      '一言',
      recentSummaries[0] ? `昨日までの流れは「${recentSummaries[0]}」です。ここから繋げましょう。` : '今日は勝ち筋を 1 本に絞るだけで十分です。'
    ].join('\n');
  }
}

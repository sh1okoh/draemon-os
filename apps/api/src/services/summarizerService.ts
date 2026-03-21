import { GenerationProvider } from '../providers/generationProvider';
import { QueueItem } from './queueService';

const SYSTEM_PROMPT = `あなたはClaude Codeセッションのメモリアシスタントです。
与えられたセッションデータから、実際に何が行われたかを1〜2文で簡潔に要約してください。
変更・実装・決定事項など具体的な内容に焦点を当ててください。
前置きなしに要約のみを返してください。`;

export class SummarizerService {
  constructor(
    private readonly provider: GenerationProvider,
    private readonly useModel: boolean
  ) {}

  async summarize(item: QueueItem): Promise<string> {
    const rawContent = item.rawContent.trim();

    if (!rawContent || rawContent === '{}') {
      return `タスク完了 (project: ${item.project})`;
    }

    if (!this.useModel) {
      return fallbackSummary(rawContent);
    }

    try {
      const summary = await this.provider.generate({
        system: SYSTEM_PROMPT,
        prompt: `以下のセッションデータを要約してください:\n\n${rawContent}`
      });
      return summary || fallbackSummary(rawContent);
    } catch {
      return fallbackSummary(rawContent);
    }
  }
}

function fallbackSummary(rawContent: string): string {
  const text = rawContent.replace(/[\n\r]+/g, ' ').trim();
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

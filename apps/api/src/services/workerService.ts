import { QueueService } from './queueService';
import { SummarizerService } from './summarizerService';
import { MemoryService } from './memoryService';

export class WorkerService {
  private running = false;

  constructor(
    private readonly queue: QueueService,
    private readonly summarizer: SummarizerService,
    private readonly memory: MemoryService
  ) {}

  start(): void {
    this.running = true;
    void this.loop();
    console.info('[worker] started');
  }

  stop(): void {
    this.running = false;
    console.info('[worker] stopping');
  }

  private async loop(): Promise<void> {
    while (this.running) {
      try {
        const item = await this.queue.dequeue();
        if (!item) continue;

        const summary = await this.summarizer.summarize(item);
        await this.memory.saveEpisode({
          project: item.project,
          summary,
          tags: item.tags,
          importance: item.importance,
          source: item.source
        });

        console.info('[worker] saved episode', { project: item.project, summary });
      } catch (error) {
        console.error('[worker] error processing queue item', error);
      }
    }
  }
}

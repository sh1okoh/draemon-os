import { createClient, RedisClientType } from 'redis';
import { config } from '../config';

const QUEUE_KEY = 'episode_queue';
const BRPOP_TIMEOUT = 5; // seconds

export type QueueItem = {
  project: string;
  rawContent: string;
  tags: string[];
  importance: number;
  source: string;
  enqueuedAt: string;
};

export class QueueService {
  private client: RedisClientType | null = null;

  async connect(): Promise<void> {
    if (this.client) return;
    this.client = createClient({ url: config.falkor.url });
    this.client.on('error', (error) => {
      console.error('queue redis error', error);
    });
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async enqueue(item: QueueItem): Promise<void> {
    if (!this.client) throw new Error('QueueService not connected');
    await this.client.lPush(QUEUE_KEY, JSON.stringify(item));
  }

  async dequeue(timeoutSeconds = BRPOP_TIMEOUT): Promise<QueueItem | null> {
    if (!this.client) throw new Error('QueueService not connected');
    const result = await this.client.brPop(QUEUE_KEY, timeoutSeconds);
    if (!result) return null;
    return JSON.parse(result.element) as QueueItem;
  }
}

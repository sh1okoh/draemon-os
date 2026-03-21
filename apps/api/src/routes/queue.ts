import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { QueueService } from '../services/queueService';

const queueItemSchema = z.object({
  project: z.string().min(1),
  rawContent: z.string().default(''),
  tags: z.array(z.string()).default([]),
  importance: z.number().min(0).max(1).default(0.5),
  source: z.string().default('hook')
});

export async function registerQueueRoutes(app: FastifyInstance, queue: QueueService): Promise<void> {
  app.post('/queue', async (request, reply) => {
    const payload = queueItemSchema.parse(request.body);
    await queue.enqueue({
      ...payload,
      enqueuedAt: new Date().toISOString()
    });
    return reply.code(202).send({ queued: true });
  });
}

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { MemoryService } from '../services/memoryService';

const episodeSchema = z.object({
  project: z.string().min(1),
  summary: z.string().min(1),
  tags: z.array(z.string()).default([]),
  importance: z.number().min(0).max(1).optional(),
  source: z.string().optional()
});

export async function registerEpisodeRoutes(app: FastifyInstance, memory: MemoryService): Promise<void> {
  app.post('/episodes', async (request, reply) => {
    const payload = episodeSchema.parse(request.body);
    const saved = await memory.saveEpisode(payload);
    return reply.code(201).send(saved);
  });

  app.get('/recall', async (request) => {
    const querySchema = z.object({
      q: z.string().min(1),
      project: z.string().optional()
    });
    const query = querySchema.parse(request.query);
    return memory.recall(query.q, query.project);
  });
}

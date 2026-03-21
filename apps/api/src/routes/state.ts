import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { StateRepository } from '../repositories/stateRepository';

export async function registerStateRoutes(app: FastifyInstance, stateRepository: StateRepository): Promise<void> {
  app.put('/state/:subject', async (request, reply) => {
    const params = z.object({ subject: z.string().min(1) }).parse(request.params);
    const state = z.record(z.string(), z.unknown()).parse(request.body);
    await stateRepository.upsert(params.subject, state);
    return reply.code(204).send();
  });

  app.get('/state/:subject', async (request, reply) => {
    const params = z.object({ subject: z.string().min(1) }).parse(request.params);
    const state = await stateRepository.get(params.subject);
    if (!state) {
      return reply.code(404).send({ message: 'state not found' });
    }
    return state;
  });
}

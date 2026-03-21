import Fastify from 'fastify';
import { config } from './config';
import { registerEpisodeRoutes } from './routes/episodes';
import { registerHealthRoutes } from './routes/health';
import { registerPlannerRoutes } from './routes/planner';
import { registerQueueRoutes } from './routes/queue';
import { registerStateRoutes } from './routes/state';
import { AnthropicCompatibleProvider } from './providers/anthropicCompatibleProvider';
import { NoopProvider } from './providers/noopProvider';
import { EpisodeRepository } from './repositories/episodeRepository';
import { GraphRepository } from './repositories/graphRepository';
import { StateRepository } from './repositories/stateRepository';
import { MemoryService } from './services/memoryService';
import { PlannerService } from './services/plannerService';
import { QueueService } from './services/queueService';
import { SummarizerService } from './services/summarizerService';
import { WorkerService } from './services/workerService';
import { pool } from './db/pg';

async function main(): Promise<void> {
  const app = Fastify({ logger: true });

  const graphRepository = new GraphRepository();
  await graphRepository.connect().catch((error) => {
    app.log.warn({ error }, 'graph connection failed, continuing without graph');
  });

  const episodeRepository = new EpisodeRepository();
  const stateRepository = new StateRepository();
  const memoryService = new MemoryService(episodeRepository, graphRepository);
  const provider = config.model.useModel
    ? new AnthropicCompatibleProvider({
        baseUrl: config.model.baseUrl,
        apiKey: config.model.apiKey,
        modelName: config.model.modelName
      })
    : new NoopProvider();
  const plannerService = new PlannerService(stateRepository, memoryService, provider);

  const queueService = new QueueService();
  await queueService.connect().catch((error) => {
    app.log.warn({ error }, 'queue redis connection failed, continuing without queue worker');
  });
  const summarizerService = new SummarizerService(provider, config.model.useModel);
  const workerService = new WorkerService(queueService, summarizerService, memoryService);
  workerService.start();

  await registerHealthRoutes(app);
  await registerEpisodeRoutes(app, memoryService);
  await registerQueueRoutes(app, queueService);
  await registerStateRoutes(app, stateRepository);
  await registerPlannerRoutes(app, plannerService);

  const shutdown = async () => {
    workerService.stop();
    await queueService.disconnect().catch(() => undefined);
    await graphRepository.disconnect().catch(() => undefined);
    await pool.end().catch(() => undefined);
    await app.close();
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });

  await app.listen({ port: config.port, host: '0.0.0.0' });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

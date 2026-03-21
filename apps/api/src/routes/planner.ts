import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PlannerService } from '../services/plannerService';

export async function registerPlannerRoutes(app: FastifyInstance, plannerService: PlannerService): Promise<void> {
  app.get('/planner/daily-brief', async (request) => {
    const query = z.object({
      subject: z.string().min(1),
      project: z.string().optional()
    }).parse(request.query);

    return plannerService.dailyBrief(query.subject, query.project);
  });
}

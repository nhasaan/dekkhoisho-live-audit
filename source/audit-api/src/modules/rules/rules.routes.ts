import { FastifyInstance } from 'fastify';
import { RulesController } from './rules.controller.js';
import { authenticateJWT, requireAnalyst, requireAdmin } from '../../common/middleware/auth.middleware.js';

export async function ruleRoutes(server: FastifyInstance) {
  const controller = new RulesController();

  // GET /rules - List all rules with cursor pagination
  server.get(
    '/',
    { preHandler: authenticateJWT },
    controller.getRules.bind(controller)
  );

  // POST /rules/draft - Create draft rule (Analyst or Admin)
  server.post(
    '/draft',
    { preHandler: [authenticateJWT, requireAnalyst] },
    controller.createDraftRule.bind(controller)
  );

  // POST /rules/:id/approve - Approve rule (Admin only)
  server.post(
    '/:id/approve',
    { preHandler: [authenticateJWT, requireAdmin] },
    controller.approveRule.bind(controller)
  );

  // POST /rules/:id/pause - Pause rule (Admin only)
  server.post(
    '/:id/pause',
    { preHandler: [authenticateJWT, requireAdmin] },
    controller.pauseRule.bind(controller)
  );

  // POST /rules/:id/resume - Resume paused rule (Admin only)
  server.post(
    '/:id/resume',
    { preHandler: [authenticateJWT, requireAdmin] },
    controller.resumeRule.bind(controller)
  );
}


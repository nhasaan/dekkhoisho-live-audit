import { FastifyInstance } from 'fastify';
import { RulesController } from './rules.controller.js';
import { authenticateJWT, requireAnalyst, requireAdmin } from '../../common/middleware/auth.middleware.js';

export async function ruleRoutes(server: FastifyInstance) {
  const controller = new RulesController();

  // GET /rules - List all rules with cursor pagination
  server.get(
    '/',
    {
      preHandler: authenticateJWT,
      schema: {
        description: 'Get all rules with cursor-based pagination',
        tags: ['rules'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['draft', 'active', 'paused'] },
            cursor: { type: 'string' },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
            sortBy: { type: 'string', enum: ['createdAt', 'id'], default: 'createdAt' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
        },
      },
    },
    controller.getRules.bind(controller)
  );

  // POST /rules/draft - Create draft rule (Analyst or Admin)
  server.post(
    '/draft',
    {
      preHandler: [authenticateJWT, requireAnalyst],
      schema: {
        description: 'Create a new draft rule',
        tags: ['rules'],
        body: {
          type: 'object',
          required: ['name', 'severity'],
          properties: {
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            pattern: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          },
        },
      },
    },
    controller.createDraftRule.bind(controller)
  );

  // POST /rules/:id/approve - Approve rule (Admin only)
  server.post(
    '/:id/approve',
    {
      preHandler: [authenticateJWT, requireAdmin],
      schema: {
        description: 'Approve a draft rule',
        tags: ['rules'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    controller.approveRule.bind(controller)
  );

  // POST /rules/:id/pause - Pause rule (Admin only)
  server.post(
    '/:id/pause',
    {
      preHandler: [authenticateJWT, requireAdmin],
      schema: {
        description: 'Pause an active rule',
        tags: ['rules'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            reason: { type: 'string' },
          },
        },
      },
    },
    controller.pauseRule.bind(controller)
  );

  // POST /rules/:id/resume - Resume paused rule (Admin only)
  server.post(
    '/:id/resume',
    {
      preHandler: [authenticateJWT, requireAdmin],
      schema: {
        description: 'Resume a paused rule',
        tags: ['rules'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    controller.resumeRule.bind(controller)
  );
}


import { FastifyInstance } from 'fastify';
import { AuditController } from './audit.controller.js';
import { authenticateJWT } from '../../common/middleware/auth.middleware.js';

export async function auditRoutes(server: FastifyInstance) {
  const controller = new AuditController();

  // GET /audit/logs - Get audit logs with cursor pagination
  server.get(
    '/logs',
    {
      preHandler: authenticateJWT,
      schema: {
        description: 'Get audit logs with cursor-based pagination',
        tags: ['audit'],
        querystring: {
          type: 'object',
          properties: {
            user: { type: 'string', description: 'Filter by username' },
            action: { type: 'string', description: 'Filter by action type' },
            dateFrom: { type: 'string', format: 'date-time', description: 'Filter from date' },
            dateTo: { type: 'string', format: 'date-time', description: 'Filter to date' },
            cursor: { type: 'string', description: 'Pagination cursor' },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
            sortBy: { type: 'string', enum: ['id', 'timestamp', 'createdAt'], default: 'timestamp' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
        },
        response: {
          200: {
            description: 'Successful response',
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['SUCCESS'] },
              message: { type: 'string' },
              data: { type: 'array' },
              meta: { type: 'object' },
            },
          },
        },
      },
    },
    controller.getAuditLogs.bind(controller)
  );

  // GET /audit/verify - Verify audit log integrity
  server.get(
    '/verify',
    {
      preHandler: authenticateJWT,
      schema: {
        description: 'Verify the integrity of the audit log chain',
        tags: ['audit'],
        response: {
          200: {
            description: 'Verification result',
            type: 'object',
            properties: {
              status: { type: 'string' },
              message: { type: 'string' },
              data: { type: 'object' },
              meta: { type: 'object' },
            },
          },
        },
      },
    },
    controller.verifyIntegrity.bind(controller)
  );
}


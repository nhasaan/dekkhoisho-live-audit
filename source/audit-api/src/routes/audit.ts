import type { FastifyInstance } from 'fastify';
import type { PaginatedAuditLogsResponse } from '../types/index.js';
import { authenticateJWT } from '../middleware/auth.js';

export async function auditRoutes(server: FastifyInstance) {
  // GET /audit/logs - Requires authentication (any role)
  server.get<{
    Querystring: {
      user?: string;
      action?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    };
    Reply: PaginatedAuditLogsResponse;
  }>(
    '/logs',
    {
      preHandler: authenticateJWT,
    },
    async (request, reply) => {
      try {
        const { user, action, dateFrom, dateTo, page = 1, limit = 50 } = request.query;

        const result = await server.db.getAuditLogs(
          Number(page),
          Math.min(Number(limit), 100), // Max 100
          { user, action, dateFrom, dateTo }
        );

        return result;
      } catch (error) {
        server.log.error('Error fetching audit logs:', error);
        return reply.code(500).send({
          error: 'Failed to fetch audit logs',
        });
      }
    }
  );

  // GET /audit/verify - Verify audit log integrity (admin only)
  server.get(
    '/verify',
    {
      preHandler: authenticateJWT,
    },
    async (request, reply) => {
      try {
        const result = await server.audit.verifyChainIntegrity();
        return result;
      } catch (error) {
        server.log.error('Error verifying audit logs:', error);
        return reply.code(500).send({
          error: 'Failed to verify audit logs',
        });
      }
    }
  );
}


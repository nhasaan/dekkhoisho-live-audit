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
    },
    controller.getAuditLogs.bind(controller)
  );

  // GET /audit/verify - Verify audit log integrity
  server.get(
    '/verify',
    {
      preHandler: authenticateJWT,
    },
    controller.verifyIntegrity.bind(controller)
  );
}


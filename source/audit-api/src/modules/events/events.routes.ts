import { FastifyInstance } from 'fastify';
import { EventsController } from './events.controller.js';
import { authenticateJWT } from '../../common/middleware/auth.middleware.js';

export async function eventRoutes(server: FastifyInstance) {
  const controller = new EventsController();

  // POST /events/ingest - Ingest security event (no authentication for simulator)
  server.post('/ingest', controller.ingestEvent.bind(controller));

  // GET /events/recent - Get recent events with cursor pagination
  server.get(
    '/recent',
    { preHandler: authenticateJWT },
    controller.getRecentEvents.bind(controller)
  );

  // GET /events/stats/rules - Get rule statistics
  server.get(
    '/stats/rules',
    { preHandler: authenticateJWT },
    controller.getRuleStats.bind(controller)
  );
}


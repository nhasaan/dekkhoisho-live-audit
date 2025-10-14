import type { FastifyInstance } from 'fastify';
import type {
  EventIngestRequest,
  EventIngestResponse,
  PaginatedEventsResponse,
  RuleStatsResponse,
} from '../types/index.js';
import { authenticateJWT } from '../middleware/auth.js';

export async function eventRoutes(server: FastifyInstance) {
  // POST /events/ingest - No authentication required (for simulator)
  server.post<{ Body: EventIngestRequest; Reply: EventIngestResponse }>(
    '/ingest',
    {
      schema: {
        body: {
          type: 'object',
          required: [
            'id',
            'ts',
            'source_ip',
            'path',
            'method',
            'service',
            'rule_id',
            'rule_name',
            'severity',
            'action',
            'latency_ms',
            'country',
            'env',
          ],
          properties: {
            id: { type: 'string', pattern: '^evt_\\d+$' },
            ts: { type: 'string', format: 'date-time' },
            source_ip: { type: 'string' },
            path: { type: 'string' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
            service: { type: 'string' },
            rule_id: { type: 'string' },
            rule_name: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            action: { type: 'string', enum: ['allowed', 'blocked'] },
            latency_ms: { type: 'number', minimum: 0 },
            country: { type: 'string', minLength: 2, maxLength: 2 },
            env: { type: 'string', enum: ['dev', 'staging', 'prod'] },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const event = request.body;

        // Store event in database
        await server.db.insertEvent(event);

        // Update Redis statistics
        await server.redis.incrementRuleCount(event.rule_id, event.rule_name);

        // Broadcast to WebSocket clients
        server.websocketClients.forEach((client) => {
          if (client.readyState === 1) { // OPEN
            client.send(
              JSON.stringify({
                type: 'event',
                data: event,
              })
            );
          }
        });

        server.log.debug(`Event ingested: ${event.id} - ${event.rule_name}`);

        return reply.code(201).send({
          success: true,
          eventId: event.id,
        });
      } catch (error) {
        server.log.error('Event ingestion error:', error);
        return reply.code(500).send({
          error: 'Failed to ingest event',
        });
      }
    }
  );

  // GET /events/recent - Requires authentication
  server.get<{
    Querystring: {
      page?: number;
      limit?: number;
      severity?: string;
      rule_id?: string;
      dateFrom?: string;
      dateTo?: string;
    };
    Reply: PaginatedEventsResponse;
  }>(
    '/recent',
    {
      preHandler: authenticateJWT,
    },
    async (request, reply) => {
      try {
        const { page = 1, limit = 50, severity, rule_id, dateFrom, dateTo } = request.query;

        const result = await server.db.getRecentEvents(
          Number(page),
          Math.min(Number(limit), 100), // Max 100
          { severity, rule_id, dateFrom, dateTo }
        );

        return result;
      } catch (error) {
        server.log.error('Error fetching recent events:', error);
        return reply.code(500).send({
          error: 'Failed to fetch events',
        });
      }
    }
  );

  // GET /events/stats/rules - Requires authentication
  server.get<{
    Querystring: {
      window?: '15m' | '1h' | '24h';
    };
    Reply: RuleStatsResponse;
  }>(
    '/stats/rules',
    {
      preHandler: authenticateJWT,
    },
    async (request, reply) => {
      try {
        const { window = '15m' } = request.query;

        // Get top rules from Redis
        const rules = await server.redis.getTopRules(5);

        return {
          rules,
          timestamp: new Date().toISOString(),
          window,
        };
      } catch (error) {
        server.log.error('Error fetching rule stats:', error);
        return reply.code(500).send({
          error: 'Failed to fetch statistics',
        });
      }
    }
  );
}


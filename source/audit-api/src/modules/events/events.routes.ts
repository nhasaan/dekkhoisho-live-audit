import { FastifyInstance } from 'fastify';
import { EventsController } from './events.controller.js';
import { authenticateJWT } from '../../common/middleware/auth.middleware.js';

export async function eventRoutes(server: FastifyInstance) {
  const controller = new EventsController();

  // POST /events/ingest - Ingest security event (no authentication for simulator)
  server.post(
    '/ingest',
    {
      schema: {
        description: 'Ingest a security event',
        tags: ['events'],
        body: {
          type: 'object',
          required: [
            'id', 'ts', 'source_ip', 'path', 'method', 'service',
            'rule_id', 'rule_name', 'severity', 'action', 'latency_ms',
            'country', 'env'
          ],
          properties: {
            id: { type: 'string' },
            ts: { type: 'string', format: 'date-time' },
            source_ip: { type: 'string' },
            path: { type: 'string' },
            method: { type: 'string' },
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
        response: {
          201: {
            description: 'Event ingested successfully',
            type: 'object',
          },
        },
      },
    },
    controller.ingestEvent.bind(controller)
  );

  // GET /events/recent - Get recent events with cursor pagination
  server.get(
    '/recent',
    {
      preHandler: authenticateJWT,
      schema: {
        description: 'Get recent events with cursor-based pagination',
        tags: ['events'],
        querystring: {
          type: 'object',
          properties: {
            cursor: { type: 'string' },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            rule_id: { type: 'string' },
            dateFrom: { type: 'string', format: 'date-time' },
            dateTo: { type: 'string', format: 'date-time' },
            sortBy: { type: 'string', enum: ['ts', 'createdAt'], default: 'ts' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
        },
      },
    },
    controller.getRecentEvents.bind(controller)
  );

  // GET /events/stats/rules - Get rule statistics
  server.get(
    '/stats/rules',
    {
      preHandler: authenticateJWT,
      schema: {
        description: 'Get top 5 rule statistics for a time window',
        tags: ['events'],
        querystring: {
          type: 'object',
          properties: {
            window: { type: 'string', enum: ['15m', '1h', '24h'], default: '15m' },
          },
        },
      },
    },
    controller.getRuleStats.bind(controller)
  );
}


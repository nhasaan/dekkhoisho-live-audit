import { FastifyRequest, FastifyReply } from 'fastify';
import { EventsService } from './events.service.js';
import { EventIngestRequest, GetEventsQuery, toEventResponse } from './events.dto.js';
import { ResponseBuilder } from '../../common/types/api-response.js';

export class EventsController {
  private eventsService: EventsService;

  constructor() {
    this.eventsService = new EventsService();
  }

  async ingestEvent(request: FastifyRequest, reply: FastifyReply) {
    const startTime = Date.now();

    try {
      const event = await this.eventsService.ingestEvent(request.body as EventIngestRequest);

      // Update Redis statistics
      await request.server.redis.incrementRuleCount(event.ruleId, event.ruleName);

      // Broadcast to WebSocket clients
      request.server.websocketClients.forEach((socket) => {
        if (socket.readyState === 1) { // OPEN
          try {
            socket.send(JSON.stringify({
              type: 'event',
              data: request.body, // Send original request format
            }));
          } catch (err) {
            request.log.error({ error: err }, 'Failed to broadcast event');
          }
        }
      });

      request.log.debug(`Event ingested: ${event.id} - ${event.ruleName}`);

      const response = ResponseBuilder.success(
        'Event ingested successfully',
        { event_id: event.id },
        {
          request_id: request.id,
          duration_ms: Date.now() - startTime,
        }
      );

      return reply.code(201).send(response);
    } catch (error: any) {
      // Handle duplicate key error
      if (error.code === 'P2002') {
        const response = ResponseBuilder.error(
          'Event already exists',
          {
            code: 'duplicate_event',
            description: 'An event with this ID already exists',
          },
          {
            request_id: request.id,
            duration_ms: Date.now() - startTime,
          }
        );
        return reply.code(409).send(response);
      }

      request.log.error(error);
      
      const response = ResponseBuilder.error(
        'Failed to ingest event',
        {
          code: 'event_ingest_error',
          description: error.message,
        },
        {
          request_id: request.id,
          duration_ms: Date.now() - startTime,
        },
        process.env.NODE_ENV !== 'production' ? {
          error_details: error.message,
          request_path: request.url,
          request_method: request.method,
          environment: process.env.NODE_ENV || 'development',
          debug_mode: true,
        } : undefined
      );

      return reply.code(500).send(response);
    }
  }

  async getRecentEvents(request: FastifyRequest, reply: FastifyReply) {
    const startTime = Date.now();

    try {
      const query = request.query as GetEventsQuery;
      const { data, nextCursor, hasMore, totalCount } = await this.eventsService.getRecentEvents(query);

      const response = ResponseBuilder.successPaginated(
        'Events retrieved successfully',
        data.map(toEventResponse),
        {
          cursor: query.cursor || null,
          next_cursor: nextCursor,
          has_more: hasMore,
          limit: query.limit || 50,
          total_count: totalCount,
        },
        {
          request_id: request.id,
          duration_ms: Date.now() - startTime,
        }
      );

      return reply.code(200).send(response);
    } catch (error: any) {
      request.log.error(error);
      
      const response = ResponseBuilder.error(
        'Failed to retrieve events',
        {
          code: 'events_fetch_error',
          description: error.message,
        },
        {
          request_id: request.id,
          duration_ms: Date.now() - startTime,
        },
        process.env.NODE_ENV !== 'production' ? {
          error_details: error.message,
          request_path: request.url,
          request_method: request.method,
          environment: process.env.NODE_ENV || 'development',
          debug_mode: true,
        } : undefined
      );

      return reply.code(500).send(response);
    }
  }

  async getRuleStats(request: FastifyRequest, reply: FastifyReply) {
    const startTime = Date.now();

    try {
      const query = request.query as { window?: '15m' | '1h' | '24h' };
      const window = query.window || '15m';
      const rules = await this.eventsService.getRuleStats(window);

      const response = ResponseBuilder.success(
        'Rule statistics retrieved successfully',
        {
          rules,
          timestamp: new Date().toISOString(),
          window,
        },
        {
          request_id: request.id,
          duration_ms: Date.now() - startTime,
          total_rules: rules.length,
        }
      );

      return reply.code(200).send(response);
    } catch (error: any) {
      request.log.error(error);
      
      const response = ResponseBuilder.error(
        'Failed to retrieve rule statistics',
        {
          code: 'stats_fetch_error',
          description: error.message,
        },
        {
          request_id: request.id,
          duration_ms: Date.now() - startTime,
        },
        process.env.NODE_ENV !== 'production' ? {
          error_details: error.message,
          request_path: request.url,
          request_method: request.method,
          environment: process.env.NODE_ENV || 'development',
          debug_mode: true,
        } : undefined
      );

      return reply.code(500).send(response);
    }
  }
}


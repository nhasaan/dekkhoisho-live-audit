import { FastifyRequest, FastifyReply } from 'fastify';
import { AuditService } from './audit.service.js';
import { GetAuditLogsQuery, toAuditLogResponse } from './audit.dto.js';
import { ResponseBuilder } from '../../common/types/api-response.js';

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async getAuditLogs(request: FastifyRequest, reply: FastifyReply) {
    const startTime = Date.now();

    try {
      const query = request.query as GetAuditLogsQuery;
      const { data, nextCursor, hasMore, totalCount} = await this.auditService.getAuditLogs(query);

      const response = ResponseBuilder.successPaginated(
        'Audit logs retrieved successfully',
        data.map(toAuditLogResponse),
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
        'Failed to retrieve audit logs',
        {
          code: 'audit_logs_fetch_error',
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
          stack_trace: error.stack,
        } : undefined
      );

      return reply.code(500).send(response);
    }
  }

  async verifyIntegrity(request: FastifyRequest, reply: FastifyReply) {
    const startTime = Date.now();

    try {
      const result = await this.auditService.verifyIntegrity();
      
      const statusCode = result.valid ? 200 : 400;
      const response = ResponseBuilder.success(
        result.message,
        result,
        {
          request_id: request.id,
          duration_ms: Date.now() - startTime,
        }
      );

      return reply.code(statusCode).send(response);
    } catch (error: any) {
      request.log.error(error);
      
      const response = ResponseBuilder.error(
        'Failed to verify audit log integrity',
        {
          code: 'audit_verify_error',
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


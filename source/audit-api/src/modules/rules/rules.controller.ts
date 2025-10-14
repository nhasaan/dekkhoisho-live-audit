import { FastifyRequest, FastifyReply } from 'fastify';
import { RulesService } from './rules.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateRuleRequest, GetRulesQuery, UpdateRuleStatusRequest, toRuleResponse } from './rules.dto.js';
import { ResponseBuilder } from '../../common/types/api-response.js';
import type { JWTPayload } from '../auth/auth.dto.js';

export class RulesController {
  private rulesService: RulesService;
  private auditService: AuditService;

  constructor() {
    this.rulesService = new RulesService();
    this.auditService = new AuditService();
  }

  async getRules(
    request: FastifyRequest<{ Querystring: GetRulesQuery }>,
    reply: FastifyReply
  ) {
    const startTime = Date.now();

    try {
      const { data, nextCursor, hasMore, totalCount } = await this.rulesService.getRules(
        request.query
      );

      const response = ResponseBuilder.successPaginated(
        'Rules retrieved successfully',
        data.map(toRuleResponse),
        {
          cursor: request.query.cursor || null,
          next_cursor: nextCursor,
          has_more: hasMore,
          limit: request.query.limit || 50,
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
        'Failed to retrieve rules',
        {
          code: 'rules_fetch_error',
          description: error.message,
        },
        {
          request_id: request.id,
          duration_ms: Date.now() - startTime,
        }
      );

      return reply.code(500).send(response);
    }
  }

  async createDraftRule(
    request: FastifyRequest<{ Body: CreateRuleRequest }>,
    reply: FastifyReply
  ) {
    const startTime = Date.now();

    try {
      const user = request.user as JWTPayload;
      const rule = await this.rulesService.createRule(request.body, user.id);

      // Create audit log
      await this.auditService.createAuditLog({
        userId: user.id,
        username: user.username,
        action: 'DRAFT_RULE',
        target: `rule_${rule.id}`,
        metadata: {
          rule_name: rule.name,
          severity: rule.severity,
        },
      });

      request.log.info(`Rule drafted by ${user.username}: ${rule.name}`);

      const response = ResponseBuilder.success(
        'Rule drafted successfully',
        {
          rule: toRuleResponse(rule),
          audit: {
            action: 'DRAFT_RULE',
            target: `rule_${rule.id}`,
          },
        },
        {
          request_id: request.id,
          duration_ms: Date.now() - startTime,
        }
      );

      return reply.code(201).send(response);
    } catch (error: any) {
      request.log.error(error);
      
      const response = ResponseBuilder.error(
        'Failed to create rule',
        {
          code: 'rule_create_error',
          description: error.message,
        },
        {
          request_id: request.id,
          duration_ms: Date.now() - startTime,
        }
      );

      return reply.code(500).send(response);
    }
  }

  async approveRule(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const startTime = Date.now();

    try {
      const user = request.user as JWTPayload;
      const ruleId = parseInt(request.params.id);

      // Get rule first
      const rule = await this.rulesService.getRuleById(ruleId);
      if (!rule) {
        const response = ResponseBuilder.error(
          'Rule not found',
          {
            code: 'rule_not_found',
            description: 'The requested rule does not exist',
          },
          {
            request_id: request.id,
            duration_ms: Date.now() - startTime,
          }
        );
        return reply.code(404).send(response);
      }

      // Update status
      const updatedRule = await this.rulesService.updateRuleStatus(ruleId, 'active');

      // Create audit log
      await this.auditService.createAuditLog({
        userId: user.id,
        username: user.username,
        action: 'APPROVE_RULE',
        target: `rule_${ruleId}`,
        metadata: {
          rule_name: rule.name,
          previous_status: rule.status,
        },
      });

      request.log.info(`Rule approved by ${user.username}: ${rule.name}`);

      const response = ResponseBuilder.success(
        'Rule approved successfully',
        {
          rule: toRuleResponse(updatedRule),
          audit: {
            action: 'APPROVE_RULE',
            target: `rule_${ruleId}`,
          },
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
        'Failed to approve rule',
        {
          code: 'rule_approve_error',
          description: error.message,
        },
        {
          request_id: request.id,
          duration_ms: Date.now() - startTime,
        }
      );

      return reply.code(500).send(response);
    }
  }

  async pauseRule(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateRuleStatusRequest }>,
    reply: FastifyReply
  ) {
    const startTime = Date.now();

    try {
      const user = request.user as JWTPayload;
      const ruleId = parseInt(request.params.id);

      const rule = await this.rulesService.getRuleById(ruleId);
      if (!rule) {
        const response = ResponseBuilder.error(
          'Rule not found',
          { code: 'rule_not_found', description: 'The requested rule does not exist' },
          { request_id: request.id, duration_ms: Date.now() - startTime }
        );
        return reply.code(404).send(response);
      }

      const updatedRule = await this.rulesService.updateRuleStatus(ruleId, 'paused');

      await this.auditService.createAuditLog({
        userId: user.id,
        username: user.username,
        action: 'PAUSE_RULE',
        target: `rule_${ruleId}`,
        metadata: {
          rule_name: rule.name,
          previous_status: rule.status,
          reason: request.body.reason || 'No reason provided',
        },
      });

      const response = ResponseBuilder.success(
        'Rule paused successfully',
        {
          rule: toRuleResponse(updatedRule),
          audit: { action: 'PAUSE_RULE', target: `rule_${ruleId}` },
        },
        { request_id: request.id, duration_ms: Date.now() - startTime }
      );

      return reply.code(200).send(response);
    } catch (error: any) {
      request.log.error(error);
      const response = ResponseBuilder.error(
        'Failed to pause rule',
        { code: 'rule_pause_error', description: error.message },
        { request_id: request.id, duration_ms: Date.now() - startTime }
      );
      return reply.code(500).send(response);
    }
  }

  async resumeRule(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const startTime = Date.now();

    try {
      const user = request.user as JWTPayload;
      const ruleId = parseInt(request.params.id);

      const rule = await this.rulesService.getRuleById(ruleId);
      if (!rule) {
        const response = ResponseBuilder.error(
          'Rule not found',
          { code: 'rule_not_found', description: 'The requested rule does not exist' },
          { request_id: request.id, duration_ms: Date.now() - startTime }
        );
        return reply.code(404).send(response);
      }

      const updatedRule = await this.rulesService.updateRuleStatus(ruleId, 'active');

      await this.auditService.createAuditLog({
        userId: user.id,
        username: user.username,
        action: 'RESUME_RULE',
        target: `rule_${ruleId}`,
        metadata: {
          rule_name: rule.name,
          previous_status: rule.status,
        },
      });

      const response = ResponseBuilder.success(
        'Rule resumed successfully',
        {
          rule: toRuleResponse(updatedRule),
          audit: { action: 'RESUME_RULE', target: `rule_${ruleId}` },
        },
        { request_id: request.id, duration_ms: Date.now() - startTime }
      );

      return reply.code(200).send(response);
    } catch (error: any) {
      request.log.error(error);
      const response = ResponseBuilder.error(
        'Failed to resume rule',
        { code: 'rule_resume_error', description: error.message },
        { request_id: request.id, duration_ms: Date.now() - startTime }
      );
      return reply.code(500).send(response);
    }
  }
}


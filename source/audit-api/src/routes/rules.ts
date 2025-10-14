import type { FastifyInstance } from 'fastify';
import type {
  CreateRuleRequest,
  RuleResponse,
  PaginatedRulesResponse,
} from '../types/index.js';
import { authenticateJWT, requireAnalyst, requireAdmin } from '../middleware/auth.js';

export async function ruleRoutes(server: FastifyInstance) {
  // GET /rules - List all rules (any authenticated user)
  server.get<{
    Querystring: {
      status?: string;
      page?: number;
      limit?: number;
    };
    Reply: PaginatedRulesResponse;
  }>(
    '/',
    {
      preHandler: authenticateJWT,
    },
    async (request, reply) => {
      try {
        const { status, page = 1, limit = 50 } = request.query;

        const result = await server.db.getRules(
          Number(page),
          Math.min(Number(limit), 100),
          status
        );

        return result;
      } catch (error) {
        server.log.error('Error fetching rules:', error);
        return reply.code(500).send({
          error: 'Failed to fetch rules',
        });
      }
    }
  );

  // POST /rules/draft - Create draft rule (Analyst or Admin)
  server.post<{
    Body: CreateRuleRequest;
    Reply: { rule: RuleResponse; audit: any };
  }>(
    '/draft',
    {
      preHandler: [authenticateJWT, requireAnalyst],
      schema: {
        body: {
          type: 'object',
          required: ['name', 'severity'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            pattern: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const ruleData = request.body;
        const user = request.user!;

        // Create rule
        const rule = await server.db.createRule({
          ...ruleData,
          created_by: user.id,
        });

        // Create audit log
        await server.audit.log(user, 'DRAFT_RULE', `rule_${rule.id}`, {
          rule_name: rule.name,
          severity: rule.severity,
        });

        server.log.info(`Rule drafted by ${user.username}: ${rule.name}`);

        return reply.code(201).send({
          rule: {
            ...rule,
            created_at: rule.created_at.toISOString(),
            updated_at: rule.updated_at.toISOString(),
          },
          audit: {
            action: 'DRAFT_RULE',
            target: `rule_${rule.id}`,
          },
        });
      } catch (error) {
        server.log.error('Error creating draft rule:', error);
        return reply.code(500).send({
          error: 'Failed to create rule',
        });
      }
    }
  );

  // POST /rules/:id/approve - Approve rule (Admin only)
  server.post<{
    Params: { id: string };
    Reply: { rule: RuleResponse; audit: any };
  }>(
    '/:id/approve',
    {
      preHandler: [authenticateJWT, requireAdmin],
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const user = request.user!;

        // Get rule
        const rule = await server.db.getRuleById(Number(id));
        if (!rule) {
          return reply.code(404).send({
            error: 'Rule not found',
          });
        }

        // Update rule status
        const updatedRule = await server.db.updateRuleStatus(Number(id), 'active');

        // Create audit log
        await server.audit.log(user, 'APPROVE_RULE', `rule_${id}`, {
          rule_name: rule.name,
          previous_status: rule.status,
        });

        server.log.info(`Rule approved by ${user.username}: ${rule.name}`);

        return {
          rule: {
            ...updatedRule!,
            created_at: updatedRule!.created_at.toISOString(),
            updated_at: updatedRule!.updated_at.toISOString(),
          },
          audit: {
            action: 'APPROVE_RULE',
            target: `rule_${id}`,
          },
        };
      } catch (error) {
        server.log.error('Error approving rule:', error);
        return reply.code(500).send({
          error: 'Failed to approve rule',
        });
      }
    }
  );

  // POST /rules/:id/pause - Pause rule (Admin only)
  server.post<{
    Params: { id: string };
    Body: { reason?: string };
    Reply: { rule: RuleResponse; audit: any };
  }>(
    '/:id/pause',
    {
      preHandler: [authenticateJWT, requireAdmin],
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { reason } = request.body;
        const user = request.user!;

        // Get rule
        const rule = await server.db.getRuleById(Number(id));
        if (!rule) {
          return reply.code(404).send({
            error: 'Rule not found',
          });
        }

        // Update rule status
        const updatedRule = await server.db.updateRuleStatus(Number(id), 'paused');

        // Create audit log
        await server.audit.log(user, 'PAUSE_RULE', `rule_${id}`, {
          rule_name: rule.name,
          previous_status: rule.status,
          reason: reason || 'No reason provided',
        });

        server.log.info(`Rule paused by ${user.username}: ${rule.name}`);

        return {
          rule: {
            ...updatedRule!,
            created_at: updatedRule!.created_at.toISOString(),
            updated_at: updatedRule!.updated_at.toISOString(),
          },
          audit: {
            action: 'PAUSE_RULE',
            target: `rule_${id}`,
          },
        };
      } catch (error) {
        server.log.error('Error pausing rule:', error);
        return reply.code(500).send({
          error: 'Failed to pause rule',
        });
      }
    }
  );

  // POST /rules/:id/resume - Resume paused rule (Admin only)
  server.post<{
    Params: { id: string };
    Reply: { rule: RuleResponse; audit: any };
  }>(
    '/:id/resume',
    {
      preHandler: [authenticateJWT, requireAdmin],
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const user = request.user!;

        // Get rule
        const rule = await server.db.getRuleById(Number(id));
        if (!rule) {
          return reply.code(404).send({
            error: 'Rule not found',
          });
        }

        // Update rule status
        const updatedRule = await server.db.updateRuleStatus(Number(id), 'active');

        // Create audit log
        await server.audit.log(user, 'RESUME_RULE', `rule_${id}`, {
          rule_name: rule.name,
          previous_status: rule.status,
        });

        server.log.info(`Rule resumed by ${user.username}: ${rule.name}`);

        return {
          rule: {
            ...updatedRule!,
            created_at: updatedRule!.created_at.toISOString(),
            updated_at: updatedRule!.updated_at.toISOString(),
          },
          audit: {
            action: 'RESUME_RULE',
            target: `rule_${id}`,
          },
        };
      } catch (error) {
        server.log.error('Error resuming rule:', error);
        return reply.code(500).send({
          error: 'Failed to resume rule',
        });
      }
    }
  );
}


import { Rule, EventSeverity, RuleStatus } from '@prisma/client';

export interface CreateRuleRequest {
  name: string;
  description?: string;
  pattern?: string;
  severity: EventSeverity;
}

export interface RuleResponse {
  id: number;
  name: string;
  description: string | null;
  pattern: string | null;
  severity: string;
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export function toRuleResponse(rule: Rule): RuleResponse {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    pattern: rule.pattern,
    severity: rule.severity,
    status: rule.status,
    created_by: rule.createdBy,
    created_at: rule.createdAt.toISOString(),
    updated_at: rule.updatedAt.toISOString(),
  };
}

export interface GetRulesQuery {
  status?: RuleStatus;
  cursor?: string;
  limit?: number;
  sortBy?: 'createdAt' | 'id';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateRuleStatusRequest {
  reason?: string;
}


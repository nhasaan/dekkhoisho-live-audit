import { Event, EventSeverity, EventAction } from '@prisma/client';

export interface EventIngestRequest {
  id: string;
  ts: string;
  source_ip: string;
  path: string;
  method: string;
  service: string;
  rule_id: string;
  rule_name: string;
  severity: EventSeverity;
  action: EventAction;
  latency_ms: number;
  country: string;
  env: string;
}

export interface EventResponse {
  id: string;
  ts: string;
  source_ip: string;
  path: string | null;
  method: string | null;
  service: string | null;
  rule_id: string;
  rule_name: string;
  severity: string;
  action: string;
  latency_ms: number;
  country: string;
  env: string;
  created_at: string;
}

export function toEventResponse(event: Event): EventResponse {
  return {
    id: event.id,
    ts: event.ts.toISOString(),
    source_ip: event.sourceIp,
    path: event.path,
    method: event.method,
    service: event.service,
    rule_id: event.ruleId,
    rule_name: event.ruleName,
    severity: event.severity,
    action: event.action,
    latency_ms: event.latencyMs,
    country: event.country,
    env: event.env,
    created_at: event.createdAt.toISOString(),
  };
}

export interface GetEventsQuery {
  cursor?: string;
  limit?: number;
  severity?: EventSeverity;
  rule_id?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'ts' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface RuleStatsResponse {
  rule_id: string;
  rule_name: string;
  count: number;
  last_seen: string;
}


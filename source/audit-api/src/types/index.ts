// Re-export common types for backward compatibility
export type { JWTPayload, LoginRequest, LoginResponse, UserResponse } from '../modules/auth/auth.dto.js';
export type { EventIngestRequest, EventResponse, RuleStatsResponse } from '../modules/events/events.dto.js';
export type { AuditLogResponse } from '../modules/audit/audit.dto.js';
export type { RuleResponse, CreateRuleRequest } from '../modules/rules/rules.dto.js';

// WebSocket types
export interface WSMessage {
  type: 'event' | 'stats_update' | 'connected' | 'ping' | 'pong' | 'subscribe';
  data?: any;
  message?: string;
  clientId?: string;
}

export interface WSSubscribeMessage {
  type: 'subscribe';
  filters?: {
    severity?: string;
    rule_id?: string;
  };
}

// Health check types
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  services?: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}

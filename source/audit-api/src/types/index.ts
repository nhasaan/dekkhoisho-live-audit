// User types
export type UserRole = 'viewer' | 'analyst' | 'admin';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

export interface UserResponse {
  id: number;
  username: string;
  role: UserRole;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface JWTPayload {
  id: number;
  username: string;
  role: UserRole;
}

// Security Event types
export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EventAction = 'allowed' | 'blocked';
export type EventEnvironment = 'dev' | 'staging' | 'prod';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface SecurityEvent {
  id: string;
  ts: string; // ISO8601
  source_ip: string;
  path: string;
  method: HttpMethod;
  service: string;
  rule_id: string;
  rule_name: string;
  severity: EventSeverity;
  action: EventAction;
  latency_ms: number;
  country: string;
  env: EventEnvironment;
  created_at?: Date;
}

export interface EventIngestRequest {
  id: string;
  ts: string;
  source_ip: string;
  path: string;
  method: HttpMethod;
  service: string;
  rule_id: string;
  rule_name: string;
  severity: EventSeverity;
  action: EventAction;
  latency_ms: number;
  country: string;
  env: EventEnvironment;
}

export interface EventIngestResponse {
  success: boolean;
  eventId: string;
}

export interface PaginatedEventsResponse {
  events: SecurityEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Rule statistics types
export interface RuleStats {
  rule_id: string;
  rule_name: string;
  count: number;
  last_seen: string;
}

export interface RuleStatsResponse {
  rules: RuleStats[];
  timestamp: string;
  window: string;
}

// Audit log types
export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'DRAFT_RULE'
  | 'APPROVE_RULE'
  | 'PAUSE_RULE'
  | 'RESUME_RULE'
  | 'DELETE_RULE'
  | 'UPDATE_RULE';

export interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: AuditAction;
  target: string | null;
  metadata: Record<string, any> | null;
  timestamp: Date;
  hash: string;
  previous_hash: string | null;
  created_at: Date;
}

export interface AuditLogResponse {
  id: number;
  user_id: number;
  username: string;
  action: AuditAction;
  target: string | null;
  metadata: Record<string, any> | null;
  timestamp: string;
  hash: string;
  previous_hash: string | null;
}

export interface PaginatedAuditLogsResponse {
  logs: AuditLogResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Rule types
export type RuleStatus = 'draft' | 'active' | 'paused';

export interface Rule {
  id: number;
  name: string;
  description: string | null;
  pattern: string | null;
  severity: EventSeverity;
  status: RuleStatus;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

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
  severity: EventSeverity;
  status: RuleStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedRulesResponse {
  rules: RuleResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
    severity?: EventSeverity;
    rule_id?: string;
  };
}

// Error types
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

// Health check types
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  services?: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}


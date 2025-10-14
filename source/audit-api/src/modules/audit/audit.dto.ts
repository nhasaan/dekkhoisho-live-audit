import { AuditLog } from '@prisma/client';

export interface GetAuditLogsQuery {
  user?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
  sortBy?: 'id' | 'timestamp' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogResponse {
  id: number;
  user_id: number;
  username: string;
  action: string;
  target: string | null;
  metadata: any;
  timestamp: string;
  hash: string;
  previous_hash: string | null;
  created_at: string;
}

export function toAuditLogResponse(log: AuditLog): AuditLogResponse {
  return {
    id: log.id,
    user_id: log.userId,
    username: log.username,
    action: log.action,
    target: log.target,
    metadata: log.metadata,
    timestamp: log.timestamp.toISOString(),
    hash: log.hash,
    previous_hash: log.previousHash,
    created_at: log.createdAt.toISOString(),
  };
}

export interface CreateAuditLogData {
  userId: number;
  username: string;
  action: string;
  target?: string | null;
  metadata?: any;
}


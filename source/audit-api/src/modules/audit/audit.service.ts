import { prisma } from '../../prisma/client.js';
import { GetAuditLogsQuery, CreateAuditLogData } from './audit.dto.js';
import { decodeCursor, getPaginationMeta, buildCursorWhere } from '../../common/utils/cursor-pagination.js';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';

export class AuditService {
  async getAuditLogs(query: GetAuditLogsQuery) {
    const limit = Math.min(query.limit || 50, 100);
    const sortBy = query.sortBy || 'timestamp';
    const sortOrder = query.sortOrder || 'desc';
    
    // Decode cursor if provided
    const cursorData = query.cursor ? decodeCursor(query.cursor) : null;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};
    
    if (query.user) where.username = query.user;
    if (query.action) where.action = query.action;
    if (query.dateFrom || query.dateTo) {
      where.timestamp = {};
      if (query.dateFrom) where.timestamp.gte = new Date(query.dateFrom);
      if (query.dateTo) where.timestamp.lte = new Date(query.dateTo);
    }

    // Apply cursor-based where clause
    const cursorWhere = buildCursorWhere(cursorData, sortBy, sortOrder);
    Object.assign(where, cursorWhere);

    // Build orderBy
    const orderBy: any = sortBy === 'id' 
      ? { id: sortOrder }
      : sortBy === 'createdAt'
      ? [{ createdAt: sortOrder }, { id: sortOrder }] // Compound sort for stability
      : [{ timestamp: sortOrder }, { id: sortOrder }]; // Compound sort for stability

    // Fetch limit + 1 to check if there are more items
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy,
      take: limit + 1,
    });

    // Get pagination meta
    const { data, nextCursor, hasMore } = getPaginationMeta(
      logs,
      limit,
      (log) => log.id,
      (log) => {
        if (sortBy === 'timestamp') return log.timestamp.toISOString();
        if (sortBy === 'createdAt') return log.createdAt.toISOString();
        return log.id;
      }
    );

    // Get total count (expensive, consider caching)
    const totalCount = await prisma.auditLog.count({ where });

    return { data, nextCursor, hasMore, totalCount };
  }

  async createAuditLog(data: CreateAuditLogData) {
    // Get previous hash
    const lastLog = await prisma.auditLog.findFirst({
      orderBy: { id: 'desc' },
      select: { hash: true },
    });

    const previousHash = lastLog?.hash || null;
    const timestamp = new Date();
    
    // Generate hash: SHA256(username|action|target|timestamp|previousHash)
    const hashData = `${data.username}|${data.action}|${data.target || 'null'}|${timestamp.toISOString()}|${previousHash || 'GENESIS'}`;
    const hash = crypto.createHash('sha256').update(hashData).digest('hex');

    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        username: data.username,
        action: data.action,
        target: data.target,
        metadata: data.metadata,
        timestamp,
        hash,
        previousHash,
      },
    });
  }

  async verifyIntegrity() {
    const logs = await prisma.auditLog.findMany({
      orderBy: { id: 'asc' },
    });

    if (logs.length === 0) {
      return { valid: true, message: 'No audit logs to verify' };
    }

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const previousHash = i > 0 ? logs[i - 1].hash : null;

      // Verify chain linkage
      if (log.previousHash !== previousHash) {
        return {
          valid: false,
          errorAt: log.id,
          message: `Chain broken at log ID ${log.id}: previous_hash mismatch`,
        };
      }

      // Recalculate and verify hash
      const hashData = `${log.username}|${log.action}|${log.target || 'null'}|${log.timestamp.toISOString()}|${previousHash || 'GENESIS'}`;
      const calculatedHash = crypto.createHash('sha256').update(hashData).digest('hex');

      if (calculatedHash !== log.hash) {
        return {
          valid: false,
          errorAt: log.id,
          message: `Tampering detected at log ID ${log.id}: hash mismatch`,
        };
      }
    }

    return { valid: true, message: 'Audit log integrity verified successfully' };
  }
}


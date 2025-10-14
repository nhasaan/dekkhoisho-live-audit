import { prisma } from '../../prisma/client.js';
import { EventIngestRequest, GetEventsQuery, RuleStatsResponse } from './events.dto.js';
import { decodeCursor, getPaginationMeta, buildCursorWhere } from '../../common/utils/cursor-pagination.js';
import { Prisma } from '@prisma/client';

export class EventsService {
  async ingestEvent(data: EventIngestRequest) {
    return prisma.event.create({
      data: {
        id: data.id,
        ts: new Date(data.ts),
        sourceIp: data.source_ip,
        path: data.path,
        method: data.method,
        service: data.service,
        ruleId: data.rule_id,
        ruleName: data.rule_name,
        severity: data.severity,
        action: data.action,
        latencyMs: data.latency_ms,
        country: data.country,
        env: data.env,
      },
    });
  }

  async getRecentEvents(query: GetEventsQuery) {
    const limit = Math.min(query.limit || 50, 100);
    const sortBy = query.sortBy || 'ts';
    const sortOrder = query.sortOrder || 'desc';
    
    // Decode cursor if provided
    const cursorData = query.cursor ? decodeCursor(query.cursor) : null;

    // Build where clause
    const where: Prisma.EventWhereInput = {};
    
    if (query.severity) where.severity = query.severity;
    if (query.rule_id) where.ruleId = query.rule_id;
    if (query.dateFrom || query.dateTo) {
      where.ts = {};
      if (query.dateFrom) where.ts.gte = new Date(query.dateFrom);
      if (query.dateTo) where.ts.lte = new Date(query.dateTo);
    }

    // Apply cursor-based where clause
    // For Event model, id is string, so we need special handling
    if (cursorData) {
      const operator = sortOrder === 'desc' ? 'lt' : 'gt';
      const cursorValue = cursorData.sortValue !== undefined ? cursorData.sortValue : cursorData.id;

      if (sortBy === 'ts' && cursorData.sortValue) {
        // Compound cursor: (ts < cursorValue) OR (ts = cursorValue AND id < cursorId)
        where.OR = [
          { ts: { [operator]: new Date(cursorValue) } },
          {
            AND: [
              { ts: new Date(cursorValue) },
              { id: { [operator]: cursorData.id } },
            ],
          },
        ];
      } else if (sortBy === 'createdAt' && cursorData.sortValue) {
        where.OR = [
          { createdAt: { [operator]: new Date(cursorValue) } },
          {
            AND: [
              { createdAt: new Date(cursorValue) },
              { id: { [operator]: cursorData.id } },
            ],
          },
        ];
      } else {
        where.id = { [operator]: cursorData.id };
      }
    }

    // Build orderBy - always include id for stability
    const orderBy: any = sortBy === 'createdAt'
      ? [{ createdAt: sortOrder }, { id: sortOrder }]
      : [{ ts: sortOrder }, { id: sortOrder }];

    // Fetch limit + 1 to check if there are more items
    const events = await prisma.event.findMany({
      where,
      orderBy,
      take: limit + 1,
    });

    // Get pagination meta
    const { data, nextCursor, hasMore } = getPaginationMeta(
      events,
      limit,
      (event) => event.id,
      (event) => {
        if (sortBy === 'ts') return event.ts.toISOString();
        if (sortBy === 'createdAt') return event.createdAt.toISOString();
        return event.id;
      }
    );

    // Get total count (consider caching this)
    const totalCount = await prisma.event.count({ where });

    return { data, nextCursor, hasMore, totalCount };
  }

  async getRuleStats(window: '15m' | '1h' | '24h' = '15m') {
    // Calculate time threshold
    const now = new Date();
    let threshold: Date;
    
    switch (window) {
      case '15m':
        threshold = new Date(now.getTime() - 15 * 60 * 1000);
        break;
      case '1h':
        threshold = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      default:
        threshold = new Date(now.getTime() - 15 * 60 * 1000);
    }

    // Get top rules from database
    const ruleStats = await prisma.event.groupBy({
      by: ['ruleId', 'ruleName'],
      where: {
        ts: {
          gte: threshold,
        },
      },
      _count: {
        _all: true,
      },
      _max: {
        ts: true,
      },
      orderBy: {
        _count: {
          _all: 'desc',
        },
      },
      take: 5,
    });

    return ruleStats.map((stat): RuleStatsResponse => ({
      rule_id: stat.ruleId,
      rule_name: stat.ruleName,
      count: stat._count._all,
      last_seen: stat._max.ts?.toISOString() || new Date().toISOString(),
    }));
  }
}


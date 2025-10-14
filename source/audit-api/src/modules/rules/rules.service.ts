import { prisma } from '../../prisma/client.js';
import { CreateRuleRequest, GetRulesQuery } from './rules.dto.js';
import { decodeCursor, getPaginationMeta } from '../../common/utils/cursor-pagination.js';
import { Prisma, RuleStatus } from '@prisma/client';

export class RulesService {
  async createRule(data: CreateRuleRequest, createdBy: number) {
    return prisma.rule.create({
      data: {
        name: data.name,
        description: data.description,
        pattern: data.pattern,
        severity: data.severity,
        status: 'draft',
        createdBy,
      },
    });
  }

  async getRules(query: GetRulesQuery) {
    const limit = Math.min(query.limit || 50, 100);
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    
    // Decode cursor if provided
    const cursorData = query.cursor ? decodeCursor(query.cursor) : null;

    // Build where clause
    const where: Prisma.RuleWhereInput = {};
    
    if (query.status) where.status = query.status;

    // Apply cursor-based where clause
    if (cursorData) {
      const operator = sortOrder === 'desc' ? 'lt' : 'gt';
      const cursorValue = cursorData.sortValue !== undefined ? cursorData.sortValue : cursorData.id;

      if (sortBy === 'createdAt' && cursorData.sortValue) {
        // Compound cursor
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

    // Build orderBy
    const orderBy: any = sortBy === 'createdAt'
      ? [{ createdAt: sortOrder }, { id: sortOrder }]
      : { id: sortOrder };

    // Fetch limit + 1
    const rules = await prisma.rule.findMany({
      where,
      orderBy,
      take: limit + 1,
    });

    // Get pagination meta
    const { data, nextCursor, hasMore } = getPaginationMeta(
      rules,
      limit,
      (rule) => rule.id,
      (rule) => {
        if (sortBy === 'createdAt') return rule.createdAt.toISOString();
        return rule.id;
      }
    );

    // Get total count
    const totalCount = await prisma.rule.count({ where });

    return { data, nextCursor, hasMore, totalCount };
  }

  async getRuleById(id: number) {
    return prisma.rule.findUnique({
      where: { id },
    });
  }

  async updateRuleStatus(id: number, status: RuleStatus) {
    return prisma.rule.update({
      where: { id },
      data: { status },
    });
  }
}


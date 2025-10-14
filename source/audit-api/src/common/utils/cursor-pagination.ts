export interface CursorPaginationParams {
  cursor?: string | null;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CursorData {
  id: number | string;
  sortValue?: any;
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Encode cursor with ID and optional sort value
 * Format: base64url(JSON.stringify({ id, sortValue }))
 */
export function encodeCursor(id: number | string, sortValue?: any): string {
  const cursorData: CursorData = { id };
  if (sortValue !== undefined) {
    cursorData.sortValue = sortValue;
  }
  return Buffer.from(JSON.stringify(cursorData)).toString('base64url');
}

/**
 * Decode cursor to get ID and sort value
 */
export function decodeCursor(cursor: string): CursorData {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Invalid cursor format');
  }
}

/**
 * Process pagination results and generate cursor metadata
 * @param items - Array of items (should fetch limit + 1)
 * @param limit - Requested limit
 * @param getIdFn - Function to extract ID from item
 * @param getSortValueFn - Optional function to extract sort value from item
 * @returns Paginated data with cursor info
 */
export function getPaginationMeta<T>(
  items: T[],
  limit: number,
  getIdFn: (item: T) => number | string,
  getSortValueFn?: (item: T) => any
): CursorPaginationResult<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  
  let nextCursor: string | null = null;
  if (hasMore && data.length > 0) {
    const lastItem = data[data.length - 1];
    const id = getIdFn(lastItem);
    const sortValue = getSortValueFn ? getSortValueFn(lastItem) : undefined;
    nextCursor = encodeCursor(id, sortValue);
  }

  return {
    data,
    nextCursor,
    hasMore,
  };
}

/**
 * Build Prisma where clause for cursor-based pagination
 * Supports sorting by different fields
 */
export function buildCursorWhere(
  cursor: CursorData | null,
  sortBy: string = 'id',
  sortOrder: 'asc' | 'desc' = 'desc'
): any {
  if (!cursor) return {};

  const operator = sortOrder === 'desc' ? 'lt' : 'gt';
  const cursorValue = cursor.sortValue !== undefined ? cursor.sortValue : cursor.id;

  // If sorting by a field other than ID, we need compound cursor
  if (sortBy !== 'id' && cursor.sortValue !== undefined) {
    // For compound cursor: (sortField < cursorValue) OR (sortField = cursorValue AND id < cursorId)
    return {
      OR: [
        { [sortBy]: { [operator]: cursorValue } },
        {
          AND: [
            { [sortBy]: cursorValue },
            { id: { [operator]: cursor.id } },
          ],
        },
      ],
    };
  }

  // Simple cursor based on ID
  return { id: { [operator]: cursor.id } };
}

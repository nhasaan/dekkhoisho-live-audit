import type { FastifyRequest, FastifyReply } from 'fastify';
import type { JWTPayload, UserRole } from '../types/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

/**
 * JWT Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authenticateJWT(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
    request.user = request.user as JWTPayload;
  } catch (error) {
    return reply.code(401).send({
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * RBAC middleware factory
 * Creates middleware that checks if user has required role
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        code: 'NO_USER',
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        details: {
          required_role: allowedRoles,
          current_role: request.user.role,
        },
      });
    }
  };
}

/**
 * Check if user is analyst or admin
 */
export const requireAnalyst = requireRole('analyst', 'admin');

/**
 * Check if user is admin
 */
export const requireAdmin = requireRole('admin');


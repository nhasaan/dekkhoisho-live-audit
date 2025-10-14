import type { FastifyRequest, FastifyReply } from 'fastify';
import type { JWTPayload } from '../../modules/auth/auth.dto.js';

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
      status: 'FAILED',
      message: 'Unauthorized',
      data: null,
      error: {
        code: 'invalid_token',
        description: 'Invalid or expired token',
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: request.id,
      },
    });
  }
}

/**
 * RBAC middleware factory
 * Creates middleware that checks if user has required role
 */
export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.code(401).send({
        status: 'FAILED',
        message: 'Unauthorized',
        data: null,
        error: {
          code: 'no_user',
          description: 'User information not found in request',
        },
        meta: {
          timestamp: new Date().toISOString(),
          request_id: request.id,
        },
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({
        status: 'FAILED',
        message: 'Insufficient permissions',
        data: null,
        error: {
          code: 'forbidden',
          description: 'You do not have permission to access this resource',
          details: {
            required_role: allowedRoles,
            current_role: request.user.role,
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          request_id: request.id,
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


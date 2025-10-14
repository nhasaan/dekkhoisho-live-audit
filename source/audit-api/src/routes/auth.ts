import type { FastifyInstance } from 'fastify';
import type { LoginRequest, LoginResponse, JWTPayload } from '../types/index.js';
import { verifyPassword } from '../utils/auth.js';

export async function authRoutes(server: FastifyInstance) {
  // POST /auth/login
  server.post<{ Body: LoginRequest; Reply: LoginResponse | { error: string } }>(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { username, password } = request.body;

      try {
        // Find user
        const user = await server.db.getUserByUsername(username);
        
        if (!user) {
          // Log failed login attempt
          server.log.warn(`Login failed: user not found - ${username}`);
          return reply.code(401).send({
            error: 'Invalid credentials',
          });
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password_hash);
        
        if (!isValid) {
          server.log.warn(`Login failed: invalid password - ${username}`);
          return reply.code(401).send({
            error: 'Invalid credentials',
          });
        }

        // Generate JWT token
        const payload: JWTPayload = {
          id: user.id,
          username: user.username,
          role: user.role,
        };
        
        const token = server.jwt.sign(payload);

        // Log successful login (audit log)
        await server.audit.log(payload, 'LOGIN', null, {
          ip: request.ip,
        });

        server.log.info(`User logged in: ${username} (${user.role})`);

        return {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
        };
      } catch (error) {
        server.log.error('Login error:', error);
        return reply.code(500).send({
          error: 'Internal server error',
        });
      }
    }
  );
}


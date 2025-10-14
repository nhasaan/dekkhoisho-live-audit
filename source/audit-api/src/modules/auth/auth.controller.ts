import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';
import { AuditService } from '../audit/audit.service.js';
import { LoginRequest, LoginResponse, toUserResponse, JWTPayload } from './auth.dto.js';
import { ResponseBuilder } from '../../common/types/api-response.js';

export class AuthController {
  private authService: AuthService;
  private auditService: AuditService;

  constructor() {
    this.authService = new AuthService();
    this.auditService = new AuditService();
  }

  async login(
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply
  ) {
    const startTime = Date.now();

    try {
      const { username, password } = request.body;

      // Validate user credentials
      const user = await this.authService.validateUser(username, password);

      if (!user) {
        request.log.warn(`Login failed for user: ${username}`);
        
        const response = ResponseBuilder.error(
          'Invalid credentials',
          {
            code: 'invalid_credentials',
            description: 'The username or password you entered is incorrect',
          },
          {
            request_id: request.id,
            duration_ms: Date.now() - startTime,
          }
        );

        return reply.code(401).send(response);
      }

      // Generate JWT token
      const payload: JWTPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
      };

      const token = request.server.jwt.sign(payload);

      // Create audit log for successful login
      await this.auditService.createAuditLog({
        userId: user.id,
        username: user.username,
        action: 'LOGIN',
        metadata: {
          ip: request.ip,
          user_agent: request.headers['user-agent'],
        },
      });

      request.log.info(`User logged in: ${username} (${user.role})`);

      const response = ResponseBuilder.success<LoginResponse>(
        'Login successful',
        {
          token,
          user: toUserResponse(user),
        },
        {
          request_id: request.id,
          duration_ms: Date.now() - startTime,
        }
      );

      return reply.code(200).send(response);
    } catch (error: any) {
      request.log.error(error);
      
      const response = ResponseBuilder.error(
        'Login failed',
        {
          code: 'login_error',
          description: error.message,
        },
        {
          request_id: request.id,
          duration_ms: Date.now() - startTime,
        },
        process.env.NODE_ENV !== 'production' ? {
          error_details: error.message,
          request_path: request.url,
          request_method: request.method,
          environment: process.env.NODE_ENV || 'development',
          debug_mode: true,
        } : undefined
      );

      return reply.code(500).send(response);
    }
  }
}


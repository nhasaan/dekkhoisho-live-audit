import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller.js';

export async function authRoutes(server: FastifyInstance) {
  const controller = new AuthController();

  // POST /auth/login - Authenticate user and get JWT token
  server.post(
    '/login',
    {
      schema: {
        description: 'Authenticate user and receive JWT token',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', minLength: 1 },
            password: { type: 'string', minLength: 1 },
          },
        },
        response: {
          200: {
            description: 'Successful authentication',
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['SUCCESS'] },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      username: { type: 'string' },
                      role: { type: 'string' },
                    },
                  },
                },
              },
              meta: { type: 'object' },
            },
          },
          401: {
            description: 'Authentication failed',
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['FAILED'] },
              message: { type: 'string' },
              error: { type: 'object' },
            },
          },
        },
      },
    },
    controller.login.bind(controller)
  );
}


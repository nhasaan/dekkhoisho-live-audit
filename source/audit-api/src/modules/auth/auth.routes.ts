import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller.js';

export async function authRoutes(server: FastifyInstance) {
  const controller = new AuthController();

  // POST /auth/login - Authenticate user and get JWT token
  server.post('/login', controller.login.bind(controller));
}


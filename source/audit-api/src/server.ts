import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { config } from './config/index.js';
import { prisma } from './prisma/client.js';
import { RedisService } from './services/redis.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { eventRoutes } from './modules/events/events.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { ruleRoutes } from './modules/rules/rules.routes.js';
import type { WebSocket } from 'ws';
import type { JWTPayload } from './modules/auth/auth.dto.js';

// Augment Fastify instance with custom properties
declare module 'fastify' {
  interface FastifyInstance {
    redis: RedisService;
    websocketClients: Set<WebSocket>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: JWTPayload;
  }
}

// Create Fastify server with logging
const server = Fastify({
  logger: {
    level: config.logging.level,
    transport: config.logging.prettyPrint
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  },
  genReqId: () => {
    return crypto.randomUUID();
  },
});

// Initialize services
const redis = new RedisService(config.redis.url);

// Attach services to server instance
server.decorate('redis', redis);
server.decorate('websocketClients', new Set<WebSocket>());

// Register plugins
async function registerPlugins() {
  // CORS
  await server.register(cors, {
    origin: config.cors.origin,
    credentials: true,
  });

  // Security headers
  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
  });

  // JWT
  await server.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiration,
    },
  });

  // WebSocket
  await server.register(websocket, {
    options: {
      clientTracking: true,
    },
  });
}

// WebSocket route for live event streaming
function registerWebSocket() {
  server.register(async (fastify) => {
    fastify.get(
      '/ws/events',
      { websocket: true },
      (socket, req) => {

        // Verify JWT token from query parameter
        const token = (req.query as any).token;
        if (!token) {
          socket.close(1008, 'Token required');
          return;
        }

        try {
          server.jwt.verify(token);
        } catch (error) {
          socket.close(1008, 'Invalid token');
          return;
        }

        // Add client to tracking set
        server.websocketClients.add(socket);
        server.log.info(`WebSocket client connected (total: ${server.websocketClients.size})`);

        // Send connected message
        socket.send(
          JSON.stringify({
            type: 'connected',
            message: 'WebSocket connection established',
            clientId: crypto.randomUUID(),
          })
        );

        // Handle client messages
        socket.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'ping') {
              socket.send(JSON.stringify({ type: 'pong' }));
            }
            
            // Handle subscribe with filters
            if (message.type === 'subscribe') {
              server.log.debug('Client subscribed with filters:', message.filters);
              // TODO: Implement per-client filtering
            }
          } catch (error) {
            server.log.error({ error }, 'WebSocket message error');
          }
        });

        // Handle disconnect
        socket.on('close', () => {
          server.websocketClients.delete(socket);
          server.log.info(`WebSocket client disconnected (remaining: ${server.websocketClients.size})`);
        });

        // Handle errors
        socket.on('error', (error: Error) => {
          server.log.error({ error }, 'WebSocket error');
          server.websocketClients.delete(socket);
        });
      }
    );
  });
}

// Register routes
async function registerRoutes() {
  // Health check endpoint
  server.get('/health', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const dbHealthy = true;
      const redisHealthy = await redis.healthCheck();

      return {
        status: dbHealthy && redisHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.server.env,
        services: {
          database: dbHealthy ? 'connected' : 'disconnected',
          redis: redisHealthy ? 'connected' : 'disconnected',
        },
      };
    } catch (error) {
      return reply.code(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          redis: 'unknown',
        },
      });
    }
  });

  // API info endpoint
  server.get('/', async (request, reply) => {
    return {
      name: 'Bitsmedia Live Audit API',
      version: '1.0.0',
      description: 'Security event ingestion and audit system with RBAC',
      endpoints: {
        health: '/health',
        auth: '/auth',
        events: '/events',
        audit: '/audit',
        rules: '/rules',
        websocket: `ws://${config.server.host}:${config.server.port}/ws/events`,
      },
    };
  });

  // Register module routes
  await server.register(authRoutes, { prefix: '/auth' });
  await server.register(eventRoutes, { prefix: '/events' });
  await server.register(auditRoutes, { prefix: '/audit' });
  await server.register(ruleRoutes, { prefix: '/rules' });
}

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  server.log.info(`Received ${signal}, shutting down gracefully...`);

  try {
    // Close WebSocket connections
    server.websocketClients.forEach((socket) => {
      socket.close(1000, 'Server shutting down');
    });

    // Close server
    await server.close();

    // Close Prisma connection
    await prisma.$disconnect();

    // Close Redis connection
    await redis.disconnect();

    server.log.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    server.log.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
}

// Start server
async function start() {
  try {
    server.log.info('🚀 Starting Bitsmedia Live Audit API...');

    // Connect to Prisma
    await prisma.$connect();
    server.log.info('✅ Database connected (Prisma)');

    // Connect to Redis
    await redis.connect(server.log);

    // Start cleanup interval for Redis stats (every 5 minutes)
    setInterval(async () => {
      await redis.cleanupStats();
    }, 5 * 60 * 1000);

    // Register plugins
    await registerPlugins();

    // Register WebSocket
    registerWebSocket();

    // Register routes
    await registerRoutes();

    // Start server
    await server.listen({
      host: config.server.host,
      port: config.server.port,
    });

    server.log.info(`✅ Server running at http://${config.server.host}:${config.server.port}`);
    server.log.info(`🔌 WebSocket available at ws://${config.server.host}:${config.server.port}/ws/events`);
    server.log.info(`📊 Environment: ${config.server.env}`);

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    server.log.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
start();

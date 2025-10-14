import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { config } from './config/index.js';
import { DatabaseService } from './database/index.js';
import { RedisService } from './services/redis.js';
import { AuditService } from './services/audit.js';
import { authRoutes } from './routes/auth.js';
import { eventRoutes } from './routes/events.js';
import { auditRoutes } from './routes/audit.js';
import { ruleRoutes } from './routes/rules.js';
import type { WebSocket } from 'ws';

// Augment Fastify instance with custom properties
declare module 'fastify' {
  interface FastifyInstance {
    db: DatabaseService;
    redis: RedisService;
    audit: AuditService;
    websocketClients: Set<WebSocket>;
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
});

// Initialize services
const db = new DatabaseService(config.database.url);
const redis = new RedisService(config.redis.url);
const audit = new AuditService(db);

// Attach services to server instance
server.decorate('db', db);
server.decorate('redis', redis);
server.decorate('audit', audit);
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

// WebSocket route
function registerWebSocket() {
  server.register(async (fastify) => {
    fastify.get(
      '/ws/events',
      { websocket: true },
      (connection, req) => {
        const { socket } = connection;

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
        server.log.info('WebSocket client connected');

        // Send connected message
        socket.send(
          JSON.stringify({
            type: 'connected',
            message: 'WebSocket connection established',
            clientId: Math.random().toString(36).substring(7),
          })
        );

        // Handle client messages
        socket.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'ping') {
              socket.send(JSON.stringify({ type: 'pong' }));
            }
            
            // Handle subscribe with filters (future enhancement)
            if (message.type === 'subscribe') {
              server.log.debug('Client subscribed with filters:', message.filters);
            }
          } catch (error) {
            server.log.error('WebSocket message error:', error);
          }
        });

        // Handle disconnect
        socket.on('close', () => {
          server.websocketClients.delete(socket);
          server.log.info('WebSocket client disconnected');
        });

        // Handle errors
        socket.on('error', (error) => {
          server.log.error('WebSocket error:', error);
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
    const dbHealthy = await db.healthCheck();
    const redisHealthy = await redis.healthCheck();

    return {
      status: dbHealthy && redisHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.env,
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
      },
    };
  });

  // API info endpoint
  server.get('/', async (request, reply) => {
    return {
      name: 'Bitsmedia Live Audit API',
      version: '1.0.0',
      description: 'Security event ingestion and audit system with RBAC',
      endpoints: {
        health: '/health',
        auth: '/auth/login',
        events: '/events',
        audit: '/audit',
        rules: '/rules',
        websocket: `ws://${config.server.host}:${config.server.port}/ws`,
      },
    };
  });

  // Register route modules
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

    // Close database and redis connections
    await db.close();
    await redis.disconnect();

    server.log.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    server.log.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Start server
async function start() {
  try {
    server.log.info('🚀 Starting Bitsmedia Live Audit API...');

    // Initialize database
    await db.initialize(server.log);

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
    server.log.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
start();


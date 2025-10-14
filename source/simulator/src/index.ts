import axios from 'axios';
import pino from 'pino';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5001';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '500', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Logger configuration
const logger = pino({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  transport: NODE_ENV === 'production' ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
});

// Data pools for random generation
const DATA_POOLS = {
  sourceIps: [
    '203.0.113.45',
    '198.51.100.23',
    '192.0.2.89',
    '203.0.113.156',
    '198.51.100.78',
    '192.0.2.234',
    '203.0.113.210',
    '198.51.100.145',
    '192.0.2.67',
    '203.0.113.99',
  ],
  paths: [
    '/api/login',
    '/api/users',
    '/api/users/profile',
    '/api/payment/process',
    '/admin/config',
    '/admin/users',
    '/api/products',
    '/api/orders',
    '/api/auth/reset-password',
    '/api/data/export',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const,
  services: [
    'auth-service',
    'api-gateway',
    'payment-service',
    'user-service',
    'admin-service',
    'product-service',
    'order-service',
    'notification-service',
  ],
  rules: [
    { id: 'CADE-00123', name: 'SQL Injection Attempt' },
    { id: 'CADE-00124', name: 'Brute Force Login' },
    { id: 'CADE-00125', name: 'XSS Attempt' },
    { id: 'CADE-00126', name: 'Path Traversal Attack' },
    { id: 'CADE-00127', name: 'API Rate Limit Exceeded' },
    { id: 'CADE-00128', name: 'Suspicious File Upload' },
    { id: 'CADE-00129', name: 'Command Injection' },
    { id: 'CADE-00130', name: 'Authentication Bypass Attempt' },
  ],
  severities: ['low', 'medium', 'high', 'critical'] as const,
  actions: ['allowed', 'blocked'] as const,
  countries: ['SG', 'US', 'CN', 'IN', 'JP', 'GB', 'DE', 'FR', 'AU', 'BR'],
  environments: ['dev', 'staging', 'prod'] as const,
};

// Helper: Get random item from array
function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper: Generate random latency (realistic distribution)
function randomLatency(): number {
  // Most requests are fast (50-200ms), some are slower
  const base = Math.random() < 0.8 ? 50 + Math.random() * 150 : 200 + Math.random() * 800;
  return Math.floor(base);
}

// Event counter
let eventCounter = 1;

// Generate a random security event
function generateEvent() {
  const rule = randomItem(DATA_POOLS.rules);

  return {
    id: `evt_${eventCounter++}`,
    ts: new Date().toISOString(),
    source_ip: randomItem(DATA_POOLS.sourceIps),
    path: randomItem(DATA_POOLS.paths),
    method: randomItem(DATA_POOLS.methods),
    service: randomItem(DATA_POOLS.services),
    rule_id: rule.id,
    rule_name: rule.name,
    severity: randomItem(DATA_POOLS.severities),
    action: randomItem(DATA_POOLS.actions),
    latency_ms: randomLatency(),
    country: randomItem(DATA_POOLS.countries),
    env: randomItem(DATA_POOLS.environments),
  };
}

// Send event to API
async function sendEvent(event: any): Promise<boolean> {
  try {
    const response = await axios.post(`${API_URL}/events/ingest`, event, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 201) {
      logger.info(
        {
          eventId: event.id,
          ruleId: event.rule_id,
          ruleName: event.rule_name,
          severity: event.severity,
          action: event.action,
        },
        'Event sent successfully'
      );
      return true;
    } else {
      logger.warn({ status: response.status, eventId: event.id }, 'Unexpected response status');
      return false;
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      logger.error('Connection refused - API server not available');
    } else if (error.response) {
      logger.error(
        {
          status: error.response.status,
          data: error.response.data,
          eventId: event.id,
        },
        'API error response'
      );
    } else {
      logger.error({ error: error.message, eventId: event.id }, 'Failed to send event');
    }
    return false;
  }
}

// Main simulation loop
async function startSimulation() {
  logger.info('🚀 Starting security event simulator...');
  logger.info(`📡 API URL: ${API_URL}`);
  logger.info(`⏱️  Interval: ${INTERVAL_MS}ms`);
  logger.info(`📊 Environment: ${NODE_ENV}`);

  // Wait for API to be ready
  logger.info('⏳ Waiting for API to be ready...');
  let apiReady = false;
  let retries = 0;
  const maxRetries = 30;

  while (!apiReady && retries < maxRetries) {
    try {
      await axios.get(`${API_URL}/health`, { timeout: 2000 });
      apiReady = true;
      logger.info('✅ API is ready');
    } catch (error) {
      retries++;
      logger.debug(`API not ready, retrying... (${retries}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (!apiReady) {
    logger.error('❌ API failed to become ready, exiting');
    process.exit(1);
  }

  // Start continuous event generation
  logger.info('✨ Simulation started - generating events...');

  setInterval(async () => {
    const event = generateEvent();
    await sendEvent(event);
  }, INTERVAL_MS);
}

// Graceful shutdown
function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down...`);
  logger.info(`📈 Total events generated: ${eventCounter - 1}`);
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the simulator
startSimulation().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});


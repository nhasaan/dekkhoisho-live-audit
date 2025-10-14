import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User,
  SecurityEvent,
  AuditLog,
  Rule,
  PaginatedEventsResponse,
  PaginatedAuditLogsResponse,
  PaginatedRulesResponse,
} from '../types/index.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseService {
  private pool: Pool;
  private initialized = false;

  constructor(databaseUrl: string) {
    this.pool = new Pool({
      connectionString: databaseUrl,
    });
  }

  async initialize(logger: any): Promise<void> {
    if (this.initialized) return;

    try {
      // Test connection
      const client = await this.pool.connect();
      logger.info('📦 Database connected successfully');

      // Read and execute schema
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      
      await client.query(schema);
      logger.info('✅ Database schema initialized');

      client.release();
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // User methods
  async getUserByUsername(username: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Event methods
  async insertEvent(event: SecurityEvent): Promise<void> {
    await this.pool.query(
      `INSERT INTO events (
        id, ts, source_ip, path, method, service, 
        rule_id, rule_name, severity, action, 
        latency_ms, country, env
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO NOTHING`,
      [
        event.id,
        event.ts,
        event.source_ip,
        event.path,
        event.method,
        event.service,
        event.rule_id,
        event.rule_name,
        event.severity,
        event.action,
        event.latency_ms,
        event.country,
        event.env,
      ]
    );
  }

  async getRecentEvents(
    page: number = 1,
    limit: number = 50,
    filters?: {
      severity?: string;
      rule_id?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<PaginatedEventsResponse> {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters) {
      const conditions: string[] = [];
      
      if (filters.severity) {
        conditions.push(`severity = $${paramIndex++}`);
        params.push(filters.severity);
      }
      
      if (filters.rule_id) {
        conditions.push(`rule_id = $${paramIndex++}`);
        params.push(filters.rule_id);
      }
      
      if (filters.dateFrom) {
        conditions.push(`ts >= $${paramIndex++}`);
        params.push(filters.dateFrom);
      }
      
      if (filters.dateTo) {
        conditions.push(`ts <= $${paramIndex++}`);
        params.push(filters.dateTo);
      }
      
      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
    }

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM events ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get events
    params.push(limit, offset);
    const eventsResult = await this.pool.query(
      `SELECT * FROM events ${whereClause} 
       ORDER BY ts DESC 
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return {
      events: eventsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Audit log methods
  async getLastAuditHash(): Promise<string | null> {
    const result = await this.pool.query(
      'SELECT hash FROM audit_logs ORDER BY id DESC LIMIT 1'
    );
    return result.rows[0]?.hash || null;
  }

  async insertAuditLog(audit: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const result = await this.pool.query(
      `INSERT INTO audit_logs (
        user_id, username, action, target, metadata, 
        timestamp, hash, previous_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        audit.user_id,
        audit.username,
        audit.action,
        audit.target,
        audit.metadata ? JSON.stringify(audit.metadata) : null,
        audit.timestamp,
        audit.hash,
        audit.previous_hash,
      ]
    );
    return result.rows[0];
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    filters?: {
      user?: string;
      action?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<PaginatedAuditLogsResponse> {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters) {
      const conditions: string[] = [];
      
      if (filters.user) {
        conditions.push(`username = $${paramIndex++}`);
        params.push(filters.user);
      }
      
      if (filters.action) {
        conditions.push(`action = $${paramIndex++}`);
        params.push(filters.action);
      }
      
      if (filters.dateFrom) {
        conditions.push(`timestamp >= $${paramIndex++}`);
        params.push(filters.dateFrom);
      }
      
      if (filters.dateTo) {
        conditions.push(`timestamp <= $${paramIndex++}`);
        params.push(filters.dateTo);
      }
      
      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
    }

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get logs
    params.push(limit, offset);
    const logsResult = await this.pool.query(
      `SELECT * FROM audit_logs ${whereClause} 
       ORDER BY timestamp DESC 
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    const logs = logsResult.rows.map(row => ({
      ...row,
      timestamp: row.timestamp.toISOString(),
    }));

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Rule methods
  async createRule(rule: Omit<Rule, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Rule> {
    const result = await this.pool.query(
      `INSERT INTO rules (name, description, pattern, severity, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [rule.name, rule.description, rule.pattern, rule.severity, rule.created_by]
    );
    return result.rows[0];
  }

  async getRuleById(id: number): Promise<Rule | null> {
    const result = await this.pool.query(
      'SELECT * FROM rules WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async updateRuleStatus(id: number, status: string): Promise<Rule | null> {
    const result = await this.pool.query(
      `UPDATE rules 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  }

  async getRules(
    page: number = 1,
    limit: number = 50,
    status?: string
  ): Promise<PaginatedRulesResponse> {
    const offset = (page - 1) * limit;
    let whereClause = status ? 'WHERE status = $1' : '';
    const params: any[] = status ? [status] : [];

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM rules ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get rules
    const paramIndex = params.length + 1;
    params.push(limit, offset);
    const rulesResult = await this.pool.query(
      `SELECT * FROM rules ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const rules = rulesResult.rows.map(row => ({
      ...row,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    }));

    return {
      rules,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }
}


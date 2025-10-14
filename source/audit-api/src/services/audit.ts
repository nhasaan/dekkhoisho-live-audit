import crypto from 'crypto';
import type { DatabaseService } from '../database/index.js';
import type { AuditAction, JWTPayload } from '../types/index.js';

export class AuditService {
  constructor(private db: DatabaseService) {}

  /**
   * Generate SHA-256 hash for audit log entry
   * Hash = SHA256(username + action + target + timestamp + previous_hash)
   */
  private generateHash(
    username: string,
    action: string,
    target: string | null,
    timestamp: Date,
    previousHash: string | null
  ): string {
    const data = `${username}|${action}|${target || 'null'}|${timestamp.toISOString()}|${previousHash || 'GENESIS'}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create an audit log entry with hash chain
   */
  async log(
    user: JWTPayload,
    action: AuditAction,
    target: string | null = null,
    metadata: Record<string, any> | null = null
  ): Promise<void> {
    try {
      // Get the previous hash from the last audit entry
      const previousHash = await this.db.getLastAuditHash();

      // Create timestamp
      const timestamp = new Date();

      // Generate hash for this entry
      const hash = this.generateHash(
        user.username,
        action,
        target,
        timestamp,
        previousHash
      );

      // Insert audit log
      await this.db.insertAuditLog({
        user_id: user.id,
        username: user.username,
        action,
        target,
        metadata,
        timestamp,
        hash,
        previous_hash: previousHash,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }

  /**
   * Verify the integrity of the audit log chain
   */
  async verifyChainIntegrity(): Promise<{
    valid: boolean;
    errorAt?: number;
    message: string;
  }> {
    try {
      // Get all audit logs in order
      const result = await this.db.getAuditLogs(1, 10000); // Get all logs
      const logs = result.logs;

      if (logs.length === 0) {
        return { valid: true, message: 'No audit logs to verify' };
      }

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        const previousHash = i > 0 ? logs[i - 1].hash : null;

        // Verify chain linkage
        if (log.previous_hash !== previousHash) {
          return {
            valid: false,
            errorAt: log.id,
            message: `Chain broken at log ID ${log.id}: previous_hash mismatch`,
          };
        }

        // Recalculate hash
        const calculatedHash = this.generateHash(
          log.username,
          log.action,
          log.target,
          new Date(log.timestamp),
          previousHash
        );

        // Verify hash
        if (calculatedHash !== log.hash) {
          return {
            valid: false,
            errorAt: log.id,
            message: `Tampering detected at log ID ${log.id}: hash mismatch`,
          };
        }
      }

      return { valid: true, message: 'Audit log integrity verified' };
    } catch (error) {
      return {
        valid: false,
        message: `Verification failed: ${error}`,
      };
    }
  }
}


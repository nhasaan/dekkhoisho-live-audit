import { createClient, RedisClientType } from 'redis';
import type { RuleStatsResponse } from '../modules/events/events.dto.js';

export class RedisService {
  private client: RedisClientType;
  private connected = false;

  constructor(redisUrl: string) {
    this.client = createClient({ url: redisUrl });
    
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  async connect(logger: any): Promise<void> {
    if (this.connected) return;

    try {
      await this.client.connect();
      this.connected = true;
      logger.info('📦 Redis connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }

  // Increment rule counter with 15-minute TTL
  async incrementRuleCount(ruleId: string, ruleName: string): Promise<void> {
    const key = `rule:count:${ruleId}`;
    const multi = this.client.multi();
    
    // Increment counter
    multi.incr(key);
    
    // Set expiry to 15 minutes (900 seconds)
    multi.expire(key, 900);
    
    // Add to sorted set for top rules
    await multi.exec();
    
    // Update sorted set with rule name
    const count = await this.client.get(key);
    if (count) {
      await this.client.zAdd('stats:top_rules', {
        score: parseInt(count, 10),
        value: `${ruleId}|${ruleName}`,
      });
    }
  }

  // Get top N rules
  async getTopRules(limit: number = 5): Promise<RuleStatsResponse[]> {
    try {
      const results = await this.client.zRangeWithScores('stats:top_rules', 0, limit - 1, {
        REV: true,
      });

      return results.map((result) => {
        const [ruleId, ruleName] = result.value.split('|');
        return {
          rule_id: ruleId,
          rule_name: ruleName,
          count: result.score,
          last_seen: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Error getting top rules:', error);
      return [];
    }
  }

  // Clean up expired entries from sorted set
  async cleanupStats(): Promise<void> {
    try {
      const allRules = await this.client.zRange('stats:top_rules', 0, -1);
      
      for (const rule of allRules) {
        const [ruleId] = rule.split('|');
        const key = `rule:count:${ruleId}`;
        const exists = await this.client.exists(key);
        
        if (!exists) {
          // Remove from sorted set if counter expired
          await this.client.zRem('stats:top_rules', rule);
        }
      }
    } catch (error) {
      console.error('Error cleaning up stats:', error);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}


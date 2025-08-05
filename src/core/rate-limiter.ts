import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { Config } from './config';
import { Logger } from './logger';

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  maxTokens: number;
  refillRate: number; // tokens per second
  windowMs: number;
  burstAllowance?: number;
}

/**
 * Rate limiter statistics
 */
export interface RateLimiterStats {
  currentTokens: number;
  maxTokens: number;
  refillRate: number;
  totalRequests: number;
  allowedRequests: number;
  rejectedRequests: number;
  lastRefillTime: Date;
}

/**
 * Token bucket rate limiter implementation
 */
@injectable()
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private totalRequests: number = 0;
  private allowedRequests: number = 0;
  private rejectedRequests: number = 0;

  constructor(
    @inject(TYPES.Config) private config: Config,
    @inject(TYPES.Logger) private logger: Logger,
    private rateLimiterConfig: RateLimiterConfig,
    private identifier: string = 'default'
  ) {
    this.tokens = rateLimiterConfig.maxTokens;
    this.lastRefillTime = Date.now();
  }

  /**
   * Attempt to consume tokens from the bucket
   */
  async consume(tokens: number = 1): Promise<boolean> {
    this.totalRequests++;
    this.refillTokens();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      this.allowedRequests++;
      
      this.logger.debug(`Rate limiter ${this.identifier}: consumed ${tokens} tokens`, {
        remainingTokens: this.tokens,
        maxTokens: this.rateLimiterConfig.maxTokens
      });
      
      return true;
    }

    this.rejectedRequests++;
    this.logger.warn(`Rate limiter ${this.identifier}: request rejected`, {
      requestedTokens: tokens,
      availableTokens: this.tokens,
      maxTokens: this.rateLimiterConfig.maxTokens
    });

    return false;
  }

  /**
   * Check if tokens are available without consuming them
   */
  canConsume(tokens: number = 1): boolean {
    this.refillTokens();
    return this.tokens >= tokens;
  }

  /**
   * Get current rate limiter statistics
   */
  getStats(): RateLimiterStats {
    this.refillTokens();
    
    return {
      currentTokens: this.tokens,
      maxTokens: this.rateLimiterConfig.maxTokens,
      refillRate: this.rateLimiterConfig.refillRate,
      totalRequests: this.totalRequests,
      allowedRequests: this.allowedRequests,
      rejectedRequests: this.rejectedRequests,
      lastRefillTime: new Date(this.lastRefillTime)
    };
  }

  /**
   * Reset the rate limiter to initial state
   */
  reset(): void {
    this.tokens = this.rateLimiterConfig.maxTokens;
    this.lastRefillTime = Date.now();
    this.totalRequests = 0;
    this.allowedRequests = 0;
    this.rejectedRequests = 0;
    
    this.logger.info(`Rate limiter ${this.identifier} reset`);
  }

  /**
   * Get time until next token is available
   */
  getTimeUntilNextToken(): number {
    if (this.tokens > 0) {
      return 0;
    }

    const tokensNeeded = 1;
    const timePerToken = 1000 / this.rateLimiterConfig.refillRate; // ms per token
    return Math.ceil(tokensNeeded * timePerToken);
  }

  /**
   * Get time until specified number of tokens are available
   */
  getTimeUntilTokens(tokensNeeded: number): number {
    this.refillTokens();
    
    if (this.tokens >= tokensNeeded) {
      return 0;
    }

    const tokensToWait = tokensNeeded - this.tokens;
    const timePerToken = 1000 / this.rateLimiterConfig.refillRate; // ms per token
    return Math.ceil(tokensToWait * timePerToken);
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const timeSinceLastRefill = now - this.lastRefillTime;
    
    if (timeSinceLastRefill <= 0) {
      return;
    }

    const tokensToAdd = Math.floor((timeSinceLastRefill / 1000) * this.rateLimiterConfig.refillRate);
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.rateLimiterConfig.maxTokens, this.tokens + tokensToAdd);
      this.lastRefillTime = now;
    }
  }
}

/**
 * Multi-source quota manager for tracking API usage across different sources
 */
@injectable()
export class QuotaManager {
  private quotas: Map<string, QuotaTracker> = new Map();

  constructor(
    @inject(TYPES.Config) private config: Config,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * Register a new quota tracker for an API source
   */
  registerQuota(
    sourceId: string, 
    dailyLimit: number, 
    hourlyLimit?: number, 
    minuteLimit?: number
  ): void {
    const tracker = new QuotaTracker(sourceId, dailyLimit, hourlyLimit, minuteLimit);
    this.quotas.set(sourceId, tracker);
    
    this.logger.info(`Registered quota for ${sourceId}`, {
      dailyLimit,
      hourlyLimit,
      minuteLimit
    });
  }

  /**
   * Check if a request can be made within quota limits
   */
  canMakeRequest(sourceId: string, cost: number = 1): boolean {
    const tracker = this.quotas.get(sourceId);
    if (!tracker) {
      this.logger.warn(`No quota tracker found for ${sourceId}`);
      return true; // Allow if no quota is configured
    }

    return tracker.canConsume(cost);
  }

  /**
   * Record a request against the quota
   */
  recordRequest(sourceId: string, cost: number = 1): boolean {
    const tracker = this.quotas.get(sourceId);
    if (!tracker) {
      this.logger.warn(`No quota tracker found for ${sourceId}`);
      return true;
    }

    const success = tracker.consume(cost);
    
    if (!success) {
      this.logger.warn(`Quota exceeded for ${sourceId}`, {
        cost,
        stats: tracker.getStats()
      });
    }

    return success;
  }

  /**
   * Get quota statistics for a source
   */
  getQuotaStats(sourceId: string): QuotaStats | null {
    const tracker = this.quotas.get(sourceId);
    return tracker ? tracker.getStats() : null;
  }

  /**
   * Get all quota statistics
   */
  getAllQuotaStats(): Record<string, QuotaStats> {
    const stats: Record<string, QuotaStats> = {};
    
    for (const [sourceId, tracker] of this.quotas) {
      stats[sourceId] = tracker.getStats();
    }

    return stats;
  }

  /**
   * Reset quotas for a specific source
   */
  resetQuota(sourceId: string): void {
    const tracker = this.quotas.get(sourceId);
    if (tracker) {
      tracker.reset();
      this.logger.info(`Reset quota for ${sourceId}`);
    }
  }

  /**
   * Reset all quotas
   */
  resetAllQuotas(): void {
    for (const [sourceId, tracker] of this.quotas) {
      tracker.reset();
    }
    this.logger.info('Reset all quotas');
  }
}

/**
 * Individual quota tracker for time-based limits
 */
export class QuotaTracker {
  private dailyUsage: number = 0;
  private hourlyUsage: number = 0;
  private minuteUsage: number = 0;
  
  private dailyResetTime: number;
  private hourlyResetTime: number;
  private minuteResetTime: number;

  constructor(
    private sourceId: string,
    private dailyLimit: number,
    private hourlyLimit?: number,
    private minuteLimit?: number
  ) {
    const now = Date.now();
    this.dailyResetTime = this.getNextDayReset(now);
    this.hourlyResetTime = this.getNextHourReset(now);
    this.minuteResetTime = this.getNextMinuteReset(now);
  }

  /**
   * Check if consumption is within limits
   */
  canConsume(cost: number): boolean {
    this.resetCountersIfNeeded();

    if (this.dailyUsage + cost > this.dailyLimit) {
      return false;
    }

    if (this.hourlyLimit && this.hourlyUsage + cost > this.hourlyLimit) {
      return false;
    }

    if (this.minuteLimit && this.minuteUsage + cost > this.minuteLimit) {
      return false;
    }

    return true;
  }

  /**
   * Consume quota
   */
  consume(cost: number): boolean {
    if (!this.canConsume(cost)) {
      return false;
    }

    this.dailyUsage += cost;
    this.hourlyUsage += cost;
    this.minuteUsage += cost;

    return true;
  }

  /**
   * Get quota statistics
   */
  getStats(): QuotaStats {
    this.resetCountersIfNeeded();

    return {
      sourceId: this.sourceId,
      daily: {
        used: this.dailyUsage,
        limit: this.dailyLimit,
        remaining: this.dailyLimit - this.dailyUsage,
        resetTime: new Date(this.dailyResetTime)
      },
      hourly: this.hourlyLimit ? {
        used: this.hourlyUsage,
        limit: this.hourlyLimit,
        remaining: this.hourlyLimit - this.hourlyUsage,
        resetTime: new Date(this.hourlyResetTime)
      } : undefined,
      minute: this.minuteLimit ? {
        used: this.minuteUsage,
        limit: this.minuteLimit,
        remaining: this.minuteLimit - this.minuteUsage,
        resetTime: new Date(this.minuteResetTime)
      } : undefined
    };
  }

  /**
   * Reset all counters
   */
  reset(): void {
    this.dailyUsage = 0;
    this.hourlyUsage = 0;
    this.minuteUsage = 0;
    
    const now = Date.now();
    this.dailyResetTime = this.getNextDayReset(now);
    this.hourlyResetTime = this.getNextHourReset(now);
    this.minuteResetTime = this.getNextMinuteReset(now);
  }

  /**
   * Reset counters if their time windows have expired
   */
  private resetCountersIfNeeded(): void {
    const now = Date.now();

    if (now >= this.dailyResetTime) {
      this.dailyUsage = 0;
      this.dailyResetTime = this.getNextDayReset(now);
    }

    if (now >= this.hourlyResetTime) {
      this.hourlyUsage = 0;
      this.hourlyResetTime = this.getNextHourReset(now);
    }

    if (now >= this.minuteResetTime) {
      this.minuteUsage = 0;
      this.minuteResetTime = this.getNextMinuteReset(now);
    }
  }

  private getNextDayReset(now: number): number {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  private getNextHourReset(now: number): number {
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return nextHour.getTime();
  }

  private getNextMinuteReset(now: number): number {
    const nextMinute = new Date(now);
    nextMinute.setMinutes(nextMinute.getMinutes() + 1, 0, 0);
    return nextMinute.getTime();
  }
}

/**
 * Quota statistics interface
 */
export interface QuotaStats {
  sourceId: string;
  daily: {
    used: number;
    limit: number;
    remaining: number;
    resetTime: Date;
  };
  hourly?: {
    used: number;
    limit: number;
    remaining: number;
    resetTime: Date;
  };
  minute?: {
    used: number;
    limit: number;
    remaining: number;
    resetTime: Date;
  };
}
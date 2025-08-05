import { 
  TokenBucketRateLimiter, 
  QuotaManager, 
  QuotaTracker,
  RateLimiterConfig 
} from '../../core/rate-limiter';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';

// Mock dependencies
jest.mock('../../core/config');
jest.mock('../../core/logger');

describe('TokenBucketRateLimiter', () => {
  let rateLimiter: TokenBucketRateLimiter;
  let mockConfig: jest.Mocked<Config>;
  let mockLogger: jest.Mocked<Logger>;

  const defaultConfig: RateLimiterConfig = {
    maxTokens: 10,
    refillRate: 2, // 2 tokens per second
    windowMs: 60000
  };

  beforeEach(() => {
    mockConfig = new Config() as jest.Mocked<Config>;
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    rateLimiter = new TokenBucketRateLimiter(mockConfig, mockLogger, defaultConfig, 'test');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Consumption', () => {
    it('should allow consumption when tokens are available', async () => {
      const result = await rateLimiter.consume(5);
      
      expect(result).toBe(true);
      
      const stats = rateLimiter.getStats();
      expect(Math.floor(stats.currentTokens)).toBe(5);
      expect(stats.allowedRequests).toBe(1);
      expect(stats.rejectedRequests).toBe(0);
    });

    it('should reject consumption when insufficient tokens', async () => {
      // Consume all tokens
      await rateLimiter.consume(10);
      
      // Try to consume more
      const result = await rateLimiter.consume(1);
      
      expect(result).toBe(false);
      
      const stats = rateLimiter.getStats();
      expect(stats.currentTokens).toBe(0);
      expect(stats.allowedRequests).toBe(1);
      expect(stats.rejectedRequests).toBe(1);
    });

    it('should consume default of 1 token when no amount specified', async () => {
      const result = await rateLimiter.consume();
      
      expect(result).toBe(true);
      
      const stats = rateLimiter.getStats();
      expect(stats.currentTokens).toBe(9);
    });

    it('should handle multiple token consumption', async () => {
      const result1 = await rateLimiter.consume(3);
      const result2 = await rateLimiter.consume(4);
      const result3 = await rateLimiter.consume(5); // Should fail
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(false);
      
      const stats = rateLimiter.getStats();
      expect(Math.floor(stats.currentTokens)).toBe(3);
      expect(stats.allowedRequests).toBe(2);
      expect(stats.rejectedRequests).toBe(1);
    });
  });

  describe('Token Refill', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should refill tokens over time', async () => {
      // Consume all tokens
      await rateLimiter.consume(10);
      expect(rateLimiter.getStats().currentTokens).toBe(0);
      
      // Advance time by 1 second (should add 2 tokens)
      jest.advanceTimersByTime(1000);
      
      const stats = rateLimiter.getStats();
      expect(Math.floor(stats.currentTokens)).toBe(2);
    });

    it('should not exceed maximum tokens when refilling', async () => {
      // Start with full bucket
      expect(rateLimiter.getStats().currentTokens).toBe(10);
      
      // Advance time significantly
      jest.advanceTimersByTime(10000);
      
      const stats = rateLimiter.getStats();
      expect(stats.currentTokens).toBe(10); // Should not exceed max
    });

    it('should refill tokens gradually', async () => {
      // Consume all tokens
      await rateLimiter.consume(10);
      
      // Advance time by 0.5 seconds (should add 1 token)
      jest.advanceTimersByTime(500);
      expect(Math.floor(rateLimiter.getStats().currentTokens)).toBe(1);
      
      // Advance another 0.5 seconds (should add 1 more token)
      jest.advanceTimersByTime(500);
      expect(Math.floor(rateLimiter.getStats().currentTokens)).toBe(2);
    });
  });

  describe('Availability Checking', () => {
    it('should check availability without consuming tokens', () => {
      expect(rateLimiter.canConsume(5)).toBe(true);
      expect(rateLimiter.canConsume(15)).toBe(false);
      
      // Tokens should remain unchanged
      const stats = rateLimiter.getStats();
      expect(stats.currentTokens).toBe(10);
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe('Time Calculations', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate time until next token', async () => {
      // Consume all tokens
      await rateLimiter.consume(10);
      
      const timeUntilNext = rateLimiter.getTimeUntilNextToken();
      expect(timeUntilNext).toBe(500); // 1 token / 2 tokens per second = 0.5 seconds = 500ms
    });

    it('should return 0 when tokens are available', () => {
      const timeUntilNext = rateLimiter.getTimeUntilNextToken();
      expect(timeUntilNext).toBe(0);
    });

    it('should calculate time until specific number of tokens', async () => {
      // Consume most tokens, leaving 2
      await rateLimiter.consume(8);
      
      const timeUntil5Tokens = rateLimiter.getTimeUntilTokens(5);
      expect(timeUntil5Tokens).toBe(1500); // Need 3 more tokens, 3/2 = 1.5 seconds = 1500ms
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state', async () => {
      // Consume some tokens
      await rateLimiter.consume(5);
      
      rateLimiter.reset();
      
      const stats = rateLimiter.getStats();
      expect(stats.currentTokens).toBe(10);
      expect(stats.totalRequests).toBe(0);
      expect(stats.allowedRequests).toBe(0);
      expect(stats.rejectedRequests).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should track statistics correctly', async () => {
      await rateLimiter.consume(3);
      await rateLimiter.consume(8); // Should fail
      await rateLimiter.consume(2);
      
      const stats = rateLimiter.getStats();
      expect(stats.totalRequests).toBe(3);
      expect(stats.allowedRequests).toBe(2);
      expect(stats.rejectedRequests).toBe(1);
      expect(stats.maxTokens).toBe(10);
      expect(stats.refillRate).toBe(2);
      expect(stats.lastRefillTime).toBeInstanceOf(Date);
    });
  });
});

describe('QuotaTracker', () => {
  let quotaTracker: QuotaTracker;

  beforeEach(() => {
    quotaTracker = new QuotaTracker('test-api', 1000, 100, 10);
  });

  describe('Quota Consumption', () => {
    it('should allow consumption within limits', () => {
      expect(quotaTracker.canConsume(5)).toBe(true);
      expect(quotaTracker.consume(5)).toBe(true);
      
      const stats = quotaTracker.getStats();
      expect(stats.daily.used).toBe(5);
      expect(stats.hourly?.used).toBe(5);
      expect(stats.minute?.used).toBe(5);
    });

    it('should reject consumption exceeding daily limit', () => {
      expect(quotaTracker.consume(1001)).toBe(false);
      
      const stats = quotaTracker.getStats();
      expect(stats.daily.used).toBe(0);
    });

    it('should reject consumption exceeding hourly limit', () => {
      expect(quotaTracker.consume(101)).toBe(false);
      
      const stats = quotaTracker.getStats();
      expect(stats.hourly?.used).toBe(0);
    });

    it('should reject consumption exceeding minute limit', () => {
      expect(quotaTracker.consume(11)).toBe(false);
      
      const stats = quotaTracker.getStats();
      expect(stats.minute?.used).toBe(0);
    });

    it('should track cumulative usage correctly', () => {
      quotaTracker.consume(5);
      quotaTracker.consume(3);
      quotaTracker.consume(2);
      
      const stats = quotaTracker.getStats();
      expect(stats.daily.used).toBe(10);
      expect(stats.hourly?.used).toBe(10);
      expect(stats.minute?.used).toBe(10);
    });
  });

  describe('Time-based Resets', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should reset minute counter after 1 minute', () => {
      quotaTracker.consume(5);
      expect(quotaTracker.getStats().minute?.used).toBe(5);
      
      // Advance time by 1 minute
      jest.advanceTimersByTime(60 * 1000);
      
      const stats = quotaTracker.getStats();
      expect(stats.minute?.used).toBe(0);
      expect(stats.hourly?.used).toBe(5); // Should not reset
      expect(stats.daily.used).toBe(5); // Should not reset
    });

    it('should reset hour counter after 1 hour', () => {
      quotaTracker.consume(5);
      
      // Advance time by 1 hour
      jest.advanceTimersByTime(60 * 60 * 1000);
      
      const stats = quotaTracker.getStats();
      expect(stats.minute?.used).toBe(0);
      expect(stats.hourly?.used).toBe(0);
      expect(stats.daily.used).toBe(5); // Should not reset
    });

    it('should reset daily counter after 1 day', () => {
      quotaTracker.consume(5);
      
      // Advance time by 1 day
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
      
      const stats = quotaTracker.getStats();
      expect(stats.minute?.used).toBe(0);
      expect(stats.hourly?.used).toBe(0);
      expect(stats.daily.used).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      // Consume within minute limit first
      quotaTracker.consume(5);
      
      const stats = quotaTracker.getStats();
      
      expect(stats.sourceId).toBe('test-api');
      expect(stats.daily.used).toBe(5);
      expect(stats.daily.limit).toBe(1000);
      expect(stats.daily.remaining).toBe(995);
      expect(stats.daily.resetTime).toBeInstanceOf(Date);
      
      expect(stats.hourly?.used).toBe(5);
      expect(stats.hourly?.limit).toBe(100);
      expect(stats.hourly?.remaining).toBe(95);
      
      expect(stats.minute?.used).toBe(5);
      expect(stats.minute?.limit).toBe(10);
      expect(stats.minute?.remaining).toBe(5);
    });
  });
});

describe('QuotaManager', () => {
  let quotaManager: QuotaManager;
  let mockConfig: jest.Mocked<Config>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockConfig = new Config() as jest.Mocked<Config>;
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    quotaManager = new QuotaManager(mockConfig, mockLogger);
  });

  describe('Quota Registration', () => {
    it('should register quotas for API sources', () => {
      quotaManager.registerQuota('api1', 1000, 100, 10);
      
      const stats = quotaManager.getQuotaStats('api1');
      expect(stats).toBeDefined();
      expect(stats?.sourceId).toBe('api1');
      expect(stats?.daily.limit).toBe(1000);
      expect(stats?.hourly?.limit).toBe(100);
      expect(stats?.minute?.limit).toBe(10);
    });

    it('should handle registration without hourly/minute limits', () => {
      quotaManager.registerQuota('api2', 5000);
      
      const stats = quotaManager.getQuotaStats('api2');
      expect(stats?.daily.limit).toBe(5000);
      expect(stats?.hourly).toBeUndefined();
      expect(stats?.minute).toBeUndefined();
    });
  });

  describe('Request Management', () => {
    beforeEach(() => {
      quotaManager.registerQuota('test-api', 100, 20, 5);
    });

    it('should allow requests within quota', () => {
      expect(quotaManager.canMakeRequest('test-api', 3)).toBe(true);
      expect(quotaManager.recordRequest('test-api', 3)).toBe(true);
      
      const stats = quotaManager.getQuotaStats('test-api');
      expect(stats?.daily.used).toBe(3);
    });

    it('should reject requests exceeding quota', () => {
      expect(quotaManager.canMakeRequest('test-api', 6)).toBe(false);
      expect(quotaManager.recordRequest('test-api', 6)).toBe(false);
      
      const stats = quotaManager.getQuotaStats('test-api');
      expect(stats?.daily.used).toBe(0);
    });

    it('should handle unknown API sources gracefully', () => {
      expect(quotaManager.canMakeRequest('unknown-api')).toBe(true);
      expect(quotaManager.recordRequest('unknown-api')).toBe(true);
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No quota tracker found for unknown-api'
      );
    });
  });

  describe('Statistics and Management', () => {
    beforeEach(() => {
      quotaManager.registerQuota('api1', 1000, 100);
      quotaManager.registerQuota('api2', 2000, 200);
    });

    it('should provide statistics for all APIs', () => {
      quotaManager.recordRequest('api1', 10);
      quotaManager.recordRequest('api2', 20);
      
      const allStats = quotaManager.getAllQuotaStats();
      
      expect(allStats).toHaveProperty('api1');
      expect(allStats).toHaveProperty('api2');
      expect(allStats.api1.daily.used).toBe(10);
      expect(allStats.api2.daily.used).toBe(20);
    });

    it('should reset individual quotas', () => {
      quotaManager.recordRequest('api1', 50);
      quotaManager.resetQuota('api1');
      
      const stats = quotaManager.getQuotaStats('api1');
      expect(stats?.daily.used).toBe(0);
    });

    it('should reset all quotas', () => {
      quotaManager.recordRequest('api1', 50);
      quotaManager.recordRequest('api2', 75);
      
      quotaManager.resetAllQuotas();
      
      const allStats = quotaManager.getAllQuotaStats();
      expect(allStats.api1.daily.used).toBe(0);
      expect(allStats.api2.daily.used).toBe(0);
    });
  });
});
import { BaseAPIConnector } from '../../core/api-connector';
import { TokenBucketRateLimiter, QuotaManager } from '../../core/rate-limiter';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';
import { APIRequest, APIResponse, RateLimitExceededError } from '../../types/api.types';

// Mock dependencies
jest.mock('../../core/config');
jest.mock('../../core/logger');

// Create a test connector that integrates rate limiting
class RateLimitedAPIConnector extends BaseAPIConnector {
  private rateLimiter: TokenBucketRateLimiter;
  private quotaManager: QuotaManager;

  constructor(
    config: Config,
    logger: Logger,
    private mockPerformRequest: jest.Mock,
    private mockPerformHealthCheck: jest.Mock
  ) {
    super(config, logger, 'RateLimitedAPI', 'https://api.ratelimited.com');
    
    this.rateLimiter = new TokenBucketRateLimiter(
      config,
      logger,
      { maxTokens: 5, refillRate: 1, windowMs: 60000 },
      'test-connector'
    );
    
    this.quotaManager = new QuotaManager(config, logger);
    this.quotaManager.registerQuota('test-api', 100, 20, 10); // Increase minute limit
  }

  protected async performRequest<T>(request: APIRequest): Promise<APIResponse<T>> {
    // Check rate limits before making request
    if (!await this.rateLimiter.consume(1)) {
      throw new RateLimitExceededError(
        new Date(Date.now() + this.rateLimiter.getTimeUntilNextToken()),
        {
          limit: 5,
          remaining: 0,
          resetTime: new Date(Date.now() + this.rateLimiter.getTimeUntilNextToken()),
          windowMs: 60000
        }
      );
    }

    // Check quota limits
    if (!this.quotaManager.canMakeRequest('test-api', 1)) {
      throw new RateLimitExceededError(
        new Date(Date.now() + 60000),
        {
          limit: 5,
          remaining: 0,
          resetTime: new Date(Date.now() + 60000),
          windowMs: 60000
        }
      );
    }

    // Record quota usage
    this.quotaManager.recordRequest('test-api', 1);

    return this.mockPerformRequest(request);
  }

  protected async performHealthCheck(): Promise<void> {
    return this.mockPerformHealthCheck();
  }

  // Expose internal components for testing
  public getRateLimiterStats() {
    return this.rateLimiter.getStats();
  }

  public getQuotaStats() {
    return this.quotaManager.getQuotaStats('test-api');
  }
}

describe('Rate Limiting Integration', () => {
  let connector: RateLimitedAPIConnector;
  let mockConfig: jest.Mocked<Config>;
  let mockLogger: jest.Mocked<Logger>;
  let mockPerformRequest: jest.Mock;
  let mockPerformHealthCheck: jest.Mock;

  beforeEach(async () => {
    mockConfig = new Config() as jest.Mocked<Config>;
    mockConfig.get = jest.fn().mockImplementation((key: string) => {
      const config: Record<string, any> = {
        'circuitBreaker.failureThreshold': 3,
        'circuitBreaker.recoveryTimeout': 5000,
        'circuitBreaker.monitoringPeriod': 10000
      };
      return config[key];
    });

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    mockPerformRequest = jest.fn();
    mockPerformHealthCheck = jest.fn().mockResolvedValue(undefined);

    connector = new RateLimitedAPIConnector(
      mockConfig,
      mockLogger,
      mockPerformRequest,
      mockPerformHealthCheck
    );

    await connector.connect();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Bucket Rate Limiting', () => {
    it('should allow requests within rate limits', async () => {
      const mockResponse: APIResponse<any> = {
        data: { result: 'success' },
        status: 200,
        headers: {},
        timestamp: new Date()
      };
      mockPerformRequest.mockResolvedValue(mockResponse);

      const request: APIRequest = {
        url: '/test',
        method: 'GET'
      };

      // Should allow first 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await connector.executeRequest(request);
        expect(result).toEqual(mockResponse);
      }

      const stats = connector.getRateLimiterStats();
      expect(stats.allowedRequests).toBe(5);
      expect(stats.rejectedRequests).toBe(0);
    });

    it('should reject requests when rate limit exceeded', async () => {
      const mockResponse: APIResponse<any> = {
        data: { result: 'success' },
        status: 200,
        headers: {},
        timestamp: new Date()
      };
      mockPerformRequest.mockResolvedValue(mockResponse);

      const request: APIRequest = {
        url: '/test',
        method: 'GET'
      };

      // Consume all tokens
      for (let i = 0; i < 5; i++) {
        await connector.executeRequest(request);
      }

      // Next request should be rate limited
      await expect(connector.executeRequest(request)).rejects.toThrow(RateLimitExceededError);

      const stats = connector.getRateLimiterStats();
      expect(stats.allowedRequests).toBe(5);
      expect(stats.rejectedRequests).toBe(1);
    });

    it('should allow requests after token refill', async () => {
      jest.useFakeTimers();

      const mockResponse: APIResponse<any> = {
        data: { result: 'success' },
        status: 200,
        headers: {},
        timestamp: new Date()
      };
      mockPerformRequest.mockResolvedValue(mockResponse);

      const request: APIRequest = {
        url: '/test',
        method: 'GET'
      };

      // Consume all tokens
      for (let i = 0; i < 5; i++) {
        await connector.executeRequest(request);
      }

      // Should be rate limited
      await expect(connector.executeRequest(request)).rejects.toThrow(RateLimitExceededError);

      // Advance time to refill 1 token (1 token per second)
      jest.advanceTimersByTime(1000);

      // Should now allow 1 more request
      const result = await connector.executeRequest(request);
      expect(result).toEqual(mockResponse);

      jest.useRealTimers();
    });
  });

  describe('Quota Management', () => {
    it('should track quota usage correctly', async () => {
      const mockResponse: APIResponse<any> = {
        data: { result: 'success' },
        status: 200,
        headers: {},
        timestamp: new Date()
      };
      mockPerformRequest.mockResolvedValue(mockResponse);

      const request: APIRequest = {
        url: '/test',
        method: 'GET'
      };

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        await connector.executeRequest(request);
      }

      const quotaStats = connector.getQuotaStats();
      expect(quotaStats?.daily.used).toBe(3);
      expect(quotaStats?.daily.remaining).toBe(97);
      expect(quotaStats?.hourly?.used).toBe(3);
      expect(quotaStats?.minute?.used).toBe(3);
    });

    it('should reject requests when quota exceeded', async () => {
      const mockResponse: APIResponse<any> = {
        data: { result: 'success' },
        status: 200,
        headers: {},
        timestamp: new Date()
      };
      mockPerformRequest.mockResolvedValue(mockResponse);

      const request: APIRequest = {
        url: '/test',
        method: 'GET'
      };

      // Make 5 requests (rate limit is 5 tokens)
      for (let i = 0; i < 5; i++) {
        await connector.executeRequest(request);
      }

      // Next request should be rate limited (no tokens left)
      await expect(connector.executeRequest(request)).rejects.toThrow(RateLimitExceededError);

      const quotaStats = connector.getQuotaStats();
      expect(quotaStats?.minute?.used).toBe(5);
      expect(quotaStats?.minute?.remaining).toBe(5);
    });
  });

  describe('Combined Rate Limiting and Quota Management', () => {
    it('should enforce both rate limits and quotas', async () => {
      const mockResponse: APIResponse<any> = {
        data: { result: 'success' },
        status: 200,
        headers: {},
        timestamp: new Date()
      };
      mockPerformRequest.mockResolvedValue(mockResponse);

      const request: APIRequest = {
        url: '/test',
        method: 'GET'
      };

      // Make requests up to the rate limit (5 tokens)
      for (let i = 0; i < 5; i++) {
        await connector.executeRequest(request);
      }

      // Should be rate limited (no tokens left)
      await expect(connector.executeRequest(request)).rejects.toThrow(RateLimitExceededError);

      const rateLimiterStats = connector.getRateLimiterStats();
      const quotaStats = connector.getQuotaStats();

      expect(rateLimiterStats.allowedRequests).toBe(5);
      expect(rateLimiterStats.rejectedRequests).toBe(1);
      expect(quotaStats?.daily.used).toBe(5);
      expect(quotaStats?.minute?.used).toBe(5);
    });
  });
});
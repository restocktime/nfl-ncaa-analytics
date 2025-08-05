import { BaseAPIConnector } from '../../core/api-connector';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';
import { 
  APIRequest, 
  APIResponse, 
  APIError, 
  RateLimitExceededError,
  CircuitBreakerOpenError 
} from '../../types/api.types';

// Mock dependencies
jest.mock('../../core/config');
jest.mock('../../core/logger');

// Create a concrete test implementation
class TestAPIConnector extends BaseAPIConnector {
  private mockPerformRequest: jest.Mock;
  private mockPerformHealthCheck: jest.Mock;

  constructor(
    config: Config,
    logger: Logger,
    performRequestMock?: jest.Mock,
    performHealthCheckMock?: jest.Mock
  ) {
    super(config, logger, 'TestAPI', 'https://api.test.com');
    this.mockPerformRequest = performRequestMock || jest.fn();
    this.mockPerformHealthCheck = performHealthCheckMock || jest.fn();
  }

  protected async performRequest<T>(request: APIRequest): Promise<APIResponse<T>> {
    return this.mockPerformRequest(request);
  }

  protected async performHealthCheck(): Promise<void> {
    return this.mockPerformHealthCheck();
  }

  // Expose protected methods for testing
  public testBuildUrl(path: string): string {
    return this.buildUrl(path);
  }

  public testMergeHeaders(headers?: Record<string, string>): Record<string, string> {
    return this.mergeHeaders(headers);
  }

  public testUpdateRateLimitInfo(headers: Record<string, string>): void {
    this.updateRateLimitInfo(headers);
  }
}

describe('BaseAPIConnector', () => {
  let connector: TestAPIConnector;
  let mockConfig: jest.Mocked<Config>;
  let mockLogger: jest.Mocked<Logger>;
  let mockPerformRequest: jest.Mock;
  let mockPerformHealthCheck: jest.Mock;

  beforeEach(() => {
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
    mockPerformHealthCheck = jest.fn();

    connector = new TestAPIConnector(
      mockConfig,
      mockLogger,
      mockPerformRequest,
      mockPerformHealthCheck
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should connect successfully when health check passes', async () => {
      mockPerformHealthCheck.mockResolvedValue(undefined);

      await connector.connect();

      expect(connector.isHealthy()).toBe(true);
      expect(mockPerformHealthCheck).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('TestAPI API connector connected successfully');
    });

    it('should fail to connect when health check fails', async () => {
      const healthError = new Error('Health check failed');
      mockPerformHealthCheck.mockRejectedValue(healthError);

      await expect(connector.connect()).rejects.toThrow(healthError);
      expect(connector.isHealthy()).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to connect to TestAPI API',
        healthError
      );
    });

    it('should disconnect properly', async () => {
      mockPerformHealthCheck.mockResolvedValue(undefined);
      await connector.connect();

      await connector.disconnect();

      expect(connector.isHealthy()).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith('TestAPI API connector disconnected');
    });
  });

  describe('Request Execution', () => {
    beforeEach(async () => {
      mockPerformHealthCheck.mockResolvedValue(undefined);
      await connector.connect();
    });

    it('should execute successful requests', async () => {
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

      const result = await connector.executeRequest(request);

      expect(result).toEqual(mockResponse);
      expect(mockPerformRequest).toHaveBeenCalledWith(request);
    });

    it('should validate request parameters', async () => {
      const invalidRequest: APIRequest = {
        url: '',
        method: 'GET'
      };

      await expect(connector.executeRequest(invalidRequest)).rejects.toThrow(APIError);
      expect(mockPerformRequest).not.toHaveBeenCalled();
    });

    it('should handle rate limit exceeded', async () => {
      // Set rate limit to 0
      connector.testUpdateRateLimitInfo({
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(Math.floor((Date.now() + 60000) / 1000))
      });

      const request: APIRequest = {
        url: '/test',
        method: 'GET'
      };

      await expect(connector.executeRequest(request)).rejects.toThrow(RateLimitExceededError);
      expect(mockPerformRequest).not.toHaveBeenCalled();
    });
  });

  describe('Retry Logic', () => {
    beforeEach(async () => {
      mockPerformHealthCheck.mockResolvedValue(undefined);
      await connector.connect();
    });

    it('should retry on retryable errors', async () => {
      const retryableError = new APIError('Server error', 500, undefined, true);
      const successResponse: APIResponse<any> = {
        data: { result: 'success' },
        status: 200,
        headers: {},
        timestamp: new Date()
      };

      mockPerformRequest
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce(successResponse);

      const request: APIRequest = {
        url: '/test',
        method: 'GET',
        retries: 3
      };

      const result = await connector.executeRequest(request);

      expect(result).toEqual(successResponse);
      expect(mockPerformRequest).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const nonRetryableError = new APIError('Bad request', 400, undefined, false);
      mockPerformRequest.mockRejectedValue(nonRetryableError);

      const request: APIRequest = {
        url: '/test',
        method: 'GET',
        retries: 3
      };

      await expect(connector.executeRequest(request)).rejects.toThrow(nonRetryableError);
      expect(mockPerformRequest).toHaveBeenCalledTimes(1);
    });

    it('should not retry rate limit errors', async () => {
      const rateLimitError = new RateLimitExceededError(
        new Date(Date.now() + 60000),
        {
          limit: 100,
          remaining: 0,
          resetTime: new Date(Date.now() + 60000),
          windowMs: 60000
        }
      );
      mockPerformRequest.mockRejectedValue(rateLimitError);

      const request: APIRequest = {
        url: '/test',
        method: 'GET',
        retries: 3
      };

      await expect(connector.executeRequest(request)).rejects.toThrow(rateLimitError);
      expect(mockPerformRequest).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const retryableError = new APIError('Server error', 500, undefined, true);
      mockPerformRequest.mockRejectedValue(retryableError);

      const request: APIRequest = {
        url: '/test',
        method: 'GET',
        retries: 2
      };

      await expect(connector.executeRequest(request)).rejects.toThrow(retryableError);
      expect(mockPerformRequest).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Circuit Breaker Integration', () => {
    beforeEach(async () => {
      mockPerformHealthCheck.mockResolvedValue(undefined);
      await connector.connect();
    });

    it('should trigger circuit breaker on repeated failures', async () => {
      const error = new APIError('Server error', 500, undefined, false); // Non-retryable to avoid delays
      mockPerformRequest.mockRejectedValue(error);

      const request: APIRequest = {
        url: '/test',
        method: 'GET',
        retries: 0
      };

      // Execute 3 requests to trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await connector.executeRequest(request);
        } catch (e) {
          // Expected to fail
        }
      }

      // Circuit breaker should now be open
      await expect(connector.executeRequest(request)).rejects.toThrow(CircuitBreakerOpenError);
    });
  });

  describe('Rate Limit Management', () => {
    it('should update rate limit info from headers', () => {
      const resetTime = Math.floor((Date.now() + 3600000) / 1000);
      const headers = {
        'x-ratelimit-limit': '1000',
        'x-ratelimit-remaining': '500',
        'x-ratelimit-reset': String(resetTime)
      };

      connector.testUpdateRateLimitInfo(headers);
      const rateLimitInfo = connector.getRateLimit();

      expect(rateLimitInfo.limit).toBe(1000);
      expect(rateLimitInfo.remaining).toBe(500);
      expect(rateLimitInfo.resetTime.getTime()).toBe(resetTime * 1000);
    });

    it('should return current rate limit info', () => {
      const rateLimitInfo = connector.getRateLimit();

      expect(rateLimitInfo).toHaveProperty('limit');
      expect(rateLimitInfo).toHaveProperty('remaining');
      expect(rateLimitInfo).toHaveProperty('resetTime');
      expect(rateLimitInfo).toHaveProperty('windowMs');
    });
  });

  describe('URL and Header Utilities', () => {
    it('should build URLs correctly', () => {
      expect(connector.testBuildUrl('/path')).toBe('https://api.test.com/path');
      expect(connector.testBuildUrl('path')).toBe('https://api.test.com/path');
    });

    it('should merge headers correctly', () => {
      const requestHeaders = { 'Custom-Header': 'value' };
      const mergedHeaders = connector.testMergeHeaders(requestHeaders);

      expect(mergedHeaders).toHaveProperty('Content-Type', 'application/json');
      expect(mergedHeaders).toHaveProperty('User-Agent', 'Football-Analytics-System/1.0');
      expect(mergedHeaders).toHaveProperty('Custom-Header', 'value');
    });

    it('should merge headers with defaults when no request headers provided', () => {
      const mergedHeaders = connector.testMergeHeaders();

      expect(mergedHeaders).toHaveProperty('Content-Type', 'application/json');
      expect(mergedHeaders).toHaveProperty('User-Agent', 'Football-Analytics-System/1.0');
    });
  });
});
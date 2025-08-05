import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { Config } from './config';
import { Logger } from './logger';
import { CircuitBreaker } from './circuit-breaker';
import {
  APIRequest,
  APIResponse,
  APIError,
  RateLimitInfo,
  RetryConfig,
  CircuitBreakerConfig,
  RateLimitExceededError
} from '../types/api.types';

/**
 * Interface for API connectors
 */
export interface APIConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isHealthy(): boolean;
  getRateLimit(): RateLimitInfo;
  executeRequest<T>(request: APIRequest): Promise<APIResponse<T>>;
}

/**
 * Base implementation of API connector with circuit breaker and retry logic
 */
@injectable()
export abstract class BaseAPIConnector implements APIConnector {
  protected circuitBreaker: CircuitBreaker;
  protected rateLimitInfo: RateLimitInfo;
  protected isConnected: boolean = false;

  constructor(
    @inject(TYPES.Config) protected config: Config,
    @inject(TYPES.Logger) protected logger: Logger,
    protected name: string,
    protected baseUrl: string,
    protected defaultHeaders: Record<string, string> = {}
  ) {
    const circuitConfig: CircuitBreakerConfig = {
      failureThreshold: this.config.get<number>('circuitBreaker.failureThreshold'),
      recoveryTimeout: this.config.get<number>('circuitBreaker.recoveryTimeout'),
      monitoringPeriod: this.config.get<number>('circuitBreaker.monitoringPeriod'),
      halfOpenMaxCalls: 3
    };

    this.circuitBreaker = new CircuitBreaker(config, logger, circuitConfig);
    
    this.rateLimitInfo = {
      limit: 100,
      remaining: 100,
      resetTime: new Date(Date.now() + 60000),
      windowMs: 60000
    };
  }

  /**
   * Connect to the API service
   */
  async connect(): Promise<void> {
    try {
      await this.performHealthCheck();
      this.isConnected = true;
      this.logger.info(`${this.name} API connector connected successfully`);
    } catch (error) {
      this.isConnected = false;
      this.logger.error(`Failed to connect to ${this.name} API`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Disconnect from the API service
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.logger.info(`${this.name} API connector disconnected`);
  }

  /**
   * Check if the connector is healthy
   */
  isHealthy(): boolean {
    return this.isConnected && this.circuitBreaker.isHealthy();
  }

  /**
   * Get current rate limit information
   */
  getRateLimit(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /**
   * Execute an API request with circuit breaker and retry logic
   */
  async executeRequest<T>(request: APIRequest): Promise<APIResponse<T>> {
    this.validateRequest(request);

    return await this.circuitBreaker.execute(async () => {
      return await this.executeWithRetry<T>(request);
    });
  }

  /**
   * Execute request with exponential backoff retry logic
   */
  private async executeWithRetry<T>(request: APIRequest): Promise<APIResponse<T>> {
    const retryConfig: RetryConfig = {
      maxRetries: request.retries || 3,
      baseDelay: 1000,
      maxDelay: 30000,
      jitterFactor: 0.1,
      exponentialBase: 2
    };

    let lastError: Error;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateRetryDelay(attempt, retryConfig);
          this.logger.debug(`Retrying ${this.name} API request in ${delay}ms`, {
            attempt,
            url: request.url
          });
          await this.sleep(delay);
        }

        return await this.performRequest<T>(request);
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof RateLimitExceededError) {
          // Don't retry rate limit errors immediately
          throw error;
        }

        if (error instanceof APIError && !error.isRetryable) {
          // Don't retry non-retryable errors
          throw error;
        }

        if (attempt === retryConfig.maxRetries) {
          this.logger.error(`${this.name} API request failed after ${attempt + 1} attempts`, lastError, {
            url: request.url
          });
          break;
        }

        this.logger.warn(`${this.name} API request failed, attempt ${attempt + 1}`, {
          error: lastError.message,
          url: request.url
        });
      }
    }

    throw lastError!;
  }

  /**
   * Perform the actual HTTP request
   */
  protected abstract performRequest<T>(request: APIRequest): Promise<APIResponse<T>>;

  /**
   * Perform health check for the API
   */
  protected abstract performHealthCheck(): Promise<void>;

  /**
   * Validate the API request
   */
  private validateRequest(request: APIRequest): void {
    if (!request.url) {
      throw new APIError('Request URL is required', undefined, undefined, false);
    }

    if (!request.method) {
      throw new APIError('Request method is required', undefined, undefined, false);
    }

    // Check rate limits
    if (this.rateLimitInfo.remaining <= 0 && new Date() < this.rateLimitInfo.resetTime) {
      throw new RateLimitExceededError(this.rateLimitInfo.resetTime, this.rateLimitInfo);
    }
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);
    const jitter = exponentialDelay * config.jitterFactor * Math.random();
    const delay = exponentialDelay + jitter;
    
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update rate limit information from response headers
   */
  protected updateRateLimitInfo(headers: Record<string, string>): void {
    const limit = headers['x-ratelimit-limit'] || headers['x-rate-limit-limit'];
    const remaining = headers['x-ratelimit-remaining'] || headers['x-rate-limit-remaining'];
    const reset = headers['x-ratelimit-reset'] || headers['x-rate-limit-reset'];

    if (limit) {
      this.rateLimitInfo.limit = parseInt(limit, 10);
    }

    if (remaining) {
      this.rateLimitInfo.remaining = parseInt(remaining, 10);
    }

    if (reset) {
      // Assume reset is Unix timestamp
      this.rateLimitInfo.resetTime = new Date(parseInt(reset, 10) * 1000);
    }
  }

  /**
   * Build full URL from base URL and path
   */
  protected buildUrl(path: string): string {
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Merge default headers with request headers
   */
  protected mergeHeaders(requestHeaders?: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'Football-Analytics-System/1.0',
      ...this.defaultHeaders,
      ...requestHeaders
    };
  }
}
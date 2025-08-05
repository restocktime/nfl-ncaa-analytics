import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { Logger, ChildLogger } from './logger';
import { Config } from './config';

/**
 * Base service class providing common functionality for all services
 */
@injectable()
export abstract class BaseService {
  protected logger: ChildLogger;
  protected config: Config;

  constructor(
    @inject(TYPES.Logger) logger: Logger,
    @inject(TYPES.Config) config: Config,
    serviceName: string
  ) {
    this.logger = logger.createChildLogger(serviceName);
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize the service - override in derived classes
   */
  protected initialize(): void {
    this.logger.info(`${this.constructor.name} initialized`);
  }

  /**
   * Graceful shutdown - override in derived classes
   */
  public async shutdown(): Promise<void> {
    this.logger.info(`${this.constructor.name} shutting down`);
  }

  /**
   * Health check - override in derived classes
   */
  public async healthCheck(): Promise<HealthCheckResult> {
    return {
      service: this.constructor.name,
      status: 'healthy',
      timestamp: new Date(),
      details: {}
    };
  }

  /**
   * Execute operation with error handling and logging
   */
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Starting operation: ${operationName}`, context);
      const result = await operation();
      const duration = Date.now() - startTime;
      
      this.logger.info(`Operation completed: ${operationName}`, {
        duration,
        ...context
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(`Operation failed: ${operationName}`, error as Error, {
        duration,
        ...context
      });
      
      throw new ServiceError(
        `${operationName} failed`,
        error as Error,
        this.constructor.name,
        context
      );
    }
  }

  /**
   * Validate required configuration
   */
  protected validateConfig(requiredKeys: string[]): void {
    const missingKeys = requiredKeys.filter(key => !this.config.has(key));
    
    if (missingKeys.length > 0) {
      throw new ConfigurationError(
        `Missing required configuration keys: ${missingKeys.join(', ')}`,
        missingKeys
      );
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 10000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
        const totalDelay = delay + jitter;
        
        this.logger.warn(`Operation failed, retrying in ${totalDelay}ms`, {
          attempt,
          maxRetries,
          error: lastError.message
        });
        
        await this.sleep(totalDelay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  details: { [key: string]: any };
  error?: string;
}

/**
 * Custom service error class
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly cause: Error,
    public readonly service: string,
    public readonly context?: any
  ) {
    super(message);
    this.name = 'ServiceError';
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError);
    }
  }
}

/**
 * Configuration error class
 */
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly missingKeys: string[]
  ) {
    super(message);
    this.name = 'ConfigurationError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConfigurationError);
    }
  }
}
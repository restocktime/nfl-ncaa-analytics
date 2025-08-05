import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { Config } from './config';
import { Logger } from './logger';
import {
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerStats,
  CircuitBreakerOpenError
} from '../types/api.types';

/**
 * Circuit breaker implementation to prevent cascade failures
 */
@injectable()
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalCalls: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttemptTime?: Date;
  private halfOpenCalls: number = 0;

  constructor(
    @inject(TYPES.Config) private config: Config,
    @inject(TYPES.Logger) private logger: Logger,
    private circuitConfig: CircuitBreakerConfig
  ) {}

  /**
   * Execute an operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        throw new CircuitBreakerOpenError(
          this.nextAttemptTime!,
          this.getStats()
        );
      }
    }

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenCalls >= (this.circuitConfig.halfOpenMaxCalls || 3)) {
        throw new CircuitBreakerOpenError(
          this.nextAttemptTime!,
          this.getStats()
        );
      }
      this.halfOpenCalls++;
    }

    this.totalCalls++;

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  /**
   * Check if circuit breaker is healthy
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED || 
           (this.state === CircuitState.HALF_OPEN && this.halfOpenCalls === 0);
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.halfOpenCalls = 0;
    this.nextAttemptTime = undefined;
    this.logger.info('Circuit breaker reset to CLOSED state');
  }

  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionToClosed();
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on successful calls in closed state
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionToOpen();
    } else if (this.state === CircuitState.CLOSED && 
               this.failureCount >= this.circuitConfig.failureThreshold) {
      this.transitionToOpen();
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.nextAttemptTime) {
      return true;
    }
    return new Date() >= this.nextAttemptTime;
  }

  private transitionToOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.circuitConfig.recoveryTimeout);
    this.halfOpenCalls = 0;
    
    this.logger.warn('Circuit breaker transitioned to OPEN state', {
      failureCount: this.failureCount,
      nextAttemptTime: this.nextAttemptTime
    });
  }

  private transitionToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.halfOpenCalls = 0;
    
    this.logger.info('Circuit breaker transitioned to HALF_OPEN state');
  }

  private transitionToClosed(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.halfOpenCalls = 0;
    this.nextAttemptTime = undefined;
    
    this.logger.info('Circuit breaker transitioned to CLOSED state');
  }
}
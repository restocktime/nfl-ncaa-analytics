/**
 * API connector and circuit breaker types
 */

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  windowMs: number;
}

export interface APIRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface APIResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  timestamp: Date;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls?: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitterFactor: number;
  exponentialBase: number;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttemptTime?: Date;
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any,
    public isRetryable: boolean = true
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(
    public nextAttemptTime: Date,
    public stats: CircuitBreakerStats
  ) {
    super(`Circuit breaker is open. Next attempt at ${nextAttemptTime.toISOString()}`);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class RateLimitExceededError extends Error {
  constructor(
    public resetTime: Date,
    public rateLimitInfo: RateLimitInfo
  ) {
    super(`Rate limit exceeded. Resets at ${resetTime.toISOString()}`);
    this.name = 'RateLimitExceededError';
  }
}
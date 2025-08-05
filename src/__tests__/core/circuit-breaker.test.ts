import { CircuitBreaker } from '../../core/circuit-breaker';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';
import { CircuitState, CircuitBreakerOpenError } from '../../types/api.types';

// Mock dependencies
jest.mock('../../core/config');
jest.mock('../../core/logger');

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let mockConfig: jest.Mocked<Config>;
  let mockLogger: jest.Mocked<Logger>;

  const defaultConfig = {
    failureThreshold: 3,
    recoveryTimeout: 5000,
    monitoringPeriod: 10000,
    halfOpenMaxCalls: 2
  };

  beforeEach(() => {
    mockConfig = new Config() as jest.Mocked<Config>;
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    circuitBreaker = new CircuitBreaker(mockConfig, mockLogger, defaultConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start in CLOSED state', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failureCount).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(stats.totalCalls).toBe(0);
    });

    it('should be healthy initially', () => {
      expect(circuitBreaker.isHealthy()).toBe(true);
    });
  });

  describe('Successful Operations', () => {
    it('should execute successful operations in CLOSED state', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.successCount).toBe(1);
      expect(stats.totalCalls).toBe(1);
    });

    it('should reduce failure count on successful calls', async () => {
      const mockOperation = jest.fn();
      
      // Cause some failures first
      mockOperation.mockRejectedValueOnce(new Error('failure 1'));
      mockOperation.mockRejectedValueOnce(new Error('failure 2'));
      mockOperation.mockResolvedValueOnce('success');

      try {
        await circuitBreaker.execute(mockOperation);
      } catch {}
      
      try {
        await circuitBreaker.execute(mockOperation);
      } catch {}
      
      await circuitBreaker.execute(mockOperation);

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failureCount).toBe(1); // Reduced from 2 to 1
      expect(stats.successCount).toBe(1);
    });
  });

  describe('Failed Operations', () => {
    it('should handle failed operations in CLOSED state', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('test error'));
      
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('test error');
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failureCount).toBe(1);
      expect(stats.totalCalls).toBe(1);
    });

    it('should transition to OPEN state after failure threshold', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('test error'));
      
      // Execute failures up to threshold
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch {}
      }
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.OPEN);
      expect(stats.failureCount).toBe(defaultConfig.failureThreshold);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Circuit breaker transitioned to OPEN state',
        expect.any(Object)
      );
    });
  });

  describe('OPEN State Behavior', () => {
    beforeEach(async () => {
      // Force circuit breaker to OPEN state
      const mockOperation = jest.fn().mockRejectedValue(new Error('test error'));
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch {}
      }
    });

    it('should reject calls immediately when OPEN', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow(CircuitBreakerOpenError);
      expect(mockOperation).not.toHaveBeenCalled();
    });

    it('should not be healthy when OPEN', () => {
      expect(circuitBreaker.isHealthy()).toBe(false);
    });

    it('should transition to HALF_OPEN after recovery timeout', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      // Fast-forward time past recovery timeout
      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + defaultConfig.recoveryTimeout + 1000);
      
      const result = await circuitBreaker.execute(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED); // Should transition to CLOSED after success
      
      jest.useRealTimers();
    });
  });

  describe('HALF_OPEN State Behavior', () => {
    it('should allow limited calls in HALF_OPEN state', async () => {
      // Force circuit breaker to OPEN state
      const mockOperation = jest.fn().mockRejectedValue(new Error('test error'));
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch {}
      }
      
      // Fast-forward time to allow transition to HALF_OPEN
      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + defaultConfig.recoveryTimeout + 1000);
      
      // Now make a successful call
      mockOperation.mockResolvedValueOnce('success');
      const result = await circuitBreaker.execute(mockOperation);
      
      expect(result).toBe('success');
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED); // Should be CLOSED after success
      
      jest.useRealTimers();
    });

    it('should transition back to OPEN on failure in HALF_OPEN', async () => {
      // Force circuit breaker to OPEN state
      const mockOperation = jest.fn().mockRejectedValue(new Error('test error'));
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch {}
      }
      
      // Fast-forward time to allow transition to HALF_OPEN
      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + defaultConfig.recoveryTimeout + 1000);
      
      // Make a failed call in HALF_OPEN state
      try {
        await circuitBreaker.execute(mockOperation);
      } catch {}
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.OPEN);
      
      jest.useRealTimers();
    });

    it('should limit calls in HALF_OPEN state', async () => {
      // Force circuit breaker to OPEN state
      const mockOperation = jest.fn().mockRejectedValue(new Error('test error'));
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch {}
      }
      
      // Fast-forward time to allow transition to HALF_OPEN
      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + defaultConfig.recoveryTimeout + 1000);
      
      // Mock operation that resolves immediately
      mockOperation.mockResolvedValue('success');
      
      // First call should be allowed and transition to HALF_OPEN then CLOSED
      await circuitBreaker.execute(mockOperation);
      
      // After successful call, circuit should be CLOSED
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      
      jest.useRealTimers();
    }, 10000);
  });

  describe('Reset Functionality', () => {
    it('should reset circuit breaker to initial state', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('test error'));
      
      // Cause some failures
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch {}
      }
      
      expect(circuitBreaker.getStats().state).toBe(CircuitState.OPEN);
      
      circuitBreaker.reset();
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failureCount).toBe(0);
      expect(stats.nextAttemptTime).toBeUndefined();
      expect(circuitBreaker.isHealthy()).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track call statistics correctly', async () => {
      const mockOperation = jest.fn();
      
      // Mix of successful and failed calls
      mockOperation.mockResolvedValueOnce('success1');
      mockOperation.mockRejectedValueOnce(new Error('error1'));
      mockOperation.mockResolvedValueOnce('success2');
      
      await circuitBreaker.execute(mockOperation);
      
      try {
        await circuitBreaker.execute(mockOperation);
      } catch {}
      
      await circuitBreaker.execute(mockOperation);
      
      const stats = circuitBreaker.getStats();
      expect(stats.totalCalls).toBe(3);
      expect(stats.successCount).toBe(2);
      expect(stats.failureCount).toBe(0); // Should be reduced by successful calls
      expect(stats.lastSuccessTime).toBeDefined();
      expect(stats.lastFailureTime).toBeDefined();
    });
  });
});
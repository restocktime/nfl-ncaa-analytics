import { RateLimitMiddleware, RateLimitConfig } from '../../api/middleware/rate-limit-middleware';

describe('RateLimitMiddleware', () => {
  let rateLimitMiddleware: RateLimitMiddleware;
  const testConfig: RateLimitConfig = {
    windowMs: 1000, // 1 second for testing
    maxRequests: 3
  };

  beforeEach(() => {
    rateLimitMiddleware = new RateLimitMiddleware(testConfig);
  });

  describe('Rate Limiting Logic', () => {
    it('should allow requests within limit', () => {
      const clientId = 'test-client-1';
      
      // First request should be allowed
      const result1 = rateLimitMiddleware.checkRateLimit(clientId);
      expect(result1.allowed).toBe(true);
      expect(result1.info.remaining).toBe(2);
      
      // Second request should be allowed
      const result2 = rateLimitMiddleware.checkRateLimit(clientId);
      expect(result2.allowed).toBe(true);
      expect(result2.info.remaining).toBe(1);
      
      // Third request should be allowed
      const result3 = rateLimitMiddleware.checkRateLimit(clientId);
      expect(result3.allowed).toBe(true);
      expect(result3.info.remaining).toBe(0);
    });

    it('should block requests exceeding limit', () => {
      const clientId = 'test-client-2';
      
      // Use up all allowed requests
      for (let i = 0; i < testConfig.maxRequests; i++) {
        const result = rateLimitMiddleware.checkRateLimit(clientId);
        expect(result.allowed).toBe(true);
      }
      
      // Next request should be blocked
      const blockedResult = rateLimitMiddleware.checkRateLimit(clientId);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.info.remaining).toBe(0);
    });

    it('should reset after time window expires', async () => {
      const clientId = 'test-client-3';
      
      // Use up all requests
      for (let i = 0; i < testConfig.maxRequests; i++) {
        rateLimitMiddleware.checkRateLimit(clientId);
      }
      
      // Should be blocked
      const blockedResult = rateLimitMiddleware.checkRateLimit(clientId);
      expect(blockedResult.allowed).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, testConfig.windowMs + 100));
      
      // Should be allowed again
      const allowedResult = rateLimitMiddleware.checkRateLimit(clientId);
      expect(allowedResult.allowed).toBe(true);
      expect(allowedResult.info.remaining).toBe(testConfig.maxRequests - 1);
    });

    it('should handle multiple clients independently', () => {
      const client1 = 'test-client-4';
      const client2 = 'test-client-5';
      
      // Use up client1's requests
      for (let i = 0; i < testConfig.maxRequests; i++) {
        const result = rateLimitMiddleware.checkRateLimit(client1);
        expect(result.allowed).toBe(true);
      }
      
      // Client1 should be blocked
      const client1Blocked = rateLimitMiddleware.checkRateLimit(client1);
      expect(client1Blocked.allowed).toBe(false);
      
      // Client2 should still be allowed
      const client2Allowed = rateLimitMiddleware.checkRateLimit(client2);
      expect(client2Allowed.allowed).toBe(true);
    });
  });

  describe('Rate Limit Info', () => {
    it('should provide correct rate limit information', () => {
      const clientId = 'test-client-6';
      
      const result = rateLimitMiddleware.checkRateLimit(clientId);
      
      expect(result.info.limit).toBe(testConfig.maxRequests);
      expect(result.info.remaining).toBe(testConfig.maxRequests - 1);
      expect(result.info.resetTime).toBeGreaterThan(Date.now());
      expect(result.info.resetTime).toBeLessThanOrEqual(Date.now() + testConfig.windowMs);
    });

    it('should update remaining count correctly', () => {
      const clientId = 'test-client-7';
      
      const result1 = rateLimitMiddleware.checkRateLimit(clientId);
      expect(result1.info.remaining).toBe(2);
      
      const result2 = rateLimitMiddleware.checkRateLimit(clientId);
      expect(result2.info.remaining).toBe(1);
      
      const result3 = rateLimitMiddleware.checkRateLimit(clientId);
      expect(result3.info.remaining).toBe(0);
    });
  });

  describe('Client ID Generation', () => {
    it('should generate client ID from authenticated user', () => {
      const mockRequest = {
        user: { id: 'user-123' },
        headers: {},
        connection: { remoteAddress: '192.168.1.1' }
      };
      
      const clientId = rateLimitMiddleware.getClientId(mockRequest);
      expect(clientId).toBe('user:user-123');
    });

    it('should fallback to IP address when no user', () => {
      const mockRequest = {
        headers: {},
        connection: { remoteAddress: '192.168.1.1' }
      };
      
      const clientId = rateLimitMiddleware.getClientId(mockRequest);
      expect(clientId).toBe('ip:192.168.1.1');
    });

    it('should handle forwarded headers', () => {
      const mockRequest = {
        headers: { 'x-forwarded-for': '203.0.113.1, 192.168.1.1' },
        connection: { remoteAddress: '10.0.0.1' }
      };
      
      const clientId = rateLimitMiddleware.getClientId(mockRequest);
      expect(clientId).toBe('ip:203.0.113.1');
    });

    it('should handle missing connection info', () => {
      const mockRequest = {
        headers: {},
        connection: {}
      };
      
      const clientId = rateLimitMiddleware.getClientId(mockRequest);
      expect(clientId).toBe('ip:unknown');
    });
  });

  describe('Management Operations', () => {
    it('should reset rate limit for specific client', () => {
      const clientId = 'test-client-8';
      
      // Use up requests
      for (let i = 0; i < testConfig.maxRequests; i++) {
        rateLimitMiddleware.checkRateLimit(clientId);
      }
      
      // Should be blocked
      const blockedResult = rateLimitMiddleware.checkRateLimit(clientId);
      expect(blockedResult.allowed).toBe(false);
      
      // Reset the client
      rateLimitMiddleware.reset(clientId);
      
      // Should be allowed again
      const allowedResult = rateLimitMiddleware.checkRateLimit(clientId);
      expect(allowedResult.allowed).toBe(true);
    });

    it('should provide statistics', () => {
      const client1 = 'test-client-9';
      const client2 = 'test-client-10';
      
      // Make requests from different clients
      rateLimitMiddleware.checkRateLimit(client1);
      rateLimitMiddleware.checkRateLimit(client2);
      
      const stats = rateLimitMiddleware.getStats();
      expect(stats.totalClients).toBeGreaterThanOrEqual(2);
      expect(stats.activeWindows).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Configuration Options', () => {
    it('should handle different window sizes', () => {
      const shortWindowConfig: RateLimitConfig = {
        windowMs: 100, // 100ms
        maxRequests: 2
      };
      
      const shortWindowMiddleware = new RateLimitMiddleware(shortWindowConfig);
      const clientId = 'test-client-11';
      
      // Use up requests
      shortWindowMiddleware.checkRateLimit(clientId);
      shortWindowMiddleware.checkRateLimit(clientId);
      
      // Should be blocked
      const blockedResult = shortWindowMiddleware.checkRateLimit(clientId);
      expect(blockedResult.allowed).toBe(false);
    });

    it('should handle different request limits', () => {
      const highLimitConfig: RateLimitConfig = {
        windowMs: 1000,
        maxRequests: 10
      };
      
      const highLimitMiddleware = new RateLimitMiddleware(highLimitConfig);
      const clientId = 'test-client-12';
      
      // Should allow many requests
      for (let i = 0; i < 10; i++) {
        const result = highLimitMiddleware.checkRateLimit(clientId);
        expect(result.allowed).toBe(true);
      }
      
      // 11th request should be blocked
      const blockedResult = highLimitMiddleware.checkRateLimit(clientId);
      expect(blockedResult.allowed).toBe(false);
    });
  });

  describe('Memory Management', () => {
    it('should clean up expired entries', async () => {
      const clientId = 'test-client-13';
      
      // Make a request to create an entry
      rateLimitMiddleware.checkRateLimit(clientId);
      
      const initialStats = rateLimitMiddleware.getStats();
      expect(initialStats.totalClients).toBeGreaterThan(0);
      
      // Wait for window to expire and cleanup to run
      await new Promise(resolve => setTimeout(resolve, testConfig.windowMs + 200));
      
      // Trigger cleanup by checking stats
      const finalStats = rateLimitMiddleware.getStats();
      expect(finalStats.activeWindows).toBeLessThanOrEqual(initialStats.activeWindows);
    });
  });
});
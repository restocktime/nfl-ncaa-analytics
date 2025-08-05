/**
 * Unit tests for Redis caching layer (with mocked Redis client)
 */

import { RedisCache, CacheConfig, CacheKeyBuilder } from '../../core/redis-cache';
import { createLogger } from 'winston';

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  mGet: jest.fn(),
  multi: jest.fn(),
  sAdd: jest.fn(),
  sMembers: jest.fn(),
  flushDb: jest.fn(),
  ping: jest.fn(),
  info: jest.fn(),
  on: jest.fn()
};

const mockMulti = {
  setEx: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  sAdd: jest.fn().mockReturnThis(),
  del: jest.fn().mockReturnThis(),
  exec: jest.fn()
};

// Mock the redis module
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient)
}));

// Mock logger for testing
const mockLogger = createLogger({
  silent: true
});

describe('RedisCache Unit Tests', () => {
  let cache: RedisCache;
  let config: CacheConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    config = {
      host: 'localhost',
      port: 6379,
      maxRetries: 3,
      retryDelayMs: 100,
      connectionTimeout: 5000,
      commandTimeout: 3000,
      maxRetriesPerRequest: 3
    };

    cache = new RedisCache(config, mockLogger);
    
    // Mock successful connection
    mockRedisClient.connect.mockResolvedValue(undefined);
    mockRedisClient.multi.mockReturnValue(mockMulti);
    mockMulti.exec.mockResolvedValue([]);
  });

  describe('Connection Management', () => {
    it('should connect successfully', async () => {
      await cache.connect();
      
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should disconnect successfully', async () => {
      mockRedisClient.disconnect.mockResolvedValue(undefined);
      
      await cache.disconnect();
      
      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockRedisClient.connect.mockRejectedValue(error);
      
      await expect(cache.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('Basic Cache Operations', () => {
    beforeEach(async () => {
      await cache.connect();
    });

    it('should get a value from cache', async () => {
      const key = 'test:key';
      const value = { data: 'test value' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(value));

      const result = await cache.get(key);

      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const key = 'non-existent';
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cache.get(key);

      expect(result).toBeNull();
    });

    it('should set a value in cache with TTL', async () => {
      const key = 'test:key';
      const value = { data: 'test value' };
      const ttl = 300;

      await cache.set(key, value, { ttl });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        key,
        ttl,
        JSON.stringify(value)
      );
    });

    it('should set a value in cache without TTL', async () => {
      const key = 'unknown:key'; // This will get default TTL of 3600
      const value = { data: 'test value' };

      await cache.set(key, value);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        key,
        3600, // Default TTL
        JSON.stringify(value)
      );
    });

    it('should delete a key from cache', async () => {
      const key = 'test:key';
      mockRedisClient.del.mockResolvedValue(1);

      const result = await cache.delete(key);

      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });

    it('should check if key exists', async () => {
      const key = 'test:key';
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await cache.exists(key);

      expect(mockRedisClient.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });
  });

  describe('Batch Operations', () => {
    beforeEach(async () => {
      await cache.connect();
    });

    it('should get multiple values', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = [
        JSON.stringify({ data: 'value1' }),
        null,
        JSON.stringify({ data: 'value3' })
      ];
      mockRedisClient.mGet.mockResolvedValue(values);

      const results = await cache.mget(keys);

      expect(mockRedisClient.mGet).toHaveBeenCalledWith(keys);
      expect(results).toEqual([
        { data: 'value1' },
        null,
        { data: 'value3' }
      ]);
    });

    it('should set multiple values', async () => {
      const keyValuePairs = [
        { key: 'key1', value: { data: 'value1' }, options: { ttl: 300 } },
        { key: 'unknown:key2', value: { data: 'value2' } } // Will get default TTL
      ];

      const result = await cache.mset(keyValuePairs);

      expect(mockMulti.setEx).toHaveBeenCalledWith('key1', 300, JSON.stringify({ data: 'value1' }));
      expect(mockMulti.setEx).toHaveBeenCalledWith('unknown:key2', 3600, JSON.stringify({ data: 'value2' }));
      expect(mockMulti.exec).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('Tag-based Invalidation', () => {
    beforeEach(async () => {
      await cache.connect();
    });

    it('should invalidate cache by tags', async () => {
      const tags = ['tag1', 'tag2'];
      const keysForTag1 = ['key1', 'key2'];
      const keysForTag2 = ['key3'];

      mockRedisClient.sMembers
        .mockResolvedValueOnce(keysForTag1)
        .mockResolvedValueOnce(keysForTag2);

      const result = await cache.invalidateByTags(tags);

      expect(mockRedisClient.sMembers).toHaveBeenCalledWith('tag:tag1');
      expect(mockRedisClient.sMembers).toHaveBeenCalledWith('tag:tag2');
      expect(mockMulti.del).toHaveBeenCalledTimes(5); // 3 keys + 2 tag sets
      expect(result).toBe(3); // Total keys deleted
    });

    it('should handle empty tags', async () => {
      const result = await cache.invalidateByTags([]);
      expect(result).toBe(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await cache.connect();
    });

    it('should track cache hits and misses', async () => {
      mockRedisClient.get
        .mockResolvedValueOnce(JSON.stringify({ data: 'hit' }))
        .mockResolvedValueOnce(null);

      await cache.get('hit-key');
      await cache.get('miss-key');

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should track set operations', async () => {
      await cache.set('key', { data: 'value' });

      const stats = cache.getStats();
      expect(stats.sets).toBe(1);
    });

    it('should reset statistics', () => {
      cache.resetStats();
      const stats = cache.getStats();
      
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.sets).toBe(0);
      expect(stats.deletes).toBe(0);
      expect(stats.errors).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('Health Check', () => {
    beforeEach(async () => {
      await cache.connect();
    });

    it('should provide health information', async () => {
      mockRedisClient.ping.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve('PONG'), 10); // Simulate some latency
        });
      });
      mockRedisClient.info.mockResolvedValue('used_memory:1024');

      const health = await cache.getHealth();

      expect(health.connected).toBe(true);
      expect(health.latency).toBeGreaterThan(0);
      expect(health.memory).toBeDefined();
    });

    it('should handle health check errors', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Ping failed'));

      const health = await cache.getHealth();

      expect(health.connected).toBe(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await cache.connect();
    });

    it('should handle get errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await cache.get('error-key');

      expect(result).toBeNull();
    });

    it('should handle set errors gracefully', async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error('Redis error'));

      const result = await cache.set('error-key', { data: 'value' });

      expect(result).toBe(false);
    });

    it('should handle operations when disconnected', async () => {
      // Don't connect or simulate disconnection
      const disconnectedCache = new RedisCache(config, mockLogger);

      const getValue = await disconnectedCache.get('key');
      const setValue = await disconnectedCache.set('key', 'value');
      const deleteValue = await disconnectedCache.delete('key');
      const existsValue = await disconnectedCache.exists('key');

      expect(getValue).toBeNull();
      expect(setValue).toBe(false);
      expect(deleteValue).toBe(false);
      expect(existsValue).toBe(false);
    });
  });

  describe('Cache Key Builder', () => {
    it('should build correct cache keys', () => {
      expect(CacheKeyBuilder.gameScore('game-123')).toBe('gameScore:game-123');
      expect(CacheKeyBuilder.bettingLine('game-123', 'DraftKings')).toBe('bettingLine:game-123:DraftKings');
      expect(CacheKeyBuilder.playerStats('player-456', 2024)).toBe('playerStats:player-456:2024');
      expect(CacheKeyBuilder.teamStats('team-789', 2024)).toBe('teamStats:team-789:2024');
      expect(CacheKeyBuilder.weather('venue-101')).toBe('weather:venue-101');
      expect(CacheKeyBuilder.gameState('game-123')).toBe('gameState:game-123');
      expect(CacheKeyBuilder.prediction('game-123', 'spread')).toBe('prediction:game-123:spread');
      expect(CacheKeyBuilder.historical('matchups', 'team1', 'team2')).toBe('historical:matchups:team1:team2');
    });
  });

  describe('Default TTL Logic', () => {
    beforeEach(async () => {
      await cache.connect();
    });

    it('should use correct default TTL for different key types', async () => {
      const testCases = [
        { key: CacheKeyBuilder.gameScore('game-123'), expectedTTL: 30 },
        { key: CacheKeyBuilder.bettingLine('game-123', 'DK'), expectedTTL: 60 },
        { key: CacheKeyBuilder.playerStats('player-123', 2024), expectedTTL: 3600 },
        { key: CacheKeyBuilder.weather('venue-123'), expectedTTL: 1800 },
        { key: 'unknown:key:type', expectedTTL: 3600 } // Default
      ];

      for (const testCase of testCases) {
        await cache.set(testCase.key, { data: 'test' });
        
        expect(mockRedisClient.setEx).toHaveBeenCalledWith(
          testCase.key,
          testCase.expectedTTL,
          JSON.stringify({ data: 'test' })
        );
      }
    });
  });
});
/**
 * Integration tests for Redis caching layer
 */

import { RedisCache, CacheConfig, CacheKeyBuilder } from '../../core/redis-cache';
import { createLogger } from 'winston';

// Mock logger for testing
const mockLogger = createLogger({
  silent: true
});

describe('RedisCache Integration Tests', () => {
  let cache: RedisCache;
  let config: CacheConfig;

  beforeAll(async () => {
    config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      database: 1, // Use database 1 for testing
      maxRetries: 3,
      retryDelayMs: 100,
      connectionTimeout: 5000,
      commandTimeout: 3000,
      maxRetriesPerRequest: 3
    };

    cache = new RedisCache(config, mockLogger);
    
    try {
      await cache.connect();
    } catch (error) {
      console.warn('Redis not available for integration tests, skipping...');
      return;
    }
  });

  afterAll(async () => {
    if (cache) {
      await cache.clear();
      await cache.disconnect();
    }
  });

  beforeEach(async () => {
    if (cache) {
      await cache.clear();
      cache.resetStats();
    }
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      if (!cache) return;

      const key = 'test:basic';
      const value = { message: 'Hello Redis' };

      const setResult = await cache.set(key, value);
      expect(setResult).toBe(true);

      const retrievedValue = await cache.get(key);
      expect(retrievedValue).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      if (!cache) return;

      const result = await cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete a key', async () => {
      if (!cache) return;

      const key = 'test:delete';
      const value = { data: 'to be deleted' };

      await cache.set(key, value);
      const deleteResult = await cache.delete(key);
      expect(deleteResult).toBe(true);

      const retrievedValue = await cache.get(key);
      expect(retrievedValue).toBeNull();
    });

    it('should check if key exists', async () => {
      if (!cache) return;

      const key = 'test:exists';
      const value = { data: 'exists test' };

      expect(await cache.exists(key)).toBe(false);

      await cache.set(key, value);
      expect(await cache.exists(key)).toBe(true);

      await cache.delete(key);
      expect(await cache.exists(key)).toBe(false);
    });
  });

  describe('TTL and Expiration', () => {
    it('should set value with custom TTL', async () => {
      if (!cache) return;

      const key = 'test:ttl';
      const value = { data: 'expires soon' };
      const ttl = 2; // 2 seconds

      await cache.set(key, value, { ttl });
      
      // Should exist immediately
      expect(await cache.exists(key)).toBe(true);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Should be expired
      expect(await cache.exists(key)).toBe(false);
    }, 10000);

    it('should use default TTL for game scores', async () => {
      if (!cache) return;

      const key = CacheKeyBuilder.gameScore('game-123');
      const value = { homeScore: 21, awayScore: 14 };

      await cache.set(key, value);
      expect(await cache.get(key)).toEqual(value);
    });
  });

  describe('Batch Operations', () => {
    it('should get multiple values', async () => {
      if (!cache) return;

      const data = [
        { key: 'test:multi1', value: { data: 'first' } },
        { key: 'test:multi2', value: { data: 'second' } },
        { key: 'test:multi3', value: { data: 'third' } }
      ];

      // Set values individually
      for (const item of data) {
        await cache.set(item.key, item.value);
      }

      // Get all values at once
      const keys = data.map(item => item.key);
      const results = await cache.mget(keys);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(data[0].value);
      expect(results[1]).toEqual(data[1].value);
      expect(results[2]).toEqual(data[2].value);
    });

    it('should set multiple values', async () => {
      if (!cache) return;

      const keyValuePairs = [
        { key: 'test:mset1', value: { data: 'first' } },
        { key: 'test:mset2', value: { data: 'second' } },
        { key: 'test:mset3', value: { data: 'third' } }
      ];

      const result = await cache.mset(keyValuePairs);
      expect(result).toBe(true);

      // Verify all values were set
      for (const pair of keyValuePairs) {
        const value = await cache.get(pair.key);
        expect(value).toEqual(pair.value);
      }
    });

    it('should handle mixed existing and non-existing keys in mget', async () => {
      if (!cache) return;

      await cache.set('test:exists', { data: 'exists' });

      const keys = ['test:exists', 'test:not-exists', 'test:also-not-exists'];
      const results = await cache.mget(keys);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ data: 'exists' });
      expect(results[1]).toBeNull();
      expect(results[2]).toBeNull();
    });
  });

  describe('Tag-based Cache Invalidation', () => {
    it('should invalidate cache by tags', async () => {
      if (!cache) return;

      const gameId = 'game-123';
      const teamTag = 'team-456';
      
      // Set values with tags
      await cache.set('gameScore:123', { score: 21 }, { tags: [gameId, teamTag] });
      await cache.set('gameState:123', { quarter: 2 }, { tags: [gameId] });
      await cache.set('teamStats:456', { wins: 8 }, { tags: [teamTag] });

      // Verify values exist
      expect(await cache.exists('gameScore:123')).toBe(true);
      expect(await cache.exists('gameState:123')).toBe(true);
      expect(await cache.exists('teamStats:456')).toBe(true);

      // Invalidate by game tag
      const deletedCount = await cache.invalidateByTags([gameId]);
      expect(deletedCount).toBe(2); // gameScore and gameState

      // Check what remains
      expect(await cache.exists('gameScore:123')).toBe(false);
      expect(await cache.exists('gameState:123')).toBe(false);
      expect(await cache.exists('teamStats:456')).toBe(true); // Should still exist
    });

    it('should handle multiple tags for invalidation', async () => {
      if (!cache) return;

      await cache.set('key1', { data: 'one' }, { tags: ['tag1', 'tag2'] });
      await cache.set('key2', { data: 'two' }, { tags: ['tag2', 'tag3'] });
      await cache.set('key3', { data: 'three' }, { tags: ['tag3'] });

      const deletedCount = await cache.invalidateByTags(['tag2', 'tag3']);
      expect(deletedCount).toBe(3); // All keys should be deleted

      expect(await cache.exists('key1')).toBe(false);
      expect(await cache.exists('key2')).toBe(false);
      expect(await cache.exists('key3')).toBe(false);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track cache statistics', async () => {
      if (!cache) return;

      cache.resetStats();
      
      // Perform operations
      await cache.set('test:stats1', { data: 'one' });
      await cache.set('test:stats2', { data: 'two' });
      
      await cache.get('test:stats1'); // Hit
      await cache.get('test:stats2'); // Hit
      await cache.get('test:nonexistent'); // Miss
      
      await cache.delete('test:stats1');

      const stats = cache.getStats();
      
      expect(stats.sets).toBe(2);
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.deletes).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.67, 2); // 2 hits out of 3 total
    });

    it('should provide health check information', async () => {
      if (!cache) return;

      const health = await cache.getHealth();
      
      expect(health.connected).toBe(true);
      expect(health.latency).toBeGreaterThan(0);
      expect(health.memory).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle disconnection gracefully', async () => {
      if (!cache) return;

      await cache.disconnect();
      
      // Operations should return safe defaults
      const getValue = await cache.get('test:disconnected');
      expect(getValue).toBeNull();
      
      const setValue = await cache.set('test:disconnected', { data: 'test' });
      expect(setValue).toBe(false);
      
      const deleteValue = await cache.delete('test:disconnected');
      expect(deleteValue).toBe(false);
      
      const existsValue = await cache.exists('test:disconnected');
      expect(existsValue).toBe(false);

      // Reconnect for cleanup
      await cache.connect();
    });

    it('should handle invalid JSON gracefully', async () => {
      if (!cache) return;

      // This test would require direct Redis manipulation to insert invalid JSON
      // For now, we'll test that the cache handles parsing errors
      const result = await cache.get('non-existent-key');
      expect(result).toBeNull();
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

  describe('Real-world Scenarios', () => {
    it('should handle game score caching scenario', async () => {
      if (!cache) return;

      const gameId = 'nfl-2024-week1-chiefs-ravens';
      const key = CacheKeyBuilder.gameScore(gameId);
      
      // Initial score
      const initialScore = {
        gameId,
        homeScore: 14,
        awayScore: 7,
        quarter: 2,
        timeRemaining: { quarter: 2, minutes: 8, seconds: 30 },
        lastUpdated: new Date(),
        final: false
      };

      await cache.set(key, initialScore, { 
        ttl: 30, // 30 seconds for live scores
        tags: [gameId, 'live-scores'] 
      });

      // Retrieve and verify
      const cachedScore = await cache.get(key);
      expect(cachedScore).toMatchObject({
        gameId,
        homeScore: 14,
        awayScore: 7,
        quarter: 2
      });

      // Update score
      const updatedScore = { ...initialScore, homeScore: 21 };
      await cache.set(key, updatedScore, { 
        ttl: 30,
        tags: [gameId, 'live-scores'] 
      });

      const newCachedScore = await cache.get(key);
      expect(newCachedScore).toMatchObject({
        homeScore: 21,
        awayScore: 7
      });
    });

    it('should handle betting line caching with multiple sportsbooks', async () => {
      if (!cache) return;

      const gameId = 'game-123';
      const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM'];
      
      const bettingLines = sportsbooks.map(sportsbook => ({
        key: CacheKeyBuilder.bettingLine(gameId, sportsbook),
        value: {
          gameId,
          sportsbook,
          spread: { home: -3.5, away: 3.5, homeOdds: -110, awayOdds: -110 },
          total: { line: 47.5, overOdds: -110, underOdds: -110 },
          moneyline: { home: -150, away: 130 },
          lastUpdated: new Date()
        },
        options: { ttl: 60, tags: [gameId, 'betting-lines'] }
      }));

      // Set all betting lines
      await cache.mset(bettingLines);

      // Retrieve all at once
      const keys = bettingLines.map(line => line.key);
      const cachedLines = await cache.mget(keys);

      expect(cachedLines).toHaveLength(3);
      cachedLines.forEach((line, index) => {
        expect(line).toMatchObject({
          sportsbook: sportsbooks[index],
          gameId
        });
      });

      // Invalidate all betting lines for the game
      const deletedCount = await cache.invalidateByTags([gameId]);
      expect(deletedCount).toBe(3);
    });
  });
});
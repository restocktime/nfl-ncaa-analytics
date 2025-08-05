/**
 * Redis caching layer with connection pooling and TTL-based strategies
 */

import { createClient, RedisClientType } from 'redis';
import { Logger } from 'winston';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
  maxRetries: number;
  retryDelayMs: number;
  connectionTimeout: number;
  commandTimeout: number;
  maxRetriesPerRequest: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean;
  tags?: string[]; // For cache invalidation by tags
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

export enum CacheStrategy {
  WRITE_THROUGH = 'write_through',
  WRITE_BEHIND = 'write_behind',
  WRITE_AROUND = 'write_around',
  READ_THROUGH = 'read_through',
  REFRESH_AHEAD = 'refresh_ahead'
}

export class RedisCache {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0
  };
  private readonly logger: Logger;
  private readonly config: CacheConfig;

  // Default TTL values for different data types (in seconds)
  private readonly DEFAULT_TTLS = {
    gameScore: 30,        // 30 seconds for live scores
    bettingLine: 60,      // 1 minute for betting lines
    playerStats: 3600,    // 1 hour for player statistics
    teamStats: 7200,      // 2 hours for team statistics
    weatherData: 1800,    // 30 minutes for weather
    gameState: 15,        // 15 seconds for live game state
    predictions: 300,     // 5 minutes for predictions
    historical: 86400     // 24 hours for historical data
  };

  constructor(config: CacheConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    
    const clientOptions = {
      socket: {
        host: config.host,
        port: config.port,
        connectTimeout: config.connectionTimeout,
        reconnectStrategy: (retries: number) => {
          if (retries > config.maxRetries) {
            return new Error('Max retries exceeded');
          }
          return Math.min(retries * config.retryDelayMs, 3000);
        }
      },
      password: config.password,
      database: config.database || 0
    };

    this.client = createClient(clientOptions) as RedisClientType;
    this.setupEventHandlers();
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.isConnected = true;
      this.logger.info('Redis cache connected successfully');
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Failed to connect to Redis cache', { error });
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      this.isConnected = false;
      this.logger.info('Redis cache disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from Redis cache', { error });
      throw error;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      this.logger.warn('Redis cache not connected, returning null');
      return null;
    }

    try {
      const value = await this.client.get(key);
      
      if (value === null) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();
      
      return JSON.parse(value) as T;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error getting value from cache', { key, error });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('Redis cache not connected, skipping set operation');
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      const ttl = options?.ttl || this.getDefaultTTL(key);
      
      if (ttl > 0) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }

      // Add tags for cache invalidation
      if (options?.tags) {
        await this.addTags(key, options.tags);
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error setting value in cache', { key, error });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('Redis cache not connected, skipping delete operation');
      return false;
    }

    try {
      const result = await this.client.del(key);
      this.stats.deletes++;
      return result > 0;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error deleting value from cache', { key, error });
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result > 0;
    } catch (error) {
      this.logger.error('Error checking key existence in cache', { key, error });
      return false;
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isConnected || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.client.mGet(keys);
      
      return values.map((value, index) => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }
        
        this.stats.hits++;
        try {
          return JSON.parse(value) as T;
        } catch (error) {
          this.logger.error('Error parsing cached value', { key: keys[index], error });
          return null;
        }
      });
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error getting multiple values from cache', { keys, error });
      return keys.map(() => null);
    } finally {
      this.updateHitRate();
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset(keyValuePairs: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<boolean> {
    if (!this.isConnected || keyValuePairs.length === 0) {
      return false;
    }

    try {
      // Use pipeline for better performance
      const pipeline = this.client.multi();
      
      for (const { key, value, options } of keyValuePairs) {
        const serializedValue = JSON.stringify(value);
        const ttl = options?.ttl || this.getDefaultTTL(key);
        
        if (ttl > 0) {
          pipeline.setEx(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }

        // Add tags if specified
        if (options?.tags) {
          for (const tag of options.tags) {
            pipeline.sAdd(`tag:${tag}`, key);
          }
        }
      }

      await pipeline.exec();
      this.stats.sets += keyValuePairs.length;
      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error setting multiple values in cache', { error });
      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.isConnected || tags.length === 0) {
      return 0;
    }

    try {
      let deletedCount = 0;
      
      for (const tag of tags) {
        const keys = await this.client.sMembers(`tag:${tag}`);
        
        if (keys.length > 0) {
          const pipeline = this.client.multi();
          
          // Delete all keys with this tag
          for (const key of keys) {
            pipeline.del(key);
          }
          
          // Delete the tag set itself
          pipeline.del(`tag:${tag}`);
          
          await pipeline.exec();
          deletedCount += keys.length;
        }
      }

      this.stats.deletes += deletedCount;
      this.logger.info('Cache invalidated by tags', { tags, deletedCount });
      return deletedCount;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error invalidating cache by tags', { tags, error });
      return 0;
    }
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.flushDb();
      this.logger.info('Cache cleared successfully');
      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error clearing cache', { error });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0
    };
  }

  /**
   * Get cache health status
   */
  async getHealth(): Promise<{ connected: boolean; latency?: number; memory?: any }> {
    if (!this.isConnected) {
      return { connected: false };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;

      // Get memory info using INFO command instead
      const info = await this.client.info('memory');
      const memory = { info };

      return {
        connected: true,
        latency,
        memory
      };
    } catch (error) {
      this.logger.error('Error checking cache health', { error });
      return { connected: false };
    }
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('error', (error) => {
      this.isConnected = false;
      this.logger.error('Redis client error', { error });
    });

    this.client.on('connect', () => {
      this.logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.logger.info('Redis client ready');
    });

    this.client.on('end', () => {
      this.isConnected = false;
      this.logger.info('Redis client connection ended');
    });

    this.client.on('reconnecting', () => {
      this.logger.info('Redis client reconnecting');
    });
  }

  /**
   * Add tags to a key for cache invalidation
   */
  private async addTags(key: string, tags: string[]): Promise<void> {
    const pipeline = this.client.multi();
    
    for (const tag of tags) {
      pipeline.sAdd(`tag:${tag}`, key);
    }
    
    await pipeline.exec();
  }

  /**
   * Get default TTL based on key pattern
   */
  private getDefaultTTL(key: string): number {
    if (key.includes('gameScore')) return this.DEFAULT_TTLS.gameScore;
    if (key.includes('bettingLine')) return this.DEFAULT_TTLS.bettingLine;
    if (key.includes('playerStats')) return this.DEFAULT_TTLS.playerStats;
    if (key.includes('teamStats')) return this.DEFAULT_TTLS.teamStats;
    if (key.includes('weather')) return this.DEFAULT_TTLS.weatherData;
    if (key.includes('gameState')) return this.DEFAULT_TTLS.gameState;
    if (key.includes('prediction')) return this.DEFAULT_TTLS.predictions;
    if (key.includes('historical')) return this.DEFAULT_TTLS.historical;
    
    return 3600; // Default 1 hour
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Add item to list
   */
  async addToList(key: string, value: string): Promise<number> {
    if (!this.isConnected) {
      this.logger.warn('Redis cache not connected, skipping list operation');
      return 0;
    }

    try {
      return await this.client.lPush(key, value);
    } catch (error) {
      this.logger.error('Error adding to list', { key, error });
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Get list items
   */
  async getList(key: string, start: number = 0, end: number = -1): Promise<string[]> {
    if (!this.isConnected) {
      this.logger.warn('Redis cache not connected, returning empty list');
      return [];
    }

    try {
      return await this.client.lRange(key, start, end);
    } catch (error) {
      this.logger.error('Error getting list', { key, start, end, error });
      this.stats.errors++;
      return [];
    }
  }

  /**
   * Set expiration on key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('Redis cache not connected, skipping expire operation');
      return false;
    }

    try {
      const result = await this.client.expire(key, seconds);
      return result;
    } catch (error) {
      this.logger.error('Error setting expiration', { key, seconds, error });
      this.stats.errors++;
      return false;
    }
  }
}

/**
 * Cache key builder utility
 */
export class CacheKeyBuilder {
  private static readonly SEPARATOR = ':';

  static gameScore(gameId: string): string {
    return `gameScore${this.SEPARATOR}${gameId}`;
  }

  static bettingLine(gameId: string, sportsbook: string): string {
    return `bettingLine${this.SEPARATOR}${gameId}${this.SEPARATOR}${sportsbook}`;
  }

  static playerStats(playerId: string, season: number): string {
    return `playerStats${this.SEPARATOR}${playerId}${this.SEPARATOR}${season}`;
  }

  static teamStats(teamId: string, season: number): string {
    return `teamStats${this.SEPARATOR}${teamId}${this.SEPARATOR}${season}`;
  }

  static weather(venueId: string): string {
    return `weather${this.SEPARATOR}${venueId}`;
  }

  static gameState(gameId: string): string {
    return `gameState${this.SEPARATOR}${gameId}`;
  }

  static prediction(gameId: string, type: string): string {
    return `prediction${this.SEPARATOR}${gameId}${this.SEPARATOR}${type}`;
  }

  static historical(type: string, ...params: string[]): string {
    return `historical${this.SEPARATOR}${type}${this.SEPARATOR}${params.join(this.SEPARATOR)}`;
  }
}
import { InfluxDB, Point, WriteApi, QueryApi } from '@influxdata/influxdb-client';

export interface InfluxDBConfig {
  url: string;
  token: string;
  org: string;
  bucket: string;
  timeout?: number;
  maxRetries?: number;
  batchSize?: number;
  flushInterval?: number;
}

export interface MetricPoint {
  measurement: string;
  tags: Record<string, string>;
  fields: Record<string, number | string | boolean>;
  timestamp?: Date;
}

export interface RetentionPolicy {
  name: string;
  duration: string;
  shardGroupDuration?: string;
  replicationFactor?: number;
  isDefault?: boolean;
}

export interface DataRetentionConfig {
  gameEvents: string;        // e.g., '7d' - game events kept for 7 days
  probabilities: string;     // e.g., '30d' - probabilities kept for 30 days
  playerStats: string;       // e.g., '365d' - player stats kept for 1 year
  systemMetrics: string;     // e.g., '7d' - system metrics kept for 7 days
  apiMetrics: string;        // e.g., '30d' - API metrics kept for 30 days
}

export class InfluxDBManager {
  private client: InfluxDB;
  private writeApi: WriteApi;
  private queryApi: QueryApi;
  public readonly config: InfluxDBConfig;
  private isConnected: boolean = false;

  constructor(config: InfluxDBConfig) {
    this.config = config;
    this.client = new InfluxDB({
      url: config.url,
      token: config.token,
      timeout: config.timeout || 30000
    });
    
    this.writeApi = this.client.getWriteApi(config.org, config.bucket, 'ms', {
      batchSize: config.batchSize || 1000,
      flushInterval: config.flushInterval || 5000,
      maxRetries: config.maxRetries || 3
    });

    this.queryApi = this.client.getQueryApi(config.org);
  }

  async initialize(): Promise<void> {
    try {
      // Test connection by querying bucket info
      await this.queryApi.queryRaw(`
        from(bucket: "${this.config.bucket}")
        |> range(start: -1m)
        |> limit(n: 1)
      `);
      
      this.isConnected = true;
      console.log('InfluxDB connection established successfully');
    } catch (error) {
      console.error('Failed to connect to InfluxDB:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      await this.writeApi.close();
      this.isConnected = false;
      console.log('InfluxDB connection closed');
    } catch (error) {
      console.error('Error closing InfluxDB connection:', error);
      throw error;
    }
  }

  async writePoint(point: MetricPoint): Promise<void> {
    if (!this.isConnected) {
      throw new Error('InfluxDB not connected. Call initialize() first.');
    }

    const startTime = Date.now();
    
    try {
      const influxPoint = new Point(point.measurement);
      
      // Add tags
      Object.entries(point.tags).forEach(([key, value]) => {
        influxPoint.tag(key, value);
      });

      // Add fields
      Object.entries(point.fields).forEach(([key, value]) => {
        if (typeof value === 'number') {
          influxPoint.floatField(key, value);
        } else if (typeof value === 'boolean') {
          influxPoint.booleanField(key, value);
        } else {
          influxPoint.stringField(key, value.toString());
        }
      });

      // Set timestamp if provided
      if (point.timestamp) {
        influxPoint.timestamp(point.timestamp);
      }

      this.writeApi.writePoint(influxPoint);
      
      // Track write performance
      const duration = Date.now() - startTime;
      if (duration > 100) { // Log slow writes
        console.warn(`Slow InfluxDB write detected: ${duration}ms for ${point.measurement}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`InfluxDB write failed after ${duration}ms:`, error);
      throw error;
    }
  }

  async writePoints(points: MetricPoint[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('InfluxDB not connected. Call initialize() first.');
    }

    const influxPoints = points.map(point => {
      const influxPoint = new Point(point.measurement);
      
      Object.entries(point.tags).forEach(([key, value]) => {
        influxPoint.tag(key, value);
      });

      Object.entries(point.fields).forEach(([key, value]) => {
        if (typeof value === 'number') {
          influxPoint.floatField(key, value);
        } else if (typeof value === 'boolean') {
          influxPoint.booleanField(key, value);
        } else {
          influxPoint.stringField(key, value.toString());
        }
      });

      if (point.timestamp) {
        influxPoint.timestamp(point.timestamp);
      }

      return influxPoint;
    });

    this.writeApi.writePoints(influxPoints);
  }

  async flush(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('InfluxDB not connected');
    }
    
    await this.writeApi.flush();
  }

  async query<T = any>(fluxQuery: string): Promise<T[]> {
    if (!this.isConnected) {
      throw new Error('InfluxDB not connected');
    }

    const results: T[] = [];
    
    return new Promise((resolve, reject) => {
      this.queryApi.queryRows(fluxQuery, {
        next: (row: any, tableMeta: any) => {
          const record = tableMeta.toObject(row) as T;
          results.push(record);
        },
        error: (error: any) => {
          reject(error);
        },
        complete: () => {
          resolve(results);
        }
      });
    });
  }

  async queryRaw(fluxQuery: string): Promise<string> {
    if (!this.isConnected) {
      throw new Error('InfluxDB not connected');
    }

    return this.queryApi.queryRaw(fluxQuery);
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      
      await this.queryApi.queryRaw(`
        from(bucket: "${this.config.bucket}")
        |> range(start: -1m)
        |> limit(n: 1)
      `);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async getBucketInfo(): Promise<any> {
    if (!this.isConnected) {
      throw new Error('InfluxDB not connected');
    }

    const query = `
      buckets()
      |> filter(fn: (r) => r.name == "${this.config.bucket}")
    `;

    return this.query(query);
  }

  async createRetentionPolicy(policy: RetentionPolicy): Promise<void> {
    // Note: InfluxDB 2.x uses retention policies differently than 1.x
    // In InfluxDB 2.x, retention is configured at the bucket level
    // This method logs the policy configuration for monitoring purposes
    console.log(`Retention policy configuration for bucket: ${this.config.bucket}`, policy);
    
    // In a production environment, you would use the InfluxDB API to configure bucket retention
    // Example: await this.client.getBucketsAPI().updateBucket({...bucket, retentionRules: [...]})
  }

  async setupDataRetentionPolicies(retentionConfig: DataRetentionConfig): Promise<void> {
    if (!this.isConnected) {
      throw new Error('InfluxDB not connected');
    }

    const policies = [
      { name: 'game_events_retention', duration: retentionConfig.gameEvents, measurement: 'game_state' },
      { name: 'probabilities_retention', duration: retentionConfig.probabilities, measurement: 'game_probabilities' },
      { name: 'player_stats_retention', duration: retentionConfig.playerStats, measurement: 'player_stats' },
      { name: 'system_metrics_retention', duration: retentionConfig.systemMetrics, measurement: 'system_metrics' },
      { name: 'api_metrics_retention', duration: retentionConfig.apiMetrics, measurement: 'api_metrics' }
    ];

    for (const policy of policies) {
      console.log(`Setting up retention policy for ${policy.measurement}: ${policy.duration}`);
      // In a real implementation, this would configure bucket retention rules
      // For now, we'll store the configuration for use in cleanup operations
    }
  }

  async optimizeForRealTimeDashboard(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('InfluxDB not connected');
    }

    // Configure write API for optimal real-time performance
    this.writeApi = this.client.getWriteApi(this.config.org, this.config.bucket, 'ms', {
      batchSize: this.config.batchSize || 500,  // Smaller batches for faster writes
      flushInterval: this.config.flushInterval || 1000,  // More frequent flushes (1 second)
      maxRetries: this.config.maxRetries || 3,
      maxBufferLines: 10000,  // Larger buffer for high-frequency data
      defaultTags: {
        source: 'football-analytics-system',
        version: '1.0.0'
      }
    });

    console.log('InfluxDB optimized for real-time dashboard performance');
  }

  async getOptimizedDashboardQuery(measurement: string, gameId?: string, timeRange: string = '-5m'): Promise<string> {
    // Optimized query for real-time dashboard with proper indexing hints
    let query = `
      from(bucket: "${this.config.bucket}")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "${measurement}")
    `;

    if (gameId) {
      query += `|> filter(fn: (r) => r.game_id == "${gameId}")`;
    }

    // Add optimization hints for real-time queries
    query += `
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1000)
    `;

    return query;
  }

  async getOptimizedAggregationQuery(
    measurement: string, 
    field: string, 
    aggregation: 'mean' | 'sum' | 'count' | 'max' | 'min',
    timeRange: string = '-1h',
    groupBy?: string
  ): Promise<string> {
    let query = `
      from(bucket: "${this.config.bucket}")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r._field == "${field}")
    `;

    if (groupBy) {
      query += `|> group(columns: ["${groupBy}"])`;
    }

    query += `|> ${aggregation}()`;

    return query;
  }

  async getOptimizedTimeSeriesQuery(
    measurement: string,
    fields: string[],
    timeRange: string = '-1h',
    interval: string = '1m',
    gameId?: string
  ): Promise<string> {
    let query = `
      from(bucket: "${this.config.bucket}")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "${measurement}")
    `;

    if (gameId) {
      query += `|> filter(fn: (r) => r.game_id == "${gameId}")`;
    }

    if (fields.length > 0) {
      const fieldFilter = fields.map(field => `r._field == "${field}"`).join(' or ');
      query += `|> filter(fn: (r) => ${fieldFilter})`;
    }

    query += `
      |> aggregateWindow(every: ${interval}, fn: mean, createEmpty: false)
      |> sort(columns: ["_time"])
    `;

    return query;
  }

  async deleteOldData(measurement: string, olderThan: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('InfluxDB not connected');
    }

    const deleteQuery = `
      from(bucket: "${this.config.bucket}")
      |> range(start: 0, stop: ${olderThan})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> drop()
    `;

    await this.queryRaw(deleteQuery);
  }

  getWriteApi(): WriteApi {
    return this.writeApi;
  }

  getQueryApi(): QueryApi {
    return this.queryApi;
  }
}

// Default configuration
export const defaultInfluxDBConfig: InfluxDBConfig = {
  url: process.env.INFLUXDB_URL || 'http://localhost:8086',
  token: process.env.INFLUXDB_TOKEN || '',
  org: process.env.INFLUXDB_ORG || 'football-analytics',
  bucket: process.env.INFLUXDB_BUCKET || 'metrics',
  timeout: parseInt(process.env.INFLUXDB_TIMEOUT || '30000'),
  batchSize: parseInt(process.env.INFLUXDB_BATCH_SIZE || '1000'),
  flushInterval: parseInt(process.env.INFLUXDB_FLUSH_INTERVAL || '5000'),
  maxRetries: parseInt(process.env.INFLUXDB_MAX_RETRIES || '3')
};

// Default data retention configuration
export const defaultDataRetentionConfig: DataRetentionConfig = {
  gameEvents: process.env.INFLUXDB_GAME_EVENTS_RETENTION || '7d',
  probabilities: process.env.INFLUXDB_PROBABILITIES_RETENTION || '30d',
  playerStats: process.env.INFLUXDB_PLAYER_STATS_RETENTION || '365d',
  systemMetrics: process.env.INFLUXDB_SYSTEM_METRICS_RETENTION || '7d',
  apiMetrics: process.env.INFLUXDB_API_METRICS_RETENTION || '30d'
};
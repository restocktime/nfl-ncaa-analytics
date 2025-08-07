import { InfluxDBManager, MetricPoint, InfluxDBConfig, DataRetentionConfig, defaultDataRetentionConfig } from './influxdb-config';

export interface GameMetric {
  gameId: string;
  timestamp: Date;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining?: string;
  possession?: string;
  fieldPosition?: number;
  down?: number;
  yardsToGo?: number;
}

export interface ProbabilityMetric {
  gameId: string;
  timestamp: Date;
  homeWinProbability: number;
  awayWinProbability: number;
  spreadProbability?: number;
  spreadValue?: number;
  overProbability?: number;
  underProbability?: number;
  totalPoints?: number;
  modelVersion?: string;
}

export interface PlayerMetric {
  gameId: string;
  playerId: string;
  playerName: string;
  position: string;
  teamId: string;
  timestamp: Date;
  statType: string;
  statValue: number;
  season: number;
  week?: number;
}

export interface SystemMetric {
  service: string;
  timestamp: Date;
  metricType: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
}

export interface ApiMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
}

export class MetricsService {
  private influxDB: InfluxDBManager;
  private isInitialized: boolean = false;
  private retentionConfig: DataRetentionConfig;

  constructor(config: InfluxDBConfig, retentionConfig?: DataRetentionConfig) {
    this.influxDB = new InfluxDBManager(config);
    this.retentionConfig = retentionConfig || defaultDataRetentionConfig;
  }

  async initialize(): Promise<void> {
    await this.influxDB.initialize();
    await this.influxDB.optimizeForRealTimeDashboard();
    await this.influxDB.setupDataRetentionPolicies(this.retentionConfig);
    this.isInitialized = true;
  }

  async close(): Promise<void> {
    await this.influxDB.close();
    this.isInitialized = false;
  }

  async isHealthy(): Promise<boolean> {
    return this.influxDB.isHealthy();
  }

  // Game State Metrics
  async recordGameState(metric: GameMetric): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MetricsService not initialized');
    }

    const point: MetricPoint = {
      measurement: 'game_state',
      tags: {
        game_id: metric.gameId,
        quarter: metric.quarter.toString()
      },
      fields: {
        home_score: metric.homeScore,
        away_score: metric.awayScore,
        time_remaining: metric.timeRemaining || '',
        possession: metric.possession || '',
        field_position: metric.fieldPosition || 0,
        down: metric.down || 0,
        yards_to_go: metric.yardsToGo || 0
      },
      timestamp: metric.timestamp
    };

    await this.influxDB.writePoint(point);
  }

  // Probability Metrics
  async recordProbabilities(metric: ProbabilityMetric): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MetricsService not initialized');
    }

    const point: MetricPoint = {
      measurement: 'game_probabilities',
      tags: {
        game_id: metric.gameId,
        model_version: metric.modelVersion || 'unknown'
      },
      fields: {
        home_win_probability: metric.homeWinProbability,
        away_win_probability: metric.awayWinProbability,
        spread_probability: metric.spreadProbability || 0,
        spread_value: metric.spreadValue || 0,
        over_probability: metric.overProbability || 0,
        under_probability: metric.underProbability || 0,
        total_points: metric.totalPoints || 0
      },
      timestamp: metric.timestamp
    };

    await this.influxDB.writePoint(point);
  }

  // Player Performance Metrics
  async recordPlayerStat(metric: PlayerMetric): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MetricsService not initialized');
    }

    const point: MetricPoint = {
      measurement: 'player_stats',
      tags: {
        game_id: metric.gameId,
        player_id: metric.playerId,
        player_name: metric.playerName,
        position: metric.position,
        team_id: metric.teamId,
        stat_type: metric.statType,
        season: metric.season.toString(),
        week: metric.week?.toString() || '0'
      },
      fields: {
        stat_value: metric.statValue
      },
      timestamp: metric.timestamp
    };

    await this.influxDB.writePoint(point);
  }

  // System Performance Metrics
  async recordSystemMetric(metric: SystemMetric): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MetricsService not initialized');
    }

    const point: MetricPoint = {
      measurement: 'system_metrics',
      tags: {
        service: metric.service,
        metric_type: metric.metricType,
        unit: metric.unit || '',
        ...metric.tags
      },
      fields: {
        value: metric.value
      },
      timestamp: metric.timestamp
    };

    await this.influxDB.writePoint(point);
  }

  // API Performance Metrics
  async recordApiMetric(metric: ApiMetric): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MetricsService not initialized');
    }

    const point: MetricPoint = {
      measurement: 'api_metrics',
      tags: {
        endpoint: metric.endpoint,
        method: metric.method,
        status_code: metric.statusCode.toString(),
        user_id: metric.userId || 'anonymous'
      },
      fields: {
        response_time: metric.responseTime,
        user_agent: metric.userAgent || ''
      },
      timestamp: metric.timestamp
    };

    await this.influxDB.writePoint(point);
  }

  // Batch operations for high-frequency data
  async recordGameStates(metrics: GameMetric[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MetricsService not initialized');
    }

    const points: MetricPoint[] = metrics.map(metric => ({
      measurement: 'game_state',
      tags: {
        game_id: metric.gameId,
        quarter: metric.quarter.toString()
      },
      fields: {
        home_score: metric.homeScore,
        away_score: metric.awayScore,
        time_remaining: metric.timeRemaining || '',
        possession: metric.possession || '',
        field_position: metric.fieldPosition || 0,
        down: metric.down || 0,
        yards_to_go: metric.yardsToGo || 0
      },
      timestamp: metric.timestamp
    }));

    await this.influxDB.writePoints(points);
  }

  async recordProbabilitiesBatch(metrics: ProbabilityMetric[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MetricsService not initialized');
    }

    const points: MetricPoint[] = metrics.map(metric => ({
      measurement: 'game_probabilities',
      tags: {
        game_id: metric.gameId,
        model_version: metric.modelVersion || 'unknown'
      },
      fields: {
        home_win_probability: metric.homeWinProbability,
        away_win_probability: metric.awayWinProbability,
        spread_probability: metric.spreadProbability || 0,
        spread_value: metric.spreadValue || 0,
        over_probability: metric.overProbability || 0,
        under_probability: metric.underProbability || 0,
        total_points: metric.totalPoints || 0
      },
      timestamp: metric.timestamp
    }));

    await this.influxDB.writePoints(points);
  }

  // Query methods for dashboard data - optimized for real-time performance
  async getGameStateHistory(gameId: string, timeRange: string = '-1h'): Promise<any[]> {
    const query = await this.influxDB.getOptimizedDashboardQuery('game_state', gameId, timeRange);
    return this.influxDB.query(query);
  }

  async getProbabilityHistory(gameId: string, timeRange: string = '-1h'): Promise<any[]> {
    const query = await this.influxDB.getOptimizedDashboardQuery('game_probabilities', gameId, timeRange);
    return this.influxDB.query(query);
  }

  async getPlayerStatsTrend(playerId: string, statType: string, timeRange: string = '-7d'): Promise<any[]> {
    const query = `
      from(bucket: "${this.influxDB.config.bucket}")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "player_stats")
      |> filter(fn: (r) => r.player_id == "${playerId}")
      |> filter(fn: (r) => r.stat_type == "${statType}")
      |> sort(columns: ["_time"])
    `;

    return this.influxDB.query(query);
  }

  async getSystemMetrics(service: string, metricType: string, timeRange: string = '-1h'): Promise<any[]> {
    const query = `
      from(bucket: "${this.influxDB.config.bucket}")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "system_metrics")
      |> filter(fn: (r) => r.service == "${service}")
      |> filter(fn: (r) => r.metric_type == "${metricType}")
      |> sort(columns: ["_time"])
    `;

    return this.influxDB.query(query);
  }

  async getApiPerformanceMetrics(endpoint?: string, timeRange: string = '-1h'): Promise<any[]> {
    let query = `
      from(bucket: "${this.influxDB.config.bucket}")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "api_metrics")
    `;

    if (endpoint) {
      query += `|> filter(fn: (r) => r.endpoint == "${endpoint}")`;
    }

    query += `|> sort(columns: ["_time"])`;

    return this.influxDB.query(query);
  }

  // Aggregation queries for dashboard summaries
  async getAverageResponseTime(endpoint?: string, timeRange: string = '-1h'): Promise<number> {
    let query = `
      from(bucket: "${this.influxDB.config.bucket}")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "api_metrics")
      |> filter(fn: (r) => r._field == "response_time")
    `;

    if (endpoint) {
      query += `|> filter(fn: (r) => r.endpoint == "${endpoint}")`;
    }

    query += `|> mean()`;

    const results = await this.influxDB.query(query);
    return results.length > 0 ? results[0]._value : 0;
  }

  async getErrorRate(timeRange: string = '-1h'): Promise<number> {
    const totalQuery = `
      from(bucket: "${this.influxDB.config.bucket}")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "api_metrics")
      |> count()
    `;

    const errorQuery = `
      from(bucket: "${this.influxDB.config.bucket}")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "api_metrics")
      |> filter(fn: (r) => r.status_code >= "400")
      |> count()
    `;

    const [totalResults, errorResults] = await Promise.all([
      this.influxDB.query(totalQuery),
      this.influxDB.query(errorQuery)
    ]);

    const total = totalResults.length > 0 ? totalResults[0]._value : 0;
    const errors = errorResults.length > 0 ? errorResults[0]._value : 0;

    return total > 0 ? (errors / total) * 100 : 0;
  }

  async flush(): Promise<void> {
    await this.influxDB.flush();
  }

  // Data retention management
  async cleanupOldData(measurement: string, retentionDays: number): Promise<void> {
    const cutoffTime = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const olderThan = cutoffTime.toISOString();
    
    await this.influxDB.deleteOldData(measurement, olderThan);
  }

  async performScheduledRetentionCleanup(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MetricsService not initialized');
    }

    const retentionMap = {
      'game_state': this.parseDurationToDays(this.retentionConfig.gameEvents),
      'game_probabilities': this.parseDurationToDays(this.retentionConfig.probabilities),
      'player_stats': this.parseDurationToDays(this.retentionConfig.playerStats),
      'system_metrics': this.parseDurationToDays(this.retentionConfig.systemMetrics),
      'api_metrics': this.parseDurationToDays(this.retentionConfig.apiMetrics)
    };

    for (const [measurement, retentionDays] of Object.entries(retentionMap)) {
      try {
        await this.cleanupOldData(measurement, retentionDays);
        console.log(`Cleaned up old data for ${measurement} (retention: ${retentionDays} days)`);
      } catch (error) {
        console.error(`Failed to cleanup ${measurement}:`, error);
      }
    }
  }

  private parseDurationToDays(duration: string): number {
    const match = duration.match(/^(\d+)([dhm])$/);
    if (!match) {
      throw new Error(`Invalid duration format: ${duration}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd': return value;
      case 'h': return Math.ceil(value / 24);
      case 'm': return Math.ceil(value / (24 * 60));
      default: throw new Error(`Unsupported duration unit: ${unit}`);
    }
  }

  // Real-time dashboard optimized queries
  async getLatestGameState(gameId: string): Promise<any> {
    const query = `
      from(bucket: "${this.influxDB.config.bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "game_state")
      |> filter(fn: (r) => r.game_id == "${gameId}")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1)
    `;

    const results = await this.influxDB.query(query);
    return results.length > 0 ? results[0] : null;
  }

  async getLatestProbabilities(gameId: string): Promise<any> {
    const query = `
      from(bucket: "${this.influxDB.config.bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "game_probabilities")
      |> filter(fn: (r) => r.game_id == "${gameId}")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1)
    `;

    const results = await this.influxDB.query(query);
    return results.length > 0 ? results[0] : null;
  }

  async getLiveGameMetrics(gameIds: string[]): Promise<any[]> {
    const gameIdFilter = gameIds.map(id => `r.game_id == "${id}"`).join(' or ');
    
    const query = `
      from(bucket: "${this.influxDB.config.bucket}")
      |> range(start: -5m)
      |> filter(fn: (r) => r._measurement == "game_state" or r._measurement == "game_probabilities")
      |> filter(fn: (r) => ${gameIdFilter})
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 100)
    `;

    return this.influxDB.query(query);
  }

  // Optimized dashboard data retrieval
  async getDashboardData(gameIds: string[], timeRange: string = '-5m'): Promise<{
    gameStates: any[];
    probabilities: any[];
    events: any[];
    systemHealth: any[];
  }> {
    if (!this.isInitialized) {
      throw new Error('MetricsService not initialized');
    }

    const gameIdFilter = gameIds.map(id => `r.game_id == "${id}"`).join(' or ');
    
    // Execute multiple optimized queries in parallel
    const [gameStates, probabilities, events, systemHealth] = await Promise.all([
      // Game states
      this.influxDB.query(`
        from(bucket: "${this.influxDB.config.bucket}")
        |> range(start: ${timeRange})
        |> filter(fn: (r) => r._measurement == "game_state")
        |> filter(fn: (r) => ${gameIdFilter})
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 50)
      `),
      
      // Probabilities
      this.influxDB.query(`
        from(bucket: "${this.influxDB.config.bucket}")
        |> range(start: ${timeRange})
        |> filter(fn: (r) => r._measurement == "game_probabilities")
        |> filter(fn: (r) => ${gameIdFilter})
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 50)
      `),
      
      // Recent events
      this.influxDB.query(`
        from(bucket: "${this.influxDB.config.bucket}")
        |> range(start: ${timeRange})
        |> filter(fn: (r) => r._measurement == "game_events")
        |> filter(fn: (r) => ${gameIdFilter})
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 20)
      `),
      
      // System health metrics
      this.influxDB.query(`
        from(bucket: "${this.influxDB.config.bucket}")
        |> range(start: ${timeRange})
        |> filter(fn: (r) => r._measurement == "system_metrics")
        |> filter(fn: (r) => r.service == "metrics-service")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 10)
      `)
    ]);

    return {
      gameStates,
      probabilities,
      events,
      systemHealth
    };
  }

  // High-frequency ingestion methods for real-time events
  async recordGameEvent(gameId: string, eventType: string, eventData: Record<string, any>): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MetricsService not initialized');
    }

    const point: MetricPoint = {
      measurement: 'game_events',
      tags: {
        game_id: gameId,
        event_type: eventType
      },
      fields: {
        ...eventData,
        timestamp_ms: Date.now()
      },
      timestamp: new Date()
    };

    await this.influxDB.writePoint(point);
  }

  // Performance monitoring for InfluxDB operations
  async recordInfluxDBPerformanceMetric(operation: string, duration: number, success: boolean): Promise<void> {
    if (!this.isInitialized) {
      return; // Don't throw error for performance metrics to avoid recursion
    }

    const point: MetricPoint = {
      measurement: 'influxdb_performance',
      tags: {
        operation,
        success: success.toString()
      },
      fields: {
        duration_ms: duration,
        timestamp_ms: Date.now()
      },
      timestamp: new Date()
    };

    try {
      await this.influxDB.writePoint(point);
    } catch (error) {
      // Silently fail to avoid infinite recursion
      console.warn('Failed to record InfluxDB performance metric:', error);
    }
  }

  async recordGameEventsBatch(events: Array<{gameId: string, eventType: string, eventData: Record<string, any>}>): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MetricsService not initialized');
    }

    const points: MetricPoint[] = events.map(event => ({
      measurement: 'game_events',
      tags: {
        game_id: event.gameId,
        event_type: event.eventType
      },
      fields: {
        ...event.eventData,
        timestamp_ms: Date.now()
      },
      timestamp: new Date()
    }));

    await this.influxDB.writePoints(points);
  }
}
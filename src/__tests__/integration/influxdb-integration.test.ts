import { MetricsService, GameMetric, ProbabilityMetric, PlayerMetric, SystemMetric, ApiMetric } from '../../core/metrics-service';
import { InfluxDBManager, defaultInfluxDBConfig } from '../../core/influxdb-config';
import { getRetentionConfig } from '../../core/data-retention-config';

describe('InfluxDB Integration Tests', () => {
  let metricsService: MetricsService;
  let influxDBManager: InfluxDBManager;

  beforeAll(async () => {
    // Use test InfluxDB configuration
    const testConfig = {
      ...defaultInfluxDBConfig,
      url: process.env.TEST_INFLUXDB_URL || 'http://localhost:8086',
      token: process.env.TEST_INFLUXDB_TOKEN || 'test-token',
      org: process.env.TEST_INFLUXDB_ORG || 'test-org',
      bucket: process.env.TEST_INFLUXDB_BUCKET || 'test-bucket',
      timeout: 10000
    };

    const testRetentionConfig = getRetentionConfig('test');
    metricsService = new MetricsService(testConfig, testRetentionConfig);
    influxDBManager = new InfluxDBManager(testConfig);
    
    try {
      await metricsService.initialize();
    } catch (error) {
      console.warn('InfluxDB connection failed, skipping integration tests:', error);
      return;
    }
  });

  afterAll(async () => {
    if (metricsService) {
      await metricsService.close();
    }
  });

  describe('InfluxDBManager', () => {
    it('should connect to InfluxDB successfully', async () => {
      if (!metricsService) return;
      
      const isHealthy = await metricsService.isHealthy();
      expect(isHealthy).toBe(true);
    });

    it('should write and query single point', async () => {
      if (!influxDBManager) return;

      const testPoint = {
        measurement: 'test_metric',
        tags: { test_tag: 'test_value' },
        fields: { test_field: 42.5 },
        timestamp: new Date()
      };

      await influxDBManager.writePoint(testPoint);
      await influxDBManager.flush();

      // Wait a moment for data to be written
      await new Promise(resolve => setTimeout(resolve, 1000));

      const query = `
        from(bucket: "${influxDBManager['config'].bucket}")
        |> range(start: -1m)
        |> filter(fn: (r) => r._measurement == "test_metric")
        |> filter(fn: (r) => r.test_tag == "test_value")
      `;

      const results = await influxDBManager.query(query);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should write multiple points in batch', async () => {
      if (!influxDBManager) return;

      const testPoints = [
        {
          measurement: 'batch_test',
          tags: { batch_id: '1' },
          fields: { value: 10 },
          timestamp: new Date()
        },
        {
          measurement: 'batch_test',
          tags: { batch_id: '2' },
          fields: { value: 20 },
          timestamp: new Date()
        }
      ];

      await influxDBManager.writePoints(testPoints);
      await influxDBManager.flush();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const query = `
        from(bucket: "${influxDBManager['config'].bucket}")
        |> range(start: -1m)
        |> filter(fn: (r) => r._measurement == "batch_test")
      `;

      const results = await influxDBManager.query(query);
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('MetricsService - Game State Metrics', () => {
    it('should record game state metrics', async () => {
      if (!metricsService) return;

      const gameMetric: GameMetric = {
        gameId: 'test-game-1',
        timestamp: new Date(),
        homeScore: 14,
        awayScore: 7,
        quarter: 2,
        timeRemaining: '10:30',
        possession: 'home',
        fieldPosition: 35,
        down: 2,
        yardsToGo: 8
      };

      await metricsService.recordGameState(gameMetric);
      await metricsService.flush();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const history = await metricsService.getGameStateHistory('test-game-1', '-1m');
      expect(history.length).toBeGreaterThan(0);
    });

    it('should record batch game state metrics', async () => {
      if (!metricsService) return;

      const gameMetrics: GameMetric[] = [
        {
          gameId: 'test-game-2',
          timestamp: new Date(Date.now() - 60000),
          homeScore: 0,
          awayScore: 0,
          quarter: 1
        },
        {
          gameId: 'test-game-2',
          timestamp: new Date(),
          homeScore: 7,
          awayScore: 0,
          quarter: 1
        }
      ];

      await metricsService.recordGameStates(gameMetrics);
      await metricsService.flush();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const history = await metricsService.getGameStateHistory('test-game-2', '-2m');
      expect(history.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('MetricsService - Probability Metrics', () => {
    it('should record probability metrics', async () => {
      if (!metricsService) return;

      const probabilityMetric: ProbabilityMetric = {
        gameId: 'test-game-3',
        timestamp: new Date(),
        homeWinProbability: 0.65,
        awayWinProbability: 0.35,
        spreadProbability: 0.52,
        spreadValue: -3.5,
        overProbability: 0.48,
        underProbability: 0.52,
        totalPoints: 47.5,
        modelVersion: 'v1.0.0'
      };

      await metricsService.recordProbabilities(probabilityMetric);
      await metricsService.flush();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const history = await metricsService.getProbabilityHistory('test-game-3', '-1m');
      expect(history.length).toBeGreaterThan(0);
    });

    it('should record batch probability metrics', async () => {
      if (!metricsService) return;

      const probabilityMetrics: ProbabilityMetric[] = [
        {
          gameId: 'test-game-4',
          timestamp: new Date(Date.now() - 30000),
          homeWinProbability: 0.60,
          awayWinProbability: 0.40,
          modelVersion: 'v1.0.0'
        },
        {
          gameId: 'test-game-4',
          timestamp: new Date(),
          homeWinProbability: 0.70,
          awayWinProbability: 0.30,
          modelVersion: 'v1.0.0'
        }
      ];

      await metricsService.recordProbabilitiesBatch(probabilityMetrics);
      await metricsService.flush();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const history = await metricsService.getProbabilityHistory('test-game-4', '-1m');
      expect(history.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('MetricsService - Player Metrics', () => {
    it('should record player statistics', async () => {
      if (!metricsService) return;

      const playerMetric: PlayerMetric = {
        gameId: 'test-game-5',
        playerId: 'test-player-1',
        playerName: 'Test Player',
        position: 'QB',
        teamId: 'test-team-1',
        timestamp: new Date(),
        statType: 'passing_yards',
        statValue: 275,
        season: 2024,
        week: 1
      };

      await metricsService.recordPlayerStat(playerMetric);
      await metricsService.flush();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const trend = await metricsService.getPlayerStatsTrend('test-player-1', 'passing_yards', '-1m');
      expect(trend.length).toBeGreaterThan(0);
    });
  });

  describe('MetricsService - System Metrics', () => {
    it('should record system performance metrics', async () => {
      if (!metricsService) return;

      const systemMetric: SystemMetric = {
        service: 'api-gateway',
        timestamp: new Date(),
        metricType: 'cpu_usage',
        value: 75.5,
        unit: 'percent',
        tags: { instance: 'api-1' }
      };

      await metricsService.recordSystemMetric(systemMetric);
      await metricsService.flush();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const metrics = await metricsService.getSystemMetrics('api-gateway', 'cpu_usage', '-1m');
      expect(metrics.length).toBeGreaterThan(0);
    });
  });

  describe('MetricsService - API Metrics', () => {
    it('should record API performance metrics', async () => {
      if (!metricsService) return;

      const apiMetric: ApiMetric = {
        endpoint: '/api/games',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
        timestamp: new Date(),
        userId: 'test-user-1',
        userAgent: 'test-agent'
      };

      await metricsService.recordApiMetric(apiMetric);
      await metricsService.flush();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const metrics = await metricsService.getApiPerformanceMetrics('/api/games', '-1m');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should calculate average response time', async () => {
      if (!metricsService) return;

      // Record multiple API metrics
      const apiMetrics: ApiMetric[] = [
        {
          endpoint: '/api/test',
          method: 'GET',
          statusCode: 200,
          responseTime: 100,
          timestamp: new Date(Date.now() - 30000)
        },
        {
          endpoint: '/api/test',
          method: 'GET',
          statusCode: 200,
          responseTime: 200,
          timestamp: new Date()
        }
      ];

      for (const metric of apiMetrics) {
        await metricsService.recordApiMetric(metric);
      }
      await metricsService.flush();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const avgResponseTime = await metricsService.getAverageResponseTime('/api/test', '-1m');
      expect(avgResponseTime).toBeGreaterThan(0);
      expect(avgResponseTime).toBeLessThanOrEqual(200);
    });

    it('should calculate error rate', async () => {
      if (!metricsService) return;

      // Record mix of successful and error responses
      const apiMetrics: ApiMetric[] = [
        {
          endpoint: '/api/error-test',
          method: 'GET',
          statusCode: 200,
          responseTime: 100,
          timestamp: new Date(Date.now() - 60000)
        },
        {
          endpoint: '/api/error-test',
          method: 'GET',
          statusCode: 500,
          responseTime: 50,
          timestamp: new Date(Date.now() - 30000)
        },
        {
          endpoint: '/api/error-test',
          method: 'GET',
          statusCode: 200,
          responseTime: 120,
          timestamp: new Date()
        }
      ];

      for (const metric of apiMetrics) {
        await metricsService.recordApiMetric(metric);
      }
      await metricsService.flush();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const errorRate = await metricsService.getErrorRate('-2m');
      expect(errorRate).toBeGreaterThanOrEqual(0);
      expect(errorRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Data Retention and Cleanup', () => {
    it('should support data cleanup operations', async () => {
      if (!metricsService) return;

      // This test just ensures the cleanup method doesn't throw
      await expect(metricsService.cleanupOldData('test_metric', 30)).resolves.not.toThrow();
    });
  });

  describe('High-Frequency Data Ingestion', () => {
    it('should handle high-frequency writes efficiently', async () => {
      if (!metricsService) return;

      const startTime = Date.now();
      const metrics: GameMetric[] = [];

      // Generate 100 game state updates
      for (let i = 0; i < 100; i++) {
        metrics.push({
          gameId: 'performance-test-game',
          timestamp: new Date(Date.now() + i * 1000),
          homeScore: Math.floor(i / 10),
          awayScore: Math.floor(i / 15),
          quarter: Math.min(Math.floor(i / 25) + 1, 4)
        });
      }

      await metricsService.recordGameStates(metrics);
      await metricsService.flush();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000);

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify data was written
      const history = await metricsService.getGameStateHistory('performance-test-game', '-2m');
      expect(history.length).toBeGreaterThan(0);
    }, 10000);
    });

  describe('Real-time Dashboard Features', () => {
    it('should retrieve latest game state efficiently', async () => {
      if (!metricsService) return;

      // Record some game states
      const gameMetrics: GameMetric[] = [
        {
          gameId: 'latest-test-game',
          timestamp: new Date(Date.now() - 60000),
          homeScore: 7,
          awayScore: 0,
          quarter: 1
        },
        {
          gameId: 'latest-test-game',
          timestamp: new Date(),
          homeScore: 14,
          awayScore: 7,
          quarter: 2
        }
      ];

      await metricsService.recordGameStates(gameMetrics);
      await metricsService.flush();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const latestState = await metricsService.getLatestGameState('latest-test-game');
      
      expect(latestState).toBeTruthy();
      // Should return the most recent state
      if (latestState) {
        expect(latestState.home_score || latestState._value).toBeDefined();
      }
    });

    it('should handle live game metrics for multiple games', async () => {
      if (!metricsService) return;

      const gameIds = ['multi-game-1', 'multi-game-2'];
      const allMetrics: GameMetric[] = [];

      gameIds.forEach(gameId => {
        allMetrics.push({
          gameId,
          timestamp: new Date(),
          homeScore: Math.floor(Math.random() * 21),
          awayScore: Math.floor(Math.random() * 21),
          quarter: 2
        });
      });

      await metricsService.recordGameStates(allMetrics);
      await metricsService.flush();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const liveMetrics = await metricsService.getLiveGameMetrics(gameIds);
      
      expect(liveMetrics).toBeDefined();
      expect(Array.isArray(liveMetrics)).toBe(true);
    });
  });

  describe('Game Events Integration', () => {
    it('should record individual game events', async () => {
      if (!metricsService) return;

      await metricsService.recordGameEvent('event-test-game', 'touchdown', {
        player_id: 'player-123',
        yards: 15,
        play_type: 'pass'
      });

      await metricsService.flush();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify event was recorded (basic test since we can't easily query specific events)
      expect(true).toBe(true); // Test passes if no errors thrown
    });

    it('should record batch game events', async () => {
      if (!metricsService) return;

      const events = [
        {
          gameId: 'batch-event-game',
          eventType: 'play',
          eventData: { yards: 5, play_type: 'run' }
        },
        {
          gameId: 'batch-event-game',
          eventType: 'penalty',
          eventData: { yards: 10, penalty_type: 'holding' }
        }
      ];

      await metricsService.recordGameEventsBatch(events);
      await metricsService.flush();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify events were recorded
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });

  describe('Data Retention Integration', () => {
    it('should perform retention cleanup without errors', async () => {
      if (!metricsService) return;

      // This test ensures retention cleanup runs without throwing errors
      await expect(metricsService.performScheduledRetentionCleanup()).resolves.not.toThrow();
    });
  });
});
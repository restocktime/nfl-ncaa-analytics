import { MetricsService, GameMetric, ProbabilityMetric } from '../../core/metrics-service';
import { defaultInfluxDBConfig } from '../../core/influxdb-config';

// Mock InfluxDB client for performance testing
jest.mock('@influxdata/influxdb-client', () => ({
  InfluxDB: jest.fn().mockImplementation(() => ({
    getWriteApi: jest.fn().mockReturnValue({
      writePoint: jest.fn(),
      writePoints: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined)
    }),
    getQueryApi: jest.fn().mockReturnValue({
      queryRaw: jest.fn().mockResolvedValue('mock query result'),
      queryRows: jest.fn().mockImplementation((query, callbacks) => {
        // Simulate some data
        for (let i = 0; i < 10; i++) {
          callbacks.next(
            { _time: new Date().toISOString(), _value: i * 10 },
            { toObject: (row: any) => row }
          );
        }
        callbacks.complete();
      })
    })
  })),
  Point: jest.fn().mockImplementation(() => ({
    tag: jest.fn().mockReturnThis(),
    floatField: jest.fn().mockReturnThis(),
    stringField: jest.fn().mockReturnThis(),
    booleanField: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis()
  }))
}));

describe('InfluxDB Performance Tests', () => {
  let metricsService: MetricsService;

  beforeEach(async () => {
    // Use optimized configuration for performance testing
    const performanceConfig = {
      ...defaultInfluxDBConfig,
      batchSize: 500,
      flushInterval: 1000,
      maxRetries: 2
    };
    
    metricsService = new MetricsService(performanceConfig);
    await metricsService.initialize();
  });

  afterEach(async () => {
    await metricsService.close();
  });

  describe('High-Frequency Data Ingestion', () => {
    it('should handle high-frequency game state writes efficiently', async () => {
      const startTime = Date.now();
      const metrics: GameMetric[] = [];

      // Generate 1000 game state updates
      for (let i = 0; i < 1000; i++) {
        metrics.push({
          gameId: `performance-test-game-${Math.floor(i / 100)}`,
          timestamp: new Date(Date.now() + i * 1000),
          homeScore: Math.floor(i / 10),
          awayScore: Math.floor(i / 15),
          quarter: Math.min(Math.floor(i / 250) + 1, 4),
          timeRemaining: `${15 - Math.floor(i / 60)}:${59 - (i % 60)}`,
          possession: i % 2 === 0 ? 'home' : 'away',
          fieldPosition: 20 + (i % 60),
          down: (i % 4) + 1,
          yardsToGo: 10 - (i % 10)
        });
      }

      await metricsService.recordGameStates(metrics);
      await metricsService.flush();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 2 seconds for mocked operations)
      expect(duration).toBeLessThan(2000);
      
      console.log(`Processed ${metrics.length} game state metrics in ${duration}ms`);
    }, 10000);

    it('should handle high-frequency probability writes efficiently', async () => {
      const startTime = Date.now();
      const metrics: ProbabilityMetric[] = [];

      // Generate 500 probability updates
      for (let i = 0; i < 500; i++) {
        const homeProb = 0.5 + (Math.sin(i / 10) * 0.3);
        metrics.push({
          gameId: `prob-test-game-${Math.floor(i / 50)}`,
          timestamp: new Date(Date.now() + i * 2000),
          homeWinProbability: homeProb,
          awayWinProbability: 1 - homeProb,
          spreadProbability: 0.5 + (Math.cos(i / 8) * 0.2),
          spreadValue: -3.5 + (Math.sin(i / 12) * 2),
          overProbability: 0.48 + (Math.random() * 0.04),
          underProbability: 0.52 - (Math.random() * 0.04),
          totalPoints: 45 + (Math.sin(i / 15) * 10),
          modelVersion: `v1.${Math.floor(i / 100)}.0`
        });
      }

      await metricsService.recordProbabilitiesBatch(metrics);
      await metricsService.flush();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1500);
      
      console.log(`Processed ${metrics.length} probability metrics in ${duration}ms`);
    }, 10000);

    it('should handle mixed metric types efficiently', async () => {
      const startTime = Date.now();
      
      // Create mixed workload
      const gameMetrics: GameMetric[] = [];
      const probabilityMetrics: ProbabilityMetric[] = [];
      
      for (let i = 0; i < 200; i++) {
        gameMetrics.push({
          gameId: `mixed-test-game-${i % 10}`,
          timestamp: new Date(Date.now() + i * 1000),
          homeScore: Math.floor(i / 20),
          awayScore: Math.floor(i / 25),
          quarter: Math.min(Math.floor(i / 50) + 1, 4)
        });

        if (i % 5 === 0) {
          probabilityMetrics.push({
            gameId: `mixed-test-game-${i % 10}`,
            timestamp: new Date(Date.now() + i * 1000),
            homeWinProbability: 0.5 + (i % 20) / 40,
            awayWinProbability: 0.5 - (i % 20) / 40
          });
        }
      }

      // Execute in parallel
      await Promise.all([
        metricsService.recordGameStates(gameMetrics),
        metricsService.recordProbabilitiesBatch(probabilityMetrics)
      ]);
      
      await metricsService.flush();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000);
      
      console.log(`Processed ${gameMetrics.length} game metrics and ${probabilityMetrics.length} probability metrics in ${duration}ms`);
    }, 10000);
  });

  describe('Query Performance', () => {
    it('should handle multiple concurrent queries efficiently', async () => {
      const startTime = Date.now();
      
      // Execute multiple queries concurrently
      const queryPromises = [
        metricsService.getGameStateHistory('test-game-1', '-1h'),
        metricsService.getGameStateHistory('test-game-2', '-1h'),
        metricsService.getProbabilityHistory('test-game-1', '-1h'),
        metricsService.getProbabilityHistory('test-game-2', '-1h'),
        metricsService.getPlayerStatsTrend('player-1', 'passing_yards', '-7d'),
        metricsService.getPlayerStatsTrend('player-2', 'rushing_yards', '-7d'),
        metricsService.getSystemMetrics('api-gateway', 'cpu_usage', '-1h'),
        metricsService.getApiPerformanceMetrics('/api/games', '-1h')
      ];

      const results = await Promise.all(queryPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
      expect(results).toHaveLength(8);
      
      console.log(`Executed ${queryPromises.length} concurrent queries in ${duration}ms`);
    }, 10000);

    it('should handle aggregation queries efficiently', async () => {
      const startTime = Date.now();
      
      // Execute aggregation queries
      const aggregationPromises = [
        metricsService.getAverageResponseTime('/api/games', '-1h'),
        metricsService.getAverageResponseTime('/api/players', '-1h'),
        metricsService.getErrorRate('-1h'),
        metricsService.getAverageResponseTime(), // All endpoints
      ];

      const results = await Promise.all(aggregationPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(300);
      expect(results).toHaveLength(4);
      
      console.log(`Executed ${aggregationPromises.length} aggregation queries in ${duration}ms`);
    }, 10000);
  });

  describe('Memory and Resource Usage', () => {
    it('should handle large batch operations without memory issues', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create very large batch
      const largeGameMetrics: GameMetric[] = [];
      for (let i = 0; i < 5000; i++) {
        largeGameMetrics.push({
          gameId: `memory-test-game-${i % 50}`,
          timestamp: new Date(Date.now() + i * 100),
          homeScore: i % 50,
          awayScore: i % 40,
          quarter: (i % 4) + 1,
          timeRemaining: `${15 - (i % 16)}:${59 - (i % 60)}`,
          possession: i % 2 === 0 ? 'home' : 'away',
          fieldPosition: 20 + (i % 60),
          down: (i % 4) + 1,
          yardsToGo: 10 - (i % 10)
        });
      }

      await metricsService.recordGameStates(largeGameMetrics);
      await metricsService.flush();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 100MB for this test)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      
      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB for ${largeGameMetrics.length} metrics`);
    }, 15000);

    it('should handle rapid successive operations', async () => {
      const startTime = Date.now();
      
      // Rapid successive operations
      for (let batch = 0; batch < 10; batch++) {
        const metrics: GameMetric[] = [];
        for (let i = 0; i < 50; i++) {
          metrics.push({
            gameId: `rapid-test-${batch}`,
            timestamp: new Date(Date.now() + (batch * 50 + i) * 100),
            homeScore: batch * 7 + i % 7,
            awayScore: batch * 3 + i % 3,
            quarter: (batch % 4) + 1
          });
        }
        
        await metricsService.recordGameStates(metrics);
        
        // Small delay to simulate real-world conditions
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      await metricsService.flush();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(2000);
      
      console.log(`Completed 10 rapid batches (500 total metrics) in ${duration}ms`);
    }, 10000);

    it('should handle game day peak load simulation', async () => {
      const startTime = Date.now();
      
      // Simulate peak game day load with multiple concurrent games
      const gameIds = ['game-1', 'game-2', 'game-3', 'game-4', 'game-5'];
      const allMetrics: GameMetric[] = [];
      
      // Generate high-frequency updates for multiple games
      for (let minute = 0; minute < 5; minute++) {
        for (let second = 0; second < 60; second += 5) { // Every 5 seconds
          gameIds.forEach(gameId => {
            allMetrics.push({
              gameId,
              timestamp: new Date(Date.now() + (minute * 60 + second) * 1000),
              homeScore: Math.floor(Math.random() * 35),
              awayScore: Math.floor(Math.random() * 35),
              quarter: Math.min(Math.floor(minute / 15) + 1, 4),
              timeRemaining: `${14 - minute}:${59 - second}`,
              possession: Math.random() > 0.5 ? 'home' : 'away',
              fieldPosition: 20 + Math.floor(Math.random() * 60),
              down: Math.floor(Math.random() * 4) + 1,
              yardsToGo: Math.floor(Math.random() * 20) + 1
            });
          });
        }
      }
      
      // Process in batches to simulate real-time ingestion
      const batchSize = 100;
      for (let i = 0; i < allMetrics.length; i += batchSize) {
        const batch = allMetrics.slice(i, i + batchSize);
        await metricsService.recordGameStates(batch);
      }
      
      await metricsService.flush();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should handle 300 metrics (5 games * 60 updates) within reasonable time
      expect(duration).toBeLessThan(3000);
      expect(allMetrics.length).toBe(300);
      
      console.log(`Processed ${allMetrics.length} game day metrics in ${duration}ms`);
    }, 15000);

    it('should handle real-time event stream simulation', async () => {
      const startTime = Date.now();
      const events: Array<{gameId: string, eventType: string, eventData: Record<string, any>}> = [];
      
      // Simulate various game events
      const eventTypes = ['play', 'timeout', 'penalty', 'score', 'turnover'];
      const gameIds = ['live-game-1', 'live-game-2'];
      
      for (let i = 0; i < 200; i++) {
        const gameId = gameIds[i % gameIds.length];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        events.push({
          gameId,
          eventType,
          eventData: {
            play_id: `play-${i}`,
            yard_line: Math.floor(Math.random() * 100),
            yards_gained: Math.floor(Math.random() * 20) - 5,
            play_type: Math.random() > 0.5 ? 'pass' : 'run',
            success: Math.random() > 0.3
          }
        });
      }
      
      await metricsService.recordGameEventsBatch(events);
      await metricsService.flush();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000);
      
      console.log(`Processed ${events.length} game events in ${duration}ms`);
    }, 10000);
  });

  describe('Real-time Dashboard Optimization', () => {
    it('should handle optimized dashboard queries efficiently', async () => {
      // First, populate some test data
      const gameMetrics: GameMetric[] = [];
      for (let i = 0; i < 50; i++) {
        gameMetrics.push({
          gameId: 'dashboard-test-game',
          timestamp: new Date(Date.now() - i * 10000), // Every 10 seconds
          homeScore: Math.floor(i / 10),
          awayScore: Math.floor(i / 15),
          quarter: Math.min(Math.floor(i / 12) + 1, 4)
        });
      }
      
      await metricsService.recordGameStates(gameMetrics);
      await metricsService.flush();
      
      const startTime = Date.now();
      
      // Test optimized dashboard queries
      const [latestState, latestProbs, gameHistory, probHistory] = await Promise.all([
        metricsService.getLatestGameState('dashboard-test-game'),
        metricsService.getLatestProbabilities('dashboard-test-game'),
        metricsService.getGameStateHistory('dashboard-test-game', '-5m'),
        metricsService.getProbabilityHistory('dashboard-test-game', '-5m')
      ]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Dashboard queries should be very fast
      expect(duration).toBeLessThan(200);
      
      console.log(`Dashboard queries completed in ${duration}ms`);
    }, 10000);

    it('should handle live game metrics for multiple games', async () => {
      const gameIds = ['live-1', 'live-2', 'live-3'];
      
      // Populate data for multiple games
      const allMetrics: GameMetric[] = [];
      gameIds.forEach(gameId => {
        for (let i = 0; i < 10; i++) {
          allMetrics.push({
            gameId,
            timestamp: new Date(Date.now() - i * 30000),
            homeScore: Math.floor(Math.random() * 21),
            awayScore: Math.floor(Math.random() * 21),
            quarter: Math.floor(Math.random() * 4) + 1
          });
        }
      });
      
      await metricsService.recordGameStates(allMetrics);
      await metricsService.flush();
      
      const startTime = Date.now();
      
      const liveMetrics = await metricsService.getLiveGameMetrics(gameIds);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(300);
      expect(liveMetrics.length).toBeGreaterThan(0);
      
      console.log(`Live metrics query for ${gameIds.length} games completed in ${duration}ms`);
    }, 10000);

    it('should handle comprehensive dashboard data retrieval efficiently', async () => {
      const gameIds = ['dashboard-1', 'dashboard-2'];
      
      // Populate comprehensive test data
      const gameMetrics: GameMetric[] = [];
      const probabilityMetrics: ProbabilityMetric[] = [];
      
      gameIds.forEach(gameId => {
        for (let i = 0; i < 5; i++) {
          gameMetrics.push({
            gameId,
            timestamp: new Date(Date.now() - i * 60000),
            homeScore: Math.floor(Math.random() * 21),
            awayScore: Math.floor(Math.random() * 21),
            quarter: Math.floor(Math.random() * 4) + 1
          });
          
          probabilityMetrics.push({
            gameId,
            timestamp: new Date(Date.now() - i * 60000),
            homeWinProbability: Math.random(),
            awayWinProbability: Math.random()
          });
        }
      });
      
      await Promise.all([
        metricsService.recordGameStates(gameMetrics),
        metricsService.recordProbabilitiesBatch(probabilityMetrics)
      ]);
      await metricsService.flush();
      
      const startTime = Date.now();
      
      const dashboardData = await metricsService.getDashboardData(gameIds, '-10m');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500);
      expect(dashboardData).toHaveProperty('gameStates');
      expect(dashboardData).toHaveProperty('probabilities');
      expect(dashboardData).toHaveProperty('events');
      expect(dashboardData).toHaveProperty('systemHealth');
      
      console.log(`Comprehensive dashboard data retrieval completed in ${duration}ms`);
    }, 10000);

    it('should handle InfluxDB performance monitoring', async () => {
      const startTime = Date.now();
      
      // Test performance monitoring
      await metricsService.recordInfluxDBPerformanceMetric('write_batch', 150, true);
      await metricsService.recordInfluxDBPerformanceMetric('query_dashboard', 75, true);
      await metricsService.recordInfluxDBPerformanceMetric('write_single', 200, false);
      
      await metricsService.flush();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
      
      console.log(`InfluxDB performance monitoring completed in ${duration}ms`);
    }, 5000);
  });

  describe('Data Retention Performance', () => {
    it('should handle retention cleanup efficiently', async () => {
      // This test verifies that retention cleanup doesn't impact performance
      const startTime = Date.now();
      
      await metricsService.performScheduledRetentionCleanup();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Cleanup should complete quickly
      expect(duration).toBeLessThan(1000);
      
      console.log(`Retention cleanup completed in ${duration}ms`);
    }, 10000);
  });
});
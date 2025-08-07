import { defaultInfluxDBConfig } from '../../core/influxdb-config';
import { MetricsService } from '../../core/metrics-service';

// Mock InfluxDB client
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

describe('InfluxDB Integration', () => {
  describe('Configuration', () => {
    it('should have default configuration', () => {
      expect(defaultInfluxDBConfig.url).toBe('http://localhost:8086');
      expect(defaultInfluxDBConfig.org).toBe('football-analytics');
      expect(defaultInfluxDBConfig.bucket).toBe('metrics');
      expect(defaultInfluxDBConfig.timeout).toBe(30000);
      expect(defaultInfluxDBConfig.batchSize).toBe(1000);
      expect(defaultInfluxDBConfig.flushInterval).toBe(5000);
      expect(defaultInfluxDBConfig.maxRetries).toBe(3);
    });
  });

  describe('MetricsService', () => {
    let metricsService: MetricsService;

    beforeEach(() => {
      metricsService = new MetricsService(defaultInfluxDBConfig);
    });

    it('should create MetricsService instance', () => {
      expect(metricsService).toBeInstanceOf(MetricsService);
    });

    it('should initialize without throwing', async () => {
      await expect(metricsService.initialize()).resolves.not.toThrow();
    });

    it('should close without throwing', async () => {
      await metricsService.initialize();
      await expect(metricsService.close()).resolves.not.toThrow();
    });

    it('should record game state metrics', async () => {
      await metricsService.initialize();
      
      const gameMetric = {
        gameId: 'test-game-1',
        timestamp: new Date(),
        homeScore: 14,
        awayScore: 7,
        quarter: 2
      };

      await expect(metricsService.recordGameState(gameMetric)).resolves.not.toThrow();
    });

    it('should record probability metrics', async () => {
      await metricsService.initialize();
      
      const probabilityMetric = {
        gameId: 'test-game-2',
        timestamp: new Date(),
        homeWinProbability: 0.65,
        awayWinProbability: 0.35
      };

      await expect(metricsService.recordProbabilities(probabilityMetric)).resolves.not.toThrow();
    });

    it('should record player statistics', async () => {
      await metricsService.initialize();
      
      const playerMetric = {
        gameId: 'test-game-3',
        playerId: 'test-player-1',
        playerName: 'Test Player',
        position: 'QB',
        teamId: 'test-team-1',
        timestamp: new Date(),
        statType: 'passing_yards',
        statValue: 275,
        season: 2024
      };

      await expect(metricsService.recordPlayerStat(playerMetric)).resolves.not.toThrow();
    });

    it('should record system metrics', async () => {
      await metricsService.initialize();
      
      const systemMetric = {
        service: 'api-gateway',
        timestamp: new Date(),
        metricType: 'cpu_usage',
        value: 75.5
      };

      await expect(metricsService.recordSystemMetric(systemMetric)).resolves.not.toThrow();
    });

    it('should record API metrics', async () => {
      await metricsService.initialize();
      
      const apiMetric = {
        endpoint: '/api/games',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
        timestamp: new Date()
      };

      await expect(metricsService.recordApiMetric(apiMetric)).resolves.not.toThrow();
    });

    it('should handle batch operations', async () => {
      await metricsService.initialize();
      
      const gameMetrics = [
        {
          gameId: 'test-game-4',
          timestamp: new Date(),
          homeScore: 0,
          awayScore: 0,
          quarter: 1
        },
        {
          gameId: 'test-game-4',
          timestamp: new Date(),
          homeScore: 7,
          awayScore: 0,
          quarter: 1
        }
      ];

      await expect(metricsService.recordGameStates(gameMetrics)).resolves.not.toThrow();
    });

    it('should query data without throwing', async () => {
      await metricsService.initialize();
      
      await expect(metricsService.getGameStateHistory('test-game-1')).resolves.not.toThrow();
      await expect(metricsService.getProbabilityHistory('test-game-2')).resolves.not.toThrow();
      await expect(metricsService.getPlayerStatsTrend('test-player-1', 'passing_yards')).resolves.not.toThrow();
      await expect(metricsService.getSystemMetrics('api-gateway', 'cpu_usage')).resolves.not.toThrow();
      await expect(metricsService.getApiPerformanceMetrics('/api/games')).resolves.not.toThrow();
    });

    it('should handle data cleanup', async () => {
      await metricsService.initialize();
      
      await expect(metricsService.cleanupOldData('test_measurement', 30)).resolves.not.toThrow();
    });

    it('should flush data', async () => {
      await metricsService.initialize();
      
      await expect(metricsService.flush()).resolves.not.toThrow();
    });

    it('should throw error when not initialized', async () => {
      const gameMetric = {
        gameId: 'test-game',
        timestamp: new Date(),
        homeScore: 0,
        awayScore: 0,
        quarter: 1
      };

      await expect(metricsService.recordGameState(gameMetric)).rejects.toThrow(
        'MetricsService not initialized'
      );
    });
  });
});
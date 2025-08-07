import { MetricsService, GameMetric, ProbabilityMetric, PlayerMetric, SystemMetric, ApiMetric } from '../../core/metrics-service';
import { InfluxDBManager } from '../../core/influxdb-config';

// Mock InfluxDBManager
jest.mock('../../core/influxdb-config');

describe('MetricsService', () => {
  let metricsService: MetricsService;
  let mockInfluxDBManager: jest.Mocked<InfluxDBManager>;

  const mockConfig = {
    url: 'http://test-influx:8086',
    token: 'test-token',
    org: 'test-org',
    bucket: 'test-bucket'
  };

  beforeEach(() => {
    mockInfluxDBManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      writePoint: jest.fn().mockResolvedValue(undefined),
      writePoints: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
      queryRaw: jest.fn().mockResolvedValue(''),
      isHealthy: jest.fn().mockResolvedValue(true),
      deleteOldData: jest.fn().mockResolvedValue(undefined),
      getBucketInfo: jest.fn().mockResolvedValue([]),
      createRetentionPolicy: jest.fn().mockResolvedValue(undefined),
      optimizeForRealTimeDashboard: jest.fn().mockResolvedValue(undefined),
      setupDataRetentionPolicies: jest.fn().mockResolvedValue(undefined),
      getOptimizedDashboardQuery: jest.fn().mockResolvedValue('from(bucket: "test-bucket") |> range(start: -1h) |> filter(fn: (r) => r._measurement == "game_state")'),
      getWriteApi: jest.fn(),
      getQueryApi: jest.fn(),
      config: mockConfig
    } as any;

    (InfluxDBManager as jest.MockedClass<typeof InfluxDBManager>).mockImplementation(() => mockInfluxDBManager);
    
    metricsService = new MetricsService(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await metricsService.initialize();
      
      expect(mockInfluxDBManager.initialize).toHaveBeenCalled();
      expect(mockInfluxDBManager.optimizeForRealTimeDashboard).toHaveBeenCalled();
      expect(mockInfluxDBManager.setupDataRetentionPolicies).toHaveBeenCalled();
    });

    it('should close connection properly', async () => {
      await metricsService.initialize();
      await metricsService.close();
      
      expect(mockInfluxDBManager.close).toHaveBeenCalled();
    });

    it('should check health status', async () => {
      await metricsService.initialize();
      const isHealthy = await metricsService.isHealthy();
      
      expect(isHealthy).toBe(true);
      expect(mockInfluxDBManager.isHealthy).toHaveBeenCalled();
    });
  });

  describe('Game State Metrics', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    it('should record single game state metric', async () => {
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

      expect(mockInfluxDBManager.writePoint).toHaveBeenCalledWith({
        measurement: 'game_state',
        tags: {
          game_id: 'test-game-1',
          quarter: '2'
        },
        fields: {
          home_score: 14,
          away_score: 7,
          time_remaining: '10:30',
          possession: 'home',
          field_position: 35,
          down: 2,
          yards_to_go: 8
        },
        timestamp: gameMetric.timestamp
      });
    });

    it('should record batch game state metrics', async () => {
      const gameMetrics: GameMetric[] = [
        {
          gameId: 'test-game-2',
          timestamp: new Date(),
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

      expect(mockInfluxDBManager.writePoints).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            measurement: 'game_state',
            tags: expect.objectContaining({ game_id: 'test-game-2' })
          })
        ])
      );
    });

    it('should query game state history', async () => {
      const mockHistory = [
        { _time: '2024-01-01T00:00:00Z', home_score: 0, away_score: 0 },
        { _time: '2024-01-01T00:15:00Z', home_score: 7, away_score: 0 }
      ];
      
      mockInfluxDBManager.query.mockResolvedValue(mockHistory);

      const history = await metricsService.getGameStateHistory('test-game-1', '-1h');

      expect(history).toEqual(mockHistory);
      expect(mockInfluxDBManager.getOptimizedDashboardQuery).toHaveBeenCalledWith('game_state', 'test-game-1', '-1h');
      expect(mockInfluxDBManager.query).toHaveBeenCalled();
    });

  });

  describe('Error Handling', () => {
    it('should throw error when not initialized', async () => {
      const gameMetric: GameMetric = {
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

  describe('Probability Metrics', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    it('should record probability metrics', async () => {
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

      expect(mockInfluxDBManager.writePoint).toHaveBeenCalledWith({
        measurement: 'game_probabilities',
        tags: {
          game_id: 'test-game-3',
          model_version: 'v1.0.0'
        },
        fields: {
          home_win_probability: 0.65,
          away_win_probability: 0.35,
          spread_probability: 0.52,
          spread_value: -3.5,
          over_probability: 0.48,
          under_probability: 0.52,
          total_points: 47.5
        },
        timestamp: probabilityMetric.timestamp
      });
    });

    it('should record batch probability metrics', async () => {
      const probabilityMetrics: ProbabilityMetric[] = [
        {
          gameId: 'test-game-4',
          timestamp: new Date(),
          homeWinProbability: 0.60,
          awayWinProbability: 0.40
        },
        {
          gameId: 'test-game-4',
          timestamp: new Date(),
          homeWinProbability: 0.70,
          awayWinProbability: 0.30
        }
      ];

      await metricsService.recordProbabilitiesBatch(probabilityMetrics);

      expect(mockInfluxDBManager.writePoints).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            measurement: 'game_probabilities',
            tags: expect.objectContaining({ game_id: 'test-game-4' })
          })
        ])
      );
    });

    it('should query probability history', async () => {
      const mockHistory = [
        { _time: '2024-01-01T00:00:00Z', home_win_probability: 0.60 },
        { _time: '2024-01-01T00:15:00Z', home_win_probability: 0.65 }
      ];
      
      mockInfluxDBManager.query.mockResolvedValue(mockHistory);

      const history = await metricsService.getProbabilityHistory('test-game-3', '-1h');

      expect(history).toEqual(mockHistory);
      expect(mockInfluxDBManager.getOptimizedDashboardQuery).toHaveBeenCalledWith('game_probabilities', 'test-game-3', '-1h');
      expect(mockInfluxDBManager.query).toHaveBeenCalled();
    });
  });

  describe('Player Metrics', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    it('should record player statistics', async () => {
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

      expect(mockInfluxDBManager.writePoint).toHaveBeenCalledWith({
        measurement: 'player_stats',
        tags: {
          game_id: 'test-game-5',
          player_id: 'test-player-1',
          player_name: 'Test Player',
          position: 'QB',
          team_id: 'test-team-1',
          stat_type: 'passing_yards',
          season: '2024',
          week: '1'
        },
        fields: {
          stat_value: 275
        },
        timestamp: playerMetric.timestamp
      });
    });

    it('should query player stats trend', async () => {
      const mockTrend = [
        { _time: '2024-01-01T00:00:00Z', stat_value: 250 },
        { _time: '2024-01-08T00:00:00Z', stat_value: 275 }
      ];
      
      mockInfluxDBManager.query.mockResolvedValue(mockTrend);

      const trend = await metricsService.getPlayerStatsTrend('test-player-1', 'passing_yards', '-7d');

      expect(trend).toEqual(mockTrend);
      expect(mockInfluxDBManager.query).toHaveBeenCalledWith(
        expect.stringContaining('player_stats')
      );
    });
  });

  describe('System Metrics', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    it('should record system performance metrics', async () => {
      const systemMetric: SystemMetric = {
        service: 'api-gateway',
        timestamp: new Date(),
        metricType: 'cpu_usage',
        value: 75.5,
        unit: 'percent',
        tags: { instance: 'api-1' }
      };

      await metricsService.recordSystemMetric(systemMetric);

      expect(mockInfluxDBManager.writePoint).toHaveBeenCalledWith({
        measurement: 'system_metrics',
        tags: {
          service: 'api-gateway',
          metric_type: 'cpu_usage',
          unit: 'percent',
          instance: 'api-1'
        },
        fields: {
          value: 75.5
        },
        timestamp: systemMetric.timestamp
      });
    });

    it('should query system metrics', async () => {
      const mockMetrics = [
        { _time: '2024-01-01T00:00:00Z', value: 70.0 },
        { _time: '2024-01-01T00:05:00Z', value: 75.5 }
      ];
      
      mockInfluxDBManager.query.mockResolvedValue(mockMetrics);

      const metrics = await metricsService.getSystemMetrics('api-gateway', 'cpu_usage', '-1h');

      expect(metrics).toEqual(mockMetrics);
      expect(mockInfluxDBManager.query).toHaveBeenCalledWith(
        expect.stringContaining('system_metrics')
      );
    });
  });

  describe('API Metrics', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    it('should record API performance metrics', async () => {
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

      expect(mockInfluxDBManager.writePoint).toHaveBeenCalledWith({
        measurement: 'api_metrics',
        tags: {
          endpoint: '/api/games',
          method: 'GET',
          status_code: '200',
          user_id: 'test-user-1'
        },
        fields: {
          response_time: 150,
          user_agent: 'test-agent'
        },
        timestamp: apiMetric.timestamp
      });
    });

    it('should calculate average response time', async () => {
      mockInfluxDBManager.query.mockResolvedValue([{ _value: 125.5 }]);

      const avgResponseTime = await metricsService.getAverageResponseTime('/api/games', '-1h');

      expect(avgResponseTime).toBe(125.5);
      expect(mockInfluxDBManager.query).toHaveBeenCalledWith(
        expect.stringContaining('mean()')
      );
    });

    it('should calculate error rate', async () => {
      // Mock total requests
      mockInfluxDBManager.query
        .mockResolvedValueOnce([{ _value: 100 }]) // total requests
        .mockResolvedValueOnce([{ _value: 5 }]);  // error requests

      const errorRate = await metricsService.getErrorRate('-1h');

      expect(errorRate).toBe(5); // 5% error rate
      expect(mockInfluxDBManager.query).toHaveBeenCalledTimes(2);
    });

    it('should return 0 error rate when no requests', async () => {
      mockInfluxDBManager.query
        .mockResolvedValueOnce([]) // no total requests
        .mockResolvedValueOnce([]); // no error requests

      const errorRate = await metricsService.getErrorRate('-1h');

      expect(errorRate).toBe(0);
    });
  });

  describe('Data Management', () => {
    beforeEach(async () => {
      await metricsService.initialize();
    });

    it('should flush data buffer', async () => {
      await metricsService.flush();
      
      expect(mockInfluxDBManager.flush).toHaveBeenCalled();
    });

    it('should cleanup old data', async () => {
      await metricsService.cleanupOldData('test_measurement', 30);
      
      expect(mockInfluxDBManager.deleteOldData).toHaveBeenCalledWith(
        'test_measurement',
        expect.any(String)
      );
    });
  });
});
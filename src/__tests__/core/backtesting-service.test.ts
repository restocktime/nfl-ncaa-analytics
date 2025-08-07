import { BacktestingService, BacktestingMetrics, HistoricalDataPoint } from '../../core/backtesting-service';
import { MLModelService } from '../../core/ml-model-service';
import { Game } from '../../models/Game';
import { Team } from '../../models/Team';

// Mock dependencies
jest.mock('../../core/ml-model-service');
jest.mock('../../core/logger');

describe('BacktestingService', () => {
  let backtestingService: BacktestingService;
  let mockMLModelService: jest.Mocked<MLModelService>;
  let mockProbabilityEngine: any;

  beforeEach(() => {
    mockMLModelService = new MLModelService({} as any, {} as any) as jest.Mocked<MLModelService>;
    mockProbabilityEngine = {
      calculateWinProbability: jest.fn()
    };

    backtestingService = new BacktestingService(mockMLModelService, mockProbabilityEngine);
  });

  describe('runBacktest', () => {
    it('should calculate correct Brier scores for perfect predictions', async () => {
      const historicalData: HistoricalDataPoint[] = [
        {
          game: createMockGame('game1'),
          actualOutcome: 1,
          gameState: {},
          timestamp: new Date('2023-01-01')
        },
        {
          game: createMockGame('game2'),
          actualOutcome: 0,
          gameState: {},
          timestamp: new Date('2023-01-02')
        }
      ];

      mockProbabilityEngine.calculateWinProbability
        .mockResolvedValueOnce(1.0) // Perfect prediction for home win
        .mockResolvedValueOnce(0.0); // Perfect prediction for away win

      const result = await backtestingService.runBacktest(
        'test-model',
        historicalData,
        new Date('2023-01-01'),
        new Date('2023-01-02')
      );

      expect(result.metrics.brierScore).toBe(0); // Perfect Brier score
      expect(result.metrics.accuracy).toBe(1); // Perfect accuracy
      expect(result.gameResults).toHaveLength(2);
    });

    it('should calculate correct Brier scores for worst predictions', async () => {
      const historicalData: HistoricalDataPoint[] = [
        {
          game: createMockGame('game1'),
          actualOutcome: 1,
          gameState: {},
          timestamp: new Date('2023-01-01')
        },
        {
          game: createMockGame('game2'),
          actualOutcome: 0,
          gameState: {},
          timestamp: new Date('2023-01-02')
        }
      ];

      mockProbabilityEngine.calculateWinProbability
        .mockResolvedValueOnce(0.0) // Wrong prediction for home win
        .mockResolvedValueOnce(1.0); // Wrong prediction for away win

      const result = await backtestingService.runBacktest(
        'test-model',
        historicalData,
        new Date('2023-01-01'),
        new Date('2023-01-02')
      );

      expect(result.metrics.brierScore).toBe(1); // Worst Brier score
      expect(result.metrics.accuracy).toBe(0); // Worst accuracy
    });

    it('should calculate log loss correctly', async () => {
      const historicalData: HistoricalDataPoint[] = [
        {
          game: createMockGame('game1'),
          actualOutcome: 1,
          gameState: {},
          timestamp: new Date('2023-01-01')
        }
      ];

      mockProbabilityEngine.calculateWinProbability.mockResolvedValueOnce(0.8);

      const result = await backtestingService.runBacktest(
        'test-model',
        historicalData,
        new Date('2023-01-01'),
        new Date('2023-01-01')
      );

      // Log loss for p=0.8, actual=1 should be -log(0.8) ≈ 0.223
      expect(result.metrics.logLoss).toBeCloseTo(0.223, 2);
    });

    it('should handle edge case probabilities in log loss calculation', async () => {
      const historicalData: HistoricalDataPoint[] = [
        {
          game: createMockGame('game1'),
          actualOutcome: 1,
          gameState: {},
          timestamp: new Date('2023-01-01')
        }
      ];

      // Test with probability very close to 0 (should be clamped)
      mockProbabilityEngine.calculateWinProbability.mockResolvedValueOnce(0.0001);

      const result = await backtestingService.runBacktest(
        'test-model',
        historicalData,
        new Date('2023-01-01'),
        new Date('2023-01-01')
      );

      // Should not be infinite due to clamping
      expect(Number.isFinite(result.metrics.logLoss)).toBe(true);
      expect(result.metrics.logLoss).toBeGreaterThan(0);
    });

    it('should calculate calibration correctly', async () => {
      // Create data with known calibration properties
      const historicalData: HistoricalDataPoint[] = [];
      
      // Add 10 games with 0.7 probability, 7 should be wins (well calibrated)
      for (let i = 0; i < 10; i++) {
        historicalData.push({
          game: createMockGame(`game${i}`),
          actualOutcome: i < 7 ? 1 : 0, // 7 wins out of 10
          gameState: {},
          timestamp: new Date(`2023-01-${i + 1}`)
        });
      }

      mockProbabilityEngine.calculateWinProbability.mockResolvedValue(0.7);

      const result = await backtestingService.runBacktest(
        'test-model',
        historicalData,
        new Date('2023-01-01'),
        new Date('2023-01-10')
      );

      // Should have good calibration (close to 0)
      expect(result.metrics.calibration).toBeLessThan(0.1);
    });

    it('should calculate sharpness correctly', async () => {
      const historicalData: HistoricalDataPoint[] = [
        {
          game: createMockGame('game1'),
          actualOutcome: 1,
          gameState: {},
          timestamp: new Date('2023-01-01')
        },
        {
          game: createMockGame('game2'),
          actualOutcome: 0,
          gameState: {},
          timestamp: new Date('2023-01-02')
        }
      ];

      mockProbabilityEngine.calculateWinProbability
        .mockResolvedValueOnce(0.9) // Sharp prediction (far from 0.5)
        .mockResolvedValueOnce(0.1); // Sharp prediction (far from 0.5)

      const result = await backtestingService.runBacktest(
        'test-model',
        historicalData,
        new Date('2023-01-01'),
        new Date('2023-01-02')
      );

      // Sharpness should be 0.4 (average distance from 0.5)
      expect(result.metrics.sharpness).toBe(0.4);
    });

    it('should group results by week correctly', async () => {
      const historicalData: HistoricalDataPoint[] = [
        {
          game: createMockGame('game1', new Date('2023-01-01')),
          actualOutcome: 1,
          gameState: {},
          timestamp: new Date('2023-01-01')
        },
        {
          game: createMockGame('game2', new Date('2023-01-08')),
          actualOutcome: 0,
          gameState: {},
          timestamp: new Date('2023-01-08')
        }
      ];

      mockProbabilityEngine.calculateWinProbability
        .mockResolvedValueOnce(0.8)
        .mockResolvedValueOnce(0.2);

      const result = await backtestingService.runBacktest(
        'test-model',
        historicalData,
        new Date('2023-01-01'),
        new Date('2023-01-08')
      );

      expect(result.performanceByWeek).toHaveLength(2);
      expect(result.performanceByWeek[0].gamesCount).toBe(1);
      expect(result.performanceByWeek[1].gamesCount).toBe(1);
    });

    it('should handle empty historical data', async () => {
      await expect(
        backtestingService.runBacktest(
          'test-model',
          [],
          new Date('2023-01-01'),
          new Date('2023-01-02')
        )
      ).rejects.toThrow('No game results to calculate metrics from');
    });

    it('should filter data by date range correctly', async () => {
      const historicalData: HistoricalDataPoint[] = [
        {
          game: createMockGame('game1'),
          actualOutcome: 1,
          gameState: {},
          timestamp: new Date('2022-12-31') // Before range
        },
        {
          game: createMockGame('game2'),
          actualOutcome: 1,
          gameState: {},
          timestamp: new Date('2023-01-01') // In range
        },
        {
          game: createMockGame('game3'),
          actualOutcome: 1,
          gameState: {},
          timestamp: new Date('2023-01-03') // After range
        }
      ];

      mockProbabilityEngine.calculateWinProbability.mockResolvedValue(0.8);

      const result = await backtestingService.runBacktest(
        'test-model',
        historicalData,
        new Date('2023-01-01'),
        new Date('2023-01-02')
      );

      expect(result.gameResults).toHaveLength(1);
      expect(result.gameResults[0].gameId).toBe('game2');
    });
  });

  describe('compareModels', () => {
    it('should rank models by Brier score', async () => {
      const historicalData: HistoricalDataPoint[] = [
        {
          game: createMockGame('game1'),
          actualOutcome: 1,
          gameState: {},
          timestamp: new Date('2023-01-01')
        }
      ];

      // Mock different performance for different models
      mockProbabilityEngine.calculateWinProbability
        .mockResolvedValueOnce(0.9) // Good prediction for model1
        .mockResolvedValueOnce(0.1); // Bad prediction for model2

      const comparison = await backtestingService.compareModels(
        ['model1', 'model2'],
        historicalData,
        new Date('2023-01-01'),
        new Date('2023-01-01')
      );

      expect(comparison.models).toHaveLength(2);
      expect(comparison.bestModel.modelId).toBe('model1');
      expect(comparison.models[0].rank).toBe(1);
      expect(comparison.models[1].rank).toBe(2);
    });

    it('should generate meaningful comparison summary', async () => {
      const historicalData: HistoricalDataPoint[] = [
        {
          game: createMockGame('game1'),
          actualOutcome: 1,
          gameState: {},
          timestamp: new Date('2023-01-01')
        }
      ];

      mockProbabilityEngine.calculateWinProbability
        .mockResolvedValueOnce(0.9) // Brier score: 0.01
        .mockResolvedValueOnce(0.5); // Brier score: 0.25

      const comparison = await backtestingService.compareModels(
        ['model1', 'model2'],
        historicalData,
        new Date('2023-01-01'),
        new Date('2023-01-01')
      );

      expect(comparison.summary).toContain('model1');
      expect(comparison.summary).toContain('improvement');
      expect(comparison.summary).toContain('%');
    });
  });

  describe('metric calculations', () => {
    it('should calculate Brier score correctly for single prediction', () => {
      const service = backtestingService as any;
      
      // Perfect prediction
      expect(service.calculateBrierScore(1.0, 1)).toBe(0);
      expect(service.calculateBrierScore(0.0, 0)).toBe(0);
      
      // Worst prediction
      expect(service.calculateBrierScore(0.0, 1)).toBe(1);
      expect(service.calculateBrierScore(1.0, 0)).toBe(1);
      
      // Moderate prediction
      expect(service.calculateBrierScore(0.7, 1)).toBeCloseTo(0.09, 2);
    });

    it('should calculate log loss correctly for single prediction', () => {
      const service = backtestingService as any;
      
      // Test with actual outcome = 1
      expect(service.calculateLogLoss(0.999, 1)).toBeCloseTo(0.001, 2);
      expect(service.calculateLogLoss(0.5, 1)).toBeCloseTo(0.693, 2);
      
      // Test with actual outcome = 0
      expect(service.calculateLogLoss(0.001, 0)).toBeCloseTo(0.001, 2);
      expect(service.calculateLogLoss(0.5, 0)).toBeCloseTo(0.693, 2);
    });

    it('should clamp probabilities in log loss calculation', () => {
      const service = backtestingService as any;
      
      // Test extreme probabilities
      const logLoss1 = service.calculateLogLoss(0.0, 1);
      const logLoss2 = service.calculateLogLoss(1.0, 0);
      
      expect(Number.isFinite(logLoss1)).toBe(true);
      expect(Number.isFinite(logLoss2)).toBe(true);
      expect(logLoss1).toBeGreaterThan(0);
      expect(logLoss2).toBeGreaterThan(0);
    });
  });
});

function createMockGame(id: string, scheduledTime?: Date): Game {
  const mockTeam1 = new Team({
    id: 'team1',
    name: 'Team 1',
    abbreviation: 'T1',
    city: 'City 1',
    conference: 'Conference 1',
    division: 'Division 1',
    logo: 'logo1.png',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    roster: [],
    coaching: { headCoach: 'Coach 1' } as any,
    statistics: { wins: 10, losses: 5, ties: 0 } as any,
    homeVenue: 'Stadium 1'
  });

  const mockTeam2 = new Team({
    id: 'team2',
    name: 'Team 2',
    abbreviation: 'T2',
    city: 'City 2',
    conference: 'Conference 2',
    division: 'Division 2',
    logo: 'logo2.png',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    roster: [],
    coaching: { headCoach: 'Coach 2' } as any,
    statistics: { wins: 8, losses: 7, ties: 0 } as any,
    homeVenue: 'Stadium 2'
  });

  return new Game({
    id,
    homeTeam: mockTeam1,
    awayTeam: mockTeam2,
    venue: { id: 'venue1', name: 'Test Stadium' } as any,
    scheduledTime: scheduledTime || new Date(),
    status: 'completed' as any,
    officials: [],
    season: 2023,
    week: 1,
    gameType: 'regular_season' as any,
    weather: undefined,
    attendance: 50000,
    broadcast: undefined
  });
}
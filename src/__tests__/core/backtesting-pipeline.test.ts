import { BacktestingPipeline, PipelineConfiguration } from '../../core/backtesting-pipeline';
import { BacktestingService } from '../../core/backtesting-service';
import { HistoricalDataReplay } from '../../core/historical-data-replay';
import { MLModelService } from '../../core/ml-model-service';
import { DatabaseService } from '../../core/database-service';

// Mock dependencies
jest.mock('../../core/backtesting-service');
jest.mock('../../core/historical-data-replay');
jest.mock('../../core/ml-model-service');
jest.mock('../../core/database-service');
jest.mock('../../core/logger');

describe('BacktestingPipeline', () => {
  let pipeline: BacktestingPipeline;
  let mockBacktestingService: jest.Mocked<BacktestingService>;
  let mockHistoricalDataReplay: jest.Mocked<HistoricalDataReplay>;
  let mockMLModelService: jest.Mocked<MLModelService>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockBacktestingService = new BacktestingService({} as any, {} as any) as jest.Mocked<BacktestingService>;
    mockHistoricalDataReplay = new HistoricalDataReplay({} as any) as jest.Mocked<HistoricalDataReplay>;
    mockMLModelService = new MLModelService({} as any, {} as any) as jest.Mocked<MLModelService>;
    mockDatabaseService = new DatabaseService({} as any) as jest.Mocked<DatabaseService>;

    pipeline = new BacktestingPipeline(
      mockBacktestingService,
      mockHistoricalDataReplay,
      mockMLModelService,
      mockDatabaseService
    );
  });

  describe('runPipeline', () => {
    it('should execute complete pipeline successfully', async () => {
      const config: PipelineConfiguration = {
        models: ['model1', 'model2'],
        seasons: [2022, 2023],
        testSplitRatio: 0.2,
        validationSplitRatio: 0.1,
        crossValidationFolds: 5,
        metricsToTrack: ['brierScore', 'logLoss', 'accuracy'],
        outputPath: '/tmp/results',
        parallelJobs: 2
      };

      const mockHistoricalData = [
        {
          game: { id: 'game1' } as any,
          gameStates: [{ timestamp: new Date(), gameState: {}, context: {} }],
          finalOutcome: { homeScore: 21, awayScore: 14, winner: 'home' as const, margin: 7, totalPoints: 35 },
          metadata: { season: 2023, week: 1, gameType: 'regular_season' as any, venue: 'Stadium 1' }
        }
      ];

      const mockBacktestResult = {
        modelId: 'model1',
        modelVersion: '1.0.0',
        testPeriod: { startDate: new Date(), endDate: new Date() },
        metrics: {
          brierScore: 0.2,
          logLoss: 0.5,
          accuracy: 0.8,
          calibration: 0.1,
          sharpness: 0.3,
          totalPredictions: 100
        },
        gameResults: [],
        performanceByWeek: []
      };

      mockHistoricalDataReplay.loadHistoricalData.mockResolvedValue(mockHistoricalData);
      mockBacktestingService.runBacktest.mockResolvedValue(mockBacktestResult);
      mockBacktestingService.compareModels.mockResolvedValue({
        comparisonDate: new Date(),
        models: [
          { modelId: 'model1', modelVersion: '1.0.0', metrics: mockBacktestResult.metrics, rank: 1 }
        ],
        bestModel: { modelId: 'model1', modelVersion: '1.0.0', metrics: mockBacktestResult.metrics, rank: 1 },
        summary: 'Model1 is best'
      });
      mockDatabaseService.savePipelineResult.mockResolvedValue();

      const result = await pipeline.runPipeline(config);

      expect(result.pipelineId).toBeDefined();
      expect(result.configuration).toBe(config);
      expect(result.modelResults).toHaveLength(2);
      expect(result.comparison).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(mockDatabaseService.savePipelineResult).toHaveBeenCalled();
    });

    it('should emit pipeline events during execution', async () => {
      const config: PipelineConfiguration = {
        models: ['model1'],
        seasons: [2023],
        testSplitRatio: 0.2,
        validationSplitRatio: 0.1,
        crossValidationFolds: 3,
        metricsToTrack: ['brierScore'],
        outputPath: '/tmp/results',
        parallelJobs: 1
      };

      const eventSpy = jest.fn();
      pipeline.on('pipeline:started', eventSpy);
      pipeline.on('pipeline:step', eventSpy);
      pipeline.on('pipeline:completed', eventSpy);

      mockHistoricalDataReplay.loadHistoricalData.mockResolvedValue([]);
      mockBacktestingService.runBacktest.mockResolvedValue({} as any);
      mockBacktestingService.compareModels.mockResolvedValue({} as any);
      mockDatabaseService.savePipelineResult.mockResolvedValue();

      await pipeline.runPipeline(config);

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({ pipelineId: expect.any(String) }));
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({ step: 'data_loading' }));
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({ step: 'data_splitting' }));
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({ step: 'model_evaluation' }));
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({ step: 'model_comparison' }));
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({ step: 'summary_generation' }));
    });

    it('should handle pipeline errors gracefully', async () => {
      const config: PipelineConfiguration = {
        models: ['model1'],
        seasons: [2023],
        testSplitRatio: 0.2,
        validationSplitRatio: 0.1,
        crossValidationFolds: 3,
        metricsToTrack: ['brierScore'],
        outputPath: '/tmp/results',
        parallelJobs: 1
      };

      const errorSpy = jest.fn();
      pipeline.on('pipeline:error', errorSpy);

      const testError = new Error('Test error');
      mockHistoricalDataReplay.loadHistoricalData.mockRejectedValue(testError);

      await expect(pipeline.runPipeline(config)).rejects.toThrow('Test error');
      expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({ error: testError }));
    });
  });

  describe('runCrossValidation', () => {
    it('should perform k-fold cross validation', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        game: { id: `game${i}` } as any,
        gameStates: [{ timestamp: new Date(), gameState: {}, context: {} }],
        finalOutcome: { homeScore: 21, awayScore: 14, winner: 'home' as const, margin: 7, totalPoints: 35 },
        metadata: { season: 2023, week: 1, gameType: 'regular_season' as any, venue: 'Stadium 1' }
      }));

      const mockBacktestResult = {
        modelId: 'model1',
        modelVersion: '1.0.0',
        testPeriod: { startDate: new Date(), endDate: new Date() },
        metrics: {
          brierScore: 0.2,
          logLoss: 0.5,
          accuracy: 0.8,
          calibration: 0.1,
          sharpness: 0.3,
          totalPredictions: 2
        },
        gameResults: [],
        performanceByWeek: []
      };

      mockBacktestingService.runBacktest.mockResolvedValue(mockBacktestResult);

      const results = await pipeline.runCrossValidation('model1', mockData, 5);

      expect(results).toHaveLength(5);
      expect(results[0].fold).toBe(0);
      expect(results[0].trainingSize).toBe(8); // 10 - 2 (fold size)
      expect(results[0].testSize).toBe(2);
      expect(results[0].metrics.brierScore).toBe(0.2);
      expect(mockBacktestingService.runBacktest).toHaveBeenCalledTimes(5);
    });

    it('should handle uneven fold sizes correctly', async () => {
      const mockData = Array.from({ length: 7 }, (_, i) => ({
        game: { id: `game${i}` } as any,
        gameStates: [{ timestamp: new Date(), gameState: {}, context: {} }],
        finalOutcome: { homeScore: 21, awayScore: 14, winner: 'home' as const, margin: 7, totalPoints: 35 },
        metadata: { season: 2023, week: 1, gameType: 'regular_season' as any, venue: 'Stadium 1' }
      }));

      mockBacktestingService.runBacktest.mockResolvedValue({
        metrics: { brierScore: 0.2, logLoss: 0.5, accuracy: 0.8 }
      } as any);

      const results = await pipeline.runCrossValidation('model1', mockData, 3);

      expect(results).toHaveLength(3);
      // First two folds should have 2 items each, last fold should have 3 items
      expect(results[0].testSize).toBe(2);
      expect(results[1].testSize).toBe(2);
      expect(results[2].testSize).toBe(3);
    });

    it('should emit cross validation events', async () => {
      const mockData = Array.from({ length: 4 }, (_, i) => ({
        game: { id: `game${i}` } as any,
        gameStates: [{ timestamp: new Date(), gameState: {}, context: {} }],
        finalOutcome: { homeScore: 21, awayScore: 14, winner: 'home' as const, margin: 7, totalPoints: 35 },
        metadata: { season: 2023, week: 1, gameType: 'regular_season' as any, venue: 'Stadium 1' }
      }));

      const eventSpy = jest.fn();
      pipeline.on('cross_validation:fold_completed', eventSpy);

      mockBacktestingService.runBacktest.mockResolvedValue({
        metrics: { brierScore: 0.2, logLoss: 0.5, accuracy: 0.8 }
      } as any);

      await pipeline.runCrossValidation('model1', mockData, 2);

      expect(eventSpy).toHaveBeenCalledTimes(2);
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        modelId: 'model1',
        fold: 0,
        results: expect.any(Object)
      }));
    });
  });

  describe('data splitting', () => {
    it('should split data according to ratios', () => {
      const mockData = Array.from({ length: 100 }, (_, i) => ({
        game: { id: `game${i}` } as any,
        gameStates: [],
        finalOutcome: { homeScore: 21, awayScore: 14, winner: 'home' as const, margin: 7, totalPoints: 35 },
        metadata: { season: 2023, week: 1, gameType: 'regular_season' as any, venue: 'Stadium 1' }
      }));

      const config: PipelineConfiguration = {
        models: ['model1'],
        seasons: [2023],
        testSplitRatio: 0.2,
        validationSplitRatio: 0.1,
        crossValidationFolds: 5,
        metricsToTrack: ['brierScore'],
        outputPath: '/tmp/results',
        parallelJobs: 1
      };

      const pipelinePrivate = pipeline as any;
      const splits = pipelinePrivate.splitData(mockData, config);

      expect(splits.training).toHaveLength(70); // 100 - 20 - 10
      expect(splits.validation).toHaveLength(10); // 10% of 100
      expect(splits.test).toHaveLength(20); // 20% of 100
    });

    it('should shuffle data by seasons', () => {
      const mockData = [
        { metadata: { season: 2021 } },
        { metadata: { season: 2021 } },
        { metadata: { season: 2022 } },
        { metadata: { season: 2022 } },
        { metadata: { season: 2023 } },
        { metadata: { season: 2023 } }
      ] as any[];

      const pipelinePrivate = pipeline as any;
      const shuffled = pipelinePrivate.shuffleDataBySeasons(mockData);

      expect(shuffled).toHaveLength(6);
      // Should still have all seasons represented
      const seasons = shuffled.map(d => d.metadata.season);
      expect(seasons).toContain(2021);
      expect(seasons).toContain(2022);
      expect(seasons).toContain(2023);
    });
  });

  describe('summary generation', () => {
    it('should generate meaningful recommendations', () => {
      const mockResults = [
        {
          modelId: 'model1',
          backtestingResult: { metrics: { accuracy: 0.85 }, gameResults: Array(100) },
          performanceMetrics: { averagePredictionTime: 50 }
        },
        {
          modelId: 'model2',
          backtestingResult: { metrics: { accuracy: 0.80 }, gameResults: Array(100) },
          performanceMetrics: { averagePredictionTime: 20 }
        }
      ] as any[];

      const mockComparison = {
        bestModel: { modelId: 'model1' }
      } as any;

      const pipelinePrivate = pipeline as any;
      const recommendations = pipelinePrivate.generateRecommendations(mockResults, mockComparison);

      expect(recommendations).toContain('Use model1 as the primary model for production');
      expect(recommendations.some(r => r.includes('model2'))).toBe(true); // Should mention faster model
    });

    it('should recommend ensemble methods for high accuracy models', () => {
      const mockResults = [
        {
          modelId: 'model1',
          backtestingResult: { metrics: { accuracy: 0.85 }, gameResults: Array(100) },
          performanceMetrics: { averagePredictionTime: 50 }
        },
        {
          modelId: 'model2',
          backtestingResult: { metrics: { accuracy: 0.82 }, gameResults: Array(100) },
          performanceMetrics: { averagePredictionTime: 60 }
        }
      ] as any[];

      const mockComparison = {
        bestModel: { modelId: 'model1' }
      } as any;

      const pipelinePrivate = pipeline as any;
      const recommendations = pipelinePrivate.generateRecommendations(mockResults, mockComparison);

      expect(recommendations.some(r => r.includes('ensemble'))).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should chunk arrays correctly', () => {
      const pipelinePrivate = pipeline as any;
      const array = [1, 2, 3, 4, 5, 6, 7];
      const chunks = pipelinePrivate.chunkArray(array, 3);

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual([1, 2, 3]);
      expect(chunks[1]).toEqual([4, 5, 6]);
      expect(chunks[2]).toEqual([7]);
    });

    it('should generate unique pipeline IDs', () => {
      const pipelinePrivate = pipeline as any;
      const id1 = pipelinePrivate.generatePipelineId();
      const id2 = pipelinePrivate.generatePipelineId();

      expect(id1).toMatch(/^pipeline_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^pipeline_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});
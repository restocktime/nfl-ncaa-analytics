import { GameSimulationTestSuite } from '../../testing/game-simulation-test-suite';
import { HistoricalDataReplay } from '../../core/historical-data-replay';
import { ProbabilityEngine } from '../../types/common.types';
import { MLModelService } from '../../core/ml-model-service';
import { DatabaseService } from '../../core/database-service';
import { WebSocketService } from '../../api/websocket-service';
import { Game } from '../../models/Game';
import { Team } from '../../models/Team';

// Mock external dependencies
jest.mock('../../core/database-service');
jest.mock('../../api/websocket-service');
jest.mock('../../core/logger');

describe('End-to-End Game Simulation Tests', () => {
  let gameSimulationSuite: GameSimulationTestSuite;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockWebSocketService: jest.Mocked<WebSocketService>;
  let mockProbabilityEngine: jest.Mocked<ProbabilityEngine>;
  let mockMLModelService: jest.Mocked<MLModelService>;

  beforeEach(() => {
    mockDatabaseService = new DatabaseService({} as any) as jest.Mocked<DatabaseService>;
    mockWebSocketService = new WebSocketService({} as any, {} as any) as jest.Mocked<WebSocketService>;
    mockProbabilityEngine = {
      initializeGameProbabilities: jest.fn(),
      updateProbabilities: jest.fn(),
      calculateWinProbability: jest.fn(),
      calculateSpreadProbability: jest.fn()
    } as jest.Mocked<ProbabilityEngine>;
    mockMLModelService = new MLModelService({} as any, {} as any) as jest.Mocked<MLModelService>;

    gameSimulationSuite = new GameSimulationTestSuite(
      mockDatabaseService,
      mockWebSocketService,
      mockProbabilityEngine,
      mockMLModelService
    );
  });

  describe('Full Game Simulation', () => {
    it('should simulate complete game from kickoff to final score', async () => {
      const game = createMockGame('test-game-1');
      const historicalData = createMockHistoricalGameData(game);

      // Mock initial probabilities
      mockProbabilityEngine.initializeGameProbabilities.mockResolvedValue({
        gameId: game.id,
        timestamp: new Date(),
        winProbability: { home: 0.55, away: 0.45 },
        spreadProbability: { spread: -3, probability: 0.52, confidence: 0.8 },
        totalProbability: { over: 0.48, under: 0.52, total: 47.5 },
        playerProps: []
      });

      // Mock probability updates throughout the game
      mockProbabilityEngine.updateProbabilities.mockResolvedValue({
        gameId: game.id,
        timestamp: new Date(),
        winProbability: { home: 0.65, away: 0.35 },
        spreadProbability: { spread: -3, probability: 0.72, confidence: 0.85 },
        totalProbability: { over: 0.55, under: 0.45, total: 47.5 },
        playerProps: []
      });

      // Mock WebSocket broadcasts
      mockWebSocketService.broadcastProbabilityUpdate.mockResolvedValue();

      const result = await gameSimulationSuite.simulateCompleteGame(game, historicalData);

      expect(result.gameId).toBe(game.id);
      expect(result.simulationSteps).toBeGreaterThan(0);
      expect(result.finalProbabilities).toBeDefined();
      expect(result.accuracyMetrics).toBeDefined();
      expect(result.performanceMetrics.totalExecutionTime).toBeGreaterThan(0);

      // Verify system interactions
      expect(mockProbabilityEngine.initializeGameProbabilities).toHaveBeenCalledWith(game);
      expect(mockProbabilityEngine.updateProbabilities).toHaveBeenCalled();
      expect(mockWebSocketService.broadcastProbabilityUpdate).toHaveBeenCalled();
    });

    it('should handle real-time probability updates during simulation', async () => {
      const game = createMockGame('test-game-2');
      const historicalData = createMockHistoricalGameData(game);

      // Mock progressive probability changes
      const probabilitySequence = [
        { home: 0.55, away: 0.45 },
        { home: 0.62, away: 0.38 },
        { home: 0.58, away: 0.42 },
        { home: 0.71, away: 0.29 }
      ];

      mockProbabilityEngine.initializeGameProbabilities.mockResolvedValue({
        gameId: game.id,
        timestamp: new Date(),
        winProbability: probabilitySequence[0],
        spreadProbability: { spread: -3, probability: 0.52, confidence: 0.8 },
        totalProbability: { over: 0.48, under: 0.52, total: 47.5 },
        playerProps: []
      });

      probabilitySequence.slice(1).forEach((prob, index) => {
        mockProbabilityEngine.updateProbabilities.mockResolvedValueOnce({
          gameId: game.id,
          timestamp: new Date(),
          winProbability: prob,
          spreadProbability: { spread: -3, probability: 0.52 + (index * 0.05), confidence: 0.8 },
          totalProbability: { over: 0.48, under: 0.52, total: 47.5 },
          playerProps: []
        });
      });

      const result = await gameSimulationSuite.simulateCompleteGame(game, historicalData);

      expect(result.probabilityHistory).toHaveLength(probabilitySequence.length);
      expect(result.probabilityHistory[0].winProbability.home).toBe(0.55);
      expect(result.probabilityHistory[result.probabilityHistory.length - 1].winProbability.home).toBe(0.71);
    });

    it('should validate prediction accuracy against actual outcomes', async () => {
      const game = createMockGame('test-game-3');
      const historicalData = createMockHistoricalGameData(game, {
        finalScore: { home: 28, away: 21 }, // Home team wins
        keyEvents: [
          { quarter: 1, time: '12:34', type: 'touchdown', team: 'home' },
          { quarter: 2, time: '08:15', type: 'field_goal', team: 'away' },
          { quarter: 3, time: '05:42', type: 'touchdown', team: 'home' },
          { quarter: 4, time: '02:18', type: 'touchdown', team: 'away' }
        ]
      });

      mockProbabilityEngine.initializeGameProbabilities.mockResolvedValue({
        gameId: game.id,
        timestamp: new Date(),
        winProbability: { home: 0.55, away: 0.45 },
        spreadProbability: { spread: -3, probability: 0.52, confidence: 0.8 },
        totalProbability: { over: 0.48, under: 0.52, total: 47.5 },
        playerProps: []
      });

      mockProbabilityEngine.updateProbabilities.mockResolvedValue({
        gameId: game.id,
        timestamp: new Date(),
        winProbability: { home: 0.75, away: 0.25 }, // Strong prediction for home win
        spreadProbability: { spread: -3, probability: 0.82, confidence: 0.9 },
        totalProbability: { over: 0.65, under: 0.35, total: 47.5 }, // Over prediction
        playerProps: []
      });

      const result = await gameSimulationSuite.simulateCompleteGame(game, historicalData);

      // Validate accuracy metrics
      expect(result.accuracyMetrics.winPredictionAccuracy).toBeGreaterThan(0.7); // Should be high since home won
      expect(result.accuracyMetrics.spreadAccuracy).toBeDefined();
      expect(result.accuracyMetrics.totalAccuracy).toBeDefined();
      expect(result.accuracyMetrics.brierScore).toBeLessThan(0.5); // Should be good since prediction was correct
    });

    it('should handle system failures gracefully during simulation', async () => {
      const game = createMockGame('test-game-4');
      const historicalData = createMockHistoricalGameData(game);

      // Mock initial success
      mockProbabilityEngine.initializeGameProbabilities.mockResolvedValue({
        gameId: game.id,
        timestamp: new Date(),
        winProbability: { home: 0.55, away: 0.45 },
        spreadProbability: { spread: -3, probability: 0.52, confidence: 0.8 },
        totalProbability: { over: 0.48, under: 0.52, total: 47.5 },
        playerProps: []
      });

      // Mock failure during updates
      mockProbabilityEngine.updateProbabilities
        .mockResolvedValueOnce({
          gameId: game.id,
          timestamp: new Date(),
          winProbability: { home: 0.62, away: 0.38 },
          spreadProbability: { spread: -3, probability: 0.58, confidence: 0.8 },
          totalProbability: { over: 0.51, under: 0.49, total: 47.5 },
          playerProps: []
        })
        .mockRejectedValueOnce(new Error('ML Model Service Unavailable'))
        .mockResolvedValueOnce({
          gameId: game.id,
          timestamp: new Date(),
          winProbability: { home: 0.58, away: 0.42 }, // Fallback prediction
          spreadProbability: { spread: -3, probability: 0.55, confidence: 0.6 },
          totalProbability: { over: 0.49, under: 0.51, total: 47.5 },
          playerProps: []
        });

      const result = await gameSimulationSuite.simulateCompleteGame(game, historicalData);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('ML Model Service Unavailable');
      expect(result.recoveryActions).toHaveLength(1);
      expect(result.finalProbabilities).toBeDefined(); // Should still complete
    });
  });

  describe('Multi-Game Simulation', () => {
    it('should simulate multiple games concurrently', async () => {
      const games = [
        createMockGame('game-1'),
        createMockGame('game-2'),
        createMockGame('game-3')
      ];

      const historicalDataSet = games.map(game => createMockHistoricalGameData(game));

      mockProbabilityEngine.initializeGameProbabilities.mockResolvedValue({
        gameId: 'test',
        timestamp: new Date(),
        winProbability: { home: 0.55, away: 0.45 },
        spreadProbability: { spread: -3, probability: 0.52, confidence: 0.8 },
        totalProbability: { over: 0.48, under: 0.52, total: 47.5 },
        playerProps: []
      });

      mockProbabilityEngine.updateProbabilities.mockResolvedValue({
        gameId: 'test',
        timestamp: new Date(),
        winProbability: { home: 0.65, away: 0.35 },
        spreadProbability: { spread: -3, probability: 0.62, confidence: 0.85 },
        totalProbability: { over: 0.52, under: 0.48, total: 47.5 },
        playerProps: []
      });

      const results = await gameSimulationSuite.simulateMultipleGames(games, historicalDataSet);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.gameId)).toBe(true);
      expect(results.every(r => r.simulationSteps > 0)).toBe(true);

      // Verify concurrent execution performance
      const totalExecutionTime = Math.max(...results.map(r => r.performanceMetrics.totalExecutionTime));
      const sequentialTime = results.reduce((sum, r) => sum + r.performanceMetrics.totalExecutionTime, 0);
      expect(totalExecutionTime).toBeLessThan(sequentialTime * 0.8); // Should be faster than sequential
    });

    it('should handle mixed success/failure scenarios in batch simulation', async () => {
      const games = [
        createMockGame('success-game'),
        createMockGame('failure-game'),
        createMockGame('recovery-game')
      ];

      const historicalDataSet = games.map(game => createMockHistoricalGameData(game));

      // Mock different outcomes for each game
      mockProbabilityEngine.initializeGameProbabilities
        .mockResolvedValueOnce({ gameId: 'success-game', timestamp: new Date(), winProbability: { home: 0.55, away: 0.45 }, spreadProbability: { spread: -3, probability: 0.52, confidence: 0.8 }, totalProbability: { over: 0.48, under: 0.52, total: 47.5 }, playerProps: [] })
        .mockRejectedValueOnce(new Error('Database connection failed'))
        .mockResolvedValueOnce({ gameId: 'recovery-game', timestamp: new Date(), winProbability: { home: 0.60, away: 0.40 }, spreadProbability: { spread: -2, probability: 0.58, confidence: 0.75 }, totalProbability: { over: 0.45, under: 0.55, total: 44.5 }, playerProps: [] });

      mockProbabilityEngine.updateProbabilities.mockResolvedValue({
        gameId: 'test',
        timestamp: new Date(),
        winProbability: { home: 0.65, away: 0.35 },
        spreadProbability: { spread: -3, probability: 0.62, confidence: 0.85 },
        totalProbability: { over: 0.52, under: 0.48, total: 47.5 },
        playerProps: []
      });

      const results = await gameSimulationSuite.simulateMultipleGames(games, historicalDataSet);

      expect(results).toHaveLength(3);
      expect(results[0].errors).toHaveLength(0); // Success case
      expect(results[1].errors).toHaveLength(1); // Failure case
      expect(results[2].errors).toHaveLength(0); // Recovery case
    });
  });

  describe('Performance Validation', () => {
    it('should meet performance requirements for real-time updates', async () => {
      const game = createMockGame('performance-test');
      const historicalData = createMockHistoricalGameData(game);

      // Mock fast responses
      mockProbabilityEngine.initializeGameProbabilities.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
        return {
          gameId: game.id,
          timestamp: new Date(),
          winProbability: { home: 0.55, away: 0.45 },
          spreadProbability: { spread: -3, probability: 0.52, confidence: 0.8 },
          totalProbability: { over: 0.48, under: 0.52, total: 47.5 },
          playerProps: []
        };
      });

      mockProbabilityEngine.updateProbabilities.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 30)); // 30ms delay
        return {
          gameId: game.id,
          timestamp: new Date(),
          winProbability: { home: 0.65, away: 0.35 },
          spreadProbability: { spread: -3, probability: 0.62, confidence: 0.85 },
          totalProbability: { over: 0.52, under: 0.48, total: 47.5 },
          playerProps: []
        };
      });

      const result = await gameSimulationSuite.simulateCompleteGame(game, historicalData);

      // Validate performance requirements
      expect(result.performanceMetrics.averageUpdateTime).toBeLessThan(100); // < 100ms per update
      expect(result.performanceMetrics.totalExecutionTime).toBeLessThan(10000); // < 10 seconds total
      expect(result.performanceMetrics.memoryUsage).toBeLessThan(500 * 1024 * 1024); // < 500MB
    });

    it('should handle high-frequency updates without degradation', async () => {
      const game = createMockGame('high-frequency-test');
      const historicalData = createMockHistoricalGameDataWithHighFrequency(game, 100); // 100 updates

      mockProbabilityEngine.initializeGameProbabilities.mockResolvedValue({
        gameId: game.id,
        timestamp: new Date(),
        winProbability: { home: 0.55, away: 0.45 },
        spreadProbability: { spread: -3, probability: 0.52, confidence: 0.8 },
        totalProbability: { over: 0.48, under: 0.52, total: 47.5 },
        playerProps: []
      });

      mockProbabilityEngine.updateProbabilities.mockResolvedValue({
        gameId: game.id,
        timestamp: new Date(),
        winProbability: { home: 0.65, away: 0.35 },
        spreadProbability: { spread: -3, probability: 0.62, confidence: 0.85 },
        totalProbability: { over: 0.52, under: 0.48, total: 47.5 },
        playerProps: []
      });

      const result = await gameSimulationSuite.simulateCompleteGame(game, historicalData);

      expect(result.simulationSteps).toBe(100);
      
      // Performance should not degrade significantly with more updates
      const avgTimePerUpdate = result.performanceMetrics.totalExecutionTime / result.simulationSteps;
      expect(avgTimePerUpdate).toBeLessThan(50); // < 50ms per update on average
    });
  });

  describe('Data Integrity Validation', () => {
    it('should validate data consistency throughout simulation', async () => {
      const game = createMockGame('data-integrity-test');
      const historicalData = createMockHistoricalGameData(game);

      mockProbabilityEngine.initializeGameProbabilities.mockResolvedValue({
        gameId: game.id,
        timestamp: new Date(),
        winProbability: { home: 0.55, away: 0.45 },
        spreadProbability: { spread: -3, probability: 0.52, confidence: 0.8 },
        totalProbability: { over: 0.48, under: 0.52, total: 47.5 },
        playerProps: []
      });

      mockProbabilityEngine.updateProbabilities.mockResolvedValue({
        gameId: game.id,
        timestamp: new Date(),
        winProbability: { home: 0.65, away: 0.35 },
        spreadProbability: { spread: -3, probability: 0.62, confidence: 0.85 },
        totalProbability: { over: 0.52, under: 0.48, total: 47.5 },
        playerProps: []
      });

      const result = await gameSimulationSuite.simulateCompleteGame(game, historicalData);

      // Validate probability consistency
      result.probabilityHistory.forEach(prob => {
        expect(prob.winProbability.home + prob.winProbability.away).toBeCloseTo(1.0, 2);
        expect(prob.winProbability.home).toBeGreaterThanOrEqual(0);
        expect(prob.winProbability.home).toBeLessThanOrEqual(1);
        expect(prob.spreadProbability.confidence).toBeGreaterThanOrEqual(0);
        expect(prob.spreadProbability.confidence).toBeLessThanOrEqual(1);
      });

      expect(result.dataIntegrityChecks.probabilityConsistency).toBe(true);
      expect(result.dataIntegrityChecks.timestampSequence).toBe(true);
      expect(result.dataIntegrityChecks.gameStateProgression).toBe(true);
    });
  });
});

function createMockGame(id: string): Game {
  const homeTeam: Team = {
    id: `${id}-home`,
    name: 'Home Team',
    conference: 'Conference A',
    roster: [],
    coaching: {} as any,
    statistics: {} as any
  };

  const awayTeam: Team = {
    id: `${id}-away`,
    name: 'Away Team',
    conference: 'Conference B',
    roster: [],
    coaching: {} as any,
    statistics: {} as any
  };

  return {
    id,
    homeTeam,
    awayTeam,
    venue: { id: 'venue-1', name: 'Test Stadium' } as any,
    scheduledTime: new Date(),
    status: 'in_progress' as any,
    officials: []
  };
}

function createMockHistoricalGameData(game: Game, options?: any) {
  const defaultOptions = {
    finalScore: { home: 24, away: 17 },
    keyEvents: [
      { quarter: 1, time: '10:30', type: 'touchdown', team: 'home' },
      { quarter: 2, time: '05:15', type: 'field_goal', team: 'away' },
      { quarter: 3, time: '12:45', type: 'touchdown', team: 'away' },
      { quarter: 4, time: '03:22', type: 'field_goal', team: 'home' }
    ]
  };

  const opts = { ...defaultOptions, ...options };

  return {
    game,
    gameStates: opts.keyEvents.map((event: any, index: number) => ({
      timestamp: new Date(Date.now() + index * 900000), // 15 minutes apart
      gameState: {
        game,
        score: {
          home: Math.floor((index + 1) * opts.finalScore.home / opts.keyEvents.length),
          away: Math.floor((index + 1) * opts.finalScore.away / opts.keyEvents.length)
        },
        timeRemaining: {
          quarter: event.quarter,
          minutes: parseInt(event.time.split(':')[0]),
          seconds: parseInt(event.time.split(':')[1])
        },
        possession: game.homeTeam,
        fieldPosition: { yardLine: 25, side: 'home' },
        down: 1,
        yardsToGo: 10,
        momentum: { value: 0, trend: 'neutral' }
      },
      context: {
        quarter: event.quarter,
        timeRemaining: event.time,
        down: 1,
        yardsToGo: 10,
        fieldPosition: 25,
        possession: event.team,
        score: {
          home: Math.floor((index + 1) * opts.finalScore.home / opts.keyEvents.length),
          away: Math.floor((index + 1) * opts.finalScore.away / opts.keyEvents.length)
        }
      }
    })),
    finalOutcome: {
      homeScore: opts.finalScore.home,
      awayScore: opts.finalScore.away,
      winner: opts.finalScore.home > opts.finalScore.away ? 'home' : 'away',
      margin: Math.abs(opts.finalScore.home - opts.finalScore.away),
      totalPoints: opts.finalScore.home + opts.finalScore.away
    },
    metadata: {
      season: 2023,
      week: 1,
      gameType: 'regular_season' as any,
      venue: 'Test Stadium'
    }
  };
}

function createMockHistoricalGameDataWithHighFrequency(game: Game, updateCount: number) {
  const baseData = createMockHistoricalGameData(game);
  
  // Generate high-frequency updates
  const gameStates = Array.from({ length: updateCount }, (_, index) => ({
    timestamp: new Date(Date.now() + index * 30000), // 30 seconds apart
    gameState: {
      ...baseData.gameStates[0].gameState,
      score: {
        home: Math.floor((index + 1) * 24 / updateCount),
        away: Math.floor((index + 1) * 17 / updateCount)
      }
    },
    context: {
      ...baseData.gameStates[0].context,
      score: {
        home: Math.floor((index + 1) * 24 / updateCount),
        away: Math.floor((index + 1) * 17 / updateCount)
      }
    }
  }));

  return {
    ...baseData,
    gameStates
  };
}
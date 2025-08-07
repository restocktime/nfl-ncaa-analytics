import { ComprehensiveIntegrationTestSuite } from '../../testing/comprehensive-integration-test-suite';
import { DatabaseService } from '../../core/database-service';
import { RedisCache } from '../../core/redis-cache';
import { WebSocketService } from '../../api/websocket-service';
import { MLModelService } from '../../core/ml-model-service';
import { APIGateway } from '../../api/api-gateway';
import { ProbabilityEngine } from '../../types/common.types';
import { MonteCarloService } from '../../core/monte-carlo-service';
import { BacktestingService } from '../../core/backtesting-service';

// Mock all dependencies
jest.mock('../../core/database-service');
jest.mock('../../core/redis-cache');
jest.mock('../../api/websocket-service');
jest.mock('../../core/ml-model-service');
jest.mock('../../api/api-gateway');
jest.mock('../../core/monte-carlo-service');
jest.mock('../../core/backtesting-service');
jest.mock('../../core/logger');

describe('Comprehensive Integration Tests', () => {
  let integrationSuite: ComprehensiveIntegrationTestSuite;
  let mockServices: any;

  beforeEach(() => {
    mockServices = {
      databaseService: new DatabaseService({} as any) as jest.Mocked<DatabaseService>,
      redisCache: new RedisCache({} as any) as jest.Mocked<RedisCache>,
      webSocketService: new WebSocketService({} as any, {} as any) as jest.Mocked<WebSocketService>,
      mlModelService: new MLModelService({} as any, {} as any) as jest.Mocked<MLModelService>,
      apiGateway: new APIGateway({} as any, {} as any, {} as any) as jest.Mocked<APIGateway>,
      monteCarloService: new MonteCarloService({} as any, {} as any, {} as any) as jest.Mocked<MonteCarloService>,
      backtestingService: new BacktestingService({} as any, {} as any) as jest.Mocked<BacktestingService>,
      probabilityEngine: {
        initializeGameProbabilities: jest.fn(),
        updateProbabilities: jest.fn(),
        calculateWinProbability: jest.fn(),
        calculateSpreadProbability: jest.fn()
      } as jest.Mocked<ProbabilityEngine>
    };

    integrationSuite = new ComprehensiveIntegrationTestSuite(mockServices);
  });

  describe('End-to-End Game Prediction Flow', () => {
    it('should handle complete game prediction workflow', async () => {
      // Mock game data
      const gameData = {
        id: 'test-game-1',
        homeTeam: { id: 'team1', name: 'Home Team' },
        awayTeam: { id: 'team2', name: 'Away Team' },
        scheduledTime: new Date(),
        status: 'scheduled'
      };

      // Mock database responses
      mockServices.databaseService.query.mockResolvedValue([gameData]);
      mockServices.databaseService.findGameById.mockResolvedValue(gameData);

      // Mock cache responses
      mockServices.redisCache.get.mockResolvedValue(null); // Cache miss
      mockServices.redisCache.set.mockResolvedValue();

      // Mock ML model predictions
      mockServices.mlModelService.predict.mockResolvedValue({
        prediction: 0.65,
        confidence: 0.85,
        features: ['team_strength', 'recent_form', 'head_to_head']
      });

      // Mock probability engine
      mockServices.probabilityEngine.initializeGameProbabilities.mockResolvedValue({
        gameId: gameData.id,
        timestamp: new Date(),
        winProbability: { home: 0.65, away: 0.35 },
        spreadProbability: { spread: -3.5, probability: 0.58, confidence: 0.85 },
        totalProbability: { over: 0.52, under: 0.48, total: 47.5 },
        playerProps: []
      });

      // Mock Monte Carlo simulation
      mockServices.monteCarloService.runSimulation.mockResolvedValue({
        scenarioId: 'scenario-1',
        iterations: 10000,
        outcomes: {
          homeWins: 6500,
          awayWins: 3500,
          averageHomeScore: 24.3,
          averageAwayScore: 20.1
        },
        confidenceInterval: { lower: 0.62, upper: 0.68 },
        keyFactors: [
          { factor: 'home_field_advantage', impact: 0.08 },
          { factor: 'weather_conditions', impact: 0.03 }
        ],
        executionTime: 2500
      });

      // Mock WebSocket broadcast
      mockServices.webSocketService.broadcastProbabilityUpdate.mockResolvedValue();

      // Mock API Gateway response
      mockServices.apiGateway.handleRequest.mockResolvedValue({
        statusCode: 200,
        body: { success: true },
        headers: {}
      });

      const result = await integrationSuite.testCompleteGamePredictionFlow({
        gameId: gameData.id,
        includeMonteCarloSimulation: true,
        broadcastUpdates: true,
        cacheResults: true
      });

      expect(result.success).toBe(true);
      expect(result.predictionGenerated).toBe(true);
      expect(result.simulationCompleted).toBe(true);
      expect(result.updatesBroadcast).toBe(true);
      expect(result.resultsCached).toBe(true);
      expect(result.executionTime).toBeLessThan(5000); // < 5 seconds
      expect(result.dataConsistency).toBe(true);

      // Verify service interactions
      expect(mockServices.databaseService.findGameById).toHaveBeenCalledWith(gameData.id);
      expect(mockServices.mlModelService.predict).toHaveBeenCalled();
      expect(mockServices.probabilityEngine.initializeGameProbabilities).toHaveBeenCalled();
      expect(mockServices.monteCarloService.runSimulation).toHaveBeenCalled();
      expect(mockServices.webSocketService.broadcastProbabilityUpdate).toHaveBeenCalled();
      expect(mockServices.redisCache.set).toHaveBeenCalled();
    });

    it('should handle real-time game updates', async () => {
      const gameId = 'live-game-1';
      const gameEvents = [
        { type: 'touchdown', team: 'home', quarter: 1, time: '12:34' },
        { type: 'field_goal', team: 'away', quarter: 2, time: '08:15' },
        { type: 'touchdown', team: 'home', quarter: 3, time: '05:42' }
      ];

      // Mock real-time updates
      mockServices.probabilityEngine.updateProbabilities.mockImplementation(async (event) => ({
        gameId,
        timestamp: new Date(),
        winProbability: { 
          home: event.team === 'home' ? 0.75 : 0.45, 
          away: event.team === 'home' ? 0.25 : 0.55 
        },
        spreadProbability: { spread: -3.5, probability: 0.68, confidence: 0.9 },
        totalProbability: { over: 0.58, under: 0.42, total: 47.5 },
        playerProps: []
      }));

      mockServices.webSocketService.broadcastProbabilityUpdate.mockResolvedValue();
      mockServices.redisCache.set.mockResolvedValue();

      const result = await integrationSuite.testRealTimeGameUpdates({
        gameId,
        events: gameEvents,
        updateFrequency: 1000 // 1 second
      });

      expect(result.success).toBe(true);
      expect(result.eventsProcessed).toBe(gameEvents.length);
      expect(result.probabilityUpdates).toBe(gameEvents.length);
      expect(result.broadcastsSent).toBe(gameEvents.length);
      expect(result.averageUpdateTime).toBeLessThan(100); // < 100ms per update
      expect(result.dataConsistency).toBe(true);

      // Verify update frequency
      expect(mockServices.probabilityEngine.updateProbabilities).toHaveBeenCalledTimes(gameEvents.length);
      expect(mockServices.webSocketService.broadcastProbabilityUpdate).toHaveBeenCalledTimes(gameEvents.length);
    });

    it('should handle concurrent game processing', async () => {
      const gameIds = ['game-1', 'game-2', 'game-3', 'game-4', 'game-5'];
      
      // Mock concurrent processing
      mockServices.databaseService.findGameById.mockImplementation(async (id) => ({
        id,
        homeTeam: { id: `${id}-home`, name: 'Home Team' },
        awayTeam: { id: `${id}-away`, name: 'Away Team' },
        scheduledTime: new Date(),
        status: 'in_progress'
      }));

      mockServices.mlModelService.predict.mockResolvedValue({
        prediction: 0.6,
        confidence: 0.8,
        features: []
      });

      mockServices.probabilityEngine.initializeGameProbabilities.mockImplementation(async (game) => ({
        gameId: game.id,
        timestamp: new Date(),
        winProbability: { home: 0.6, away: 0.4 },
        spreadProbability: { spread: -2.5, probability: 0.55, confidence: 0.8 },
        totalProbability: { over: 0.5, under: 0.5, total: 45 },
        playerProps: []
      }));

      const result = await integrationSuite.testConcurrentGameProcessing({
        gameIds,
        maxConcurrency: 3,
        timeoutPerGame: 5000
      });

      expect(result.success).toBe(true);
      expect(result.gamesProcessed).toBe(gameIds.length);
      expect(result.successfulGames).toBe(gameIds.length);
      expect(result.failedGames).toBe(0);
      expect(result.averageProcessingTime).toBeLessThan(3000); // < 3 seconds per game
      expect(result.concurrencyEfficiency).toBeGreaterThan(0.7); // > 70% efficiency

      // Verify all games were processed
      expect(mockServices.databaseService.findGameById).toHaveBeenCalledTimes(gameIds.length);
      expect(mockServices.mlModelService.predict).toHaveBeenCalledTimes(gameIds.length);
    });
  });

  describe('Data Flow and Consistency Tests', () => {
    it('should maintain data consistency across all services', async () => {
      const testData = {
        gameId: 'consistency-test-game',
        initialProbabilities: { home: 0.55, away: 0.45 },
        updates: [
          { event: 'touchdown', newProbabilities: { home: 0.68, away: 0.32 } },
          { event: 'interception', newProbabilities: { home: 0.52, away: 0.48 } }
        ]
      };

      // Mock consistent data across services
      mockServices.databaseService.query.mockResolvedValue([{
        id: testData.gameId,
        probabilities: testData.initialProbabilities
      }]);

      mockServices.redisCache.get.mockResolvedValue(JSON.stringify({
        gameId: testData.gameId,
        probabilities: testData.initialProbabilities,
        timestamp: new Date()
      }));

      mockServices.redisCache.set.mockResolvedValue();

      const result = await integrationSuite.testDataConsistency({
        gameId: testData.gameId,
        testScenarios: ['cache_db_sync', 'real_time_updates', 'concurrent_access'],
        consistencyLevel: 'strong'
      });

      expect(result.success).toBe(true);
      expect(result.consistencyViolations).toBe(0);
      expect(result.dataIntegrityScore).toBeGreaterThan(0.95);
      expect(result.synchronizationDelays).toBeLessThan(100); // < 100ms sync delay
      expect(result.conflictResolutions).toBe(0);
    });

    it('should handle data validation across service boundaries', async () => {
      const invalidData = {
        gameId: 'invalid-game',
        probabilities: { home: 1.2, away: -0.2 }, // Invalid probabilities
        predictions: { confidence: 1.5 } // Invalid confidence
      };

      // Mock validation responses
      mockServices.databaseService.query.mockRejectedValue(new Error('Invalid probability values'));
      mockServices.mlModelService.predict.mockRejectedValue(new Error('Invalid input features'));

      const result = await integrationSuite.testDataValidation({
        testCases: [
          { type: 'invalid_probabilities', data: invalidData },
          { type: 'missing_required_fields', data: { gameId: null } },
          { type: 'out_of_range_values', data: { confidence: 2.0 } }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.validationErrors).toBeGreaterThan(0);
      expect(result.errorHandling).toBe('graceful');
      expect(result.systemStability).toBe(true);
      expect(result.dataCorruption).toBe(false);
    });

    it('should handle transaction rollbacks correctly', async () => {
      const transactionData = {
        gameId: 'transaction-test',
        operations: [
          { type: 'update_probabilities', data: { home: 0.7, away: 0.3 } },
          { type: 'cache_results', data: { ttl: 3600 } },
          { type: 'broadcast_update', data: { subscribers: 1000 } }
        ]
      };

      // Mock transaction failure on third operation
      mockServices.databaseService.query.mockResolvedValueOnce([{ success: true }]);
      mockServices.redisCache.set.mockResolvedValueOnce();
      mockServices.webSocketService.broadcastProbabilityUpdate.mockRejectedValueOnce(new Error('Broadcast failed'));

      const result = await integrationSuite.testTransactionRollback({
        transactionId: 'tx-001',
        operations: transactionData.operations,
        rollbackStrategy: 'compensating_actions'
      });

      expect(result.success).toBe(true);
      expect(result.rollbackTriggered).toBe(true);
      expect(result.rollbackSuccessful).toBe(true);
      expect(result.dataConsistency).toBe(true);
      expect(result.partialUpdates).toBe(false);
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle high-throughput prediction requests', async () => {
      const throughputConfig = {
        requestsPerSecond: 1000,
        testDuration: 60000, // 1 minute
        concurrentConnections: 100
      };

      // Mock high-performance responses
      mockServices.mlModelService.predict.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5)); // 5-15ms
        return { prediction: Math.random(), confidence: 0.8, features: [] };
      });

      mockServices.probabilityEngine.calculateWinProbability.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5 + 2)); // 2-7ms
        return Math.random();
      });

      const result = await integrationSuite.testHighThroughputPredictions(throughputConfig);

      expect(result.success).toBe(true);
      expect(result.totalRequests).toBeGreaterThan(50000); // Should handle high volume
      expect(result.averageResponseTime).toBeLessThan(50); // < 50ms average
      expect(result.p95ResponseTime).toBeLessThan(100); // < 100ms 95th percentile
      expect(result.errorRate).toBeLessThan(0.01); // < 1% error rate
      expect(result.throughputAchieved).toBeGreaterThan(800); // > 800 RPS
    });

    it('should scale horizontally under load', async () => {
      const scalingConfig = {
        initialInstances: 2,
        maxInstances: 8,
        loadIncrement: 500, // RPS increment
        scalingThreshold: 0.8 // 80% resource utilization
      };

      const result = await integrationSuite.testHorizontalScaling(scalingConfig);

      expect(result.success).toBe(true);
      expect(result.scalingTriggered).toBe(true);
      expect(result.maxInstancesReached).toBeGreaterThan(scalingConfig.initialInstances);
      expect(result.scalingEfficiency).toBeGreaterThan(0.7); // > 70% efficiency
      expect(result.performanceConsistency).toBeGreaterThan(0.8); // > 80% consistency
      expect(result.resourceUtilization).toBeLessThan(0.9); // < 90% utilization
    });

    it('should handle memory-intensive operations', async () => {
      const memoryConfig = {
        simulationSize: 100000, // Large Monte Carlo simulation
        concurrentSimulations: 5,
        memoryLimit: 2048 // 2GB limit
      };

      // Mock memory-intensive operations
      mockServices.monteCarloService.runSimulation.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second simulation
        return {
          scenarioId: 'large-sim',
          iterations: memoryConfig.simulationSize,
          outcomes: { homeWins: 55000, awayWins: 45000 },
          confidenceInterval: { lower: 0.52, upper: 0.58 },
          keyFactors: [],
          executionTime: 5000
        };
      });

      const result = await integrationSuite.testMemoryIntensiveOperations(memoryConfig);

      expect(result.success).toBe(true);
      expect(result.simulationsCompleted).toBe(memoryConfig.concurrentSimulations);
      expect(result.memoryUsage).toBeLessThan(memoryConfig.memoryLimit);
      expect(result.memoryLeaks).toBe(false);
      expect(result.garbageCollectionImpact).toBeLessThan(0.1); // < 10% GC impact
    });
  });

  describe('Error Handling and Recovery Tests', () => {
    it('should handle cascading service failures gracefully', async () => {
      const failureScenario = {
        initialFailure: 'database_connection_lost',
        cascadeServices: ['cache', 'ml_model', 'websocket'],
        recoveryStrategy: 'circuit_breaker_with_fallback'
      };

      // Mock cascading failures
      mockServices.databaseService.query.mockRejectedValue(new Error('Connection lost'));
      mockServices.redisCache.get.mockRejectedValue(new Error('Cache unavailable'));
      mockServices.mlModelService.predict.mockRejectedValue(new Error('Model service down'));

      const result = await integrationSuite.testCascadingFailureRecovery(failureScenario);

      expect(result.success).toBe(true);
      expect(result.cascadeContained).toBe(true);
      expect(result.fallbacksActivated).toBeGreaterThan(0);
      expect(result.systemAvailability).toBeGreaterThan(0.5); // > 50% availability maintained
      expect(result.recoveryTime).toBeLessThan(30000); // < 30 seconds recovery
      expect(result.dataLoss).toBe(false);
    });

    it('should recover from partial system failures', async () => {
      const partialFailureConfig = {
        affectedServices: ['ml_model', 'cache'],
        healthyServices: ['database', 'websocket', 'api_gateway'],
        degradationLevel: 'moderate'
      };

      // Mock partial failures
      mockServices.mlModelService.predict.mockRejectedValue(new Error('Service unavailable'));
      mockServices.redisCache.get.mockRejectedValue(new Error('Cache miss'));
      
      // Mock healthy services
      mockServices.databaseService.query.mockResolvedValue([{ id: 1, data: 'success' }]);
      mockServices.webSocketService.broadcastProbabilityUpdate.mockResolvedValue();

      const result = await integrationSuite.testPartialSystemFailureRecovery(partialFailureConfig);

      expect(result.success).toBe(true);
      expect(result.healthyServicesOperational).toBe(true);
      expect(result.degradedFunctionality).toContain('ml_predictions');
      expect(result.coreSystemOperational).toBe(true);
      expect(result.userImpact).toBe('moderate');
      expect(result.automaticRecovery).toBe(true);
    });

    it('should handle timeout scenarios correctly', async () => {
      const timeoutConfig = {
        services: ['database', 'ml_model', 'monte_carlo'],
        timeoutThresholds: { database: 5000, ml_model: 3000, monte_carlo: 10000 },
        retryStrategies: { database: 'exponential_backoff', ml_model: 'linear_backoff' }
      };

      // Mock timeout scenarios
      mockServices.databaseService.query.mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 6000))
      );
      
      mockServices.mlModelService.predict.mockImplementation(() =>
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000))
      );

      const result = await integrationSuite.testTimeoutHandling(timeoutConfig);

      expect(result.success).toBe(true);
      expect(result.timeoutsDetected).toBeGreaterThan(0);
      expect(result.retryAttemptsSuccessful).toBeGreaterThan(0);
      expect(result.circuitBreakersTriggered).toBeGreaterThan(0);
      expect(result.fallbacksActivated).toBeGreaterThan(0);
      expect(result.systemStability).toBe(true);
    });
  });

  describe('Security and Authentication Tests', () => {
    it('should enforce authentication across all endpoints', async () => {
      const authTestConfig = {
        endpoints: ['/api/predictions', '/api/games', '/api/probabilities'],
        authMethods: ['jwt', 'api_key'],
        unauthorizedAttempts: 10
      };

      // Mock authentication responses
      mockServices.apiGateway.handleRequest.mockImplementation(async (req) => {
        if (!req.headers.authorization) {
          return { statusCode: 401, body: { error: 'Unauthorized' }, headers: {} };
        }
        return { statusCode: 200, body: { success: true }, headers: {} };
      });

      const result = await integrationSuite.testAuthenticationEnforcement(authTestConfig);

      expect(result.success).toBe(true);
      expect(result.unauthorizedRequestsBlocked).toBe(authTestConfig.unauthorizedAttempts);
      expect(result.authorizedRequestsAllowed).toBeGreaterThan(0);
      expect(result.authenticationBypass).toBe(false);
      expect(result.securityViolations).toBe(0);
    });

    it('should handle rate limiting correctly', async () => {
      const rateLimitConfig = {
        requestsPerMinute: 100,
        burstLimit: 20,
        testDuration: 60000,
        exceedLimitBy: 50 // 150% of limit
      };

      // Mock rate limiting
      let requestCount = 0;
      mockServices.apiGateway.handleRequest.mockImplementation(async () => {
        requestCount++;
        if (requestCount > rateLimitConfig.requestsPerMinute) {
          return { statusCode: 429, body: { error: 'Rate limit exceeded' }, headers: {} };
        }
        return { statusCode: 200, body: { success: true }, headers: {} };
      });

      const result = await integrationSuite.testRateLimiting(rateLimitConfig);

      expect(result.success).toBe(true);
      expect(result.rateLimitEnforced).toBe(true);
      expect(result.excessRequestsBlocked).toBeGreaterThan(0);
      expect(result.legitimateRequestsAllowed).toBe(rateLimitConfig.requestsPerMinute);
      expect(result.systemProtected).toBe(true);
    });
  });

  describe('Monitoring and Observability Tests', () => {
    it('should generate comprehensive metrics', async () => {
      const metricsConfig = {
        metricsTypes: ['performance', 'business', 'system', 'security'],
        collectionInterval: 1000, // 1 second
        testDuration: 30000 // 30 seconds
      };

      const result = await integrationSuite.testMetricsGeneration(metricsConfig);

      expect(result.success).toBe(true);
      expect(result.metricsCollected).toBeGreaterThan(0);
      expect(result.metricsTypes).toEqual(expect.arrayContaining(metricsConfig.metricsTypes));
      expect(result.metricsAccuracy).toBeGreaterThan(0.95); // > 95% accuracy
      expect(result.collectionLatency).toBeLessThan(100); // < 100ms collection latency
    });

    it('should provide distributed tracing', async () => {
      const tracingConfig = {
        traceComplexWorkflow: true,
        includeExternalCalls: true,
        samplingRate: 1.0 // 100% sampling for test
      };

      const result = await integrationSuite.testDistributedTracing(tracingConfig);

      expect(result.success).toBe(true);
      expect(result.tracesGenerated).toBeGreaterThan(0);
      expect(result.spansCaptured).toBeGreaterThan(0);
      expect(result.traceCompleteness).toBeGreaterThan(0.9); // > 90% complete traces
      expect(result.tracingOverhead).toBeLessThan(0.05); // < 5% overhead
    });
  });
});

// Helper function to extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}

expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});
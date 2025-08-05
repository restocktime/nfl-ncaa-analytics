import 'reflect-metadata';
import { MonteCarloService } from '../../core/monte-carlo-service';
import { SimulationScenarioBuilder } from '../../core/simulation-scenario-builder';
import { Logger } from '../../core/logger';
import { GameState } from '../../models/GameState';
import { Game } from '../../models/Game';
import { Team } from '../../models/Team';
import { GameStatus, GameType } from '../../types/common.types';
import { 
  SimulationScenario, 
  BatchPriority,
  DistributionType,
  VariableType,
  ConstraintType
} from '../../types/simulation.types';

// Mock worker threads
jest.mock('worker_threads', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    postMessage: jest.fn(),
    terminate: jest.fn().mockResolvedValue(undefined),
    once: jest.fn(),
    on: jest.fn()
  }))
}));

describe('MonteCarloService', () => {
  let service: MonteCarloService;
  let mockLogger: jest.Mocked<Logger>;
  let mockGameState: GameState;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    // Create mock game state
    const mockGame = new Game({
      id: 'game-1',
      homeTeam: new Team({ id: 'team-1', name: 'Home Team' }),
      awayTeam: new Team({ id: 'team-2', name: 'Away Team' }),
      venue: { 
        id: 'venue-1', 
        name: 'Test Stadium',
        city: 'Test City',
        state: 'TS',
        capacity: 50000,
        surface: 'grass',
        indoor: false,
        timezone: 'America/New_York'
      },
      scheduledTime: new Date(),
      status: GameStatus.IN_PROGRESS,
      season: 2024,
      week: 1,
      gameType: GameType.REGULAR_SEASON,
      officials: []
    });

    mockGameState = new GameState({
      game: mockGame,
      score: { home: 14, away: 10 },
      timeRemaining: { quarter: 3, minutes: 8, seconds: 30, overtime: false },
      possession: mockGame.homeTeam,
      fieldPosition: { side: 'home', yardLine: 35 },
      down: 2,
      yardsToGo: 7,
      momentum: { value: 0.2, trend: 'increasing', lastUpdated: new Date() },
      drives: [],
      penalties: [],
      timeouts: { home: 2, away: 3 }
    });

    service = new MonteCarloService(mockLogger, 2);
  });

  afterEach(async () => {
    await service.cleanup();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(service).toBeInstanceOf(MonteCarloService);
      expect(service.getActiveJobCount()).toBe(0);
    });

    it('should initialize with custom configuration', () => {
      const customService = new MonteCarloService(mockLogger, 4, {
        maxIterations: 5000,
        convergenceThreshold: 0.005
      });
      
      expect(customService).toBeInstanceOf(MonteCarloService);
    });
  });

  describe('runSimulation', () => {
    let scenario: SimulationScenario;

    beforeEach(() => {
      scenario = SimulationScenarioBuilder
        .createFootballGameScenario(mockGameState, 1000)
        .build();
    });

    it('should run a basic simulation successfully', async () => {
      // Mock worker response
      const mockWorker = require('worker_threads').Worker;
      const workerInstance = new mockWorker();
      
      workerInstance.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'message') {
          setTimeout(() => {
            callback({
              taskId: 'task-1',
              scenarioId: scenario.id,
              iterations: 500,
              outcomes: Array.from({ length: 500 }, () => Math.random()),
              factors: {
                offensive_efficiency: 0.6,
                defensive_efficiency: 0.4,
                momentum: 0.2
              },
              executionTime: 100
            });
          }, 10);
        }
      });

      const result = await service.runSimulation(scenario);

      expect(result).toBeDefined();
      expect(result.scenarioId).toBe(scenario.id);
      expect(result.iterations).toBeGreaterThan(0);
      expect(result.outcomes).toBeDefined();
      expect(result.confidenceInterval).toBeDefined();
      expect(result.keyFactors).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
    }, 10000);

    it('should validate scenario before running', async () => {
      const invalidScenario = { ...scenario, iterations: 0 };

      await expect(service.runSimulation(invalidScenario as SimulationScenario))
        .rejects.toThrow('Iterations must be at least 1');
    });

    it('should handle worker errors gracefully', async () => {
      const mockWorker = require('worker_threads').Worker;
      const workerInstance = new mockWorker();
      
      workerInstance.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Worker failed')), 10);
        }
      });

      await expect(service.runSimulation(scenario))
        .rejects.toThrow();
    });

    it('should track simulation progress', async () => {
      const mockWorker = require('worker_threads').Worker;
      const workerInstance = new mockWorker();
      
      // Start simulation without waiting
      const simulationPromise = service.runSimulation(scenario);
      
      // Check progress is tracked
      const progress = service.getSimulationProgress(scenario.id);
      expect(progress).toBeDefined();
      expect(progress?.scenarioId).toBe(scenario.id);

      // Mock completion
      workerInstance.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'message') {
          setTimeout(() => {
            callback({
              taskId: 'task-1',
              scenarioId: scenario.id,
              iterations: 1000,
              outcomes: Array.from({ length: 1000 }, () => Math.random()),
              factors: { test: 0.5 },
              executionTime: 100
            });
          }, 10);
        }
      });

      await simulationPromise;
      
      // Progress should be cleared after completion
      expect(service.getSimulationProgress(scenario.id)).toBeUndefined();
    });
  });

  describe('runBatchSimulations', () => {
    let scenarios: SimulationScenario[];

    beforeEach(() => {
      scenarios = [
        SimulationScenarioBuilder.createFootballGameScenario(mockGameState, 500).build(),
        SimulationScenarioBuilder.createRedZoneScenario(mockGameState, 300).build(),
        SimulationScenarioBuilder.createTwoMinuteDrillScenario(mockGameState, 400).build()
      ];
    });

    it('should run multiple simulations in batch', async () => {
      // Mock worker responses for all scenarios
      const mockWorker = require('worker_threads').Worker;
      const workerInstance = new mockWorker();
      
      let callCount = 0;
      workerInstance.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'message') {
          setTimeout(() => {
            const scenario = scenarios[callCount % scenarios.length];
            callback({
              taskId: `task-${callCount}`,
              scenarioId: scenario.id,
              iterations: scenario.iterations,
              outcomes: Array.from({ length: scenario.iterations }, () => Math.random()),
              factors: { test: 0.5 },
              executionTime: 50
            });
            callCount++;
          }, 10);
        }
      });

      const results = await service.runBatchSimulations(scenarios, {}, BatchPriority.NORMAL);

      expect(results).toHaveLength(scenarios.length);
      expect(results.every(r => r.iterations > 0)).toBe(true);
    }, 15000);

    it('should handle empty batch', async () => {
      const results = await service.runBatchSimulations([]);
      expect(results).toHaveLength(0);
    });

    it('should prioritize scenarios correctly', async () => {
      // Scenarios should be sorted by iteration count (complexity)
      const sortedScenarios = scenarios.sort((a, b) => a.iterations - b.iterations);
      
      const mockWorker = require('worker_threads').Worker;
      const workerInstance = new mockWorker();
      
      const executionOrder: string[] = [];
      workerInstance.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'message') {
          setTimeout(() => {
            // Track execution order by capturing scenario IDs
            const taskData = workerInstance.postMessage.mock.calls[executionOrder.length]?.[0];
            if (taskData) {
              executionOrder.push(taskData.scenarioId);
            }
            
            callback({
              taskId: `task-${executionOrder.length}`,
              scenarioId: sortedScenarios[executionOrder.length - 1]?.id || 'unknown',
              iterations: 100,
              outcomes: [0.5],
              factors: {},
              executionTime: 10
            });
          }, 10);
        }
      });

      await service.runBatchSimulations(scenarios);
      
      // Verify scenarios were executed in order of increasing complexity
      expect(executionOrder[0]).toBe(sortedScenarios[0].id);
    });
  });

  describe('cancelSimulation', () => {
    it('should cancel a running simulation', async () => {
      const scenario = SimulationScenarioBuilder
        .createFootballGameScenario(mockGameState, 1000)
        .build();

      // Start simulation
      const simulationPromise = service.runSimulation(scenario);
      
      // Verify it's tracked
      expect(service.getSimulationProgress(scenario.id)).toBeDefined();
      
      // Cancel it
      const cancelled = await service.cancelSimulation(scenario.id);
      expect(cancelled).toBe(true);
      
      // Verify it's no longer tracked
      expect(service.getSimulationProgress(scenario.id)).toBeUndefined();
    });

    it('should return false for non-existent simulation', async () => {
      const cancelled = await service.cancelSimulation('non-existent');
      expect(cancelled).toBe(false);
    });
  });

  describe('progress tracking', () => {
    it('should emit progress events', (done) => {
      const scenario = SimulationScenarioBuilder
        .createFootballGameScenario(mockGameState, 1000)
        .build();

      service.onProgress((progress) => {
        expect(progress.scenarioId).toBe(scenario.id);
        expect(progress.completedIterations).toBeGreaterThanOrEqual(0);
        expect(progress.totalIterations).toBe(1000);
        done();
      });

      // Mock worker to emit progress
      const mockWorker = require('worker_threads').Worker;
      const workerInstance = new mockWorker();
      
      workerInstance.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'message') {
          setTimeout(() => {
            callback({
              taskId: 'task-1',
              scenarioId: scenario.id,
              iterations: 500,
              outcomes: Array.from({ length: 500 }, () => Math.random()),
              factors: {},
              executionTime: 100
            });
          }, 10);
        }
      });

      service.runSimulation(scenario);
    });
  });

  describe('performance requirements', () => {
    it('should complete 1000+ iterations within SLA', async () => {
      const scenario = SimulationScenarioBuilder
        .createFootballGameScenario(mockGameState, 1000)
        .build();

      const mockWorker = require('worker_threads').Worker;
      const workerInstance = new mockWorker();
      
      workerInstance.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'message') {
          setTimeout(() => {
            callback({
              taskId: 'task-1',
              scenarioId: scenario.id,
              iterations: 1000,
              outcomes: Array.from({ length: 1000 }, () => Math.random()),
              factors: {},
              executionTime: 2000 // 2 seconds
            });
          }, 10);
        }
      });

      const startTime = Date.now();
      const result = await service.runSimulation(scenario);
      const totalTime = Date.now() - startTime;

      expect(result.iterations).toBeGreaterThanOrEqual(1000);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle high iteration counts efficiently', async () => {
      const scenario = SimulationScenarioBuilder
        .createFootballGameScenario(mockGameState, 10000)
        .build();

      const mockWorker = require('worker_threads').Worker;
      const workerInstance = new mockWorker();
      
      workerInstance.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'message') {
          setTimeout(() => {
            callback({
              taskId: 'task-1',
              scenarioId: scenario.id,
              iterations: 10000,
              outcomes: Array.from({ length: 10000 }, () => Math.random()),
              factors: {},
              executionTime: 5000
            });
          }, 10);
        }
      });

      const result = await service.runSimulation(scenario);
      
      expect(result.iterations).toBe(10000);
      expect(result.getSimulationEfficiency()).toBeGreaterThan(0); // Should have positive efficiency
    });
  });

  describe('error handling', () => {
    it('should handle invalid scenario gracefully', async () => {
      const invalidScenario = {
        id: '',
        gameState: mockGameState,
        iterations: -1,
        variables: [],
        constraints: []
      } as SimulationScenario;

      await expect(service.runSimulation(invalidScenario))
        .rejects.toThrow();
    });

    it('should handle worker timeout', async () => {
      const scenario = SimulationScenarioBuilder
        .createFootballGameScenario(mockGameState, 1000)
        .build();

      const mockWorker = require('worker_threads').Worker;
      const workerInstance = new mockWorker();
      
      // Don't respond to simulate timeout
      workerInstance.once.mockImplementation(() => {
        // No response
      });

      await expect(service.runSimulation(scenario, { timeoutMs: 100 }))
        .rejects.toThrow('timed out');
    });

    it('should cleanup resources on error', async () => {
      const scenario = SimulationScenarioBuilder
        .createFootballGameScenario(mockGameState, 1000)
        .build();

      const mockWorker = require('worker_threads').Worker;
      const workerInstance = new mockWorker();
      
      workerInstance.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Worker error')), 10);
        }
      });

      try {
        await service.runSimulation(scenario);
      } catch (error) {
        // Error expected
      }

      // Should not have active jobs after error
      expect(service.getActiveJobCount()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should cleanup all resources', async () => {
      const scenario = SimulationScenarioBuilder
        .createFootballGameScenario(mockGameState, 1000)
        .build();

      // Start a simulation
      service.runSimulation(scenario).catch(() => {}); // Ignore errors
      
      expect(service.getActiveJobCount()).toBeGreaterThan(0);

      await service.cleanup();

      expect(service.getActiveJobCount()).toBe(0);
    });
  });
});
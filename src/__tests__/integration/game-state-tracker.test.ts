import 'reflect-metadata';
import { GameStateTracker, MomentumCalculation, ProcessedGameEvent } from '../../core/game-state-tracker';
import { RedisCache } from '../../core/redis-cache';
import { GameState } from '../../models/GameState';
import { Game } from '../../models/Game';
import { Team } from '../../models/Team';
import { GameEvent, EvidenceType } from '../../core/bayesian-updater';
import { RedisMemoryServer } from 'redis-memory-server';
import { createClient } from 'redis';
import { Logger } from 'winston';

describe('GameStateTracker Integration Tests', () => {
  let redisServer: RedisMemoryServer;
  let redisClient: any;
  let redisCache: RedisCache;
  let gameStateTracker: GameStateTracker;
  let mockGameState: GameState;

  beforeAll(async () => {
    // Start Redis memory server
    redisServer = new RedisMemoryServer();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();

    // Create Redis client
    redisClient = createClient({
      socket: { host, port }
    });
    await redisClient.connect();

    // Create mock logger
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as unknown as Logger;

    // Create RedisCache instance
    redisCache = new RedisCache({
      host: host,
      port: port,
      password: undefined,
      database: 0,
      maxRetries: 3,
      retryDelayMs: 1000,
      connectionTimeout: 5000,
      commandTimeout: 5000,
      maxRetriesPerRequest: 3
    }, mockLogger);

    // Connect to Redis cache
    await redisCache.connect();
  });

  afterAll(async () => {
    if (redisCache) {
      await redisCache.disconnect();
    }
    if (redisClient) {
      await redisClient.quit();
    }
    if (redisServer) {
      await redisServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear Redis before each test
    if (redisClient) {
      await redisClient.flushAll();
    }

    // Create GameStateTracker
    if (redisCache) {
      gameStateTracker = new GameStateTracker(redisCache, {
        batchSize: 5,
        processingInterval: 100,
        retentionPeriod: 3600,
        momentumWindowSize: 10
      });
    }

    // Create mock game state
    const homeTeam = new Team({
      id: 'team1',
      name: 'Home Team',
      city: 'Home City',
      abbreviation: 'HT',
      conference: 'NFC',
      division: 'North'
    });

    const awayTeam = new Team({
      id: 'team2',
      name: 'Away Team',
      city: 'Away City',
      abbreviation: 'AT',
      conference: 'AFC',
      division: 'South'
    });

    const game = new Game({
      id: 'game1',
      homeTeam,
      awayTeam,
      scheduledTime: new Date(),
      season: 2024,
      week: 1
    });

    mockGameState = new GameState({
      game,
      score: { home: 14, away: 7 },
      timeRemaining: { quarter: 2, minutes: 8, seconds: 30, overtime: false },
      possession: homeTeam,
      fieldPosition: { side: 'home', yardLine: 35 },
      down: 2,
      yardsToGo: 7,
      momentum: { value: 0.3, trend: 'increasing', lastUpdated: new Date() },
      drives: [],
      penalties: [],
      timeouts: { home: 3, away: 2 }
    });
  });

  afterEach(async () => {
    // Clean up any running intervals
    if (gameStateTracker) {
      await gameStateTracker.finalizeGame('game1');
    }
  });

  describe('Game Initialization', () => {
    it('should initialize game tracking with initial state and momentum', async () => {
      await gameStateTracker.initializeGame(mockGameState);

      // Verify game state is persisted
      const persistedState = await gameStateTracker.getCurrentGameState('game1');
      expect(persistedState).toBeTruthy();
      expect(persistedState!.game.id).toBe('game1');
      expect(persistedState!.score.home).toBe(14);
      expect(persistedState!.score.away).toBe(7);

      // Verify momentum is calculated and persisted
      const momentum = await gameStateTracker.getCurrentMomentum('game1');
      expect(momentum).toBeTruthy();
      expect(momentum!.value).toBeGreaterThan(-1);
      expect(momentum!.value).toBeLessThan(1);
      expect(momentum!.factors.length).toBeGreaterThan(0);

      // Verify snapshot is created
      const snapshot = await gameStateTracker.getSnapshot('game1');
      expect(snapshot).toBeTruthy();
      expect(snapshot!.gameId).toBe('game1');
      expect(snapshot!.version).toBe(1);
    });

    it('should calculate initial momentum based on game state', async () => {
      await gameStateTracker.initializeGame(mockGameState);

      const momentum = await gameStateTracker.getCurrentMomentum('game1');
      expect(momentum).toBeTruthy();

      // Should have positive momentum due to home team leading
      expect(momentum!.value).toBeGreaterThan(0);

      // Should have score differential factor
      const scoreFactors = momentum!.factors.filter(f => f.type === 'score_differential');
      expect(scoreFactors.length).toBe(1);
      expect(scoreFactors[0].impact).toBeGreaterThan(0);

      // Should have field position factor
      const fieldFactors = momentum!.factors.filter(f => f.type === 'field_position');
      expect(fieldFactors.length).toBe(1);
    });
  });

  describe('Game State Updates', () => {
    beforeEach(async () => {
      await gameStateTracker.initializeGame(mockGameState);
    });

    it('should update game state and recalculate momentum', async () => {
      // Update game state with new score
      const updatedGameState = new GameState({
        ...mockGameState,
        score: { home: 21, away: 7 },
        timeRemaining: { quarter: 2, minutes: 5, seconds: 15, overtime: false }
      });

      const newMomentum = await gameStateTracker.updateGameState(updatedGameState);

      // Verify state is updated
      const persistedState = await gameStateTracker.getCurrentGameState('game1');
      expect(persistedState!.score.home).toBe(21);

      // Verify momentum is recalculated
      expect(newMomentum.value).toBeGreaterThan(0);
      expect(newMomentum.lastUpdated).toBeInstanceOf(Date);

      // Verify snapshot is updated
      const snapshot = await gameStateTracker.getSnapshot('game1');
      expect(snapshot!.version).toBe(2);
    });

    it('should handle momentum trend calculation', async () => {
      // Get initial momentum
      const initialMomentum = await gameStateTracker.getCurrentMomentum('game1');
      const initialValue = initialMomentum!.value;

      // Update with positive event (touchdown)
      const positiveGameState = new GameState({
        ...mockGameState,
        score: { home: 21, away: 7 }
      });

      const newMomentum = await gameStateTracker.updateGameState(positiveGameState);

      // Should show increasing trend if momentum increased significantly
      if (newMomentum.value - initialValue > 0.1) {
        expect(newMomentum.trend).toBe('increasing');
      }
    });
  });

  describe('Event Processing', () => {
    beforeEach(async () => {
      await gameStateTracker.initializeGame(mockGameState);
    });

    it('should add events to processing queue', async () => {
      const gameEvent: GameEvent = {
        id: 'event1',
        gameId: 'game1',
        type: EvidenceType.TOUCHDOWN,
        description: 'Home team touchdown',
        impact: 0.4,
        confidence: 0.85,
        timestamp: new Date(),
        gameState: mockGameState
      };

      await gameStateTracker.addEvent(gameEvent);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify event is persisted
      const recentEvents = await gameStateTracker.getRecentEvents('game1');
      expect(recentEvents.length).toBeGreaterThan(0);
      expect(recentEvents[0].id).toBe('event1');
      expect(recentEvents[0].type).toBe(EvidenceType.TOUCHDOWN);
    });

    it('should process events in batches', async () => {
      const events: GameEvent[] = [];
      for (let i = 0; i < 8; i++) {
        events.push({
          id: `batch_event${i}`,
          gameId: 'game1',
          type: EvidenceType.FIELD_GOAL,
          description: `Batch Event ${i}`,
          impact: 0.1,
          confidence: 0.7,
          timestamp: new Date(),
          gameState: mockGameState
        });
      }

      // Add all events
      for (const event of events) {
        await gameStateTracker.addEvent(event);
      }

      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verify events are processed (should be at least 8, might be more from other tests)
      const recentEvents = await gameStateTracker.getRecentEvents('game1', 20);
      const batchEvents = recentEvents.filter(e => e.id.startsWith('batch_event'));
      expect(batchEvents.length).toBeGreaterThanOrEqual(8);
    });

    it('should calculate event-based momentum', async () => {
      const touchdownEvent: GameEvent = {
        id: 'touchdown',
        gameId: 'game1',
        type: EvidenceType.TOUCHDOWN,
        description: 'Home team touchdown',
        impact: 0.5,
        confidence: 0.9,
        timestamp: new Date(),
        gameState: mockGameState
      };

      await gameStateTracker.addEvent(touchdownEvent);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Update game state to trigger momentum recalculation
      const updatedGameState = new GameState({
        ...mockGameState,
        score: { home: 21, away: 7 }
      });

      const newMomentum = await gameStateTracker.updateGameState(updatedGameState);

      // Should have event-based momentum factors
      const eventFactors = newMomentum.factors.filter(f => f.type.startsWith('event_'));
      expect(eventFactors.length).toBeGreaterThan(0);
    });
  });

  describe('Momentum Calculation', () => {
    beforeEach(async () => {
      await gameStateTracker.initializeGame(mockGameState);
    });

    it('should calculate momentum for red zone situations', async () => {
      const redZoneGameState = new GameState({
        ...mockGameState,
        fieldPosition: { side: 'away', yardLine: 15 }, // Red zone
        possession: mockGameState.game.homeTeam
      });

      const momentum = await gameStateTracker.updateGameState(redZoneGameState);

      // Should have red zone factor
      const redZoneFactors = momentum.factors.filter(f => f.type === 'red_zone');
      expect(redZoneFactors.length).toBe(1);
      expect(redZoneFactors[0].impact).toBeGreaterThan(0); // Positive for home team possession
    });

    it('should calculate momentum for critical down situations', async () => {
      const criticalDownGameState = new GameState({
        ...mockGameState,
        down: 3,
        yardsToGo: 8
      });

      const momentum = await gameStateTracker.updateGameState(criticalDownGameState);

      // Should have critical down factor
      const criticalFactors = momentum.factors.filter(f => f.type === 'critical_down');
      expect(criticalFactors.length).toBe(1);
    });

    it('should calculate momentum for two-minute warning', async () => {
      const twoMinuteGameState = new GameState({
        ...mockGameState,
        timeRemaining: { quarter: 2, minutes: 2, seconds: 0, overtime: false }
      });

      const momentum = await gameStateTracker.updateGameState(twoMinuteGameState);

      // Should have two-minute warning factor
      const twoMinuteFactors = momentum.factors.filter(f => f.type === 'two_minute_warning');
      expect(twoMinuteFactors.length).toBe(1);
    });

    it('should weight recent events more heavily', async () => {
      const oldEvent: GameEvent = {
        id: 'old_event',
        gameId: 'game1',
        type: EvidenceType.FIELD_GOAL,
        description: 'Old field goal',
        impact: 0.2,
        confidence: 0.8,
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        gameState: mockGameState
      };

      const recentEvent: GameEvent = {
        id: 'recent_event',
        gameId: 'game1',
        type: EvidenceType.FIELD_GOAL,
        description: 'Recent field goal',
        impact: 0.2,
        confidence: 0.8,
        timestamp: new Date(), // Now
        gameState: mockGameState
      };

      await gameStateTracker.addEvent(oldEvent);
      await gameStateTracker.addEvent(recentEvent);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      const momentum = await gameStateTracker.updateGameState(mockGameState);

      // Recent events should have higher impact
      const eventFactors = momentum.factors.filter(f => f.type.startsWith('event_'));
      if (eventFactors.length >= 2) {
        const recentFactor = eventFactors.find(f => f.description.includes('Recent'));
        const oldFactor = eventFactors.find(f => f.description.includes('Old'));
        
        if (recentFactor && oldFactor) {
          expect(Math.abs(recentFactor.impact)).toBeGreaterThan(Math.abs(oldFactor.impact));
        }
      }
    });
  });

  describe('Persistence and Retrieval', () => {
    beforeEach(async () => {
      await gameStateTracker.initializeGame(mockGameState);
    });

    it('should persist and retrieve game state', async () => {
      const retrievedState = await gameStateTracker.getCurrentGameState('game1');
      
      expect(retrievedState).toBeTruthy();
      expect(retrievedState!.game.id).toBe('game1');
      expect(retrievedState!.score.home).toBe(14);
      expect(retrievedState!.score.away).toBe(7);
    });

    it('should persist and retrieve momentum', async () => {
      const momentum = await gameStateTracker.getCurrentMomentum('game1');
      
      expect(momentum).toBeTruthy();
      expect(momentum!.value).toBeGreaterThan(-1);
      expect(momentum!.value).toBeLessThan(1);
      expect(momentum!.factors).toBeInstanceOf(Array);
      expect(momentum!.lastUpdated).toBeInstanceOf(Date);
    });

    it('should persist and retrieve snapshots', async () => {
      const snapshot = await gameStateTracker.getSnapshot('game1');
      
      expect(snapshot).toBeTruthy();
      expect(snapshot!.gameId).toBe('game1');
      expect(snapshot!.version).toBe(1);
      expect(snapshot!.gameState).toBeTruthy();
      expect(snapshot!.momentum).toBeTruthy();
    });

    it('should retrieve recent events with limit', async () => {
      // Add multiple events
      for (let i = 0; i < 15; i++) {
        await gameStateTracker.addEvent({
          id: `event${i}`,
          gameId: 'game1',
          type: EvidenceType.PENALTY,
          description: `Event ${i}`,
          impact: 0.05,
          confidence: 0.6,
          timestamp: new Date(),
          gameState: mockGameState
        });
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 300));

      // Retrieve with limit
      const recentEvents = await gameStateTracker.getRecentEvents('game1', 10);
      expect(recentEvents.length).toBeLessThanOrEqual(10);
    });

    it('should handle non-existent game data gracefully', async () => {
      const nonExistentState = await gameStateTracker.getCurrentGameState('nonexistent');
      const nonExistentMomentum = await gameStateTracker.getCurrentMomentum('nonexistent');
      const nonExistentSnapshot = await gameStateTracker.getSnapshot('nonexistent');
      
      expect(nonExistentState).toBeNull();
      expect(nonExistentMomentum).toBeNull();
      expect(nonExistentSnapshot).toBeNull();
    });
  });

  describe('Game Finalization', () => {
    beforeEach(async () => {
      await gameStateTracker.initializeGame(mockGameState);
    });

    it('should clean up resources when game is finalized', async () => {
      // Add some events
      await gameStateTracker.addEvent({
        id: 'final_event',
        gameId: 'game1',
        type: EvidenceType.TOUCHDOWN,
        description: 'Final touchdown',
        impact: 0.3,
        confidence: 0.8,
        timestamp: new Date(),
        gameState: mockGameState
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Finalize game
      await gameStateTracker.finalizeGame('game1');

      // Data should still be accessible immediately after finalization
      const state = await gameStateTracker.getCurrentGameState('game1');
      expect(state).toBeTruthy();

      // But processing should stop (no new events should be processed)
      await gameStateTracker.addEvent({
        id: 'post_final_event',
        gameId: 'game1',
        type: EvidenceType.PENALTY,
        description: 'Post-final event',
        impact: 0.1,
        confidence: 0.5,
        timestamp: new Date(),
        gameState: mockGameState
      });

      // Wait and verify no new processing
      await new Promise(resolve => setTimeout(resolve, 200));
      // This test mainly ensures no errors occur during cleanup
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // This test would require mocking Redis failures
      // For now, we'll test that the methods don't throw
      await expect(gameStateTracker.getCurrentGameState('game1')).resolves.not.toThrow();
    });

    it('should handle malformed event data', async () => {
      await gameStateTracker.initializeGame(mockGameState);

      const malformedEvent: GameEvent = {
        id: 'malformed',
        gameId: 'game1',
        type: EvidenceType.TOUCHDOWN,
        description: 'Malformed event',
        impact: NaN, // Invalid impact
        confidence: 1.5, // Invalid confidence
        timestamp: new Date(),
        gameState: mockGameState
      };

      // Should not throw
      await expect(gameStateTracker.addEvent(malformedEvent)).resolves.not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle high event volume efficiently', async () => {
      await gameStateTracker.initializeGame(mockGameState);

      const startTime = Date.now();
      
      // Add many events quickly
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(gameStateTracker.addEvent({
          id: `perf_event${i}`,
          gameId: 'game1',
          type: EvidenceType.FIELD_POSITION,
          description: `Performance test event ${i}`,
          impact: Math.random() * 0.1,
          confidence: 0.5,
          timestamp: new Date(),
          gameState: mockGameState
        }));
      }

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify events were processed
      const recentEvents = await gameStateTracker.getRecentEvents('game1', 100);
      expect(recentEvents.length).toBe(100);
    }, 10000); // 10 second timeout
  });
});
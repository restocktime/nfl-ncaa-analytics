import { DataSource } from 'typeorm';
import { DatabaseManager, defaultDatabaseConfig } from '../../core/database-config';
import { GameRepository } from '../../repositories/GameRepository';
import { GameStateRepository } from '../../repositories/GameStateRepository';
import { GameProbabilitiesRepository } from '../../repositories/GameProbabilitiesRepository';
import { Game, GameStatus } from '../../entities/Game.entity';
import { Team } from '../../entities/Team.entity';
import { GameState } from '../../entities/GameState.entity';
import { GameProbabilities } from '../../entities/GameProbabilities.entity';

describe('Database Integration Tests', () => {
  let databaseManager: DatabaseManager;
  let dataSource: DataSource;
  let gameRepository: GameRepository;
  let gameStateRepository: GameStateRepository;
  let gameProbabilitiesRepository: GameProbabilitiesRepository;

  // Test data
  let testTeam1: Team;
  let testTeam2: Team;
  let testGame: Game;

  beforeAll(async () => {
    // Use test database configuration
    const testConfig = {
      ...defaultDatabaseConfig,
      database: 'football_analytics_test',
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      username: process.env.TEST_DB_USERNAME || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'password'
    };

    databaseManager = new DatabaseManager(testConfig);
    
    try {
      await databaseManager.initialize();
      dataSource = databaseManager.getDataSource();
      
      // Initialize repositories
      gameRepository = new GameRepository(dataSource);
      gameStateRepository = new GameStateRepository(dataSource);
      gameProbabilitiesRepository = new GameProbabilitiesRepository(dataSource);

      // Run migrations
      await databaseManager.runMigrations();
    } catch (error) {
      console.warn('Database connection failed, skipping integration tests:', error);
      return;
    }
  });

  afterAll(async () => {
    if (databaseManager) {
      await databaseManager.close();
    }
  });

  beforeEach(async () => {
    if (!dataSource) {
      return; // Skip if database not available
    }

    // Clean up test data
    await dataSource.query('TRUNCATE TABLE game_probabilities CASCADE');
    await dataSource.query('TRUNCATE TABLE game_states CASCADE');
    await dataSource.query('TRUNCATE TABLE games CASCADE');
    await dataSource.query('TRUNCATE TABLE teams CASCADE');

    // Create test teams
    const teamRepository = dataSource.getRepository(Team);
    testTeam1 = await teamRepository.save({
      name: 'Test Team 1',
      abbreviation: 'TT1',
      conference: 'Test Conference',
      city: 'Test City 1',
      state: 'TS'
    });

    testTeam2 = await teamRepository.save({
      name: 'Test Team 2',
      abbreviation: 'TT2',
      conference: 'Test Conference',
      city: 'Test City 2',
      state: 'TS'
    });

    // Create test game
    testGame = await gameRepository.create({
      homeTeamId: testTeam1.id,
      awayTeamId: testTeam2.id,
      scheduledTime: new Date('2024-01-15T20:00:00Z'),
      status: GameStatus.SCHEDULED,
      venue: 'Test Stadium',
      city: 'Test City',
      state: 'TS'
    });
  });

  describe('DatabaseManager', () => {
    it('should initialize database connection', async () => {
      if (!databaseManager) return;
      
      expect(databaseManager.getDataSource()).toBeDefined();
      expect(databaseManager.getDataSource().isInitialized).toBe(true);
    });

    it('should check database health', async () => {
      if (!databaseManager) return;
      
      const isHealthy = await databaseManager.isHealthy();
      expect(isHealthy).toBe(true);
    });
  });

  describe('GameRepository', () => {
    it('should create and retrieve games', async () => {
      if (!gameRepository || !testGame) return;

      const retrievedGame = await gameRepository.findById(testGame.id);
      expect(retrievedGame).toBeDefined();
      expect(retrievedGame?.homeTeamId).toBe(testTeam1.id);
      expect(retrievedGame?.awayTeamId).toBe(testTeam2.id);
    });

    it('should find games by status', async () => {
      if (!gameRepository) return;

      const scheduledGames = await gameRepository.findByStatus(GameStatus.SCHEDULED);
      expect(scheduledGames).toHaveLength(1);
      expect(scheduledGames[0].status).toBe(GameStatus.SCHEDULED);
    });

    it('should find games by team', async () => {
      if (!gameRepository || !testTeam1) return;

      const teamGames = await gameRepository.findByTeam(testTeam1.id);
      expect(teamGames).toHaveLength(1);
      expect(teamGames[0].homeTeamId).toBe(testTeam1.id);
    });

    it('should update game score', async () => {
      if (!gameRepository || !testGame) return;

      const updatedGame = await gameRepository.updateScore(testGame.id, 14, 7);
      expect(updatedGame?.homeScore).toBe(14);
      expect(updatedGame?.awayScore).toBe(7);
    });

    it('should find games by date range', async () => {
      if (!gameRepository) return;

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const games = await gameRepository.findByDateRange(startDate, endDate);
      
      expect(games).toHaveLength(1);
      expect(games[0].scheduledTime.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(games[0].scheduledTime.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });
  });

  describe('GameStateRepository', () => {
    let testGameState: GameState;

    beforeEach(async () => {
      if (!gameStateRepository || !testGame) return;

      testGameState = await gameStateRepository.createGameState({
        gameId: testGame.id,
        homeScore: 7,
        awayScore: 3,
        quarter: 2,
        timeRemaining: '10:30',
        possessionTeamId: testTeam1.id,
        fieldPosition: 35,
        down: 2,
        yardsToGo: 8,
        momentumScore: 0.65
      });
    });

    it('should create and retrieve game states', async () => {
      if (!gameStateRepository || !testGameState) return;

      const retrievedState = await gameStateRepository.findById(testGameState.id);
      expect(retrievedState).toBeDefined();
      expect(retrievedState?.homeScore).toBe(7);
      expect(retrievedState?.awayScore).toBe(3);
      expect(retrievedState?.momentumScore).toBe(0.65);
    });

    it('should find latest game state', async () => {
      if (!gameStateRepository || !testGame) return;

      // Create another state
      await gameStateRepository.createGameState({
        gameId: testGame.id,
        homeScore: 14,
        awayScore: 3,
        quarter: 2,
        timeRemaining: '8:45',
        timestamp: new Date(Date.now() + 1000) // 1 second later
      });

      const latestState = await gameStateRepository.findLatestByGame(testGame.id);
      expect(latestState?.homeScore).toBe(14);
    });

    it('should find states by time range', async () => {
      if (!gameStateRepository || !testGame) return;

      const startTime = new Date(Date.now() - 60000); // 1 minute ago
      const endTime = new Date(Date.now() + 60000); // 1 minute from now

      const states = await gameStateRepository.findByTimeRange(testGame.id, startTime, endTime);
      expect(states).toHaveLength(1);
    });

    it('should find red zone states', async () => {
      if (!gameStateRepository || !testGame) return;

      await gameStateRepository.createGameState({
        gameId: testGame.id,
        homeScore: 7,
        awayScore: 3,
        quarter: 2,
        fieldPosition: 15,
        redZone: true
      });

      const redZoneStates = await gameStateRepository.findRedZoneStates(testGame.id);
      expect(redZoneStates).toHaveLength(1);
      expect(redZoneStates[0].redZone).toBe(true);
    });

    it('should bulk insert game states', async () => {
      if (!gameStateRepository || !testGame) return;

      const states = [
        {
          gameId: testGame.id,
          homeScore: 14,
          awayScore: 7,
          quarter: 3,
          timestamp: new Date(Date.now() + 2000)
        },
        {
          gameId: testGame.id,
          homeScore: 21,
          awayScore: 7,
          quarter: 3,
          timestamp: new Date(Date.now() + 3000)
        }
      ];

      const insertedStates = await gameStateRepository.bulkInsertStates(states);
      expect(insertedStates).toHaveLength(2);
    });
  });

  describe('GameProbabilitiesRepository', () => {
    let testProbabilities: GameProbabilities;

    beforeEach(async () => {
      if (!gameProbabilitiesRepository || !testGame) return;

      testProbabilities = await gameProbabilitiesRepository.createProbabilities({
        gameId: testGame.id,
        homeWinProbability: 0.6500,
        awayWinProbability: 0.3500,
        spreadProbability: 0.5200,
        spreadValue: -3.5,
        overProbability: 0.4800,
        underProbability: 0.5200,
        totalPoints: 47.5,
        confidenceIntervalLower: 0.6200,
        confidenceIntervalUpper: 0.6800,
        modelVersion: 'v1.0.0',
        simulationIterations: 10000
      });
    });

    it('should create and retrieve probabilities', async () => {
      if (!gameProbabilitiesRepository || !testProbabilities) return;

      const retrieved = await gameProbabilitiesRepository.findById(testProbabilities.id);
      expect(retrieved).toBeDefined();
      expect(Number(retrieved?.homeWinProbability)).toBe(0.6500);
      expect(Number(retrieved?.awayWinProbability)).toBe(0.3500);
      expect(retrieved?.modelVersion).toBe('v1.0.0');
    });

    it('should find latest probabilities by game', async () => {
      if (!gameProbabilitiesRepository || !testGame) return;

      // Create another probability entry
      await gameProbabilitiesRepository.createProbabilities({
        gameId: testGame.id,
        homeWinProbability: 0.7000,
        awayWinProbability: 0.3000,
        timestamp: new Date(Date.now() + 1000)
      });

      const latest = await gameProbabilitiesRepository.findLatestByGame(testGame.id);
      expect(Number(latest?.homeWinProbability)).toBe(0.7000);
    });

    it('should find probabilities by model version', async () => {
      if (!gameProbabilitiesRepository) return;

      const probabilities = await gameProbabilitiesRepository.findByModelVersion('v1.0.0');
      expect(probabilities).toHaveLength(1);
      expect(probabilities[0].modelVersion).toBe('v1.0.0');
    });

    it('should find high confidence predictions', async () => {
      if (!gameProbabilitiesRepository || !testGame) return;

      // Create high confidence prediction
      await gameProbabilitiesRepository.createProbabilities({
        gameId: testGame.id,
        homeWinProbability: 0.8500,
        awayWinProbability: 0.1500
      });

      const highConfidence = await gameProbabilitiesRepository.findHighConfidencePredictions(0.8);
      expect(highConfidence).toHaveLength(1);
      expect(Number(highConfidence[0].homeWinProbability)).toBe(0.8500);
    });

    it('should calculate average probabilities by time range', async () => {
      if (!gameProbabilitiesRepository || !testGame) return;

      // Create additional probability entries
      await gameProbabilitiesRepository.createProbabilities({
        gameId: testGame.id,
        homeWinProbability: 0.7000,
        awayWinProbability: 0.3000,
        spreadProbability: 0.5500,
        overProbability: 0.5000,
        underProbability: 0.5000
      });

      const startTime = new Date(Date.now() - 60000);
      const endTime = new Date(Date.now() + 60000);

      const averages = await gameProbabilitiesRepository.getAverageProbabilityByTimeRange(
        testGame.id, 
        startTime, 
        endTime
      );

      expect(averages).toBeDefined();
      expect(Number(averages?.avgHomeWinProbability)).toBeCloseTo(0.675, 2);
      expect(Number(averages?.avgAwayWinProbability)).toBeCloseTo(0.325, 2);
    });

    it('should bulk insert probabilities', async () => {
      if (!gameProbabilitiesRepository || !testGame) return;

      const probabilities = [
        {
          gameId: testGame.id,
          homeWinProbability: 0.6000,
          awayWinProbability: 0.4000,
          timestamp: new Date(Date.now() + 2000)
        },
        {
          gameId: testGame.id,
          homeWinProbability: 0.5500,
          awayWinProbability: 0.4500,
          timestamp: new Date(Date.now() + 3000)
        }
      ];

      const inserted = await gameProbabilitiesRepository.bulkInsertProbabilities(probabilities);
      expect(inserted).toHaveLength(2);
    });
  });

  describe('Time-series Performance', () => {
    it('should handle high-frequency inserts efficiently', async () => {
      if (!gameStateRepository || !testGame) return;

      const startTime = Date.now();
      const states = Array.from({ length: 100 }, (_, i) => ({
        gameId: testGame.id,
        homeScore: Math.floor(i / 10),
        awayScore: Math.floor(i / 15),
        quarter: Math.min(Math.floor(i / 25) + 1, 4),
        timestamp: new Date(Date.now() + i * 1000)
      }));

      await gameStateRepository.bulkInsertStates(states);
      const endTime = Date.now();

      // Should complete within reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);

      // Verify all states were inserted
      const retrievedStates = await gameStateRepository.findByGame(testGame.id);
      expect(retrievedStates).toHaveLength(100);
    }, 10000);

    it('should query time-series data efficiently', async () => {
      if (!gameProbabilitiesRepository || !testGame) return;

      // Insert test data
      const probabilities = Array.from({ length: 50 }, (_, i) => ({
        gameId: testGame.id,
        homeWinProbability: 0.5 + (i * 0.01),
        awayWinProbability: 0.5 - (i * 0.01),
        timestamp: new Date(Date.now() + i * 60000) // 1 minute intervals
      }));

      await gameProbabilitiesRepository.bulkInsertProbabilities(probabilities);

      const startTime = Date.now();
      const recentProbabilities = await gameProbabilitiesRepository.findRecentProbabilities(testGame.id, 30);
      const endTime = Date.now();

      // Query should be fast (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(recentProbabilities.length).toBeGreaterThan(0);
    }, 10000);
  });
});
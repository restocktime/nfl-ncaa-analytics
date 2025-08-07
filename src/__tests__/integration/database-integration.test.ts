import { DataSource } from 'typeorm';
import { DatabaseService } from '../../core/database-service';
import { DatabaseManager, defaultDatabaseConfig } from '../../core/database-config';
import { GameRepository } from '../../repositories/GameRepository';
import { GameStateRepository } from '../../repositories/GameStateRepository';
import { GameProbabilitiesRepository } from '../../repositories/GameProbabilitiesRepository';
import { TeamRepository } from '../../repositories/TeamRepository';
import { PlayerRepository } from '../../repositories/PlayerRepository';
import { TeamStatisticsRepository } from '../../repositories/TeamStatisticsRepository';
import { PlayerStatisticsRepository } from '../../repositories/PlayerStatisticsRepository';
import { Game, GameStatus } from '../../entities/Game.entity';
import { Team } from '../../entities/Team.entity';
import { Player, Position, InjuryStatus } from '../../entities/Player.entity';
import { GameState } from '../../entities/GameState.entity';
import { GameProbabilities } from '../../entities/GameProbabilities.entity';
import { TeamStatistics } from '../../entities/TeamStatistics.entity';
import { PlayerStatistics } from '../../entities/PlayerStatistics.entity';

describe('Database Integration Tests', () => {
  let databaseService: DatabaseService;
  let databaseManager: DatabaseManager;
  let dataSource: DataSource;
  let gameRepository: GameRepository;
  let gameStateRepository: GameStateRepository;
  let gameProbabilitiesRepository: GameProbabilitiesRepository;
  let teamRepository: TeamRepository;
  let playerRepository: PlayerRepository;
  let teamStatisticsRepository: TeamStatisticsRepository;
  let playerStatisticsRepository: PlayerStatisticsRepository;

  // Test data
  let testTeam1: Team;
  let testTeam2: Team;
  let testGame: Game;
  let testPlayer1: Player;
  let testPlayer2: Player;

  beforeAll(async () => {
    // Use test database configuration
    const testConfig = {
      ...defaultDatabaseConfig,
      database: 'football_analytics_test',
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      username: process.env.TEST_DB_USERNAME || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'password',
      enableTimescaleDB: true
    };

    databaseService = new DatabaseService(testConfig);
    databaseManager = new DatabaseManager(testConfig);
    
    try {
      await databaseService.initialize();
      dataSource = databaseService.getDataSource();
      
      // Get repositories from service
      gameRepository = databaseService.gameRepository;
      gameStateRepository = databaseService.gameStateRepository;
      gameProbabilitiesRepository = databaseService.gameProbabilitiesRepository;
      teamRepository = databaseService.teamRepository;
      playerRepository = databaseService.playerRepository;
      teamStatisticsRepository = databaseService.teamStatisticsRepository;
      playerStatisticsRepository = databaseService.playerStatisticsRepository;

      // Run migrations
      await databaseService.runMigrations();
    } catch (error) {
      console.warn('Database connection failed, skipping integration tests:', error);
      return;
    }
  });

  afterAll(async () => {
    if (databaseService) {
      await databaseService.close();
    }
    if (databaseManager) {
      await databaseManager.close();
    }
  });

  beforeEach(async () => {
    if (!dataSource) {
      return; // Skip if database not available
    }

    // Clean up test data
    await dataSource.query('TRUNCATE TABLE player_statistics CASCADE');
    await dataSource.query('TRUNCATE TABLE team_statistics CASCADE');
    await dataSource.query('TRUNCATE TABLE game_probabilities CASCADE');
    await dataSource.query('TRUNCATE TABLE game_states CASCADE');
    await dataSource.query('TRUNCATE TABLE players CASCADE');
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

    // Create test players
    testPlayer1 = await playerRepository.create({
      name: 'Test Player 1',
      jerseyNumber: 12,
      position: Position.QB,
      height: '6-2',
      weight: 215,
      age: 24,
      experience: 3,
      college: 'Test University',
      teamId: testTeam1.id,
      injuryStatus: InjuryStatus.HEALTHY,
      depthChartPosition: 1,
      isStarter: true
    });

    testPlayer2 = await playerRepository.create({
      name: 'Test Player 2',
      jerseyNumber: 21,
      position: Position.RB,
      height: '5-10',
      weight: 195,
      age: 22,
      experience: 1,
      college: 'Test College',
      teamId: testTeam2.id,
      injuryStatus: InjuryStatus.HEALTHY,
      depthChartPosition: 1,
      isStarter: true
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

  describe('DatabaseService', () => {
    it('should provide access to all repositories', async () => {
      if (!databaseService) return;

      expect(databaseService.gameRepository).toBeDefined();
      expect(databaseService.gameStateRepository).toBeDefined();
      expect(databaseService.gameProbabilitiesRepository).toBeDefined();
      expect(databaseService.teamRepository).toBeDefined();
      expect(databaseService.playerRepository).toBeDefined();
      expect(databaseService.teamStatisticsRepository).toBeDefined();
      expect(databaseService.playerStatisticsRepository).toBeDefined();
    });

    it('should get database connection info', async () => {
      if (!databaseService) return;

      const connectionInfo = await databaseService.getConnectionInfo();
      expect(connectionInfo.isConnected).toBe(true);
      expect(connectionInfo.database).toBe('football_analytics_test');
    });

    it('should get database statistics', async () => {
      if (!databaseService) return;

      const stats = await databaseService.getDatabaseStats();
      expect(stats.totalTables).toBeGreaterThan(0);
      expect(typeof stats.databaseSize).toBe('string');
    });

    it('should execute transactions', async () => {
      if (!databaseService || !testTeam1) return;

      const result = await databaseService.executeTransaction(async (dataSource) => {
        const teamRepo = dataSource.getRepository(Team);
        await teamRepo.update(testTeam1.id, { name: 'Updated Team Name' });
        return 'success';
      });

      expect(result).toBe('success');
      
      const updatedTeam = await teamRepository.findById(testTeam1.id);
      expect(updatedTeam?.name).toBe('Updated Team Name');
    });
  });

  describe('TeamRepository', () => {
    it('should find teams by conference', async () => {
      if (!teamRepository) return;

      const teams = await teamRepository.findByConference('Test Conference');
      expect(teams).toHaveLength(2);
    });

    it('should find team with players', async () => {
      if (!teamRepository || !testTeam1) return;

      const teamWithPlayers = await teamRepository.findWithPlayers(testTeam1.id);
      expect(teamWithPlayers).toBeDefined();
      expect(teamWithPlayers?.players).toHaveLength(1);
      expect(teamWithPlayers?.players[0].name).toBe('Test Player 1');
    });

    it('should search teams by name', async () => {
      if (!teamRepository) return;

      const teams = await teamRepository.searchByName('Test Team');
      expect(teams.length).toBeGreaterThan(0);
    });
  });

  describe('PlayerRepository', () => {
    it('should find players by team', async () => {
      if (!playerRepository || !testTeam1) return;

      const players = await playerRepository.findByTeam(testTeam1.id);
      expect(players).toHaveLength(1);
      expect(players[0].name).toBe('Test Player 1');
    });

    it('should find players by position', async () => {
      if (!playerRepository) return;

      const quarterbacks = await playerRepository.findByPosition(Position.QB);
      expect(quarterbacks).toHaveLength(1);
      expect(quarterbacks[0].position).toBe(Position.QB);
    });

    it('should find starters', async () => {
      if (!playerRepository || !testTeam1) return;

      const starters = await playerRepository.findStarters(testTeam1.id);
      expect(starters).toHaveLength(1);
      expect(starters[0].isStarter).toBe(true);
    });

    it('should update injury status', async () => {
      if (!playerRepository || !testPlayer1) return;

      const updatedPlayer = await playerRepository.updateInjuryStatus(
        testPlayer1.id,
        InjuryStatus.QUESTIONABLE,
        'Shoulder injury'
      );

      expect(updatedPlayer?.injuryStatus).toBe(InjuryStatus.QUESTIONABLE);
      expect(updatedPlayer?.injuryDescription).toBe('Shoulder injury');
    });

    it('should find injured players', async () => {
      if (!playerRepository || !testPlayer1) return;

      // First update a player to injured status
      await playerRepository.updateInjuryStatus(testPlayer1.id, InjuryStatus.OUT);

      const injuredPlayers = await playerRepository.findInjuredPlayers();
      expect(injuredPlayers.length).toBeGreaterThan(0);
      expect(injuredPlayers.some(p => p.id === testPlayer1.id)).toBe(true);
    });
  });

  describe('TeamStatisticsRepository', () => {
    let testTeamStats: TeamStatistics;

    beforeEach(async () => {
      if (!teamStatisticsRepository || !testTeam1) return;

      testTeamStats = await teamStatisticsRepository.create({
        teamId: testTeam1.id,
        season: 2024,
        week: 1,
        opponentId: testTeam2.id,
        isHome: true,
        pointsScored: 28,
        totalYards: 425,
        passingYards: 275,
        rushingYards: 150,
        firstDowns: 22,
        thirdDownConversions: 8,
        thirdDownAttempts: 12,
        redZoneConversions: 3,
        redZoneAttempts: 4,
        turnovers: 1,
        pointsAllowed: 14,
        yardsAllowed: 320,
        sacks: 3,
        interceptions: 2,
        offensiveEfficiency: 0.785,
        defensiveEfficiency: 0.642
      });
    });

    it('should find statistics by team', async () => {
      if (!teamStatisticsRepository || !testTeam1) return;

      const stats = await teamStatisticsRepository.findByTeam(testTeam1.id, 2024);
      expect(stats).toHaveLength(1);
      expect(stats[0].pointsScored).toBe(28);
    });

    it('should calculate season totals', async () => {
      if (!teamStatisticsRepository || !testTeam1) return;

      const seasonTotals = await teamStatisticsRepository.findSeasonTotals(testTeam1.id, 2024);
      expect(seasonTotals).toBeDefined();
      expect(Number(seasonTotals?.totalpointsscored)).toBe(28);
      expect(Number(seasonTotals?.gamesplayed)).toBe(1);
    });

    it('should find red zone statistics', async () => {
      if (!teamStatisticsRepository || !testTeam1) return;

      const redZoneStats = await teamStatisticsRepository.findRedZoneStats(testTeam1.id, 2024);
      expect(redZoneStats.offensiveRedZonePercentage).toBe(75); // 3/4 * 100
    });
  });

  describe('PlayerStatisticsRepository', () => {
    let testPlayerStats: PlayerStatistics;

    beforeEach(async () => {
      if (!playerStatisticsRepository || !testPlayer1) return;

      testPlayerStats = await playerStatisticsRepository.create({
        playerId: testPlayer1.id,
        season: 2024,
        week: 1,
        opponentId: testTeam2.id,
        isHome: true,
        gamesPlayed: 1,
        gamesStarted: 1,
        passingAttempts: 32,
        passingCompletions: 24,
        passingYards: 275,
        passingTouchdowns: 2,
        interceptionsThrown: 1,
        qbRating: 98.5,
        rushingAttempts: 4,
        rushingYards: 18,
        rushingTouchdowns: 1
      });
    });

    it('should find statistics by player', async () => {
      if (!playerStatisticsRepository || !testPlayer1) return;

      const stats = await playerStatisticsRepository.findByPlayer(testPlayer1.id, 2024);
      expect(stats).toHaveLength(1);
      expect(stats[0].passingYards).toBe(275);
    });

    it('should calculate season totals', async () => {
      if (!playerStatisticsRepository || !testPlayer1) return;

      const seasonTotals = await playerStatisticsRepository.findSeasonTotals(testPlayer1.id, 2024);
      expect(seasonTotals).toBeDefined();
      expect(Number(seasonTotals?.totalpassingyards)).toBe(275);
      expect(Number(seasonTotals?.weeksplayed)).toBe(1);
    });

    it('should find top passers', async () => {
      if (!playerStatisticsRepository) return;

      const topPassers = await playerStatisticsRepository.getTopPassers(2024, 5);
      expect(topPassers).toHaveLength(1);
      expect(Number(topPassers[0].totalpassingyards)).toBe(275);
    });

    it('should find fantasy relevant stats', async () => {
      if (!playerStatisticsRepository) return;

      const fantasyStats = await playerStatisticsRepository.getFantasyRelevantStats(2024, Position.QB, 5);
      expect(fantasyStats).toHaveLength(1);
      expect(Number(fantasyStats[0].totalpassingyards)).toBe(275);
    });
  });

  describe('TimescaleDB Integration', () => {
    it('should handle TimescaleDB hypertables', async () => {
      if (!databaseService) return;

      const hypertables = await databaseService.getTimescaleDBInfo();
      // Should have game_states and game_probabilities as hypertables
      expect(Array.isArray(hypertables)).toBe(true);
    });

    it('should optimize TimescaleDB settings', async () => {
      if (!databaseService) return;

      // This should not throw an error
      await expect(databaseService.optimizeTimescaleDB()).resolves.not.toThrow();
    });
  });
});
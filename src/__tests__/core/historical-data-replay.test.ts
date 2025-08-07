import { HistoricalDataReplay, ReplayConfiguration, GameType } from '../../core/historical-data-replay';
import { DatabaseService } from '../../core/database-service';
import { Game } from '../../models/Game';
import { Team } from '../../models/Team';

// Mock dependencies
jest.mock('../../core/database-service');
jest.mock('../../core/logger');

describe('HistoricalDataReplay', () => {
  let historicalDataReplay: HistoricalDataReplay;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDatabaseService = new DatabaseService({} as any) as jest.Mocked<DatabaseService>;
    historicalDataReplay = new HistoricalDataReplay(mockDatabaseService);
  });

  describe('loadHistoricalData', () => {
    it('should load historical data based on configuration', async () => {
      const config: ReplayConfiguration = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        seasons: [2023],
        includePlayoffs: true,
        gameTypes: [GameType.REGULAR_SEASON, GameType.PLAYOFF]
      };

      const mockGames = [
        createMockGame('game1', new Date('2023-09-01')),
        createMockGame('game2', new Date('2023-09-08'))
      ];

      mockDatabaseService.query.mockResolvedValue(mockGames);
      mockDatabaseService.getPlayByPlayData.mockResolvedValue([
        {
          timestamp: new Date('2023-09-01T13:00:00Z'),
          homeScore: 0,
          awayScore: 0,
          quarter: 1,
          minutesRemaining: 15,
          secondsRemaining: 0,
          down: 1,
          yardsToGo: 10,
          yardLine: 25,
          fieldSide: 'home',
          possession: 'home',
          momentumValue: 0
        }
      ]);
      mockDatabaseService.getFinalScore.mockResolvedValue({
        homeScore: 21,
        awayScore: 14
      });
      mockDatabaseService.getGameMetadata.mockResolvedValue({
        season: 2023,
        week: 1,
        gameType: GameType.REGULAR_SEASON,
        venue: 'Stadium 1',
        weather: null,
        attendance: 50000
      });

      const result = await historicalDataReplay.loadHistoricalData(config);

      expect(result).toHaveLength(2);
      expect(result[0].game.id).toBe('game1');
      expect(result[0].finalOutcome.homeScore).toBe(21);
      expect(result[0].finalOutcome.awayScore).toBe(14);
      expect(result[0].finalOutcome.winner).toBe('home');
      expect(result[0].metadata.season).toBe(2023);
    });

    it('should handle games with no play-by-play data', async () => {
      const config: ReplayConfiguration = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        seasons: [2023],
        includePlayoffs: false,
        gameTypes: [GameType.REGULAR_SEASON]
      };

      const mockGames = [createMockGame('game1', new Date('2023-09-01'))];

      mockDatabaseService.query.mockResolvedValue(mockGames);
      mockDatabaseService.getPlayByPlayData.mockResolvedValue([]); // No play data
      mockDatabaseService.getFinalScore.mockResolvedValue({
        homeScore: 21,
        awayScore: 14
      });
      mockDatabaseService.getGameMetadata.mockResolvedValue({
        season: 2023,
        week: 1,
        gameType: GameType.REGULAR_SEASON,
        venue: 'Stadium 1'
      });

      const result = await historicalDataReplay.loadHistoricalData(config);

      expect(result).toHaveLength(1);
      expect(result[0].gameStates).toHaveLength(0);
    });

    it('should filter by team when specified', async () => {
      const config: ReplayConfiguration = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        seasons: [2023],
        includePlayoffs: true,
        gameTypes: [GameType.REGULAR_SEASON],
        teams: ['team1']
      };

      mockDatabaseService.query.mockResolvedValue([]);

      await historicalDataReplay.loadHistoricalData(config);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('home_team_id = ANY($4) OR away_team_id = ANY($4)'),
        expect.arrayContaining([['team1']])
      );
    });
  });

  describe('replayGame', () => {
    it('should replay a specific game', async () => {
      const gameId = 'game1';
      const mockGame = createMockGame(gameId, new Date('2023-09-01'));

      mockDatabaseService.findGameById.mockResolvedValue(mockGame);
      mockDatabaseService.getPlayByPlayData.mockResolvedValue([
        {
          timestamp: new Date('2023-09-01T13:00:00Z'),
          homeScore: 0,
          awayScore: 0,
          quarter: 1,
          minutesRemaining: 15,
          secondsRemaining: 0,
          down: 1,
          yardsToGo: 10,
          yardLine: 25,
          fieldSide: 'home',
          possession: 'home'
        },
        {
          timestamp: new Date('2023-09-01T16:00:00Z'),
          homeScore: 21,
          awayScore: 14,
          quarter: 4,
          minutesRemaining: 0,
          secondsRemaining: 0,
          down: 0,
          yardsToGo: 0,
          yardLine: 0,
          fieldSide: 'home',
          possession: 'home'
        }
      ]);
      mockDatabaseService.getFinalScore.mockResolvedValue({
        homeScore: 21,
        awayScore: 14
      });

      const result = await historicalDataReplay.replayGame(gameId);

      expect(result.gameId).toBe(gameId);
      expect(result.game).toBe(mockGame);
      expect(result.stateProgression).toHaveLength(2);
      expect(result.finalOutcome.homeScore).toBe(21);
      expect(result.replayDuration).toBeGreaterThan(0);
    });

    it('should throw error for non-existent game', async () => {
      mockDatabaseService.findGameById.mockResolvedValue(null);

      await expect(historicalDataReplay.replayGame('nonexistent')).rejects.toThrow(
        'Game nonexistent not found'
      );
    });
  });

  describe('createCompressedReplay', () => {
    it('should compress replay data correctly', async () => {
      const replayData = [
        {
          game: createMockGame('game1'),
          gameStates: Array.from({ length: 100 }, (_, i) => ({
            timestamp: new Date(Date.now() + i * 1000),
            gameState: {} as any,
            context: {} as any
          })),
          finalOutcome: {
            homeScore: 21,
            awayScore: 14,
            winner: 'home' as const,
            margin: 7,
            totalPoints: 35
          },
          metadata: {
            season: 2023,
            week: 1,
            gameType: GameType.REGULAR_SEASON,
            venue: 'Stadium 1'
          }
        }
      ];

      const compressionRatio = 0.1; // 10% compression
      const result = await historicalDataReplay.createCompressedReplay(replayData, compressionRatio);

      expect(result).toHaveLength(1);
      expect(result[0].keyStates.length).toBeLessThan(replayData[0].gameStates.length);
      expect(result[0].keyStates.length).toBeGreaterThanOrEqual(2); // At least first and last
      expect(result[0].compressionRatio).toBe(compressionRatio);
    });

    it('should always include first and last states', async () => {
      const replayData = [
        {
          game: createMockGame('game1'),
          gameStates: Array.from({ length: 10 }, (_, i) => ({
            timestamp: new Date(Date.now() + i * 1000),
            gameState: { id: i } as any,
            context: {} as any
          })),
          finalOutcome: {
            homeScore: 21,
            awayScore: 14,
            winner: 'home' as const,
            margin: 7,
            totalPoints: 35
          },
          metadata: {
            season: 2023,
            week: 1,
            gameType: GameType.REGULAR_SEASON,
            venue: 'Stadium 1'
          }
        }
      ];

      const result = await historicalDataReplay.createCompressedReplay(replayData, 0.3);

      expect(result[0].keyStates[0].gameState.id).toBe(0); // First state
      expect(result[0].keyStates[result[0].keyStates.length - 1].gameState.id).toBe(9); // Last state
    });
  });

  describe('validateHistoricalData', () => {
    it('should validate data quality correctly', async () => {
      const validReplayData = [
        {
          game: createMockGame('game1'),
          gameStates: [
            {
              timestamp: new Date(),
              gameState: {} as any,
              context: {
                quarter: 4,
                timeRemaining: '00:00',
                down: 0,
                yardsToGo: 0,
                fieldPosition: 0,
                possession: 'home' as const,
                score: { home: 21, away: 14 }
              }
            }
          ],
          finalOutcome: {
            homeScore: 21,
            awayScore: 14,
            winner: 'home' as const,
            margin: 7,
            totalPoints: 35
          },
          metadata: {
            season: 2023,
            week: 1,
            gameType: GameType.REGULAR_SEASON,
            venue: 'Stadium 1'
          }
        }
      ];

      const invalidReplayData = [
        {
          game: null as any, // Invalid: missing game
          gameStates: [],
          finalOutcome: null as any, // Invalid: missing outcome
          metadata: {} as any
        }
      ];

      const validReport = await historicalDataReplay.validateHistoricalData(validReplayData);
      const invalidReport = await historicalDataReplay.validateHistoricalData(invalidReplayData);

      expect(validReport.validGames).toBe(1);
      expect(validReport.invalidGames).toBe(0);
      expect(validReport.qualityScore).toBe(1);

      expect(invalidReport.validGames).toBe(0);
      expect(invalidReport.invalidGames).toBe(1);
      expect(invalidReport.qualityScore).toBe(0);
      expect(invalidReport.issues).toHaveLength(1);
    });

    it('should detect score mismatches', async () => {
      const replayDataWithMismatch = [
        {
          game: createMockGame('game1'),
          gameStates: [
            {
              timestamp: new Date(),
              gameState: {} as any,
              context: {
                quarter: 4,
                timeRemaining: '00:00',
                down: 0,
                yardsToGo: 0,
                fieldPosition: 0,
                possession: 'home' as const,
                score: { home: 21, away: 14 } // Different from final outcome
              }
            }
          ],
          finalOutcome: {
            homeScore: 28, // Mismatch
            awayScore: 21, // Mismatch
            winner: 'home' as const,
            margin: 7,
            totalPoints: 49
          },
          metadata: {
            season: 2023,
            week: 1,
            gameType: GameType.REGULAR_SEASON,
            venue: 'Stadium 1'
          }
        }
      ];

      const report = await historicalDataReplay.validateHistoricalData(replayDataWithMismatch);

      expect(report.invalidGames).toBe(1);
      expect(report.issues[0].issues).toContain('Final score mismatch between game states and outcome');
    });
  });

  describe('private methods', () => {
    it('should calculate replay duration correctly', () => {
      const service = historicalDataReplay as any;
      const gameStates = [
        {
          timestamp: new Date('2023-09-01T13:00:00Z'),
          gameState: {},
          context: {}
        },
        {
          timestamp: new Date('2023-09-01T16:00:00Z'),
          gameState: {},
          context: {}
        }
      ];

      const duration = service.calculateReplayDuration(gameStates);
      expect(duration).toBe(3 * 60 * 60 * 1000); // 3 hours in milliseconds
    });

    it('should handle single game state in duration calculation', () => {
      const service = historicalDataReplay as any;
      const gameStates = [
        {
          timestamp: new Date('2023-09-01T13:00:00Z'),
          gameState: {},
          context: {}
        }
      ];

      const duration = service.calculateReplayDuration(gameStates);
      expect(duration).toBe(0);
    });

    it('should handle empty game states in duration calculation', () => {
      const service = historicalDataReplay as any;
      const duration = service.calculateReplayDuration([]);
      expect(duration).toBe(0);
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
import 'reflect-metadata';
import { HistoricalStatsService } from '../../core/historical-stats-service';
import { OpponentAdjustedStats } from '../../models/OpponentAdjustedStats';
import { TeamStatistics } from '../../types/team.types';
import { Game } from '../../types/game.types';
import { GameStatus, GameType } from '../../types/common.types';
import { Team } from '../../types/team.types';

describe('HistoricalStatsService', () => {
  let service: HistoricalStatsService;
  let mockTeam1: Team;
  let mockTeam2: Team;
  let mockTeamStats1: TeamStatistics;
  let mockTeamStats2: TeamStatistics;
  let mockHistoricalGames: Game[];

  beforeEach(() => {
    service = new HistoricalStatsService();

    // Mock teams
    mockTeam1 = {
      id: 'team-1',
      name: 'Team One',
      abbreviation: 'T1',
      city: 'City One',
      conference: 'Conference A',
      division: 'Division 1',
      logo: 'logo1.png',
      primaryColor: '#FF0000',
      secondaryColor: '#FFFFFF',
      roster: [],
      coaching: {
        headCoach: {
          id: 'coach-1',
          name: 'Coach One',
          position: 'Head Coach',
          experience: 10,
          previousTeams: []
        },
        offensiveCoordinator: {
          id: 'oc-1',
          name: 'OC One',
          position: 'Offensive Coordinator',
          experience: 5,
          previousTeams: []
        },
        defensiveCoordinator: {
          id: 'dc-1',
          name: 'DC One',
          position: 'Defensive Coordinator',
          experience: 7,
          previousTeams: []
        },
        specialTeamsCoordinator: {
          id: 'st-1',
          name: 'ST One',
          position: 'Special Teams Coordinator',
          experience: 3,
          previousTeams: []
        },
        assistants: []
      },
      statistics: {} as TeamStatistics,
      homeVenue: 'venue-1'
    };

    mockTeam2 = {
      ...mockTeam1,
      id: 'team-2',
      name: 'Team Two',
      abbreviation: 'T2',
      city: 'City Two',
      coaching: {
        ...mockTeam1.coaching,
        headCoach: {
          ...mockTeam1.coaching.headCoach,
          id: 'coach-2',
          name: 'Coach Two'
        }
      }
    };

    // Mock team statistics
    mockTeamStats1 = {
      season: 2024,
      games: 16,
      wins: 12,
      losses: 4,
      pointsPerGame: 28.5,
      yardsPerGame: 385,
      passingYardsPerGame: 265,
      rushingYardsPerGame: 120,
      turnoversPerGame: 1.1,
      thirdDownConversion: 0.45,
      redZoneEfficiency: 0.68,
      pointsAllowedPerGame: 19.2,
      yardsAllowedPerGame: 315,
      passingYardsAllowedPerGame: 210,
      rushingYardsAllowedPerGame: 105,
      takeawaysPerGame: 1.6,
      thirdDownDefense: 0.35,
      redZoneDefense: 0.48,
      fieldGoalPercentage: 0.88,
      puntAverage: 46.2,
      kickReturnAverage: 23.5,
      puntReturnAverage: 9.1,
      strengthOfSchedule: 1.08,
      powerRating: 92.5,
      eloRating: 1720
    };

    mockTeamStats2 = {
      season: 2024,
      games: 16,
      wins: 8,
      losses: 8,
      pointsPerGame: 22.1,
      yardsPerGame: 340,
      passingYardsPerGame: 225,
      rushingYardsPerGame: 115,
      turnoversPerGame: 1.4,
      thirdDownConversion: 0.38,
      redZoneEfficiency: 0.55,
      pointsAllowedPerGame: 25.8,
      yardsAllowedPerGame: 375,
      passingYardsAllowedPerGame: 255,
      rushingYardsAllowedPerGame: 120,
      takeawaysPerGame: 1.2,
      thirdDownDefense: 0.42,
      redZoneDefense: 0.65,
      fieldGoalPercentage: 0.81,
      puntAverage: 44.1,
      kickReturnAverage: 21.8,
      puntReturnAverage: 7.5,
      strengthOfSchedule: 0.95,
      powerRating: 76.2,
      eloRating: 1540
    };

    // Mock historical games
    mockHistoricalGames = [
      {
        id: 'game-1',
        homeTeam: mockTeam1,
        awayTeam: mockTeam2,
        venue: {
          id: 'venue-1',
          name: 'Stadium One',
          city: 'City One',
          state: 'State One',
          capacity: 70000,
          surface: 'grass',
          indoor: false,
          timezone: 'America/New_York'
        },
        scheduledTime: new Date('2024-01-15T13:00:00Z'),
        status: GameStatus.FINAL,
        season: 2024,
        week: 1,
        gameType: GameType.REGULAR_SEASON,
        officials: []
      },
      {
        id: 'game-2',
        homeTeam: mockTeam2,
        awayTeam: mockTeam1,
        venue: {
          id: 'venue-2',
          name: 'Stadium Two',
          city: 'City Two',
          state: 'State Two',
          capacity: 65000,
          surface: 'turf',
          indoor: true,
          timezone: 'America/Chicago'
        },
        scheduledTime: new Date('2023-12-10T16:00:00Z'),
        status: GameStatus.FINAL,
        season: 2023,
        week: 14,
        gameType: GameType.REGULAR_SEASON,
        officials: []
      }
    ];
  });

  describe('calculateOpponentAdjustedStats', () => {
    it('should calculate opponent-adjusted statistics correctly', async () => {
      const result = await service.calculateOpponentAdjustedStats(
        'team-1',
        'team-2',
        2024,
        mockHistoricalGames,
        mockTeamStats1,
        mockTeamStats2
      );

      expect(result).toBeInstanceOf(OpponentAdjustedStats);
      expect(result.teamId).toBe('team-1');
      expect(result.opponentId).toBe('team-2');
      expect(result.season).toBe(2024);
      expect(result.offensiveEfficiency).toBeGreaterThan(0);
      expect(result.defensiveEfficiency).toBeGreaterThan(0);
      expect(result.situationalPerformance).toBeDefined();
      expect(result.coachingMatchup).toBeDefined();
    });

    it('should handle teams with superior offensive performance', async () => {
      // Team 1 has much better offensive stats
      const superiorOffenseStats = {
        ...mockTeamStats1,
        pointsPerGame: 35.0,
        yardsPerGame: 450
      };

      const result = await service.calculateOpponentAdjustedStats(
        'team-1',
        'team-2',
        2024,
        mockHistoricalGames,
        superiorOffenseStats,
        mockTeamStats2
      );

      expect(result.offensiveEfficiency).toBeGreaterThan(1.0);
      expect(result.hasOffensiveAdvantage()).toBe(true);
    });

    it('should handle teams with superior defensive performance', async () => {
      // Team 1 has much better defensive stats
      const superiorDefenseStats = {
        ...mockTeamStats1,
        pointsAllowedPerGame: 15.0,
        yardsAllowedPerGame: 280
      };

      const result = await service.calculateOpponentAdjustedStats(
        'team-1',
        'team-2',
        2024,
        mockHistoricalGames,
        superiorDefenseStats,
        mockTeamStats2
      );

      expect(result.defensiveEfficiency).toBeLessThan(1.0);
      expect(result.hasDefensiveAdvantage()).toBe(true);
    });

    it('should calculate situational statistics correctly', async () => {
      const result = await service.calculateOpponentAdjustedStats(
        'team-1',
        'team-2',
        2024,
        mockHistoricalGames,
        mockTeamStats1,
        mockTeamStats2
      );

      expect(result.situationalPerformance.redZone.attempts).toBeGreaterThan(0);
      expect(result.situationalPerformance.thirdDown.attempts).toBeGreaterThan(0);
      expect(result.situationalPerformance.fourthDown.attempts).toBeGreaterThan(0);
      expect(result.situationalPerformance.goalLine.attempts).toBeGreaterThan(0);

      expect(result.getRedZoneEfficiency()).toBeCloseTo(mockTeamStats1.redZoneEfficiency, 2);
      expect(result.getThirdDownConversionRate()).toBeCloseTo(mockTeamStats1.thirdDownConversion, 2);
    });

    it('should handle coaching matchup with historical data', async () => {
      const result = await service.calculateOpponentAdjustedStats(
        'team-1',
        'team-2',
        2024,
        mockHistoricalGames,
        mockTeamStats1,
        mockTeamStats2
      );

      expect(result.coachingMatchup.headCoachId).toBe('coach-team-1');
      expect(result.coachingMatchup.opponentHeadCoachId).toBe('coach-team-2');
      expect(result.coachingMatchup.gamesPlayed).toBe(2); // Two historical games
    });

    it('should handle coaching matchup with no historical data', async () => {
      const result = await service.calculateOpponentAdjustedStats(
        'team-1',
        'team-3', // No historical games
        2024,
        [],
        mockTeamStats1,
        mockTeamStats2
      );

      expect(result.coachingMatchup.gamesPlayed).toBe(0);
      expect(result.coachingMatchup.winPercentage).toBe(0.5); // Neutral
    });

    it('should clamp efficiency values within reasonable bounds', async () => {
      // Create extreme stats that would normally produce out-of-bounds efficiency
      const extremeStats = {
        ...mockTeamStats1,
        pointsPerGame: 50.0, // Extremely high
        yardsPerGame: 600
      };

      const weakOpponentStats = {
        ...mockTeamStats2,
        pointsAllowedPerGame: 35.0, // Very weak defense
        yardsAllowedPerGame: 500
      };

      const result = await service.calculateOpponentAdjustedStats(
        'team-1',
        'team-2',
        2024,
        mockHistoricalGames,
        extremeStats,
        weakOpponentStats
      );

      expect(result.offensiveEfficiency).toBeLessThanOrEqual(2.0);
      expect(result.offensiveEfficiency).toBeGreaterThanOrEqual(0.1);
      expect(result.defensiveEfficiency).toBeLessThanOrEqual(2.0);
      expect(result.defensiveEfficiency).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('calculateStrengthOfSchedule', () => {
    it('should calculate strength of schedule for a team', async () => {
      const result = await service.calculateStrengthOfSchedule('team-1', 2024, mockHistoricalGames);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(2.0);
    });

    it('should return neutral adjustment for no games', async () => {
      const result = await service.calculateStrengthOfSchedule('team-3', 2024, []);

      expect(result).toBe(1.0);
    });

    it('should handle error cases gracefully', async () => {
      // Mock logger to avoid console output during tests
      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      const result = await service.calculateStrengthOfSchedule('team-1', 2024, mockHistoricalGames);

      expect(result).toBeGreaterThan(0);
      loggerSpy.mockRestore();
    });
  });

  describe('getPerformanceTrends', () => {
    it('should calculate performance trends across multiple seasons', async () => {
      const seasons = [2022, 2023, 2024];
      const result = await service.getPerformanceTrends('team-1', seasons, mockHistoricalGames);

      expect(result).toHaveLength(3);
      result.forEach(trend => {
        expect(trend.season).toBeGreaterThanOrEqual(2022);
        expect(trend.season).toBeLessThanOrEqual(2024);
        expect(trend.wins).toBeGreaterThanOrEqual(0);
        expect(trend.losses).toBeGreaterThanOrEqual(0);
        expect(trend.pointsPerGame).toBeGreaterThanOrEqual(0);
        expect(trend.pointsAllowedPerGame).toBeGreaterThanOrEqual(0);
        expect(trend.strengthOfSchedule).toBeGreaterThan(0);
      });
    });

    it('should handle seasons with no games', async () => {
      const seasons = [2020]; // No games in mock data
      const result = await service.getPerformanceTrends('team-1', seasons, mockHistoricalGames);

      expect(result).toHaveLength(1);
      expect(result[0].wins).toBe(0);
      expect(result[0].losses).toBe(0);
      expect(result[0].pointsPerGame).toBe(0);
      expect(result[0].pointsAllowedPerGame).toBe(0);
    });
  });

  describe('compareTeamPerformance', () => {
    it('should compare two teams and return advantage score', async () => {
      const result = await service.compareTeamPerformance('team-1', 'team-2', 2024, mockHistoricalGames);

      expect(result.team1Advantage).toBeGreaterThanOrEqual(-1);
      expect(result.team1Advantage).toBeLessThanOrEqual(1);
      expect(result.keyFactors).toBeInstanceOf(Array);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should identify key factors in team comparison', async () => {
      const result = await service.compareTeamPerformance('team-1', 'team-2', 2024, mockHistoricalGames);

      // Should have some key factors identified
      expect(result.keyFactors.length).toBeGreaterThan(0);
      
      // Key factors should be descriptive strings
      result.keyFactors.forEach(factor => {
        expect(typeof factor).toBe('string');
        expect(factor.length).toBeGreaterThan(0);
      });
    });

    it('should calculate confidence based on data availability', async () => {
      // More games should increase confidence
      const manyGames = Array(20).fill(null).map((_, index) => ({
        ...mockHistoricalGames[0],
        id: `game-${index}`,
        week: index + 1
      }));

      const result = await service.compareTeamPerformance('team-1', 'team-2', 2024, manyGames);

      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle comparison errors gracefully', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      // This should not throw an error
      await expect(
        service.compareTeamPerformance('team-1', 'team-2', 2024, mockHistoricalGames)
      ).resolves.toBeDefined();

      loggerSpy.mockRestore();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle zero division in efficiency calculations', async () => {
      const zeroStatsTeam = {
        ...mockTeamStats2,
        pointsAllowedPerGame: 0, // Would cause division by zero
        yardsAllowedPerGame: 0
      };

      const result = await service.calculateOpponentAdjustedStats(
        'team-1',
        'team-2',
        2024,
        mockHistoricalGames,
        mockTeamStats1,
        zeroStatsTeam
      );

      expect(result.offensiveEfficiency).toBeGreaterThan(0);
      expect(result.defensiveEfficiency).toBeGreaterThan(0);
      expect(isNaN(result.offensiveEfficiency)).toBe(false);
      expect(isNaN(result.defensiveEfficiency)).toBe(false);
    });

    it('should handle invalid team statistics gracefully', async () => {
      const invalidStats = {
        ...mockTeamStats1,
        games: 0, // Invalid
        redZoneEfficiency: -0.5 // Invalid
      };

      const result = await service.calculateOpponentAdjustedStats(
        'team-1',
        'team-2',
        2024,
        mockHistoricalGames,
        invalidStats,
        mockTeamStats2
      );

      expect(result).toBeInstanceOf(OpponentAdjustedStats);
      expect(result.situationalPerformance.redZone.percentage).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty historical games array', async () => {
      const result = await service.calculateOpponentAdjustedStats(
        'team-1',
        'team-2',
        2024,
        [], // No historical games
        mockTeamStats1,
        mockTeamStats2
      );

      expect(result).toBeInstanceOf(OpponentAdjustedStats);
      expect(result.coachingMatchup.gamesPlayed).toBe(0);
    });

    it('should maintain consistency in situational stats', async () => {
      const result = await service.calculateOpponentAdjustedStats(
        'team-1',
        'team-2',
        2024,
        mockHistoricalGames,
        mockTeamStats1,
        mockTeamStats2
      );

      // All situational stats should be consistent (percentage matches calculated rate)
      expect(result.situationalPerformance.redZone.isConsistent()).toBe(true);
      expect(result.situationalPerformance.thirdDown.isConsistent()).toBe(true);
      expect(result.situationalPerformance.fourthDown.isConsistent()).toBe(true);
      expect(result.situationalPerformance.goalLine.isConsistent()).toBe(true);
    });
  });
});
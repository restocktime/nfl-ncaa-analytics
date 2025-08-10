import { FantasyService } from '../../core/fantasy-service';
import { FantasyMLEngine } from '../../core/fantasy-ml-engine';
import { MLModelService } from '../../core/ml-model-service';
import { PlayerRepository } from '../../repositories/PlayerRepository';
import { WeatherAPIConnector } from '../../core/weather-api-connector';
import { DatabaseService } from '../../core/database-service';

describe('FantasyService', () => {
  let fantasyService: FantasyService;
  let mockMLService: jest.Mocked<MLModelService>;
  let mockPlayerRepo: jest.Mocked<PlayerRepository>;
  let mockWeatherConnector: jest.Mocked<WeatherAPIConnector>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    // Create mocks
    mockMLService = {
      trainModel: jest.fn(),
      evaluateModel: jest.fn(),
      getModelMetrics: jest.fn()
    } as any;

    mockPlayerRepo = {
      findById: jest.fn(),
      findByTeam: jest.fn(),
      findByPosition: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn()
    } as any;

    mockWeatherConnector = {
      getGameWeather: jest.fn(),
      getWeatherForecast: jest.fn()
    } as any;

    mockDatabaseService = {
      query: jest.fn(),
      transaction: jest.fn(),
      close: jest.fn()
    } as any;

    // Initialize service
    fantasyService = new FantasyService(
      mockMLService,
      mockPlayerRepo,
      mockWeatherConnector,
      mockDatabaseService
    );
  });

  describe('getPlayerProjections', () => {
    it('should return player projections successfully', async () => {
      // Setup mocks
      const mockPlayer = {
        id: 'player1',
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        age: 28
      };

      mockPlayerRepo.findById.mockResolvedValue(mockPlayer);
      mockWeatherConnector.getGameWeather.mockResolvedValue({
        temperature: 45,
        windSpeed: 12,
        precipitation: 0,
        conditions: 'Clear'
      });

      // Execute
      const result = await fantasyService.getPlayerProjections('player1', 12);

      // Verify
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.playerId).toBe('player1');
      expect(result.data.week).toBe(12);
      expect(result.data.projectedPoints).toBeGreaterThan(0);
      expect(mockPlayerRepo.findById).toHaveBeenCalledWith('player1');
    });

    it('should handle player not found error', async () => {
      mockPlayerRepo.findById.mockResolvedValue(null);

      const result = await fantasyService.getPlayerProjections('invalid', 12);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Player not found');
    });
  });

  describe('getLineupRecommendations', () => {
    it('should return lineup recommendations', async () => {
      // Setup mock league data
      mockDatabaseService.query.mockResolvedValue([{
        id: 'league1',
        name: 'Test League',
        platform: 'ESPN',
        league_id: 'espn123',
        settings: JSON.stringify({
          leagueSize: 12,
          scoringSystem: {
            passing: { yards: 0.04, touchdowns: 4, interceptions: -2 },
            rushing: { yards: 0.1, touchdowns: 6 },
            receiving: { yards: 0.1, touchdowns: 6, receptions: 1 }
          },
          rosterPositions: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1, BENCH: 6 }
        }),
        is_active: true
      }]);

      const request = {
        userId: 'user1',
        leagueId: 'league1',
        week: 12
      };

      const result = await fantasyService.getLineupRecommendations(request);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(mockDatabaseService.query).toHaveBeenCalled();
    });
  });

  describe('getWaiverWireTargets', () => {
    it('should return waiver wire targets', async () => {
      const mockPlayer = {
        id: 'player2',
        name: 'Backup RB',
        position: 'RB',
        team: 'TEST',
        age: 24
      };

      mockPlayerRepo.findById.mockResolvedValue(mockPlayer);

      const request = {
        userId: 'user1',
        leagueId: 'league1',
        week: 12,
        availablePlayers: ['player2']
      };

      const result = await fantasyService.getWaiverWireTargets(request);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('analyzeTradeProposal', () => {
    it('should analyze trade proposal', async () => {
      const tradeProposal = {
        id: 'trade1',
        givingPlayers: [{
          playerId: 'player1',
          name: 'Josh Allen',
          position: 'QB' as const,
          team: 'BUF',
          fantasyPosition: 'QB' as const,
          isStarter: true,
          projectedPoints: 24.5,
          seasonProjection: 380,
          value: 95,
          trend: 'UP' as const,
          injuryStatus: 'HEALTHY' as const,
          byeWeek: 12
        }],
        receivingPlayers: [{
          playerId: 'player2',
          name: 'Lamar Jackson',
          position: 'QB' as const,
          team: 'BAL',
          fantasyPosition: 'QB' as const,
          isStarter: true,
          projectedPoints: 23.8,
          seasonProjection: 370,
          value: 92,
          trend: 'STABLE' as const,
          injuryStatus: 'HEALTHY' as const,
          byeWeek: 14
        }],
        proposedBy: 'user1',
        proposedTo: 'user2',
        status: 'PENDING' as const,
        createdAt: new Date()
      };

      const request = {
        userId: 'user1',
        leagueId: 'league1',
        trade: tradeProposal
      };

      const result = await fantasyService.analyzeTradeProposal(request);

      expect(result.success).toBe(true);
      expect(result.data.recommendation).toMatch(/ACCEPT|REJECT|COUNTER/);
      expect(typeof result.data.fairValue).toBe('number');
    });
  });
});
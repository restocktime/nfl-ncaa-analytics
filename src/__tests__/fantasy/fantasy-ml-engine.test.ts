import { FantasyMLEngine } from '../../core/fantasy-ml-engine';
import { MLModelService } from '../../core/ml-model-service';
import { WeatherAPIConnector } from '../../core/weather-api-connector';
import { DatabaseService } from '../../core/database-service';

describe('FantasyMLEngine', () => {
  let fantasyMLEngine: FantasyMLEngine;
  let mockMLService: jest.Mocked<MLModelService>;
  let mockWeatherConnector: jest.Mocked<WeatherAPIConnector>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockMLService = {
      trainModel: jest.fn(),
      evaluateModel: jest.fn(),
      getModelMetrics: jest.fn()
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

    fantasyMLEngine = new FantasyMLEngine(
      mockMLService,
      mockWeatherConnector,
      mockDatabaseService
    );
  });

  describe('predictFantasyPoints', () => {
    it('should predict fantasy points for a player', async () => {
      const mockPlayer = {
        id: 'player1',
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        age: 28
      };

      const mockMatchup = {
        homeTeam: 'BUF',
        awayTeam: 'MIA',
        week: 12,
        season: 2024,
        isHomeGame: true
      };

      const mockWeather = {
        temperature: 45,
        windSpeed: 12,
        precipitation: 0,
        conditions: 'Clear'
      };

      // Mock the ML service response
      mockMLService.predictPlayerPerformance = jest.fn().mockResolvedValue({
        passingYards: 280,
        passingTDs: 2.1,
        interceptions: 0.8,
        rushingYards: 45,
        rushingTDs: 0.6
      });

      const result = await fantasyMLEngine.predictFantasyPoints(
        mockPlayer,
        mockMatchup,
        mockWeather
      );

      expect(result).toBeDefined();
      expect(result.projectedPoints).toBeGreaterThan(0);
      expect(result.ceiling).toBeGreaterThan(result.projectedPoints);
      expect(result.floor).toBeLessThan(result.projectedPoints);
      expect(result.confidenceInterval).toHaveLength(2);
      expect(result.variance).toBeGreaterThan(0);
    });

    it('should handle different positions correctly', async () => {
      const mockRB = {
        id: 'player2',
        name: 'Saquon Barkley',
        position: 'RB',
        team: 'PHI',
        age: 27
      };

      const mockMatchup = {
        homeTeam: 'PHI',
        awayTeam: 'WAS',
        week: 12,
        season: 2024,
        isHomeGame: true
      };

      mockMLService.predictPlayerPerformance = jest.fn().mockResolvedValue({
        rushingYards: 120,
        rushingTDs: 1.2,
        receptions: 4,
        receivingYards: 35,
        receivingTDs: 0.3
      });

      const result = await fantasyMLEngine.predictFantasyPoints(
        mockRB,
        mockMatchup
      );

      expect(result.projectedPoints).toBeGreaterThan(0);
      // RB should have different scoring than QB
      expect(result.projectedPoints).toBeLessThan(30); // Reasonable RB range
    });
  });

  describe('calculateMatchupDifficulty', () => {
    it('should calculate matchup difficulty rating', async () => {
      const mockPlayer = {
        id: 'player1',
        name: 'Tyreek Hill',
        position: 'WR',
        team: 'MIA',
        age: 30
      };

      const mockMatchup = {
        homeTeam: 'MIA',
        awayTeam: 'BUF',
        week: 12,
        season: 2024,
        isHomeGame: true
      };

      const result = await fantasyMLEngine.calculateMatchupDifficulty(
        mockPlayer,
        mockMatchup
      );

      expect(result.overall).toBeGreaterThanOrEqual(1);
      expect(result.overall).toBeLessThanOrEqual(10);
      expect(result.passDefense).toBeGreaterThanOrEqual(1);
      expect(result.passDefense).toBeLessThanOrEqual(10);
      expect(result.rushDefense).toBeGreaterThanOrEqual(1);
      expect(result.rushDefense).toBeLessThanOrEqual(10);
      expect(Array.isArray(result.reasoning)).toBe(true);
    });
  });

  describe('assessInjuryRisk', () => {
    it('should assess injury risk for a player', async () => {
      const mockPlayer = {
        id: 'player1',
        name: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        age: 28
      };

      const result = await fantasyMLEngine.assessInjuryRisk(mockPlayer);

      expect(result.level).toMatch(/LOW|MEDIUM|HIGH/);
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(1);
      expect(result.impact).toMatch(/MINOR|MODERATE|SEVERE/);
      expect(typeof result.description).toBe('string');
    });

    it('should assign higher injury risk to RBs than QBs', async () => {
      const mockQB = {
        id: 'qb1',
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        age: 28
      };

      const mockRB = {
        id: 'rb1',
        name: 'Saquon Barkley',
        position: 'RB',
        team: 'PHI',
        age: 27
      };

      const qbRisk = await fantasyMLEngine.assessInjuryRisk(mockQB);
      const rbRisk = await fantasyMLEngine.assessInjuryRisk(mockRB);

      // RBs should generally have higher injury risk than QBs
      expect(rbRisk.probability).toBeGreaterThanOrEqual(qbRisk.probability);
    });
  });

  describe('generateProjectionRange', () => {
    it('should generate projection range with scenarios', async () => {
      const mockPlayer = {
        id: 'player1',
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        age: 28
      };

      mockMLService.predictPlayerPerformance = jest.fn().mockResolvedValue({
        passingYards: 280,
        passingTDs: 2.1,
        interceptions: 0.8,
        rushingYards: 45,
        rushingTDs: 0.6
      });

      const result = await fantasyMLEngine.generateProjectionRange(mockPlayer, 12);

      expect(result.projection).toBeDefined();
      expect(result.projection.playerId).toBe('player1');
      expect(result.projection.week).toBe(12);
      expect(result.scenarios).toBeDefined();
      expect(result.scenarios.conservative).toBeLessThan(result.scenarios.aggressive);
    });
  });
});
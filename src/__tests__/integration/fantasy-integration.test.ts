import { FantasyService } from '../../core/fantasy-service';
import { FantasyMLEngine } from '../../core/fantasy-ml-engine';
import { LineupOptimizer } from '../../core/lineup-optimizer';
import { WaiverWireAnalyzer } from '../../core/waiver-wire-analyzer';
import { TradeAnalyzer } from '../../core/trade-analyzer';
import { MLModelService } from '../../core/ml-model-service';
import { PlayerRepository } from '../../repositories/PlayerRepository';
import { WeatherAPIConnector } from '../../core/weather-api-connector';
import { DatabaseService } from '../../core/database-service';

describe('Fantasy Football Integration Tests', () => {
  let fantasyService: FantasyService;
  let fantasyMLEngine: FantasyMLEngine;
  let lineupOptimizer: LineupOptimizer;
  let waiverAnalyzer: WaiverWireAnalyzer;
  let tradeAnalyzer: TradeAnalyzer;
  
  let mockMLService: jest.Mocked<MLModelService>;
  let mockPlayerRepo: jest.Mocked<PlayerRepository>;
  let mockWeatherConnector: jest.Mocked<WeatherAPIConnector>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    // Setup mocks
    mockMLService = {
      predictPlayerPerformance: jest.fn(),
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

    // Initialize services
    fantasyMLEngine = new FantasyMLEngine(
      mockMLService,
      mockWeatherConnector,
      mockDatabaseService
    );

    fantasyService = new FantasyService(
      mockMLService,
      mockPlayerRepo,
      mockWeatherConnector,
      mockDatabaseService
    );

    lineupOptimizer = new LineupOptimizer();
    waiverAnalyzer = new WaiverWireAnalyzer(
      mockDatabaseService,
      fantasyMLEngine,
      mockPlayerRepo
    );
    tradeAnalyzer = new TradeAnalyzer(
      mockDatabaseService,
      fantasyMLEngine,
      mockPlayerRepo
    );
  });

  describe('End-to-End Fantasy Workflow', () => {
    it('should complete full fantasy analysis workflow', async () => {
      // Mock data setup
      const mockPlayer = {
        id: 'player1',
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        age: 28
      };

      const mockLeague = {
        id: 'league1',
        name: 'Test League',
        platform: 'ESPN' as const,
        leagueId: 'espn123',
        settings: {
          leagueSize: 12,
          scoringSystem: {
            passing: { yards: 0.04, touchdowns: 4, interceptions: -2 },
            rushing: { yards: 0.1, touchdowns: 6 },
            receiving: { yards: 0.1, touchdowns: 6, receptions: 1 },
            kicking: { fieldGoals: { '0-39': 3, '40-49': 4, '50+': 5 }, extraPoints: 1 },
            defense: { sacks: 1, interceptions: 2, fumbleRecoveries: 2, touchdowns: 6, safeties: 2, pointsAllowed: {} }
          },
          rosterPositions: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1, BENCH: 6 },
          tradeDeadline: new Date('2024-11-15'),
          playoffWeeks: [15, 16, 17],
          waiverSystem: 'FAAB' as const,
          faabBudget: 100
        },
        roster: {
          starters: [],
          bench: [],
          totalValue: 0,
          weeklyProjection: 0,
          strengthOfSchedule: 0
        },
        standings: {
          rank: 1,
          wins: 8,
          losses: 4,
          pointsFor: 1450,
          pointsAgainst: 1320,
          playoffProbability: 0.85,
          strengthOfSchedule: 0.52
        },
        isActive: true
      };

      // Setup mocks
      mockPlayerRepo.findById.mockResolvedValue(mockPlayer);
      mockDatabaseService.query.mockResolvedValue([{
        id: 'league1',
        name: 'Test League',
        platform: 'ESPN',
        league_id: 'espn123',
        settings: JSON.stringify(mockLeague.settings),
        is_active: true
      }]);

      mockMLService.predictPlayerPerformance.mockResolvedValue({
        passingYards: 280,
        passingTDs: 2.1,
        interceptions: 0.8,
        rushingYards: 45,
        rushingTDs: 0.6
      });

      mockWeatherConnector.getGameWeather.mockResolvedValue({
        temperature: 45,
        windSpeed: 12,
        precipitation: 0,
        conditions: 'Clear'
      });

      // 1. Test Player Projection Generation
      const projectionResult = await fantasyService.getPlayerProjections('player1', 12);
      
      expect(projectionResult.success).toBe(true);
      expect(projectionResult.data.projectedPoints).toBeGreaterThan(0);
      expect(projectionResult.data.ceiling).toBeGreaterThan(projectionResult.data.projectedPoints);
      expect(projectionResult.data.floor).toBeLessThan(projectionResult.data.projectedPoints);

      // 2. Test Lineup Optimization
      const lineupRequest = {
        userId: 'user1',
        leagueId: 'league1',
        week: 12,
        constraints: {
          maxRisk: 'MODERATE' as const
        }
      };

      const lineupResult = await fantasyService.getLineupRecommendations(lineupRequest);
      
      expect(lineupResult.success).toBe(true);
      expect(lineupResult.data).toHaveLength(1);
      expect(lineupResult.data[0].projectedPoints).toBeGreaterThan(0);

      // 3. Test Waiver Wire Analysis
      const waiverRequest = {
        userId: 'user1',
        leagueId: 'league1',
        week: 12,
        availablePlayers: ['player2', 'player3', 'player4']
      };

      const waiverResult = await fantasyService.getWaiverWireTargets(waiverRequest);
      
      expect(waiverResult.success).toBe(true);
      expect(Array.isArray(waiverResult.data)).toBe(true);

      // 4. Test Trade Analysis
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

      const tradeRequest = {
        userId: 'user1',
        leagueId: 'league1',
        trade: tradeProposal
      };

      const tradeResult = await fantasyService.analyzeTradeProposal(tradeRequest);
      
      expect(tradeResult.success).toBe(true);
      expect(tradeResult.data.recommendation).toMatch(/ACCEPT|REJECT|COUNTER/);
      expect(typeof tradeResult.data.fairValue).toBe('number');

      // 5. Test Weekly Strategy Generation
      const strategyResult = await fantasyService.getWeeklyStrategy('user1', 12);
      
      expect(strategyResult.success).toBe(true);
      expect(strategyResult.data.week).toBe(12);
      expect(Array.isArray(strategyResult.data.priorities)).toBe(true);
      expect(Array.isArray(strategyResult.data.lineupRecommendations)).toBe(true);

      console.log('✅ Fantasy Football Integration Test completed successfully');
    });

    it('should handle error scenarios gracefully', async () => {
      // Test with invalid player ID
      mockPlayerRepo.findById.mockResolvedValue(null);

      const projectionResult = await fantasyService.getPlayerProjections('invalid', 12);
      
      expect(projectionResult.success).toBe(false);
      expect(projectionResult.error).toContain('Player not found');

      // Test with invalid league ID
      mockDatabaseService.query.mockResolvedValue([]);

      const lineupRequest = {
        userId: 'user1',
        leagueId: 'invalid',
        week: 12
      };

      const lineupResult = await fantasyService.getLineupRecommendations(lineupRequest);
      
      expect(lineupResult.success).toBe(false);
      expect(lineupResult.error).toContain('League not found');
    });
  });

  describe('Fantasy ML Engine Integration', () => {
    it('should generate accurate fantasy projections', async () => {
      const mockPlayer = {
        id: 'player1',
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

      mockMLService.predictPlayerPerformance.mockResolvedValue({
        rushingYards: 120,
        rushingTDs: 1.2,
        receptions: 4,
        receivingYards: 35,
        receivingTDs: 0.3
      });

      mockWeatherConnector.getGameWeather.mockResolvedValue({
        temperature: 55,
        windSpeed: 8,
        precipitation: 0,
        conditions: 'Partly Cloudy'
      });

      const prediction = await fantasyMLEngine.predictFantasyPoints(
        mockPlayer,
        mockMatchup
      );

      expect(prediction.projectedPoints).toBeGreaterThan(10);
      expect(prediction.ceiling).toBeGreaterThan(prediction.projectedPoints);
      expect(prediction.floor).toBeLessThan(prediction.projectedPoints);
      expect(prediction.confidenceInterval).toHaveLength(2);
      expect(prediction.variance).toBeGreaterThan(0);
    });

    it('should calculate matchup difficulty accurately', async () => {
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

      const matchupRating = await fantasyMLEngine.calculateMatchupDifficulty(
        mockPlayer,
        mockMatchup
      );

      expect(matchupRating.overall).toBeGreaterThanOrEqual(1);
      expect(matchupRating.overall).toBeLessThanOrEqual(10);
      expect(matchupRating.passDefense).toBeGreaterThanOrEqual(1);
      expect(matchupRating.passDefense).toBeLessThanOrEqual(10);
      expect(Array.isArray(matchupRating.reasoning)).toBe(true);
    });
  });

  describe('Lineup Optimizer Integration', () => {
    it('should optimize lineup with constraints', async () => {
      const mockPlayers = [
        {
          playerId: 'qb1',
          name: 'Josh Allen',
          position: 'QB' as const,
          team: 'BUF',
          fantasyPosition: 'QB' as const,
          isStarter: false,
          projectedPoints: 24.5,
          seasonProjection: 380,
          value: 95,
          trend: 'UP' as const,
          injuryStatus: 'HEALTHY' as const,
          byeWeek: 12
        },
        {
          playerId: 'rb1',
          name: 'Saquon Barkley',
          position: 'RB' as const,
          team: 'PHI',
          fantasyPosition: 'RB' as const,
          isStarter: false,
          projectedPoints: 18.2,
          seasonProjection: 290,
          value: 88,
          trend: 'UP' as const,
          injuryStatus: 'HEALTHY' as const,
          byeWeek: 7
        }
      ];

      const mockProjections = mockPlayers.map(player => ({
        playerId: player.playerId,
        week: 12,
        projectedPoints: player.projectedPoints,
        confidenceInterval: [player.projectedPoints * 0.8, player.projectedPoints * 1.2] as [number, number],
        ceiling: player.projectedPoints * 1.5,
        floor: player.projectedPoints * 0.6,
        matchupRating: {
          overall: 7,
          passDefense: 6,
          rushDefense: 8,
          redZoneDefense: 7,
          homeAwayImpact: 0.5,
          pace: 5,
          reasoning: ['Favorable matchup']
        },
        injuryRisk: {
          level: 'LOW' as const,
          probability: 0.1,
          impact: 'MINOR' as const,
          description: 'No concerns'
        },
        weatherImpact: {
          temperature: 60,
          windSpeed: 5,
          precipitation: 0,
          impact: 0,
          description: 'No impact'
        },
        usage: {
          snapShare: 0.75
        },
        gameScript: {
          gameScript: 'NEUTRAL' as const,
          impact: 0,
          reasoning: 'Even game expected'
        }
      }));

      const constraints = {
        positions: { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DEF: 1 },
        maxRisk: 'MODERATE' as const
      };

      const optimizedLineup = await lineupOptimizer.optimizeLineup(
        mockPlayers,
        mockProjections,
        constraints
      );

      expect(optimizedLineup.QB).toBeDefined();
      expect(optimizedLineup.RB).toHaveLength(2);
      expect(optimizedLineup.WR).toHaveLength(2);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      // Generate large dataset
      const largePlayers = Array.from({ length: 500 }, (_, i) => ({
        playerId: `player${i}`,
        name: `Player ${i}`,
        position: ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'][i % 6] as const,
        team: 'TEST',
        fantasyPosition: ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'][i % 6] as const,
        isStarter: false,
        projectedPoints: 10 + Math.random() * 15,
        seasonProjection: 150 + Math.random() * 200,
        value: 50 + Math.random() * 50,
        trend: 'STABLE' as const,
        injuryStatus: 'HEALTHY' as const,
        byeWeek: (i % 17) + 1
      }));

      mockPlayerRepo.findById.mockImplementation(async (id) => ({
        id,
        name: `Player ${id}`,
        position: 'RB',
        team: 'TEST',
        age: 25
      }));

      mockMLService.predictPlayerPerformance.mockResolvedValue({
        rushingYards: 80,
        rushingTDs: 0.8,
        receptions: 3,
        receivingYards: 25
      });

      const waiverRequest = {
        userId: 'user1',
        leagueId: 'league1',
        week: 12,
        availablePlayers: largePlayers.slice(0, 100).map(p => p.playerId)
      };

      const result = await fantasyService.getWaiverWireTargets(waiverRequest);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      console.log(`✅ Processed ${largePlayers.length} players in ${executionTime}ms`);
    });
  });
});
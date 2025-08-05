import 'reflect-metadata';
import { ProspectAnalysisService } from '../../core/prospect-analysis-service';
import { 
  ProspectAnalysis, 
  DraftRound, 
  ReadinessLevel, 
  SchemeType 
} from '../../models/ProspectAnalysis';
import { Position } from '../../types/common.types';
import { Team } from '../../types/team.types';

describe('ProspectAnalysisService', () => {
  let service: ProspectAnalysisService;
  let mockNFLTeams: Team[];
  let mockCollegeStats: any[];
  let mockHistoricalData: any[];

  beforeEach(() => {
    service = new ProspectAnalysisService();

    // Mock NFL teams
    mockNFLTeams = [
      {
        id: 'team-1',
        name: 'Team One',
        abbreviation: 'T1',
        city: 'City One',
        conference: 'NFC',
        division: 'North',
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
        statistics: {} as any,
        homeVenue: 'venue-1'
      },
      {
        id: 'team-2',
        name: 'Team Two',
        abbreviation: 'T2',
        city: 'City Two',
        conference: 'AFC',
        division: 'South',
        logo: 'logo2.png',
        primaryColor: '#0000FF',
        secondaryColor: '#FFFFFF',
        roster: [],
        coaching: {
          headCoach: {
            id: 'coach-2',
            name: 'Coach Two',
            position: 'Head Coach',
            experience: 8,
            previousTeams: []
          },
          offensiveCoordinator: {
            id: 'oc-2',
            name: 'OC Two',
            position: 'Offensive Coordinator',
            experience: 6,
            previousTeams: []
          },
          defensiveCoordinator: {
            id: 'dc-2',
            name: 'DC Two',
            position: 'Defensive Coordinator',
            experience: 9,
            previousTeams: []
          },
          specialTeamsCoordinator: {
            id: 'st-2',
            name: 'ST Two',
            position: 'Special Teams Coordinator',
            experience: 4,
            previousTeams: []
          },
          assistants: []
        },
        statistics: {} as any,
        homeVenue: 'venue-2'
      }
    ];

    // Mock college stats for a QB
    mockCollegeStats = [
      {
        playerId: 'prospect-1',
        season: 2023,
        games: 12,
        passingYards: 3500,
        passingTouchdowns: 28,
        interceptions: 8,
        completionPercentage: 0.68,
        rushingYards: 450,
        rushingTouchdowns: 6,
        height: 75, // 6'3"
        weight: 220,
        fortyYardDash: 4.6
      },
      {
        playerId: 'prospect-1',
        season: 2022,
        games: 11,
        passingYards: 2800,
        passingTouchdowns: 22,
        interceptions: 12,
        completionPercentage: 0.62,
        rushingYards: 380,
        rushingTouchdowns: 4,
        height: 75,
        weight: 215,
        fortyYardDash: 4.65
      }
    ];

    // Mock historical draft data
    mockHistoricalData = [
      {
        playerId: 'historical-1',
        playerName: 'Historical QB 1',
        position: Position.QB,
        college: 'State University',
        draftYear: 2020,
        draftRound: DraftRound.FIRST,
        draftPick: 15,
        collegeStats: [
          {
            playerId: 'historical-1',
            season: 2019,
            games: 13,
            passingYards: 3800,
            passingTouchdowns: 32,
            interceptions: 6,
            completionPercentage: 0.71,
            rushingYards: 520,
            rushingTouchdowns: 8
          }
        ],
        nflOutcome: 'Pro Bowl',
        careerStats: {}
      },
      {
        playerId: 'historical-2',
        playerName: 'Historical QB 2',
        position: Position.QB,
        college: 'Tech University',
        draftYear: 2019,
        draftRound: DraftRound.THIRD,
        draftPick: 85,
        collegeStats: [
          {
            playerId: 'historical-2',
            season: 2018,
            games: 12,
            passingYards: 3200,
            passingTouchdowns: 24,
            interceptions: 14,
            completionPercentage: 0.59,
            rushingYards: 200,
            rushingTouchdowns: 2
          }
        ],
        nflOutcome: 'Backup',
        careerStats: {}
      },
      {
        playerId: 'historical-3',
        playerName: 'Historical RB 1',
        position: Position.RB,
        college: 'State University',
        draftYear: 2021,
        draftRound: DraftRound.SECOND,
        draftPick: 45,
        collegeStats: [
          {
            playerId: 'historical-3',
            season: 2020,
            games: 10,
            rushingYards: 1800,
            rushingTouchdowns: 18,
            receivingYards: 450,
            receivingTouchdowns: 3,
            receptions: 35
          }
        ],
        nflOutcome: 'Solid starter',
        careerStats: {}
      }
    ];
  });

  describe('analyzeProspect', () => {
    it('should analyze a QB prospect correctly', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4, // Senior
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      expect(result).toBeInstanceOf(ProspectAnalysis);
      expect(result.playerId).toBe('prospect-1');
      expect(result.playerName).toBe('Test QB');
      expect(result.position).toBe(Position.QB);
      expect(result.college).toBe('State University');
      expect(result.collegeYear).toBe(4);
      
      expect(result.draftProjection).toBeDefined();
      expect(result.nflReadiness).toBeDefined();
      expect(result.teamFitAnalysis).toHaveLength(2); // Two mock teams
      expect(result.comparablePlayerAnalysis.length).toBeGreaterThan(0);
      expect(result.bustRisk).toBeGreaterThanOrEqual(0);
      expect(result.bustRisk).toBeLessThanOrEqual(100);
    });

    it('should handle prospects with limited historical data', async () => {
      const result = await service.analyzeProspect(
        'prospect-2',
        'Test WR',
        Position.WR,
        'Small College',
        3,
        [{
          playerId: 'prospect-2',
          season: 2023,
          games: 10,
          receivingYards: 800,
          receivingTouchdowns: 8,
          receptions: 55
        }],
        [], // No historical data
        mockNFLTeams
      );

      expect(result).toBeInstanceOf(ProspectAnalysis);
      expect(result.draftProjection.projectedRound).toBe(DraftRound.FOURTH);
      expect(result.draftProjection.confidence).toBe(0.3);
      expect(result.comparablePlayerAnalysis).toHaveLength(0);
    });

    it('should calculate overall grade correctly', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      const overallGrade = result.getOverallGrade();
      expect(overallGrade).toBeGreaterThanOrEqual(0);
      expect(overallGrade).toBeLessThanOrEqual(100);
    });

    it('should identify best team fit', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      const bestFit = result.getBestTeamFit();
      expect(bestFit).toBeDefined();
      expect(bestFit!.teamId).toBeDefined();
      expect(bestFit!.overallFit).toBeGreaterThanOrEqual(0);
      expect(bestFit!.overallFit).toBeLessThanOrEqual(100);
    });

    it('should find comparable players', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      expect(result.comparablePlayerAnalysis.length).toBeGreaterThan(0);
      
      const mostSimilar = result.getMostSimilarPlayer();
      expect(mostSimilar).toBeDefined();
      expect(mostSimilar!.position).toBe(Position.QB);
      expect(mostSimilar!.similarityScore).toBeGreaterThan(0);
      expect(mostSimilar!.similarityScore).toBeLessThanOrEqual(1);
    });

    it('should assess NFL readiness appropriately', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4, // Senior year
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      expect(result.nflReadiness.level).toBeDefined();
      expect(result.nflReadiness.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.nflReadiness.overallScore).toBeLessThanOrEqual(100);
      expect(result.nflReadiness.physicalReadiness).toBeGreaterThanOrEqual(0);
      expect(result.nflReadiness.mentalReadiness).toBeGreaterThanOrEqual(0);
      expect(result.nflReadiness.technicalSkills).toBeGreaterThanOrEqual(0);
    });

    it('should handle error cases gracefully', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      await expect(
        service.analyzeProspect(
          'prospect-1',
          'Test QB',
          Position.QB,
          'State University',
          4,
          mockCollegeStats,
          mockHistoricalData,
          mockNFLTeams
        )
      ).resolves.toBeDefined();

      loggerSpy.mockRestore();
    });
  });

  describe('draft projection', () => {
    it('should project higher for better performance', async () => {
      const highPerformanceStats = [{
        playerId: 'prospect-elite',
        season: 2023,
        games: 12,
        passingYards: 4500,
        passingTouchdowns: 40,
        interceptions: 4,
        completionPercentage: 0.75,
        rushingYards: 600,
        rushingTouchdowns: 10
      }];

      const result = await service.analyzeProspect(
        'prospect-elite',
        'Elite QB',
        Position.QB,
        'State University',
        4,
        highPerformanceStats,
        mockHistoricalData,
        mockNFLTeams
      );

      // Should project better than average
      expect(result.draftProjection.projectedRound).toBeLessThanOrEqual(DraftRound.THIRD);
    });

    it('should handle different positions correctly', async () => {
      const rbStats = [{
        playerId: 'prospect-rb',
        season: 2023,
        games: 12,
        rushingYards: 1500,
        rushingTouchdowns: 15,
        receivingYards: 400,
        receivingTouchdowns: 3,
        receptions: 30
      }];

      const result = await service.analyzeProspect(
        'prospect-rb',
        'Test RB',
        Position.RB,
        'State University',
        3,
        rbStats,
        mockHistoricalData,
        mockNFLTeams
      );

      expect(result.position).toBe(Position.RB);
      expect(result.draftProjection).toBeDefined();
    });
  });

  describe('team fit analysis', () => {
    it('should analyze fit for all teams', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      expect(result.teamFitAnalysis).toHaveLength(mockNFLTeams.length);
      
      result.teamFitAnalysis.forEach(fit => {
        expect(fit.teamId).toBeDefined();
        expect(fit.teamName).toBeDefined();
        expect(fit.overallFit).toBeGreaterThanOrEqual(0);
        expect(fit.overallFit).toBeLessThanOrEqual(100);
        expect(fit.schemeFit).toBeGreaterThanOrEqual(0);
        expect(fit.positionalNeed).toBeGreaterThanOrEqual(0);
        expect(fit.culturalFit).toBeGreaterThanOrEqual(0);
        expect(fit.primaryScheme).toBeDefined();
      });
    });

    it('should sort teams by fit quality', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      // Should be sorted by overall fit (descending)
      for (let i = 1; i < result.teamFitAnalysis.length; i++) {
        expect(result.teamFitAnalysis[i-1].overallFit).toBeGreaterThanOrEqual(
          result.teamFitAnalysis[i].overallFit
        );
      }
    });

    it('should identify excellent fit teams', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      const excellentFits = result.getExcellentFitTeams();
      excellentFits.forEach(fit => {
        expect(fit.overallFit).toBeGreaterThanOrEqual(85);
        expect(fit.isExcellentFit()).toBe(true);
      });
    });
  });

  describe('comparable player analysis', () => {
    it('should find similar players from same position', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      result.comparablePlayerAnalysis.forEach(comp => {
        expect(comp.position).toBe(Position.QB);
        expect(comp.similarityScore).toBeGreaterThan(0);
        expect(comp.similarityScore).toBeLessThanOrEqual(1);
      });
    });

    it('should identify successful comparables', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      const successfulComps = result.getSuccessfulComparables();
      successfulComps.forEach(comp => {
        expect(comp.hadNFLSuccess()).toBe(true);
      });
    });

    it('should handle position with no historical data', async () => {
      const result = await service.analyzeProspect(
        'prospect-k',
        'Test Kicker',
        Position.K,
        'State University',
        4,
        [{
          playerId: 'prospect-k',
          season: 2023,
          games: 12
        }],
        mockHistoricalData, // No kickers in historical data
        mockNFLTeams
      );

      expect(result.comparablePlayerAnalysis).toHaveLength(0);
    });
  });

  describe('risk assessment', () => {
    it('should calculate bust risk appropriately', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      expect(result.bustRisk).toBeGreaterThanOrEqual(0);
      expect(result.bustRisk).toBeLessThanOrEqual(100);
      
      const riskLevel = result.getRiskAssessment();
      expect(['Low', 'Medium', 'High']).toContain(riskLevel);
    });

    it('should assess early round worthiness', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      const isEarlyRoundWorthy = result.isEarlyRoundWorthy();
      expect(typeof isEarlyRoundWorthy).toBe('boolean');
    });
  });

  describe('development projection', () => {
    it('should provide development timeline and projections', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      const projection = result.getDevelopmentProjection();
      expect(projection.timeline).toBeGreaterThanOrEqual(0);
      expect(projection.ceiling).toBeDefined();
      expect(projection.floor).toBeDefined();
      expect(typeof projection.ceiling).toBe('string');
      expect(typeof projection.floor).toBe('string');
    });

    it('should correlate timeline with readiness level', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      const timeline = result.nflReadiness.getDevelopmentTimeline();
      const projection = result.getDevelopmentProjection();
      
      expect(projection.timeline).toBe(timeline);
    });
  });

  describe('edge cases and validation', () => {
    it('should handle empty college stats', async () => {
      const result = await service.analyzeProspect(
        'prospect-empty',
        'Empty Stats Player',
        Position.QB,
        'State University',
        2,
        [], // Empty stats
        mockHistoricalData,
        mockNFLTeams
      );

      expect(result).toBeInstanceOf(ProspectAnalysis);
      expect(result.draftProjection).toBeDefined();
      expect(result.nflReadiness).toBeDefined();
    });

    it('should handle invalid college year', async () => {
      const result = await service.analyzeProspect(
        'prospect-invalid',
        'Invalid Year Player',
        Position.QB,
        'State University',
        0, // Invalid year
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      expect(result).toBeInstanceOf(ProspectAnalysis);
      expect(result.collegeYear).toBe(0);
    });

    it('should handle no NFL teams', async () => {
      const result = await service.analyzeProspect(
        'prospect-no-teams',
        'No Teams Player',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        [] // No teams
      );

      expect(result.teamFitAnalysis).toHaveLength(0);
      expect(result.getBestTeamFit()).toBeNull();
    });

    it('should maintain data consistency', async () => {
      const result = await service.analyzeProspect(
        'prospect-1',
        'Test QB',
        Position.QB,
        'State University',
        4,
        mockCollegeStats,
        mockHistoricalData,
        mockNFLTeams
      );

      // Validate all nested objects are properly instantiated
      expect(result.draftProjection.getDraftValue).toBeDefined();
      expect(result.nflReadiness.getCompositeScore).toBeDefined();
      
      result.teamFitAnalysis.forEach(fit => {
        expect(fit.isGoodFit).toBeDefined();
      });
      
      result.comparablePlayerAnalysis.forEach(comp => {
        expect(comp.isHighlySimilar).toBeDefined();
      });
    });
  });
});
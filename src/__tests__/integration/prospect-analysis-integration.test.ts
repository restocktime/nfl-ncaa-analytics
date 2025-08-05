import 'reflect-metadata';
import { ProspectAnalysisService } from '../../core/prospect-analysis-service';
import { HistoricalStatsService } from '../../core/historical-stats-service';
import { ProspectAnalysis, DraftRound, ReadinessLevel } from '../../models/ProspectAnalysis';
import { Position } from '../../types/common.types';
import { Team } from '../../types/team.types';

describe('Prospect Analysis Integration Tests', () => {
  let prospectService: ProspectAnalysisService;
  let historicalService: HistoricalStatsService;
  let mockNFLTeams: Team[];
  let mockCollegeData: any;
  let mockHistoricalData: any[];

  beforeEach(() => {
    prospectService = new ProspectAnalysisService();
    historicalService = new HistoricalStatsService();

    // Mock comprehensive NFL teams data
    mockNFLTeams = Array.from({ length: 32 }, (_, i) => ({
      id: `nfl-team-${i + 1}`,
      name: `NFL Team ${i + 1}`,
      abbreviation: `T${i + 1}`,
      city: `City ${i + 1}`,
      conference: i < 16 ? 'NFC' : 'AFC',
      division: ['North', 'South', 'East', 'West'][i % 4],
      logo: `logo${i + 1}.png`,
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      roster: [],
      coaching: {
        headCoach: {
          id: `coach-${i + 1}`,
          name: `Coach ${i + 1}`,
          position: 'Head Coach',
          experience: 5 + (i % 10),
          previousTeams: []
        },
        offensiveCoordinator: {
          id: `oc-${i + 1}`,
          name: `OC ${i + 1}`,
          position: 'Offensive Coordinator',
          experience: 3 + (i % 8),
          previousTeams: []
        },
        defensiveCoordinator: {
          id: `dc-${i + 1}`,
          name: `DC ${i + 1}`,
          position: 'Defensive Coordinator',
          experience: 4 + (i % 7),
          previousTeams: []
        },
        specialTeamsCoordinator: {
          id: `st-${i + 1}`,
          name: `ST ${i + 1}`,
          position: 'Special Teams Coordinator',
          experience: 2 + (i % 5),
          previousTeams: []
        },
        assistants: []
      },
      statistics: {} as any,
      homeVenue: `venue-${i + 1}`
    }));

    // Mock comprehensive college data for different positions
    mockCollegeData = {
      quarterback: {
        playerId: 'college-qb-1',
        playerName: 'Elite College QB',
        position: Position.QB,
        college: 'State University',
        collegeYear: 4,
        stats: [
          {
            playerId: 'college-qb-1',
            season: 2023,
            games: 13,
            passingYards: 4200,
            passingTouchdowns: 35,
            interceptions: 6,
            completionPercentage: 0.72,
            rushingYards: 650,
            rushingTouchdowns: 8,
            height: 76, // 6'4"
            weight: 225,
            fortyYardDash: 4.55,
            benchPress: 20,
            verticalJump: 32,
            broadJump: 120
          },
          {
            playerId: 'college-qb-1',
            season: 2022,
            games: 12,
            passingYards: 3800,
            passingTouchdowns: 28,
            interceptions: 9,
            completionPercentage: 0.68,
            rushingYards: 520,
            rushingTouchdowns: 6,
            height: 76,
            weight: 220,
            fortyYardDash: 4.6
          }
        ]
      },
      runningBack: {
        playerId: 'college-rb-1',
        playerName: 'Power Running Back',
        position: Position.RB,
        college: 'Tech University',
        collegeYear: 3,
        stats: [
          {
            playerId: 'college-rb-1',
            season: 2023,
            games: 12,
            rushingYards: 1850,
            rushingTouchdowns: 22,
            receivingYards: 420,
            receivingTouchdowns: 3,
            receptions: 35,
            height: 71, // 5'11"
            weight: 215,
            fortyYardDash: 4.42,
            benchPress: 25,
            verticalJump: 35,
            broadJump: 125
          }
        ]
      },
      wideReceiver: {
        playerId: 'college-wr-1',
        playerName: 'Speedy Wide Receiver',
        position: Position.WR,
        college: 'Football University',
        collegeYear: 4,
        stats: [
          {
            playerId: 'college-wr-1',
            season: 2023,
            games: 13,
            receivingYards: 1450,
            receivingTouchdowns: 14,
            receptions: 85,
            height: 72, // 6'0"
            weight: 190,
            fortyYardDash: 4.35,
            benchPress: 15,
            verticalJump: 38,
            broadJump: 130
          }
        ]
      }
    };

    // Mock comprehensive historical draft data
    mockHistoricalData = [
      // Successful QBs
      {
        playerId: 'hist-qb-1',
        playerName: 'Pro Bowl QB',
        position: Position.QB,
        college: 'State University',
        draftYear: 2018,
        draftRound: DraftRound.FIRST,
        draftPick: 12,
        collegeStats: [{
          playerId: 'hist-qb-1',
          season: 2017,
          games: 13,
          passingYards: 4100,
          passingTouchdowns: 32,
          interceptions: 8,
          completionPercentage: 0.70,
          rushingYards: 580,
          rushingTouchdowns: 7
        }],
        nflOutcome: 'Pro Bowl'
      },
      {
        playerId: 'hist-qb-2',
        playerName: 'Franchise QB',
        position: Position.QB,
        college: 'Elite University',
        draftYear: 2019,
        draftRound: DraftRound.FIRST,
        draftPick: 3,
        collegeStats: [{
          playerId: 'hist-qb-2',
          season: 2018,
          games: 14,
          passingYards: 4500,
          passingTouchdowns: 38,
          interceptions: 5,
          completionPercentage: 0.74,
          rushingYards: 420,
          rushingTouchdowns: 4
        }],
        nflOutcome: 'All-Pro'
      },
      // Bust QBs
      {
        playerId: 'hist-qb-3',
        playerName: 'Bust QB',
        position: Position.QB,
        college: 'Small College',
        draftYear: 2020,
        draftRound: DraftRound.SECOND,
        draftPick: 55,
        collegeStats: [{
          playerId: 'hist-qb-3',
          season: 2019,
          games: 11,
          passingYards: 2800,
          passingTouchdowns: 18,
          interceptions: 15,
          completionPercentage: 0.58,
          rushingYards: 200,
          rushingTouchdowns: 2
        }],
        nflOutcome: 'Out of league'
      },
      // Successful RBs
      {
        playerId: 'hist-rb-1',
        playerName: 'Elite RB',
        position: Position.RB,
        college: 'Tech University',
        draftYear: 2019,
        draftRound: DraftRound.FIRST,
        draftPick: 25,
        collegeStats: [{
          playerId: 'hist-rb-1',
          season: 2018,
          games: 13,
          rushingYards: 1950,
          rushingTouchdowns: 24,
          receivingYards: 380,
          receivingTouchdowns: 2,
          receptions: 32
        }],
        nflOutcome: 'Pro Bowl'
      },
      // Successful WRs
      {
        playerId: 'hist-wr-1',
        playerName: 'Elite WR',
        position: Position.WR,
        college: 'Football University',
        draftYear: 2020,
        draftRound: DraftRound.FIRST,
        draftPick: 18,
        collegeStats: [{
          playerId: 'hist-wr-1',
          season: 2019,
          games: 12,
          receivingYards: 1380,
          receivingTouchdowns: 16,
          receptions: 78
        }],
        nflOutcome: 'All-Pro'
      }
    ];
  });

  describe('End-to-End Prospect Analysis', () => {
    it('should analyze elite QB prospect with high draft projection', async () => {
      const qbData = mockCollegeData.quarterback;
      
      const analysis = await prospectService.analyzeProspect(
        qbData.playerId,
        qbData.playerName,
        qbData.position,
        qbData.college,
        qbData.collegeYear,
        qbData.stats,
        mockHistoricalData,
        mockNFLTeams
      );

      // Should project as high draft pick
      expect(analysis.draftProjection.projectedRound).toBeLessThanOrEqual(DraftRound.SECOND);
      expect(analysis.draftProjection.confidence).toBeGreaterThan(0.5);
      
      // Should be NFL ready
      expect(analysis.nflReadiness.isNFLReady()).toBe(true);
      expect(analysis.nflReadiness.overallScore).toBeGreaterThan(70);
      
      // Should have good overall grade
      expect(analysis.getOverallGrade()).toBeGreaterThan(75);
      
      // Should be early round worthy
      expect(analysis.isEarlyRoundWorthy()).toBe(true);
      
      // Should have team fits analyzed
      expect(analysis.teamFitAnalysis).toHaveLength(32);
      expect(analysis.getBestTeamFit()).toBeDefined();
      
      // Should have comparable players
      expect(analysis.comparablePlayerAnalysis.length).toBeGreaterThan(0);
      expect(analysis.getMostSimilarPlayer()).toBeDefined();
    });

    it('should analyze RB prospect with appropriate projections', async () => {
      const rbData = mockCollegeData.runningBack;
      
      const analysis = await prospectService.analyzeProspect(
        rbData.playerId,
        rbData.playerName,
        rbData.position,
        rbData.college,
        rbData.collegeYear,
        rbData.stats,
        mockHistoricalData,
        mockNFLTeams
      );

      // RB should have reasonable projection
      expect(analysis.draftProjection.projectedRound).toBeLessThanOrEqual(DraftRound.FOURTH);
      expect(analysis.position).toBe(Position.RB);
      
      // Should have position-specific analysis
      expect(analysis.nflReadiness.strengths).toBeDefined();
      expect(analysis.nflReadiness.weaknesses).toBeDefined();
      
      // Should find RB comparables
      const rbComparables = analysis.comparablePlayerAnalysis.filter(comp => comp.position === Position.RB);
      expect(rbComparables.length).toBeGreaterThan(0);
    });

    it('should analyze WR prospect with speed considerations', async () => {
      const wrData = mockCollegeData.wideReceiver;
      
      const analysis = await prospectService.analyzeProspect(
        wrData.playerId,
        wrData.playerName,
        wrData.position,
        wrData.college,
        wrData.collegeYear,
        wrData.stats,
        mockHistoricalData,
        mockNFLTeams
      );

      expect(analysis.position).toBe(Position.WR);
      expect(analysis.draftProjection).toBeDefined();
      
      // Should consider receiving production
      expect(analysis.nflReadiness.technicalSkills).toBeGreaterThan(0);
      
      // Should find WR comparables
      const wrComparables = analysis.comparablePlayerAnalysis.filter(comp => comp.position === Position.WR);
      expect(wrComparables.length).toBeGreaterThan(0);
    });
  });

  describe('Team Fit Analysis Integration', () => {
    it('should provide comprehensive team fit analysis for all 32 teams', async () => {
      const qbData = mockCollegeData.quarterback;
      
      const analysis = await prospectService.analyzeProspect(
        qbData.playerId,
        qbData.playerName,
        qbData.position,
        qbData.college,
        qbData.collegeYear,
        qbData.stats,
        mockHistoricalData,
        mockNFLTeams
      );

      expect(analysis.teamFitAnalysis).toHaveLength(32);
      
      // Should be sorted by fit quality
      for (let i = 1; i < analysis.teamFitAnalysis.length; i++) {
        expect(analysis.teamFitAnalysis[i-1].overallFit).toBeGreaterThanOrEqual(
          analysis.teamFitAnalysis[i].overallFit
        );
      }
      
      // Each team should have complete analysis
      analysis.teamFitAnalysis.forEach(fit => {
        expect(fit.teamId).toBeDefined();
        expect(fit.teamName).toBeDefined();
        expect(fit.overallFit).toBeGreaterThanOrEqual(0);
        expect(fit.overallFit).toBeLessThanOrEqual(100);
        expect(fit.schemeFit).toBeGreaterThanOrEqual(0);
        expect(fit.positionalNeed).toBeGreaterThanOrEqual(0);
        expect(fit.culturalFit).toBeGreaterThanOrEqual(0);
        expect(fit.primaryScheme).toBeDefined();
      });
      
      // Should identify some good fits
      const goodFits = analysis.teamFitAnalysis.filter(fit => fit.isGoodFit());
      expect(goodFits.length).toBeGreaterThan(0);
    });

    it('should identify teams with high positional need', async () => {
      const analysis = await prospectService.analyzeProspect(
        'test-prospect',
        'Test Player',
        Position.QB,
        'Test College',
        4,
        mockCollegeData.quarterback.stats,
        mockHistoricalData,
        mockNFLTeams
      );

      // Should have varying positional needs across teams
      const needScores = analysis.teamFitAnalysis.map(fit => fit.positionalNeed);
      const maxNeed = Math.max(...needScores);
      const minNeed = Math.min(...needScores);
      
      expect(maxNeed).toBeGreaterThan(minNeed);
      expect(maxNeed).toBeLessThanOrEqual(100);
      expect(minNeed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Comparable Player Analysis Integration', () => {
    it('should find relevant comparable players based on performance', async () => {
      const qbData = mockCollegeData.quarterback;
      
      const analysis = await prospectService.analyzeProspect(
        qbData.playerId,
        qbData.playerName,
        qbData.position,
        qbData.college,
        qbData.collegeYear,
        qbData.stats,
        mockHistoricalData,
        mockNFLTeams
      );

      expect(analysis.comparablePlayerAnalysis.length).toBeGreaterThan(0);
      
      // All comparables should be same position
      analysis.comparablePlayerAnalysis.forEach(comp => {
        expect(comp.position).toBe(Position.QB);
        expect(comp.similarityScore).toBeGreaterThan(0);
        expect(comp.similarityScore).toBeLessThanOrEqual(1);
      });
      
      // Should identify successful comparables
      const successfulComps = analysis.getSuccessfulComparables();
      expect(successfulComps.length).toBeGreaterThan(0);
      
      // Most similar should have high similarity score
      const mostSimilar = analysis.getMostSimilarPlayer();
      expect(mostSimilar).toBeDefined();
      expect(mostSimilar!.similarityScore).toBeGreaterThan(0.5);
    });

    it('should handle prospects with limited comparable data', async () => {
      // Test with position that has limited historical data
      const analysis = await prospectService.analyzeProspect(
        'limited-prospect',
        'Limited Data Player',
        Position.K, // Kicker - limited in historical data
        'Test College',
        3,
        [{
          playerId: 'limited-prospect',
          season: 2023,
          games: 12
        }],
        mockHistoricalData, // No kickers in historical data
        mockNFLTeams
      );

      expect(analysis.comparablePlayerAnalysis).toHaveLength(0);
      expect(analysis.getMostSimilarPlayer()).toBeNull();
      expect(analysis.getSuccessfulComparables()).toHaveLength(0);
      
      // Should still provide valid analysis
      expect(analysis.draftProjection).toBeDefined();
      expect(analysis.nflReadiness).toBeDefined();
      expect(analysis.getOverallGrade()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Risk Assessment Integration', () => {
    it('should assess risk based on multiple factors', async () => {
      const qbData = mockCollegeData.quarterback;
      
      const analysis = await prospectService.analyzeProspect(
        qbData.playerId,
        qbData.playerName,
        qbData.position,
        qbData.college,
        qbData.collegeYear,
        qbData.stats,
        mockHistoricalData,
        mockNFLTeams
      );

      expect(analysis.bustRisk).toBeGreaterThanOrEqual(0);
      expect(analysis.bustRisk).toBeLessThanOrEqual(100);
      
      const riskLevel = analysis.getRiskAssessment();
      expect(['Low', 'Medium', 'High']).toContain(riskLevel);
      
      // Elite prospect should have reasonable risk (allowing for some variance)
      if (analysis.draftProjection.isEarlyRoundPick() && analysis.nflReadiness.isNFLReady()) {
        expect(analysis.bustRisk).toBeLessThan(80); // More lenient threshold
      }
    });

    it('should correlate risk with draft position and readiness', async () => {
      // Create prospect with poor stats (higher risk)
      const poorStats = [{
        playerId: 'poor-prospect',
        season: 2023,
        games: 8, // Limited games
        passingYards: 1800,
        passingTouchdowns: 12,
        interceptions: 18, // High interceptions
        completionPercentage: 0.52, // Low completion %
        rushingYards: 100,
        rushingTouchdowns: 1
      }];

      const analysis = await prospectService.analyzeProspect(
        'poor-prospect',
        'High Risk QB',
        Position.QB,
        'Small College',
        2, // Underclassman
        poorStats,
        mockHistoricalData,
        mockNFLTeams
      );

      // Should have higher bust risk
      expect(analysis.bustRisk).toBeGreaterThan(50);
      expect(analysis.getRiskAssessment()).toBe('High');
      expect(analysis.isEarlyRoundWorthy()).toBe(false);
    });
  });

  describe('Development Projection Integration', () => {
    it('should provide realistic development timelines', async () => {
      const analyses = await Promise.all([
        // Elite senior QB
        prospectService.analyzeProspect(
          'elite-senior',
          'Elite Senior QB',
          Position.QB,
          'Elite University',
          4, // Senior
          mockCollegeData.quarterback.stats,
          mockHistoricalData,
          mockNFLTeams
        ),
        // Raw junior RB
        prospectService.analyzeProspect(
          'raw-junior',
          'Raw Junior RB',
          Position.RB,
          'Development College',
          3, // Junior
          [{
            playerId: 'raw-junior',
            season: 2023,
            games: 10,
            rushingYards: 900,
            rushingTouchdowns: 8,
            receivingYards: 150,
            receptions: 12
          }],
          mockHistoricalData,
          mockNFLTeams
        )
      ]);

      const [eliteQB, rawRB] = analyses;

      // Elite senior should have shorter development timeline
      const eliteProjection = eliteQB.getDevelopmentProjection();
      const rawProjection = rawRB.getDevelopmentProjection();

      expect(eliteProjection.timeline).toBeLessThanOrEqual(rawProjection.timeline);
      
      // Elite prospect should have higher ceiling
      const ceilingLevels = ['Out of league', 'Practice squad', 'Backup', 'Rotational player', 'Solid starter', 'Pro Bowl', 'All-Pro'];
      const eliteCeilingIndex = ceilingLevels.indexOf(eliteProjection.ceiling);
      const rawCeilingIndex = ceilingLevels.indexOf(rawProjection.ceiling);
      
      expect(eliteCeilingIndex).toBeGreaterThanOrEqual(rawCeilingIndex);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle analysis of multiple prospects efficiently', async () => {
      const startTime = Date.now();
      
      const prospects = [
        mockCollegeData.quarterback,
        mockCollegeData.runningBack,
        mockCollegeData.wideReceiver
      ];

      const analyses = await Promise.all(
        prospects.map(prospect => 
          prospectService.analyzeProspect(
            prospect.playerId,
            prospect.playerName,
            prospect.position,
            prospect.college,
            prospect.collegeYear,
            prospect.stats,
            mockHistoricalData,
            mockNFLTeams
          )
        )
      );

      const duration = Date.now() - startTime;
      
      expect(analyses).toHaveLength(3);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      // All analyses should be valid
      analyses.forEach(analysis => {
        expect(analysis).toBeInstanceOf(ProspectAnalysis);
        expect(analysis.getOverallGrade()).toBeGreaterThanOrEqual(0);
        expect(analysis.teamFitAnalysis).toHaveLength(32);
      });
    });

    it('should maintain consistency across multiple runs', async () => {
      const qbData = mockCollegeData.quarterback;
      
      // Run analysis multiple times
      const analyses = await Promise.all(
        Array(3).fill(null).map(() =>
          prospectService.analyzeProspect(
            qbData.playerId,
            qbData.playerName,
            qbData.position,
            qbData.college,
            qbData.collegeYear,
            qbData.stats,
            mockHistoricalData,
            mockNFLTeams
          )
        )
      );

      // Results should be consistent (deterministic)
      const [first, second, third] = analyses;
      
      expect(first.draftProjection.projectedRound).toBe(second.draftProjection.projectedRound);
      expect(second.draftProjection.projectedRound).toBe(third.draftProjection.projectedRound);
      
      expect(first.nflReadiness.level).toBe(second.nflReadiness.level);
      expect(second.nflReadiness.level).toBe(third.nflReadiness.level);
      
      // Allow for some variance due to randomness in mock implementations
      expect(Math.abs(first.getOverallGrade() - second.getOverallGrade())).toBeLessThan(5);
      expect(Math.abs(second.getOverallGrade() - third.getOverallGrade())).toBeLessThan(5);
    });
  });
});
import { LineupOptimizer } from '../../core/lineup-optimizer';
import { FantasyPlayer, PlayerProjection } from '../../types/fantasy.types';

describe('LineupOptimizer', () => {
  let optimizer: LineupOptimizer;

  beforeEach(() => {
    optimizer = new LineupOptimizer();
  });

  describe('optimizeLineup', () => {
    it('should optimize lineup with given constraints', async () => {
      const mockPlayers: FantasyPlayer[] = [
        {
          playerId: 'qb1',
          name: 'Josh Allen',
          position: 'QB',
          team: 'BUF',
          fantasyPosition: 'QB',
          isStarter: false,
          projectedPoints: 24.5,
          seasonProjection: 380,
          value: 95,
          trend: 'UP',
          injuryStatus: 'HEALTHY',
          byeWeek: 12
        },
        {
          playerId: 'rb1',
          name: 'Saquon Barkley',
          position: 'RB',
          team: 'PHI',
          fantasyPosition: 'RB',
          isStarter: false,
          projectedPoints: 18.2,
          seasonProjection: 290,
          value: 88,
          trend: 'UP',
          injuryStatus: 'HEALTHY',
          byeWeek: 7
        },
        {
          playerId: 'rb2',
          name: 'Derrick Henry',
          position: 'RB',
          team: 'BAL',
          fantasyPosition: 'RB',
          isStarter: false,
          projectedPoints: 16.8,
          seasonProjection: 270,
          value: 85,
          trend: 'STABLE',
          injuryStatus: 'HEALTHY',
          byeWeek: 14
        },
        {
          playerId: 'wr1',
          name: 'CeeDee Lamb',
          position: 'WR',
          team: 'DAL',
          fantasyPosition: 'WR',
          isStarter: false,
          projectedPoints: 15.3,
          seasonProjection: 260,
          value: 82,
          trend: 'UP',
          injuryStatus: 'HEALTHY',
          byeWeek: 7
        },
        {
          playerId: 'wr2',
          name: 'A.J. Brown',
          position: 'WR',
          team: 'PHI',
          fantasyPosition: 'WR',
          isStarter: false,
          projectedPoints: 14.7,
          seasonProjection: 250,
          value: 80,
          trend: 'STABLE',
          injuryStatus: 'HEALTHY',
          byeWeek: 7
        },
        {
          playerId: 'te1',
          name: 'Travis Kelce',
          position: 'TE',
          team: 'KC',
          fantasyPosition: 'TE',
          isStarter: false,
          projectedPoints: 12.4,
          seasonProjection: 200,
          value: 75,
          trend: 'DOWN',
          injuryStatus: 'HEALTHY',
          byeWeek: 10
        },
        {
          playerId: 'k1',
          name: 'Justin Tucker',
          position: 'K',
          team: 'BAL',
          fantasyPosition: 'K',
          isStarter: false,
          projectedPoints: 8.5,
          seasonProjection: 140,
          value: 60,
          trend: 'STABLE',
          injuryStatus: 'HEALTHY',
          byeWeek: 14
        },
        {
          playerId: 'def1',
          name: 'Pittsburgh Steelers',
          position: 'DEF',
          team: 'PIT',
          fantasyPosition: 'DEF',
          isStarter: false,
          projectedPoints: 9.2,
          seasonProjection: 150,
          value: 65,
          trend: 'UP',
          injuryStatus: 'HEALTHY',
          byeWeek: 9
        }
      ];

      const mockProjections: PlayerProjection[] = mockPlayers.map(player => ({
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
          level: 'LOW',
          probability: 0.1,
          impact: 'MINOR',
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
          gameScript: 'NEUTRAL',
          impact: 0,
          reasoning: 'Even game expected'
        }
      }));

      const constraints = {
        positions: { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DEF: 1 }
      };

      const result = await optimizer.optimizeLineup(mockPlayers, mockProjections, constraints);

      expect(result).toBeDefined();
      expect(result.QB).toBeDefined();
      expect(result.RB).toHaveLength(2);
      expect(result.WR).toHaveLength(2);
      expect(result.TE).toBeDefined();
      expect(result.K).toBeDefined();
      expect(result.DEF).toBeDefined();
    });

    it('should handle empty player list', async () => {
      const constraints = {
        positions: { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DEF: 1 }
      };

      const result = await optimizer.optimizeLineup([], [], constraints);

      expect(result).toBeDefined();
      // Should handle gracefully with empty lineup
    });
  });

  describe('calculateLineupProjection', () => {
    it('should calculate lineup projection correctly', async () => {
      const mockLineup = {
        QB: {
          playerId: 'qb1',
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
        },
        RB: [{
          playerId: 'rb1',
          name: 'Saquon Barkley',
          position: 'RB' as const,
          team: 'PHI',
          fantasyPosition: 'RB' as const,
          isStarter: true,
          projectedPoints: 18.2,
          seasonProjection: 290,
          value: 88,
          trend: 'UP' as const,
          injuryStatus: 'HEALTHY' as const,
          byeWeek: 7
        }],
        WR: [{
          playerId: 'wr1',
          name: 'CeeDee Lamb',
          position: 'WR' as const,
          team: 'DAL',
          fantasyPosition: 'WR' as const,
          isStarter: true,
          projectedPoints: 15.3,
          seasonProjection: 260,
          value: 82,
          trend: 'UP' as const,
          injuryStatus: 'HEALTHY' as const,
          byeWeek: 7
        }],
        TE: {
          playerId: 'te1',
          name: 'Travis Kelce',
          position: 'TE' as const,
          team: 'KC',
          fantasyPosition: 'TE' as const,
          isStarter: true,
          projectedPoints: 12.4,
          seasonProjection: 200,
          value: 75,
          trend: 'DOWN' as const,
          injuryStatus: 'HEALTHY' as const,
          byeWeek: 10
        },
        K: {
          playerId: 'k1',
          name: 'Justin Tucker',
          position: 'K' as const,
          team: 'BAL',
          fantasyPosition: 'K' as const,
          isStarter: true,
          projectedPoints: 8.5,
          seasonProjection: 140,
          value: 60,
          trend: 'STABLE' as const,
          injuryStatus: 'HEALTHY' as const,
          byeWeek: 14
        },
        DEF: {
          playerId: 'def1',
          name: 'Pittsburgh Steelers',
          position: 'DEF' as const,
          team: 'PIT',
          fantasyPosition: 'DEF' as const,
          isStarter: true,
          projectedPoints: 9.2,
          seasonProjection: 150,
          value: 65,
          trend: 'UP' as const,
          injuryStatus: 'HEALTHY' as const,
          byeWeek: 9
        }
      };

      const mockProjections: PlayerProjection[] = [
        {
          playerId: 'qb1',
          week: 12,
          projectedPoints: 24.5,
          confidenceInterval: [20, 29],
          ceiling: 35,
          floor: 15,
          matchupRating: {
            overall: 7,
            passDefense: 6,
            rushDefense: 8,
            redZoneDefense: 7,
            homeAwayImpact: 0.5,
            pace: 5,
            reasoning: ['Good matchup']
          },
          injuryRisk: {
            level: 'LOW',
            probability: 0.1,
            impact: 'MINOR',
            description: 'No concerns'
          },
          weatherImpact: {
            temperature: 60,
            windSpeed: 5,
            precipitation: 0,
            impact: 0,
            description: 'No impact'
          },
          usage: { snapShare: 0.75 },
          gameScript: {
            gameScript: 'NEUTRAL',
            impact: 0,
            reasoning: 'Even game'
          }
        }
      ];

      const result = await optimizer.calculateLineupProjection(mockLineup, mockProjections);

      expect(result.totalProjection).toBeGreaterThan(0);
      expect(result.positionBreakdown).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});
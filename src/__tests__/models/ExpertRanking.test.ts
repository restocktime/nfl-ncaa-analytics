import { ExpertRanking } from '../../models/ExpertRanking';
import { ExpertRanking as IExpertRanking } from '../../types/espn-draft.types';

describe('ExpertRanking Model', () => {
  const validRankingData: IExpertRanking = {
    playerId: 'player123',
    playerName: 'Christian McCaffrey',
    position: 'RB',
    team: 'SF',
    expertRank: 1,
    tier: 1,
    expertNotes: 'Elite RB1 with high upside',
    projectedPoints: 285.5,
    riskLevel: 'LOW',
    lastUpdated: new Date('2025-01-01T12:00:00Z'),
  };

  describe('Constructor', () => {
    it('should create instance with valid data', () => {
      const ranking = new ExpertRanking(validRankingData);
      
      expect(ranking.playerId).toBe('player123');
      expect(ranking.playerName).toBe('Christian McCaffrey');
      expect(ranking.position).toBe('RB');
      expect(ranking.team).toBe('SF');
      expect(ranking.expertRank).toBe(1);
      expect(ranking.tier).toBe(1);
      expect(ranking.expertNotes).toBe('Elite RB1 with high upside');
      expect(ranking.projectedPoints).toBe(285.5);
      expect(ranking.riskLevel).toBe('LOW');
      expect(ranking.lastUpdated).toEqual(new Date('2025-01-01T12:00:00Z'));
    });

    it('should create instance with default values for missing data', () => {
      const ranking = new ExpertRanking({});
      
      expect(ranking.playerId).toBe('');
      expect(ranking.playerName).toBe('');
      expect(ranking.position).toBe('');
      expect(ranking.team).toBe('');
      expect(ranking.expertRank).toBe(0);
      expect(ranking.tier).toBe(1);
      expect(ranking.expertNotes).toBe('');
      expect(ranking.projectedPoints).toBe(0);
      expect(ranking.riskLevel).toBe('MEDIUM');
      expect(ranking.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Validation', () => {
    it('should validate correct data', () => {
      const ranking = new ExpertRanking(validRankingData);
      const errors = ranking.validate();
      
      expect(errors).toHaveLength(0);
      expect(ranking.isValid()).toBe(true);
    });

    it('should return errors for missing required fields', () => {
      const ranking = new ExpertRanking({});
      const errors = ranking.validate();
      
      expect(errors).toContain('Player ID is required');
      expect(errors).toContain('Player name is required');
      expect(errors).toContain('Position is required');
      expect(errors).toContain('Team is required');
      expect(errors).toContain('Expert rank must be greater than 0');
      expect(ranking.isValid()).toBe(false);
    });

    it('should validate expert rank is positive', () => {
      const ranking = new ExpertRanking({ ...validRankingData, expertRank: -1 });
      const errors = ranking.validate();
      
      expect(errors).toContain('Expert rank must be greater than 0');
    });

    it('should validate tier is positive', () => {
      const ranking = new ExpertRanking({ ...validRankingData, tier: 0 });
      const errors = ranking.validate();
      
      expect(errors).toContain('Tier must be greater than 0');
    });

    it('should validate projected points is not negative', () => {
      const ranking = new ExpertRanking({ ...validRankingData, projectedPoints: -10 });
      const errors = ranking.validate();
      
      expect(errors).toContain('Projected points cannot be negative');
    });

    it('should validate risk level is valid', () => {
      const ranking = new ExpertRanking({ ...validRankingData, riskLevel: 'INVALID' as any });
      const errors = ranking.validate();
      
      expect(errors).toContain('Risk level must be LOW, MEDIUM, or HIGH');
    });

    it('should validate last updated date', () => {
      const ranking = new ExpertRanking({ ...validRankingData, lastUpdated: new Date('invalid') });
      const errors = ranking.validate();
      
      expect(errors).toContain('Last updated date is invalid');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const ranking = new ExpertRanking(validRankingData);
      const json = ranking.toJSON();
      
      expect(json).toEqual(validRankingData);
    });

    it('should deserialize from JSON correctly', () => {
      const ranking = ExpertRanking.fromJSON(validRankingData);
      
      expect(ranking.playerId).toBe(validRankingData.playerId);
      expect(ranking.playerName).toBe(validRankingData.playerName);
      expect(ranking.expertRank).toBe(validRankingData.expertRank);
      expect(ranking.projectedPoints).toBe(validRankingData.projectedPoints);
    });

    it('should handle numeric string conversion in fromJSON', () => {
      const jsonData = {
        ...validRankingData,
        expertRank: '5',
        tier: '2',
        projectedPoints: '200.5',
      };
      
      const ranking = ExpertRanking.fromJSON(jsonData);
      
      expect(ranking.expertRank).toBe(5);
      expect(ranking.tier).toBe(2);
      expect(ranking.projectedPoints).toBe(200.5);
    });
  });

  describe('Comparison', () => {
    it('should compare rankings correctly', () => {
      const ranking1 = new ExpertRanking({ ...validRankingData, expertRank: 1 });
      const ranking2 = new ExpertRanking({ ...validRankingData, expertRank: 5 });
      
      expect(ranking1.compareTo(ranking2)).toBe(-4);
      expect(ranking2.compareTo(ranking1)).toBe(4);
      expect(ranking1.compareTo(ranking1)).toBe(0);
    });
  });

  describe('Staleness Check', () => {
    it('should identify stale rankings', () => {
      const oldDate = new Date(Date.now() - 8 * 60 * 60 * 1000); // 8 hours ago
      const ranking = new ExpertRanking({ ...validRankingData, lastUpdated: oldDate });
      
      expect(ranking.isStale(6)).toBe(true);
      expect(ranking.isStale(10)).toBe(false);
    });

    it('should identify fresh rankings', () => {
      const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const ranking = new ExpertRanking({ ...validRankingData, lastUpdated: recentDate });
      
      expect(ranking.isStale(6)).toBe(false);
    });
  });

  describe('Risk Description', () => {
    it('should return correct risk descriptions', () => {
      const lowRisk = new ExpertRanking({ ...validRankingData, riskLevel: 'LOW' });
      const mediumRisk = new ExpertRanking({ ...validRankingData, riskLevel: 'MEDIUM' });
      const highRisk = new ExpertRanking({ ...validRankingData, riskLevel: 'HIGH' });
      
      expect(lowRisk.getRiskDescription()).toBe('Safe pick with consistent performance');
      expect(mediumRisk.getRiskDescription()).toBe('Moderate risk with upside potential');
      expect(highRisk.getRiskDescription()).toBe('High risk, high reward player');
    });
  });

  describe('Tier Analysis', () => {
    it('should identify top tier players', () => {
      const tier1 = new ExpertRanking({ ...validRankingData, tier: 1 });
      const tier2 = new ExpertRanking({ ...validRankingData, tier: 2 });
      const tier3 = new ExpertRanking({ ...validRankingData, tier: 3 });
      
      expect(tier1.isTopTier()).toBe(true);
      expect(tier2.isTopTier()).toBe(true);
      expect(tier3.isTopTier()).toBe(false);
    });
  });

  describe('Position Group', () => {
    it('should return correct position groups', () => {
      const qb = new ExpertRanking({ ...validRankingData, position: 'QB' });
      const rb = new ExpertRanking({ ...validRankingData, position: 'RB' });
      const wr = new ExpertRanking({ ...validRankingData, position: 'WR' });
      const te = new ExpertRanking({ ...validRankingData, position: 'TE' });
      const k = new ExpertRanking({ ...validRankingData, position: 'K' });
      const dst = new ExpertRanking({ ...validRankingData, position: 'DST' });
      
      expect(qb.getPositionGroup()).toBe('QB');
      expect(rb.getPositionGroup()).toBe('RB');
      expect(wr.getPositionGroup()).toBe('WR');
      expect(te.getPositionGroup()).toBe('TE');
      expect(k.getPositionGroup()).toBe('K');
      expect(dst.getPositionGroup()).toBe('DST');
    });

    it('should handle alternative position formats', () => {
      const pk = new ExpertRanking({ ...validRankingData, position: 'PK' });
      const def = new ExpertRanking({ ...validRankingData, position: 'DEF' });
      const dSlashSt = new ExpertRanking({ ...validRankingData, position: 'D/ST' });
      
      expect(pk.getPositionGroup()).toBe('K');
      expect(def.getPositionGroup()).toBe('DST');
      expect(dSlashSt.getPositionGroup()).toBe('DST');
    });
  });
});
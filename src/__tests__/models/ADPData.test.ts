import { ADPData } from '../../models/ADPData';
import { ADPData as IADPData } from '../../types/espn-draft.types';

describe('ADPData Model', () => {
  const validADPData: IADPData = {
    playerId: 'player123',
    playerName: 'Christian McCaffrey',
    position: 'RB',
    averageDraftPosition: 1.5,
    standardDeviation: 0.8,
    draftPercentage: 95.2,
    positionRank: 1,
    leagueSize: 12,
    scoringFormat: 'PPR',
  };

  describe('Constructor', () => {
    it('should create instance with valid data', () => {
      const adp = new ADPData(validADPData);
      
      expect(adp.playerId).toBe('player123');
      expect(adp.playerName).toBe('Christian McCaffrey');
      expect(adp.position).toBe('RB');
      expect(adp.averageDraftPosition).toBe(1.5);
      expect(adp.standardDeviation).toBe(0.8);
      expect(adp.draftPercentage).toBe(95.2);
      expect(adp.positionRank).toBe(1);
      expect(adp.leagueSize).toBe(12);
      expect(adp.scoringFormat).toBe('PPR');
    });

    it('should create instance with default values for missing data', () => {
      const adp = new ADPData({});
      
      expect(adp.playerId).toBe('');
      expect(adp.playerName).toBe('');
      expect(adp.position).toBe('');
      expect(adp.averageDraftPosition).toBe(0);
      expect(adp.standardDeviation).toBe(0);
      expect(adp.draftPercentage).toBe(0);
      expect(adp.positionRank).toBe(0);
      expect(adp.leagueSize).toBe(12);
      expect(adp.scoringFormat).toBe('PPR');
    });
  });

  describe('Validation', () => {
    it('should validate correct data', () => {
      const adp = new ADPData(validADPData);
      const errors = adp.validate();
      
      expect(errors).toHaveLength(0);
      expect(adp.isValid()).toBe(true);
    });

    it('should return errors for missing required fields', () => {
      const adp = new ADPData({});
      const errors = adp.validate();
      
      expect(errors).toContain('Player ID is required');
      expect(errors).toContain('Player name is required');
      expect(errors).toContain('Position is required');
      expect(errors).toContain('Average draft position must be greater than 0');
      expect(errors).toContain('Position rank must be greater than 0');
      expect(errors).toContain('Scoring format is required');
      expect(adp.isValid()).toBe(false);
    });

    it('should validate average draft position is positive', () => {
      const adp = new ADPData({ ...validADPData, averageDraftPosition: -1 });
      const errors = adp.validate();
      
      expect(errors).toContain('Average draft position must be greater than 0');
    });

    it('should validate standard deviation is not negative', () => {
      const adp = new ADPData({ ...validADPData, standardDeviation: -1 });
      const errors = adp.validate();
      
      expect(errors).toContain('Standard deviation cannot be negative');
    });

    it('should validate draft percentage range', () => {
      const tooLow = new ADPData({ ...validADPData, draftPercentage: -5 });
      const tooHigh = new ADPData({ ...validADPData, draftPercentage: 105 });
      
      expect(tooLow.validate()).toContain('Draft percentage must be between 0 and 100');
      expect(tooHigh.validate()).toContain('Draft percentage must be between 0 and 100');
    });

    it('should validate league size range', () => {
      const tooSmall = new ADPData({ ...validADPData, leagueSize: 2 });
      const tooLarge = new ADPData({ ...validADPData, leagueSize: 25 });
      
      expect(tooSmall.validate()).toContain('League size must be between 4 and 20');
      expect(tooLarge.validate()).toContain('League size must be between 4 and 20');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const adp = new ADPData(validADPData);
      const json = adp.toJSON();
      
      expect(json).toEqual(validADPData);
    });

    it('should deserialize from JSON correctly', () => {
      const adp = ADPData.fromJSON(validADPData);
      
      expect(adp.playerId).toBe(validADPData.playerId);
      expect(adp.playerName).toBe(validADPData.playerName);
      expect(adp.averageDraftPosition).toBe(validADPData.averageDraftPosition);
      expect(adp.draftPercentage).toBe(validADPData.draftPercentage);
    });

    it('should handle numeric string conversion in fromJSON', () => {
      const jsonData = {
        ...validADPData,
        averageDraftPosition: '2.5',
        standardDeviation: '1.2',
        draftPercentage: '85.5',
        positionRank: '3',
        leagueSize: '10',
      };
      
      const adp = ADPData.fromJSON(jsonData);
      
      expect(adp.averageDraftPosition).toBe(2.5);
      expect(adp.standardDeviation).toBe(1.2);
      expect(adp.draftPercentage).toBe(85.5);
      expect(adp.positionRank).toBe(3);
      expect(adp.leagueSize).toBe(10);
    });
  });

  describe('Draft Position Analysis', () => {
    it('should calculate typical round correctly', () => {
      const adp = new ADPData({ ...validADPData, averageDraftPosition: 13.5, leagueSize: 12 });
      
      expect(adp.getTypicalRound()).toBe(2); // Math.ceil(13.5 / 12)
    });

    it('should calculate pick in round correctly', () => {
      const adp = new ADPData({ ...validADPData, averageDraftPosition: 13.5, leagueSize: 12 });
      
      expect(adp.getPickInRound()).toBe(1.5); // 13.5 - ((2-1) * 12)
    });

    it('should identify volatile players', () => {
      const volatile = new ADPData({ ...validADPData, standardDeviation: 15 });
      const stable = new ADPData({ ...validADPData, standardDeviation: 5 });
      
      expect(volatile.isVolatile(10)).toBe(true);
      expect(stable.isVolatile(10)).toBe(false);
    });

    it('should calculate draft range correctly', () => {
      const adp = new ADPData({ ...validADPData, averageDraftPosition: 10, standardDeviation: 3 });
      const range = adp.getDraftRange();
      
      expect(range.min).toBe(7); // Math.max(1, 10 - 3)
      expect(range.max).toBe(13); // 10 + 3
    });

    it('should handle draft range minimum of 1', () => {
      const adp = new ADPData({ ...validADPData, averageDraftPosition: 2, standardDeviation: 5 });
      const range = adp.getDraftRange();
      
      expect(range.min).toBe(1); // Math.max(1, 2 - 5)
      expect(range.max).toBe(7); // 2 + 5
    });

    it('should identify commonly drafted players', () => {
      const common = new ADPData({ ...validADPData, draftPercentage: 75 });
      const uncommon = new ADPData({ ...validADPData, draftPercentage: 25 });
      
      expect(common.isCommonlyDrafted(50)).toBe(true);
      expect(uncommon.isCommonlyDrafted(50)).toBe(false);
    });
  });

  describe('Tier Analysis', () => {
    it('should calculate tiers correctly', () => {
      const elite = new ADPData({ ...validADPData, positionRank: 2 });
      const veryGood = new ADPData({ ...validADPData, positionRank: 5 });
      const good = new ADPData({ ...validADPData, positionRank: 12 });
      const decent = new ADPData({ ...validADPData, positionRank: 20 });
      const deep = new ADPData({ ...validADPData, positionRank: 30 });
      
      expect(elite.getTier()).toBe(1);
      expect(veryGood.getTier()).toBe(2);
      expect(good.getTier()).toBe(3);
      expect(decent.getTier()).toBe(4);
      expect(deep.getTier()).toBe(5);
    });

    it('should return correct tier descriptions', () => {
      const elite = new ADPData({ ...validADPData, positionRank: 1 });
      const veryGood = new ADPData({ ...validADPData, positionRank: 5 });
      const good = new ADPData({ ...validADPData, positionRank: 10 });
      const decent = new ADPData({ ...validADPData, positionRank: 20 });
      const deep = new ADPData({ ...validADPData, positionRank: 30 });
      
      expect(elite.getTierDescription()).toBe('Elite');
      expect(veryGood.getTierDescription()).toBe('Very Good');
      expect(good.getTierDescription()).toBe('Good');
      expect(decent.getTierDescription()).toBe('Decent');
      expect(deep.getTierDescription()).toBe('Deep League');
    });
  });

  describe('Comparison', () => {
    it('should compare ADP correctly', () => {
      const adp1 = new ADPData({ ...validADPData, averageDraftPosition: 5 });
      const adp2 = new ADPData({ ...validADPData, averageDraftPosition: 10 });
      
      expect(adp1.compareTo(adp2)).toBe(-5);
      expect(adp2.compareTo(adp1)).toBe(5);
      expect(adp1.compareTo(adp1)).toBe(0);
    });
  });

  describe('Value Analysis', () => {
    it('should calculate value at position correctly', () => {
      const adp = new ADPData({ ...validADPData, averageDraftPosition: 10 });
      
      expect(adp.getValueAtPosition(5)).toBe(5); // 10 - 5 = good value
      expect(adp.getValueAtPosition(15)).toBe(-5); // 10 - 15 = reach
    });

    it('should identify good value picks', () => {
      const adp = new ADPData({ ...validADPData, averageDraftPosition: 20 });
      
      expect(adp.isGoodValueAt(10, 5)).toBe(true); // 20 - 10 = 10 >= 5
      expect(adp.isGoodValueAt(18, 5)).toBe(false); // 20 - 18 = 2 < 5
    });

    it('should identify reach picks', () => {
      const adp = new ADPData({ ...validADPData, averageDraftPosition: 20 });
      
      expect(adp.isReachAt(35, -10)).toBe(true); // 20 - 35 = -15 <= -10
      expect(adp.isReachAt(25, -10)).toBe(false); // 20 - 25 = -5 > -10
    });
  });

  describe('Position Group', () => {
    it('should return correct position groups', () => {
      const qb = new ADPData({ ...validADPData, position: 'QB' });
      const rb = new ADPData({ ...validADPData, position: 'RB' });
      const wr = new ADPData({ ...validADPData, position: 'WR' });
      const te = new ADPData({ ...validADPData, position: 'TE' });
      const k = new ADPData({ ...validADPData, position: 'K' });
      const dst = new ADPData({ ...validADPData, position: 'DST' });
      
      expect(qb.getPositionGroup()).toBe('QB');
      expect(rb.getPositionGroup()).toBe('RB');
      expect(wr.getPositionGroup()).toBe('WR');
      expect(te.getPositionGroup()).toBe('TE');
      expect(k.getPositionGroup()).toBe('K');
      expect(dst.getPositionGroup()).toBe('DST');
    });
  });

  describe('League Size Adjustment', () => {
    it('should adjust ADP for different league sizes', () => {
      const adp = new ADPData({ ...validADPData, averageDraftPosition: 12, leagueSize: 12 });
      
      expect(adp.adjustForLeagueSize(12)).toBe(12); // Same size
      expect(adp.adjustForLeagueSize(10)).toBe(10); // 12 * (10/12) = 10
      expect(adp.adjustForLeagueSize(14)).toBe(14); // 12 * (14/12) = 14
    });
  });

  describe('Draft Recommendations', () => {
    it('should recommend waiting when pick is too early', () => {
      const adp = new ADPData({ 
        ...validADPData, 
        averageDraftPosition: 20, 
        standardDeviation: 3 
      });
      
      const rec = adp.getDraftRecommendation(15, 25); // Pick 15, next pick 25
      
      expect(rec.recommendation).toBe('WAIT');
      expect(rec.reasoning).toContain('typically goes around pick 20');
    });

    it('should recommend drafting now when player will be gone', () => {
      const adp = new ADPData({ 
        ...validADPData, 
        averageDraftPosition: 20, 
        standardDeviation: 3 
      });
      
      const rec = adp.getDraftRecommendation(22, 35); // Pick 22, next pick 35
      
      expect(rec.recommendation).toBe('DRAFT_NOW');
      expect(rec.reasoning).toContain('unlikely to be available');
    });

    it('should identify missed window', () => {
      const adp = new ADPData({ 
        ...validADPData, 
        averageDraftPosition: 15, 
        standardDeviation: 2 
      });
      
      const rec = adp.getDraftRecommendation(25, 35); // Pick 25, next pick 35
      
      expect(rec.recommendation).toBe('MISSED_WINDOW');
      expect(rec.reasoning).toContain('likely to be drafted before');
    });

    it('should identify risky wait for volatile players', () => {
      const adp = new ADPData({ 
        ...validADPData, 
        averageDraftPosition: 20, 
        standardDeviation: 15 // High volatility
      });
      
      const rec = adp.getDraftRecommendation(22, 30); // Pick 22, next pick 30
      
      expect(rec.recommendation).toBe('RISKY_WAIT');
      expect(rec.reasoning).toContain('High volatility');
    });

    it('should recommend waiting when safe to do so', () => {
      const adp = new ADPData({ 
        ...validADPData, 
        averageDraftPosition: 25, 
        standardDeviation: 3 
      });
      
      const rec = adp.getDraftRecommendation(22, 30); // Pick 22, next pick 30
      
      expect(rec.recommendation).toBe('WAIT');
      expect(rec.reasoning).toContain('should be available');
    });
  });
});
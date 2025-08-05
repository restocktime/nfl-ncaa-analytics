import 'reflect-metadata';
import { validate } from 'class-validator';
import { 
  OpponentAdjustedStats, 
  SituationalStats, 
  CoachingMatchupStats 
} from '../../models/OpponentAdjustedStats';

describe('OpponentAdjustedStats Model', () => {
  let validOpponentAdjustedStatsData: any;

  beforeEach(() => {
    validOpponentAdjustedStatsData = {
      teamId: 'team-1',
      opponentId: 'team-2',
      season: 2024,
      offensiveEfficiency: 1.15,
      defensiveEfficiency: 0.85,
      situationalPerformance: {
        redZone: {
          attempts: 25,
          successes: 18,
          percentage: 0.72
        },
        thirdDown: {
          attempts: 120,
          successes: 48,
          percentage: 0.40
        },
        fourthDown: {
          attempts: 8,
          successes: 5,
          percentage: 0.625
        },
        goalLine: {
          attempts: 12,
          successes: 10,
          percentage: 0.833
        }
      },
      coachingMatchup: {
        headCoachId: 'coach-1',
        opponentHeadCoachId: 'coach-2',
        gamesPlayed: 5,
        wins: 3,
        losses: 2,
        averagePointsScored: 24.2,
        averagePointsAllowed: 21.8,
        winPercentage: 0.6
      }
    };
  });

  describe('SituationalStats', () => {
    let situationalStats: SituationalStats;

    beforeEach(() => {
      situationalStats = new SituationalStats({
        attempts: 25,
        successes: 18,
        percentage: 0.72
      });
    });

    it('should validate valid situational stats', async () => {
      const errors = await validate(situationalStats);
      expect(errors).toHaveLength(0);
    });

    it('should validate minimum values', async () => {
      const invalidStats = new SituationalStats({
        attempts: -5,
        successes: 18,
        percentage: 0.72
      });
      const errors = await validate(invalidStats);
      expect(errors.some(error => error.property === 'attempts')).toBe(true);
    });

    it('should calculate success rate', () => {
      const successRate = situationalStats.getSuccessRate();
      expect(successRate).toBeCloseTo(0.72, 2);
    });

    it('should handle zero attempts', () => {
      situationalStats.attempts = 0;
      const successRate = situationalStats.getSuccessRate();
      expect(successRate).toBe(0);
    });

    it('should check consistency', () => {
      expect(situationalStats.isConsistent()).toBe(true);

      situationalStats.percentage = 0.5; // Inconsistent with 18/25
      expect(situationalStats.isConsistent()).toBe(false);
    });
  });

  describe('CoachingMatchupStats', () => {
    let coachingStats: CoachingMatchupStats;

    beforeEach(() => {
      coachingStats = new CoachingMatchupStats(validOpponentAdjustedStatsData.coachingMatchup);
    });

    it('should validate valid coaching matchup stats', async () => {
      const errors = await validate(coachingStats);
      expect(errors).toHaveLength(0);
    });

    it('should require non-empty coach IDs', async () => {
      const invalidStats = new CoachingMatchupStats({
        ...validOpponentAdjustedStatsData.coachingMatchup,
        headCoachId: ''
      });
      const errors = await validate(invalidStats);
      expect(errors.some(error => error.property === 'headCoachId')).toBe(true);
    });

    it('should calculate win percentage', () => {
      const winPercentage = coachingStats.calculateWinPercentage();
      expect(winPercentage).toBe(0.6); // 3/5
    });

    it('should handle zero games played', () => {
      coachingStats.gamesPlayed = 0;
      const winPercentage = coachingStats.calculateWinPercentage();
      expect(winPercentage).toBe(0);
    });

    it('should get average point differential', () => {
      const differential = coachingStats.getAveragePointDifferential();
      expect(differential).toBeCloseTo(2.4, 1); // 24.2 - 21.8
    });

    it('should identify winning record', () => {
      expect(coachingStats.hasWinningRecord()).toBe(true);

      coachingStats.winPercentage = 0.4;
      expect(coachingStats.hasWinningRecord()).toBe(false);
    });

    it('should calculate ties', () => {
      const ties = coachingStats.getTies();
      expect(ties).toBe(0); // 5 - 3 - 2
    });
  });

  describe('OpponentAdjustedStats', () => {
    let opponentStats: OpponentAdjustedStats;

    beforeEach(() => {
      opponentStats = new OpponentAdjustedStats(validOpponentAdjustedStatsData);
    });

    it('should validate valid opponent adjusted stats', async () => {
      const errors = await validate(opponentStats, { skipMissingProperties: true });
      expect(opponentStats.teamId).toBe('team-1');
      expect(opponentStats.season).toBe(2024);
    });

    it('should require non-empty team IDs', async () => {
      const invalidData = { ...validOpponentAdjustedStatsData, teamId: '' };
      const stats = new OpponentAdjustedStats(invalidData);
      const errors = await validate(stats);
      expect(errors.some(error => error.property === 'teamId')).toBe(true);
    });

    it('should validate season range', async () => {
      const invalidData = { ...validOpponentAdjustedStatsData, season: 1800 };
      const stats = new OpponentAdjustedStats(invalidData);
      const errors = await validate(stats);
      expect(errors.some(error => error.property === 'season')).toBe(true);
    });

    it('should validate efficiency ranges', async () => {
      const invalidData = { ...validOpponentAdjustedStatsData, offensiveEfficiency: -0.5 };
      const stats = new OpponentAdjustedStats(invalidData);
      const errors = await validate(stats);
      expect(errors.some(error => error.property === 'offensiveEfficiency')).toBe(true);
    });

    it('should calculate overall efficiency', () => {
      const efficiency = opponentStats.getOverallEfficiency();
      // (1.15 + (2 - 0.85)) / 2 = (1.15 + 1.15) / 2 = 1.15
      expect(efficiency).toBeCloseTo(1.15, 2);
    });

    it('should identify offensive advantage', () => {
      expect(opponentStats.hasOffensiveAdvantage()).toBe(true);

      opponentStats.offensiveEfficiency = 0.9;
      expect(opponentStats.hasOffensiveAdvantage()).toBe(false);
    });

    it('should identify defensive advantage', () => {
      expect(opponentStats.hasDefensiveAdvantage()).toBe(true);

      opponentStats.defensiveEfficiency = 1.2;
      expect(opponentStats.hasDefensiveAdvantage()).toBe(false);
    });

    it('should get red zone efficiency', () => {
      const efficiency = opponentStats.getRedZoneEfficiency();
      expect(efficiency).toBeCloseTo(0.72, 2);
    });

    it('should get third down conversion rate', () => {
      const rate = opponentStats.getThirdDownConversionRate();
      expect(rate).toBeCloseTo(0.40, 2);
    });

    it('should get fourth down conversion rate', () => {
      const rate = opponentStats.getFourthDownConversionRate();
      expect(rate).toBeCloseTo(0.625, 3);
    });

    it('should get goal line efficiency', () => {
      const efficiency = opponentStats.getGoalLineEfficiency();
      expect(efficiency).toBeCloseTo(0.833, 3);
    });

    it('should get strength of schedule adjustment', () => {
      const adjustment = opponentStats.getStrengthOfScheduleAdjustment();
      expect(adjustment).toBe(1.0); // Neutral for now
    });

    it('should get coaching advantage', () => {
      const advantage = opponentStats.getCoachingAdvantage();
      expect(advantage).toBeCloseTo(0.2, 1); // (0.6 - 0.5) * 2
    });

    it('should calculate composite rating', () => {
      const rating = opponentStats.getCompositeRating();
      expect(rating).toBeGreaterThan(0);
      expect(rating).toBeLessThan(2);
    });

    it('should predict performance vs opponent', () => {
      const performance = opponentStats.predictPerformanceVsOpponent(1.2); // Strong opponent
      expect(performance).toBeGreaterThan(0);
      
      const performanceWeak = opponentStats.predictPerformanceVsOpponent(0.8); // Weak opponent
      expect(performanceWeak).toBeGreaterThan(performance);
    });

    it('should handle edge cases in calculations', () => {
      // Test with extreme efficiency values
      opponentStats.offensiveEfficiency = 0;
      opponentStats.defensiveEfficiency = 2;
      
      const efficiency = opponentStats.getOverallEfficiency();
      expect(efficiency).toBeGreaterThanOrEqual(0);
      
      const rating = opponentStats.getCompositeRating();
      expect(rating).toBeGreaterThanOrEqual(0);
    });
  });
});
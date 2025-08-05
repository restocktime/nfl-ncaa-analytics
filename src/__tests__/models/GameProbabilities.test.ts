import 'reflect-metadata';
import { validate } from 'class-validator';
import { 
  GameProbabilities, 
  WinProbability, 
  SpreadProbability, 
  TotalProbability, 
  PlayerPropProbability 
} from '../../models/GameProbabilities';

describe('GameProbabilities Model', () => {
  let validGameProbabilitiesData: any;

  beforeEach(() => {
    validGameProbabilitiesData = {
      gameId: 'game-123',
      timestamp: new Date('2024-01-15T13:00:00Z'),
      winProbability: {
        home: 0.6,
        away: 0.4
      },
      spreadProbability: {
        spread: -3.5,
        probability: 0.55,
        confidence: 0.8
      },
      totalProbability: {
        over: 0.52,
        under: 0.48,
        total: 45.5
      },
      playerProps: [
        {
          playerId: 'player-1',
          propType: 'passing_yards',
          line: 250.5,
          overProbability: 0.45,
          underProbability: 0.55,
          confidence: 0.7
        }
      ]
    };
  });

  describe('WinProbability', () => {
    it('should validate valid probabilities', async () => {
      const winProb = new WinProbability({ home: 0.6, away: 0.4 });
      const errors = await validate(winProb);
      expect(errors).toHaveLength(0);
    });

    it('should validate probability range', async () => {
      const winProb = new WinProbability({ home: 1.5, away: 0.4 });
      const errors = await validate(winProb);
      expect(errors.some(error => error.property === 'home')).toBe(true);
    });

    it('should check if probabilities are valid (sum to 1)', () => {
      const validProb = new WinProbability({ home: 0.6, away: 0.4 });
      expect(validProb.isValid()).toBe(true);

      const invalidProb = new WinProbability({ home: 0.7, away: 0.4 });
      expect(invalidProb.isValid()).toBe(false);
    });
  });

  describe('SpreadProbability', () => {
    it('should validate valid spread probability', async () => {
      const spreadProb = new SpreadProbability({
        spread: -3.5,
        probability: 0.55,
        confidence: 0.8
      });
      const errors = await validate(spreadProb);
      expect(errors).toHaveLength(0);
    });

    it('should validate probability range', async () => {
      const spreadProb = new SpreadProbability({
        spread: -3.5,
        probability: 1.5,
        confidence: 0.8
      });
      const errors = await validate(spreadProb);
      expect(errors.some(error => error.property === 'probability')).toBe(true);
    });
  });

  describe('TotalProbability', () => {
    it('should validate valid total probability', async () => {
      const totalProb = new TotalProbability({
        over: 0.52,
        under: 0.48,
        total: 45.5
      });
      const errors = await validate(totalProb);
      expect(errors).toHaveLength(0);
    });

    it('should check if over/under probabilities are valid', () => {
      const validProb = new TotalProbability({ over: 0.52, under: 0.48, total: 45.5 });
      expect(validProb.isValid()).toBe(true);

      const invalidProb = new TotalProbability({ over: 0.6, under: 0.5, total: 45.5 });
      expect(invalidProb.isValid()).toBe(false);
    });
  });

  describe('PlayerPropProbability', () => {
    it('should validate valid player prop', async () => {
      const propProb = new PlayerPropProbability({
        playerId: 'player-1',
        propType: 'passing_yards',
        line: 250.5,
        overProbability: 0.45,
        underProbability: 0.55,
        confidence: 0.7
      });
      const errors = await validate(propProb);
      expect(errors).toHaveLength(0);
    });

    it('should require non-empty playerId', async () => {
      const propProb = new PlayerPropProbability({
        playerId: '',
        propType: 'passing_yards',
        line: 250.5,
        overProbability: 0.45,
        underProbability: 0.55,
        confidence: 0.7
      });
      const errors = await validate(propProb);
      expect(errors.some(error => error.property === 'playerId')).toBe(true);
    });

    it('should check if over/under probabilities are valid', () => {
      const validProb = new PlayerPropProbability({
        playerId: 'player-1',
        propType: 'passing_yards',
        line: 250.5,
        overProbability: 0.45,
        underProbability: 0.55,
        confidence: 0.7
      });
      expect(validProb.isValid()).toBe(true);

      const invalidProb = new PlayerPropProbability({
        playerId: 'player-1',
        propType: 'passing_yards',
        line: 250.5,
        overProbability: 0.6,
        underProbability: 0.5,
        confidence: 0.7
      });
      expect(invalidProb.isValid()).toBe(false);
    });
  });

  describe('GameProbabilities', () => {
    let gameProbabilities: GameProbabilities;

    beforeEach(() => {
      gameProbabilities = new GameProbabilities(validGameProbabilitiesData);
    });

    it('should validate valid game probabilities', async () => {
      const errors = await validate(gameProbabilities, { skipMissingProperties: true });
      expect(gameProbabilities.gameId).toBe('game-123');
    });

    it('should require non-empty gameId', async () => {
      const invalidData = { ...validGameProbabilitiesData, gameId: '' };
      const gameProb = new GameProbabilities(invalidData);
      const errors = await validate(gameProb);
      expect(errors.some(error => error.property === 'gameId')).toBe(true);
    });

    it('should get home probability', () => {
      expect(gameProbabilities.getHomeProbability()).toBe(0.6);
    });

    it('should get away probability', () => {
      expect(gameProbabilities.getAwayProbability()).toBe(0.4);
    });

    it('should get implied total', () => {
      expect(gameProbabilities.getImpliedTotal()).toBe(45.5);
    });

    it('should calculate confidence interval for win probability', () => {
      const ci = gameProbabilities.getWinProbabilityConfidenceInterval(0.95);
      expect(ci.lower).toBeLessThan(ci.upper);
      expect(ci.lower).toBeGreaterThanOrEqual(0);
      expect(ci.upper).toBeLessThanOrEqual(1);
    });

    it('should get player prop probability', () => {
      const propProb = gameProbabilities.getPlayerPropProbability('player-1', 'passing_yards');
      expect(propProb).toBeDefined();
      expect(propProb?.playerId).toBe('player-1');
      expect(propProb?.propType).toBe('passing_yards');
    });

    it('should return undefined for non-existent player prop', () => {
      const propProb = gameProbabilities.getPlayerPropProbability('player-999', 'rushing_yards');
      expect(propProb).toBeUndefined();
    });

    it('should calculate Kelly criterion', () => {
      const kellyCriterion = gameProbabilities.calculateKellyCriterion(0.6, 150);
      expect(kellyCriterion).toBeGreaterThanOrEqual(0);
      expect(kellyCriterion).toBeLessThanOrEqual(1);
    });

    it('should return 0 for negative Kelly criterion', () => {
      const kellyCriterion = gameProbabilities.calculateKellyCriterion(0.3, 150);
      expect(kellyCriterion).toBe(0);
    });
  });
});
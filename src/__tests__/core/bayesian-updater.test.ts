import 'reflect-metadata';
import { BayesianUpdater, Evidence, EvidenceType, Prior, GameEvent } from '../../core/bayesian-updater';
import { BetaDistribution, NormalDistribution } from '../../core/probability-distributions';
import { GameProbabilities, WinProbability, SpreadProbability, TotalProbability } from '../../models/GameProbabilities';
import { GameState } from '../../models/GameState';
import { Game } from '../../models/Game';
import { Team } from '../../models/Team';

describe('BayesianUpdater', () => {
  let updater: BayesianUpdater;
  let mockGameState: GameState;
  let mockGameProbabilities: GameProbabilities;

  beforeEach(() => {
    updater = new BayesianUpdater();
    
    // Create mock game state
    const homeTeam = new Team({
      id: 'team1',
      name: 'Home Team',
      city: 'Home City',
      abbreviation: 'HT',
      conference: 'NFC',
      division: 'North'
    });

    const awayTeam = new Team({
      id: 'team2',
      name: 'Away Team',
      city: 'Away City',
      abbreviation: 'AT',
      conference: 'AFC',
      division: 'South'
    });

    const game = new Game({
      id: 'game1',
      homeTeam,
      awayTeam,
      scheduledTime: new Date(),
      season: 2024,
      week: 1
    });

    mockGameState = new GameState({
      game,
      score: { home: 14, away: 7 },
      timeRemaining: { quarter: 2, minutes: 8, seconds: 30, overtime: false },
      possession: homeTeam,
      fieldPosition: { side: 'home', yardLine: 35 },
      down: 2,
      yardsToGo: 7,
      momentum: { value: 0.6, trend: 'increasing', lastUpdated: new Date() },
      drives: [],
      penalties: [],
      timeouts: { home: 3, away: 2 }
    });

    mockGameProbabilities = new GameProbabilities({
      gameId: 'game1',
      timestamp: new Date(),
      winProbability: new WinProbability({ home: 0.65, away: 0.35 }),
      spreadProbability: new SpreadProbability({ spread: -3.5, probability: 0.52, confidence: 0.8 }),
      totalProbability: new TotalProbability({ over: 0.48, under: 0.52, total: 47.5 }),
      playerProps: []
    });
  });

  describe('updatePrior', () => {
    it('should update prior probability with evidence', () => {
      const prior: Prior = {
        distribution: new BetaDistribution(2, 2),
        confidence: 0.7,
        lastUpdated: new Date()
      };

      const evidence: Evidence = {
        type: EvidenceType.TOUCHDOWN,
        value: 0.3,
        confidence: 0.8,
        timestamp: new Date(),
        gameId: 'game1'
      };

      const posterior = updater.updatePrior(prior, evidence);

      expect(posterior.probability).toBeGreaterThan(prior.distribution.mean());
      expect(posterior.confidence).toBeGreaterThan(0);
      expect(posterior.confidence).toBeLessThan(1);
      expect(posterior.evidence).toHaveLength(1);
      expect(posterior.evidence[0]).toBe(evidence);
    });

    it('should handle negative evidence (favoring away team)', () => {
      const prior: Prior = {
        distribution: new BetaDistribution(3, 2),
        confidence: 0.6,
        lastUpdated: new Date()
      };

      const evidence: Evidence = {
        type: EvidenceType.TURNOVER,
        value: -0.4,
        confidence: 0.9,
        timestamp: new Date(),
        gameId: 'game1'
      };

      const posterior = updater.updatePrior(prior, evidence);

      expect(posterior.probability).toBeLessThan(prior.distribution.mean());
      expect(posterior.confidence).toBeGreaterThan(0);
    });

    it('should maintain probability bounds', () => {
      const prior: Prior = {
        distribution: new BetaDistribution(1, 1),
        confidence: 0.5,
        lastUpdated: new Date()
      };

      const strongEvidence: Evidence = {
        type: EvidenceType.TOUCHDOWN,
        value: 1.0,
        confidence: 1.0,
        timestamp: new Date(),
        gameId: 'game1'
      };

      const posterior = updater.updatePrior(prior, strongEvidence);

      expect(posterior.probability).toBeGreaterThanOrEqual(0.01);
      expect(posterior.probability).toBeLessThanOrEqual(0.99);
    });
  });

  describe('calculatePosterior', () => {
    it('should calculate posterior probability using Bayes theorem', () => {
      const likelihood = 0.8;
      const prior = 0.5;

      const posterior = updater.calculatePosterior(likelihood, prior);

      expect(posterior).toBeGreaterThan(prior);
      expect(posterior).toBeGreaterThanOrEqual(0.01);
      expect(posterior).toBeLessThanOrEqual(0.99);
    });

    it('should handle extreme likelihood values', () => {
      const highLikelihood = 0.95;
      const lowPrior = 0.1;

      const posterior = updater.calculatePosterior(highLikelihood, lowPrior);

      expect(posterior).toBeGreaterThan(lowPrior);
      expect(posterior).toBeLessThan(1);
    });

    it('should be symmetric for complementary probabilities', () => {
      const likelihood = 0.7;
      const prior = 0.4;

      const posterior1 = updater.calculatePosterior(likelihood, prior);
      const posterior2 = updater.calculatePosterior(1 - likelihood, 1 - prior);

      expect(Math.abs((1 - posterior1) - posterior2)).toBeLessThan(0.01);
    });
  });

  describe('updateProbabilitiesFromEvent', () => {
    it('should update win probabilities based on touchdown event', () => {
      const gameEvent: GameEvent = {
        id: 'event1',
        gameId: 'game1',
        type: EvidenceType.TOUCHDOWN,
        description: 'Home team touchdown',
        impact: 0.4,
        confidence: 0.85,
        timestamp: new Date(),
        gameState: mockGameState
      };

      const updatedProbabilities = updater.updateProbabilitiesFromEvent(
        mockGameProbabilities,
        gameEvent
      );

      expect(updatedProbabilities.winProbability.home).toBeGreaterThan(
        mockGameProbabilities.winProbability.home
      );
      expect(updatedProbabilities.winProbability.away).toBeLessThan(
        mockGameProbabilities.winProbability.away
      );
      expect(updatedProbabilities.winProbability.home + updatedProbabilities.winProbability.away)
        .toBeCloseTo(1, 2);
    });

    it('should update spread probabilities based on game events', () => {
      const gameEvent: GameEvent = {
        id: 'event2',
        gameId: 'game1',
        type: EvidenceType.FIELD_GOAL,
        description: 'Home team field goal',
        impact: 0.2,
        confidence: 0.7,
        timestamp: new Date(),
        gameState: mockGameState
      };

      const updatedProbabilities = updater.updateProbabilitiesFromEvent(
        mockGameProbabilities,
        gameEvent
      );

      expect(updatedProbabilities.spreadProbability.probability).not.toBe(
        mockGameProbabilities.spreadProbability.probability
      );
      expect(updatedProbabilities.spreadProbability.probability).toBeGreaterThanOrEqual(0.01);
      expect(updatedProbabilities.spreadProbability.probability).toBeLessThanOrEqual(0.99);
    });

    it('should handle turnover events correctly', () => {
      const turnoverEvent: GameEvent = {
        id: 'event3',
        gameId: 'game1',
        type: EvidenceType.TURNOVER,
        description: 'Home team fumble',
        impact: -0.3,
        confidence: 0.9,
        timestamp: new Date(),
        gameState: mockGameState
      };

      const updatedProbabilities = updater.updateProbabilitiesFromEvent(
        mockGameProbabilities,
        turnoverEvent
      );

      expect(updatedProbabilities.winProbability.home).toBeLessThan(
        mockGameProbabilities.winProbability.home
      );
      expect(updatedProbabilities.winProbability.away).toBeGreaterThan(
        mockGameProbabilities.winProbability.away
      );
    });

    it('should update total probabilities for scoring events', () => {
      const scoringEvent: GameEvent = {
        id: 'event4',
        gameId: 'game1',
        type: EvidenceType.TOUCHDOWN,
        description: 'Touchdown scored',
        impact: 0.3,
        confidence: 0.8,
        timestamp: new Date(),
        gameState: mockGameState
      };

      const updatedProbabilities = updater.updateProbabilitiesFromEvent(
        mockGameProbabilities,
        scoringEvent
      );

      expect(updatedProbabilities.totalProbability.over).toBeGreaterThan(
        mockGameProbabilities.totalProbability.over
      );
      expect(updatedProbabilities.totalProbability.under).toBeLessThan(
        mockGameProbabilities.totalProbability.under
      );
    });

    it('should maintain probability constraints', () => {
      const gameEvent: GameEvent = {
        id: 'event5',
        gameId: 'game1',
        type: EvidenceType.TOUCHDOWN,
        description: 'Strong evidence event',
        impact: 0.8,
        confidence: 0.95,
        timestamp: new Date(),
        gameState: mockGameState
      };

      const updatedProbabilities = updater.updateProbabilitiesFromEvent(
        mockGameProbabilities,
        gameEvent
      );

      // Check win probability constraints
      expect(updatedProbabilities.winProbability.home).toBeGreaterThanOrEqual(0);
      expect(updatedProbabilities.winProbability.home).toBeLessThanOrEqual(1);
      expect(updatedProbabilities.winProbability.away).toBeGreaterThanOrEqual(0);
      expect(updatedProbabilities.winProbability.away).toBeLessThanOrEqual(1);

      // Check spread probability constraints
      expect(updatedProbabilities.spreadProbability.probability).toBeGreaterThanOrEqual(0.01);
      expect(updatedProbabilities.spreadProbability.probability).toBeLessThanOrEqual(0.99);

      // Check total probability constraints
      expect(updatedProbabilities.totalProbability.over).toBeGreaterThanOrEqual(0.01);
      expect(updatedProbabilities.totalProbability.over).toBeLessThanOrEqual(0.99);
      expect(updatedProbabilities.totalProbability.under).toBeGreaterThanOrEqual(0.01);
      expect(updatedProbabilities.totalProbability.under).toBeLessThanOrEqual(0.99);
    });
  });

  describe('batchUpdateProbabilities', () => {
    it('should process multiple events in sequence', () => {
      const events: GameEvent[] = [
        {
          id: 'event1',
          gameId: 'game1',
          type: EvidenceType.TOUCHDOWN,
          description: 'Home touchdown',
          impact: 0.3,
          confidence: 0.8,
          timestamp: new Date(),
          gameState: mockGameState
        },
        {
          id: 'event2',
          gameId: 'game1',
          type: EvidenceType.FIELD_GOAL,
          description: 'Away field goal',
          impact: -0.15,
          confidence: 0.7,
          timestamp: new Date(),
          gameState: mockGameState
        }
      ];

      const updatedProbabilities = updater.batchUpdateProbabilities(
        mockGameProbabilities,
        events
      );

      expect(updatedProbabilities.winProbability.home).not.toBe(
        mockGameProbabilities.winProbability.home
      );
      expect(updatedProbabilities.timestamp).toBeInstanceOf(Date);
    });

    it('should handle empty event array', () => {
      const updatedProbabilities = updater.batchUpdateProbabilities(
        mockGameProbabilities,
        []
      );

      expect(updatedProbabilities).toBe(mockGameProbabilities);
    });

    it('should accumulate effects of multiple events', () => {
      const positiveEvents: GameEvent[] = [
        {
          id: 'event1',
          gameId: 'game1',
          type: EvidenceType.TOUCHDOWN,
          description: 'Home touchdown 1',
          impact: 0.2,
          confidence: 0.8,
          timestamp: new Date(),
          gameState: mockGameState
        },
        {
          id: 'event2',
          gameId: 'game1',
          type: EvidenceType.TOUCHDOWN,
          description: 'Home touchdown 2',
          impact: 0.2,
          confidence: 0.8,
          timestamp: new Date(),
          gameState: mockGameState
        }
      ];

      const singleEventProbs = updater.updateProbabilitiesFromEvent(
        mockGameProbabilities,
        positiveEvents[0]
      );

      const batchEventProbs = updater.batchUpdateProbabilities(
        mockGameProbabilities,
        positiveEvents
      );

      expect(batchEventProbs.winProbability.home).toBeGreaterThan(
        singleEventProbs.winProbability.home
      );
    });
  });

  describe('evidence type handling', () => {
    it('should weight different evidence types appropriately', () => {
      const touchdownEvent: GameEvent = {
        id: 'td',
        gameId: 'game1',
        type: EvidenceType.TOUCHDOWN,
        description: 'Touchdown',
        impact: 0.3,
        confidence: 0.8,
        timestamp: new Date(),
        gameState: mockGameState
      };

      const penaltyEvent: GameEvent = {
        id: 'penalty',
        gameId: 'game1',
        type: EvidenceType.PENALTY,
        description: 'Penalty',
        impact: 0.3,
        confidence: 0.8,
        timestamp: new Date(),
        gameState: mockGameState
      };

      const touchdownUpdate = updater.updateProbabilitiesFromEvent(
        mockGameProbabilities,
        touchdownEvent
      );

      const penaltyUpdate = updater.updateProbabilitiesFromEvent(
        mockGameProbabilities,
        penaltyEvent
      );

      const touchdownChange = Math.abs(
        touchdownUpdate.winProbability.home - mockGameProbabilities.winProbability.home
      );
      const penaltyChange = Math.abs(
        penaltyUpdate.winProbability.home - mockGameProbabilities.winProbability.home
      );

      expect(touchdownChange).toBeGreaterThan(penaltyChange);
    });
  });

  describe('confidence handling', () => {
    it('should incorporate evidence confidence into updates', () => {
      const highConfidenceEvent: GameEvent = {
        id: 'high',
        gameId: 'game1',
        type: EvidenceType.TOUCHDOWN,
        description: 'High confidence touchdown',
        impact: 0.3,
        confidence: 0.95,
        timestamp: new Date(),
        gameState: mockGameState
      };

      const lowConfidenceEvent: GameEvent = {
        id: 'low',
        gameId: 'game1',
        type: EvidenceType.TOUCHDOWN,
        description: 'Low confidence touchdown',
        impact: 0.3,
        confidence: 0.3,
        timestamp: new Date(),
        gameState: mockGameState
      };

      const highConfidenceUpdate = updater.updateProbabilitiesFromEvent(
        mockGameProbabilities,
        highConfidenceEvent
      );

      const lowConfidenceUpdate = updater.updateProbabilitiesFromEvent(
        mockGameProbabilities,
        lowConfidenceEvent
      );

      const highConfidenceChange = Math.abs(
        highConfidenceUpdate.winProbability.home - mockGameProbabilities.winProbability.home
      );
      const lowConfidenceChange = Math.abs(
        lowConfidenceUpdate.winProbability.home - mockGameProbabilities.winProbability.home
      );

      expect(highConfidenceChange).toBeGreaterThan(lowConfidenceChange);
    });
  });

  describe('edge cases', () => {
    it('should handle extreme probability values', () => {
      const extremeProbabilities = new GameProbabilities({
        gameId: 'game1',
        timestamp: new Date(),
        winProbability: new WinProbability({ home: 0.95, away: 0.05 }),
        spreadProbability: new SpreadProbability({ spread: -14, probability: 0.9, confidence: 0.9 }),
        totalProbability: new TotalProbability({ over: 0.1, under: 0.9, total: 35 }),
        playerProps: []
      });

      const gameEvent: GameEvent = {
        id: 'extreme',
        gameId: 'game1',
        type: EvidenceType.TOUCHDOWN,
        description: 'Extreme case touchdown',
        impact: 0.5,
        confidence: 0.9,
        timestamp: new Date(),
        gameState: mockGameState
      };

      const updatedProbabilities = updater.updateProbabilitiesFromEvent(
        extremeProbabilities,
        gameEvent
      );

      expect(updatedProbabilities.winProbability.home).toBeLessThanOrEqual(0.99);
      expect(updatedProbabilities.winProbability.away).toBeGreaterThanOrEqual(0.01);
    });

    it('should handle zero impact events', () => {
      const zeroImpactEvent: GameEvent = {
        id: 'zero',
        gameId: 'game1',
        type: EvidenceType.TIME_REMAINING,
        description: 'Time update',
        impact: 0,
        confidence: 0.5,
        timestamp: new Date(),
        gameState: mockGameState
      };

      const updatedProbabilities = updater.updateProbabilitiesFromEvent(
        mockGameProbabilities,
        zeroImpactEvent
      );

      // Should have minimal change
      expect(Math.abs(
        updatedProbabilities.winProbability.home - mockGameProbabilities.winProbability.home
      )).toBeLessThan(0.1);
    });
  });
});
import { 
  ProbabilityDistribution, 
  NormalDistribution, 
  BetaDistribution, 
  GammaDistribution 
} from './probability-distributions';
import { GameState } from '../models/GameState';
import { GameProbabilities, WinProbability, SpreadProbability, TotalProbability } from '../models/GameProbabilities';

/**
 * Evidence interface for Bayesian updates
 */
export interface Evidence {
  type: EvidenceType;
  value: number;
  confidence: number;
  timestamp: Date;
  gameId: string;
  metadata?: { [key: string]: any };
}

export enum EvidenceType {
  SCORE_CHANGE = 'score_change',
  TURNOVER = 'turnover',
  FIELD_GOAL = 'field_goal',
  TOUCHDOWN = 'touchdown',
  PENALTY = 'penalty',
  INJURY = 'injury',
  WEATHER_CHANGE = 'weather_change',
  MOMENTUM_SHIFT = 'momentum_shift',
  TIME_REMAINING = 'time_remaining',
  FIELD_POSITION = 'field_position'
}

/**
 * Prior probability interface
 */
export interface Prior {
  distribution: ProbabilityDistribution;
  confidence: number;
  lastUpdated: Date;
}

/**
 * Posterior probability result
 */
export interface Posterior {
  distribution: ProbabilityDistribution;
  probability: number;
  confidence: number;
  evidence: Evidence[];
  timestamp: Date;
}

/**
 * Game event interface for probability updates
 */
export interface GameEvent {
  id: string;
  gameId: string;
  type: EvidenceType;
  description: string;
  impact: number; // -1 to 1, negative favors away team, positive favors home team
  confidence: number; // 0 to 1
  timestamp: Date;
  gameState: GameState;
  metadata?: { [key: string]: any };
}

/**
 * Bayesian probability updater for football analytics
 */
export class BayesianUpdater {
  private readonly DEFAULT_CONFIDENCE = 0.5;
  private readonly MIN_CONFIDENCE = 0.01;
  private readonly MAX_CONFIDENCE = 0.99;

  /**
   * Update prior probability with new evidence using Bayes' theorem
   */
  updatePrior(prior: Prior, evidence: Evidence): Posterior {
    const likelihood = this.calculateLikelihood(evidence);
    const priorProbability = prior.distribution.mean();
    
    // Bayes' theorem: P(H|E) = P(E|H) * P(H) / P(E)
    const posteriorProbability = this.calculatePosterior(likelihood, priorProbability);
    
    // Update distribution parameters based on evidence
    const updatedDistribution = this.updateDistribution(prior.distribution, evidence, posteriorProbability);
    
    // Calculate new confidence based on evidence strength and prior confidence
    const newConfidence = this.updateConfidence(prior.confidence, evidence.confidence);
    
    return {
      distribution: updatedDistribution,
      probability: posteriorProbability,
      confidence: newConfidence,
      evidence: [evidence],
      timestamp: new Date()
    };
  }

  /**
   * Calculate posterior probability using Bayes' theorem
   */
  calculatePosterior(likelihood: number, prior: number): number {
    // Simplified Bayes' update assuming uniform marginal probability
    const numerator = likelihood * prior;
    const denominator = likelihood * prior + (1 - likelihood) * (1 - prior);
    
    return Math.max(this.MIN_CONFIDENCE, Math.min(this.MAX_CONFIDENCE, numerator / denominator));
  }

  /**
   * Update probabilities based on game events
   */
  updateProbabilitiesFromEvent(
    currentProbabilities: GameProbabilities,
    gameEvent: GameEvent
  ): GameProbabilities {
    const evidence: Evidence = {
      type: gameEvent.type,
      value: gameEvent.impact,
      confidence: gameEvent.confidence,
      timestamp: gameEvent.timestamp,
      gameId: gameEvent.gameId,
      metadata: gameEvent.metadata
    };

    // Create prior from current win probability
    const winPrior: Prior = {
      distribution: new BetaDistribution(
        this.probabilityToAlpha(currentProbabilities.winProbability.home),
        this.probabilityToBeta(currentProbabilities.winProbability.home)
      ),
      confidence: 0.8, // Assume high confidence in current state
      lastUpdated: currentProbabilities.timestamp
    };

    // Update win probability
    const winPosterior = this.updatePrior(winPrior, evidence);
    const newWinProbability = winPosterior.probability;

    // Update spread probability based on win probability change
    const spreadAdjustment = this.calculateSpreadAdjustment(
      currentProbabilities.winProbability.home,
      newWinProbability,
      gameEvent
    );

    // Update total probability based on game context
    const totalAdjustment = this.calculateTotalAdjustment(gameEvent);

    return new GameProbabilities({
      gameId: currentProbabilities.gameId,
      timestamp: new Date(),
      winProbability: new WinProbability({
        home: newWinProbability,
        away: 1 - newWinProbability
      }),
      spreadProbability: new SpreadProbability({
        spread: currentProbabilities.spreadProbability.spread,
        probability: Math.max(0.01, Math.min(0.99, 
          currentProbabilities.spreadProbability.probability + spreadAdjustment
        )),
        confidence: winPosterior.confidence
      }),
      totalProbability: new TotalProbability({
        over: Math.max(0.01, Math.min(0.99,
          currentProbabilities.totalProbability.over + totalAdjustment
        )),
        under: Math.max(0.01, Math.min(0.99,
          currentProbabilities.totalProbability.under - totalAdjustment
        )),
        total: currentProbabilities.totalProbability.total
      }),
      playerProps: this.updatePlayerProps(currentProbabilities.playerProps, gameEvent)
    });
  }

  /**
   * Batch update probabilities with multiple events
   */
  batchUpdateProbabilities(
    currentProbabilities: GameProbabilities,
    events: GameEvent[]
  ): GameProbabilities {
    return events.reduce((probabilities, event) => {
      return this.updateProbabilitiesFromEvent(probabilities, event);
    }, currentProbabilities);
  }

  /**
   * Calculate likelihood of evidence given hypothesis
   */
  private calculateLikelihood(evidence: Evidence): number {
    const impact = evidence.value; // Keep sign for direction
    const confidenceWeight = evidence.confidence;
    
    // Different evidence types have different base likelihoods
    const typeMultiplier = this.getEvidenceTypeMultiplier(evidence.type);
    
    // For negative impact (favoring away team), likelihood should be < 0.5
    // For positive impact (favoring home team), likelihood should be > 0.5
    return Math.max(0.01, Math.min(0.99, 
      0.5 + (impact * confidenceWeight * typeMultiplier)
    ));
  }

  /**
   * Get evidence type multiplier for likelihood calculation
   */
  private getEvidenceTypeMultiplier(type: EvidenceType): number {
    const multipliers: { [key in EvidenceType]: number } = {
      [EvidenceType.TOUCHDOWN]: 0.4,
      [EvidenceType.TURNOVER]: 0.35,
      [EvidenceType.FIELD_GOAL]: 0.2,
      [EvidenceType.SCORE_CHANGE]: 0.3,
      [EvidenceType.INJURY]: 0.25,
      [EvidenceType.PENALTY]: 0.1,
      [EvidenceType.WEATHER_CHANGE]: 0.15,
      [EvidenceType.MOMENTUM_SHIFT]: 0.2,
      [EvidenceType.TIME_REMAINING]: 0.1,
      [EvidenceType.FIELD_POSITION]: 0.05
    };
    
    return multipliers[type] || 0.1;
  }

  /**
   * Update distribution parameters based on evidence
   */
  private updateDistribution(
    distribution: ProbabilityDistribution,
    evidence: Evidence,
    posteriorProbability: number
  ): ProbabilityDistribution {
    if (distribution instanceof BetaDistribution) {
      // Update Beta distribution parameters
      const currentMean = distribution.mean();
      const adjustment = (posteriorProbability - currentMean) * evidence.confidence;
      
      const newAlpha = this.probabilityToAlpha(posteriorProbability + adjustment * 0.1);
      const newBeta = this.probabilityToBeta(posteriorProbability + adjustment * 0.1);
      
      return new BetaDistribution(newAlpha, newBeta);
    }
    
    if (distribution instanceof NormalDistribution) {
      // Update Normal distribution parameters
      const currentMean = distribution.mean();
      const currentVariance = distribution.variance();
      
      const newMean = currentMean + (evidence.value * evidence.confidence * 0.1);
      const newStdDev = Math.sqrt(currentVariance * (1 - evidence.confidence * 0.1));
      
      return new NormalDistribution(newMean, newStdDev);
    }
    
    // Default: return original distribution
    return distribution;
  }

  /**
   * Update confidence based on evidence strength
   */
  private updateConfidence(priorConfidence: number, evidenceConfidence: number): number {
    // Weighted average with slight bias toward new evidence
    const weight = 0.3;
    return Math.max(this.MIN_CONFIDENCE, Math.min(this.MAX_CONFIDENCE,
      priorConfidence * (1 - weight) + evidenceConfidence * weight
    ));
  }

  /**
   * Convert probability to Beta distribution alpha parameter
   */
  private probabilityToAlpha(probability: number): number {
    // Use method of moments estimation
    const variance = probability * (1 - probability) * 0.1; // Assume 10% of max variance
    const alpha = probability * ((probability * (1 - probability)) / variance - 1);
    return Math.max(0.1, alpha);
  }

  /**
   * Convert probability to Beta distribution beta parameter
   */
  private probabilityToBeta(probability: number): number {
    const alpha = this.probabilityToAlpha(probability);
    return Math.max(0.1, alpha * (1 - probability) / probability);
  }

  /**
   * Calculate spread probability adjustment based on win probability change
   */
  private calculateSpreadAdjustment(
    oldWinProb: number,
    newWinProb: number,
    gameEvent: GameEvent
  ): number {
    const winProbChange = newWinProb - oldWinProb;
    const spreadSensitivity = 0.5; // How much spread probability changes per win probability change
    
    // Adjust based on game context
    const contextMultiplier = this.getSpreadContextMultiplier(gameEvent);
    
    return winProbChange * spreadSensitivity * contextMultiplier;
  }

  /**
   * Calculate total probability adjustment based on game event
   */
  private calculateTotalAdjustment(gameEvent: GameEvent): number {
    const scoringEvents = [
      EvidenceType.TOUCHDOWN,
      EvidenceType.FIELD_GOAL,
      EvidenceType.SCORE_CHANGE
    ];
    
    if (scoringEvents.includes(gameEvent.type)) {
      return gameEvent.impact * 0.1; // Scoring increases over probability
    }
    
    if (gameEvent.type === EvidenceType.TURNOVER) {
      return -gameEvent.impact * 0.05; // Turnovers might decrease scoring
    }
    
    return 0; // No adjustment for other events
  }

  /**
   * Get spread context multiplier based on game event
   */
  private getSpreadContextMultiplier(gameEvent: GameEvent): number {
    const timeRemaining = gameEvent.gameState.timeRemaining;
    const quarter = timeRemaining.quarter;
    
    // Late game events have more impact on spread
    if (quarter >= 4) {
      return 1.5;
    }
    
    if (quarter >= 3) {
      return 1.2;
    }
    
    return 1.0;
  }

  /**
   * Update player props based on game event
   */
  private updatePlayerProps(
    currentProps: any[],
    gameEvent: GameEvent
  ): any[] {
    // For now, return current props unchanged
    // This would be expanded to update specific player props based on game events
    return currentProps;
  }
}
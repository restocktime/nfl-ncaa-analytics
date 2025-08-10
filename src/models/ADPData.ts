import { ADPData as IADPData } from '../types/espn-draft.types';

/**
 * ADPData Model Class
 * 
 * Represents Average Draft Position data with validation and analysis methods.
 * Implements the ADPData interface with additional business logic.
 */
export class ADPData implements IADPData {
  public playerId: string;
  public playerName: string;
  public position: string;
  public averageDraftPosition: number;
  public standardDeviation: number;
  public draftPercentage: number;
  public positionRank: number;
  public leagueSize: number;
  public scoringFormat: string;

  constructor(data: Partial<IADPData>) {
    this.playerId = data.playerId || '';
    this.playerName = data.playerName || '';
    this.position = data.position || '';
    this.averageDraftPosition = data.averageDraftPosition || 0;
    this.standardDeviation = data.standardDeviation || 0;
    this.draftPercentage = data.draftPercentage || 0;
    this.positionRank = data.positionRank || 0;
    this.leagueSize = data.leagueSize || 12;
    this.scoringFormat = data.scoringFormat || 'PPR';
  }

  /**
   * Validates the ADP data
   * @returns Array of validation errors, empty if valid
   */
  public validate(): string[] {
    const errors: string[] = [];

    if (!this.playerId || this.playerId.trim().length === 0) {
      errors.push('Player ID is required');
    }

    if (!this.playerName || this.playerName.trim().length === 0) {
      errors.push('Player name is required');
    }

    if (!this.position || this.position.trim().length === 0) {
      errors.push('Position is required');
    }

    if (this.averageDraftPosition <= 0) {
      errors.push('Average draft position must be greater than 0');
    }

    if (this.standardDeviation < 0) {
      errors.push('Standard deviation cannot be negative');
    }

    if (this.draftPercentage < 0 || this.draftPercentage > 100) {
      errors.push('Draft percentage must be between 0 and 100');
    }

    if (this.positionRank <= 0) {
      errors.push('Position rank must be greater than 0');
    }

    if (this.leagueSize < 4 || this.leagueSize > 20) {
      errors.push('League size must be between 4 and 20');
    }

    if (!this.scoringFormat || this.scoringFormat.trim().length === 0) {
      errors.push('Scoring format is required');
    }

    return errors;
  }

  /**
   * Checks if the ADP data is valid
   * @returns True if valid, false otherwise
   */
  public isValid(): boolean {
    return this.validate().length === 0;
  }

  /**
   * Serializes the ADP data to a plain object
   * @returns Plain object representation
   */
  public toJSON(): IADPData {
    return {
      playerId: this.playerId,
      playerName: this.playerName,
      position: this.position,
      averageDraftPosition: this.averageDraftPosition,
      standardDeviation: this.standardDeviation,
      draftPercentage: this.draftPercentage,
      positionRank: this.positionRank,
      leagueSize: this.leagueSize,
      scoringFormat: this.scoringFormat,
    };
  }

  /**
   * Creates an ADPData instance from a plain object
   * @param data Plain object data
   * @returns ADPData instance
   */
  public static fromJSON(data: any): ADPData {
    return new ADPData({
      playerId: data.playerId,
      playerName: data.playerName,
      position: data.position,
      averageDraftPosition: Number(data.averageDraftPosition),
      standardDeviation: Number(data.standardDeviation),
      draftPercentage: Number(data.draftPercentage),
      positionRank: Number(data.positionRank),
      leagueSize: Number(data.leagueSize),
      scoringFormat: data.scoringFormat,
    });
  }

  /**
   * Gets the round where this player is typically drafted
   * @returns Round number (1-based)
   */
  public getTypicalRound(): number {
    return Math.ceil(this.averageDraftPosition / this.leagueSize);
  }

  /**
   * Gets the pick number within the typical round
   * @returns Pick number within round (1-based)
   */
  public getPickInRound(): number {
    const round = this.getTypicalRound();
    return this.averageDraftPosition - ((round - 1) * this.leagueSize);
  }

  /**
   * Determines if this player has high draft volatility
   * @param threshold Standard deviation threshold (default: 10)
   * @returns True if volatile, false otherwise
   */
  public isVolatile(threshold: number = 10): boolean {
    return this.standardDeviation > threshold;
  }

  /**
   * Gets the draft range (ADP ± 1 standard deviation)
   * @returns Object with min and max draft positions
   */
  public getDraftRange(): { min: number; max: number } {
    return {
      min: Math.max(1, Math.round(this.averageDraftPosition - this.standardDeviation)),
      max: Math.round(this.averageDraftPosition + this.standardDeviation),
    };
  }

  /**
   * Determines if this player is commonly drafted
   * @param threshold Draft percentage threshold (default: 50)
   * @returns True if commonly drafted, false otherwise
   */
  public isCommonlyDrafted(threshold: number = 50): boolean {
    return this.draftPercentage >= threshold;
  }

  /**
   * Gets the tier based on position rank
   * @returns Tier number (1 = elite, 2 = very good, etc.)
   */
  public getTier(): number {
    if (this.positionRank <= 3) return 1; // Elite
    if (this.positionRank <= 8) return 2; // Very good
    if (this.positionRank <= 15) return 3; // Good
    if (this.positionRank <= 25) return 4; // Decent
    return 5; // Deep league/handcuff
  }

  /**
   * Gets a tier description
   * @returns Human-readable tier description
   */
  public getTierDescription(): string {
    const tier = this.getTier();
    switch (tier) {
      case 1: return 'Elite';
      case 2: return 'Very Good';
      case 3: return 'Good';
      case 4: return 'Decent';
      case 5: return 'Deep League';
      default: return 'Unknown';
    }
  }

  /**
   * Compares this ADP with another for sorting
   * @param other Another ADPData instance
   * @returns Comparison result (-1, 0, 1)
   */
  public compareTo(other: ADPData): number {
    return this.averageDraftPosition - other.averageDraftPosition;
  }

  /**
   * Calculates value at a specific draft position
   * @param draftPosition The draft position to evaluate
   * @returns Value score (positive = good value, negative = reach)
   */
  public getValueAtPosition(draftPosition: number): number {
    return this.averageDraftPosition - draftPosition;
  }

  /**
   * Determines if drafting at a position would be good value
   * @param draftPosition The draft position to evaluate
   * @param valueThreshold Minimum value threshold (default: 5)
   * @returns True if good value, false otherwise
   */
  public isGoodValueAt(draftPosition: number, valueThreshold: number = 5): boolean {
    return this.getValueAtPosition(draftPosition) >= valueThreshold;
  }

  /**
   * Determines if drafting at a position would be a reach
   * @param draftPosition The draft position to evaluate
   * @param reachThreshold Reach threshold (default: -10)
   * @returns True if reach, false otherwise
   */
  public isReachAt(draftPosition: number, reachThreshold: number = -10): boolean {
    return this.getValueAtPosition(draftPosition) <= reachThreshold;
  }

  /**
   * Gets position group for the player
   * @returns Position group (QB, RB, WR, TE, K, DST)
   */
  public getPositionGroup(): string {
    const position = this.position.toUpperCase();
    if (['QB'].includes(position)) return 'QB';
    if (['RB'].includes(position)) return 'RB';
    if (['WR'].includes(position)) return 'WR';
    if (['TE'].includes(position)) return 'TE';
    if (['K', 'PK'].includes(position)) return 'K';
    if (['DST', 'DEF', 'D/ST'].includes(position)) return 'DST';
    return position;
  }

  /**
   * Adjusts ADP for different league sizes
   * @param targetLeagueSize Target league size
   * @returns Adjusted ADP for the target league size
   */
  public adjustForLeagueSize(targetLeagueSize: number): number {
    if (targetLeagueSize === this.leagueSize) {
      return this.averageDraftPosition;
    }

    // Simple linear adjustment - more sophisticated algorithms could be used
    const ratio = targetLeagueSize / this.leagueSize;
    return Math.round(this.averageDraftPosition * ratio);
  }

  /**
   * Gets draft recommendation based on ADP and context
   * @param currentPick Current draft pick number
   * @param nextPick Next draft pick number
   * @returns Draft recommendation
   */
  public getDraftRecommendation(currentPick: number, nextPick: number): {
    recommendation: 'DRAFT_NOW' | 'WAIT' | 'RISKY_WAIT' | 'MISSED_WINDOW';
    reasoning: string;
    confidence: number;
  } {
    const value = this.getValueAtPosition(currentPick);
    const nextValue = this.getValueAtPosition(nextPick);
    const range = this.getDraftRange();

    if (currentPick < range.min) {
      return {
        recommendation: 'WAIT',
        reasoning: `Player typically goes around pick ${this.averageDraftPosition.toFixed(1)}`,
        confidence: 0.8,
      };
    }

    if (currentPick > range.max) {
      return {
        recommendation: 'MISSED_WINDOW',
        reasoning: 'Player likely to be drafted before your next pick',
        confidence: 0.9,
      };
    }

    if (nextPick > this.averageDraftPosition + this.standardDeviation) {
      return {
        recommendation: 'DRAFT_NOW',
        reasoning: 'Player unlikely to be available at next pick',
        confidence: 0.85,
      };
    }

    if (this.isVolatile()) {
      return {
        recommendation: 'RISKY_WAIT',
        reasoning: 'High volatility - could go much earlier or later',
        confidence: 0.6,
      };
    }

    return {
      recommendation: 'WAIT',
      reasoning: 'Player should be available at next pick',
      confidence: 0.7,
    };
  }
}
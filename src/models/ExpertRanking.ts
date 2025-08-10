import { ExpertRanking as IExpertRanking } from '../types/espn-draft.types';

/**
 * ExpertRanking Model Class
 * 
 * Represents ESPN expert player rankings with validation and serialization methods.
 * Implements the ExpertRanking interface with additional business logic.
 */
export class ExpertRanking implements IExpertRanking {
  public playerId: string;
  public playerName: string;
  public position: string;
  public team: string;
  public expertRank: number;
  public tier: number;
  public expertNotes: string;
  public projectedPoints: number;
  public riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  public lastUpdated: Date;

  constructor(data: Partial<IExpertRanking>) {
    this.playerId = data.playerId || '';
    this.playerName = data.playerName || '';
    this.position = data.position || '';
    this.team = data.team || '';
    this.expertRank = data.expertRank || 0;
    this.tier = data.tier || 1;
    this.expertNotes = data.expertNotes || '';
    this.projectedPoints = data.projectedPoints || 0;
    this.riskLevel = data.riskLevel || 'MEDIUM';
    this.lastUpdated = data.lastUpdated || new Date();
  }

  /**
   * Validates the expert ranking data
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

    if (!this.team || this.team.trim().length === 0) {
      errors.push('Team is required');
    }

    if (this.expertRank <= 0) {
      errors.push('Expert rank must be greater than 0');
    }

    if (this.tier <= 0) {
      errors.push('Tier must be greater than 0');
    }

    if (this.projectedPoints < 0) {
      errors.push('Projected points cannot be negative');
    }

    if (!['LOW', 'MEDIUM', 'HIGH'].includes(this.riskLevel)) {
      errors.push('Risk level must be LOW, MEDIUM, or HIGH');
    }

    if (!this.lastUpdated || isNaN(this.lastUpdated.getTime())) {
      errors.push('Last updated date is invalid');
    }

    return errors;
  }

  /**
   * Checks if the ranking data is valid
   * @returns True if valid, false otherwise
   */
  public isValid(): boolean {
    return this.validate().length === 0;
  }

  /**
   * Serializes the expert ranking to a plain object
   * @returns Plain object representation
   */
  public toJSON(): IExpertRanking {
    return {
      playerId: this.playerId,
      playerName: this.playerName,
      position: this.position,
      team: this.team,
      expertRank: this.expertRank,
      tier: this.tier,
      expertNotes: this.expertNotes,
      projectedPoints: this.projectedPoints,
      riskLevel: this.riskLevel,
      lastUpdated: this.lastUpdated,
    };
  }

  /**
   * Creates an ExpertRanking instance from a plain object
   * @param data Plain object data
   * @returns ExpertRanking instance
   */
  public static fromJSON(data: any): ExpertRanking {
    return new ExpertRanking({
      playerId: data.playerId,
      playerName: data.playerName,
      position: data.position,
      team: data.team,
      expertRank: Number(data.expertRank),
      tier: Number(data.tier),
      expertNotes: data.expertNotes,
      projectedPoints: Number(data.projectedPoints),
      riskLevel: data.riskLevel,
      lastUpdated: new Date(data.lastUpdated),
    });
  }

  /**
   * Compares this ranking with another for sorting
   * @param other Another ExpertRanking instance
   * @returns Comparison result (-1, 0, 1)
   */
  public compareTo(other: ExpertRanking): number {
    return this.expertRank - other.expertRank;
  }

  /**
   * Checks if the ranking is stale based on age
   * @param maxAgeHours Maximum age in hours before considered stale
   * @returns True if stale, false otherwise
   */
  public isStale(maxAgeHours: number = 6): boolean {
    const ageMs = Date.now() - this.lastUpdated.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    return ageHours > maxAgeHours;
  }

  /**
   * Gets a formatted risk level description
   * @returns Human-readable risk description
   */
  public getRiskDescription(): string {
    switch (this.riskLevel) {
      case 'LOW':
        return 'Safe pick with consistent performance';
      case 'MEDIUM':
        return 'Moderate risk with upside potential';
      case 'HIGH':
        return 'High risk, high reward player';
      default:
        return 'Unknown risk level';
    }
  }

  /**
   * Determines if this is a top-tier player
   * @returns True if in tier 1 or 2
   */
  public isTopTier(): boolean {
    return this.tier <= 2;
  }

  /**
   * Gets the position group for the player
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
}
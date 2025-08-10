import { MockDraftResult as IMockDraftResult, DraftPick } from '../types/espn-draft.types';

/**
 * MockDraftResult Model Class
 * 
 * Represents ESPN mock draft results with validation and analysis methods.
 * Implements the MockDraftResult interface with additional business logic.
 */
export class MockDraftResult implements IMockDraftResult {
  public draftId: string;
  public leagueSize: number;
  public scoringFormat: string;
  public picks: DraftPick[];
  public expertAnalysis: string;
  public draftDate: Date;

  constructor(data: Partial<IMockDraftResult>) {
    this.draftId = data.draftId || '';
    this.leagueSize = data.leagueSize || 12;
    this.scoringFormat = data.scoringFormat || 'PPR';
    this.picks = data.picks || [];
    this.expertAnalysis = data.expertAnalysis || '';
    this.draftDate = data.draftDate || new Date();
  }

  /**
   * Validates the mock draft result data
   * @returns Array of validation errors, empty if valid
   */
  public validate(): string[] {
    const errors: string[] = [];

    if (!this.draftId || this.draftId.trim().length === 0) {
      errors.push('Draft ID is required');
    }

    if (this.leagueSize < 4 || this.leagueSize > 20) {
      errors.push('League size must be between 4 and 20');
    }

    if (!this.scoringFormat || this.scoringFormat.trim().length === 0) {
      errors.push('Scoring format is required');
    }

    if (!Array.isArray(this.picks)) {
      errors.push('Picks must be an array');
    } else if (this.picks.length === 0) {
      errors.push('At least one pick is required');
    }

    if (!this.draftDate || isNaN(this.draftDate.getTime())) {
      errors.push('Draft date is invalid');
    }

    // Validate individual picks
    this.picks.forEach((pick, index) => {
      const pickErrors = this.validatePick(pick, index);
      errors.push(...pickErrors);
    });

    return errors;
  }

  /**
   * Validates an individual draft pick
   * @param pick The draft pick to validate
   * @param index The pick index for error reporting
   * @returns Array of validation errors
   */
  private validatePick(pick: DraftPick, index: number): string[] {
    const errors: string[] = [];
    const prefix = `Pick ${index + 1}:`;

    if (!pick.playerId || pick.playerId.trim().length === 0) {
      errors.push(`${prefix} Player ID is required`);
    }

    if (!pick.playerName || pick.playerName.trim().length === 0) {
      errors.push(`${prefix} Player name is required`);
    }

    if (!pick.position || pick.position.trim().length === 0) {
      errors.push(`${prefix} Position is required`);
    }

    if (pick.pickNumber <= 0) {
      errors.push(`${prefix} Pick number must be greater than 0`);
    }

    if (pick.round <= 0) {
      errors.push(`${prefix} Round must be greater than 0`);
    }

    if (pick.actualPick <= 0) {
      errors.push(`${prefix} Actual pick must be greater than 0`);
    }

    return errors;
  }

  /**
   * Checks if the mock draft result is valid
   * @returns True if valid, false otherwise
   */
  public isValid(): boolean {
    return this.validate().length === 0;
  }

  /**
   * Serializes the mock draft result to a plain object
   * @returns Plain object representation
   */
  public toJSON(): IMockDraftResult {
    return {
      draftId: this.draftId,
      leagueSize: this.leagueSize,
      scoringFormat: this.scoringFormat,
      picks: this.picks,
      expertAnalysis: this.expertAnalysis,
      draftDate: this.draftDate,
    };
  }

  /**
   * Creates a MockDraftResult instance from a plain object
   * @param data Plain object data
   * @returns MockDraftResult instance
   */
  public static fromJSON(data: any): MockDraftResult {
    return new MockDraftResult({
      draftId: data.draftId,
      leagueSize: Number(data.leagueSize),
      scoringFormat: data.scoringFormat,
      picks: Array.isArray(data.picks) ? data.picks : [],
      expertAnalysis: data.expertAnalysis,
      draftDate: new Date(data.draftDate),
    });
  }

  /**
   * Gets the total number of rounds in the draft
   * @returns Number of rounds
   */
  public getTotalRounds(): number {
    if (this.picks.length === 0) return 0;
    return Math.max(...this.picks.map(pick => pick.round));
  }

  /**
   * Gets picks for a specific round
   * @param round Round number
   * @returns Array of picks in that round
   */
  public getPicksByRound(round: number): DraftPick[] {
    return this.picks.filter(pick => pick.round === round);
  }

  /**
   * Gets picks for a specific position
   * @param position Position to filter by
   * @returns Array of picks for that position
   */
  public getPicksByPosition(position: string): DraftPick[] {
    return this.picks.filter(pick => 
      pick.position.toLowerCase() === position.toLowerCase()
    );
  }

  /**
   * Calculates the average draft position for a specific position
   * @param position Position to calculate ADP for
   * @returns Average draft position
   */
  public getADPByPosition(position: string): number {
    const positionPicks = this.getPicksByPosition(position);
    if (positionPicks.length === 0) return 0;
    
    const totalPicks = positionPicks.reduce((sum, pick) => sum + pick.actualPick, 0);
    return totalPicks / positionPicks.length;
  }

  /**
   * Gets the first pick for each position
   * @returns Map of position to first pick number
   */
  public getFirstPickByPosition(): Map<string, number> {
    const firstPicks = new Map<string, number>();
    
    this.picks.forEach(pick => {
      const position = pick.position.toLowerCase();
      if (!firstPicks.has(position) || pick.actualPick < firstPicks.get(position)!) {
        firstPicks.set(position, pick.actualPick);
      }
    });
    
    return firstPicks;
  }

  /**
   * Analyzes draft strategy based on early round picks
   * @param earlyRounds Number of rounds to consider as early (default: 3)
   * @returns Strategy analysis
   */
  public analyzeEarlyStrategy(earlyRounds: number = 3): {
    positions: string[];
    strategy: string;
    riskLevel: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  } {
    const earlyPicks = this.picks.filter(pick => pick.round <= earlyRounds);
    const positions = earlyPicks.map(pick => pick.position);
    
    let strategy = 'Balanced approach';
    let riskLevel: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' = 'BALANCED';
    
    // Analyze position distribution
    const positionCounts = positions.reduce((acc, pos) => {
      acc[pos] = (acc[pos] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const rbCount = positionCounts['RB'] || 0;
    const wrCount = positionCounts['WR'] || 0;
    
    if (rbCount >= 2 && wrCount === 0) {
      strategy = 'RB-heavy strategy';
      riskLevel = 'CONSERVATIVE';
    } else if (wrCount >= 2 && rbCount === 0) {
      strategy = 'WR-heavy strategy';
      riskLevel = 'AGGRESSIVE';
    } else if (positions.includes('QB') && earlyRounds <= 3) {
      strategy = 'Early QB strategy';
      riskLevel = 'AGGRESSIVE';
    }
    
    return { positions, strategy, riskLevel };
  }

  /**
   * Calculates value scores for all picks
   * @returns Array of picks with calculated value scores
   */
  public calculateValueScores(): DraftPick[] {
    return this.picks.map(pick => ({
      ...pick,
      valueScore: this.calculatePickValue(pick)
    }));
  }

  /**
   * Calculates value score for a single pick
   * @param pick The draft pick
   * @returns Value score (positive = good value, negative = reached)
   */
  private calculatePickValue(pick: DraftPick): number {
    if (pick.adp === 0 || pick.actualPick === 0) return 0;
    return pick.adp - pick.actualPick;
  }

  /**
   * Gets summary statistics for the draft
   * @returns Draft summary statistics
   */
  public getSummaryStats(): {
    totalPicks: number;
    rounds: number;
    positionBreakdown: Record<string, number>;
    averageValueScore: number;
    bestValue: DraftPick | null;
    worstValue: DraftPick | null;
  } {
    const positionBreakdown = this.picks.reduce((acc, pick) => {
      acc[pick.position] = (acc[pick.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const picksWithValue = this.calculateValueScores();
    const averageValueScore = picksWithValue.length > 0 
      ? picksWithValue.reduce((sum, pick) => sum + pick.valueScore, 0) / picksWithValue.length
      : 0;

    const bestValue = picksWithValue.reduce((best, pick) => 
      !best || pick.valueScore > best.valueScore ? pick : best, null as DraftPick | null);

    const worstValue = picksWithValue.reduce((worst, pick) => 
      !worst || pick.valueScore < worst.valueScore ? pick : worst, null as DraftPick | null);

    return {
      totalPicks: this.picks.length,
      rounds: this.getTotalRounds(),
      positionBreakdown,
      averageValueScore,
      bestValue,
      worstValue,
    };
  }
}
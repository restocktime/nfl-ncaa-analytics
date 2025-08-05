import { 
  IsString, 
  IsNumber, 
  ValidateNested, 
  Min, 
  Max,
  IsNotEmpty 
} from 'class-validator';
import { Type } from 'class-transformer';

export class SituationalStats {
  @IsNumber()
  @Min(0)
  attempts!: number;

  @IsNumber()
  @Min(0)
  successes!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  percentage!: number;

  constructor(data: Partial<SituationalStats> = {}) {
    Object.assign(this, data);
  }

  /**
   * Calculate success rate
   */
  getSuccessRate(): number {
    return this.attempts > 0 ? this.successes / this.attempts : 0;
  }

  /**
   * Check if the calculated percentage matches the success rate
   */
  isConsistent(): boolean {
    const calculatedPercentage = this.getSuccessRate();
    return Math.abs(this.percentage - calculatedPercentage) < 0.001;
  }
}

export class CoachingMatchupStats {
  @IsString()
  @IsNotEmpty()
  headCoachId!: string;

  @IsString()
  @IsNotEmpty()
  opponentHeadCoachId!: string;

  @IsNumber()
  @Min(0)
  gamesPlayed!: number;

  @IsNumber()
  @Min(0)
  wins!: number;

  @IsNumber()
  @Min(0)
  losses!: number;

  @IsNumber()
  averagePointsScored!: number;

  @IsNumber()
  averagePointsAllowed!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  winPercentage!: number;

  constructor(data: Partial<CoachingMatchupStats> = {}) {
    Object.assign(this, data);
  }

  /**
   * Calculate win percentage from wins/losses
   */
  calculateWinPercentage(): number {
    return this.gamesPlayed > 0 ? this.wins / this.gamesPlayed : 0;
  }

  /**
   * Get average point differential
   */
  getAveragePointDifferential(): number {
    return this.averagePointsScored - this.averagePointsAllowed;
  }

  /**
   * Check if this coach has a winning record against the opponent
   */
  hasWinningRecord(): boolean {
    return this.winPercentage > 0.5;
  }

  /**
   * Get games remaining (ties)
   */
  getTies(): number {
    return this.gamesPlayed - this.wins - this.losses;
  }
}

export class OpponentAdjustedStats {
  @IsString()
  @IsNotEmpty()
  teamId!: string;

  @IsString()
  @IsNotEmpty()
  opponentId!: string;

  @IsNumber()
  @Min(1900)
  @Max(2100)
  season!: number;

  @IsNumber()
  @Min(0)
  @Max(2)
  offensiveEfficiency!: number; // Relative to league average (1.0 = average)

  @IsNumber()
  @Min(0)
  @Max(2)
  defensiveEfficiency!: number; // Relative to league average (1.0 = average)

  @ValidateNested()
  @Type(() => Object)
  situationalPerformance!: {
    redZone: SituationalStats;
    thirdDown: SituationalStats;
    fourthDown: SituationalStats;
    goalLine: SituationalStats;
  };

  @ValidateNested()
  @Type(() => CoachingMatchupStats)
  coachingMatchup!: CoachingMatchupStats;

  constructor(data: Partial<OpponentAdjustedStats> = {}) {
    Object.assign(this, data);
    
    // Ensure nested objects are properly instantiated
    if (data.situationalPerformance) {
      this.situationalPerformance = {
        redZone: new SituationalStats(data.situationalPerformance.redZone),
        thirdDown: new SituationalStats(data.situationalPerformance.thirdDown),
        fourthDown: new SituationalStats(data.situationalPerformance.fourthDown),
        goalLine: new SituationalStats(data.situationalPerformance.goalLine)
      };
    }
    if (data.coachingMatchup) {
      this.coachingMatchup = new CoachingMatchupStats(data.coachingMatchup);
    }
  }

  /**
   * Get overall team efficiency (combination of offensive and defensive)
   */
  getOverallEfficiency(): number {
    // Higher offensive efficiency is good, lower defensive efficiency is good
    // Defensive efficiency represents points allowed relative to average
    return (this.offensiveEfficiency + (2 - this.defensiveEfficiency)) / 2;
  }

  /**
   * Check if team has offensive advantage
   */
  hasOffensiveAdvantage(): boolean {
    return this.offensiveEfficiency > 1.0;
  }

  /**
   * Check if team has defensive advantage
   */
  hasDefensiveAdvantage(): boolean {
    return this.defensiveEfficiency < 1.0; // Lower is better for defense
  }

  /**
   * Get red zone efficiency
   */
  getRedZoneEfficiency(): number {
    return this.situationalPerformance.redZone.getSuccessRate();
  }

  /**
   * Get third down conversion rate
   */
  getThirdDownConversionRate(): number {
    return this.situationalPerformance.thirdDown.getSuccessRate();
  }

  /**
   * Get fourth down conversion rate
   */
  getFourthDownConversionRate(): number {
    return this.situationalPerformance.fourthDown.getSuccessRate();
  }

  /**
   * Get goal line efficiency
   */
  getGoalLineEfficiency(): number {
    return this.situationalPerformance.goalLine.getSuccessRate();
  }

  /**
   * Calculate strength of schedule adjustment factor
   */
  getStrengthOfScheduleAdjustment(): number {
    // This would typically be calculated based on opponent strength
    // For now, return a neutral adjustment
    return 1.0;
  }

  /**
   * Get coaching advantage score (-1 to 1, where positive favors this team)
   */
  getCoachingAdvantage(): number {
    const coachingWinRate = this.coachingMatchup.winPercentage;
    return (coachingWinRate - 0.5) * 2; // Convert to -1 to 1 scale
  }

  /**
   * Calculate composite team rating
   */
  getCompositeRating(): number {
    const efficiencyScore = this.getOverallEfficiency();
    const situationalScore = (
      this.getRedZoneEfficiency() +
      this.getThirdDownConversionRate() +
      this.getFourthDownConversionRate() +
      this.getGoalLineEfficiency()
    ) / 4;
    const coachingScore = (this.getCoachingAdvantage() + 1) / 2; // Convert to 0-1 scale
    
    // Weighted average: 50% efficiency, 30% situational, 20% coaching
    return (efficiencyScore * 0.5) + (situationalScore * 0.3) + (coachingScore * 0.2);
  }

  /**
   * Predict performance against specific opponent strength
   */
  predictPerformanceVsOpponent(opponentStrength: number): number {
    const baseRating = this.getCompositeRating();
    const strengthAdjustment = this.getStrengthOfScheduleAdjustment();
    
    // Adjust performance based on opponent strength (0-2 scale where 1 is average)
    const opponentAdjustment = 2 - opponentStrength; // Stronger opponents reduce performance
    
    return baseRating * strengthAdjustment * (opponentAdjustment / 2);
  }
}
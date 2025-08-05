import { 
  IsString, 
  IsDate, 
  IsNumber, 
  IsArray, 
  ValidateNested, 
  Min, 
  Max,
  IsNotEmpty 
} from 'class-validator';
import { Type } from 'class-transformer';

export class WinProbability {
  @IsNumber()
  @Min(0)
  @Max(1)
  home!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  away!: number;

  constructor(data: Partial<WinProbability> = {}) {
    Object.assign(this, data);
  }

  /**
   * Validate that probabilities sum to 1
   */
  isValid(): boolean {
    return Math.abs(this.home + this.away - 1) < 0.001;
  }
}

export class SpreadProbability {
  @IsNumber()
  spread!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  probability!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  constructor(data: Partial<SpreadProbability> = {}) {
    Object.assign(this, data);
  }
}

export class TotalProbability {
  @IsNumber()
  @Min(0)
  @Max(1)
  over!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  under!: number;

  @IsNumber()
  @Min(0)
  total!: number;

  constructor(data: Partial<TotalProbability> = {}) {
    Object.assign(this, data);
  }

  /**
   * Validate that over/under probabilities sum to 1
   */
  isValid(): boolean {
    return Math.abs(this.over + this.under - 1) < 0.001;
  }
}

export class PlayerPropProbability {
  @IsString()
  @IsNotEmpty()
  playerId!: string;

  @IsString()
  @IsNotEmpty()
  propType!: string;

  @IsNumber()
  line!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  overProbability!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  underProbability!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  constructor(data: Partial<PlayerPropProbability> = {}) {
    Object.assign(this, data);
  }

  /**
   * Validate that over/under probabilities sum to 1
   */
  isValid(): boolean {
    return Math.abs(this.overProbability + this.underProbability - 1) < 0.001;
  }
}

export class GameProbabilities {
  @IsString()
  @IsNotEmpty()
  gameId!: string;

  @IsDate()
  @Type(() => Date)
  timestamp!: Date;

  @ValidateNested()
  @Type(() => WinProbability)
  winProbability!: WinProbability;

  @ValidateNested()
  @Type(() => SpreadProbability)
  spreadProbability!: SpreadProbability;

  @ValidateNested()
  @Type(() => TotalProbability)
  totalProbability!: TotalProbability;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerPropProbability)
  playerProps!: PlayerPropProbability[];

  constructor(data: Partial<GameProbabilities> = {}) {
    Object.assign(this, data);
    
    // Ensure nested objects are properly instantiated
    if (data.winProbability) {
      this.winProbability = new WinProbability(data.winProbability);
    }
    if (data.spreadProbability) {
      this.spreadProbability = new SpreadProbability(data.spreadProbability);
    }
    if (data.totalProbability) {
      this.totalProbability = new TotalProbability(data.totalProbability);
    }
    if (data.playerProps) {
      this.playerProps = data.playerProps.map(prop => new PlayerPropProbability(prop));
    }
  }

  /**
   * Get the probability that the home team wins
   */
  getHomeProbability(): number {
    return this.winProbability.home;
  }

  /**
   * Get the probability that the away team wins
   */
  getAwayProbability(): number {
    return this.winProbability.away;
  }

  /**
   * Get the implied total from over/under probabilities
   */
  getImpliedTotal(): number {
    return this.totalProbability.total;
  }

  /**
   * Calculate confidence interval for win probability
   */
  getWinProbabilityConfidenceInterval(confidenceLevel: number = 0.95): { lower: number; upper: number } {
    const z = this.getZScore(confidenceLevel);
    const p = this.winProbability.home;
    const n = 1000; // Assume 1000 simulations for standard error calculation
    const standardError = Math.sqrt((p * (1 - p)) / n);
    
    return {
      lower: Math.max(0, p - z * standardError),
      upper: Math.min(1, p + z * standardError)
    };
  }

  /**
   * Get Z-score for confidence level
   */
  private getZScore(confidenceLevel: number): number {
    const alpha = 1 - confidenceLevel;
    // Approximate Z-scores for common confidence levels
    if (confidenceLevel >= 0.99) return 2.576;
    if (confidenceLevel >= 0.95) return 1.96;
    if (confidenceLevel >= 0.90) return 1.645;
    return 1.96; // Default to 95%
  }

  /**
   * Get player prop probability by player ID and prop type
   */
  getPlayerPropProbability(playerId: string, propType: string): PlayerPropProbability | undefined {
    return this.playerProps.find(prop => prop.playerId === playerId && prop.propType === propType);
  }

  /**
   * Calculate Kelly criterion bet size for a given probability and odds
   */
  calculateKellyCriterion(probability: number, odds: number): number {
    const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
    const q = 1 - probability;
    const b = decimalOdds - 1;
    
    return Math.max(0, (probability * b - q) / b);
  }
}
import { 
  IsString, 
  IsNumber, 
  IsArray, 
  ValidateNested, 
  Min,
  Max,
  IsNotEmpty 
} from 'class-validator';
import { Type } from 'class-transformer';

export class OutcomeDistribution {
  @IsNumber()
  @Min(0)
  @Max(1)
  mean!: number;

  @IsNumber()
  @Min(0)
  median!: number;

  @IsNumber()
  @Min(0)
  standardDeviation!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  percentile25!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  percentile75!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  minimum!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  maximum!: number;

  constructor(data: Partial<OutcomeDistribution> = {}) {
    Object.assign(this, data);
  }

  /**
   * Calculate the interquartile range
   */
  getInterquartileRange(): number {
    return this.percentile75 - this.percentile25;
  }

  /**
   * Calculate coefficient of variation
   */
  getCoefficientOfVariation(): number {
    return this.mean > 0 ? this.standardDeviation / this.mean : 0;
  }
}

export class ConfidenceInterval {
  @IsNumber()
  @Min(0)
  @Max(1)
  lower!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  upper!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceLevel!: number;

  constructor(data: Partial<ConfidenceInterval> = {}) {
    Object.assign(this, data);
  }

  /**
   * Get the width of the confidence interval
   */
  getWidth(): number {
    return this.upper - this.lower;
  }

  /**
   * Check if a value falls within the confidence interval
   */
  contains(value: number): boolean {
    return value >= this.lower && value <= this.upper;
  }
}

export class Factor {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  impact!: number; // Can be negative or positive

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @IsString()
  description!: string;

  constructor(data: Partial<Factor> = {}) {
    Object.assign(this, data);
  }

  /**
   * Check if this factor has a positive impact
   */
  isPositiveImpact(): boolean {
    return this.impact > 0;
  }

  /**
   * Get the absolute impact value
   */
  getAbsoluteImpact(): number {
    return Math.abs(this.impact);
  }
}

export class SimulationResult {
  @IsString()
  @IsNotEmpty()
  scenarioId!: string;

  @IsNumber()
  @Min(1)
  iterations!: number;

  @ValidateNested()
  @Type(() => OutcomeDistribution)
  outcomes!: OutcomeDistribution;

  @ValidateNested()
  @Type(() => ConfidenceInterval)
  confidenceInterval!: ConfidenceInterval;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Factor)
  keyFactors!: Factor[];

  @IsNumber()
  @Min(0)
  executionTime!: number; // in milliseconds

  constructor(data: Partial<SimulationResult> = {}) {
    Object.assign(this, data);
    
    // Ensure nested objects are properly instantiated
    if (data.outcomes) {
      this.outcomes = new OutcomeDistribution(data.outcomes);
    }
    if (data.confidenceInterval) {
      this.confidenceInterval = new ConfidenceInterval(data.confidenceInterval);
    }
    if (data.keyFactors) {
      this.keyFactors = data.keyFactors.map(factor => new Factor(factor));
    }
  }

  /**
   * Get the most impactful factors (top N by absolute impact)
   */
  getTopFactors(n: number = 5): Factor[] {
    return this.keyFactors
      .sort((a, b) => b.getAbsoluteImpact() - a.getAbsoluteImpact())
      .slice(0, n);
  }

  /**
   * Get factors with positive impact
   */
  getPositiveFactors(): Factor[] {
    return this.keyFactors.filter(factor => factor.isPositiveImpact());
  }

  /**
   * Get factors with negative impact
   */
  getNegativeFactors(): Factor[] {
    return this.keyFactors.filter(factor => !factor.isPositiveImpact());
  }

  /**
   * Calculate simulation efficiency (iterations per millisecond)
   */
  getSimulationEfficiency(): number {
    return this.executionTime > 0 ? this.iterations / this.executionTime : 0;
  }

  /**
   * Get the probability that the outcome exceeds a threshold
   */
  getProbabilityAboveThreshold(threshold: number): number {
    // Using normal distribution approximation
    const z = (threshold - this.outcomes.mean) / this.outcomes.standardDeviation;
    return 1 - this.normalCDF(z);
  }

  /**
   * Get the probability that the outcome is below a threshold
   */
  getProbabilityBelowThreshold(threshold: number): number {
    const z = (threshold - this.outcomes.mean) / this.outcomes.standardDeviation;
    return this.normalCDF(z);
  }

  /**
   * Normal cumulative distribution function approximation
   */
  private normalCDF(z: number): number {
    // Abramowitz and Stegun approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    return z > 0 ? 1 - prob : prob;
  }

  /**
   * Calculate Value at Risk (VaR) at a given confidence level
   */
  getValueAtRisk(confidenceLevel: number): number {
    const z = this.getZScore(1 - confidenceLevel);
    return this.outcomes.mean - z * this.outcomes.standardDeviation;
  }

  /**
   * Get Z-score for confidence level
   */
  private getZScore(confidenceLevel: number): number {
    if (confidenceLevel >= 0.99) return 2.576;
    if (confidenceLevel >= 0.95) return 1.96;
    if (confidenceLevel >= 0.90) return 1.645;
    return 1.96; // Default to 95%
  }
}
/**
 * Data validation service with anomaly detection and quality scoring
 */

import { Game, GameScore, BettingLine, GameState } from '../types/game.types';
import { Team, TeamStatistics } from '../types/team.types';
import { Player, PlayerStatistics, InjuryReport } from '../types/player.types';
import { WeatherCondition } from '../types/common.types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  confidence: number;
  qualityScore: number;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface Anomaly {
  field: string;
  value: any;
  expectedRange: { min: number; max: number };
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  description: string;
}

export interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  validity: number;
  overall: number;
}

export class DataValidator {
  private readonly STATISTICAL_OUTLIER_THRESHOLD = 2; // Standard deviations
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly STALENESS_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Validate game score data
   */
  validateGameScore(score: GameScore): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let confidence = 1.0;

    // Required field validation
    if (!score.gameId) {
      errors.push({
        field: 'gameId',
        message: 'Game ID is required',
        severity: 'critical',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }

    // Score validation
    if (score.homeScore < 0 || score.awayScore < 0) {
      errors.push({
        field: 'score',
        message: 'Scores cannot be negative',
        severity: 'critical',
        code: 'INVALID_SCORE_VALUE'
      });
    }

    if (score.homeScore > 100 || score.awayScore > 100) {
      warnings.push({
        field: 'score',
        message: 'Unusually high score detected',
        suggestion: 'Verify score accuracy'
      });
      confidence *= 0.9;
    }

    // Quarter validation
    if (score.quarter < 1 || score.quarter > 5) {
      errors.push({
        field: 'quarter',
        message: 'Quarter must be between 1 and 5 (including overtime)',
        severity: 'high',
        code: 'INVALID_QUARTER'
      });
    }

    // Time validation
    if (!score.timeRemaining) {
      errors.push({
        field: 'timeRemaining',
        message: 'Time remaining is required',
        severity: 'high',
        code: 'MISSING_TIME_REMAINING'
      });
    } else {
      if (score.timeRemaining.minutes < 0 || score.timeRemaining.minutes > 15) {
        errors.push({
          field: 'timeRemaining.minutes',
          message: 'Minutes must be between 0 and 15',
          severity: 'medium',
          code: 'INVALID_TIME_MINUTES'
        });
      }
      if (score.timeRemaining.seconds < 0 || score.timeRemaining.seconds > 59) {
        errors.push({
          field: 'timeRemaining.seconds',
          message: 'Seconds must be between 0 and 59',
          severity: 'medium',
          code: 'INVALID_TIME_SECONDS'
        });
      }
    }

    // Staleness check
    const now = new Date();
    const timeDiff = now.getTime() - score.lastUpdated.getTime();
    if (timeDiff > this.STALENESS_THRESHOLD_MS) {
      warnings.push({
        field: 'lastUpdated',
        message: 'Data may be stale',
        suggestion: 'Consider refreshing data source'
      });
      confidence *= 0.8;
    }

    const qualityScore = this.calculateQualityScore(score, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence,
      qualityScore
    };
  }

  /**
   * Validate betting line data
   */
  validateBettingLine(line: BettingLine): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let confidence = 1.0;

    // Required fields
    if (!line.gameId) {
      errors.push({
        field: 'gameId',
        message: 'Game ID is required',
        severity: 'critical',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }

    if (!line.sportsbook) {
      errors.push({
        field: 'sportsbook',
        message: 'Sportsbook is required',
        severity: 'critical',
        code: 'MISSING_SPORTSBOOK'
      });
    }

    // Spread validation
    if (line.spread) {
      if (Math.abs(line.spread.home + line.spread.away) > 0.5) {
        errors.push({
          field: 'spread',
          message: 'Home and away spreads should sum to approximately zero',
          severity: 'high',
          code: 'INVALID_SPREAD_SUM'
        });
      }

      if (Math.abs(line.spread.home) > 50) {
        warnings.push({
          field: 'spread.home',
          message: 'Unusually large spread detected',
          suggestion: 'Verify spread accuracy'
        });
        confidence *= 0.9;
      }

      // Odds validation
      if (line.spread.homeOdds < -1000 || line.spread.homeOdds > 1000) {
        warnings.push({
          field: 'spread.homeOdds',
          message: 'Unusual odds detected',
          suggestion: 'Verify odds format and accuracy'
        });
        confidence *= 0.95;
      }
    }

    // Total validation
    if (line.total) {
      if (line.total.line < 20 || line.total.line > 100) {
        warnings.push({
          field: 'total.line',
          message: 'Unusual total line detected',
          suggestion: 'Verify total accuracy'
        });
        confidence *= 0.9;
      }
    }

    // Moneyline validation
    if (line.moneyline) {
      if (line.moneyline.home > 0 && line.moneyline.away > 0) {
        warnings.push({
          field: 'moneyline',
          message: 'Both teams have positive moneyline odds',
          suggestion: 'Verify moneyline accuracy'
        });
        confidence *= 0.8;
      }
    }

    const qualityScore = this.calculateQualityScore(line, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence,
      qualityScore
    };
  }

  /**
   * Validate player statistics
   */
  validatePlayerStat(stat: PlayerStatistics): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let confidence = 1.0;

    // Games validation
    if (stat.games < 0 || stat.games > 20) {
      errors.push({
        field: 'games',
        message: 'Games played must be between 0 and 20',
        severity: 'high',
        code: 'INVALID_GAMES_COUNT'
      });
    }

    if (stat.gamesStarted > stat.games) {
      errors.push({
        field: 'gamesStarted',
        message: 'Games started cannot exceed games played',
        severity: 'high',
        code: 'INVALID_GAMES_STARTED'
      });
    }

    // Passing stats validation
    if (stat.passingAttempts !== undefined) {
      if (stat.passingCompletions && stat.passingCompletions > stat.passingAttempts) {
        errors.push({
          field: 'passingCompletions',
          message: 'Completions cannot exceed attempts',
          severity: 'high',
          code: 'INVALID_COMPLETION_RATIO'
        });
      }

      if (stat.passingAttempts > 1000) {
        warnings.push({
          field: 'passingAttempts',
          message: 'Unusually high passing attempts',
          suggestion: 'Verify statistical accuracy'
        });
        confidence *= 0.95;
      }

      if (stat.passingRating && (stat.passingRating < 0 || stat.passingRating > 158.3)) {
        errors.push({
          field: 'passingRating',
          message: 'Passer rating must be between 0 and 158.3',
          severity: 'medium',
          code: 'INVALID_PASSER_RATING'
        });
      }
    }

    // Rushing stats validation
    if (stat.rushingYards !== undefined && stat.rushingAttempts !== undefined && stat.rushingAttempts > 0) {
      const avgYards = stat.rushingYards / stat.rushingAttempts;
      if (avgYards > 15 || avgYards < -3) {
        warnings.push({
          field: 'rushingAverage',
          message: 'Unusual rushing average detected',
          suggestion: 'Verify rushing statistics'
        });
        confidence *= 0.9;
      }
    }

    // Receiving stats validation
    if (stat.receptions !== undefined && stat.targets !== undefined) {
      if (stat.receptions > stat.targets) {
        errors.push({
          field: 'receptions',
          message: 'Receptions cannot exceed targets',
          severity: 'high',
          code: 'INVALID_RECEPTION_RATIO'
        });
      }
    }

    // Defensive stats validation
    if (stat.sacks !== undefined && stat.sacks < 0) {
      errors.push({
        field: 'sacks',
        message: 'Sacks cannot be negative',
        severity: 'medium',
        code: 'NEGATIVE_STAT_VALUE'
      });
    }

    const qualityScore = this.calculateQualityScore(stat, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence,
      qualityScore
    };
  }

  /**
   * Validate weather data
   */
  validateWeatherData(weather: WeatherCondition): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let confidence = 1.0;

    // Temperature validation (Fahrenheit)
    if (weather.temperature < -20 || weather.temperature > 120) {
      warnings.push({
        field: 'temperature',
        message: 'Extreme temperature detected',
        suggestion: 'Verify temperature reading and unit'
      });
      confidence *= 0.9;
    }

    // Humidity validation
    if (weather.humidity < 0 || weather.humidity > 100) {
      errors.push({
        field: 'humidity',
        message: 'Humidity must be between 0 and 100 percent',
        severity: 'medium',
        code: 'INVALID_HUMIDITY'
      });
    }

    // Wind speed validation
    if (weather.windSpeed < 0 || weather.windSpeed > 100) {
      if (weather.windSpeed > 100) {
        warnings.push({
          field: 'windSpeed',
          message: 'Extreme wind speed detected',
          suggestion: 'Verify wind speed measurement'
        });
        confidence *= 0.8;
      } else {
        errors.push({
          field: 'windSpeed',
          message: 'Wind speed cannot be negative',
          severity: 'medium',
          code: 'NEGATIVE_WIND_SPEED'
        });
      }
    }

    // Wind direction validation
    if (weather.windDirection < 0 || weather.windDirection >= 360) {
      errors.push({
        field: 'windDirection',
        message: 'Wind direction must be between 0 and 359 degrees',
        severity: 'medium',
        code: 'INVALID_WIND_DIRECTION'
      });
    }

    // Precipitation validation
    if (weather.precipitation < 0) {
      errors.push({
        field: 'precipitation',
        message: 'Precipitation cannot be negative',
        severity: 'medium',
        code: 'NEGATIVE_PRECIPITATION'
      });
    }

    const qualityScore = this.calculateQualityScore(weather, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence,
      qualityScore
    };
  }

  /**
   * Detect statistical anomalies in numerical data
   */
  detectAnomalies(data: number[], fieldName: string): Anomaly[] {
    if (data.length < 3) {
      return []; // Need at least 3 data points for meaningful analysis
    }

    const anomalies: Anomaly[] = [];
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    // Avoid division by zero
    if (stdDev === 0) {
      return anomalies;
    }

    data.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);
      
      if (zScore > this.STATISTICAL_OUTLIER_THRESHOLD) {
        const severity = zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low';
        const confidence = Math.min(0.99, (zScore - this.STATISTICAL_OUTLIER_THRESHOLD) / 2);
        
        anomalies.push({
          field: `${fieldName}[${index}]`,
          value,
          expectedRange: {
            min: mean - (this.STATISTICAL_OUTLIER_THRESHOLD * stdDev),
            max: mean + (this.STATISTICAL_OUTLIER_THRESHOLD * stdDev)
          },
          severity,
          confidence,
          description: `Value ${value} is ${zScore.toFixed(2)} standard deviations from mean (${mean.toFixed(2)})`
        });
      }
    });

    return anomalies;
  }

  /**
   * Calculate overall data quality score
   */
  calculateDataQualityMetrics(data: any, validationResult: ValidationResult): DataQualityMetrics {
    const completeness = this.calculateCompleteness(data);
    const accuracy = this.calculateAccuracy(validationResult);
    const consistency = this.calculateConsistency(data);
    const timeliness = this.calculateTimeliness(data);
    const validity = validationResult.isValid ? 1.0 : 0.5;

    const overall = (completeness + accuracy + consistency + timeliness + validity) / 5;

    return {
      completeness,
      accuracy,
      consistency,
      timeliness,
      validity,
      overall
    };
  }

  /**
   * Calculate completeness score (0-1)
   */
  private calculateCompleteness(data: any): number {
    if (!data || typeof data !== 'object') return 0;

    const fields = Object.keys(data);
    const nonNullFields = fields.filter(field => 
      data[field] !== null && 
      data[field] !== undefined && 
      data[field] !== ''
    );

    return fields.length > 0 ? nonNullFields.length / fields.length : 0;
  }

  /**
   * Calculate accuracy score based on validation results
   */
  private calculateAccuracy(validationResult: ValidationResult): number {
    const errorWeight = validationResult.errors.reduce((sum, error) => {
      switch (error.severity) {
        case 'critical': return sum + 0.5;
        case 'high': return sum + 0.4;
        case 'medium': return sum + 0.3;
        case 'low': return sum + 0.1;
        default: return sum + 0.3;
      }
    }, 0);

    const warningWeight = validationResult.warnings.length * 0.1;
    const totalWeight = errorWeight + warningWeight;

    return Math.max(0, 1 - totalWeight); // Direct penalty
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistency(data: any): number {
    // This is a simplified consistency check
    // In a real implementation, this would compare against historical patterns
    return 0.8; // Placeholder
  }

  /**
   * Calculate timeliness score
   */
  private calculateTimeliness(data: any): number {
    if (!data.lastUpdated && !data.timestamp) return 0.5;

    const timestamp = data.lastUpdated || data.timestamp;
    const now = new Date();
    const timeDiff = now.getTime() - new Date(timestamp).getTime();

    // Score decreases as data gets older
    if (timeDiff < 60000) return 1.0; // < 1 minute
    if (timeDiff < 300000) return 0.9; // < 5 minutes
    if (timeDiff < 900000) return 0.7; // < 15 minutes
    if (timeDiff < 3600000) return 0.5; // < 1 hour
    return 0.2; // > 1 hour
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(data: any, errors: ValidationError[], warnings: ValidationWarning[]): number {
    const completeness = this.calculateCompleteness(data);
    const errorPenalty = errors.reduce((sum, error) => {
      switch (error.severity) {
        case 'critical': return sum + 0.4;
        case 'high': return sum + 0.3;
        case 'medium': return sum + 0.2;
        case 'low': return sum + 0.1;
        default: return sum + 0.2;
      }
    }, 0);

    const warningPenalty = warnings.length * 0.05;
    const timeliness = this.calculateTimeliness(data);

    return Math.max(0, Math.min(1, (completeness + timeliness) * 0.5 - errorPenalty - warningPenalty));
  }
}
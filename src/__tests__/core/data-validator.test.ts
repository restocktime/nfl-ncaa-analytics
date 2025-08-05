/**
 * Unit tests for DataValidator
 */

import { DataValidator, ValidationResult, Anomaly } from '../../core/data-validator';
import { GameScore, BettingLine } from '../../types/game.types';
import { PlayerStatistics } from '../../types/player.types';
import { WeatherCondition } from '../../types/common.types';

describe('DataValidator', () => {
  let validator: DataValidator;

  beforeEach(() => {
    validator = new DataValidator();
  });

  describe('validateGameScore', () => {
    const validGameScore: GameScore = {
      gameId: 'game-123',
      homeScore: 21,
      awayScore: 14,
      quarter: 3,
      timeRemaining: {
        quarter: 3,
        minutes: 8,
        seconds: 45
      },
      lastUpdated: new Date(),
      final: false
    };

    it('should validate a correct game score', () => {
      const result = validator.validateGameScore(validGameScore);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.qualityScore).toBeGreaterThan(0.8);
    });

    it('should reject missing gameId', () => {
      const invalidScore = { ...validGameScore, gameId: '' };
      const result = validator.validateGameScore(invalidScore);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('gameId');
      expect(result.errors[0].severity).toBe('critical');
      expect(result.errors[0].code).toBe('MISSING_REQUIRED_FIELD');
    });

    it('should reject negative scores', () => {
      const invalidScore = { ...validGameScore, homeScore: -5 };
      const result = validator.validateGameScore(invalidScore);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('score');
      expect(result.errors[0].code).toBe('INVALID_SCORE_VALUE');
    });

    it('should warn about unusually high scores', () => {
      const highScore = { ...validGameScore, homeScore: 105 };
      const result = validator.validateGameScore(highScore);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('score');
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should reject invalid quarter values', () => {
      const invalidScore = { ...validGameScore, quarter: 6 };
      const result = validator.validateGameScore(invalidScore);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('quarter');
      expect(result.errors[0].code).toBe('INVALID_QUARTER');
    });

    it('should reject invalid time values', () => {
      const invalidScore = {
        ...validGameScore,
        timeRemaining: {
          quarter: 3,
          minutes: 20, // Invalid: > 15
          seconds: 45
        }
      };
      const result = validator.validateGameScore(invalidScore);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('timeRemaining.minutes');
      expect(result.errors[0].code).toBe('INVALID_TIME_MINUTES');
    });

    it('should warn about stale data', () => {
      const staleScore = {
        ...validGameScore,
        lastUpdated: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      };
      const result = validator.validateGameScore(staleScore);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('lastUpdated');
      expect(result.confidence).toBeLessThan(1.0);
    });
  });

  describe('validateBettingLine', () => {
    const validBettingLine: BettingLine = {
      gameId: 'game-123',
      sportsbook: 'DraftKings',
      spread: {
        home: -3.5,
        away: 3.5,
        homeOdds: -110,
        awayOdds: -110
      },
      total: {
        line: 47.5,
        overOdds: -110,
        underOdds: -110
      },
      moneyline: {
        home: -150,
        away: 130
      },
      lastUpdated: new Date()
    };

    it('should validate a correct betting line', () => {
      const result = validator.validateBettingLine(validBettingLine);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should reject missing gameId', () => {
      const invalidLine = { ...validBettingLine, gameId: '' };
      const result = validator.validateBettingLine(invalidLine);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('gameId');
      expect(result.errors[0].code).toBe('MISSING_REQUIRED_FIELD');
    });

    it('should reject missing sportsbook', () => {
      const invalidLine = { ...validBettingLine, sportsbook: '' };
      const result = validator.validateBettingLine(invalidLine);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('sportsbook');
      expect(result.errors[0].code).toBe('MISSING_SPORTSBOOK');
    });

    it('should reject invalid spread sum', () => {
      const invalidLine = {
        ...validBettingLine,
        spread: {
          home: -3.5,
          away: 4.5, // Should be 3.5 to sum to ~0
          homeOdds: -110,
          awayOdds: -110
        }
      };
      const result = validator.validateBettingLine(invalidLine);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('spread');
      expect(result.errors[0].code).toBe('INVALID_SPREAD_SUM');
    });

    it('should warn about unusually large spreads', () => {
      const largeSpreads = {
        ...validBettingLine,
        spread: {
          home: -55,
          away: 55,
          homeOdds: -110,
          awayOdds: -110
        }
      };
      const result = validator.validateBettingLine(largeSpreads);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('spread.home');
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should warn about unusual total lines', () => {
      const unusualTotal = {
        ...validBettingLine,
        total: {
          line: 15, // Unusually low
          overOdds: -110,
          underOdds: -110
        }
      };
      const result = validator.validateBettingLine(unusualTotal);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('total.line');
    });

    it('should warn about both positive moneylines', () => {
      const invalidMoneyline = {
        ...validBettingLine,
        moneyline: {
          home: 150,
          away: 130
        }
      };
      const result = validator.validateBettingLine(invalidMoneyline);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('moneyline');
      expect(result.confidence).toBeLessThan(1.0);
    });
  });

  describe('validatePlayerStat', () => {
    const validPlayerStats: PlayerStatistics = {
      season: 2024,
      games: 12,
      gamesStarted: 10,
      passingAttempts: 350,
      passingCompletions: 220,
      passingYards: 2800,
      passingTouchdowns: 18,
      interceptions: 8,
      passingRating: 95.5,
      rushingAttempts: 45,
      rushingYards: 180,
      rushingTouchdowns: 2,
      sacks: 0
    };

    it('should validate correct player statistics', () => {
      const result = validator.validatePlayerStat(validPlayerStats);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should reject invalid games count', () => {
      const invalidStats = { ...validPlayerStats, games: 25 };
      const result = validator.validatePlayerStat(invalidStats);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('games');
      expect(result.errors[0].code).toBe('INVALID_GAMES_COUNT');
    });

    it('should reject games started > games played', () => {
      const invalidStats = { ...validPlayerStats, gamesStarted: 15 };
      const result = validator.validatePlayerStat(invalidStats);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('gamesStarted');
      expect(result.errors[0].code).toBe('INVALID_GAMES_STARTED');
    });

    it('should reject completions > attempts', () => {
      const invalidStats = { ...validPlayerStats, passingCompletions: 400 };
      const result = validator.validatePlayerStat(invalidStats);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('passingCompletions');
      expect(result.errors[0].code).toBe('INVALID_COMPLETION_RATIO');
    });

    it('should reject invalid passer rating', () => {
      const invalidStats = { ...validPlayerStats, passingRating: 200 };
      const result = validator.validatePlayerStat(invalidStats);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('passingRating');
      expect(result.errors[0].code).toBe('INVALID_PASSER_RATING');
    });

    it('should warn about unusually high passing attempts', () => {
      const highAttempts = { ...validPlayerStats, passingAttempts: 1200 };
      const result = validator.validatePlayerStat(highAttempts);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('passingAttempts');
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should reject negative sacks', () => {
      const invalidStats = { ...validPlayerStats, sacks: -2 };
      const result = validator.validatePlayerStat(invalidStats);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('sacks');
      expect(result.errors[0].code).toBe('NEGATIVE_STAT_VALUE');
    });

    it('should warn about unusual rushing average', () => {
      const unusualRushing = {
        ...validPlayerStats,
        rushingYards: 900, // 20 yards per attempt
        rushingAttempts: 45
      };
      const result = validator.validatePlayerStat(unusualRushing);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      const rushingWarning = result.warnings.find(w => w.field === 'rushingAverage');
      expect(rushingWarning).toBeDefined();
    });
  });

  describe('validateWeatherData', () => {
    const validWeather: WeatherCondition = {
      temperature: 72,
      humidity: 65,
      windSpeed: 8,
      windDirection: 180,
      precipitation: 0,
      conditions: 'Clear',
      visibility: 10
    };

    it('should validate correct weather data', () => {
      const result = validator.validateWeatherData(validWeather);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should warn about extreme temperatures', () => {
      const extremeTemp = { ...validWeather, temperature: 130 };
      const result = validator.validateWeatherData(extremeTemp);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('temperature');
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should reject invalid humidity', () => {
      const invalidHumidity = { ...validWeather, humidity: 150 };
      const result = validator.validateWeatherData(invalidHumidity);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('humidity');
      expect(result.errors[0].code).toBe('INVALID_HUMIDITY');
    });

    it('should reject negative wind speed', () => {
      const negativeWind = { ...validWeather, windSpeed: -5 };
      const result = validator.validateWeatherData(negativeWind);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('windSpeed');
      expect(result.errors[0].code).toBe('NEGATIVE_WIND_SPEED');
    });

    it('should warn about extreme wind speeds', () => {
      const extremeWind = { ...validWeather, windSpeed: 120 };
      const result = validator.validateWeatherData(extremeWind);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('windSpeed');
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should reject invalid wind direction', () => {
      const invalidDirection = { ...validWeather, windDirection: 400 };
      const result = validator.validateWeatherData(invalidDirection);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('windDirection');
      expect(result.errors[0].code).toBe('INVALID_WIND_DIRECTION');
    });

    it('should reject negative precipitation', () => {
      const negativePrecip = { ...validWeather, precipitation: -1 };
      const result = validator.validateWeatherData(negativePrecip);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('precipitation');
      expect(result.errors[0].code).toBe('NEGATIVE_PRECIPITATION');
    });
  });

  describe('detectAnomalies', () => {
    it('should detect statistical outliers', () => {
      const data = [10, 10, 10, 10, 10, 10, 100, 10, 10]; // 100 is a clear outlier
      const anomalies = validator.detectAnomalies(data, 'testField');
      
      expect(anomalies.length).toBeGreaterThanOrEqual(1);
      const outlier = anomalies.find(a => a.value === 100);
      expect(outlier).toBeDefined();
      expect(['medium', 'high']).toContain(outlier?.severity);
      expect(outlier?.confidence).toBeGreaterThan(0.1);
    });

    it('should handle insufficient data points', () => {
      const data = [10, 12];
      const anomalies = validator.detectAnomalies(data, 'testField');
      
      expect(anomalies).toHaveLength(0);
    });

    it('should classify anomaly severity correctly', () => {
      const data = [5, 5, 5, 5, 5, 5, 5, 200]; // Extreme outlier
      const anomalies = validator.detectAnomalies(data, 'testField');
      
      expect(anomalies.length).toBeGreaterThanOrEqual(1);
      const extremeOutlier = anomalies.find(a => a.value === 200);
      expect(extremeOutlier).toBeDefined();
      expect(['medium', 'high']).toContain(extremeOutlier?.severity);
    });

    it('should handle normal distribution without anomalies', () => {
      const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const anomalies = validator.detectAnomalies(data, 'testField');
      
      expect(anomalies).toHaveLength(0);
    });
  });

  describe('calculateDataQualityMetrics', () => {
    it('should calculate quality metrics for complete data', () => {
      const data = {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3',
        lastUpdated: new Date()
      };
      const validationResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        confidence: 1.0,
        qualityScore: 0.9
      };

      const metrics = validator.calculateDataQualityMetrics(data, validationResult);
      
      expect(metrics.completeness).toBe(1.0);
      expect(metrics.validity).toBe(1.0);
      expect(metrics.overall).toBeGreaterThan(0.8);
    });

    it('should penalize incomplete data', () => {
      const data = {
        field1: 'value1',
        field2: null,
        field3: undefined,
        field4: ''
      };
      const validationResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        confidence: 1.0,
        qualityScore: 0.9
      };

      const metrics = validator.calculateDataQualityMetrics(data, validationResult);
      
      expect(metrics.completeness).toBe(0.25); // Only 1 out of 4 fields has value
      expect(metrics.overall).toBeLessThan(0.8);
    });

    it('should penalize data with validation errors', () => {
      const data = { field1: 'value1' };
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'field1',
            message: 'Invalid value',
            severity: 'critical',
            code: 'INVALID_VALUE'
          }
        ],
        warnings: [
          { field: 'field2', message: 'Warning message' }
        ],
        confidence: 0.5,
        qualityScore: 0.3
      };

      const metrics = validator.calculateDataQualityMetrics(data, validationResult);
      
      expect(metrics.validity).toBe(0.5);
      expect(metrics.accuracy).toBeLessThan(0.8);
      expect(metrics.overall).toBeLessThan(0.7);
    });
  });
});
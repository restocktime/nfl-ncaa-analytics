import 'reflect-metadata';
import { validate } from 'class-validator';
import { 
  SimulationResult, 
  OutcomeDistribution, 
  ConfidenceInterval, 
  Factor 
} from '../../models/SimulationResult';

describe('SimulationResult Model', () => {
  let validSimulationResultData: any;

  beforeEach(() => {
    validSimulationResultData = {
      scenarioId: 'scenario-123',
      iterations: 10000,
      outcomes: {
        mean: 0.65,
        median: 0.64,
        standardDeviation: 0.12,
        percentile25: 0.58,
        percentile75: 0.72,
        minimum: 0.35,
        maximum: 0.95
      },
      confidenceInterval: {
        lower: 0.52,
        upper: 0.78,
        confidenceLevel: 0.95
      },
      keyFactors: [
        {
          name: 'Weather Conditions',
          impact: 0.15,
          confidence: 0.8,
          description: 'Heavy rain reduces passing efficiency'
        },
        {
          name: 'Key Player Injury',
          impact: -0.12,
          confidence: 0.9,
          description: 'Starting QB injury significantly impacts offense'
        }
      ],
      executionTime: 2500
    };
  });

  describe('OutcomeDistribution', () => {
    let outcomeDistribution: OutcomeDistribution;

    beforeEach(() => {
      outcomeDistribution = new OutcomeDistribution(validSimulationResultData.outcomes);
    });

    it('should validate valid outcome distribution', async () => {
      const errors = await validate(outcomeDistribution);
      expect(errors).toHaveLength(0);
    });

    it('should validate minimum values', async () => {
      const invalidData = { ...validSimulationResultData.outcomes, standardDeviation: -0.1 };
      const outcome = new OutcomeDistribution(invalidData);
      const errors = await validate(outcome);
      expect(errors.some(error => error.property === 'standardDeviation')).toBe(true);
    });

    it('should calculate interquartile range', () => {
      const iqr = outcomeDistribution.getInterquartileRange();
      expect(iqr).toBe(0.14); // 0.72 - 0.58
    });

    it('should calculate coefficient of variation', () => {
      const cv = outcomeDistribution.getCoefficientOfVariation();
      expect(cv).toBeCloseTo(0.185, 2); // 0.12 / 0.65
    });

    it('should handle zero mean for coefficient of variation', () => {
      outcomeDistribution.mean = 0;
      const cv = outcomeDistribution.getCoefficientOfVariation();
      expect(cv).toBe(0);
    });
  });

  describe('ConfidenceInterval', () => {
    let confidenceInterval: ConfidenceInterval;

    beforeEach(() => {
      confidenceInterval = new ConfidenceInterval(validSimulationResultData.confidenceInterval);
    });

    it('should validate valid confidence interval', async () => {
      const errors = await validate(confidenceInterval);
      expect(errors).toHaveLength(0);
    });

    it('should validate probability ranges', async () => {
      const invalidData = { ...validSimulationResultData.confidenceInterval, lower: 1.5 };
      const ci = new ConfidenceInterval(invalidData);
      const errors = await validate(ci);
      expect(errors.some(error => error.property === 'lower')).toBe(true);
    });

    it('should calculate width', () => {
      const width = confidenceInterval.getWidth();
      expect(width).toBe(0.26); // 0.78 - 0.52
    });

    it('should check if value is contained', () => {
      expect(confidenceInterval.contains(0.65)).toBe(true);
      expect(confidenceInterval.contains(0.45)).toBe(false);
      expect(confidenceInterval.contains(0.85)).toBe(false);
    });
  });

  describe('Factor', () => {
    let positiveFactor: Factor;
    let negativeFactor: Factor;

    beforeEach(() => {
      positiveFactor = new Factor(validSimulationResultData.keyFactors[0]);
      negativeFactor = new Factor(validSimulationResultData.keyFactors[1]);
    });

    it('should validate valid factor', async () => {
      const errors = await validate(positiveFactor);
      expect(errors).toHaveLength(0);
    });

    it('should require non-empty name', async () => {
      const invalidFactor = new Factor({ ...validSimulationResultData.keyFactors[0], name: '' });
      const errors = await validate(invalidFactor);
      expect(errors.some(error => error.property === 'name')).toBe(true);
    });

    it('should identify positive impact', () => {
      expect(positiveFactor.isPositiveImpact()).toBe(true);
      expect(negativeFactor.isPositiveImpact()).toBe(false);
    });

    it('should get absolute impact', () => {
      expect(positiveFactor.getAbsoluteImpact()).toBe(0.15);
      expect(negativeFactor.getAbsoluteImpact()).toBe(0.12);
    });
  });

  describe('SimulationResult', () => {
    let simulationResult: SimulationResult;

    beforeEach(() => {
      simulationResult = new SimulationResult(validSimulationResultData);
    });

    it('should validate valid simulation result', async () => {
      const errors = await validate(simulationResult, { skipMissingProperties: true });
      expect(simulationResult.scenarioId).toBe('scenario-123');
      expect(simulationResult.iterations).toBe(10000);
    });

    it('should require non-empty scenarioId', async () => {
      const invalidData = { ...validSimulationResultData, scenarioId: '' };
      const result = new SimulationResult(invalidData);
      const errors = await validate(result);
      expect(errors.some(error => error.property === 'scenarioId')).toBe(true);
    });

    it('should validate minimum iterations', async () => {
      const invalidData = { ...validSimulationResultData, iterations: 0 };
      const result = new SimulationResult(invalidData);
      const errors = await validate(result);
      expect(errors.some(error => error.property === 'iterations')).toBe(true);
    });

    it('should get top factors by impact', () => {
      const topFactors = simulationResult.getTopFactors(1);
      expect(topFactors).toHaveLength(1);
      expect(topFactors[0].name).toBe('Weather Conditions');
    });

    it('should get positive factors', () => {
      const positiveFactors = simulationResult.getPositiveFactors();
      expect(positiveFactors).toHaveLength(1);
      expect(positiveFactors[0].name).toBe('Weather Conditions');
    });

    it('should get negative factors', () => {
      const negativeFactors = simulationResult.getNegativeFactors();
      expect(negativeFactors).toHaveLength(1);
      expect(negativeFactors[0].name).toBe('Key Player Injury');
    });

    it('should calculate simulation efficiency', () => {
      const efficiency = simulationResult.getSimulationEfficiency();
      expect(efficiency).toBe(4); // 10000 / 2500
    });

    it('should handle zero execution time for efficiency', () => {
      simulationResult.executionTime = 0;
      const efficiency = simulationResult.getSimulationEfficiency();
      expect(efficiency).toBe(0);
    });

    it('should calculate probability above threshold', () => {
      const prob = simulationResult.getProbabilityAboveThreshold(0.7);
      expect(prob).toBeGreaterThan(0);
      expect(prob).toBeLessThan(1);
    });

    it('should calculate probability below threshold', () => {
      const prob = simulationResult.getProbabilityBelowThreshold(0.6);
      expect(prob).toBeGreaterThan(0);
      expect(prob).toBeLessThan(1);
    });

    it('should calculate Value at Risk', () => {
      const var95 = simulationResult.getValueAtRisk(0.95);
      expect(var95).toBeLessThan(simulationResult.outcomes.mean);
    });

    it('should handle edge cases for probability calculations', () => {
      // Test with extreme threshold values
      const probVeryHigh = simulationResult.getProbabilityAboveThreshold(10);
      const probVeryLow = simulationResult.getProbabilityBelowThreshold(-10);
      
      expect(probVeryHigh).toBeCloseTo(0, 2);
      expect(probVeryLow).toBeCloseTo(0, 2);
    });
  });
});
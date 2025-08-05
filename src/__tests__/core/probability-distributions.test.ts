import { 
  NormalDistribution, 
  BetaDistribution, 
  GammaDistribution 
} from '../../core/probability-distributions';

describe('Probability Distributions', () => {
  describe('NormalDistribution', () => {
    let normal: NormalDistribution;

    beforeEach(() => {
      normal = new NormalDistribution(0, 1); // Standard normal
    });

    it('should create normal distribution with valid parameters', () => {
      expect(normal.mean()).toBe(0);
      expect(normal.variance()).toBe(1);
    });

    it('should throw error for invalid standard deviation', () => {
      expect(() => new NormalDistribution(0, 0)).toThrow('Standard deviation must be positive');
      expect(() => new NormalDistribution(0, -1)).toThrow('Standard deviation must be positive');
    });

    it('should calculate PDF correctly', () => {
      const pdf0 = normal.pdf(0);
      const pdf1 = normal.pdf(1);
      
      expect(pdf0).toBeCloseTo(0.3989, 3); // 1/sqrt(2π)
      expect(pdf1).toBeLessThan(pdf0); // PDF should be lower at x=1
      expect(pdf1).toBeGreaterThan(0);
    });

    it('should calculate CDF correctly', () => {
      const cdf0 = normal.cdf(0);
      const cdfNeg = normal.cdf(-1);
      const cdfPos = normal.cdf(1);
      
      expect(cdf0).toBeCloseTo(0.5, 2);
      expect(cdfNeg).toBeLessThan(0.5);
      expect(cdfPos).toBeGreaterThan(0.5);
      expect(cdfNeg + cdfPos).toBeCloseTo(1, 1); // Symmetry
    });

    it('should generate samples within reasonable range', () => {
      const samples = Array.from({ length: 1000 }, () => normal.sample());
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (samples.length - 1);
      
      expect(mean).toBeCloseTo(0, 0.2); // Should be close to theoretical mean
      expect(variance).toBeCloseTo(1, 0.3); // Should be close to theoretical variance
    });

    it('should work with different parameters', () => {
      const normal2 = new NormalDistribution(5, 2);
      
      expect(normal2.mean()).toBe(5);
      expect(normal2.variance()).toBe(4);
      
      const pdf = normal2.pdf(5);
      expect(pdf).toBeCloseTo(0.1995, 3); // 1/(2*sqrt(2π))
    });
  });

  describe('BetaDistribution', () => {
    let beta: BetaDistribution;

    beforeEach(() => {
      beta = new BetaDistribution(2, 2); // Symmetric beta
    });

    it('should create beta distribution with valid parameters', () => {
      expect(beta.mean()).toBeCloseTo(0.5, 3);
      expect(beta.variance()).toBeCloseTo(0.05, 2); // 2*2/((2+2)^2*(2+2+1))
    });

    it('should throw error for invalid parameters', () => {
      expect(() => new BetaDistribution(0, 1)).toThrow('Alpha and beta parameters must be positive');
      expect(() => new BetaDistribution(1, -1)).toThrow('Alpha and beta parameters must be positive');
    });

    it('should calculate PDF correctly', () => {
      const pdf05 = beta.pdf(0.5);
      const pdf0 = beta.pdf(0);
      const pdf1 = beta.pdf(1);
      const pdfOutside = beta.pdf(1.5);
      
      expect(pdf05).toBeGreaterThan(0);
      expect(pdf0).toBe(0); // Beta(2,2) has PDF = 0 at boundaries
      expect(pdf1).toBe(0);
      expect(pdfOutside).toBe(0); // Outside [0,1] range
    });

    it('should calculate CDF correctly', () => {
      const cdf0 = beta.cdf(0);
      const cdf05 = beta.cdf(0.5);
      const cdf1 = beta.cdf(1);
      
      expect(cdf0).toBe(0);
      expect(cdf05).toBeCloseTo(0.5, 1); // Symmetric distribution
      expect(cdf1).toBe(1);
    });

    it('should generate samples within [0,1] range', () => {
      const samples = Array.from({ length: 1000 }, () => beta.sample());
      
      samples.forEach(sample => {
        expect(sample).toBeGreaterThanOrEqual(0);
        expect(sample).toBeLessThanOrEqual(1);
      });
      
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(mean).toBeCloseTo(0.5, 0.1); // Should be close to theoretical mean
    });

    it('should work with asymmetric parameters', () => {
      const betaAsym = new BetaDistribution(1, 3);
      
      expect(betaAsym.mean()).toBeCloseTo(0.25, 3); // 1/(1+3)
      
      const samples = Array.from({ length: 1000 }, () => betaAsym.sample());
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(mean).toBeCloseTo(0.25, 0.1);
    });
  });

  describe('GammaDistribution', () => {
    let gamma: GammaDistribution;

    beforeEach(() => {
      gamma = new GammaDistribution(2, 1); // Shape=2, Scale=1
    });

    it('should create gamma distribution with valid parameters', () => {
      expect(gamma.mean()).toBe(2); // shape * scale
      expect(gamma.variance()).toBe(2); // shape * scale^2
    });

    it('should throw error for invalid parameters', () => {
      expect(() => new GammaDistribution(0, 1)).toThrow('Shape and scale parameters must be positive');
      expect(() => new GammaDistribution(1, -1)).toThrow('Shape and scale parameters must be positive');
    });

    it('should calculate PDF correctly', () => {
      const pdf0 = gamma.pdf(0);
      const pdf1 = gamma.pdf(1);
      const pdfNeg = gamma.pdf(-1);
      
      expect(pdf0).toBe(0); // Gamma PDF is 0 at x=0 for shape > 1
      expect(pdf1).toBeGreaterThan(0);
      expect(pdfNeg).toBe(0); // Gamma PDF is 0 for negative values
    });

    it('should calculate CDF correctly', () => {
      const cdf0 = gamma.cdf(0);
      const cdf1 = gamma.cdf(1);
      const cdf10 = gamma.cdf(10);
      
      expect(cdf0).toBe(0);
      expect(cdf1).toBeGreaterThan(0);
      expect(cdf1).toBeLessThan(1);
      expect(cdf10).toBeCloseTo(1, 1); // Should approach 1 for large values
    });

    it('should generate positive samples', () => {
      const samples = Array.from({ length: 1000 }, () => gamma.sample());
      
      samples.forEach(sample => {
        expect(sample).toBeGreaterThan(0);
      });
      
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(mean).toBeCloseTo(2, 0.3); // Should be close to theoretical mean
    });

    it('should work with different parameters', () => {
      const gamma2 = new GammaDistribution(1, 2); // Shape=1, Scale=2 (exponential)
      
      expect(gamma2.mean()).toBe(2);
      expect(gamma2.variance()).toBe(4);
      
      const samples = Array.from({ length: 1000 }, () => gamma2.sample());
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(mean).toBeCloseTo(2, 0.4);
    });
  });

  describe('Distribution Properties', () => {
    it('should maintain mathematical properties for Normal distribution', () => {
      const normal = new NormalDistribution(3, 2);
      
      // Test that PDF integrates to approximately 1 (using trapezoidal rule)
      let integral = 0;
      const step = 0.1;
      for (let x = -10; x <= 16; x += step) {
        integral += normal.pdf(x) * step;
      }
      expect(integral).toBeCloseTo(1, 1);
    });

    it('should maintain mathematical properties for Beta distribution', () => {
      const beta = new BetaDistribution(3, 2);
      
      // Test that PDF integrates to approximately 1
      let integral = 0;
      const step = 0.01;
      for (let x = 0; x <= 1; x += step) {
        integral += beta.pdf(x) * step;
      }
      expect(integral).toBeCloseTo(1, 1);
    });

    it('should maintain mathematical properties for Gamma distribution', () => {
      const gamma = new GammaDistribution(2, 1);
      
      // Test that CDF is monotonically increasing
      const x1 = 1;
      const x2 = 2;
      const x3 = 3;
      
      expect(gamma.cdf(x2)).toBeGreaterThan(gamma.cdf(x1));
      expect(gamma.cdf(x3)).toBeGreaterThan(gamma.cdf(x2));
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme parameter values for Normal distribution', () => {
      const tinyStd = new NormalDistribution(0, 0.001);
      const hugeStd = new NormalDistribution(0, 1000);
      
      expect(tinyStd.variance()).toBeCloseTo(0.000001, 8);
      expect(hugeStd.variance()).toBe(1000000);
      
      // PDF should be very peaked for tiny std
      expect(tinyStd.pdf(0)).toBeGreaterThan(hugeStd.pdf(0));
    });

    it('should handle extreme parameter values for Beta distribution', () => {
      const skewed = new BetaDistribution(0.1, 0.1);
      
      expect(skewed.mean()).toBeCloseTo(0.5, 3);
      
      // Should still generate valid samples
      const samples = Array.from({ length: 100 }, () => skewed.sample());
      samples.forEach(sample => {
        expect(sample).toBeGreaterThanOrEqual(0);
        expect(sample).toBeLessThanOrEqual(1);
      });
    });

    it('should handle large shape parameters for Gamma distribution', () => {
      const largeShape = new GammaDistribution(100, 1);
      
      expect(largeShape.mean()).toBe(100);
      expect(largeShape.variance()).toBe(100);
      
      // Should generate samples around the mean
      const samples = Array.from({ length: 100 }, () => largeShape.sample());
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(mean).toBeCloseTo(100, -1); // Allow for some variance
    });
  });
});
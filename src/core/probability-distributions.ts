/**
 * Probability distribution classes for Bayesian inference
 */

export abstract class ProbabilityDistribution {
  abstract mean(): number;
  abstract variance(): number;
  abstract pdf(x: number): number;
  abstract cdf(x: number): number;
  abstract sample(): number;
}

/**
 * Normal (Gaussian) distribution
 */
export class NormalDistribution extends ProbabilityDistribution {
  constructor(
    private mu: number,
    private sigma: number
  ) {
    super();
    if (sigma <= 0) {
      throw new Error('Standard deviation must be positive');
    }
  }

  mean(): number {
    return this.mu;
  }

  variance(): number {
    return this.sigma * this.sigma;
  }

  pdf(x: number): number {
    const coefficient = 1 / (this.sigma * Math.sqrt(2 * Math.PI));
    const exponent = -0.5 * Math.pow((x - this.mu) / this.sigma, 2);
    return coefficient * Math.exp(exponent);
  }

  cdf(x: number): number {
    return 0.5 * (1 + this.erf((x - this.mu) / (this.sigma * Math.sqrt(2))));
  }

  sample(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * this.sigma + this.mu;
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}

/**
 * Beta distribution (useful for probabilities)
 */
export class BetaDistribution extends ProbabilityDistribution {
  constructor(
    private alpha: number,
    private beta: number
  ) {
    super();
    if (alpha <= 0 || beta <= 0) {
      throw new Error('Alpha and beta parameters must be positive');
    }
  }

  mean(): number {
    return this.alpha / (this.alpha + this.beta);
  }

  variance(): number {
    const sum = this.alpha + this.beta;
    return (this.alpha * this.beta) / (sum * sum * (sum + 1));
  }

  pdf(x: number): number {
    if (x < 0 || x > 1) return 0;
    
    const betaFunction = this.betaFunction(this.alpha, this.beta);
    return Math.pow(x, this.alpha - 1) * Math.pow(1 - x, this.beta - 1) / betaFunction;
  }

  cdf(x: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    
    // Simplified CDF approximation for Beta distribution
    // For Beta(2,2), CDF = 3x^2 - 2x^3
    if (this.alpha === 2 && this.beta === 2) {
      return 3 * x * x - 2 * x * x * x;
    }
    
    // General case using incomplete beta function approximation
    return this.incompleteBeta(x, this.alpha, this.beta);
  }

  sample(): number {
    // Use gamma distribution sampling to generate beta samples
    const gamma1 = this.sampleGamma(this.alpha, 1);
    const gamma2 = this.sampleGamma(this.beta, 1);
    return gamma1 / (gamma1 + gamma2);
  }

  private betaFunction(a: number, b: number): number {
    return (this.gammaFunction(a) * this.gammaFunction(b)) / this.gammaFunction(a + b);
  }

  private gammaFunction(z: number): number {
    // Stirling's approximation for gamma function
    if (z < 0.5) {
      return Math.PI / (Math.sin(Math.PI * z) * this.gammaFunction(1 - z));
    }
    z -= 1;
    let x = 0.99999999999980993;
    const coefficients = [
      676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012,
      9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    
    for (let i = 0; i < coefficients.length; i++) {
      x += coefficients[i] / (z + i + 1);
    }
    
    const t = z + coefficients.length - 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }

  private incompleteBeta(x: number, a: number, b: number): number {
    // Simplified incomplete beta function
    const bt = Math.exp(this.logGamma(a + b) - this.logGamma(a) - this.logGamma(b) + 
                       a * Math.log(x) + b * Math.log(1 - x));
    
    if (x < (a + 1) / (a + b + 2)) {
      return bt * this.betaContinuedFraction(x, a, b) / a;
    } else {
      return 1 - bt * this.betaContinuedFraction(1 - x, b, a) / b;
    }
  }

  private betaContinuedFraction(x: number, a: number, b: number): number {
    const maxIterations = 100;
    const epsilon = 3e-7;
    
    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - qab * x / qap;
    
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    let h = d;
    
    for (let m = 1; m <= maxIterations; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      h *= d * c;
      
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c;
      h *= del;
      
      if (Math.abs(del - 1) < epsilon) break;
    }
    
    return h;
  }

  private logGamma(z: number): number {
    return Math.log(this.gammaFunction(z));
  }

  private sampleGamma(shape: number, scale: number): number {
    // Marsaglia and Tsang's method for gamma distribution
    if (shape < 1) {
      return this.sampleGamma(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
    }
    
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      let x: number;
      let v: number;
      
      do {
        x = this.sampleNormal(0, 1);
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      const u = Math.random();
      
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }
      
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  private sampleNormal(mu: number, sigma: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * sigma + mu;
  }
}

/**
 * Gamma distribution
 */
export class GammaDistribution extends ProbabilityDistribution {
  constructor(
    private shape: number,
    private scale: number
  ) {
    super();
    if (shape <= 0 || scale <= 0) {
      throw new Error('Shape and scale parameters must be positive');
    }
  }

  mean(): number {
    return this.shape * this.scale;
  }

  variance(): number {
    return this.shape * this.scale * this.scale;
  }

  pdf(x: number): number {
    if (x < 0) return 0;
    
    const coefficient = Math.pow(x, this.shape - 1) * Math.exp(-x / this.scale);
    const denominator = Math.pow(this.scale, this.shape) * this.gammaFunction(this.shape);
    return coefficient / denominator;
  }

  cdf(x: number): number {
    if (x <= 0) return 0;
    
    // Simplified CDF approximation for common cases
    if (this.shape === 1) {
      // Exponential distribution: 1 - exp(-x/scale)
      return 1 - Math.exp(-x / this.scale);
    }
    
    if (this.shape === 2) {
      // Gamma(2, scale): 1 - (1 + x/scale) * exp(-x/scale)
      const t = x / this.scale;
      return 1 - (1 + t) * Math.exp(-t);
    }
    
    // General case using incomplete gamma function approximation
    const normalizedX = x / this.scale;
    return Math.min(1, this.incompleteGamma(this.shape, normalizedX) / this.gammaFunction(this.shape));
  }

  sample(): number {
    // Use the same method as in BetaDistribution
    return this.sampleGamma(this.shape, this.scale);
  }

  private gammaFunction(z: number): number {
    // Same implementation as in BetaDistribution
    if (z < 0.5) {
      return Math.PI / (Math.sin(Math.PI * z) * this.gammaFunction(1 - z));
    }
    z -= 1;
    let x = 0.99999999999980993;
    const coefficients = [
      676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012,
      9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    
    for (let i = 0; i < coefficients.length; i++) {
      x += coefficients[i] / (z + i + 1);
    }
    
    const t = z + coefficients.length - 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }

  private incompleteGamma(a: number, x: number): number {
    // Series expansion for incomplete gamma function
    if (x === 0) return 0;
    
    let sum = 1;
    let term = 1;
    let n = 1;
    
    while (Math.abs(term) > 1e-15 && n < 100) {
      term *= x / (a + n - 1);
      sum += term;
      n++;
    }
    
    return Math.exp(-x + a * Math.log(x) - this.logGamma(a)) * sum;
  }

  private logGamma(z: number): number {
    return Math.log(this.gammaFunction(z));
  }

  private sampleGamma(shape: number, scale: number): number {
    // Marsaglia and Tsang's method
    if (shape < 1) {
      return this.sampleGamma(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
    }
    
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      let x: number;
      let v: number;
      
      do {
        x = this.sampleNormal(0, 1);
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      const u = Math.random();
      
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }
      
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  private sampleNormal(mu: number, sigma: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * sigma + mu;
  }
}
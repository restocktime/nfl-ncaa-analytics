const { parentPort } = require('worker_threads');

/**
 * Monte Carlo simulation worker thread
 * Executes simulation iterations in parallel
 */

class SimulationWorker {
  constructor() {
    this.random = Math.random;
  }

  /**
   * Execute simulation task
   */
  async executeTask(task) {
    const startTime = Date.now();
    
    try {
      const outcomes = [];
      const factors = {};
      
      // Initialize random seed if provided
      if (task.config.randomSeed) {
        this.initializeRandom(task.config.randomSeed + task.startIteration);
      }
      
      // Run iterations
      for (let i = task.startIteration; i < task.endIteration; i++) {
        const outcome = await this.runSingleIteration(task.scenario, i);
        outcomes.push(outcome.value);
        
        // Aggregate factors
        for (const [factorName, factorValue] of Object.entries(outcome.factors)) {
          if (!factors[factorName]) {
            factors[factorName] = 0;
          }
          factors[factorName] += factorValue;
        }
      }
      
      // Average factors
      const iterationCount = task.endIteration - task.startIteration;
      for (const factorName of Object.keys(factors)) {
        factors[factorName] /= iterationCount;
      }
      
      const executionTime = Date.now() - startTime;
      
      return {
        taskId: task.id,
        scenarioId: task.scenarioId,
        iterations: iterationCount,
        outcomes,
        factors,
        executionTime
      };
      
    } catch (error) {
      return {
        taskId: task.id,
        scenarioId: task.scenarioId,
        iterations: 0,
        outcomes: [],
        factors: {},
        executionTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Run a single simulation iteration
   */
  async runSingleIteration(scenario, iterationIndex) {
    const gameState = { ...scenario.gameState };
    const factors = {};
    
    // Sample variables according to their distributions
    const sampledVariables = {};
    for (const variable of scenario.variables) {
      sampledVariables[variable.name] = this.sampleFromDistribution(variable.distribution);
      factors[variable.name] = sampledVariables[variable.name];
    }
    
    // Apply correlations
    this.applyCorrelations(sampledVariables, scenario.variables);
    
    // Simulate game outcome
    const outcome = this.simulateGameOutcome(gameState, sampledVariables, scenario.constraints);
    
    // Calculate additional factors
    factors['momentum'] = this.calculateMomentumFactor(gameState);
    factors['time_remaining'] = this.calculateTimeRemainingFactor(gameState);
    factors['field_position'] = this.calculateFieldPositionFactor(gameState);
    factors['score_differential'] = this.calculateScoreDifferentialFactor(gameState);
    
    return {
      value: outcome,
      factors
    };
  }

  /**
   * Sample from probability distribution
   */
  sampleFromDistribution(distribution) {
    switch (distribution.type) {
      case 'normal':
        return this.sampleNormal(distribution.parameters.mean, distribution.parameters.stddev);
      
      case 'uniform':
        return this.sampleUniform(distribution.parameters.min, distribution.parameters.max);
      
      case 'beta':
        return this.sampleBeta(distribution.parameters.alpha, distribution.parameters.beta);
      
      case 'gamma':
        return this.sampleGamma(distribution.parameters.shape, distribution.parameters.scale);
      
      case 'poisson':
        return this.samplePoisson(distribution.parameters.lambda);
      
      case 'binomial':
        return this.sampleBinomial(distribution.parameters.n, distribution.parameters.p);
      
      case 'exponential':
        return this.sampleExponential(distribution.parameters.lambda);
      
      default:
        throw new Error(`Unsupported distribution type: ${distribution.type}`);
    }
  }

  /**
   * Sample from normal distribution using Box-Muller transform
   */
  sampleNormal(mean = 0, stddev = 1) {
    let u = 0, v = 0;
    while (u === 0) u = this.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = this.random();
    
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return z * stddev + mean;
  }

  /**
   * Sample from uniform distribution
   */
  sampleUniform(min = 0, max = 1) {
    return min + (max - min) * this.random();
  }

  /**
   * Sample from beta distribution using rejection sampling
   */
  sampleBeta(alpha, beta) {
    if (alpha <= 1 && beta <= 1) {
      // Use Johnk's algorithm
      let x, y;
      do {
        x = Math.pow(this.random(), 1 / alpha);
        y = Math.pow(this.random(), 1 / beta);
      } while (x + y > 1);
      
      return x / (x + y);
    } else {
      // Use gamma ratio method
      const x = this.sampleGamma(alpha, 1);
      const y = this.sampleGamma(beta, 1);
      return x / (x + y);
    }
  }

  /**
   * Sample from gamma distribution using Marsaglia and Tsang method
   */
  sampleGamma(shape, scale = 1) {
    if (shape < 1) {
      return this.sampleGamma(shape + 1, scale) * Math.pow(this.random(), 1 / shape);
    }
    
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      let x, v;
      do {
        x = this.sampleNormal(0, 1);
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      const u = this.random();
      
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }
      
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  /**
   * Sample from Poisson distribution
   */
  samplePoisson(lambda) {
    if (lambda < 30) {
      // Use Knuth's algorithm
      const L = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      
      do {
        k++;
        p *= this.random();
      } while (p > L);
      
      return k - 1;
    } else {
      // Use normal approximation for large lambda
      return Math.max(0, Math.round(this.sampleNormal(lambda, Math.sqrt(lambda))));
    }
  }

  /**
   * Sample from binomial distribution
   */
  sampleBinomial(n, p) {
    if (n * p < 10 || n * (1 - p) < 10) {
      // Use direct method for small parameters
      let successes = 0;
      for (let i = 0; i < n; i++) {
        if (this.random() < p) {
          successes++;
        }
      }
      return successes;
    } else {
      // Use normal approximation
      const mean = n * p;
      const variance = n * p * (1 - p);
      return Math.max(0, Math.min(n, Math.round(this.sampleNormal(mean, Math.sqrt(variance)))));
    }
  }

  /**
   * Sample from exponential distribution
   */
  sampleExponential(lambda) {
    return -Math.log(1 - this.random()) / lambda;
  }

  /**
   * Apply variable correlations
   */
  applyCorrelations(sampledVariables, variables) {
    for (const variable of variables) {
      if (variable.correlation && variable.correlation.length > 0) {
        let adjustment = 0;
        for (const corr of variable.correlation) {
          if (sampledVariables[corr.variable] !== undefined) {
            adjustment += corr.coefficient * sampledVariables[corr.variable];
          }
        }
        sampledVariables[variable.name] += adjustment * 0.1; // Scale adjustment
      }
    }
  }

  /**
   * Simulate game outcome based on current state and variables
   */
  simulateGameOutcome(gameState, variables, constraints) {
    // Basic win probability calculation
    let winProbability = 0.5; // Start neutral
    
    // Adjust for score differential
    const scoreDiff = gameState.score.home - gameState.score.away;
    winProbability += scoreDiff * 0.02; // 2% per point
    
    // Adjust for time remaining
    const timeRemaining = gameState.timeRemaining.minutes + gameState.timeRemaining.seconds / 60;
    const gameProgress = 1 - (timeRemaining / (15 * 4)); // Normalize to game progress
    winProbability += (winProbability - 0.5) * gameProgress * 0.5; // Amplify lead as time runs out
    
    // Adjust for field position
    if (gameState.fieldPosition.yardLine <= 20) {
      winProbability += gameState.possession.id === gameState.game.homeTeam.id ? 0.1 : -0.1;
    }
    
    // Apply variable effects
    for (const [varName, varValue] of Object.entries(variables)) {
      switch (varName) {
        case 'offensive_efficiency':
          winProbability += (varValue - 0.5) * 0.3;
          break;
        case 'defensive_efficiency':
          winProbability += (varValue - 0.5) * 0.2;
          break;
        case 'weather_impact':
          winProbability += (varValue - 0.5) * 0.1;
          break;
        case 'momentum':
          winProbability += (varValue - 0.5) * 0.15;
          break;
      }
    }
    
    // Apply constraints
    for (const constraint of constraints) {
      if (!this.evaluateConstraint(constraint, gameState, variables)) {
        if (constraint.type === 'hard') {
          // Hard constraint violation - return extreme value
          return constraint.penalty || 0;
        } else if (constraint.type === 'penalty') {
          winProbability -= constraint.penalty || 0.1;
        }
      }
    }
    
    // Clamp probability
    winProbability = Math.max(0, Math.min(1, winProbability));
    
    return winProbability;
  }

  /**
   * Evaluate constraint condition
   */
  evaluateConstraint(constraint, gameState, variables) {
    try {
      // Simple constraint evaluation - in production, use a safer expression evaluator
      const context = { gameState, variables };
      return eval(`(function() { 
        const { gameState, variables } = arguments[0]; 
        return ${constraint.condition}; 
      })`)(context);
    } catch (error) {
      return false; // Constraint evaluation failed
    }
  }

  /**
   * Calculate momentum factor
   */
  calculateMomentumFactor(gameState) {
    return gameState.momentum?.value || 0;
  }

  /**
   * Calculate time remaining factor
   */
  calculateTimeRemainingFactor(gameState) {
    const totalSeconds = gameState.timeRemaining.minutes * 60 + gameState.timeRemaining.seconds;
    const quarterSeconds = 15 * 60; // 15 minutes per quarter
    return totalSeconds / quarterSeconds;
  }

  /**
   * Calculate field position factor
   */
  calculateFieldPositionFactor(gameState) {
    return gameState.fieldPosition.yardLine / 100;
  }

  /**
   * Calculate score differential factor
   */
  calculateScoreDifferentialFactor(gameState) {
    const diff = gameState.score.home - gameState.score.away;
    return Math.tanh(diff / 14); // Normalize using tanh
  }

  /**
   * Initialize pseudo-random number generator with seed
   */
  initializeRandom(seed) {
    // Simple linear congruential generator
    let currentSeed = seed;
    this.random = () => {
      currentSeed = (currentSeed * 1664525 + 1013904223) % Math.pow(2, 32);
      return currentSeed / Math.pow(2, 32);
    };
  }
}

// Worker message handler
if (parentPort) {
  const worker = new SimulationWorker();
  
  parentPort.on('message', async (task) => {
    try {
      const result = await worker.executeTask(task);
      parentPort.postMessage(result);
    } catch (error) {
      parentPort.postMessage({
        taskId: task.id,
        scenarioId: task.scenarioId,
        iterations: 0,
        outcomes: [],
        factors: {},
        executionTime: 0,
        error: error.message
      });
    }
  });
}

module.exports = SimulationWorker;
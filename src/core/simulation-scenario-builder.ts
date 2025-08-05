import { v4 as uuidv4 } from 'uuid';
import { 
  SimulationScenario, 
  SimulationVariable, 
  SimulationConstraint,
  VariableType,
  DistributionType,
  ConstraintType
} from '../types/simulation.types';
import { GameState } from '../models/GameState';

/**
 * Builder class for creating Monte Carlo simulation scenarios
 */
export class SimulationScenarioBuilder {
  private scenario: Partial<SimulationScenario>;

  constructor() {
    this.scenario = {
      id: uuidv4(),
      iterations: 10000,
      variables: [],
      constraints: [],
      metadata: {}
    };
  }

  /**
   * Set scenario ID
   */
  withId(id: string): SimulationScenarioBuilder {
    this.scenario.id = id;
    return this;
  }

  /**
   * Set game state
   */
  withGameState(gameState: GameState): SimulationScenarioBuilder {
    this.scenario.gameState = gameState;
    return this;
  }

  /**
   * Set number of iterations
   */
  withIterations(iterations: number): SimulationScenarioBuilder {
    if (iterations < 1 || iterations > 1000000) {
      throw new Error('Iterations must be between 1 and 1,000,000');
    }
    this.scenario.iterations = iterations;
    return this;
  }

  /**
   * Add a continuous variable with normal distribution
   */
  addNormalVariable(
    name: string, 
    mean: number, 
    stddev: number, 
    bounds?: { min: number; max: number }
  ): SimulationScenarioBuilder {
    const variable: SimulationVariable = {
      name,
      type: VariableType.CONTINUOUS,
      distribution: {
        type: DistributionType.NORMAL,
        parameters: { mean, stddev }
      },
      bounds
    };
    
    this.scenario.variables!.push(variable);
    return this;
  }

  /**
   * Add a continuous variable with uniform distribution
   */
  addUniformVariable(
    name: string, 
    min: number, 
    max: number
  ): SimulationScenarioBuilder {
    const variable: SimulationVariable = {
      name,
      type: VariableType.CONTINUOUS,
      distribution: {
        type: DistributionType.UNIFORM,
        parameters: { min, max }
      },
      bounds: { min, max }
    };
    
    this.scenario.variables!.push(variable);
    return this;
  }

  /**
   * Add a continuous variable with beta distribution
   */
  addBetaVariable(
    name: string, 
    alpha: number, 
    beta: number
  ): SimulationScenarioBuilder {
    const variable: SimulationVariable = {
      name,
      type: VariableType.CONTINUOUS,
      distribution: {
        type: DistributionType.BETA,
        parameters: { alpha, beta }
      },
      bounds: { min: 0, max: 1 }
    };
    
    this.scenario.variables!.push(variable);
    return this;
  }

  /**
   * Add a discrete variable with Poisson distribution
   */
  addPoissonVariable(
    name: string, 
    lambda: number
  ): SimulationScenarioBuilder {
    const variable: SimulationVariable = {
      name,
      type: VariableType.DISCRETE,
      distribution: {
        type: DistributionType.POISSON,
        parameters: { lambda }
      }
    };
    
    this.scenario.variables!.push(variable);
    return this;
  }

  /**
   * Add a discrete variable with binomial distribution
   */
  addBinomialVariable(
    name: string, 
    n: number, 
    p: number
  ): SimulationScenarioBuilder {
    const variable: SimulationVariable = {
      name,
      type: VariableType.DISCRETE,
      distribution: {
        type: DistributionType.BINOMIAL,
        parameters: { n, p }
      }
    };
    
    this.scenario.variables!.push(variable);
    return this;
  }

  /**
   * Add variable correlation
   */
  addCorrelation(
    variable1: string, 
    variable2: string, 
    coefficient: number
  ): SimulationScenarioBuilder {
    if (coefficient < -1 || coefficient > 1) {
      throw new Error('Correlation coefficient must be between -1 and 1');
    }

    const var1 = this.scenario.variables!.find(v => v.name === variable1);
    const var2 = this.scenario.variables!.find(v => v.name === variable2);

    if (!var1 || !var2) {
      throw new Error('Both variables must exist before adding correlation');
    }

    if (!var1.correlation) var1.correlation = [];
    if (!var2.correlation) var2.correlation = [];

    var1.correlation.push({ variable: variable2, coefficient });
    var2.correlation.push({ variable: variable1, coefficient });

    return this;
  }

  /**
   * Add a hard constraint that must be satisfied
   */
  addHardConstraint(
    name: string, 
    condition: string
  ): SimulationScenarioBuilder {
    const constraint: SimulationConstraint = {
      name,
      type: ConstraintType.HARD,
      condition
    };
    
    this.scenario.constraints!.push(constraint);
    return this;
  }

  /**
   * Add a soft constraint with penalty
   */
  addSoftConstraint(
    name: string, 
    condition: string, 
    penalty: number = 0.1
  ): SimulationScenarioBuilder {
    const constraint: SimulationConstraint = {
      name,
      type: ConstraintType.SOFT,
      condition,
      penalty
    };
    
    this.scenario.constraints!.push(constraint);
    return this;
  }

  /**
   * Add metadata
   */
  addMetadata(key: string, value: any): SimulationScenarioBuilder {
    this.scenario.metadata![key] = value;
    return this;
  }

  /**
   * Create a standard football game scenario
   */
  static createFootballGameScenario(gameState: GameState, iterations: number = 10000): SimulationScenarioBuilder {
    const builder = new SimulationScenarioBuilder()
      .withGameState(gameState)
      .withIterations(iterations);

    // Add standard football variables
    builder
      .addBetaVariable('offensive_efficiency', 2, 2) // Bell curve around 0.5
      .addBetaVariable('defensive_efficiency', 2, 2)
      .addNormalVariable('momentum', 0, 0.2, { min: -1, max: 1 })
      .addUniformVariable('weather_impact', -0.1, 0.1)
      .addPoissonVariable('turnovers', 1.5)
      .addBinomialVariable('third_down_conversions', 10, 0.4);

    // Add correlations
    builder
      .addCorrelation('offensive_efficiency', 'momentum', 0.3)
      .addCorrelation('defensive_efficiency', 'momentum', -0.2)
      .addCorrelation('turnovers', 'momentum', -0.4);

    // Add constraints
    builder
      .addHardConstraint('valid_efficiency', 'variables.offensive_efficiency >= 0 && variables.offensive_efficiency <= 1')
      .addSoftConstraint('realistic_turnovers', 'variables.turnovers <= 5', 0.2);

    return builder;
  }

  /**
   * Create a red zone scenario
   */
  static createRedZoneScenario(gameState: GameState, iterations: number = 5000): SimulationScenarioBuilder {
    const builder = new SimulationScenarioBuilder()
      .withGameState(gameState)
      .withIterations(iterations);

    // Red zone specific variables
    builder
      .addBetaVariable('red_zone_efficiency', 3, 2) // Slightly higher success rate
      .addUniformVariable('play_call_effectiveness', 0.3, 0.8)
      .addBinomialVariable('goal_line_stands', 3, 0.25)
      .addNormalVariable('field_goal_accuracy', 0.85, 0.1, { min: 0, max: 1 });

    // Red zone constraints
    builder
      .addHardConstraint('in_red_zone', 'gameState.fieldPosition.yardLine <= 20')
      .addSoftConstraint('high_pressure', 'variables.red_zone_efficiency >= 0.4', 0.15);

    return builder;
  }

  /**
   * Create a two-minute drill scenario
   */
  static createTwoMinuteDrillScenario(gameState: GameState, iterations: number = 7500): SimulationScenarioBuilder {
    const builder = new SimulationScenarioBuilder()
      .withGameState(gameState)
      .withIterations(iterations);

    // Two-minute drill variables
    builder
      .addBetaVariable('urgency_factor', 4, 2) // Higher urgency
      .addNormalVariable('clock_management', 0.7, 0.15, { min: 0, max: 1 })
      .addUniformVariable('timeout_usage', 0, 1)
      .addBinomialVariable('completed_passes', 8, 0.65);

    // Time pressure constraints
    builder
      .addHardConstraint('time_pressure', 'gameState.timeRemaining.minutes <= 2')
      .addSoftConstraint('efficient_plays', 'variables.clock_management >= 0.5', 0.1);

    return builder;
  }

  /**
   * Validate and build the scenario
   */
  build(): SimulationScenario {
    this.validate();
    return this.scenario as SimulationScenario;
  }

  /**
   * Validate the scenario configuration
   */
  private validate(): void {
    if (!this.scenario.id) {
      throw new Error('Scenario must have an ID');
    }

    if (!this.scenario.gameState) {
      throw new Error('Scenario must have a game state');
    }

    if (!this.scenario.iterations || this.scenario.iterations < 1) {
      throw new Error('Scenario must have at least 1 iteration');
    }

    if (!this.scenario.variables || this.scenario.variables.length === 0) {
      throw new Error('Scenario must have at least one variable');
    }

    // Validate variable names are unique
    const variableNames = this.scenario.variables.map(v => v.name);
    const uniqueNames = new Set(variableNames);
    if (variableNames.length !== uniqueNames.size) {
      throw new Error('Variable names must be unique');
    }

    // Validate distribution parameters
    for (const variable of this.scenario.variables) {
      this.validateDistribution(variable);
    }

    // Validate correlations reference existing variables
    for (const variable of this.scenario.variables) {
      if (variable.correlation) {
        for (const corr of variable.correlation) {
          if (!variableNames.includes(corr.variable)) {
            throw new Error(`Correlation references non-existent variable: ${corr.variable}`);
          }
        }
      }
    }
  }

  /**
   * Validate distribution parameters
   */
  private validateDistribution(variable: SimulationVariable): void {
    const { type, parameters } = variable.distribution;

    switch (type) {
      case DistributionType.NORMAL:
        if (parameters.stddev <= 0) {
          throw new Error(`Normal distribution stddev must be positive for variable ${variable.name}`);
        }
        break;

      case DistributionType.UNIFORM:
        if (parameters.min >= parameters.max) {
          throw new Error(`Uniform distribution min must be less than max for variable ${variable.name}`);
        }
        break;

      case DistributionType.BETA:
        if (parameters.alpha <= 0 || parameters.beta <= 0) {
          throw new Error(`Beta distribution parameters must be positive for variable ${variable.name}`);
        }
        break;

      case DistributionType.GAMMA:
        if (parameters.shape <= 0 || parameters.scale <= 0) {
          throw new Error(`Gamma distribution parameters must be positive for variable ${variable.name}`);
        }
        break;

      case DistributionType.POISSON:
        if (parameters.lambda <= 0) {
          throw new Error(`Poisson distribution lambda must be positive for variable ${variable.name}`);
        }
        break;

      case DistributionType.BINOMIAL:
        if (parameters.n < 1 || parameters.p < 0 || parameters.p > 1) {
          throw new Error(`Invalid binomial distribution parameters for variable ${variable.name}`);
        }
        break;

      case DistributionType.EXPONENTIAL:
        if (parameters.lambda <= 0) {
          throw new Error(`Exponential distribution lambda must be positive for variable ${variable.name}`);
        }
        break;

      default:
        throw new Error(`Unsupported distribution type: ${type} for variable ${variable.name}`);
    }
  }
}
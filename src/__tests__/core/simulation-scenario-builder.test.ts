import 'reflect-metadata';
import { SimulationScenarioBuilder } from '../../core/simulation-scenario-builder';
import { GameState } from '../../models/GameState';
import { Game } from '../../models/Game';
import { Team } from '../../models/Team';
import { GameStatus, GameType } from '../../types/common.types';
import { 
  DistributionType, 
  VariableType, 
  ConstraintType 
} from '../../types/simulation.types';

describe('SimulationScenarioBuilder', () => {
  let mockGameState: GameState;

  beforeEach(() => {
    const mockGame = new Game({
      id: 'game-1',
      homeTeam: new Team({ id: 'team-1', name: 'Home Team' }),
      awayTeam: new Team({ id: 'team-2', name: 'Away Team' }),
      venue: { 
        id: 'venue-1', 
        name: 'Test Stadium',
        city: 'Test City',
        state: 'TS',
        capacity: 50000,
        surface: 'grass',
        indoor: false,
        timezone: 'America/New_York'
      },
      scheduledTime: new Date(),
      status: GameStatus.IN_PROGRESS,
      season: 2024,
      week: 1,
      gameType: GameType.REGULAR_SEASON,
      officials: []
    });

    mockGameState = new GameState({
      game: mockGame,
      score: { home: 14, away: 10 },
      timeRemaining: { quarter: 3, minutes: 8, seconds: 30, overtime: false },
      possession: mockGame.homeTeam,
      fieldPosition: { side: 'home', yardLine: 35 },
      down: 2,
      yardsToGo: 7,
      momentum: { value: 0.2, trend: 'increasing', lastUpdated: new Date() },
      drives: [],
      penalties: [],
      timeouts: { home: 2, away: 3 }
    });
  });

  describe('basic builder functionality', () => {
    it('should create a builder with default values', () => {
      const builder = new SimulationScenarioBuilder();
      expect(builder).toBeInstanceOf(SimulationScenarioBuilder);
    });

    it('should set custom ID', () => {
      const customId = 'custom-scenario-123';
      const scenario = new SimulationScenarioBuilder()
        .withId(customId)
        .withGameState(mockGameState)
        .addNormalVariable('test', 0, 1)
        .build();

      expect(scenario.id).toBe(customId);
    });

    it('should set game state', () => {
      const scenario = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addNormalVariable('test', 0, 1)
        .build();

      expect(scenario.gameState).toBe(mockGameState);
    });

    it('should set iterations', () => {
      const iterations = 5000;
      const scenario = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .withIterations(iterations)
        .addNormalVariable('test', 0, 1)
        .build();

      expect(scenario.iterations).toBe(iterations);
    });

    it('should validate iteration bounds', () => {
      const builder = new SimulationScenarioBuilder();

      expect(() => builder.withIterations(0)).toThrow('Iterations must be between 1 and 1,000,000');
      expect(() => builder.withIterations(1000001)).toThrow('Iterations must be between 1 and 1,000,000');
    });
  });

  describe('variable creation', () => {
    it('should add normal variable', () => {
      const scenario = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addNormalVariable('test_normal', 0.5, 0.1, { min: 0, max: 1 })
        .build();

      const variable = scenario.variables.find(v => v.name === 'test_normal');
      expect(variable).toBeDefined();
      expect(variable!.type).toBe(VariableType.CONTINUOUS);
      expect(variable!.distribution.type).toBe(DistributionType.NORMAL);
      expect(variable!.distribution.parameters.mean).toBe(0.5);
      expect(variable!.distribution.parameters.stddev).toBe(0.1);
      expect(variable!.bounds).toEqual({ min: 0, max: 1 });
    });

    it('should add uniform variable', () => {
      const scenario = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addUniformVariable('test_uniform', 0, 1)
        .build();

      const variable = scenario.variables.find(v => v.name === 'test_uniform');
      expect(variable).toBeDefined();
      expect(variable!.type).toBe(VariableType.CONTINUOUS);
      expect(variable!.distribution.type).toBe(DistributionType.UNIFORM);
      expect(variable!.distribution.parameters.min).toBe(0);
      expect(variable!.distribution.parameters.max).toBe(1);
      expect(variable!.bounds).toEqual({ min: 0, max: 1 });
    });

    it('should add beta variable', () => {
      const scenario = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addBetaVariable('test_beta', 2, 3)
        .build();

      const variable = scenario.variables.find(v => v.name === 'test_beta');
      expect(variable).toBeDefined();
      expect(variable!.type).toBe(VariableType.CONTINUOUS);
      expect(variable!.distribution.type).toBe(DistributionType.BETA);
      expect(variable!.distribution.parameters.alpha).toBe(2);
      expect(variable!.distribution.parameters.beta).toBe(3);
      expect(variable!.bounds).toEqual({ min: 0, max: 1 });
    });

    it('should add Poisson variable', () => {
      const scenario = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addPoissonVariable('test_poisson', 2.5)
        .build();

      const variable = scenario.variables.find(v => v.name === 'test_poisson');
      expect(variable).toBeDefined();
      expect(variable!.type).toBe(VariableType.DISCRETE);
      expect(variable!.distribution.type).toBe(DistributionType.POISSON);
      expect(variable!.distribution.parameters.lambda).toBe(2.5);
    });

    it('should add binomial variable', () => {
      const scenario = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addBinomialVariable('test_binomial', 10, 0.3)
        .build();

      const variable = scenario.variables.find(v => v.name === 'test_binomial');
      expect(variable).toBeDefined();
      expect(variable!.type).toBe(VariableType.DISCRETE);
      expect(variable!.distribution.type).toBe(DistributionType.BINOMIAL);
      expect(variable!.distribution.parameters.n).toBe(10);
      expect(variable!.distribution.parameters.p).toBe(0.3);
    });
  });

  describe('correlations', () => {
    it('should add correlation between variables', () => {
      const scenario = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addNormalVariable('var1', 0, 1)
        .addNormalVariable('var2', 0, 1)
        .addCorrelation('var1', 'var2', 0.5)
        .build();

      const var1 = scenario.variables.find(v => v.name === 'var1');
      const var2 = scenario.variables.find(v => v.name === 'var2');

      expect(var1!.correlation).toBeDefined();
      expect(var1!.correlation![0].variable).toBe('var2');
      expect(var1!.correlation![0].coefficient).toBe(0.5);

      expect(var2!.correlation).toBeDefined();
      expect(var2!.correlation![0].variable).toBe('var1');
      expect(var2!.correlation![0].coefficient).toBe(0.5);
    });

    it('should validate correlation coefficient bounds', () => {
      const builder = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addNormalVariable('var1', 0, 1)
        .addNormalVariable('var2', 0, 1);

      expect(() => builder.addCorrelation('var1', 'var2', 1.5))
        .toThrow('Correlation coefficient must be between -1 and 1');
      expect(() => builder.addCorrelation('var1', 'var2', -1.5))
        .toThrow('Correlation coefficient must be between -1 and 1');
    });

    it('should validate that variables exist before adding correlation', () => {
      const builder = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addNormalVariable('var1', 0, 1);

      expect(() => builder.addCorrelation('var1', 'nonexistent', 0.5))
        .toThrow('Both variables must exist before adding correlation');
    });
  });

  describe('constraints', () => {
    it('should add hard constraint', () => {
      const scenario = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addNormalVariable('test', 0, 1)
        .addHardConstraint('test_constraint', 'variables.test > 0')
        .build();

      const constraint = scenario.constraints.find(c => c.name === 'test_constraint');
      expect(constraint).toBeDefined();
      expect(constraint!.type).toBe(ConstraintType.HARD);
      expect(constraint!.condition).toBe('variables.test > 0');
    });

    it('should add soft constraint with penalty', () => {
      const scenario = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addNormalVariable('test', 0, 1)
        .addSoftConstraint('soft_constraint', 'variables.test < 0.8', 0.2)
        .build();

      const constraint = scenario.constraints.find(c => c.name === 'soft_constraint');
      expect(constraint).toBeDefined();
      expect(constraint!.type).toBe(ConstraintType.SOFT);
      expect(constraint!.condition).toBe('variables.test < 0.8');
      expect(constraint!.penalty).toBe(0.2);
    });
  });

  describe('metadata', () => {
    it('should add metadata', () => {
      const scenario = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addNormalVariable('test', 0, 1)
        .addMetadata('author', 'test-user')
        .addMetadata('version', '1.0')
        .build();

      expect(scenario.metadata!.author).toBe('test-user');
      expect(scenario.metadata!.version).toBe('1.0');
    });
  });

  describe('predefined scenarios', () => {
    it('should create football game scenario', () => {
      const scenario = SimulationScenarioBuilder
        .createFootballGameScenario(mockGameState, 5000)
        .build();

      expect(scenario.gameState).toBe(mockGameState);
      expect(scenario.iterations).toBe(5000);
      expect(scenario.variables.length).toBeGreaterThan(0);
      expect(scenario.constraints.length).toBeGreaterThan(0);

      // Check for expected variables
      const variableNames = scenario.variables.map(v => v.name);
      expect(variableNames).toContain('offensive_efficiency');
      expect(variableNames).toContain('defensive_efficiency');
      expect(variableNames).toContain('momentum');
      expect(variableNames).toContain('weather_impact');
    });

    it('should create red zone scenario', () => {
      const scenario = SimulationScenarioBuilder
        .createRedZoneScenario(mockGameState, 3000)
        .build();

      expect(scenario.gameState).toBe(mockGameState);
      expect(scenario.iterations).toBe(3000);
      expect(scenario.variables.length).toBeGreaterThan(0);

      // Check for red zone specific variables
      const variableNames = scenario.variables.map(v => v.name);
      expect(variableNames).toContain('red_zone_efficiency');
      expect(variableNames).toContain('field_goal_accuracy');
    });

    it('should create two-minute drill scenario', () => {
      const scenario = SimulationScenarioBuilder
        .createTwoMinuteDrillScenario(mockGameState, 4000)
        .build();

      expect(scenario.gameState).toBe(mockGameState);
      expect(scenario.iterations).toBe(4000);
      expect(scenario.variables.length).toBeGreaterThan(0);

      // Check for two-minute drill specific variables
      const variableNames = scenario.variables.map(v => v.name);
      expect(variableNames).toContain('urgency_factor');
      expect(variableNames).toContain('clock_management');
    });
  });

  describe('validation', () => {
    it('should require ID', () => {
      const builder = new SimulationScenarioBuilder()
        .withId('')
        .withGameState(mockGameState)
        .addNormalVariable('test', 0, 1);

      expect(() => builder.build()).toThrow('Scenario must have an ID');
    });

    it('should require game state', () => {
      const builder = new SimulationScenarioBuilder()
        .addNormalVariable('test', 0, 1);

      expect(() => builder.build()).toThrow('Scenario must have a game state');
    });

    it('should require at least one variable', () => {
      const builder = new SimulationScenarioBuilder()
        .withGameState(mockGameState);

      expect(() => builder.build()).toThrow('Scenario must have at least one variable');
    });

    it('should require unique variable names', () => {
      const builder = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addNormalVariable('duplicate', 0, 1)
        .addUniformVariable('duplicate', 0, 1);

      expect(() => builder.build()).toThrow('Variable names must be unique');
    });

    it('should validate normal distribution parameters', () => {
      const builder = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addNormalVariable('invalid', 0, -1); // Negative stddev

      expect(() => builder.build()).toThrow('Normal distribution stddev must be positive');
    });

    it('should validate uniform distribution parameters', () => {
      const builder = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addUniformVariable('invalid', 1, 0); // min > max

      expect(() => builder.build()).toThrow('Uniform distribution min must be less than max');
    });

    it('should validate beta distribution parameters', () => {
      const builder = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addBetaVariable('invalid', -1, 2); // Negative alpha

      expect(() => builder.build()).toThrow('Beta distribution parameters must be positive');
    });

    it('should validate Poisson distribution parameters', () => {
      const builder = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addPoissonVariable('invalid', -1); // Negative lambda

      expect(() => builder.build()).toThrow('Poisson distribution lambda must be positive');
    });

    it('should validate binomial distribution parameters', () => {
      const builder = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addBinomialVariable('invalid', 0, 0.5); // n < 1

      expect(() => builder.build()).toThrow('Invalid binomial distribution parameters');
    });

    it('should validate correlation references', () => {
      const builder = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .addNormalVariable('var1', 0, 1);

      expect(() => builder.addCorrelation('var1', 'nonexistent', 0.5))
        .toThrow('Both variables must exist before adding correlation');
    });
  });

  describe('complex scenarios', () => {
    it('should build complex scenario with multiple variables and constraints', () => {
      const scenario = new SimulationScenarioBuilder()
        .withGameState(mockGameState)
        .withIterations(8000)
        .addNormalVariable('offense', 0.5, 0.1)
        .addBetaVariable('defense', 2, 2)
        .addPoissonVariable('turnovers', 1.5)
        .addCorrelation('offense', 'defense', -0.3)
        .addHardConstraint('valid_offense', 'variables.offense >= 0')
        .addSoftConstraint('low_turnovers', 'variables.turnovers <= 3', 0.1)
        .addMetadata('complexity', 'high')
        .build();

      expect(scenario.variables).toHaveLength(3);
      expect(scenario.constraints).toHaveLength(2);
      expect(scenario.metadata!.complexity).toBe('high');

      // Verify correlations are bidirectional
      const offense = scenario.variables.find(v => v.name === 'offense');
      const defense = scenario.variables.find(v => v.name === 'defense');
      
      expect(offense!.correlation).toHaveLength(1);
      expect(defense!.correlation).toHaveLength(1);
    });
  });
});
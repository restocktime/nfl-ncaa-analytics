import 'reflect-metadata';
import { MonteCarloService } from '../../core/monte-carlo-service';
import { SimulationScenarioBuilder } from '../../core/simulation-scenario-builder';
import { Logger } from '../../core/logger';
import { GameState } from '../../models/GameState';
import { Game } from '../../models/Game';
import { Team } from '../../models/Team';
import { GameStatus, GameType } from '../../types/common.types';

describe('MonteCarloService Performance Tests', () => {
  let service: MonteCarloService;
  let mockLogger: jest.Mocked<Logger>;
  let mockGameState: GameState;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    // Create mock game state
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

    service = new MonteCarloService(mockLogger, 2);
  });

  afterEach(async () => {
    await service.cleanup();
  });

  it('should validate scenario creation performance', () => {
    const startTime = Date.now();
    
    // Create 100 scenarios to test builder performance
    for (let i = 0; i < 100; i++) {
      const scenario = SimulationScenarioBuilder
        .createFootballGameScenario(mockGameState, 1000)
        .withId(`scenario-${i}`)
        .build();
      
      expect(scenario.id).toBe(`scenario-${i}`);
      expect(scenario.variables.length).toBeGreaterThan(0);
    }
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // Should create 100 scenarios in under 1 second
  });

  it('should validate different scenario types', () => {
    const footballScenario = SimulationScenarioBuilder
      .createFootballGameScenario(mockGameState, 1000)
      .build();
    
    const redZoneScenario = SimulationScenarioBuilder
      .createRedZoneScenario(mockGameState, 500)
      .build();
    
    const twoMinuteScenario = SimulationScenarioBuilder
      .createTwoMinuteDrillScenario(mockGameState, 750)
      .build();

    expect(footballScenario.variables.length).toBeGreaterThan(0);
    expect(redZoneScenario.variables.length).toBeGreaterThan(0);
    expect(twoMinuteScenario.variables.length).toBeGreaterThan(0);
    
    // Each scenario should have different variables
    const footballVars = footballScenario.variables.map(v => v.name);
    const redZoneVars = redZoneScenario.variables.map(v => v.name);
    const twoMinuteVars = twoMinuteScenario.variables.map(v => v.name);
    
    expect(footballVars).toContain('offensive_efficiency');
    expect(redZoneVars).toContain('red_zone_efficiency');
    expect(twoMinuteVars).toContain('urgency_factor');
  });

  it('should handle service initialization and cleanup', async () => {
    expect(service.getActiveJobCount()).toBe(0);
    
    // Test cleanup
    await service.cleanup();
    expect(service.getActiveJobCount()).toBe(0);
  });

  it('should validate constraint evaluation logic', () => {
    const scenario = new SimulationScenarioBuilder()
      .withGameState(mockGameState)
      .addNormalVariable('test_var', 0.5, 0.1)
      .addHardConstraint('positive_test', 'variables.test_var > 0')
      .addSoftConstraint('reasonable_test', 'variables.test_var < 1', 0.1)
      .build();

    expect(scenario.constraints).toHaveLength(2);
    expect(scenario.constraints[0].type).toBe('hard');
    expect(scenario.constraints[1].type).toBe('soft');
    expect(scenario.constraints[1].penalty).toBe(0.1);
  });
});
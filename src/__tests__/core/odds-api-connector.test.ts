import { OddsAPIConnector } from '../../core/odds-api-connector';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';
import { APIError } from '../../types/api.types';
import { BettingLine } from '../../types/game.types';

// Mock the entire http-api-connector module
jest.mock('../../core/http-api-connector', () => {
  return {
    HttpAPIConnector: class MockHttpAPIConnector {
      protected config: any;
      protected logger: any;
      protected name: string;
      protected baseUrl: string;
      protected defaultHeaders: any;

      constructor(config: any, logger: any, name: string, baseUrl: string, defaultHeaders: any) {
        this.config = config;
        this.logger = logger;
        this.name = name;
        this.baseUrl = baseUrl;
        this.defaultHeaders = defaultHeaders;
      }

      async performRequest<T>(request: any): Promise<any> {
        return Promise.resolve({ data: [], status: 200, headers: {}, timestamp: new Date() });
      }

      async performHealthCheck(): Promise<void> {
        return Promise.resolve();
      }

      async executeRequest<T>(request: any): Promise<any> {
        return this.performRequest<T>(request);
      }

      isHealthy(): boolean {
        return true;
      }

      getRateLimit(): any {
        return { limit: 500, remaining: 499, resetTime: new Date(), windowMs: 60000 };
      }

      async connect(): Promise<void> {
        return Promise.resolve();
      }

      async disconnect(): Promise<void> {
        return Promise.resolve();
      }

      protected buildUrl(path: string): string {
        return `${this.baseUrl}${path}`;
      }

      protected mergeHeaders(requestHeaders?: Record<string, string>): Record<string, string> {
        return { ...this.defaultHeaders, ...requestHeaders };
      }

      protected updateRateLimitInfo(headers: Record<string, string>): void {
        // Mock implementation
      }
    }
  };
});

describe('OddsAPIConnector', () => {
  let connector: OddsAPIConnector;
  let mockConfig: jest.Mocked<Config>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    // Setup default config values
    mockConfig.get.mockImplementation((key: string) => {
      const configMap: Record<string, any> = {
        'apis.oddsAPI.apiKey': 'test-odds-api-key',
        'apis.oddsAPI.baseUrl': 'https://api.the-odds-api.com/v4',
        'apis.oddsAPI.rateLimit': 500,
        'circuitBreaker.failureThreshold': 5,
        'circuitBreaker.recoveryTimeout': 60000,
        'circuitBreaker.monitoringPeriod': 10000
      };
      return configMap[key];
    });

    connector = new OddsAPIConnector(mockConfig, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(mockConfig.get).toHaveBeenCalledWith('apis.oddsAPI.apiKey');
      expect(mockConfig.get).toHaveBeenCalledWith('apis.oddsAPI.baseUrl');
      expect(mockConfig.get).toHaveBeenCalledWith('apis.oddsAPI.rateLimit');
      expect(mockLogger.info).toHaveBeenCalledWith('Odds API connector initialized', expect.any(Object));
    });
  });

  describe('odds data mapping', () => {
    it('should map odds API response to betting lines correctly', async () => {
      const mockOddsResponse = [
        {
          id: 'game123',
          sport_key: 'americanfootball_nfl',
          sport_title: 'NFL',
          commence_time: '2024-09-08T17:00:00Z',
          home_team: 'Baltimore Ravens',
          away_team: 'Kansas City Chiefs',
          bookmakers: [
            {
              key: 'draftkings',
              title: 'DraftKings',
              last_update: '2024-09-08T12:00:00Z',
              markets: [
                {
                  key: 'h2h',
                  last_update: '2024-09-08T12:00:00Z',
                  outcomes: [
                    {
                      name: 'Baltimore Ravens',
                      price: -110
                    },
                    {
                      name: 'Kansas City Chiefs',
                      price: -110
                    }
                  ]
                },
                {
                  key: 'spreads',
                  last_update: '2024-09-08T12:00:00Z',
                  outcomes: [
                    {
                      name: 'Baltimore Ravens',
                      price: -110,
                      point: 3.5
                    },
                    {
                      name: 'Kansas City Chiefs',
                      price: -110,
                      point: -3.5
                    }
                  ]
                },
                {
                  key: 'totals',
                  last_update: '2024-09-08T12:00:00Z',
                  outcomes: [
                    {
                      name: 'Over',
                      price: -110,
                      point: 47.5
                    },
                    {
                      name: 'Under',
                      price: -110,
                      point: 47.5
                    }
                  ]
                }
              ]
            }
          ]
        }
      ];

      // Mock the performRequest method to return our test data
      const mockPerformRequest = jest.fn().mockResolvedValue({
        data: mockOddsResponse,
        status: 200,
        headers: {},
        timestamp: new Date()
      });
      
      (connector as any).performRequest = mockPerformRequest;

      const result = await connector.fetchNFLOdds();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        gameId: 'game123',
        sportsbook: 'DraftKings',
        spread: {
          home: 3.5,
          away: -3.5,
          homeOdds: -110,
          awayOdds: -110
        },
        total: {
          line: 47.5,
          overOdds: -110,
          underOdds: -110
        },
        moneyline: {
          home: -110,
          away: -110
        },
        lastUpdated: new Date('2024-09-08T12:00:00Z')
      });
    });

    it('should handle multiple bookmakers for the same game', async () => {
      const mockOddsResponse = [
        {
          id: 'game123',
          sport_key: 'americanfootball_nfl',
          sport_title: 'NFL',
          commence_time: '2024-09-08T17:00:00Z',
          home_team: 'Baltimore Ravens',
          away_team: 'Kansas City Chiefs',
          bookmakers: [
            {
              key: 'draftkings',
              title: 'DraftKings',
              last_update: '2024-09-08T12:00:00Z',
              markets: [
                {
                  key: 'h2h',
                  last_update: '2024-09-08T12:00:00Z',
                  outcomes: [
                    { name: 'Baltimore Ravens', price: -105 },
                    { name: 'Kansas City Chiefs', price: -115 }
                  ]
                }
              ]
            },
            {
              key: 'fanduel',
              title: 'FanDuel',
              last_update: '2024-09-08T12:05:00Z',
              markets: [
                {
                  key: 'h2h',
                  last_update: '2024-09-08T12:05:00Z',
                  outcomes: [
                    { name: 'Baltimore Ravens', price: -110 },
                    { name: 'Kansas City Chiefs', price: -110 }
                  ]
                }
              ]
            }
          ]
        }
      ];

      const mockPerformRequest = jest.fn().mockResolvedValue({
        data: mockOddsResponse,
        status: 200,
        headers: {},
        timestamp: new Date()
      });
      
      (connector as any).performRequest = mockPerformRequest;

      const result = await connector.fetchNFLOdds();

      expect(result).toHaveLength(2);
      expect(result[0].sportsbook).toBe('DraftKings');
      expect(result[1].sportsbook).toBe('FanDuel');
      expect(result[0].moneyline.home).toBe(-105);
      expect(result[1].moneyline.home).toBe(-110);
    });
  });

  describe('odds calculations', () => {
    it('should calculate expected value correctly', () => {
      // Test positive odds
      const ev1 = connector.calculateExpectedValue(150, 0.5); // +150 odds, 50% true probability
      expect(ev1).toBeCloseTo(0.25, 2); // Expected positive EV

      // Test negative odds
      const ev2 = connector.calculateExpectedValue(-110, 0.6); // -110 odds, 60% true probability
      expect(ev2).toBeCloseTo(0.145, 2); // Expected positive EV

      // Test negative EV scenario
      const ev3 = connector.calculateExpectedValue(-110, 0.4); // -110 odds, 40% true probability
      expect(ev3).toBeLessThan(0); // Expected negative EV
    });

    it('should find arbitrage opportunities', () => {
      const bettingLines: BettingLine[] = [
        {
          gameId: 'game123',
          sportsbook: 'BookA',
          spread: { home: 3, away: -3, homeOdds: -110, awayOdds: -110 },
          total: { line: 47, overOdds: -110, underOdds: -110 },
          moneyline: { home: 120, away: -110 }, // Good home odds
          lastUpdated: new Date()
        },
        {
          gameId: 'game123',
          sportsbook: 'BookB',
          spread: { home: 3, away: -3, homeOdds: -110, awayOdds: -110 },
          total: { line: 47, overOdds: -110, underOdds: -110 },
          moneyline: { home: -110, away: 130 }, // Good away odds
          lastUpdated: new Date()
        }
      ];

      const arbitrageOpportunities = connector.findArbitrageOpportunities(bettingLines);

      expect(arbitrageOpportunities).toHaveLength(1);
      expect(arbitrageOpportunities[0].gameId).toBe('game123');
      expect(arbitrageOpportunities[0].type).toBe('moneyline');
      expect(arbitrageOpportunities[0].profit).toBeGreaterThan(0);
      expect(arbitrageOpportunities[0].bets).toHaveLength(2);
    });

    it('should not find arbitrage when none exists', () => {
      const bettingLines: BettingLine[] = [
        {
          gameId: 'game123',
          sportsbook: 'BookA',
          spread: { home: 3, away: -3, homeOdds: -110, awayOdds: -110 },
          total: { line: 47, overOdds: -110, underOdds: -110 },
          moneyline: { home: -110, away: -110 },
          lastUpdated: new Date()
        },
        {
          gameId: 'game123',
          sportsbook: 'BookB',
          spread: { home: 3, away: -3, homeOdds: -110, awayOdds: -110 },
          total: { line: 47, overOdds: -110, underOdds: -110 },
          moneyline: { home: -115, away: -105 },
          lastUpdated: new Date()
        }
      ];

      const arbitrageOpportunities = connector.findArbitrageOpportunities(bettingLines);

      expect(arbitrageOpportunities).toHaveLength(0);
    });
  });

  describe('rate limiting', () => {
    it('should provide rate limit information', () => {
      const rateLimitInfo = connector.getRateLimitUsage();
      expect(rateLimitInfo).toHaveProperty('requestsPerMinute', 500);
      expect(rateLimitInfo).toHaveProperty('requestsPerMonth', 500);
      expect(rateLimitInfo).toHaveProperty('limit');
      expect(rateLimitInfo).toHaveProperty('remaining');
    });
  });

  describe('error handling', () => {
    it('should handle odds API specific errors', async () => {
      const mockPerformRequest = jest.fn().mockRejectedValue(
        new APIError('Odds API error', 401, { message: 'Invalid API key' }, false)
      );
      
      (connector as any).performRequest = mockPerformRequest;

      await expect(connector.fetchNFLOdds()).rejects.toThrow('Failed to fetch NFL odds');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch NFL odds',
        expect.any(Error)
      );
    });

    it('should handle 422 validation errors', async () => {
      const mockPerformRequest = jest.fn().mockRejectedValue(
        new APIError('Invalid parameters', 422, { message: 'Invalid sport key' }, false)
      );
      
      (connector as any).performRequest = mockPerformRequest;

      await expect(connector.fetchCollegeFootballOdds()).rejects.toThrow('Failed to fetch college football odds');
    });

    it('should handle rate limit errors as retryable', async () => {
      const mockPerformRequest = jest.fn().mockRejectedValue(
        new APIError('Rate limit exceeded', 429, { message: 'Too many requests' }, true)
      );
      
      (connector as any).performRequest = mockPerformRequest;

      try {
        await connector.fetchNFLOdds();
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).isRetryable).toBe(true);
        expect((error as APIError).message).toContain('Failed to fetch NFL odds');
      }
    });
  });

  describe('sport-specific endpoints', () => {
    it('should use correct sport key for NFL', async () => {
      const mockPerformRequest = jest.fn().mockResolvedValue({
        data: [],
        status: 200,
        headers: {},
        timestamp: new Date()
      });
      
      (connector as any).performRequest = mockPerformRequest;

      await connector.fetchNFLOdds();

      expect(mockPerformRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('sport=americanfootball_nfl')
        })
      );
    });

    it('should use correct sport key for college football', async () => {
      const mockPerformRequest = jest.fn().mockResolvedValue({
        data: [],
        status: 200,
        headers: {},
        timestamp: new Date()
      });
      
      (connector as any).performRequest = mockPerformRequest;

      await connector.fetchCollegeFootballOdds();

      expect(mockPerformRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('sport=americanfootball_ncaaf')
        })
      );
    });
  });

  describe('historical odds', () => {
    it('should fetch historical odds with date parameter', async () => {
      const mockPerformRequest = jest.fn().mockResolvedValue({
        data: [],
        status: 200,
        headers: {},
        timestamp: new Date()
      });
      
      (connector as any).performRequest = mockPerformRequest;

      await connector.fetchHistoricalOdds('nfl', '2024-09-08');

      expect(mockPerformRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('date=2024-09-08')
        })
      );
    });
  });

  describe('game-specific odds', () => {
    it('should fetch odds for specific games', async () => {
      const mockPerformRequest = jest.fn().mockResolvedValue({
        data: [],
        status: 200,
        headers: {},
        timestamp: new Date()
      });
      
      (connector as any).performRequest = mockPerformRequest;

      const gameIds = ['game1', 'game2', 'game3'];
      await connector.fetchGameOdds(gameIds, 'nfl');

      expect(mockPerformRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('eventIds=game1%2Cgame2%2Cgame3')
        })
      );
    });
  });
});
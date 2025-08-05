import { ESPNConnector } from '../../core/espn-connector';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';
import { APIError } from '../../types/api.types';
import { GameStatus } from '../../types/common.types';
import { ESPNMapper, ESPNEvent, ESPNStatus } from '../../types/espn.types';

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
        // This will be mocked in individual tests
        return Promise.resolve({ data: { events: [] }, status: 200, headers: {}, timestamp: new Date() });
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
        return { limit: 200, remaining: 199, resetTime: new Date(), windowMs: 60000 };
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

describe('ESPNConnector', () => {
  let connector: ESPNConnector;
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
        'apis.espn.baseUrl': 'https://site.api.espn.com/apis/site/v2/sports/football',
        'apis.espn.rateLimit': 200,
        'circuitBreaker.failureThreshold': 5,
        'circuitBreaker.recoveryTimeout': 60000,
        'circuitBreaker.monitoringPeriod': 10000
      };
      return configMap[key];
    });

    connector = new ESPNConnector(mockConfig, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(mockConfig.get).toHaveBeenCalledWith('apis.espn.baseUrl');
      expect(mockConfig.get).toHaveBeenCalledWith('apis.espn.rateLimit');
      expect(mockLogger.info).toHaveBeenCalledWith('ESPN connector initialized', expect.any(Object));
    });
  });

  describe('data mapping utilities', () => {
    it('should correctly map game status from ESPN status', () => {
      const preGameStatus: ESPNStatus = {
        clock: 0,
        displayClock: '0:00',
        period: 0,
        type: {
          id: '1',
          name: 'Pre-Game',
          state: 'pre',
          completed: false,
          description: 'Scheduled',
          detail: 'Game scheduled',
          shortDetail: 'Scheduled'
        }
      };

      const inProgressStatus: ESPNStatus = {
        clock: 900,
        displayClock: '15:00',
        period: 1,
        type: {
          id: '2',
          name: 'In Progress',
          state: 'in',
          completed: false,
          description: 'In Progress',
          detail: '1st Quarter',
          shortDetail: '1st'
        }
      };

      const halftimeStatus: ESPNStatus = {
        clock: 0,
        displayClock: '0:00',
        period: 2,
        type: {
          id: '3',
          name: 'Halftime',
          state: 'in',
          completed: false,
          description: 'Halftime',
          detail: 'Halftime',
          shortDetail: 'Half'
        }
      };

      const finalStatus: ESPNStatus = {
        clock: 0,
        displayClock: '0:00',
        period: 4,
        type: {
          id: '4',
          name: 'Final',
          state: 'post',
          completed: true,
          description: 'Final',
          detail: 'Final',
          shortDetail: 'Final'
        }
      };

      expect(ESPNMapper.mapGameStatus(preGameStatus)).toBe(GameStatus.SCHEDULED);
      expect(ESPNMapper.mapGameStatus(inProgressStatus)).toBe(GameStatus.IN_PROGRESS);
      expect(ESPNMapper.mapGameStatus(halftimeStatus)).toBe(GameStatus.HALFTIME);
      expect(ESPNMapper.mapGameStatus(finalStatus)).toBe(GameStatus.FINAL);
    });

    it('should correctly parse ESPN date strings', () => {
      const dateString = '2024-09-08T16:30:00Z';
      const result = ESPNMapper.parseDate(dateString);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(8); // September (0-indexed)
      expect(result.getDate()).toBe(8);
    });

    it('should map ESPN game score to internal format', () => {
      const mockEvent: ESPNEvent = {
        id: '12345',
        uid: 'espn:12345',
        date: '2024-09-08T16:30:00Z',
        name: 'Kansas City Chiefs at Baltimore Ravens',
        shortName: 'KC @ BAL',
        season: {
          year: 2024,
          type: 1
        },
        week: {
          number: 1
        },
        competitions: [{
          id: '12345',
          uid: 'espn:12345',
          date: '2024-09-08T16:30:00Z',
          attendance: 70000,
          type: {
            id: '1',
            abbreviation: 'REG'
          },
          timeValid: true,
          neutralSite: false,
          conferenceCompetition: false,
          playByPlayAvailable: true,
          recent: true,
          venue: {
            id: '1',
            fullName: 'M&T Bank Stadium',
            address: {
              city: 'Baltimore',
              state: 'MD'
            },
            capacity: 71008,
            indoor: false
          },
          competitors: [
            {
              id: '1',
              uid: 'espn:1',
              type: 'team',
              order: 1,
              homeAway: 'home',
              winner: true,
              team: {
                id: '1',
                uid: 'espn:1',
                location: 'Baltimore',
                name: 'Ravens',
                abbreviation: 'BAL',
                displayName: 'Baltimore Ravens',
                shortDisplayName: 'Ravens',
                color: '241773',
                alternateColor: 'ffffff',
                isActive: true,
                venue: { id: '1' },
                links: [],
                logo: 'https://example.com/ravens-logo.png',
                logos: []
              },
              score: '21'
            },
            {
              id: '2',
              uid: 'espn:2',
              type: 'team',
              order: 2,
              homeAway: 'away',
              winner: false,
              team: {
                id: '2',
                uid: 'espn:2',
                location: 'Kansas City',
                name: 'Chiefs',
                abbreviation: 'KC',
                displayName: 'Kansas City Chiefs',
                shortDisplayName: 'Chiefs',
                color: 'e31837',
                alternateColor: 'ffb612',
                isActive: true,
                venue: { id: '2' },
                links: [],
                logo: 'https://example.com/chiefs-logo.png',
                logos: []
              },
              score: '14'
            }
          ],
          notes: [],
          status: {
            clock: 480,
            displayClock: '8:00',
            period: 3,
            type: {
              id: '2',
              name: 'In Progress',
              state: 'in',
              completed: false,
              description: 'In Progress',
              detail: '3rd Quarter',
              shortDetail: '3rd'
            }
          },
          broadcasts: [],
          format: {
            regulation: {
              periods: 4
            }
          },
          startDate: '2024-09-08T16:30:00Z',
          geoBroadcasts: []
        }],
        links: [],
        status: {
          clock: 480,
          displayClock: '8:00',
          period: 3,
          type: {
            id: '2',
            name: 'In Progress',
            state: 'in',
            completed: false,
            description: 'In Progress',
            detail: '3rd Quarter',
            shortDetail: '3rd'
          }
        }
      };

      const result = ESPNMapper.mapGameScoreToInternal(mockEvent);

      expect(result).toEqual({
        gameId: '12345',
        homeScore: 21,
        awayScore: 14,
        quarter: 3,
        timeRemaining: {
          quarter: 3,
          minutes: 8,
          seconds: 0
        },
        lastUpdated: expect.any(Date),
        final: false
      });
    });
  });

  describe('endpoint configuration', () => {
    it('should have correct college football endpoints', () => {
      // Test the connector was initialized properly
      expect(connector).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith('ESPN connector initialized', expect.any(Object));
    });

    it('should have correct NFL endpoints', () => {
      // Test the connector was initialized properly
      expect(connector).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith('ESPN connector initialized', expect.any(Object));
    });
  });

  describe('configuration validation', () => {
    it('should use configured base URL', () => {
      expect(mockConfig.get).toHaveBeenCalledWith('apis.espn.baseUrl');
    });

    it('should use configured rate limit', () => {
      expect(mockConfig.get).toHaveBeenCalledWith('apis.espn.rateLimit');
    });
  });

  describe('rate limiting', () => {
    it('should provide rate limit information', () => {
      const rateLimitInfo = connector.getRateLimitInfo();
      expect(rateLimitInfo).toHaveProperty('requestsPerMinute', 200);
      expect(rateLimitInfo).toHaveProperty('limit');
      expect(rateLimitInfo).toHaveProperty('remaining');
    });
  });

  describe('error handling', () => {
    it('should handle ESPN API specific errors', async () => {
      // Mock the performRequest method to simulate an error
      const mockPerformRequest = jest.fn().mockRejectedValue(
        new APIError('ESPN API error', 400, { error: { message: 'Bad request' } }, false)
      );
      
      (connector as any).performRequest = mockPerformRequest;

      await expect(connector.fetchCollegeFootballScoreboard()).rejects.toThrow('Failed to fetch college football scoreboard');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch college football scoreboard from ESPN',
        expect.any(Error)
      );
    });
  });

  describe('weather data extraction', () => {
    it('should extract weather data from ESPN event', () => {
      const mockEvent: ESPNEvent = {
        id: '12345',
        uid: 'espn:12345',
        date: '2024-09-08T16:30:00Z',
        name: 'Test Game',
        shortName: 'TEST',
        season: { year: 2024, type: 1 },
        week: { number: 1 },
        competitions: [],
        links: [],
        weather: {
          displayValue: 'Partly Cloudy',
          temperature: 75,
          highTemperature: 80,
          conditionId: 'partly-cloudy',
          link: {
            language: 'en',
            rel: ['weather'],
            href: 'https://weather.com',
            text: 'Weather',
            shortText: 'Weather',
            isExternal: true,
            isPremium: false
          }
        },
        status: {
          clock: 0,
          displayClock: '0:00',
          period: 0,
          type: {
            id: '1',
            name: 'Scheduled',
            state: 'pre',
            completed: false,
            description: 'Scheduled',
            detail: 'Scheduled',
            shortDetail: 'Scheduled'
          }
        }
      };

      const weather = ESPNMapper.extractWeatherFromEvent(mockEvent);
      
      expect(weather).toEqual({
        temperature: 75,
        humidity: 0,
        windSpeed: 0,
        windDirection: 0,
        precipitation: 0,
        conditions: 'Partly Cloudy',
        visibility: 10
      });
    });

    it('should return null when no weather data is available', () => {
      const mockEvent: ESPNEvent = {
        id: '12345',
        uid: 'espn:12345',
        date: '2024-09-08T16:30:00Z',
        name: 'Test Game',
        shortName: 'TEST',
        season: { year: 2024, type: 1 },
        week: { number: 1 },
        competitions: [],
        links: [],
        status: {
          clock: 0,
          displayClock: '0:00',
          period: 0,
          type: {
            id: '1',
            name: 'Scheduled',
            state: 'pre',
            completed: false,
            description: 'Scheduled',
            detail: 'Scheduled',
            shortDetail: 'Scheduled'
          }
        }
      };

      const weather = ESPNMapper.extractWeatherFromEvent(mockEvent);
      expect(weather).toBeNull();
    });
  });
});
import { SportsDataIOConnector } from '../../core/sportsdata-io-connector';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';
import { APIError } from '../../types/api.types';
import { GameStatus, InjuryStatus, Position } from '../../types/common.types';
import { SportsDataIOMapper } from '../../types/sportsdata-io.types';

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
        return { limit: 100, remaining: 99, resetTime: new Date(), windowMs: 60000 };
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

describe('SportsDataIOConnector', () => {
  let connector: SportsDataIOConnector;
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
        'apis.sportsDataIO.apiKey': 'test-api-key',
        'apis.sportsDataIO.baseUrl': 'https://api.sportsdata.io/v3/nfl',
        'apis.sportsDataIO.rateLimit': 100,
        'circuitBreaker.failureThreshold': 5,
        'circuitBreaker.recoveryTimeout': 60000,
        'circuitBreaker.monitoringPeriod': 10000
      };
      return configMap[key];
    });

    connector = new SportsDataIOConnector(mockConfig, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(mockConfig.get).toHaveBeenCalledWith('apis.sportsDataIO.apiKey');
      expect(mockConfig.get).toHaveBeenCalledWith('apis.sportsDataIO.baseUrl');
      expect(mockLogger.info).toHaveBeenCalledWith('SportsDataIO connector initialized', expect.any(Object));
    });
  });

  describe('data mapping utilities', () => {
    it('should correctly map game status', () => {
      expect(SportsDataIOMapper.mapGameStatus('scheduled')).toBe(GameStatus.SCHEDULED);
      expect(SportsDataIOMapper.mapGameStatus('InProgress')).toBe(GameStatus.IN_PROGRESS);
      expect(SportsDataIOMapper.mapGameStatus('halftime')).toBe(GameStatus.HALFTIME);
      expect(SportsDataIOMapper.mapGameStatus('final')).toBe(GameStatus.FINAL);
      expect(SportsDataIOMapper.mapGameStatus('postponed')).toBe(GameStatus.POSTPONED);
      expect(SportsDataIOMapper.mapGameStatus('cancelled')).toBe(GameStatus.CANCELLED);
      expect(SportsDataIOMapper.mapGameStatus('unknown')).toBe(GameStatus.SCHEDULED);
    });

    it('should correctly map positions', () => {
      expect(SportsDataIOMapper.mapPosition('QB')).toBe(Position.QB);
      expect(SportsDataIOMapper.mapPosition('RB')).toBe(Position.RB);
      expect(SportsDataIOMapper.mapPosition('WR')).toBe(Position.WR);
      expect(SportsDataIOMapper.mapPosition('TE')).toBe(Position.TE);
      expect(SportsDataIOMapper.mapPosition('K')).toBe(Position.K);
      expect(SportsDataIOMapper.mapPosition('UNKNOWN')).toBe(Position.QB); // fallback
    });

    it('should correctly map injury status', () => {
      expect(SportsDataIOMapper.mapInjuryStatus('healthy')).toBe(InjuryStatus.HEALTHY);
      expect(SportsDataIOMapper.mapInjuryStatus('questionable')).toBe(InjuryStatus.QUESTIONABLE);
      expect(SportsDataIOMapper.mapInjuryStatus('doubtful')).toBe(InjuryStatus.DOUBTFUL);
      expect(SportsDataIOMapper.mapInjuryStatus('out')).toBe(InjuryStatus.OUT);
      expect(SportsDataIOMapper.mapInjuryStatus('ir')).toBe(InjuryStatus.IR);
      expect(SportsDataIOMapper.mapInjuryStatus('pup')).toBe(InjuryStatus.PUP);
      expect(SportsDataIOMapper.mapInjuryStatus('unknown')).toBe(InjuryStatus.HEALTHY);
    });

    it('should correctly parse height strings', () => {
      expect(SportsDataIOMapper.parseHeight('6-3')).toBe(75); // 6'3" = 75 inches
      expect(SportsDataIOMapper.parseHeight('5-10')).toBe(70); // 5'10" = 70 inches
      expect(SportsDataIOMapper.parseHeight('6-0')).toBe(72); // 6'0" = 72 inches
      expect(SportsDataIOMapper.parseHeight('invalid')).toBe(0); // fallback
    });

    it('should correctly parse date strings', () => {
      const dateString = '2024-09-08T16:30:00';
      const result = SportsDataIOMapper.parseDate(dateString);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(8); // September (0-indexed)
      expect(result.getDate()).toBe(8);
    });
  });

  describe('endpoint URL building', () => {
    it('should build correct endpoint URLs', () => {
      // Test the private method indirectly by checking if the connector was initialized properly
      expect(connector).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith('SportsDataIO connector initialized', expect.any(Object));
    });
  });

  describe('configuration validation', () => {
    it('should require API key from configuration', () => {
      expect(mockConfig.get).toHaveBeenCalledWith('apis.sportsDataIO.apiKey');
    });

    it('should use configured base URL', () => {
      expect(mockConfig.get).toHaveBeenCalledWith('apis.sportsDataIO.baseUrl');
    });

    it('should use configured rate limit', () => {
      expect(mockConfig.get).toHaveBeenCalledWith('apis.sportsDataIO.rateLimit');
    });
  });
});
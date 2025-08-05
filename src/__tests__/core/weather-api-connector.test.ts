import { WeatherAPIConnector } from '../../core/weather-api-connector';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';
import { APIError } from '../../types/api.types';
import { WeatherMapper, WeatherImpact } from '../../types/weather.types';
import { Venue } from '../../types/common.types';

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
        return Promise.resolve({ data: {}, status: 200, headers: {}, timestamp: new Date() });
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
        return { limit: 1000, remaining: 999, resetTime: new Date(), windowMs: 60000 };
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

describe('WeatherAPIConnector', () => {
  let connector: WeatherAPIConnector;
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
        'apis.weather.apiKey': 'test-weather-api-key',
        'apis.weather.baseUrl': 'https://api.openweathermap.org/data/2.5',
        'apis.weather.rateLimit': 1000,
        'circuitBreaker.failureThreshold': 5,
        'circuitBreaker.recoveryTimeout': 60000,
        'circuitBreaker.monitoringPeriod': 10000
      };
      return configMap[key];
    });

    connector = new WeatherAPIConnector(mockConfig, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(mockConfig.get).toHaveBeenCalledWith('apis.weather.apiKey');
      expect(mockConfig.get).toHaveBeenCalledWith('apis.weather.baseUrl');
      expect(mockConfig.get).toHaveBeenCalledWith('apis.weather.rateLimit');
      expect(mockLogger.info).toHaveBeenCalledWith('Weather API connector initialized', expect.any(Object));
    });
  });

  describe('indoor venue handling', () => {
    it('should return controlled conditions for indoor venues', async () => {
      const indoorVenue: Venue = {
        id: '1',
        name: 'Mercedes-Benz Superdome',
        city: 'New Orleans',
        state: 'LA',
        capacity: 73000,
        surface: 'turf',
        indoor: true,
        timezone: 'America/Chicago'
      };

      const weather = await connector.fetchVenueWeather(indoorVenue);

      expect(weather).toEqual({
        temperature: 72,
        humidity: 45,
        windSpeed: 0,
        windDirection: 0,
        precipitation: 0,
        conditions: 'Clear (Indoor)',
        visibility: 10
      });
    });
  });

  describe('weather impact assessment', () => {
    it('should assess low impact for good weather conditions', () => {
      const goodWeather = {
        temperature: 75,
        humidity: 50,
        windSpeed: 5,
        windDirection: 180,
        precipitation: 0,
        conditions: 'Clear',
        visibility: 10
      };

      const impact = WeatherMapper.assessWeatherImpact(goodWeather, false);

      expect(impact.overall).toBe('low');
      expect(impact.passing.impact).toBe('low');
      expect(impact.rushing.impact).toBe('low');
      expect(impact.kicking.impact).toBe('low');
      expect(impact.playerSafety.concern).toBe('none');
    });

    it('should assess high impact for extreme cold', () => {
      const coldWeather = {
        temperature: 15,
        humidity: 60,
        windSpeed: 10,
        windDirection: 180,
        precipitation: 0,
        conditions: 'Clear',
        visibility: 10
      };

      const impact = WeatherMapper.assessWeatherImpact(coldWeather, false);

      expect(impact.overall).toBe('high');
      expect(impact.passing.impact).toBe('high');
      expect(impact.kicking.impact).toBe('moderate');
      expect(impact.playerSafety.concern).toBe('moderate');
      expect(impact.passing.factors).toContain('Extremely cold temperature affects ball handling');
    });

    it('should assess severe impact for high winds', () => {
      const windyWeather = {
        temperature: 70,
        humidity: 50,
        windSpeed: 30,
        windDirection: 180,
        precipitation: 0,
        conditions: 'Windy',
        visibility: 10
      };

      const impact = WeatherMapper.assessWeatherImpact(windyWeather, false);

      expect(impact.overall).toBe('severe');
      expect(impact.passing.impact).toBe('severe');
      expect(impact.kicking.impact).toBe('severe');
      expect(impact.passing.factors).toContain('Strong winds significantly affect passing accuracy');
      expect(impact.kicking.factors).toContain('High winds severely impact field goals and punts');
    });

    it('should assess high impact for heavy precipitation', () => {
      const rainyWeather = {
        temperature: 65,
        humidity: 90,
        windSpeed: 8,
        windDirection: 180,
        precipitation: 0.8,
        conditions: 'Heavy Rain',
        visibility: 2
      };

      const impact = WeatherMapper.assessWeatherImpact(rainyWeather, false);

      expect(impact.overall).toBe('high');
      expect(impact.passing.impact).toBe('high');
      expect(impact.rushing.impact).toBe('moderate');
      expect(impact.visibility.impact).toBe('high');
      expect(impact.playerSafety.concern).toBe('moderate');
    });

    it('should return low impact for indoor venues regardless of weather', () => {
      const terribleWeather = {
        temperature: 10,
        humidity: 90,
        windSpeed: 40,
        windDirection: 180,
        precipitation: 2,
        conditions: 'Blizzard',
        visibility: 0.1
      };

      const impact = WeatherMapper.assessWeatherImpact(terribleWeather, true);

      expect(impact.overall).toBe('low');
      expect(impact.passing.impact).toBe('low');
      expect(impact.rushing.impact).toBe('low');
      expect(impact.kicking.impact).toBe('low');
      expect(impact.playerSafety.concern).toBe('none');
      expect(impact.passing.factors).toContain('Indoor venue');
    });
  });

  describe('weather data conversion', () => {
    it('should convert OpenWeatherMap response correctly', () => {
      const mockResponse = {
        coord: { lon: -90.08, lat: 29.95 },
        weather: [{
          id: 800,
          main: 'Clear',
          description: 'clear sky',
          icon: '01d'
        }],
        base: 'stations',
        main: {
          temp: 75.2,
          feels_like: 78.1,
          temp_min: 72.0,
          temp_max: 78.0,
          pressure: 1013,
          humidity: 65
        },
        visibility: 16093,
        wind: {
          speed: 3.36,
          deg: 180
        },
        clouds: { all: 0 },
        dt: 1609459200,
        sys: {
          country: 'US',
          sunrise: 1609423200,
          sunset: 1609459200
        },
        timezone: -21600,
        id: 4335045,
        name: 'New Orleans',
        cod: 200
      };

      const weather = WeatherMapper.mapToWeatherCondition(mockResponse);

      expect(weather).toEqual({
        temperature: 75,
        humidity: 65,
        windSpeed: 8, // 3.36 m/s * 2.237 ≈ 8 mph
        windDirection: 180,
        precipitation: 0,
        conditions: 'clear sky',
        visibility: 10 // 16093 meters / 1609.34 ≈ 10 miles
      });
    });

    it('should handle precipitation data correctly', () => {
      const mockResponseWithRain = {
        coord: { lon: -90.08, lat: 29.95 },
        weather: [{
          id: 500,
          main: 'Rain',
          description: 'light rain',
          icon: '10d'
        }],
        base: 'stations',
        main: {
          temp: 68.0,
          feels_like: 70.0,
          temp_min: 65.0,
          temp_max: 72.0,
          pressure: 1010,
          humidity: 85
        },
        visibility: 8047,
        wind: {
          speed: 4.47,
          deg: 225
        },
        rain: {
          '1h': 2.5
        },
        clouds: { all: 75 },
        dt: 1609459200,
        sys: {
          country: 'US',
          sunrise: 1609423200,
          sunset: 1609459200
        },
        timezone: -21600,
        id: 4335045,
        name: 'New Orleans',
        cod: 200
      };

      const weather = WeatherMapper.mapToWeatherCondition(mockResponseWithRain);

      expect(weather.precipitation).toBe(2.5);
      expect(weather.conditions).toBe('light rain');
      expect(weather.visibility).toBe(5); // 8047 meters / 1609.34 ≈ 5 miles
    });
  });

  describe('game delay assessment', () => {
    it('should recommend delay for lightning conditions', () => {
      const weather = {
        temperature: 75,
        humidity: 80,
        windSpeed: 15,
        windDirection: 180,
        precipitation: 0.3,
        conditions: 'Thunderstorm',
        visibility: 8
      };

      const alerts = [{
        id: '1',
        type: 'warning' as const,
        severity: 'extreme' as const,
        title: 'Thunderstorm Warning',
        description: 'Severe thunderstorm with lightning',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        areas: ['Orleans Parish'],
        impact: {} as WeatherImpact
      }];

      const result = WeatherMapper.shouldDelayGame(weather, alerts);

      expect(result.shouldDelay).toBe(true);
      expect(result.severity).toBe('extreme');
      expect(result.reason).toContain('Lightning/thunderstorm warning');
    });

    it('should recommend delay for extreme cold', () => {
      const weather = {
        temperature: -5,
        humidity: 60,
        windSpeed: 10,
        windDirection: 180,
        precipitation: 0,
        conditions: 'Clear',
        visibility: 10
      };

      const result = WeatherMapper.shouldDelayGame(weather, []);

      expect(result.shouldDelay).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.reason).toContain('Extreme cold temperature');
    });

    it('should not recommend delay for acceptable conditions', () => {
      const weather = {
        temperature: 45,
        humidity: 60,
        windSpeed: 12,
        windDirection: 180,
        precipitation: 0.1,
        conditions: 'Light Rain',
        visibility: 8
      };

      const result = WeatherMapper.shouldDelayGame(weather, []);

      expect(result.shouldDelay).toBe(false);
      expect(result.severity).toBe('low');
      expect(result.reason).toContain('acceptable limits');
    });
  });

  describe('unit conversions', () => {
    it('should convert Kelvin to Fahrenheit correctly', () => {
      expect(WeatherMapper.kelvinToFahrenheit(273.15)).toBe(32); // Freezing point
      expect(WeatherMapper.kelvinToFahrenheit(373.15)).toBe(212); // Boiling point
      expect(WeatherMapper.kelvinToFahrenheit(298.15)).toBe(77); // Room temperature
    });

    it('should convert meters per second to miles per hour correctly', () => {
      expect(WeatherMapper.mpsToMph(10)).toBe(22); // 10 m/s ≈ 22 mph
      expect(WeatherMapper.mpsToMph(0)).toBe(0);
      expect(WeatherMapper.mpsToMph(5)).toBe(11); // 5 m/s ≈ 11 mph
    });

    it('should convert meters to miles correctly', () => {
      expect(WeatherMapper.metersToMiles(1609)).toBe(1); // Approximately 1 mile
      expect(WeatherMapper.metersToMiles(16093)).toBe(10); // Approximately 10 miles
      expect(WeatherMapper.metersToMiles(0)).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle weather API specific errors', async () => {
      const mockPerformRequest = jest.fn().mockRejectedValue(
        new APIError('Weather API error', 401, { cod: 401, message: 'Invalid API key' }, false)
      );
      
      (connector as any).performRequest = mockPerformRequest;

      const venue: Venue = {
        id: '1',
        name: 'Test Stadium',
        city: 'Test City',
        state: 'TS',
        capacity: 50000,
        surface: 'grass',
        indoor: false,
        timezone: 'America/New_York'
      };

      await expect(connector.fetchVenueWeather(venue)).rejects.toThrow('Failed to fetch venue weather');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch venue weather',
        expect.any(Error),
        expect.objectContaining({
          venueId: '1',
          venueName: 'Test Stadium'
        })
      );
    });
  });
});
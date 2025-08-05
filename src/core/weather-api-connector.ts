import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { Config } from './config';
import { Logger } from './logger';
import { HttpAPIConnector } from './http-api-connector';
import { APIRequest, APIResponse, APIError } from '../types/api.types';
import {
  WeatherAPIConfig,
  OpenWeatherMapResponse,
  OpenWeatherMapForecastResponse,
  VenueWeatherRequest,
  WeatherImpact,
  WeatherAlert,
  HistoricalWeatherData,
  WeatherMapper
} from '../types/weather.types';
import { WeatherCondition, Venue } from '../types/common.types';

/**
 * Weather API connector for venue weather data
 */
@injectable()
export class WeatherAPIConnector extends HttpAPIConnector {
  private readonly weatherConfig: WeatherAPIConfig;

  constructor(
    @inject(TYPES.Config) config: Config,
    @inject(TYPES.Logger) logger: Logger
  ) {
    const apiKey = config.get<string>('apis.weather.apiKey');
    const baseUrl = config.get<string>('apis.weather.baseUrl');
    
    const defaultHeaders = {
      'Accept': 'application/json',
      'User-Agent': 'Football-Analytics-System/1.0'
    };

    super(config, logger, 'WeatherAPI', baseUrl, defaultHeaders);

    this.weatherConfig = {
      apiKey,
      baseUrl,
      endpoints: {
        current: '/weather',
        forecast: '/forecast',
        historical: '/onecall/timemachine'
      },
      rateLimit: {
        requestsPerMinute: config.get<number>('apis.weather.rateLimit'),
        requestsPerDay: 1000 // OpenWeatherMap free tier limit
      }
    };

    this.logger.info('Weather API connector initialized', {
      baseUrl: this.baseUrl,
      rateLimit: this.weatherConfig.rateLimit
    });
  }

  /**
   * Fetch current weather for a venue
   */
  async fetchVenueWeather(venue: Venue): Promise<WeatherCondition> {
    try {
      // Skip weather fetch for indoor venues
      if (venue.indoor) {
        return this.getIndoorWeatherCondition();
      }

      const params = new URLSearchParams({
        q: `${venue.city},${venue.state}`,
        appid: this.weatherConfig.apiKey,
        units: 'imperial'
      });

      const request: APIRequest = {
        url: `${this.weatherConfig.endpoints.current}?${params.toString()}`,
        method: 'GET'
      };

      const response = await this.executeRequest<OpenWeatherMapResponse>(request);
      return WeatherMapper.mapToWeatherCondition(response.data);
    } catch (error) {
      this.logger.error('Failed to fetch venue weather', error instanceof Error ? error : new Error(String(error)), {
        venueId: venue.id,
        venueName: venue.name
      });
      throw new APIError(
        'Failed to fetch venue weather',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch weather by coordinates
   */
  async fetchWeatherByCoordinates(latitude: number, longitude: number, indoor: boolean = false): Promise<WeatherCondition> {
    try {
      if (indoor) {
        return this.getIndoorWeatherCondition();
      }

      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        appid: this.weatherConfig.apiKey,
        units: 'imperial'
      });

      const request: APIRequest = {
        url: `${this.weatherConfig.endpoints.current}?${params.toString()}`,
        method: 'GET'
      };

      const response = await this.executeRequest<OpenWeatherMapResponse>(request);
      return WeatherMapper.mapToWeatherCondition(response.data);
    } catch (error) {
      this.logger.error('Failed to fetch weather by coordinates', error instanceof Error ? error : new Error(String(error)), {
        latitude,
        longitude
      });
      throw new APIError(
        'Failed to fetch weather by coordinates',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch weather forecast for a venue
   */
  async fetchVenueWeatherForecast(venue: Venue, days: number = 5): Promise<WeatherCondition[]> {
    try {
      if (venue.indoor) {
        return Array(days).fill(this.getIndoorWeatherCondition());
      }

      const params = new URLSearchParams({
        q: `${venue.city},${venue.state}`,
        appid: this.weatherConfig.apiKey,
        units: 'imperial',
        cnt: (days * 8).toString() // 8 forecasts per day (3-hour intervals)
      });

      const request: APIRequest = {
        url: `${this.weatherConfig.endpoints.forecast}?${params.toString()}`,
        method: 'GET'
      };

      const response = await this.executeRequest<OpenWeatherMapForecastResponse>(request);
      
      // Group forecasts by day and take the forecast closest to game time (typically afternoon/evening)
      const dailyForecasts: WeatherCondition[] = [];
      const forecastsByDay = this.groupForecastsByDay(response.data.list);
      
      Object.values(forecastsByDay).slice(0, days).forEach(dayForecasts => {
        // Take the forecast closest to typical game time (around 1 PM or 4 PM)
        const gameTimeForecasts = dayForecasts.filter(forecast => {
          const hour = new Date(forecast.dt * 1000).getHours();
          return hour >= 13 && hour <= 20; // 1 PM to 8 PM
        });
        
        const selectedForecast = gameTimeForecasts.length > 0 ? gameTimeForecasts[0] : dayForecasts[0];
        
        dailyForecasts.push({
          temperature: Math.round(selectedForecast.main.temp),
          humidity: selectedForecast.main.humidity,
          windSpeed: Math.round(selectedForecast.wind.speed),
          windDirection: selectedForecast.wind.deg,
          precipitation: (selectedForecast.rain?.['3h'] || 0) + (selectedForecast.snow?.['3h'] || 0),
          conditions: selectedForecast.weather[0].description,
          visibility: Math.round(selectedForecast.visibility / 1609.34) // Convert meters to miles
        });
      });

      return dailyForecasts;
    } catch (error) {
      this.logger.error('Failed to fetch venue weather forecast', error instanceof Error ? error : new Error(String(error)), {
        venueId: venue.id,
        venueName: venue.name
      });
      throw new APIError(
        'Failed to fetch venue weather forecast',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch weather for game time
   */
  async fetchGameTimeWeather(venueRequest: VenueWeatherRequest): Promise<{
    current: WeatherCondition;
    forecast: WeatherCondition;
    impact: WeatherImpact;
    alerts: WeatherAlert[];
  }> {
    try {
      if (venueRequest.indoor) {
        const indoorWeather = this.getIndoorWeatherCondition();
        return {
          current: indoorWeather,
          forecast: indoorWeather,
          impact: WeatherMapper.assessWeatherImpact(indoorWeather, true),
          alerts: []
        };
      }

      // Fetch current weather
      const currentWeather = venueRequest.latitude && venueRequest.longitude
        ? await this.fetchWeatherByCoordinates(venueRequest.latitude, venueRequest.longitude)
        : await this.fetchVenueWeatherByName(venueRequest.city, venueRequest.state);

      // Fetch forecast for game time
      const forecastWeather = await this.fetchWeatherForecastForTime(
        venueRequest.latitude || 0,
        venueRequest.longitude || 0,
        venueRequest.city,
        venueRequest.state,
        venueRequest.gameTime
      );

      // Assess weather impact
      const impact = WeatherMapper.assessWeatherImpact(forecastWeather, venueRequest.indoor);

      // Fetch weather alerts (simplified - would need additional API calls for real alerts)
      const alerts = await this.fetchWeatherAlerts(venueRequest.city, venueRequest.state);

      return {
        current: currentWeather,
        forecast: forecastWeather,
        impact,
        alerts
      };
    } catch (error) {
      this.logger.error('Failed to fetch game time weather', error instanceof Error ? error : new Error(String(error)), {
        venueId: venueRequest.venueId,
        gameTime: venueRequest.gameTime
      });
      throw new APIError(
        'Failed to fetch game time weather',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Fetch historical weather data for analysis
   */
  async fetchHistoricalWeather(venue: Venue, date: Date): Promise<HistoricalWeatherData> {
    try {
      if (venue.indoor) {
        const indoorWeather = this.getIndoorWeatherCondition();
        return {
          venueId: venue.id,
          date,
          conditions: indoorWeather,
          impact: WeatherMapper.assessWeatherImpact(indoorWeather, true)
        };
      }

      // Note: Historical weather API requires a paid plan for OpenWeatherMap
      // This is a simplified implementation
      const timestamp = Math.floor(date.getTime() / 1000);
      
      const params = new URLSearchParams({
        lat: '0', // Would need venue coordinates
        lon: '0',
        dt: timestamp.toString(),
        appid: this.weatherConfig.apiKey,
        units: 'imperial'
      });

      const request: APIRequest = {
        url: `${this.weatherConfig.endpoints.historical}?${params.toString()}`,
        method: 'GET'
      };

      try {
        const response = await this.executeRequest<any>(request);
        const weatherData = response.data.current || response.data;
        
        const conditions: WeatherCondition = {
          temperature: Math.round(weatherData.temp),
          humidity: weatherData.humidity,
          windSpeed: Math.round(weatherData.wind_speed),
          windDirection: weatherData.wind_deg,
          precipitation: (weatherData.rain?.['1h'] || 0) + (weatherData.snow?.['1h'] || 0),
          conditions: weatherData.weather[0].description,
          visibility: Math.round((weatherData.visibility || 10000) / 1609.34)
        };

        return {
          venueId: venue.id,
          date,
          conditions,
          impact: WeatherMapper.assessWeatherImpact(conditions, venue.indoor)
        };
      } catch (apiError) {
        // Fallback to estimated historical weather if API call fails
        this.logger.warn('Historical weather API unavailable, using estimated data', {
          venueId: venue.id,
          date: date.toISOString()
        });
        
        return this.getEstimatedHistoricalWeather(venue, date);
      }
    } catch (error) {
      this.logger.error('Failed to fetch historical weather', error instanceof Error ? error : new Error(String(error)), {
        venueId: venue.id,
        date: date.toISOString()
      });
      throw new APIError(
        'Failed to fetch historical weather',
        undefined,
        error,
        true
      );
    }
  }

  /**
   * Get indoor weather condition (controlled environment)
   */
  private getIndoorWeatherCondition(): WeatherCondition {
    return {
      temperature: 72, // Typical indoor temperature
      humidity: 45,    // Controlled humidity
      windSpeed: 0,    // No wind indoors
      windDirection: 0,
      precipitation: 0, // No precipitation indoors
      conditions: 'Clear (Indoor)',
      visibility: 10   // Perfect visibility
    };
  }

  /**
   * Fetch weather by city and state name
   */
  private async fetchVenueWeatherByName(city: string, state: string): Promise<WeatherCondition> {
    const params = new URLSearchParams({
      q: `${city},${state}`,
      appid: this.weatherConfig.apiKey,
      units: 'imperial'
    });

    const request: APIRequest = {
      url: `${this.weatherConfig.endpoints.current}?${params.toString()}`,
      method: 'GET'
    };

    const response = await this.executeRequest<OpenWeatherMapResponse>(request);
    return WeatherMapper.mapToWeatherCondition(response.data);
  }

  /**
   * Fetch weather forecast for specific time
   */
  private async fetchWeatherForecastForTime(
    latitude: number,
    longitude: number,
    city: string,
    state: string,
    gameTime: Date
  ): Promise<WeatherCondition> {
    const now = new Date();
    const hoursUntilGame = (gameTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // If game is more than 5 days away, use current weather as estimate
    if (hoursUntilGame > 120) {
      return latitude && longitude
        ? await this.fetchWeatherByCoordinates(latitude, longitude)
        : await this.fetchVenueWeatherByName(city, state);
    }

    // Fetch 5-day forecast
    const params = new URLSearchParams({
      q: `${city},${state}`,
      appid: this.weatherConfig.apiKey,
      units: 'imperial'
    });

    const request: APIRequest = {
      url: `${this.weatherConfig.endpoints.forecast}?${params.toString()}`,
      method: 'GET'
    };

    const response = await this.executeRequest<OpenWeatherMapForecastResponse>(request);
    
    // Find the forecast closest to game time
    const targetTime = gameTime.getTime() / 1000;
    let closestForecast = response.data.list[0];
    let smallestDiff = Math.abs(closestForecast.dt - targetTime);

    for (const forecast of response.data.list) {
      const diff = Math.abs(forecast.dt - targetTime);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestForecast = forecast;
      }
    }

    return {
      temperature: Math.round(closestForecast.main.temp),
      humidity: closestForecast.main.humidity,
      windSpeed: Math.round(closestForecast.wind.speed),
      windDirection: closestForecast.wind.deg,
      precipitation: (closestForecast.rain?.['3h'] || 0) + (closestForecast.snow?.['3h'] || 0),
      conditions: closestForecast.weather[0].description,
      visibility: Math.round(closestForecast.visibility / 1609.34)
    };
  }

  /**
   * Fetch weather alerts (simplified implementation)
   */
  private async fetchWeatherAlerts(city: string, state: string): Promise<WeatherAlert[]> {
    // This would require additional API calls to weather alert services
    // For now, return empty array as alerts are not available in basic OpenWeatherMap API
    return [];
  }

  /**
   * Group forecasts by day
   */
  private groupForecastsByDay(forecasts: any[]): { [key: string]: any[] } {
    const grouped: { [key: string]: any[] } = {};
    
    forecasts.forEach(forecast => {
      const date = new Date(forecast.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(forecast);
    });

    return grouped;
  }

  /**
   * Get estimated historical weather when API is unavailable
   */
  private getEstimatedHistoricalWeather(venue: Venue, date: Date): HistoricalWeatherData {
    // This would use historical averages or cached data
    // For now, return a reasonable estimate based on location and season
    const month = date.getMonth();
    const isWinter = month === 11 || month === 0 || month === 1;
    const isSummer = month >= 5 && month <= 8;

    let estimatedTemp = 60; // Default moderate temperature
    if (isWinter) estimatedTemp = 35;
    if (isSummer) estimatedTemp = 80;

    const conditions: WeatherCondition = {
      temperature: estimatedTemp,
      humidity: 50,
      windSpeed: 8,
      windDirection: 180,
      precipitation: 0,
      conditions: 'Partly cloudy (estimated)',
      visibility: 10
    };

    return {
      venueId: venue.id,
      date,
      conditions,
      impact: WeatherMapper.assessWeatherImpact(conditions, venue.indoor)
    };
  }

  /**
   * Handle weather API specific error codes
   */
  protected async performRequest<T>(request: APIRequest): Promise<APIResponse<T>> {
    try {
      const response = await super.performRequest<T>(request);
      
      // OpenWeatherMap specific error handling
      if (response.data && typeof response.data === 'object' && 'cod' in response.data) {
        const weatherResponse = response.data as any;
        if (weatherResponse.cod !== 200 && weatherResponse.cod !== '200') {
          throw new APIError(
            weatherResponse.message || 'Weather API error',
            weatherResponse.cod,
            weatherResponse,
            weatherResponse.cod === 429 // Rate limit is retryable
          );
        }
      }

      return response;
    } catch (error) {
      if (error instanceof APIError) {
        // Handle specific weather API error codes
        if (error.statusCode === 401) {
          throw new APIError(
            'Invalid Weather API key',
            401,
            error.response,
            false
          );
        } else if (error.statusCode === 404) {
          throw new APIError(
            'Weather data not found for location',
            404,
            error.response,
            false
          );
        } else if (error.statusCode === 429) {
          throw new APIError(
            'Weather API rate limit exceeded',
            429,
            error.response,
            true
          );
        }
      }
      throw error;
    }
  }

  /**
   * Perform health check specific to Weather API
   */
  protected async performHealthCheck(): Promise<void> {
    try {
      // Test with a known location
      const params = new URLSearchParams({
        q: 'New York,NY',
        appid: this.weatherConfig.apiKey,
        units: 'imperial'
      });

      const request: APIRequest = {
        url: `${this.weatherConfig.endpoints.current}?${params.toString()}`,
        method: 'GET'
      };

      await this.performRequest(request);
      this.logger.info('Weather API health check passed');
    } catch (error) {
      this.logger.error('Weather API health check failed', error instanceof Error ? error : new Error(String(error)));
      throw new APIError(
        'Weather API health check failed',
        undefined,
        error,
        false
      );
    }
  }
}
/**
 * Weather API specific types and interfaces
 */

import { WeatherCondition } from './common.types';

/**
 * OpenWeatherMap API response structure
 */
export interface OpenWeatherMapResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: OpenWeatherMapWeather[];
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  snow?: {
    '1h'?: number;
    '3h'?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

/**
 * OpenWeatherMap weather condition
 */
export interface OpenWeatherMapWeather {
  id: number;
  main: string;
  description: string;
  icon: string;
}

/**
 * OpenWeatherMap forecast response
 */
export interface OpenWeatherMapForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: OpenWeatherMapForecastItem[];
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

/**
 * OpenWeatherMap forecast item
 */
export interface OpenWeatherMapForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    sea_level: number;
    grnd_level: number;
    humidity: number;
    temp_kf: number;
  };
  weather: OpenWeatherMapWeather[];
  clouds: {
    all: number;
  };
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  visibility: number;
  pop: number; // Probability of precipitation
  rain?: {
    '3h': number;
  };
  snow?: {
    '3h': number;
  };
  sys: {
    pod: string; // Part of day (n - night, d - day)
  };
  dt_txt: string;
}

/**
 * Weather API configuration
 */
export interface WeatherAPIConfig {
  apiKey: string;
  baseUrl: string;
  endpoints: {
    current: string;
    forecast: string;
    historical: string;
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

/**
 * Venue weather request parameters
 */
export interface VenueWeatherRequest {
  venueId: string;
  venueName: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  indoor: boolean;
  gameTime: Date;
}

/**
 * Weather impact assessment
 */
export interface WeatherImpact {
  overall: 'low' | 'moderate' | 'high' | 'severe';
  passing: {
    impact: 'low' | 'moderate' | 'high' | 'severe';
    factors: string[];
  };
  rushing: {
    impact: 'low' | 'moderate' | 'high' | 'severe';
    factors: string[];
  };
  kicking: {
    impact: 'low' | 'moderate' | 'high' | 'severe';
    factors: string[];
  };
  visibility: {
    impact: 'low' | 'moderate' | 'high' | 'severe';
    factors: string[];
  };
  playerSafety: {
    concern: 'none' | 'low' | 'moderate' | 'high' | 'extreme';
    factors: string[];
  };
}

/**
 * Historical weather data
 */
export interface HistoricalWeatherData {
  venueId: string;
  date: Date;
  conditions: WeatherCondition;
  impact: WeatherImpact;
  gamePerformance?: {
    totalPoints: number;
    passingYards: number;
    rushingYards: number;
    turnovers: number;
    fieldGoalAttempts: number;
    fieldGoalMade: number;
  };
}

/**
 * Weather alert
 */
export interface WeatherAlert {
  id: string;
  type: 'watch' | 'warning' | 'advisory';
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  areas: string[];
  impact: WeatherImpact;
}

/**
 * Utility functions for weather data processing
 */
export class WeatherMapper {
  /**
   * Convert OpenWeatherMap response to internal WeatherCondition format
   */
  static mapToWeatherCondition(response: OpenWeatherMapResponse): WeatherCondition {
    const weather = response.weather[0];
    const precipitation = (response.rain?.['1h'] || 0) + (response.snow?.['1h'] || 0);

    return {
      temperature: Math.round(response.main.temp),
      humidity: response.main.humidity,
      windSpeed: Math.round(response.wind.speed * 2.237), // Convert m/s to mph
      windDirection: response.wind.deg,
      precipitation: precipitation,
      conditions: weather.description,
      visibility: Math.round(response.visibility / 1609.34) // Convert meters to miles
    };
  }

  /**
   * Convert Kelvin to Fahrenheit
   */
  static kelvinToFahrenheit(kelvin: number): number {
    return Math.round((kelvin - 273.15) * 9/5 + 32);
  }

  /**
   * Convert meters per second to miles per hour
   */
  static mpsToMph(mps: number): number {
    return Math.round(mps * 2.237);
  }

  /**
   * Convert meters to miles
   */
  static metersToMiles(meters: number): number {
    return Math.round(meters / 1609.34);
  }

  /**
   * Assess weather impact on game performance
   */
  static assessWeatherImpact(weather: WeatherCondition, indoor: boolean): WeatherImpact {
    if (indoor) {
      return {
        overall: 'low',
        passing: { impact: 'low', factors: ['Indoor venue'] },
        rushing: { impact: 'low', factors: ['Indoor venue'] },
        kicking: { impact: 'low', factors: ['Indoor venue'] },
        visibility: { impact: 'low', factors: ['Indoor venue'] },
        playerSafety: { concern: 'none', factors: ['Indoor venue'] }
      };
    }

    const factors = {
      passing: [] as string[],
      rushing: [] as string[],
      kicking: [] as string[],
      visibility: [] as string[],
      safety: [] as string[]
    };

    let overallImpact: 'low' | 'moderate' | 'high' | 'severe' = 'low';
    let passingImpact: 'low' | 'moderate' | 'high' | 'severe' = 'low';
    let rushingImpact: 'low' | 'moderate' | 'high' | 'severe' = 'low';
    let kickingImpact: 'low' | 'moderate' | 'high' | 'severe' = 'low';
    let visibilityImpact: 'low' | 'moderate' | 'high' | 'severe' = 'low';
    let safetyConcern: 'none' | 'low' | 'moderate' | 'high' | 'extreme' = 'none';

    // Temperature impact
    if (weather.temperature < 20) {
      factors.passing.push('Extremely cold temperature affects ball handling');
      factors.kicking.push('Cold affects ball trajectory and kicker accuracy');
      factors.safety.push('Risk of hypothermia and frostbite');
      passingImpact = 'high';
      kickingImpact = 'moderate';
      safetyConcern = 'moderate';
      overallImpact = 'high';
    } else if (weather.temperature < 32) {
      factors.passing.push('Cold temperature affects grip and ball handling');
      factors.kicking.push('Cold affects ball flight');
      passingImpact = 'moderate';
      kickingImpact = 'moderate';
      overallImpact = 'moderate';
    } else if (weather.temperature > 95) {
      factors.safety.push('High heat increases risk of heat exhaustion');
      factors.passing.push('Heat affects player endurance');
      safetyConcern = 'moderate';
      overallImpact = 'moderate';
    }

    // Wind impact
    if (weather.windSpeed > 25) {
      factors.passing.push('Strong winds significantly affect passing accuracy');
      factors.kicking.push('High winds severely impact field goals and punts');
      passingImpact = 'severe';
      kickingImpact = 'severe';
      overallImpact = 'severe';
    } else if (weather.windSpeed > 15) {
      factors.passing.push('Moderate winds affect long passes');
      factors.kicking.push('Wind affects kicking accuracy');
      passingImpact = 'moderate';
      kickingImpact = 'high';
      overallImpact = 'moderate';
    } else if (weather.windSpeed > 10) {
      factors.passing.push('Light winds may affect deep passes');
      factors.kicking.push('Wind may affect longer kicks');
      passingImpact = 'low';
      kickingImpact = 'moderate';
    }

    // Precipitation impact
    if (weather.precipitation > 0.5) {
      factors.passing.push('Heavy precipitation affects ball grip and visibility');
      factors.rushing.push('Wet field conditions affect footing');
      factors.visibility.push('Heavy rain/snow reduces visibility');
      factors.safety.push('Slippery conditions increase injury risk');
      passingImpact = 'high';
      rushingImpact = 'moderate';
      visibilityImpact = 'high';
      safetyConcern = 'moderate';
      overallImpact = 'high';
    } else if (weather.precipitation > 0.1) {
      factors.passing.push('Light precipitation affects ball handling');
      factors.rushing.push('Slightly wet field affects traction');
      passingImpact = 'moderate';
      rushingImpact = 'low';
      overallImpact = 'moderate';
    }

    // Visibility impact
    if (weather.visibility < 1) {
      factors.visibility.push('Extremely poor visibility affects all aspects of play');
      factors.safety.push('Poor visibility increases collision risk');
      visibilityImpact = 'severe';
      safetyConcern = 'high';
      overallImpact = 'severe';
    } else if (weather.visibility < 3) {
      factors.visibility.push('Poor visibility affects passing and receiving');
      visibilityImpact = 'high';
      overallImpact = 'high';
    } else if (weather.visibility < 6) {
      factors.visibility.push('Reduced visibility may affect long passes');
      visibilityImpact = 'moderate';
    }

    // Weather conditions impact
    const conditions = weather.conditions.toLowerCase();
    if (conditions.includes('thunderstorm') || conditions.includes('lightning')) {
      factors.safety.push('Lightning poses extreme danger - game may be delayed');
      safetyConcern = 'extreme';
      overallImpact = 'severe';
    } else if (conditions.includes('blizzard') || conditions.includes('heavy snow')) {
      factors.visibility.push('Blizzard conditions severely limit visibility');
      factors.passing.push('Heavy snow makes ball handling extremely difficult');
      factors.safety.push('Blizzard conditions pose safety risks');
      visibilityImpact = 'severe';
      passingImpact = 'severe';
      safetyConcern = 'high';
      overallImpact = 'severe';
    } else if (conditions.includes('fog')) {
      factors.visibility.push('Fog reduces visibility significantly');
      visibilityImpact = 'high';
      overallImpact = 'moderate';
    }

    return {
      overall: overallImpact,
      passing: { impact: passingImpact, factors: factors.passing },
      rushing: { impact: rushingImpact, factors: factors.rushing },
      kicking: { impact: kickingImpact, factors: factors.kicking },
      visibility: { impact: visibilityImpact, factors: factors.visibility },
      playerSafety: { concern: safetyConcern, factors: factors.safety }
    };
  }

  /**
   * Determine if weather conditions warrant game delay or cancellation
   */
  static shouldDelayGame(weather: WeatherCondition, alerts: WeatherAlert[]): {
    shouldDelay: boolean;
    reason: string;
    severity: 'low' | 'moderate' | 'high' | 'extreme';
  } {
    // Check for lightning/thunderstorm alerts
    const severeAlerts = alerts.filter(alert => 
      alert.severity === 'extreme' || alert.severity === 'severe'
    );

    if (severeAlerts.some(alert => alert.type === 'warning' && 
        (alert.title.toLowerCase().includes('thunderstorm') || 
         alert.title.toLowerCase().includes('lightning')))) {
      return {
        shouldDelay: true,
        reason: 'Lightning/thunderstorm warning - player safety risk',
        severity: 'extreme'
      };
    }

    // Check for extreme weather conditions
    if (weather.temperature < 0) {
      return {
        shouldDelay: true,
        reason: 'Extreme cold temperature poses player safety risk',
        severity: 'high'
      };
    }

    if (weather.windSpeed > 35) {
      return {
        shouldDelay: true,
        reason: 'Extreme wind conditions make play unsafe',
        severity: 'high'
      };
    }

    if (weather.visibility < 0.5) {
      return {
        shouldDelay: true,
        reason: 'Extremely poor visibility makes play unsafe',
        severity: 'high'
      };
    }

    return {
      shouldDelay: false,
      reason: 'Weather conditions are within acceptable limits',
      severity: 'low'
    };
  }
}
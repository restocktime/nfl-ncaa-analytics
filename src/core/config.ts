import { injectable } from 'inversify';
import * as dotenv from 'dotenv';

/**
 * Configuration management service
 */
@injectable()
export class Config {
  private config: { [key: string]: any } = {};

  constructor() {
    dotenv.config();
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    this.config = {
      // Server Configuration
      server: {
        port: this.getEnvNumber('PORT', 3000),
        host: this.getEnvString('HOST', '0.0.0.0'),
        environment: this.getEnvString('NODE_ENV', 'development')
      },

      // Database Configuration
      database: {
        postgresql: {
          host: this.getEnvString('POSTGRES_HOST', 'localhost'),
          port: this.getEnvNumber('POSTGRES_PORT', 5432),
          database: this.getEnvString('POSTGRES_DB', 'football_analytics'),
          username: this.getEnvString('POSTGRES_USER', 'postgres'),
          password: this.getEnvString('POSTGRES_PASSWORD', ''),
          ssl: this.getEnvBoolean('POSTGRES_SSL', false),
          maxConnections: this.getEnvNumber('POSTGRES_MAX_CONNECTIONS', 20),
          acquireTimeoutMillis: this.getEnvNumber('POSTGRES_ACQUIRE_TIMEOUT', 60000),
          idleTimeoutMillis: this.getEnvNumber('POSTGRES_IDLE_TIMEOUT', 30000),
          synchronize: this.getEnvBoolean('POSTGRES_SYNCHRONIZE', false),
          logging: this.getEnvBoolean('POSTGRES_LOGGING', false),
          migrationsRun: this.getEnvBoolean('POSTGRES_MIGRATIONS_RUN', true)
        },
        redis: {
          host: this.getEnvString('REDIS_HOST', 'localhost'),
          port: this.getEnvNumber('REDIS_PORT', 6379),
          password: this.getEnvString('REDIS_PASSWORD', ''),
          db: this.getEnvNumber('REDIS_DB', 0)
        },
        influxdb: {
          url: this.getEnvString('INFLUXDB_URL', 'http://localhost:8086'),
          token: this.getEnvString('INFLUXDB_TOKEN', ''),
          org: this.getEnvString('INFLUXDB_ORG', 'football-analytics'),
          bucket: this.getEnvString('INFLUXDB_BUCKET', 'game-data'),
          retentionPolicies: {
            gameStates: this.getEnvString('INFLUXDB_RETENTION_GAME_STATES', '2y'),
            probabilities: this.getEnvString('INFLUXDB_RETENTION_PROBABILITIES', '2y'),
            metrics: this.getEnvString('INFLUXDB_RETENTION_METRICS', '1y')
          }
        }
      },

      // External API Configuration
      apis: {
        sportsDataIO: {
          apiKey: this.getEnvString('SPORTSDATA_API_KEY', ''),
          baseUrl: this.getEnvString('SPORTSDATA_BASE_URL', 'https://api.sportsdata.io'),
          rateLimit: this.getEnvNumber('SPORTSDATA_RATE_LIMIT', 100)
        },
        espn: {
          baseUrl: this.getEnvString('ESPN_BASE_URL', 'https://site.api.espn.com/apis/site/v2/sports/football'),
          rateLimit: this.getEnvNumber('ESPN_RATE_LIMIT', 200)
        },
        oddsAPI: {
          apiKey: this.getEnvString('ODDS_API_KEY', ''),
          baseUrl: this.getEnvString('ODDS_BASE_URL', 'https://api.the-odds-api.com'),
          rateLimit: this.getEnvNumber('ODDS_RATE_LIMIT', 500)
        },
        weather: {
          apiKey: this.getEnvString('WEATHER_API_KEY', ''),
          baseUrl: this.getEnvString('WEATHER_BASE_URL', 'https://api.openweathermap.org/data/2.5'),
          rateLimit: this.getEnvNumber('WEATHER_RATE_LIMIT', 1000)
        }
      },

      // Circuit Breaker Configuration
      circuitBreaker: {
        failureThreshold: this.getEnvNumber('CIRCUIT_BREAKER_FAILURE_THRESHOLD', 5),
        recoveryTimeout: this.getEnvNumber('CIRCUIT_BREAKER_RECOVERY_TIMEOUT', 60000),
        monitoringPeriod: this.getEnvNumber('CIRCUIT_BREAKER_MONITORING_PERIOD', 10000)
      },

      // Rate Limiting Configuration
      rateLimiting: {
        windowMs: this.getEnvNumber('RATE_LIMIT_WINDOW_MS', 60000),
        maxRequests: this.getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
        skipSuccessfulRequests: this.getEnvBoolean('RATE_LIMIT_SKIP_SUCCESSFUL', false)
      },

      // Monte Carlo Configuration
      monteCarlo: {
        defaultIterations: this.getEnvNumber('MONTE_CARLO_DEFAULT_ITERATIONS', 1000),
        maxIterations: this.getEnvNumber('MONTE_CARLO_MAX_ITERATIONS', 10000),
        parallelWorkers: this.getEnvNumber('MONTE_CARLO_PARALLEL_WORKERS', 4),
        cloudScaling: this.getEnvBoolean('MONTE_CARLO_CLOUD_SCALING', false)
      },

      // Logging Configuration
      logging: {
        level: this.getEnvString('LOG_LEVEL', 'info'),
        format: this.getEnvString('LOG_FORMAT', 'json'),
        enableConsole: this.getEnvBoolean('LOG_ENABLE_CONSOLE', true),
        enableFile: this.getEnvBoolean('LOG_ENABLE_FILE', false),
        filePath: this.getEnvString('LOG_FILE_PATH', './logs/app.log')
      },

      // Cache Configuration
      cache: {
        defaultTTL: this.getEnvNumber('CACHE_DEFAULT_TTL', 300), // 5 minutes
        gameDataTTL: this.getEnvNumber('CACHE_GAME_DATA_TTL', 30), // 30 seconds
        statisticsTTL: this.getEnvNumber('CACHE_STATISTICS_TTL', 3600), // 1 hour
        probabilityTTL: this.getEnvNumber('CACHE_PROBABILITY_TTL', 10) // 10 seconds
      }
    };
  }

  public get<T>(key: string): T {
    return this.getNestedValue(this.config, key);
  }

  public set(key: string, value: any): void {
    this.setNestedValue(this.config, key, value);
  }

  public has(key: string): boolean {
    try {
      const value = this.getNestedValue(this.config, key);
      return value !== undefined;
    } catch {
      return false;
    }
  }

  private getEnvString(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  private getEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  }

  private getEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return current[key];
      }
      throw new Error(`Configuration key '${path}' not found`);
    }, obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}
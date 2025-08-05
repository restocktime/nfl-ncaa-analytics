import { DataSource, DataSourceOptions } from 'typeorm';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  maxConnections: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
}

export class DatabaseManager {
  private dataSource: DataSource | null = null;
  private config: DatabaseConfig;

  constructor(dbConfig: DatabaseConfig) {
    this.config = dbConfig;
  }

  async initialize(): Promise<void> {
    const options: DataSourceOptions = {
      type: 'postgres',
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      database: this.config.database,
      ssl: this.config.ssl,
      entities: [
        'src/entities/**/*.ts'
      ],
      migrations: [
        'src/migrations/**/*.ts'
      ],
      synchronize: false, // Use migrations in production
      logging: process.env.NODE_ENV === 'development',
      extra: {
        max: this.config.maxConnections,
        acquireTimeoutMillis: this.config.acquireTimeoutMillis,
        idleTimeoutMillis: this.config.idleTimeoutMillis,
      }
    };

    this.dataSource = new DataSource(options);
    await this.dataSource.initialize();
  }

  async close(): Promise<void> {
    if (this.dataSource) {
      await this.dataSource.destroy();
      this.dataSource = null;
    }
  }

  getDataSource(): DataSource {
    if (!this.dataSource) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.dataSource;
  }

  async runMigrations(): Promise<void> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }
    await this.dataSource.runMigrations();
  }

  async revertLastMigration(): Promise<void> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }
    await this.dataSource.undoLastMigration();
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.dataSource) {
        return false;
      }
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Default configuration
export const defaultDatabaseConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'football_analytics',
  ssl: process.env.DB_SSL === 'true',
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
};
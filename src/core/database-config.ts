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
  enableTimescaleDB?: boolean;
  connectionTimeoutMillis?: number;
  queryTimeoutMillis?: number;
  statementTimeoutMillis?: number;
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
        connectionTimeoutMillis: this.config.connectionTimeoutMillis || 60000,
        query_timeout: this.config.queryTimeoutMillis || 30000,
        statement_timeout: this.config.statementTimeoutMillis || 30000,
        // TimescaleDB specific optimizations
        ...(this.config.enableTimescaleDB && {
          application_name: 'football_analytics_system',
          timezone: 'UTC',
          shared_preload_libraries: 'timescaledb'
        })
      }
    };

    this.dataSource = new DataSource(options);
    await this.dataSource.initialize();

    // Enable TimescaleDB extension if configured
    if (this.config.enableTimescaleDB) {
      await this.enableTimescaleDB();
    }
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

  private async enableTimescaleDB(): Promise<void> {
    if (!this.dataSource) {
      return;
    }

    try {
      // Check if TimescaleDB extension is available
      const extensionCheck = await this.dataSource.query(
        "SELECT * FROM pg_available_extensions WHERE name = 'timescaledb'"
      );
      
      if (extensionCheck.length > 0) {
        // Enable TimescaleDB extension
        await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE');
        console.log('TimescaleDB extension enabled successfully');
      } else {
        console.warn('TimescaleDB extension not available in this PostgreSQL instance');
      }
    } catch (error) {
      console.error('Failed to enable TimescaleDB extension:', error);
      // Don't throw error - continue without TimescaleDB optimizations
    }
  }

  async getTimescaleDBInfo(): Promise<any> {
    try {
      if (!this.dataSource) {
        throw new Error('Database not initialized');
      }
      
      const result = await this.dataSource.query("SELECT * FROM timescaledb_information.hypertables");
      return result;
    } catch (error) {
      console.warn('TimescaleDB not available or no hypertables found');
      return [];
    }
  }

  async optimizeTimescaleDB(): Promise<void> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }

    try {
      // Set optimal TimescaleDB configuration
      await this.dataSource.query("SELECT set_config('timescaledb.max_background_workers', '8', false)");
      await this.dataSource.query("SELECT set_config('max_worker_processes', '16', false)");
      
      // Enable compression for older data
      await this.dataSource.query(`
        SELECT add_compression_policy('game_states', INTERVAL '7 days');
      `);
      
      await this.dataSource.query(`
        SELECT add_compression_policy('game_probabilities', INTERVAL '7 days');
      `);
      
      console.log('TimescaleDB optimization completed');
    } catch (error) {
      console.warn('TimescaleDB optimization failed:', error);
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
  enableTimescaleDB: process.env.ENABLE_TIMESCALEDB === 'true',
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '60000'),
  queryTimeoutMillis: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
  statementTimeoutMillis: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
};
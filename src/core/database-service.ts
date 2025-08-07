import { DataSource } from 'typeorm';
import { DatabaseManager, DatabaseConfig } from './database-config';
import { GameRepository } from '../repositories/GameRepository';
import { GameStateRepository } from '../repositories/GameStateRepository';
import { GameProbabilitiesRepository } from '../repositories/GameProbabilitiesRepository';
import { TeamRepository } from '../repositories/TeamRepository';
import { PlayerRepository } from '../repositories/PlayerRepository';
import { TeamStatisticsRepository } from '../repositories/TeamStatisticsRepository';
import { PlayerStatisticsRepository } from '../repositories/PlayerStatisticsRepository';

export class DatabaseService {
  private databaseManager: DatabaseManager;
  private dataSource: DataSource | null = null;

  // Repository instances
  public gameRepository!: GameRepository;
  public gameStateRepository!: GameStateRepository;
  public gameProbabilitiesRepository!: GameProbabilitiesRepository;
  public teamRepository!: TeamRepository;
  public playerRepository!: PlayerRepository;
  public teamStatisticsRepository!: TeamStatisticsRepository;
  public playerStatisticsRepository!: PlayerStatisticsRepository;

  constructor(config: DatabaseConfig) {
    this.databaseManager = new DatabaseManager(config);
  }

  async initialize(): Promise<void> {
    await this.databaseManager.initialize();
    this.dataSource = this.databaseManager.getDataSource();

    // Initialize all repositories
    this.gameRepository = new GameRepository(this.dataSource);
    this.gameStateRepository = new GameStateRepository(this.dataSource);
    this.gameProbabilitiesRepository = new GameProbabilitiesRepository(this.dataSource);
    this.teamRepository = new TeamRepository(this.dataSource);
    this.playerRepository = new PlayerRepository(this.dataSource);
    this.teamStatisticsRepository = new TeamStatisticsRepository(this.dataSource);
    this.playerStatisticsRepository = new PlayerStatisticsRepository(this.dataSource);
  }

  async close(): Promise<void> {
    await this.databaseManager.close();
    this.dataSource = null;
  }

  async runMigrations(): Promise<void> {
    await this.databaseManager.runMigrations();
  }

  async revertLastMigration(): Promise<void> {
    await this.databaseManager.revertLastMigration();
  }

  async isHealthy(): Promise<boolean> {
    return this.databaseManager.isHealthy();
  }

  getDataSource(): DataSource {
    if (!this.dataSource) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.dataSource;
  }

  async query(sql: string, parameters?: any[]): Promise<any> {
    if (!this.dataSource) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.dataSource.query(sql, parameters);
  }

  async getTimescaleDBInfo(): Promise<any> {
    return this.databaseManager.getTimescaleDBInfo();
  }

  async optimizeTimescaleDB(): Promise<void> {
    await this.databaseManager.optimizeTimescaleDB();
  }

  // Utility methods for common database operations
  async executeTransaction<T>(operation: (dataSource: DataSource) => Promise<T>): Promise<T> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(this.dataSource);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getConnectionInfo(): Promise<{
    isConnected: boolean;
    database: string;
    host: string;
    port: number;
    activeConnections: number;
  }> {
    if (!this.dataSource) {
      return {
        isConnected: false,
        database: '',
        host: '',
        port: 0,
        activeConnections: 0
      };
    }

    try {
      const connectionInfo = await this.dataSource.query(`
        SELECT 
          current_database() as database,
          inet_server_addr() as host,
          inet_server_port() as port,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections
      `);

      return {
        isConnected: this.dataSource.isInitialized,
        database: connectionInfo[0].database,
        host: connectionInfo[0].host || 'localhost',
        port: connectionInfo[0].port || 5432,
        activeConnections: parseInt(connectionInfo[0].active_connections) || 0
      };
    } catch (error) {
      return {
        isConnected: false,
        database: '',
        host: '',
        port: 0,
        activeConnections: 0
      };
    }
  }

  async getDatabaseStats(): Promise<{
    totalTables: number;
    totalRows: number;
    databaseSize: string;
    hypertables: any[];
  }> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }

    try {
      // Get table count
      const tableCount = await this.dataSource.query(`
        SELECT count(*) as total_tables 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      // Get total row count (approximate)
      const rowCount = await this.dataSource.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins - n_tup_del as row_count
        FROM pg_stat_user_tables
      `);

      const totalRows = rowCount.reduce((sum: number, table: any) => sum + parseInt(table.row_count || 0), 0);

      // Get database size
      const sizeResult = await this.dataSource.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
      `);

      // Get TimescaleDB hypertables info
      const hypertables = await this.getTimescaleDBInfo();

      return {
        totalTables: parseInt(tableCount[0].total_tables),
        totalRows,
        databaseSize: sizeResult[0].database_size,
        hypertables
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        totalTables: 0,
        totalRows: 0,
        databaseSize: '0 bytes',
        hypertables: []
      };
    }
  }

  async cleanupOldData(retentionDays: number = 365): Promise<{
    gameStatesDeleted: number;
    probabilitiesDeleted: number;
  }> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }

    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    try {
      const gameStatesResult = await this.dataSource.query(
        'DELETE FROM game_states WHERE timestamp < $1',
        [cutoffDate]
      );

      const probabilitiesResult = await this.dataSource.query(
        'DELETE FROM game_probabilities WHERE timestamp < $1',
        [cutoffDate]
      );

      return {
        gameStatesDeleted: gameStatesResult.affectedRows || 0,
        probabilitiesDeleted: probabilitiesResult.affectedRows || 0
      };
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      return {
        gameStatesDeleted: 0,
        probabilitiesDeleted: 0
      };
    }
  }

  async vacuum(): Promise<void> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }

    try {
      await this.dataSource.query('VACUUM ANALYZE');
      console.log('Database vacuum completed successfully');
    } catch (error) {
      console.error('Error running vacuum:', error);
      throw error;
    }
  }

  async createIndexes(): Promise<void> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }

    const indexes = [
      // Additional performance indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_states_game_quarter ON game_states(game_id, quarter)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_states_momentum ON game_states(momentum_score) WHERE momentum_score IS NOT NULL',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_probabilities_confidence ON game_probabilities(confidence_interval_lower, confidence_interval_upper)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_statistics_efficiency ON team_statistics(offensive_efficiency, defensive_efficiency)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_statistics_fantasy ON player_statistics(passing_yards, rushing_yards, receiving_yards)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_active ON players(team_id, injury_status) WHERE injury_status = \'healthy\'',
    ];

    for (const indexQuery of indexes) {
      try {
        await this.dataSource.query(indexQuery);
        console.log(`Index created: ${indexQuery.split(' ')[5]}`);
      } catch (error) {
        console.warn(`Failed to create index: ${error}`);
      }
    }
  }
}
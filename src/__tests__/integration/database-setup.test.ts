import { DatabaseService } from '../../core/database-service';
import { defaultDatabaseConfig } from '../../core/database-config';

describe('Database Setup Integration Tests', () => {
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const testConfig = {
      ...defaultDatabaseConfig,
      database: 'football_analytics_test',
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      username: process.env.TEST_DB_USERNAME || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'password',
      enableTimescaleDB: true
    };

    databaseService = new DatabaseService(testConfig);
    
    try {
      await databaseService.initialize();
      await databaseService.runMigrations();
    } catch (error) {
      console.warn('Database connection failed, skipping integration tests:', error);
      return;
    }
  });

  afterAll(async () => {
    if (databaseService) {
      await databaseService.close();
    }
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      if (!databaseService) return;
      
      const isHealthy = await databaseService.isHealthy();
      expect(isHealthy).toBe(true);
    });

    it('should provide connection information', async () => {
      if (!databaseService) return;
      
      const connectionInfo = await databaseService.getConnectionInfo();
      expect(connectionInfo.isConnected).toBe(true);
      expect(connectionInfo.database).toBe('football_analytics_test');
    });

    it('should get database statistics', async () => {
      if (!databaseService) return;
      
      const stats = await databaseService.getDatabaseStats();
      expect(stats.totalTables).toBeGreaterThan(0);
      expect(typeof stats.databaseSize).toBe('string');
    });
  });

  describe('Repository Access', () => {
    it('should provide access to all repositories', async () => {
      if (!databaseService) return;

      expect(databaseService.gameRepository).toBeDefined();
      expect(databaseService.gameStateRepository).toBeDefined();
      expect(databaseService.gameProbabilitiesRepository).toBeDefined();
      expect(databaseService.teamRepository).toBeDefined();
      expect(databaseService.playerRepository).toBeDefined();
      expect(databaseService.teamStatisticsRepository).toBeDefined();
      expect(databaseService.playerStatisticsRepository).toBeDefined();
    });
  });

  describe('TimescaleDB Integration', () => {
    it('should handle TimescaleDB operations', async () => {
      if (!databaseService) return;

      // This should not throw an error even if TimescaleDB is not available
      await expect(databaseService.getTimescaleDBInfo()).resolves.not.toThrow();
      await expect(databaseService.optimizeTimescaleDB()).resolves.not.toThrow();
    });
  });

  describe('Database Maintenance', () => {
    it('should support vacuum operations', async () => {
      if (!databaseService) return;

      await expect(databaseService.vacuum()).resolves.not.toThrow();
    });

    it('should support index creation', async () => {
      if (!databaseService) return;

      await expect(databaseService.createIndexes()).resolves.not.toThrow();
    });
  });
});
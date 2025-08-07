import { HealthChecker, HealthCheckResult, SystemHealthStatus } from '../../core/health-checker';
import { RedisCache } from '../../core/redis-cache';
import { DatabaseService } from '../../core/database-service';
import { InfluxDBManager } from '../../core/influxdb-config';
import { PrometheusMetrics } from '../../core/prometheus-metrics';

// Mock dependencies
jest.mock('../../core/redis-cache');
jest.mock('../../core/database-service');
jest.mock('../../core/influxdb-config');
jest.mock('../../core/prometheus-metrics');

describe('HealthChecker', () => {
  let healthChecker: HealthChecker;
  let mockRedisCache: jest.Mocked<RedisCache>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockInfluxManager: jest.Mocked<InfluxDBManager>;
  let mockMetrics: jest.Mocked<PrometheusMetrics>;

  beforeEach(() => {
    // Create mocks
    mockRedisCache = {
      set: jest.fn().mockResolvedValue(true),
      get: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      flushAll: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn()
    } as any;

    mockDatabaseService = {
      query: jest.fn(),
      getDataSource: jest.fn(),
      initialize: jest.fn(),
      close: jest.fn()
    } as any;

    const mockQueryApi = {
      queryRows: jest.fn()
    };

    mockInfluxManager = {
      getQueryApi: jest.fn().mockReturnValue(mockQueryApi),
      config: {
        bucket: 'test-bucket',
        org: 'test-org',
        url: 'http://localhost:8086',
        token: 'test-token'
      }
    } as any;

    mockMetrics = {
      setServiceHealth: jest.fn(),
      setDatabaseConnections: jest.fn()
    } as any;

    // Mock PrometheusMetrics.getInstance
    (PrometheusMetrics.getInstance as jest.Mock).mockReturnValue(mockMetrics);

    healthChecker = new HealthChecker(mockRedisCache, mockDatabaseService, mockInfluxManager);
  });

  afterEach(() => {
    healthChecker.stopPeriodicHealthChecks();
    jest.clearAllMocks();
  });

  describe('Redis Health Check', () => {
    it('should report healthy Redis when read/write test passes', async () => {
      const testValue = '12345';
      mockRedisCache.set.mockResolvedValue(true);
      mockRedisCache.get.mockResolvedValue(testValue);

      const healthStatus = await healthChecker.performHealthCheck();
      
      const redisHealth = healthStatus.services.find(s => s.service === 'redis');
      expect(redisHealth).toBeDefined();
      expect(redisHealth!.status).toBe('healthy');
      expect(redisHealth!.details.connected).toBe(true);
      expect(redisHealth!.responseTime).toBeGreaterThan(0);
    });

    it('should report degraded Redis when response time is high', async () => {
      const testValue = '12345';
      mockRedisCache.set.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 150))
      );
      mockRedisCache.get.mockResolvedValue(testValue);

      const healthStatus = await healthChecker.performHealthCheck();
      
      const redisHealth = healthStatus.services.find(s => s.service === 'redis');
      expect(redisHealth).toBeDefined();
      expect(redisHealth!.status).toBe('degraded');
      expect(redisHealth!.responseTime).toBeGreaterThan(100);
    });

    it('should report unhealthy Redis when read/write test fails', async () => {
      mockRedisCache.set.mockResolvedValue(true);
      mockRedisCache.get.mockResolvedValue('wrong-value');

      const healthStatus = await healthChecker.performHealthCheck();
      
      const redisHealth = healthStatus.services.find(s => s.service === 'redis');
      expect(redisHealth).toBeDefined();
      expect(redisHealth!.status).toBe('unhealthy');
      expect(redisHealth!.error).toContain('Redis read/write test failed');
    });

    it('should report degraded when Redis is not configured', async () => {
      const healthCheckerWithoutRedis = new HealthChecker();
      
      const healthStatus = await healthCheckerWithoutRedis.performHealthCheck();
      
      const redisHealth = healthStatus.services.find(s => s.service === 'redis');
      expect(redisHealth).toBeDefined();
      expect(redisHealth!.status).toBe('degraded');
      expect(redisHealth!.details.message).toContain('Redis cache not configured');
    });

    it('should report unhealthy Redis on connection error', async () => {
      mockRedisCache.set.mockRejectedValue(new Error('Connection refused'));

      const healthStatus = await healthChecker.performHealthCheck();
      
      const redisHealth = healthStatus.services.find(s => s.service === 'redis');
      expect(redisHealth).toBeDefined();
      expect(redisHealth!.status).toBe('unhealthy');
      expect(redisHealth!.error).toContain('Connection refused');
    });
  });

  describe('Database Health Check', () => {
    it('should report healthy database when query succeeds', async () => {
      mockDatabaseService.query.mockResolvedValue([{ health_check: 1 }]);

      const healthStatus = await healthChecker.performHealthCheck();
      
      const dbHealth = healthStatus.services.find(s => s.service === 'database');
      expect(dbHealth).toBeDefined();
      expect(dbHealth!.status).toBe('healthy');
      expect(dbHealth!.details.connected).toBe(true);
      expect(dbHealth!.details.queryResult).toEqual({ health_check: 1 });
      expect(mockMetrics.setDatabaseConnections).toHaveBeenCalledWith('postgresql', 'main', 1);
    });

    it('should report degraded database when response time is high', async () => {
      mockDatabaseService.query.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([{ health_check: 1 }]), 250))
      );

      const healthStatus = await healthChecker.performHealthCheck();
      
      const dbHealth = healthStatus.services.find(s => s.service === 'database');
      expect(dbHealth).toBeDefined();
      expect(dbHealth!.status).toBe('degraded');
      expect(dbHealth!.responseTime).toBeGreaterThan(200);
    });

    it('should report unhealthy database on query failure', async () => {
      mockDatabaseService.query.mockRejectedValue(new Error('Connection timeout'));

      const healthStatus = await healthChecker.performHealthCheck();
      
      const dbHealth = healthStatus.services.find(s => s.service === 'database');
      expect(dbHealth).toBeDefined();
      expect(dbHealth!.status).toBe('unhealthy');
      expect(dbHealth!.error).toContain('Connection timeout');
      expect(mockMetrics.setDatabaseConnections).toHaveBeenCalledWith('postgresql', 'main', 0);
    });

    it('should report degraded when database is not configured', async () => {
      const healthCheckerWithoutDb = new HealthChecker();
      
      const healthStatus = await healthCheckerWithoutDb.performHealthCheck();
      
      const dbHealth = healthStatus.services.find(s => s.service === 'database');
      expect(dbHealth).toBeDefined();
      expect(dbHealth!.status).toBe('degraded');
      expect(dbHealth!.details.message).toContain('Database service not configured');
    });
  });

  describe('InfluxDB Health Check', () => {
    it('should report healthy InfluxDB when query succeeds', async () => {
      const mockQueryApi = mockInfluxManager.getQueryApi();
      (mockQueryApi.queryRows as jest.Mock).mockImplementation((query: any, callbacks: any) => {
        callbacks.complete();
      });

      const healthStatus = await healthChecker.performHealthCheck();
      
      const influxHealth = healthStatus.services.find(s => s.service === 'influxdb');
      expect(influxHealth).toBeDefined();
      expect(influxHealth!.status).toBe('healthy');
      expect(influxHealth!.details.connected).toBe(true);
      expect(influxHealth!.details.queryExecuted).toBe(true);
    });

    it('should report degraded InfluxDB when response time is high', async () => {
      const mockQueryApi = mockInfluxManager.getQueryApi();
      (mockQueryApi.queryRows as jest.Mock).mockImplementation((query: any, callbacks: any) => {
        setTimeout(() => callbacks.complete(), 350);
      });

      const healthStatus = await healthChecker.performHealthCheck();
      
      const influxHealth = healthStatus.services.find(s => s.service === 'influxdb');
      expect(influxHealth).toBeDefined();
      expect(influxHealth!.status).toBe('degraded');
      expect(influxHealth!.responseTime).toBeGreaterThan(300);
    });

    it('should report unhealthy InfluxDB on query error', async () => {
      const mockQueryApi = mockInfluxManager.getQueryApi();
      (mockQueryApi.queryRows as jest.Mock).mockImplementation((query: any, callbacks: any) => {
        callbacks.error(new Error('Query failed'));
      });

      const healthStatus = await healthChecker.performHealthCheck();
      
      const influxHealth = healthStatus.services.find(s => s.service === 'influxdb');
      expect(influxHealth).toBeDefined();
      expect(influxHealth!.status).toBe('unhealthy');
      expect(influxHealth!.error).toContain('Query failed');
    });

    it('should report degraded when InfluxDB is not configured', async () => {
      const healthCheckerWithoutInflux = new HealthChecker();
      
      const healthStatus = await healthCheckerWithoutInflux.performHealthCheck();
      
      const influxHealth = healthStatus.services.find(s => s.service === 'influxdb');
      expect(influxHealth).toBeDefined();
      expect(influxHealth!.status).toBe('degraded');
      expect(influxHealth!.details.message).toContain('InfluxDB not configured');
    });
  });

  describe('Memory Health Check', () => {
    it('should report healthy memory when usage is low', async () => {
      // Mock process.memoryUsage to return low usage
      const originalMemoryUsage = process.memoryUsage;
      (process.memoryUsage as any) = jest.fn(() => ({
        heapUsed: 50 * 1024 * 1024, // 50MB
        heapTotal: 100 * 1024 * 1024, // 100MB
        external: 10 * 1024 * 1024,
        rss: 80 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024
      }));

      const healthStatus = await healthChecker.performHealthCheck();
      
      const memoryHealth = healthStatus.services.find(s => s.service === 'memory');
      expect(memoryHealth).toBeDefined();
      expect(memoryHealth!.status).toBe('healthy');
      expect(memoryHealth!.details.usagePercent).toBe(50);

      process.memoryUsage = originalMemoryUsage;
    });

    it('should report degraded memory when usage is high', async () => {
      const originalMemoryUsage = process.memoryUsage;
      (process.memoryUsage as any) = jest.fn(() => ({
        heapUsed: 80 * 1024 * 1024, // 80MB
        heapTotal: 100 * 1024 * 1024, // 100MB
        external: 10 * 1024 * 1024,
        rss: 120 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024
      }));

      const healthStatus = await healthChecker.performHealthCheck();
      
      const memoryHealth = healthStatus.services.find(s => s.service === 'memory');
      expect(memoryHealth).toBeDefined();
      expect(memoryHealth!.status).toBe('degraded');
      expect(memoryHealth!.details.usagePercent).toBe(80);

      process.memoryUsage = originalMemoryUsage;
    });

    it('should report unhealthy memory when usage is critical', async () => {
      const originalMemoryUsage = process.memoryUsage;
      (process.memoryUsage as any) = jest.fn(() => ({
        heapUsed: 95 * 1024 * 1024, // 95MB
        heapTotal: 100 * 1024 * 1024, // 100MB
        external: 10 * 1024 * 1024,
        rss: 150 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024
      }));

      const healthStatus = await healthChecker.performHealthCheck();
      
      const memoryHealth = healthStatus.services.find(s => s.service === 'memory');
      expect(memoryHealth).toBeDefined();
      expect(memoryHealth!.status).toBe('unhealthy');
      expect(memoryHealth!.details.usagePercent).toBe(95);

      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('CPU Health Check', () => {
    it('should report healthy CPU when load is low', async () => {
      const originalLoadavg = require('os').loadavg;
      require('os').loadavg = jest.fn().mockReturnValue([0.5, 0.7, 0.8]);

      const healthStatus = await healthChecker.performHealthCheck();
      
      const cpuHealth = healthStatus.services.find(s => s.service === 'cpu');
      expect(cpuHealth).toBeDefined();
      expect(cpuHealth!.status).toBe('healthy');
      expect(cpuHealth!.details.loadAverage).toEqual([0.5, 0.7, 0.8]);

      require('os').loadavg = originalLoadavg;
    });

    it('should report degraded CPU when load is moderate', async () => {
      const originalLoadavg = require('os').loadavg;
      require('os').loadavg = jest.fn().mockReturnValue([1.5, 1.3, 1.1]);

      const healthStatus = await healthChecker.performHealthCheck();
      
      const cpuHealth = healthStatus.services.find(s => s.service === 'cpu');
      expect(cpuHealth).toBeDefined();
      expect(cpuHealth!.status).toBe('degraded');

      require('os').loadavg = originalLoadavg;
    });

    it('should report unhealthy CPU when load is high', async () => {
      const originalLoadavg = require('os').loadavg;
      require('os').loadavg = jest.fn().mockReturnValue([3.0, 2.8, 2.5]);

      const healthStatus = await healthChecker.performHealthCheck();
      
      const cpuHealth = healthStatus.services.find(s => s.service === 'cpu');
      expect(cpuHealth).toBeDefined();
      expect(cpuHealth!.status).toBe('unhealthy');

      require('os').loadavg = originalLoadavg;
    });
  });

  describe('Overall Health Status', () => {
    it('should report overall healthy when all services are healthy', async () => {
      // Mock all services as healthy
      mockRedisCache.set.mockResolvedValue(true);
      mockRedisCache.get.mockImplementation((key) => Promise.resolve(key.replace('health_check_test', Date.now().toString())));
      mockDatabaseService.query.mockResolvedValue([{ health_check: 1 }]);
      
      const mockQueryApi = mockInfluxManager.getQueryApi();
      (mockQueryApi.queryRows as jest.Mock).mockImplementation((query: any, callbacks: any) => callbacks.complete());

      const healthStatus = await healthChecker.performHealthCheck();
      
      expect(healthStatus.overall).toBe('healthy');
      expect(healthStatus.services).toHaveLength(5);
      expect(healthStatus.uptime).toBeGreaterThan(0);
    });

    it('should report overall degraded when some services are degraded', async () => {
      // Mock Redis as degraded (not configured)
      const healthCheckerWithoutRedis = new HealthChecker(undefined, mockDatabaseService, mockInfluxManager);
      
      mockDatabaseService.query.mockResolvedValue([{ health_check: 1 }]);
      const mockQueryApi = mockInfluxManager.getQueryApi();
      (mockQueryApi.queryRows as jest.Mock).mockImplementation((query: any, callbacks: any) => callbacks.complete());

      const healthStatus = await healthCheckerWithoutRedis.performHealthCheck();
      
      expect(healthStatus.overall).toBe('degraded');
    });

    it('should report overall unhealthy when any service is unhealthy', async () => {
      mockRedisCache.set.mockRejectedValue(new Error('Redis down'));
      mockDatabaseService.query.mockResolvedValue([{ health_check: 1 }]);

      const healthStatus = await healthChecker.performHealthCheck();
      
      expect(healthStatus.overall).toBe('unhealthy');
    });
  });

  describe('Periodic Health Checks', () => {
    it('should start and stop periodic health checks', async () => {
      const performHealthCheckSpy = jest.spyOn(healthChecker, 'performHealthCheck');
      performHealthCheckSpy.mockResolvedValue({} as SystemHealthStatus);

      healthChecker.startPeriodicHealthChecks(100); // 100ms interval
      
      // Wait for at least one health check
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(performHealthCheckSpy).toHaveBeenCalled();
      
      healthChecker.stopPeriodicHealthChecks();
      
      const callCount = performHealthCheckSpy.mock.calls.length;
      
      // Wait a bit more and ensure no additional calls
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(performHealthCheckSpy.mock.calls.length).toBe(callCount);
      
      performHealthCheckSpy.mockRestore();
    });

    it('should handle errors in periodic health checks gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const performHealthCheckSpy = jest.spyOn(healthChecker, 'performHealthCheck');
      performHealthCheckSpy.mockRejectedValue(new Error('Health check failed'));

      healthChecker.startPeriodicHealthChecks(50);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(consoleSpy).toHaveBeenCalledWith('Health check failed:', expect.any(Error));
      
      healthChecker.stopPeriodicHealthChecks();
      consoleSpy.mockRestore();
      performHealthCheckSpy.mockRestore();
    });
  });

  describe('Prometheus Integration', () => {
    it('should update Prometheus metrics during health checks', async () => {
      mockRedisCache.set.mockResolvedValue(true);
      mockRedisCache.get.mockImplementation((key) => Promise.resolve(key.replace('health_check_test', Date.now().toString())));
      mockDatabaseService.query.mockResolvedValue([{ health_check: 1 }]);

      await healthChecker.performHealthCheck();

      expect(mockMetrics.setServiceHealth).toHaveBeenCalledWith('redis', 'main', true);
      expect(mockMetrics.setServiceHealth).toHaveBeenCalledWith('database', 'main', true);
      expect(mockMetrics.setServiceHealth).toHaveBeenCalledWith('influxdb', 'main', expect.any(Boolean));
      expect(mockMetrics.setServiceHealth).toHaveBeenCalledWith('memory', 'main', expect.any(Boolean));
      expect(mockMetrics.setServiceHealth).toHaveBeenCalledWith('cpu', 'main', expect.any(Boolean));
    });
  });
});
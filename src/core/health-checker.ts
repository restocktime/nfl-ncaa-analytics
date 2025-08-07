import { EventEmitter } from 'events';
import { PrometheusMetrics } from './prometheus-metrics';
import { RedisCache } from './redis-cache';
import { DatabaseService } from './database-service';
import { InfluxDBManager } from './influxdb-config';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  responseTime: number;
  details: Record<string, any>;
  error?: string;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  services: HealthCheckResult[];
  uptime: number;
}

/**
 * Service health checker with detailed status reporting
 * Monitors all critical system components and reports to Prometheus
 */
export class HealthChecker extends EventEmitter {
  private readonly metrics: PrometheusMetrics;
  private readonly startTime: Date;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(
    private readonly redisCache?: RedisCache,
    private readonly databaseService?: DatabaseService,
    private readonly influxManager?: InfluxDBManager
  ) {
    super();
    this.metrics = PrometheusMetrics.getInstance();
    this.startTime = new Date();
  }

  /**
   * Start periodic health checks
   */
  public startPeriodicHealthChecks(intervalMs: number = 30000): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop periodic health checks
   */
  public stopPeriodicHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Perform comprehensive health check
   */
  public async performHealthCheck(): Promise<SystemHealthStatus> {
    const healthChecks: Promise<HealthCheckResult>[] = [
      this.checkRedisHealth(),
      this.checkDatabaseHealth(),
      this.checkInfluxDBHealth(),
      this.checkMemoryHealth(),
      this.checkCPUHealth()
    ];

    const results = await Promise.allSettled(healthChecks);
    const services: HealthCheckResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          service: ['redis', 'database', 'influxdb', 'memory', 'cpu'][index],
          status: 'unhealthy' as const,
          timestamp: new Date(),
          responseTime: 0,
          details: {},
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    // Update Prometheus metrics
    services.forEach(service => {
      this.metrics.setServiceHealth(
        service.service,
        'main',
        service.status === 'healthy'
      );
    });

    // Determine overall health
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    
    let overall: 'healthy' | 'unhealthy' | 'degraded';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    const healthStatus = {
      overall,
      timestamp: new Date(),
      services,
      uptime: Date.now() - this.startTime.getTime()
    };

    // Emit health check completed event
    this.emit('healthCheckCompleted', healthStatus);

    return healthStatus;
  }

  /**
   * Check Redis cache health
   */
  private async checkRedisHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      if (!this.redisCache) {
        return {
          service: 'redis',
          status: 'degraded',
          timestamp: new Date(),
          responseTime: 0,
          details: { message: 'Redis cache not configured' }
        };
      }

      // Test Redis connectivity with a simple ping
      const testKey = 'health_check_test';
      const testValue = Date.now().toString();
      
      await this.redisCache.set(testKey, testValue, { ttl: 10 }); // 10 second TTL
      const retrievedValue = await this.redisCache.get(testKey);
      
      if (retrievedValue !== testValue) {
        throw new Error('Redis read/write test failed');
      }

      const responseTime = Date.now() - start;
      
      return {
        service: 'redis',
        status: responseTime < 100 ? 'healthy' : 'degraded',
        timestamp: new Date(),
        responseTime,
        details: {
          connected: true,
          responseTimeMs: responseTime
        }
      };
    } catch (error) {
      return {
        service: 'redis',
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - start,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown Redis error'
      };
    }
  }

  /**
   * Check PostgreSQL database health
   */
  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      if (!this.databaseService) {
        return {
          service: 'database',
          status: 'degraded',
          timestamp: new Date(),
          responseTime: 0,
          details: { message: 'Database service not configured' }
        };
      }

      // Test database connectivity with a simple query
      const result = await this.databaseService.query('SELECT 1 as health_check');
      
      if (!result || result.length === 0) {
        throw new Error('Database health check query failed');
      }

      const responseTime = Date.now() - start;
      
      // Update database connection metrics
      this.metrics.setDatabaseConnections('postgresql', 'main', 1);
      
      return {
        service: 'database',
        status: responseTime < 200 ? 'healthy' : 'degraded',
        timestamp: new Date(),
        responseTime,
        details: {
          connected: true,
          responseTimeMs: responseTime,
          queryResult: result[0]
        }
      };
    } catch (error) {
      this.metrics.setDatabaseConnections('postgresql', 'main', 0);
      
      return {
        service: 'database',
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - start,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  /**
   * Check InfluxDB health
   */
  private async checkInfluxDBHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      if (!this.influxManager) {
        return {
          service: 'influxdb',
          status: 'degraded',
          timestamp: new Date(),
          responseTime: 0,
          details: { message: 'InfluxDB not configured' }
        };
      }

      // Test InfluxDB connectivity
      const queryApi = this.influxManager.getQueryApi();
      
      // Simple health check query
      const query = `from(bucket: "${this.influxManager.config.bucket}") |> range(start: -1m) |> limit(n: 1)`;
      
      const result = await new Promise((resolve, reject) => {
        const results: any[] = [];
        queryApi.queryRows(query, {
          next: (row, tableMeta) => {
            results.push(tableMeta.toObject(row));
          },
          error: (error) => reject(error),
          complete: () => resolve(results)
        });
      });

      const responseTime = Date.now() - start;
      
      return {
        service: 'influxdb',
        status: responseTime < 300 ? 'healthy' : 'degraded',
        timestamp: new Date(),
        responseTime,
        details: {
          connected: true,
          responseTimeMs: responseTime,
          queryExecuted: true
        }
      };
    } catch (error) {
      return {
        service: 'influxdb',
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - start,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown InfluxDB error'
      };
    }
  }

  /**
   * Check memory health
   */
  private async checkMemoryHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (memoryUsagePercent < 70) {
        status = 'healthy';
      } else if (memoryUsagePercent < 90) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        service: 'memory',
        status,
        timestamp: new Date(),
        responseTime: Date.now() - start,
        details: {
          heapUsed: usedMemory,
          heapTotal: totalMemory,
          usagePercent: memoryUsagePercent,
          external: memUsage.external,
          rss: memUsage.rss
        }
      };
    } catch (error) {
      return {
        service: 'memory',
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - start,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown memory error'
      };
    }
  }

  /**
   * Check CPU health
   */
  private async checkCPUHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // Simple CPU load test
      const cpuUsage = process.cpuUsage();
      const loadAverage = require('os').loadavg();
      
      // Calculate CPU usage percentage (simplified)
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (loadAverage[0] < 1.0) {
        status = 'healthy';
      } else if (loadAverage[0] < 2.0) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        service: 'cpu',
        status,
        timestamp: new Date(),
        responseTime: Date.now() - start,
        details: {
          loadAverage: loadAverage,
          cpuUsage: cpuUsage,
          cpuPercent
        }
      };
    } catch (error) {
      return {
        service: 'cpu',
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - start,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown CPU error'
      };
    }
  }

  /**
   * Get current system health status
   */
  public async getHealthStatus(): Promise<SystemHealthStatus> {
    return this.performHealthCheck();
  }
}
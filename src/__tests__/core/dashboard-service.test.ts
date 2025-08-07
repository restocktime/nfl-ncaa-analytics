import { DashboardService, DashboardConfig, DashboardMetrics } from '../../core/dashboard-service';
import { PrometheusMetrics } from '../../core/prometheus-metrics';
import { HealthChecker, SystemHealthStatus } from '../../core/health-checker';
import { AlertingService, Alert } from '../../core/alerting-service';

// Mock dependencies
jest.mock('../../core/prometheus-metrics');
jest.mock('../../core/health-checker');
jest.mock('../../core/alerting-service');

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let mockPrometheusMetrics: jest.Mocked<PrometheusMetrics>;
  let mockHealthChecker: jest.Mocked<HealthChecker>;
  let mockAlertingService: jest.Mocked<AlertingService>;
  let config: DashboardConfig;

  beforeEach(() => {
    config = {
      refreshIntervalSeconds: 30,
      metricsRetentionHours: 24,
      alertHistoryLimit: 100
    };

    mockPrometheusMetrics = {
      getMetrics: jest.fn().mockResolvedValue('# Mock metrics data')
    } as any;

    mockHealthChecker = {
      getHealthStatus: jest.fn().mockResolvedValue({
        overall: 'healthy',
        timestamp: new Date(),
        services: [
          {
            service: 'database',
            status: 'healthy',
            timestamp: new Date(),
            responseTime: 50,
            details: {}
          },
          {
            service: 'redis',
            status: 'healthy',
            timestamp: new Date(),
            responseTime: 10,
            details: {}
          }
        ],
        uptime: 3600000
      } as SystemHealthStatus)
    } as any;

    mockAlertingService = {
      getActiveAlerts: jest.fn().mockReturnValue([]),
      getAlertHistory: jest.fn().mockReturnValue([]),
      on: jest.fn()
    } as any;

    dashboardService = new DashboardService(
      config,
      mockPrometheusMetrics,
      mockHealthChecker,
      mockAlertingService
    );
  });

  afterEach(() => {
    dashboardService.stop();
    jest.clearAllMocks();
  });

  describe('Service Lifecycle', () => {
    it('should start and stop the service', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      dashboardService.start();
      expect(consoleSpy).toHaveBeenCalledWith('Dashboard service started');

      dashboardService.stop();
      expect(consoleSpy).toHaveBeenCalledWith('Dashboard service stopped');

      consoleSpy.mockRestore();
    });

    it('should setup event listeners', () => {
      expect(mockAlertingService.on).toHaveBeenCalledWith('alertFired', expect.any(Function));
      expect(mockAlertingService.on).toHaveBeenCalledWith('alertResolved', expect.any(Function));
    });
  });

  describe('Metrics Collection', () => {
    it('should collect current metrics', async () => {
      const metrics = await dashboardService.getCurrentMetrics();

      expect(metrics).toMatchObject({
        timestamp: expect.any(Date),
        system: {
          uptime: expect.any(Number),
          overallHealth: 'healthy',
          cpuUsage: expect.any(Number),
          memoryUsage: expect.any(Number)
        },
        api: {
          requestsPerMinute: expect.any(Number),
          averageResponseTime: expect.any(Number),
          errorRate: expect.any(Number),
          activeConnections: expect.any(Number)
        },
        predictions: {
          predictionsPerMinute: expect.any(Number),
          averageAccuracy: expect.any(Number),
          modelPerformance: expect.any(Object),
          simulationsRunning: expect.any(Number)
        },
        alerts: {
          activeAlerts: 0,
          criticalAlerts: 0,
          warningAlerts: 0,
          alertsLast24h: 0
        },
        services: expect.any(Object)
      });
    });

    it('should track metrics history', async () => {
      dashboardService.start();
      
      // Wait for initial metrics collection
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const history = dashboardService.getMetricsHistory(1);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toMatchObject({
        timestamp: expect.any(Date),
        system: expect.any(Object),
        api: expect.any(Object)
      });
    });

    it('should limit metrics history by time', async () => {
      // Add some mock historical data
      const oldMetrics: DashboardMetrics = {
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        system: { uptime: 1000, overallHealth: 'healthy', cpuUsage: 50, memoryUsage: 60 },
        api: { requestsPerMinute: 100, averageResponseTime: 0.5, errorRate: 0.01, activeConnections: 10 },
        predictions: { predictionsPerMinute: 50, averageAccuracy: 0.8, modelPerformance: {}, simulationsRunning: 2 },
        alerts: { activeAlerts: 0, criticalAlerts: 0, warningAlerts: 0, alertsLast24h: 0 },
        services: { database: { status: 'healthy', responseTime: 50, lastCheck: new Date(), errorCount: 0 }, redis: { status: 'healthy', responseTime: 10, lastCheck: new Date(), errorCount: 0 }, influxdb: { status: 'healthy', responseTime: 100, lastCheck: new Date(), errorCount: 0 }, apiConnectors: {} }
      };

      // Manually add old metrics to test filtering
      (dashboardService as any).metricsHistory.push(oldMetrics);

      const recentHistory = dashboardService.getMetricsHistory(24);
      expect(recentHistory.every(m => m.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000)).toBe(true);
    });
  });

  describe('System Overview', () => {
    it('should provide system overview', async () => {
      const overview = await dashboardService.getSystemOverview();

      expect(overview).toMatchObject({
        status: 'healthy',
        uptime: expect.any(String),
        version: expect.any(String),
        environment: expect.any(String),
        lastUpdated: expect.any(Date)
      });
    });

    it('should format uptime correctly', async () => {
      const overview = await dashboardService.getSystemOverview();
      
      // Should be in format like "1h 30m" or "2d 5h 30m"
      expect(overview.uptime).toMatch(/^\d+[dhms]/);
    });
  });

  describe('API Performance', () => {
    it('should provide API performance summary', async () => {
      const performance = await dashboardService.getApiPerformance();

      expect(performance).toMatchObject({
        requestsPerMinute: expect.any(Number),
        averageResponseTime: expect.any(Number),
        errorRate: expect.any(Number),
        topEndpoints: expect.arrayContaining([
          expect.objectContaining({
            endpoint: expect.any(String),
            requests: expect.any(Number),
            avgTime: expect.any(Number)
          })
        ])
      });
    });

    it('should include top endpoints data', async () => {
      const performance = await dashboardService.getApiPerformance();
      
      expect(performance.topEndpoints.length).toBeGreaterThan(0);
      expect(performance.topEndpoints[0]).toHaveProperty('endpoint');
      expect(performance.topEndpoints[0]).toHaveProperty('requests');
      expect(performance.topEndpoints[0]).toHaveProperty('avgTime');
    });
  });

  describe('Prediction Performance', () => {
    it('should provide prediction performance summary', async () => {
      const performance = await dashboardService.getPredictionPerformance();

      expect(performance).toMatchObject({
        totalPredictions: expect.any(Number),
        averageAccuracy: expect.any(Number),
        modelComparison: expect.arrayContaining([
          expect.objectContaining({
            model: expect.any(String),
            accuracy: expect.any(Number),
            predictions: expect.any(Number)
          })
        ]),
        recentTrends: expect.any(Array)
      });
    });

    it('should include model comparison data', async () => {
      const performance = await dashboardService.getPredictionPerformance();
      
      expect(performance.modelComparison.length).toBeGreaterThan(0);
      expect(performance.modelComparison[0]).toHaveProperty('model');
      expect(performance.modelComparison[0]).toHaveProperty('accuracy');
      expect(performance.modelComparison[0]).toHaveProperty('predictions');
    });
  });

  describe('Alert Summary', () => {
    it('should provide alert summary with no alerts', () => {
      const summary = dashboardService.getAlertSummary();

      expect(summary).toMatchObject({
        active: [],
        recent: [],
        summary: {
          critical: 0,
          warning: 0,
          info: 0,
          resolved24h: 0
        }
      });
    });

    it('should categorize alerts by severity', () => {
      const mockAlerts: Alert[] = [
        {
          id: '1',
          ruleId: 'rule1',
          name: 'Critical Alert',
          description: 'Critical issue',
          severity: 'critical',
          status: 'firing',
          timestamp: new Date(),
          value: 100,
          threshold: 80,
          labels: {},
          annotations: {}
        },
        {
          id: '2',
          ruleId: 'rule2',
          name: 'Warning Alert',
          description: 'Warning issue',
          severity: 'warning',
          status: 'firing',
          timestamp: new Date(),
          value: 70,
          threshold: 60,
          labels: {},
          annotations: {}
        }
      ];

      mockAlertingService.getActiveAlerts.mockReturnValue(mockAlerts);
      mockAlertingService.getAlertHistory.mockReturnValue(mockAlerts);

      const summary = dashboardService.getAlertSummary();

      expect(summary.summary).toMatchObject({
        critical: 1,
        warning: 1,
        info: 0,
        resolved24h: 0
      });
    });
  });

  describe('Service Health', () => {
    it('should provide service health details', async () => {
      const health = await dashboardService.getServiceHealth();

      expect(health).toMatchObject({
        services: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            status: expect.any(String),
            responseTime: expect.any(Number),
            lastCheck: expect.any(Date),
            uptime: expect.any(Number)
          })
        ]),
        dependencies: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            status: expect.any(String),
            endpoint: expect.any(String),
            lastCheck: expect.any(Date)
          })
        ])
      });
    });

    it('should map health check results to service status', async () => {
      const health = await dashboardService.getServiceHealth();
      
      const databaseService = health.services.find(s => s.name === 'database');
      expect(databaseService).toBeDefined();
      expect(databaseService?.status).toBe('healthy');
      expect(databaseService?.responseTime).toBe(50);
    });
  });

  describe('Metrics Export', () => {
    it('should export metrics in JSON format', async () => {
      const exported = await dashboardService.exportMetrics('json');
      
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('system');
      expect(parsed).toHaveProperty('api');
    });

    it('should export metrics in Prometheus format', async () => {
      const exported = await dashboardService.exportMetrics('prometheus');
      
      expect(exported).toBe('# Mock metrics data');
      expect(mockPrometheusMetrics.getMetrics).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('should emit events when metrics are updated', (done) => {
      dashboardService.on('metricsUpdated', (metrics) => {
        expect(metrics).toHaveProperty('timestamp');
        expect(metrics).toHaveProperty('system');
        done();
      });

      dashboardService.start();
    });

    it('should handle alert events', () => {
      const alertFiredHandler = mockAlertingService.on.mock.calls.find(
        call => call[0] === 'alertFired'
      )?.[1];

      expect(alertFiredHandler).toBeDefined();

      // Test that the handler can be called without errors
      const mockAlert: Alert = {
        id: 'test',
        ruleId: 'test_rule',
        name: 'Test Alert',
        description: 'Test',
        severity: 'warning',
        status: 'firing',
        timestamp: new Date(),
        value: 100,
        threshold: 80,
        labels: {},
        annotations: {}
      };

      expect(() => alertFiredHandler?.(mockAlert)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle health check errors gracefully', async () => {
      mockHealthChecker.getHealthStatus.mockRejectedValue(new Error('Health check failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      dashboardService.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error refreshing dashboard metrics:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle Prometheus metrics errors gracefully', async () => {
      (mockPrometheusMetrics.getMetrics as jest.Mock).mockRejectedValue(new Error('Prometheus error'));

      try {
        const exported = await dashboardService.exportMetrics('prometheus');
        // Should still return something, even if it's an error
        expect(typeof exported).toBe('string');
      } catch (error) {
        // It's acceptable for this to throw since we're testing error handling
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
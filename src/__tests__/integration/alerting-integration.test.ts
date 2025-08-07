import { AlertingManager, AlertingManagerConfig } from '../../core/alerting-manager';
import { PrometheusMetrics } from '../../core/prometheus-metrics';
import { HealthChecker } from '../../core/health-checker';
import { Alert, AlertRule } from '../../core/alerting-service';

// Mock external dependencies
jest.mock('nodemailer');
jest.mock('axios');

describe('Alerting Integration Tests', () => {
  let alertingManager: AlertingManager;
  let mockPrometheusMetrics: PrometheusMetrics;
  let mockHealthChecker: HealthChecker;
  let config: AlertingManagerConfig;

  beforeEach(() => {
    config = {
      alerting: {
        evaluationIntervalSeconds: 1, // Fast evaluation for testing
        defaultCooldownMinutes: 0, // No cooldown for testing
        maxAlertsPerRule: 10
      },
      dashboard: {
        refreshIntervalSeconds: 1,
        metricsRetentionHours: 1,
        alertHistoryLimit: 50
      },
      notifications: {
        email: {
          host: 'smtp.test.com',
          port: 587,
          secure: false,
          auth: { user: 'test@test.com', pass: 'password' },
          from: 'alerts@test.com',
          to: ['admin@test.com']
        },
        slack: {
          webhookUrl: 'https://hooks.slack.com/test',
          channel: '#alerts'
        }
      }
    };

    mockPrometheusMetrics = {
      getMetrics: jest.fn()
    } as any;

    (mockPrometheusMetrics.getMetrics as jest.Mock).mockResolvedValue(`
      # HELP http_request_errors_total Total HTTP errors
      # TYPE http_request_errors_total counter
      http_request_errors_total 10
      # HELP prediction_accuracy_ratio Prediction accuracy
      # TYPE prediction_accuracy_ratio gauge
      prediction_accuracy_ratio 0.65
    `);

    mockHealthChecker = {
      startPeriodicHealthChecks: jest.fn(),
      stopPeriodicHealthChecks: jest.fn(),
      getHealthStatus: jest.fn(),
      on: jest.fn()
    } as any;

    (mockHealthChecker.getHealthStatus as jest.Mock).mockResolvedValue({
      overall: 'healthy',
      timestamp: new Date(),
      services: [],
      uptime: 3600000
    });

    alertingManager = new AlertingManager(
      config,
      mockPrometheusMetrics,
      mockHealthChecker
    );
  });

  afterEach(async () => {
    await alertingManager.stop();
    jest.clearAllMocks();
  });

  describe('End-to-End Alert Flow', () => {
    it('should trigger, process, and resolve alerts end-to-end', async () => {
      const alertFiredEvents: Alert[] = [];
      const alertResolvedEvents: Alert[] = [];

      // Setup event listeners
      const alertingService = alertingManager.getAlertingService();
      alertingService.on('alertFired', (alert: Alert) => {
        alertFiredEvents.push(alert);
      });
      alertingService.on('alertResolved', (alert: Alert) => {
        alertResolvedEvents.push(alert);
      });

      // Start the alerting manager
      await alertingManager.start();

      // Trigger a test alert
      await alertingManager.triggerTestAlert('warning');

      // Wait for alert processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify alert was fired
      expect(alertFiredEvents.length).toBe(1);
      expect(alertFiredEvents[0]).toMatchObject({
        name: 'Test Alert',
        severity: 'warning',
        status: 'firing'
      });

      // Resolve the alert
      const alertId = alertFiredEvents[0].id;
      alertingService.resolveAlert(alertId);

      // Wait for resolution processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify alert was resolved
      expect(alertResolvedEvents.length).toBe(1);
      expect(alertResolvedEvents[0]).toMatchObject({
        id: alertId,
        status: 'resolved',
        resolvedAt: expect.any(Date)
      });
    });

    it('should handle multiple simultaneous alerts', async () => {
      const alertingService = alertingManager.getAlertingService();
      const alertFiredEvents: Alert[] = [];

      alertingService.on('alertFired', (alert: Alert) => {
        alertFiredEvents.push(alert);
      });

      await alertingManager.start();

      // Trigger multiple alerts simultaneously
      const alertPromises = [
        alertingManager.triggerTestAlert('critical'),
        alertingManager.triggerTestAlert('warning'),
        alertingManager.triggerTestAlert('info')
      ];

      await Promise.all(alertPromises);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify all alerts were fired
      expect(alertFiredEvents.length).toBe(3);
      
      const severities = alertFiredEvents.map(a => a.severity);
      expect(severities).toContain('critical');
      expect(severities).toContain('warning');
      expect(severities).toContain('info');
    });
  });

  describe('Notification Integration', () => {
    it('should send notifications through multiple channels', async () => {
      const notificationManager = alertingManager.getNotificationManager();
      
      // Mock the axios and nodemailer calls
      const axios = require('axios');
      const nodemailer = require('nodemailer');
      
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test' }),
        verify: jest.fn().mockResolvedValue(true)
      };
      nodemailer.createTransport.mockReturnValue(mockTransporter);
      axios.post.mockResolvedValue({ status: 200 });

      await alertingManager.start();

      // Create a test alert
      const testAlert: Alert = {
        id: 'integration_test_alert',
        ruleId: 'test_rule',
        name: 'Integration Test Alert',
        description: 'Testing notification integration',
        severity: 'warning',
        status: 'firing',
        timestamp: new Date(),
        value: 85,
        threshold: 80,
        labels: { test: 'integration' },
        annotations: { summary: 'Test alert for integration testing' }
      };

      // Send alert to multiple channels
      await notificationManager.sendAlert(testAlert, ['email', 'slack']);

      // Verify email was sent
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Integration Test Alert'),
          html: expect.stringContaining('Testing notification integration')
        })
      );

      // Verify Slack message was sent
      expect(axios.post).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          text: expect.stringContaining('WARNING Alert'),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              title: 'Integration Test Alert'
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it('should test all notification channels', async () => {
      const axios = require('axios');
      const nodemailer = require('nodemailer');
      
      const mockTransporter = {
        verify: jest.fn().mockResolvedValue(true)
      };
      nodemailer.createTransport.mockReturnValue(mockTransporter);
      axios.post.mockResolvedValue({ status: 200 });

      await alertingManager.start();

      const notificationManager = alertingManager.getNotificationManager();
      const testResults = await notificationManager.testAllChannels();

      expect(testResults).toEqual({
        email: true,
        slack: true
      });

      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          text: 'Test notification from Football Analytics System'
        })
      );
    });
  });

  describe('Dashboard Integration', () => {
    it('should provide real-time system metrics', async () => {
      await alertingManager.start();

      const dashboardService = alertingManager.getDashboardService();
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
          activeAlerts: expect.any(Number),
          criticalAlerts: expect.any(Number),
          warningAlerts: expect.any(Number),
          alertsLast24h: expect.any(Number)
        }
      });
    });

    it('should track alert metrics in dashboard', async () => {
      await alertingManager.start();

      const alertingService = alertingManager.getAlertingService();
      const dashboardService = alertingManager.getDashboardService();

      // Trigger some alerts
      await alertingManager.triggerTestAlert('critical');
      await alertingManager.triggerTestAlert('warning');

      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = await dashboardService.getCurrentMetrics();
      
      expect(metrics.alerts.activeAlerts).toBe(2);
      expect(metrics.alerts.criticalAlerts).toBe(1);
      expect(metrics.alerts.warningAlerts).toBe(1);
    });

    it('should provide system health summary', async () => {
      await alertingManager.start();

      const healthSummary = await alertingManager.getSystemHealthSummary();

      expect(healthSummary).toMatchObject({
        overall: 'healthy',
        services: expect.any(Number),
        alerts: expect.any(Number),
        uptime: expect.any(String)
      });
    });
  });

  describe('Custom Alert Rules', () => {
    it('should support custom alert rules', async () => {
      const customRule: AlertRule = {
        id: 'custom_integration_test',
        name: 'Custom Integration Test Rule',
        description: 'Custom rule for integration testing',
        condition: {
          metric: 'custom_metric',
          operator: 'gt',
          threshold: 50
        },
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 0,
        notificationChannels: ['email']
      };

      await alertingManager.start();

      // Add custom rule
      alertingManager.addAlertRule(customRule);

      // Verify rule was added
      const alertingService = alertingManager.getAlertingService();
      const rules = alertingService.getAllRules();
      
      expect(rules).toContainEqual(customRule);

      // Trigger the custom rule
      const alertFiredEvents: Alert[] = [];
      alertingService.on('alertFired', (alert: Alert) => {
        alertFiredEvents.push(alert);
      });

      alertingService.triggerAlert('custom_integration_test', 75);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(alertFiredEvents.length).toBe(1);
      expect(alertFiredEvents[0]).toMatchObject({
        ruleId: 'custom_integration_test',
        name: 'Custom Integration Test Rule',
        value: 75
      });
    });

    it('should remove custom alert rules', async () => {
      const customRule: AlertRule = {
        id: 'removable_integration_test',
        name: 'Removable Integration Test Rule',
        description: 'Rule to be removed in integration test',
        condition: {
          metric: 'removable_metric',
          operator: 'lt',
          threshold: 10
        },
        severity: 'info',
        enabled: true,
        cooldownMinutes: 0,
        notificationChannels: ['slack']
      };

      await alertingManager.start();

      // Add and then remove rule
      alertingManager.addAlertRule(customRule);
      const removed = alertingManager.removeAlertRule('removable_integration_test');

      expect(removed).toBe(true);

      // Verify rule was removed
      const alertingService = alertingManager.getAlertingService();
      const rules = alertingService.getAllRules();
      
      expect(rules.some(r => r.id === 'removable_integration_test')).toBe(false);
    });
  });

  describe('Data Export', () => {
    it('should export monitoring data', async () => {
      await alertingManager.start();

      // Trigger some alerts for data
      await alertingManager.triggerTestAlert('warning');
      await new Promise(resolve => setTimeout(resolve, 100));

      const exportedData = await alertingManager.exportMonitoringData();

      expect(exportedData).toMatchObject({
        metrics: expect.any(String),
        alerts: expect.any(Array),
        health: expect.any(Object),
        timestamp: expect.any(Date)
      });

      // Verify metrics is valid JSON
      expect(() => JSON.parse(exportedData.metrics)).not.toThrow();

      // Verify alerts array contains our test alert
      expect(exportedData.alerts.length).toBeGreaterThan(0);
      expect(exportedData.alerts[0]).toMatchObject({
        name: 'Test Alert',
        severity: 'warning'
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle notification failures gracefully', async () => {
      // Mock notification failures
      const axios = require('axios');
      const nodemailer = require('nodemailer');
      
      const mockTransporter = {
        sendMail: jest.fn().mockRejectedValue(new Error('SMTP error')),
        verify: jest.fn().mockResolvedValue(true)
      };
      nodemailer.createTransport.mockReturnValue(mockTransporter);
      axios.post.mockRejectedValue(new Error('Slack webhook error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await alertingManager.start();

      // Trigger alert that will fail to send notifications
      await alertingManager.triggerTestAlert('warning');
      await new Promise(resolve => setTimeout(resolve, 100));

      // System should continue operating despite notification failures
      const activeAlerts = alertingManager.getActiveAlerts();
      expect(activeAlerts.length).toBe(1);

      // Should log errors but not crash
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle health check failures gracefully', async () => {
      // Mock health check failure
      (mockHealthChecker.getHealthStatus as jest.Mock).mockRejectedValue(new Error('Health check failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await alertingManager.start();

      // Wait for health check attempt
      await new Promise(resolve => setTimeout(resolve, 100));

      // System should continue operating
      const healthSummary = await alertingManager.getSystemHealthSummary();
      expect(healthSummary).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should handle Prometheus metrics failures gracefully', async () => {
      // Mock Prometheus failure
      (mockPrometheusMetrics.getMetrics as jest.Mock).mockRejectedValue(new Error('Prometheus unavailable'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await alertingManager.start();

      // Wait for metrics collection attempt
      await new Promise(resolve => setTimeout(resolve, 100));

      // System should continue operating
      const dashboardService = alertingManager.getDashboardService();
      const metrics = await dashboardService.getCurrentMetrics();
      expect(metrics).toBeDefined();

      consoleSpy.mockRestore();
    });
  });
});
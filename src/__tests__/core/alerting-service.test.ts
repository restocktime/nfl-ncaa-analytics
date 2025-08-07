import { AlertingService, AlertRule, Alert, AlertingConfig } from '../../core/alerting-service';
import { PrometheusMetrics } from '../../core/prometheus-metrics';
import { HealthChecker } from '../../core/health-checker';

// Mock dependencies
jest.mock('../../core/prometheus-metrics');
jest.mock('../../core/health-checker');

describe('AlertingService', () => {
  let alertingService: AlertingService;
  let mockMetrics: jest.Mocked<PrometheusMetrics>;
  let mockHealthChecker: jest.Mocked<HealthChecker>;
  let config: AlertingConfig;

  beforeEach(() => {
    config = {
      evaluationIntervalSeconds: 30,
      defaultCooldownMinutes: 15,
      maxAlertsPerRule: 10
    };

    mockMetrics = {
      getMetrics: jest.fn()
    } as any;

    mockHealthChecker = {
      on: jest.fn(),
      getHealthStatus: jest.fn(),
      startPeriodicHealthChecks: jest.fn(),
      stopPeriodicHealthChecks: jest.fn()
    } as any;

    alertingService = new AlertingService(config, mockMetrics, mockHealthChecker);
  });

  afterEach(() => {
    alertingService.stop();
    jest.clearAllMocks();
  });

  describe('Rule Management', () => {
    it('should add custom alert rules', () => {
      const customRule: AlertRule = {
        id: 'custom_test',
        name: 'Custom Test Rule',
        description: 'Test rule for unit testing',
        condition: {
          metric: 'test_metric',
          operator: 'gt',
          threshold: 100
        },
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 10,
        notificationChannels: ['email']
      };

      alertingService.addRule(customRule);
      const rules = alertingService.getAllRules();
      
      expect(rules).toContainEqual(customRule);
    });

    it('should remove alert rules', () => {
      const customRule: AlertRule = {
        id: 'removable_rule',
        name: 'Removable Rule',
        description: 'Rule to be removed',
        condition: {
          metric: 'test_metric',
          operator: 'lt',
          threshold: 50
        },
        severity: 'info',
        enabled: true,
        cooldownMinutes: 5,
        notificationChannels: ['slack']
      };

      alertingService.addRule(customRule);
      expect(alertingService.getAllRules().some(r => r.id === 'removable_rule')).toBe(true);

      const removed = alertingService.removeRule('removable_rule');
      expect(removed).toBe(true);
      expect(alertingService.getAllRules().some(r => r.id === 'removable_rule')).toBe(false);
    });

    it('should return false when removing non-existent rule', () => {
      const removed = alertingService.removeRule('non_existent_rule');
      expect(removed).toBe(false);
    });

    it('should have default alert rules', () => {
      const rules = alertingService.getAllRules();
      
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some(r => r.id === 'high_error_rate')).toBe(true);
      expect(rules.some(r => r.id === 'prediction_accuracy_low')).toBe(true);
      expect(rules.some(r => r.id === 'service_unhealthy')).toBe(true);
    });
  });

  describe('Alert Triggering', () => {
    it('should trigger alerts manually', () => {
      const alertFiredSpy = jest.fn();
      alertingService.on('alertFired', alertFiredSpy);

      alertingService.triggerAlert('high_error_rate', 0.1, { test: 'true' });

      expect(alertFiredSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          ruleId: 'high_error_rate',
          value: 0.1,
          status: 'firing'
        })
      );
    });

    it('should throw error when triggering non-existent rule', () => {
      expect(() => {
        alertingService.triggerAlert('non_existent_rule', 100);
      }).toThrow('Alert rule not found: non_existent_rule');
    });

    it('should create alert with correct properties', () => {
      const alertFiredSpy = jest.fn();
      alertingService.on('alertFired', alertFiredSpy);

      const labels = { service: 'test', instance: 'main' };
      alertingService.triggerAlert('high_error_rate', 0.08, labels);

      const firedAlert = alertFiredSpy.mock.calls[0][0] as Alert;
      
      expect(firedAlert).toMatchObject({
        ruleId: 'high_error_rate',
        name: 'High HTTP Error Rate',
        severity: 'critical',
        status: 'firing',
        value: 0.08,
        threshold: 0.05,
        labels
      });
      expect(firedAlert.id).toBeDefined();
      expect(firedAlert.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Alert Resolution', () => {
    it('should resolve active alerts', () => {
      const alertResolvedSpy = jest.fn();
      alertingService.on('alertResolved', alertResolvedSpy);

      // First trigger an alert
      alertingService.triggerAlert('high_error_rate', 0.1);
      const activeAlerts = alertingService.getActiveAlerts();
      expect(activeAlerts.length).toBe(1);

      // Then resolve it
      const alertId = activeAlerts[0].id;
      const resolved = alertingService.resolveAlert(alertId);

      expect(resolved).toBe(true);
      expect(alertResolvedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: alertId,
          status: 'resolved',
          resolvedAt: expect.any(Date)
        })
      );
    });

    it('should return false when resolving non-existent alert', () => {
      const resolved = alertingService.resolveAlert('non_existent_alert');
      expect(resolved).toBe(false);
    });

    it('should return false when resolving already resolved alert', () => {
      // Trigger and resolve an alert
      alertingService.triggerAlert('high_error_rate', 0.1);
      const alertId = alertingService.getActiveAlerts()[0].id;
      alertingService.resolveAlert(alertId);

      // Try to resolve again
      const resolved = alertingService.resolveAlert(alertId);
      expect(resolved).toBe(false);
    });
  });

  describe('Alert History', () => {
    it('should track alert history', () => {
      alertingService.triggerAlert('high_error_rate', 0.1);
      alertingService.triggerAlert('prediction_accuracy_low', 0.6);

      const history = alertingService.getAlertHistory();
      expect(history.length).toBe(2);
      
      // Should be sorted by timestamp (newest first)
      expect(history[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        history[1].timestamp.getTime()
      );
    });

    it('should limit alert history', () => {
      // Trigger multiple alerts
      for (let i = 0; i < 5; i++) {
        alertingService.triggerAlert('high_error_rate', 0.1 + i * 0.01);
      }

      const limitedHistory = alertingService.getAlertHistory(3);
      expect(limitedHistory.length).toBe(3);
    });

    it('should get active alerts only', () => {
      // Trigger some alerts
      alertingService.triggerAlert('high_error_rate', 0.1);
      alertingService.triggerAlert('prediction_accuracy_low', 0.6);
      
      const activeAlerts = alertingService.getActiveAlerts();
      expect(activeAlerts.length).toBe(2);
      expect(activeAlerts.every(a => a.status === 'firing')).toBe(true);

      // Resolve one alert
      alertingService.resolveAlert(activeAlerts[0].id);
      
      const remainingActive = alertingService.getActiveAlerts();
      expect(remainingActive.length).toBe(1);
      expect(remainingActive[0].status).toBe('firing');
    });
  });

  describe('Service Lifecycle', () => {
    it('should start and stop the service', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      alertingService.start();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Alerting service started')
      );

      alertingService.stop();
      expect(consoleSpy).toHaveBeenCalledWith('Alerting service stopped');

      consoleSpy.mockRestore();
    });

    it('should setup health check event listeners', () => {
      expect(mockHealthChecker.on).toHaveBeenCalled();
    });
  });

  describe('Condition Evaluation', () => {
    beforeEach(() => {
      // Mock Prometheus metrics response
      mockMetrics.getMetrics.mockResolvedValue(`
        # HELP http_request_errors_total Total number of HTTP request errors
        # TYPE http_request_errors_total counter
        http_request_errors_total{method="GET",route="/api/test"} 10
        # HELP prediction_accuracy_ratio Current prediction accuracy ratio
        # TYPE prediction_accuracy_ratio gauge
        prediction_accuracy_ratio{model_type="xgboost"} 0.65
      `);
    });

    it('should evaluate greater than conditions', async () => {
      const rule: AlertRule = {
        id: 'test_gt',
        name: 'Test GT',
        description: 'Test greater than condition',
        condition: {
          metric: 'http_request_errors_total',
          operator: 'gt',
          threshold: 5
        },
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 0,
        notificationChannels: ['email']
      };

      alertingService.addRule(rule);
      
      const alertFiredSpy = jest.fn();
      alertingService.on('alertFired', alertFiredSpy);

      // Start the service to begin evaluation
      alertingService.start();
      
      // Wait for evaluation cycle
      await new Promise(resolve => setTimeout(resolve, 100));

      // The mock returns 10, which is > 5, so alert should fire
      expect(alertFiredSpy).toHaveBeenCalled();
    });

    it('should evaluate less than conditions', async () => {
      const rule: AlertRule = {
        id: 'test_lt',
        name: 'Test LT',
        description: 'Test less than condition',
        condition: {
          metric: 'prediction_accuracy_ratio',
          operator: 'lt',
          threshold: 0.7
        },
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 0,
        notificationChannels: ['email']
      };

      alertingService.addRule(rule);
      
      const alertFiredSpy = jest.fn();
      alertingService.on('alertFired', alertFiredSpy);

      alertingService.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      // The mock returns 0.65, which is < 0.7, so alert should fire
      expect(alertFiredSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Prometheus metrics errors gracefully', async () => {
      mockMetrics.getMetrics.mockRejectedValue(new Error('Prometheus unavailable'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      alertingService.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not crash and should log error
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error evaluating rule'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid metric data gracefully', async () => {
      mockMetrics.getMetrics.mockResolvedValue('invalid metric data');
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      alertingService.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not crash
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Error evaluating rule')
      );

      consoleSpy.mockRestore();
    });
  });
});
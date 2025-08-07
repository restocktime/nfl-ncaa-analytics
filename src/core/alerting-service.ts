import { EventEmitter } from 'events';
import { PrometheusMetrics } from './prometheus-metrics';
import { HealthChecker, SystemHealthStatus, HealthCheckResult } from './health-checker';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  enabled: boolean;
  cooldownMinutes: number;
  notificationChannels: string[];
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration?: number; // Duration in seconds the condition must be true
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  ruleId: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  status: 'firing' | 'resolved';
  timestamp: Date;
  resolvedAt?: Date;
  value: number;
  threshold: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

export interface AlertingConfig {
  evaluationIntervalSeconds: number;
  defaultCooldownMinutes: number;
  maxAlertsPerRule: number;
}

/**
 * Alerting service that monitors metrics and triggers notifications
 * Implements alert rules for system health and accuracy degradation
 */
export class AlertingService extends EventEmitter {
  private readonly alerts: Map<string, Alert> = new Map();
  private readonly activeAlerts: Map<string, Date> = new Map(); // For cooldown tracking
  private readonly conditionHistory: Map<string, boolean[]> = new Map(); // For duration-based conditions
  private evaluationTimer?: NodeJS.Timeout;
  
  private readonly defaultRules: AlertRule[] = [
    {
      id: 'high_error_rate',
      name: 'High HTTP Error Rate',
      description: 'HTTP error rate is above 5%',
      condition: {
        metric: 'http_request_errors_total',
        operator: 'gt',
        threshold: 0.05,
        duration: 300 // 5 minutes
      },
      severity: 'critical',
      enabled: true,
      cooldownMinutes: 15,
      notificationChannels: ['email', 'slack', 'pagerduty']
    },
    {
      id: 'prediction_accuracy_low',
      name: 'Low Prediction Accuracy',
      description: 'Prediction accuracy has dropped below 70%',
      condition: {
        metric: 'prediction_accuracy_ratio',
        operator: 'lt',
        threshold: 0.70,
        duration: 600 // 10 minutes
      },
      severity: 'warning',
      enabled: true,
      cooldownMinutes: 30,
      notificationChannels: ['email', 'slack']
    },
    {
      id: 'service_unhealthy',
      name: 'Service Unhealthy',
      description: 'Critical service is reporting unhealthy status',
      condition: {
        metric: 'service_health_status',
        operator: 'lt',
        threshold: 1,
        duration: 120 // 2 minutes
      },
      severity: 'critical',
      enabled: true,
      cooldownMinutes: 10,
      notificationChannels: ['email', 'slack', 'pagerduty']
    },
    {
      id: 'high_response_time',
      name: 'High API Response Time',
      description: 'API response time is above 5 seconds',
      condition: {
        metric: 'http_request_duration_seconds',
        operator: 'gt',
        threshold: 5.0,
        duration: 300 // 5 minutes
      },
      severity: 'warning',
      enabled: true,
      cooldownMinutes: 20,
      notificationChannels: ['email', 'slack']
    },
    {
      id: 'database_connection_lost',
      name: 'Database Connection Lost',
      description: 'Database connections have dropped to zero',
      condition: {
        metric: 'database_connections_active',
        operator: 'eq',
        threshold: 0,
        duration: 60 // 1 minute
      },
      severity: 'critical',
      enabled: true,
      cooldownMinutes: 5,
      notificationChannels: ['email', 'slack', 'pagerduty']
    },
    {
      id: 'cache_hit_rate_low',
      name: 'Low Cache Hit Rate',
      description: 'Cache hit rate has dropped below 80%',
      condition: {
        metric: 'cache_hit_rate_ratio',
        operator: 'lt',
        threshold: 0.80,
        duration: 900 // 15 minutes
      },
      severity: 'info',
      enabled: true,
      cooldownMinutes: 60,
      notificationChannels: ['email']
    }
  ];

  constructor(
    private readonly config: AlertingConfig,
    private readonly metrics: PrometheusMetrics,
    private readonly healthChecker: HealthChecker,
    private customRules: AlertRule[] = []
  ) {
    super();
    this.setupEventListeners();
  }

  /**
   * Start the alerting service
   */
  public start(): void {
    this.evaluationTimer = setInterval(
      () => this.evaluateAlertRules(),
      this.config.evaluationIntervalSeconds * 1000
    );
    
    console.log(`Alerting service started with ${this.getAllRules().length} rules`);
  }

  /**
   * Stop the alerting service
   */
  public stop(): void {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = undefined;
    }
    console.log('Alerting service stopped');
  }

  /**
   * Add a custom alert rule
   */
  public addRule(rule: AlertRule): void {
    this.customRules.push(rule);
    console.log(`Added alert rule: ${rule.name}`);
  }

  /**
   * Remove an alert rule
   */
  public removeRule(ruleId: string): boolean {
    const index = this.customRules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      this.customRules.splice(index, 1);
      console.log(`Removed alert rule: ${ruleId}`);
      return true;
    }
    return false;
  }

  /**
   * Get all alert rules (default + custom)
   */
  public getAllRules(): AlertRule[] {
    return [...this.defaultRules, ...this.customRules];
  }

  /**
   * Get all active alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'firing');
  }

  /**
   * Get alert history
   */
  public getAlertHistory(limit: number = 100): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Manually trigger an alert (for testing)
   */
  public triggerAlert(ruleId: string, value: number, labels: Record<string, string> = {}): void {
    const rule = this.getAllRules().find(r => r.id === ruleId);
    if (!rule) {
      throw new Error(`Alert rule not found: ${ruleId}`);
    }

    const alert = this.createAlert(rule, value, labels);
    this.fireAlert(alert);
  }

  /**
   * Resolve an alert manually
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && alert.status === 'firing') {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      this.emit('alertResolved', alert);
      return true;
    }
    return false;
  }

  /**
   * Evaluate all alert rules
   */
  private async evaluateAlertRules(): Promise<void> {
    const rules = this.getAllRules().filter(rule => rule.enabled);
    
    for (const rule of rules) {
      try {
        await this.evaluateRule(rule);
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Evaluate a single alert rule
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    // Check if rule is in cooldown
    const lastAlert = this.activeAlerts.get(rule.id);
    if (lastAlert) {
      const cooldownMs = rule.cooldownMinutes * 60 * 1000;
      if (Date.now() - lastAlert.getTime() < cooldownMs) {
        return; // Still in cooldown
      }
    }

    const value = await this.getMetricValue(rule.condition.metric);
    if (value === null) {
      return; // Metric not available
    }

    const conditionMet = this.evaluateCondition(rule.condition, value);
    
    // Handle duration-based conditions
    if (rule.condition.duration) {
      const historyKey = rule.id;
      let history = this.conditionHistory.get(historyKey) || [];
      
      history.push(conditionMet);
      
      // Keep only the relevant history (based on evaluation interval)
      const maxHistoryLength = Math.ceil(rule.condition.duration / this.config.evaluationIntervalSeconds);
      if (history.length > maxHistoryLength) {
        history = history.slice(-maxHistoryLength);
      }
      
      this.conditionHistory.set(historyKey, history);
      
      // Check if condition has been true for the required duration
      const requiredTrueCount = Math.ceil(rule.condition.duration / this.config.evaluationIntervalSeconds);
      const recentTrueCount = history.slice(-requiredTrueCount).filter(Boolean).length;
      
      if (recentTrueCount < requiredTrueCount) {
        return; // Condition not met for required duration
      }
    } else if (!conditionMet) {
      return; // Simple condition not met
    }

    // Create and fire alert
    const labels = await this.getMetricLabels(rule.condition.metric);
    const alert = this.createAlert(rule, value, labels);
    this.fireAlert(alert);
  }

  /**
   * Evaluate a condition against a value
   */
  private evaluateCondition(condition: AlertCondition, value: number): boolean {
    switch (condition.operator) {
      case 'gt':
        return value > condition.threshold;
      case 'gte':
        return value >= condition.threshold;
      case 'lt':
        return value < condition.threshold;
      case 'lte':
        return value <= condition.threshold;
      case 'eq':
        return value === condition.threshold;
      default:
        return false;
    }
  }

  /**
   * Get metric value from Prometheus
   */
  private async getMetricValue(metricName: string): Promise<number | null> {
    try {
      const metricsText = await this.metrics.getMetrics();
      const lines = metricsText.split('\n');
      
      for (const line of lines) {
        if (line.startsWith(metricName) && !line.startsWith('#')) {
          const parts = line.split(' ');
          if (parts.length >= 2) {
            return parseFloat(parts[parts.length - 1]);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting metric value for ${metricName}:`, error);
      return null;
    }
  }

  /**
   * Get metric labels (simplified implementation)
   */
  private async getMetricLabels(metricName: string): Promise<Record<string, string>> {
    // This is a simplified implementation
    // In a real system, you'd parse the metric labels from Prometheus format
    return {
      metric: metricName,
      instance: 'main'
    };
  }

  /**
   * Create an alert from a rule and current value
   */
  private createAlert(rule: AlertRule, value: number, labels: Record<string, string>): Alert {
    const alertId = `${rule.id}_${Date.now()}`;
    
    return {
      id: alertId,
      ruleId: rule.id,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      status: 'firing',
      timestamp: new Date(),
      value,
      threshold: rule.condition.threshold,
      labels,
      annotations: {
        summary: `${rule.name}: ${value} ${rule.condition.operator} ${rule.condition.threshold}`,
        description: rule.description,
        runbook_url: `https://docs.example.com/runbooks/${rule.id}`
      }
    };
  }

  /**
   * Fire an alert
   */
  private fireAlert(alert: Alert): void {
    this.alerts.set(alert.id, alert);
    this.activeAlerts.set(alert.ruleId, new Date());
    
    console.log(`🚨 ALERT FIRED: ${alert.name} (${alert.severity})`);
    console.log(`   Value: ${alert.value}, Threshold: ${alert.threshold}`);
    
    this.emit('alertFired', alert);
  }

  /**
   * Setup event listeners for health checks
   */
  private setupEventListeners(): void {
    // Listen for health check results and create alerts if needed
    this.healthChecker.on('healthCheckCompleted', (status: SystemHealthStatus) => {
      this.handleHealthCheckResult(status);
    });
  }

  /**
   * Handle health check results and create alerts if needed
   */
  private handleHealthCheckResult(status: SystemHealthStatus): void {
    if (status.overall === 'unhealthy') {
      const unhealthyServices = status.services.filter(s => s.status === 'unhealthy');
      
      for (const service of unhealthyServices) {
        this.triggerHealthAlert(service);
      }
    }
  }

  /**
   * Trigger a health-related alert
   */
  private triggerHealthAlert(service: HealthCheckResult): void {
    const alertId = `health_${service.service}_${Date.now()}`;
    
    const alert: Alert = {
      id: alertId,
      ruleId: 'service_unhealthy',
      name: `Service Unhealthy: ${service.service}`,
      description: `Service ${service.service} is reporting unhealthy status`,
      severity: 'critical',
      status: 'firing',
      timestamp: new Date(),
      value: 0,
      threshold: 1,
      labels: {
        service: service.service,
        instance: 'main'
      },
      annotations: {
        summary: `Service ${service.service} is unhealthy`,
        description: service.error || 'Service health check failed',
        response_time: service.responseTime.toString()
      }
    };

    this.fireAlert(alert);
  }
}
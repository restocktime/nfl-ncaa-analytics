import { AlertingService, AlertingConfig, Alert, AlertRule } from './alerting-service';
import { 
  NotificationManager, 
  EmailNotificationChannel, 
  SlackNotificationChannel, 
  PagerDutyNotificationChannel,
  EmailConfig,
  SlackConfig,
  PagerDutyConfig
} from './notification-channels';
import { DashboardService, DashboardConfig } from './dashboard-service';
import { PrometheusMetrics } from './prometheus-metrics';
import { HealthChecker } from './health-checker';

export interface AlertingManagerConfig {
  alerting: AlertingConfig;
  dashboard: DashboardConfig;
  notifications: {
    email?: EmailConfig;
    slack?: SlackConfig;
    pagerduty?: PagerDutyConfig;
  };
}

/**
 * Main alerting manager that coordinates all alerting and notification components
 * Implements the complete alerting and notification system
 */
export class AlertingManager {
  private alertingService: AlertingService;
  private notificationManager: NotificationManager;
  private dashboardService: DashboardService;
  private isStarted = false;

  constructor(
    private readonly config: AlertingManagerConfig,
    private readonly prometheusMetrics: PrometheusMetrics,
    private readonly healthChecker: HealthChecker
  ) {
    this.notificationManager = new NotificationManager();
    this.setupNotificationChannels();
    
    this.alertingService = new AlertingService(
      config.alerting,
      prometheusMetrics,
      healthChecker
    );

    this.dashboardService = new DashboardService(
      config.dashboard,
      prometheusMetrics,
      healthChecker,
      this.alertingService
    );

    this.setupEventHandlers();
  }

  /**
   * Start the alerting manager and all its components
   */
  public async start(): Promise<void> {
    if (this.isStarted) {
      console.log('Alerting manager is already started');
      return;
    }

    try {
      // Test notification channels
      console.log('Testing notification channels...');
      const testResults = await this.notificationManager.testAllChannels();
      
      for (const [channel, success] of Object.entries(testResults)) {
        if (success) {
          console.log(`✅ ${channel} notification channel is working`);
        } else {
          console.warn(`⚠️ ${channel} notification channel test failed`);
        }
      }

      // Start services
      this.alertingService.start();
      this.dashboardService.start();
      this.healthChecker.startPeriodicHealthChecks();

      this.isStarted = true;
      console.log('🚨 Alerting manager started successfully');

      // Send startup notification
      await this.sendStartupNotification();

    } catch (error) {
      console.error('Failed to start alerting manager:', error);
      throw error;
    }
  }

  /**
   * Stop the alerting manager and all its components
   */
  public async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    this.alertingService.stop();
    this.dashboardService.stop();
    this.healthChecker.stopPeriodicHealthChecks();

    this.isStarted = false;
    console.log('Alerting manager stopped');

    // Send shutdown notification
    await this.sendShutdownNotification();
  }

  /**
   * Get the alerting service instance
   */
  public getAlertingService(): AlertingService {
    return this.alertingService;
  }

  /**
   * Get the dashboard service instance
   */
  public getDashboardService(): DashboardService {
    return this.dashboardService;
  }

  /**
   * Get the notification manager instance
   */
  public getNotificationManager(): NotificationManager {
    return this.notificationManager;
  }

  /**
   * Add a custom alert rule
   */
  public addAlertRule(rule: AlertRule): void {
    this.alertingService.addRule(rule);
  }

  /**
   * Remove an alert rule
   */
  public removeAlertRule(ruleId: string): boolean {
    return this.alertingService.removeRule(ruleId);
  }

  /**
   * Get all active alerts
   */
  public getActiveAlerts(): Alert[] {
    return this.alertingService.getActiveAlerts();
  }

  /**
   * Get alert history
   */
  public getAlertHistory(limit?: number): Alert[] {
    return this.alertingService.getAlertHistory(limit);
  }

  /**
   * Manually trigger an alert (for testing)
   */
  public async triggerTestAlert(severity: 'critical' | 'warning' | 'info' = 'info'): Promise<void> {
    const testRule: AlertRule = {
      id: 'test_alert',
      name: 'Test Alert',
      description: 'This is a test alert to verify the alerting system is working',
      condition: {
        metric: 'test_metric',
        operator: 'gt',
        threshold: 0
      },
      severity,
      enabled: true,
      cooldownMinutes: 0,
      notificationChannels: ['email', 'slack']
    };

    this.alertingService.addRule(testRule);
    this.alertingService.triggerAlert('test_alert', 1, { test: 'true' });
    
    // Remove the test rule after a short delay
    setTimeout(() => {
      this.alertingService.removeRule('test_alert');
    }, 5000);
  }

  /**
   * Get system health summary for dashboard
   */
  public async getSystemHealthSummary(): Promise<{
    overall: string;
    services: number;
    alerts: number;
    uptime: string;
  }> {
    const [healthStatus, activeAlerts, systemOverview] = await Promise.all([
      this.healthChecker.getHealthStatus(),
      this.alertingService.getActiveAlerts(),
      this.dashboardService.getSystemOverview()
    ]);

    return {
      overall: healthStatus.overall,
      services: healthStatus.services.length,
      alerts: activeAlerts.length,
      uptime: systemOverview.uptime
    };
  }

  /**
   * Export all metrics and alerts for external monitoring
   */
  public async exportMonitoringData(): Promise<{
    metrics: string;
    alerts: Alert[];
    health: any;
    timestamp: Date;
  }> {
    const [metrics, alerts, health] = await Promise.all([
      this.dashboardService.exportMetrics('json'),
      this.alertingService.getAlertHistory(50),
      this.healthChecker.getHealthStatus()
    ]);

    return {
      metrics,
      alerts,
      health,
      timestamp: new Date()
    };
  }

  /**
   * Setup notification channels based on configuration
   */
  private setupNotificationChannels(): void {
    if (this.config.notifications.email) {
      const emailChannel = new EmailNotificationChannel(this.config.notifications.email);
      this.notificationManager.registerChannel(emailChannel);
    }

    if (this.config.notifications.slack) {
      const slackChannel = new SlackNotificationChannel(this.config.notifications.slack);
      this.notificationManager.registerChannel(slackChannel);
    }

    if (this.config.notifications.pagerduty) {
      const pagerDutyChannel = new PagerDutyNotificationChannel(this.config.notifications.pagerduty);
      this.notificationManager.registerChannel(pagerDutyChannel);
    }
  }

  /**
   * Setup event handlers for alerts and notifications
   */
  private setupEventHandlers(): void {
    // Handle alert firing
    this.alertingService.on('alertFired', async (alert: Alert) => {
      console.log(`🚨 Alert fired: ${alert.name} (${alert.severity})`);
      
      // Get the alert rule to determine notification channels
      const rules = this.alertingService.getAllRules();
      const rule = rules.find(r => r.id === alert.ruleId);
      
      if (rule) {
        await this.notificationManager.sendAlert(alert, rule.notificationChannels);
      }
    });

    // Handle alert resolution
    this.alertingService.on('alertResolved', async (alert: Alert) => {
      console.log(`✅ Alert resolved: ${alert.name}`);
      
      // Optionally send resolution notifications
      const rules = this.alertingService.getAllRules();
      const rule = rules.find(r => r.id === alert.ruleId);
      
      if (rule && alert.severity === 'critical') {
        // Send resolution notification for critical alerts
        await this.notificationManager.sendAlert(alert, rule.notificationChannels);
      }
    });

    // Handle dashboard metrics updates
    this.dashboardService.on('metricsUpdated', (metrics) => {
      // Could trigger additional processing or notifications based on metrics
      if (metrics.system.overallHealth === 'unhealthy') {
        console.warn('⚠️ System health is unhealthy');
      }
    });
  }

  /**
   * Send startup notification
   */
  private async sendStartupNotification(): Promise<void> {
    const startupAlert: Alert = {
      id: `startup_${Date.now()}`,
      ruleId: 'system_startup',
      name: 'System Startup',
      description: 'Football Analytics System has started successfully',
      severity: 'info',
      status: 'firing',
      timestamp: new Date(),
      value: 1,
      threshold: 1,
      labels: {
        event: 'startup',
        system: 'football-analytics'
      },
      annotations: {
        summary: 'System startup notification',
        description: 'The Football Analytics System alerting and monitoring components have started successfully'
      }
    };

    const channels = this.notificationManager.getChannelNames().filter(name => name !== 'pagerduty');
    if (channels.length > 0) {
      await this.notificationManager.sendAlert(startupAlert, channels);
    }
  }

  /**
   * Send shutdown notification
   */
  private async sendShutdownNotification(): Promise<void> {
    const shutdownAlert: Alert = {
      id: `shutdown_${Date.now()}`,
      ruleId: 'system_shutdown',
      name: 'System Shutdown',
      description: 'Football Analytics System is shutting down',
      severity: 'warning',
      status: 'firing',
      timestamp: new Date(),
      value: 0,
      threshold: 1,
      labels: {
        event: 'shutdown',
        system: 'football-analytics'
      },
      annotations: {
        summary: 'System shutdown notification',
        description: 'The Football Analytics System is shutting down gracefully'
      }
    };

    const channels = this.notificationManager.getChannelNames().filter(name => name !== 'pagerduty');
    if (channels.length > 0) {
      await this.notificationManager.sendAlert(shutdownAlert, channels);
    }
  }
}
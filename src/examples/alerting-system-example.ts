import { AlertingManager, AlertingManagerConfig } from '../core/alerting-manager';
import { PrometheusMetrics } from '../core/prometheus-metrics';
import { HealthChecker } from '../core/health-checker';
import { AlertRule } from '../core/alerting-service';

/**
 * Example demonstrating how to set up and use the alerting system
 * This shows the complete configuration and usage of the alerting and notification system
 */

async function runAlertingSystemExample() {
  console.log('🚨 Football Analytics Alerting System Example');
  console.log('==============================================\n');

  // 1. Configure the alerting system
  const config: AlertingManagerConfig = {
    alerting: {
      evaluationIntervalSeconds: 30, // Check rules every 30 seconds
      defaultCooldownMinutes: 15,    // 15 minute cooldown between alerts
      maxAlertsPerRule: 10
    },
    dashboard: {
      refreshIntervalSeconds: 30,    // Update dashboard every 30 seconds
      metricsRetentionHours: 24,     // Keep 24 hours of metrics
      alertHistoryLimit: 100
    },
    notifications: {
      // Email configuration
      email: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'alerts@footballanalytics.com',
          pass: 'your-app-password'
        },
        from: 'alerts@footballanalytics.com',
        to: ['admin@footballanalytics.com', 'ops@footballanalytics.com']
      },
      
      // Slack configuration
      slack: {
        webhookUrl: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
        channel: '#football-alerts',
        username: 'Football Analytics Bot',
        iconEmoji: ':football:'
      },
      
      // PagerDuty configuration (for critical alerts only)
      pagerduty: {
        integrationKey: 'your-pagerduty-integration-key'
      }
    }
  };

  // 2. Initialize dependencies
  const prometheusMetrics = PrometheusMetrics.getInstance();
  const healthChecker = new HealthChecker();
  
  // 3. Create the alerting manager
  const alertingManager = new AlertingManager(
    config,
    prometheusMetrics,
    healthChecker
  );

  try {
    // 4. Start the alerting system
    console.log('Starting alerting system...');
    await alertingManager.start();
    console.log('✅ Alerting system started successfully!\n');

    // 5. Add a custom alert rule
    const customRule: AlertRule = {
      id: 'game_prediction_accuracy_critical',
      name: 'Game Prediction Accuracy Critical',
      description: 'Game prediction accuracy has dropped below 60% during active games',
      condition: {
        metric: 'prediction_accuracy_ratio',
        operator: 'lt',
        threshold: 0.60,
        duration: 300 // Must be true for 5 minutes
      },
      severity: 'critical',
      enabled: true,
      cooldownMinutes: 30,
      notificationChannels: ['email', 'slack', 'pagerduty']
    };

    console.log('Adding custom alert rule...');
    alertingManager.addAlertRule(customRule);
    console.log('✅ Custom alert rule added\n');

    // 6. Demonstrate triggering a test alert
    console.log('Triggering test alert...');
    await alertingManager.triggerTestAlert('warning');
    console.log('✅ Test alert triggered\n');

    // 7. Get system health summary
    console.log('Getting system health summary...');
    const healthSummary = await alertingManager.getSystemHealthSummary();
    console.log('📊 System Health Summary:');
    console.log(`   Overall Status: ${healthSummary.overall}`);
    console.log(`   Services: ${healthSummary.services}`);
    console.log(`   Active Alerts: ${healthSummary.alerts}`);
    console.log(`   Uptime: ${healthSummary.uptime}\n`);

    // 8. Get dashboard metrics
    console.log('Getting dashboard metrics...');
    const dashboardService = alertingManager.getDashboardService();
    const metrics = await dashboardService.getCurrentMetrics();
    console.log('📈 Current Metrics:');
    console.log(`   System Health: ${metrics.system.overallHealth}`);
    console.log(`   CPU Usage: ${metrics.system.cpuUsage.toFixed(2)}%`);
    console.log(`   Memory Usage: ${metrics.system.memoryUsage.toFixed(2)}%`);
    console.log(`   API Requests/min: ${metrics.api.requestsPerMinute}`);
    console.log(`   Prediction Accuracy: ${(metrics.predictions.averageAccuracy * 100).toFixed(1)}%\n`);

    // 9. Get active alerts
    console.log('Getting active alerts...');
    const activeAlerts = alertingManager.getActiveAlerts();
    console.log(`🚨 Active Alerts: ${activeAlerts.length}`);
    activeAlerts.forEach(alert => {
      console.log(`   - ${alert.name} (${alert.severity}): ${alert.description}`);
    });
    console.log();

    // 10. Export monitoring data
    console.log('Exporting monitoring data...');
    const exportedData = await alertingManager.exportMonitoringData();
    console.log('📤 Exported Data:');
    console.log(`   Metrics Size: ${exportedData.metrics.length} characters`);
    console.log(`   Alert History: ${exportedData.alerts.length} alerts`);
    console.log(`   Export Timestamp: ${exportedData.timestamp.toISOString()}\n`);

    // 11. Demonstrate alert resolution
    if (activeAlerts.length > 0) {
      console.log('Resolving test alert...');
      const alertingService = alertingManager.getAlertingService();
      const resolved = alertingService.resolveAlert(activeAlerts[0].id);
      console.log(`✅ Alert resolved: ${resolved}\n`);
    }

    // 12. Show alert history
    console.log('Getting alert history...');
    const alertHistory = alertingManager.getAlertHistory(5);
    console.log(`📜 Recent Alert History (last 5):`);
    alertHistory.forEach((alert, index) => {
      const status = alert.status === 'resolved' ? '✅' : '🚨';
      console.log(`   ${index + 1}. ${status} ${alert.name} - ${alert.timestamp.toISOString()}`);
    });
    console.log();

    // 13. Test notification channels
    console.log('Testing notification channels...');
    const notificationManager = alertingManager.getNotificationManager();
    const testResults = await notificationManager.testAllChannels();
    console.log('📧 Notification Channel Tests:');
    Object.entries(testResults).forEach(([channel, success]) => {
      const status = success ? '✅' : '❌';
      console.log(`   ${status} ${channel}: ${success ? 'Working' : 'Failed'}`);
    });
    console.log();

    // Let the system run for a bit to demonstrate real-time monitoring
    console.log('Running system for 10 seconds to demonstrate real-time monitoring...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 14. Stop the alerting system
    console.log('\nStopping alerting system...');
    await alertingManager.stop();
    console.log('✅ Alerting system stopped gracefully');

  } catch (error) {
    console.error('❌ Error running alerting system example:', error);
  }
}

/**
 * Example of setting up alerting for specific football analytics scenarios
 */
function createFootballSpecificAlertRules(): AlertRule[] {
  return [
    // Game day high load alert
    {
      id: 'game_day_high_load',
      name: 'Game Day High Load',
      description: 'API response time is high during active games',
      condition: {
        metric: 'http_request_duration_seconds',
        operator: 'gt',
        threshold: 2.0,
        duration: 180 // 3 minutes
      },
      severity: 'warning',
      enabled: true,
      cooldownMinutes: 10,
      notificationChannels: ['slack']
    },

    // Monte Carlo simulation overload
    {
      id: 'simulation_overload',
      name: 'Monte Carlo Simulation Overload',
      description: 'Too many simulations running simultaneously',
      condition: {
        metric: 'monte_carlo_simulations_total',
        operator: 'gt',
        threshold: 50,
        duration: 300 // 5 minutes
      },
      severity: 'warning',
      enabled: true,
      cooldownMinutes: 15,
      notificationChannels: ['email', 'slack']
    },

    // Data source failure
    {
      id: 'data_source_failure',
      name: 'External Data Source Failure',
      description: 'Critical data source is unavailable',
      condition: {
        metric: 'api_connector_health_status',
        operator: 'lt',
        threshold: 1,
        duration: 120 // 2 minutes
      },
      severity: 'critical',
      enabled: true,
      cooldownMinutes: 5,
      notificationChannels: ['email', 'slack', 'pagerduty']
    },

    // Model accuracy degradation
    {
      id: 'model_accuracy_degradation',
      name: 'ML Model Accuracy Degradation',
      description: 'Machine learning model accuracy has significantly decreased',
      condition: {
        metric: 'prediction_accuracy_ratio',
        operator: 'lt',
        threshold: 0.65,
        duration: 600 // 10 minutes
      },
      severity: 'warning',
      enabled: true,
      cooldownMinutes: 30,
      notificationChannels: ['email', 'slack']
    },

    // Cache performance issue
    {
      id: 'cache_performance_issue',
      name: 'Cache Performance Issue',
      description: 'Cache hit rate is too low, affecting performance',
      condition: {
        metric: 'cache_hit_rate_ratio',
        operator: 'lt',
        threshold: 0.75,
        duration: 900 // 15 minutes
      },
      severity: 'info',
      enabled: true,
      cooldownMinutes: 60,
      notificationChannels: ['email']
    }
  ];
}

// Run the example if this file is executed directly
if (require.main === module) {
  runAlertingSystemExample().catch(console.error);
}

export { runAlertingSystemExample, createFootballSpecificAlertRules };
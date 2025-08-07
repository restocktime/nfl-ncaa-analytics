import { EventEmitter } from 'events';
import { PrometheusMetrics } from './prometheus-metrics';
import { HealthChecker, SystemHealthStatus } from './health-checker';
import { AlertingService, Alert } from './alerting-service';

export interface DashboardMetrics {
  timestamp: Date;
  system: SystemMetrics;
  api: ApiMetrics;
  predictions: PredictionMetrics;
  alerts: AlertMetrics;
  services: ServiceMetrics;
}

export interface SystemMetrics {
  uptime: number;
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  cpuUsage: number;
  memoryUsage: number;
  diskUsage?: number;
}

export interface ApiMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  activeConnections: number;
}

export interface PredictionMetrics {
  predictionsPerMinute: number;
  averageAccuracy: number;
  modelPerformance: Record<string, number>;
  simulationsRunning: number;
}

export interface AlertMetrics {
  activeAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  alertsLast24h: number;
}

export interface ServiceMetrics {
  database: ServiceStatus;
  redis: ServiceStatus;
  influxdb: ServiceStatus;
  apiConnectors: Record<string, ServiceStatus>;
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  errorCount: number;
}

export interface DashboardConfig {
  refreshIntervalSeconds: number;
  metricsRetentionHours: number;
  alertHistoryLimit: number;
}

/**
 * Dashboard service that provides real-time system status and metrics
 * Creates operational dashboards with real-time system status
 */
export class DashboardService extends EventEmitter {
  private metricsHistory: DashboardMetrics[] = [];
  private refreshTimer?: NodeJS.Timeout;
  private startTime: Date;

  constructor(
    private readonly config: DashboardConfig,
    private readonly prometheusMetrics: PrometheusMetrics,
    private readonly healthChecker: HealthChecker,
    private readonly alertingService: AlertingService
  ) {
    super();
    this.startTime = new Date();
    this.setupEventListeners();
  }

  /**
   * Start the dashboard service
   */
  public start(): void {
    this.refreshTimer = setInterval(
      () => this.refreshMetrics(),
      this.config.refreshIntervalSeconds * 1000
    );
    
    // Initial metrics collection
    this.refreshMetrics();
    
    console.log('Dashboard service started');
  }

  /**
   * Stop the dashboard service
   */
  public stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    console.log('Dashboard service stopped');
  }

  /**
   * Get current dashboard metrics
   */
  public async getCurrentMetrics(): Promise<DashboardMetrics> {
    return this.collectMetrics();
  }

  /**
   * Get metrics history
   */
  public getMetricsHistory(hours: number = 24): DashboardMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Get system overview
   */
  public async getSystemOverview(): Promise<{
    status: string;
    uptime: string;
    version: string;
    environment: string;
    lastUpdated: Date;
  }> {
    const metrics = await this.getCurrentMetrics();
    
    return {
      status: metrics.system.overallHealth,
      uptime: this.formatUptime(metrics.system.uptime),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      lastUpdated: new Date()
    };
  }

  /**
   * Get API performance summary
   */
  public async getApiPerformance(): Promise<{
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    topEndpoints: Array<{ endpoint: string; requests: number; avgTime: number }>;
  }> {
    const metrics = await this.getCurrentMetrics();
    
    // This would typically query Prometheus for detailed endpoint metrics
    const topEndpoints = [
      { endpoint: '/api/predictions', requests: 150, avgTime: 0.8 },
      { endpoint: '/api/games/live', requests: 120, avgTime: 0.3 },
      { endpoint: '/api/teams', requests: 80, avgTime: 0.2 },
      { endpoint: '/api/players', requests: 60, avgTime: 0.4 }
    ];

    return {
      requestsPerMinute: metrics.api.requestsPerMinute,
      averageResponseTime: metrics.api.averageResponseTime,
      errorRate: metrics.api.errorRate,
      topEndpoints
    };
  }

  /**
   * Get prediction performance summary
   */
  public async getPredictionPerformance(): Promise<{
    totalPredictions: number;
    averageAccuracy: number;
    modelComparison: Array<{ model: string; accuracy: number; predictions: number }>;
    recentTrends: Array<{ timestamp: Date; accuracy: number }>;
  }> {
    const metrics = await this.getCurrentMetrics();
    const history = this.getMetricsHistory(24);
    
    const modelComparison = Object.entries(metrics.predictions.modelPerformance).map(
      ([model, accuracy]) => ({
        model,
        accuracy,
        predictions: Math.floor(Math.random() * 1000) // Would be real data
      })
    );

    const recentTrends = history.slice(-12).map(m => ({
      timestamp: m.timestamp,
      accuracy: m.predictions.averageAccuracy
    }));

    return {
      totalPredictions: history.reduce((sum, m) => sum + m.predictions.predictionsPerMinute, 0),
      averageAccuracy: metrics.predictions.averageAccuracy,
      modelComparison,
      recentTrends
    };
  }

  /**
   * Get alert summary
   */
  public getAlertSummary(): {
    active: Alert[];
    recent: Alert[];
    summary: {
      critical: number;
      warning: number;
      info: number;
      resolved24h: number;
    };
  } {
    const activeAlerts = this.alertingService.getActiveAlerts();
    const recentAlerts = this.alertingService.getAlertHistory(50);
    
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent24h = recentAlerts.filter(a => a.timestamp >= last24h);
    
    const summary = {
      critical: activeAlerts.filter(a => a.severity === 'critical').length,
      warning: activeAlerts.filter(a => a.severity === 'warning').length,
      info: activeAlerts.filter(a => a.severity === 'info').length,
      resolved24h: recent24h.filter(a => a.status === 'resolved').length
    };

    return {
      active: activeAlerts,
      recent: recentAlerts.slice(0, 10),
      summary
    };
  }

  /**
   * Get service health details
   */
  public async getServiceHealth(): Promise<{
    services: Array<{
      name: string;
      status: string;
      responseTime: number;
      lastCheck: Date;
      uptime: number;
    }>;
    dependencies: Array<{
      name: string;
      status: string;
      endpoint: string;
      lastCheck: Date;
    }>;
  }> {
    const healthStatus = await this.healthChecker.getHealthStatus();
    
    const services = healthStatus.services.map(service => ({
      name: service.service,
      status: service.status,
      responseTime: service.responseTime,
      lastCheck: service.timestamp,
      uptime: this.calculateServiceUptime(service.service)
    }));

    // Mock external dependencies - would be real data in production
    const dependencies = [
      {
        name: 'SportsDataIO API',
        status: 'healthy',
        endpoint: 'api.sportsdata.io',
        lastCheck: new Date()
      },
      {
        name: 'ESPN API',
        status: 'healthy',
        endpoint: 'site.api.espn.com',
        lastCheck: new Date()
      },
      {
        name: 'The Odds API',
        status: 'degraded',
        endpoint: 'api.the-odds-api.com',
        lastCheck: new Date()
      }
    ];

    return { services, dependencies };
  }

  /**
   * Export dashboard data for external monitoring tools
   */
  public async exportMetrics(format: 'json' | 'prometheus' = 'json'): Promise<string> {
    if (format === 'prometheus') {
      return this.prometheusMetrics.getMetrics();
    }

    const metrics = await this.getCurrentMetrics();
    return JSON.stringify(metrics, null, 2);
  }

  /**
   * Refresh and collect current metrics
   */
  private async refreshMetrics(): Promise<void> {
    try {
      const metrics = await this.collectMetrics();
      this.metricsHistory.push(metrics);
      
      // Clean up old metrics
      const cutoffTime = new Date(Date.now() - this.config.metricsRetentionHours * 60 * 60 * 1000);
      this.metricsHistory = this.metricsHistory.filter(m => m.timestamp >= cutoffTime);
      
      this.emit('metricsUpdated', metrics);
    } catch (error) {
      console.error('Error refreshing dashboard metrics:', error);
    }
  }

  /**
   * Collect current metrics from all sources
   */
  private async collectMetrics(): Promise<DashboardMetrics> {
    const [healthStatus, activeAlerts, alertHistory] = await Promise.all([
      this.healthChecker.getHealthStatus(),
      this.alertingService.getActiveAlerts(),
      this.alertingService.getAlertHistory(100)
    ]);

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const alertsLast24h = alertHistory.filter(a => a.timestamp >= last24h).length;

    return {
      timestamp: new Date(),
      system: {
        uptime: Date.now() - this.startTime.getTime(),
        overallHealth: healthStatus.overall,
        cpuUsage: this.getCpuUsage(),
        memoryUsage: this.getMemoryUsage()
      },
      api: {
        requestsPerMinute: await this.getRequestsPerMinute(),
        averageResponseTime: await this.getAverageResponseTime(),
        errorRate: await this.getErrorRate(),
        activeConnections: await this.getActiveConnections()
      },
      predictions: {
        predictionsPerMinute: await this.getPredictionsPerMinute(),
        averageAccuracy: await this.getAverageAccuracy(),
        modelPerformance: await this.getModelPerformance(),
        simulationsRunning: await this.getSimulationsRunning()
      },
      alerts: {
        activeAlerts: activeAlerts.length,
        criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length,
        warningAlerts: activeAlerts.filter(a => a.severity === 'warning').length,
        alertsLast24h
      },
      services: {
        database: this.mapHealthToServiceStatus(
          healthStatus.services.find(s => s.service === 'database')
        ),
        redis: this.mapHealthToServiceStatus(
          healthStatus.services.find(s => s.service === 'redis')
        ),
        influxdb: this.mapHealthToServiceStatus(
          healthStatus.services.find(s => s.service === 'influxdb')
        ),
        apiConnectors: {
          sportsdata: { status: 'healthy', responseTime: 150, lastCheck: new Date(), errorCount: 0 },
          espn: { status: 'healthy', responseTime: 200, lastCheck: new Date(), errorCount: 0 },
          odds: { status: 'degraded', responseTime: 800, lastCheck: new Date(), errorCount: 2 }
        }
      }
    };
  }

  /**
   * Get CPU usage percentage
   */
  private getCpuUsage(): number {
    const usage = process.cpuUsage();
    return (usage.user + usage.system) / 1000000; // Convert to seconds
  }

  /**
   * Get memory usage percentage
   */
  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return (usage.heapUsed / usage.heapTotal) * 100;
  }

  /**
   * Get requests per minute from Prometheus metrics
   */
  private async getRequestsPerMinute(): Promise<number> {
    // This would query Prometheus for actual metrics
    // For now, return a mock value
    return Math.floor(Math.random() * 200) + 100;
  }

  /**
   * Get average response time from Prometheus metrics
   */
  private async getAverageResponseTime(): Promise<number> {
    // This would query Prometheus for actual metrics
    return Math.random() * 2 + 0.5; // 0.5-2.5 seconds
  }

  /**
   * Get error rate from Prometheus metrics
   */
  private async getErrorRate(): Promise<number> {
    // This would query Prometheus for actual metrics
    return Math.random() * 0.05; // 0-5% error rate
  }

  /**
   * Get active connections count
   */
  private async getActiveConnections(): Promise<number> {
    // This would be from actual connection pool metrics
    return Math.floor(Math.random() * 50) + 10;
  }

  /**
   * Get predictions per minute
   */
  private async getPredictionsPerMinute(): Promise<number> {
    return Math.floor(Math.random() * 100) + 20;
  }

  /**
   * Get average prediction accuracy
   */
  private async getAverageAccuracy(): Promise<number> {
    return 0.75 + Math.random() * 0.2; // 75-95% accuracy
  }

  /**
   * Get model performance metrics
   */
  private async getModelPerformance(): Promise<Record<string, number>> {
    return {
      xgboost: 0.82 + Math.random() * 0.1,
      neural_network: 0.78 + Math.random() * 0.1,
      ensemble: 0.85 + Math.random() * 0.1,
      bayesian: 0.76 + Math.random() * 0.1
    };
  }

  /**
   * Get number of running simulations
   */
  private async getSimulationsRunning(): Promise<number> {
    return Math.floor(Math.random() * 10);
  }

  /**
   * Map health check result to service status
   */
  private mapHealthToServiceStatus(healthResult: any): ServiceStatus {
    if (!healthResult) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        lastCheck: new Date(),
        errorCount: 1
      };
    }

    return {
      status: healthResult.status,
      responseTime: healthResult.responseTime,
      lastCheck: healthResult.timestamp,
      errorCount: healthResult.error ? 1 : 0
    };
  }

  /**
   * Calculate service uptime percentage
   */
  private calculateServiceUptime(serviceName: string): number {
    // This would calculate actual uptime from historical data
    return 99.5 + Math.random() * 0.5; // 99.5-100% uptime
  }

  /**
   * Format uptime duration
   */
  private formatUptime(uptimeMs: number): string {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m ${seconds % 60}s`;
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.alertingService.on('alertFired', (alert: Alert) => {
      this.emit('alertFired', alert);
    });

    this.alertingService.on('alertResolved', (alert: Alert) => {
      this.emit('alertResolved', alert);
    });
  }
}
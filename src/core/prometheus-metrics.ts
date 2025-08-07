import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

/**
 * Prometheus metrics service for collecting custom application metrics
 * Provides API response times, prediction accuracy, and service health metrics
 */
export class PrometheusMetrics {
  private static instance: PrometheusMetrics;
  
  // API Metrics
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestTotal: Counter<string>;
  private readonly httpRequestErrors: Counter<string>;
  
  // Prediction Metrics
  private readonly predictionAccuracy: Gauge<string>;
  private readonly predictionLatency: Histogram<string>;
  private readonly predictionTotal: Counter<string>;
  
  // Service Health Metrics
  private readonly serviceHealth: Gauge<string>;
  private readonly apiConnectorHealth: Gauge<string>;
  private readonly databaseConnections: Gauge<string>;
  private readonly cacheHitRate: Gauge<string>;
  
  // Monte Carlo Metrics
  private readonly simulationDuration: Histogram<string>;
  private readonly simulationTotal: Counter<string>;
  
  // Data Quality Metrics
  private readonly dataValidationErrors: Counter<string>;
  private readonly dataSourceLatency: Histogram<string>;

  private constructor() {
    // Collect default Node.js metrics
    collectDefaultMetrics({ register });

    // HTTP Request Metrics
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type']
    });

    // Prediction Metrics
    this.predictionAccuracy = new Gauge({
      name: 'prediction_accuracy_ratio',
      help: 'Current prediction accuracy ratio',
      labelNames: ['model_type', 'prediction_type']
    });

    this.predictionLatency = new Histogram({
      name: 'prediction_latency_seconds',
      help: 'Time taken to generate predictions',
      labelNames: ['model_type', 'prediction_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    });

    this.predictionTotal = new Counter({
      name: 'predictions_total',
      help: 'Total number of predictions made',
      labelNames: ['model_type', 'prediction_type', 'status']
    });

    // Service Health Metrics
    this.serviceHealth = new Gauge({
      name: 'service_health_status',
      help: 'Health status of services (1 = healthy, 0 = unhealthy)',
      labelNames: ['service_name', 'instance']
    });

    this.apiConnectorHealth = new Gauge({
      name: 'api_connector_health_status',
      help: 'Health status of API connectors (1 = healthy, 0 = unhealthy)',
      labelNames: ['api_name', 'endpoint']
    });

    this.databaseConnections = new Gauge({
      name: 'database_connections_active',
      help: 'Number of active database connections',
      labelNames: ['database_type', 'database_name']
    });

    this.cacheHitRate = new Gauge({
      name: 'cache_hit_rate_ratio',
      help: 'Cache hit rate ratio',
      labelNames: ['cache_type', 'cache_name']
    });

    // Monte Carlo Metrics
    this.simulationDuration = new Histogram({
      name: 'monte_carlo_simulation_duration_seconds',
      help: 'Duration of Monte Carlo simulations',
      labelNames: ['scenario_type', 'iterations'],
      buckets: [1, 5, 10, 30, 60, 120, 300]
    });

    this.simulationTotal = new Counter({
      name: 'monte_carlo_simulations_total',
      help: 'Total number of Monte Carlo simulations',
      labelNames: ['scenario_type', 'status']
    });

    // Data Quality Metrics
    this.dataValidationErrors = new Counter({
      name: 'data_validation_errors_total',
      help: 'Total number of data validation errors',
      labelNames: ['data_source', 'error_type']
    });

    this.dataSourceLatency = new Histogram({
      name: 'data_source_latency_seconds',
      help: 'Latency of external data sources',
      labelNames: ['data_source', 'endpoint'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    });

    // Register all metrics
    this.registerAllMetrics();
  }

  public static getInstance(): PrometheusMetrics {
    if (!PrometheusMetrics.instance) {
      PrometheusMetrics.instance = new PrometheusMetrics();
    }
    return PrometheusMetrics.instance;
  }

  /**
   * Express middleware for collecting HTTP metrics
   */
  public httpMetricsMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;
        const method = req.method;
        const statusCode = res.statusCode.toString();

        this.httpRequestDuration
          .labels(method, route, statusCode)
          .observe(duration);

        this.httpRequestTotal
          .labels(method, route, statusCode)
          .inc();

        if (res.statusCode >= 400) {
          this.httpRequestErrors
            .labels(method, route, 'http_error')
            .inc();
        }
      });

      next();
    };
  }

  /**
   * Record prediction accuracy metrics
   */
  public recordPredictionAccuracy(modelType: string, predictionType: string, accuracy: number): void {
    this.predictionAccuracy
      .labels(modelType, predictionType)
      .set(accuracy);
  }

  /**
   * Record prediction latency
   */
  public recordPredictionLatency(modelType: string, predictionType: string, latencySeconds: number): void {
    this.predictionLatency
      .labels(modelType, predictionType)
      .observe(latencySeconds);
  }

  /**
   * Increment prediction counter
   */
  public incrementPredictionCount(modelType: string, predictionType: string, status: 'success' | 'error'): void {
    this.predictionTotal
      .labels(modelType, predictionType, status)
      .inc();
  }

  /**
   * Set service health status
   */
  public setServiceHealth(serviceName: string, instance: string, isHealthy: boolean): void {
    this.serviceHealth
      .labels(serviceName, instance)
      .set(isHealthy ? 1 : 0);
  }

  /**
   * Set API connector health status
   */
  public setApiConnectorHealth(apiName: string, endpoint: string, isHealthy: boolean): void {
    this.apiConnectorHealth
      .labels(apiName, endpoint)
      .set(isHealthy ? 1 : 0);
  }

  /**
   * Set database connection count
   */
  public setDatabaseConnections(databaseType: string, databaseName: string, count: number): void {
    this.databaseConnections
      .labels(databaseType, databaseName)
      .set(count);
  }

  /**
   * Set cache hit rate
   */
  public setCacheHitRate(cacheType: string, cacheName: string, hitRate: number): void {
    this.cacheHitRate
      .labels(cacheType, cacheName)
      .set(hitRate);
  }

  /**
   * Record Monte Carlo simulation duration
   */
  public recordSimulationDuration(scenarioType: string, iterations: string, durationSeconds: number): void {
    this.simulationDuration
      .labels(scenarioType, iterations)
      .observe(durationSeconds);
  }

  /**
   * Increment simulation counter
   */
  public incrementSimulationCount(scenarioType: string, status: 'success' | 'error'): void {
    this.simulationTotal
      .labels(scenarioType, status)
      .inc();
  }

  /**
   * Increment data validation error counter
   */
  public incrementDataValidationError(dataSource: string, errorType: string): void {
    this.dataValidationErrors
      .labels(dataSource, errorType)
      .inc();
  }

  /**
   * Record data source latency
   */
  public recordDataSourceLatency(dataSource: string, endpoint: string, latencySeconds: number): void {
    this.dataSourceLatency
      .labels(dataSource, endpoint)
      .observe(latencySeconds);
  }

  /**
   * Get metrics in Prometheus format
   */
  public async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Clear all metrics (useful for testing)
   */
  public clearMetrics(): void {
    register.clear();
    this.registerAllMetrics();
  }

  /**
   * Re-register all metrics (useful after clearing)
   */
  private registerAllMetrics(): void {
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.httpRequestTotal);
    register.registerMetric(this.httpRequestErrors);
    register.registerMetric(this.predictionAccuracy);
    register.registerMetric(this.predictionLatency);
    register.registerMetric(this.predictionTotal);
    register.registerMetric(this.serviceHealth);
    register.registerMetric(this.apiConnectorHealth);
    register.registerMetric(this.databaseConnections);
    register.registerMetric(this.cacheHitRate);
    register.registerMetric(this.simulationDuration);
    register.registerMetric(this.simulationTotal);
    register.registerMetric(this.dataValidationErrors);
    register.registerMetric(this.dataSourceLatency);
  }
}
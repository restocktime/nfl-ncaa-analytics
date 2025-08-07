import { PrometheusMetrics } from '../../core/prometheus-metrics';
import { register } from 'prom-client';
import { Request, Response } from 'express';

describe('PrometheusMetrics', () => {
  let metrics: PrometheusMetrics;

  beforeEach(() => {
    // Clear registry and reset singleton
    register.clear();
    (PrometheusMetrics as any).instance = undefined;
    metrics = PrometheusMetrics.getInstance();
  });

  afterEach(() => {
    register.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PrometheusMetrics.getInstance();
      const instance2 = PrometheusMetrics.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('HTTP Metrics', () => {
    it('should record HTTP request metrics', async () => {
      const mockReq = {
        method: 'GET',
        path: '/api/predictions',
        route: { path: '/api/predictions' }
      } as Request;

      const mockRes = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            // Simulate response finish after 100ms
            setTimeout(callback, 100);
          }
        })
      } as unknown as Response;

      const middleware = metrics.httpMetricsMiddleware();
      const next = jest.fn();

      middleware(mockReq, mockRes, next);
      expect(next).toHaveBeenCalled();

      // Wait for the response to "finish"
      await new Promise(resolve => setTimeout(resolve, 150));

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('http_requests_total');
      expect(metricsOutput).toContain('http_request_duration_seconds');
    });

    it('should record HTTP error metrics', async () => {
      const mockReq = {
        method: 'POST',
        path: '/api/predictions',
        route: { path: '/api/predictions' }
      } as Request;

      const mockRes = {
        statusCode: 500,
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 50);
          }
        })
      } as unknown as Response;

      const middleware = metrics.httpMetricsMiddleware();
      const next = jest.fn();

      middleware(mockReq, mockRes, next);

      // Wait for the response to "finish"
      await new Promise(resolve => setTimeout(resolve, 100));

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('http_request_errors_total');
    });
  });

  describe('Prediction Metrics', () => {
    it('should record prediction accuracy', async () => {
      metrics.recordPredictionAccuracy('xgboost', 'win_probability', 0.85);

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('prediction_accuracy_ratio');
      expect(metricsOutput).toContain('model_type="xgboost"');
      expect(metricsOutput).toContain('prediction_type="win_probability"');
      expect(metricsOutput).toContain('0.85');
    });

    it('should record prediction latency', async () => {
      metrics.recordPredictionLatency('neural_network', 'spread', 1.5);

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('prediction_latency_seconds');
      expect(metricsOutput).toContain('model_type="neural_network"');
      expect(metricsOutput).toContain('prediction_type="spread"');
    });

    it('should increment prediction counters', async () => {
      metrics.incrementPredictionCount('ensemble', 'total_points', 'success');
      metrics.incrementPredictionCount('ensemble', 'total_points', 'error');

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('predictions_total');
      expect(metricsOutput).toContain('status="success"');
      expect(metricsOutput).toContain('status="error"');
    });
  });

  describe('Service Health Metrics', () => {
    it('should set service health status', async () => {
      metrics.setServiceHealth('api-gateway', 'instance-1', true);
      metrics.setServiceHealth('database', 'instance-1', false);

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('service_health_status');
      expect(metricsOutput).toContain('service_name="api-gateway"');
      expect(metricsOutput).toContain('service_name="database"');
      expect(metricsOutput).toMatch(/service_name="api-gateway".*1/);
      expect(metricsOutput).toMatch(/service_name="database".*0/);
    });

    it('should set API connector health', async () => {
      metrics.setApiConnectorHealth('sportsdata-io', '/scores', true);
      metrics.setApiConnectorHealth('espn', '/games', false);

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('api_connector_health_status');
      expect(metricsOutput).toContain('api_name="sportsdata-io"');
      expect(metricsOutput).toContain('api_name="espn"');
    });

    it('should set database connection count', async () => {
      metrics.setDatabaseConnections('postgresql', 'main', 5);
      metrics.setDatabaseConnections('influxdb', 'metrics', 2);

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('database_connections_active');
      expect(metricsOutput).toContain('database_type="postgresql"');
      expect(metricsOutput).toContain('database_type="influxdb"');
    });

    it('should set cache hit rate', async () => {
      metrics.setCacheHitRate('redis', 'predictions', 0.95);
      metrics.setCacheHitRate('redis', 'game-data', 0.78);

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('cache_hit_rate_ratio');
      expect(metricsOutput).toContain('cache_name="predictions"');
      expect(metricsOutput).toContain('cache_name="game-data"');
    });
  });

  describe('Monte Carlo Metrics', () => {
    it('should record simulation duration', async () => {
      metrics.recordSimulationDuration('win_probability', '1000', 15.5);
      metrics.recordSimulationDuration('spread_analysis', '5000', 45.2);

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('monte_carlo_simulation_duration_seconds');
      expect(metricsOutput).toContain('scenario_type="win_probability"');
      expect(metricsOutput).toContain('scenario_type="spread_analysis"');
      expect(metricsOutput).toContain('iterations="1000"');
      expect(metricsOutput).toContain('iterations="5000"');
    });

    it('should increment simulation counters', async () => {
      metrics.incrementSimulationCount('player_props', 'success');
      metrics.incrementSimulationCount('player_props', 'error');
      metrics.incrementSimulationCount('game_outcome', 'success');

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('monte_carlo_simulations_total');
      expect(metricsOutput).toContain('scenario_type="player_props"');
      expect(metricsOutput).toContain('scenario_type="game_outcome"');
    });
  });

  describe('Data Quality Metrics', () => {
    it('should increment data validation errors', async () => {
      metrics.incrementDataValidationError('sportsdata-io', 'invalid_score');
      metrics.incrementDataValidationError('espn', 'missing_field');
      metrics.incrementDataValidationError('sportsdata-io', 'invalid_score');

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('data_validation_errors_total');
      expect(metricsOutput).toContain('data_source="sportsdata-io"');
      expect(metricsOutput).toContain('data_source="espn"');
      expect(metricsOutput).toContain('error_type="invalid_score"');
      expect(metricsOutput).toContain('error_type="missing_field"');
    });

    it('should record data source latency', async () => {
      metrics.recordDataSourceLatency('odds-api', '/lines', 2.5);
      metrics.recordDataSourceLatency('weather-api', '/conditions', 1.2);

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('data_source_latency_seconds');
      expect(metricsOutput).toContain('data_source="odds-api"');
      expect(metricsOutput).toContain('data_source="weather-api"');
      expect(metricsOutput).toContain('endpoint="/lines"');
      expect(metricsOutput).toContain('endpoint="/conditions"');
    });
  });

  describe('Metrics Output', () => {
    it('should return metrics in Prometheus format', async () => {
      metrics.recordPredictionAccuracy('test_model', 'test_prediction', 0.9);
      metrics.setServiceHealth('test_service', 'test_instance', true);

      const metricsOutput = await metrics.getMetrics();
      
      // Should contain metric names
      expect(metricsOutput).toContain('prediction_accuracy_ratio');
      expect(metricsOutput).toContain('service_health_status');
      
      // Should contain HELP and TYPE comments
      expect(metricsOutput).toContain('# HELP');
      expect(metricsOutput).toContain('# TYPE');
      
      // Should contain labels and values
      expect(metricsOutput).toContain('model_type="test_model"');
      expect(metricsOutput).toContain('service_name="test_service"');
    });

    it('should include default Node.js metrics', async () => {
      const metricsOutput = await metrics.getMetrics();
      
      // Default metrics should be included
      expect(metricsOutput).toContain('process_cpu_user_seconds_total');
      expect(metricsOutput).toContain('process_cpu_system_seconds_total');
      expect(metricsOutput).toContain('nodejs_heap_size_total_bytes');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing route in HTTP middleware', async () => {
      const mockReq = {
        method: 'GET',
        path: '/unknown',
        route: undefined
      } as Request;

      const mockRes = {
        statusCode: 404,
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
        })
      } as unknown as Response;

      const middleware = metrics.httpMetricsMiddleware();
      const next = jest.fn();

      expect(() => {
        middleware(mockReq, mockRes, next);
      }).not.toThrow();

      expect(next).toHaveBeenCalled();
    });

    it('should handle extreme metric values', async () => {
      // Test with very high accuracy
      metrics.recordPredictionAccuracy('test', 'test', 1.0);
      
      // Test with very high latency
      metrics.recordPredictionLatency('test', 'test', 999.99);
      
      // Test with zero values
      metrics.recordSimulationDuration('test', '0', 0);
      
      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('prediction_accuracy_ratio');
      expect(metricsOutput).toContain('prediction_latency_seconds');
      expect(metricsOutput).toContain('monte_carlo_simulation_duration_seconds');
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with many metric updates', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate many metric updates
      for (let i = 0; i < 1000; i++) {
        metrics.recordPredictionAccuracy(`model_${i % 10}`, `type_${i % 5}`, Math.random());
        metrics.incrementPredictionCount(`model_${i % 10}`, `type_${i % 5}`, 'success');
        metrics.setServiceHealth(`service_${i % 3}`, `instance_${i % 2}`, i % 2 === 0);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB for 1000 updates)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
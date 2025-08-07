import { DistributedTracing, TraceSpan } from '../../core/distributed-tracing';
import { Request, Response } from 'express';
import { PrometheusMetrics } from '../../core/prometheus-metrics';

// Mock PrometheusMetrics
jest.mock('../../core/prometheus-metrics');

describe('DistributedTracing', () => {
  let tracing: DistributedTracing;
  let mockMetrics: jest.Mocked<PrometheusMetrics>;

  beforeEach(() => {
    mockMetrics = {
      recordPredictionLatency: jest.fn()
    } as any;

    (PrometheusMetrics.getInstance as jest.Mock).mockReturnValue(mockMetrics);
    
    tracing = DistributedTracing.getInstance();
    tracing.clearCompletedSpans();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DistributedTracing.getInstance();
      const instance2 = DistributedTracing.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Span Management', () => {
    it('should create and finish spans', () => {
      const span = tracing.startSpan({
        operation: 'test-operation',
        tags: { 'test.tag': 'test-value' }
      });

      expect(span.getTraceId()).toBeDefined();
      expect(span.getSpanId()).toBeDefined();
      expect(tracing.getActiveSpansCount()).toBe(1);

      span.finish();

      expect(tracing.getActiveSpansCount()).toBe(0);
      
      const completedSpans = tracing.getRecentTraces(10);
      expect(completedSpans).toHaveLength(1);
      expect(completedSpans[0].operation).toBe('test-operation');
      expect(completedSpans[0].tags['test.tag']).toBe('test-value');
    });

    it('should create child spans with proper hierarchy', () => {
      const parentSpan = tracing.startSpan({
        operation: 'parent-operation'
      });

      const childSpan = parentSpan.createChildSpan('child-operation', {
        'child.tag': 'child-value'
      });

      expect(childSpan.getTraceId()).toBe(parentSpan.getTraceId());
      expect(childSpan.getSpanId()).not.toBe(parentSpan.getSpanId());
      expect(tracing.getActiveSpansCount()).toBe(2);

      childSpan.finish();
      parentSpan.finish();

      const completedSpans = tracing.getRecentTraces(10);
      expect(completedSpans).toHaveLength(2);
      
      const childSpanData = completedSpans.find(s => s.operation === 'child-operation');
      const parentSpanData = completedSpans.find(s => s.operation === 'parent-operation');
      
      expect(childSpanData?.parentSpanId).toBe(parentSpan.getSpanId());
      expect(parentSpanData?.parentSpanId).toBeUndefined();
    });

    it('should handle span with custom trace and span IDs', () => {
      const customTraceId = 'custom-trace-123';
      const customSpanId = 'custom-span-456';

      const span = tracing.startSpan({
        traceId: customTraceId,
        spanId: customSpanId,
        operation: 'custom-operation'
      });

      expect(span.getTraceId()).toBe(customTraceId);
      expect(span.getSpanId()).toBe(customSpanId);

      span.finish();

      const completedSpans = tracing.getRecentTraces(10);
      expect(completedSpans[0].traceId).toBe(customTraceId);
      expect(completedSpans[0].spanId).toBe(customSpanId);
    });
  });

  describe('Span Operations', () => {
    it('should add tags to spans', () => {
      const span = tracing.startSpan({ operation: 'test-operation' });
      
      span.setTag('string.tag', 'string-value');
      span.setTag('number.tag', 42);
      span.setTag('boolean.tag', true);
      
      span.finish();

      const completedSpans = tracing.getRecentTraces(10);
      const spanData = completedSpans[0];
      
      expect(spanData.tags['string.tag']).toBe('string-value');
      expect(spanData.tags['number.tag']).toBe(42);
      expect(spanData.tags['boolean.tag']).toBe(true);
    });

    it('should add logs to spans', () => {
      const span = tracing.startSpan({ operation: 'test-operation' });
      
      span.log('info', 'Info message', { key: 'value' });
      span.log('error', 'Error message');
      span.log('debug', 'Debug message', { debug: true });
      
      span.finish();

      const completedSpans = tracing.getRecentTraces(10);
      const spanData = completedSpans[0];
      
      expect(spanData.logs).toHaveLength(3);
      expect(spanData.logs[0].level).toBe('info');
      expect(spanData.logs[0].message).toBe('Info message');
      expect(spanData.logs[0].fields).toEqual({ key: 'value' });
      expect(spanData.logs[1].level).toBe('error');
      expect(spanData.logs[1].message).toBe('Error message');
      expect(spanData.logs[2].level).toBe('debug');
    });

    it('should set span status', () => {
      const span = tracing.startSpan({ operation: 'test-operation' });
      
      span.setStatus('error');
      span.finish();

      const completedSpans = tracing.getRecentTraces(10);
      expect(completedSpans[0].status).toBe('error');
      expect(completedSpans[0].tags['span.status']).toBe('error');
    });

    it('should calculate span duration', async () => {
      const span = tracing.startSpan({ operation: 'test-operation' });
      
      // Wait a bit to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 10));
      
      span.finish();

      const completedSpans = tracing.getRecentTraces(10);
      const spanData = completedSpans[0];
      
      expect(spanData.duration).toBeGreaterThan(0);
      expect(spanData.endTime).toBeGreaterThan(spanData.startTime);
    });
  });

  describe('HTTP Middleware', () => {
    it('should create spans for HTTP requests', async () => {
      const mockReq = {
        method: 'GET',
        path: '/api/predictions',
        originalUrl: '/api/predictions?param=value',
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent'
        }
      } as any;

      const mockRes = {
        statusCode: 200,
        setHeader: jest.fn(),
        get: jest.fn().mockReturnValue('1024'),
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
        })
      } as unknown as Response;

      const middleware = tracing.tracingMiddleware();
      const next = jest.fn();

      middleware(mockReq, mockRes, next);

      expect(next).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-trace-id', expect.any(String));
      expect((mockReq as any).span).toBeDefined();
      expect((mockReq as any).traceId).toBeDefined();

      // Wait for response to finish
      await new Promise(resolve => setTimeout(resolve, 20));

      const completedSpans = tracing.getRecentTraces(10);
      expect(completedSpans).toHaveLength(1);
      
      const spanData = completedSpans[0];
      expect(spanData.operation).toBe('GET /api/predictions');
      expect(spanData.tags['http.method']).toBe('GET');
      expect(spanData.tags['http.url']).toBe('/api/predictions?param=value');
      expect(spanData.tags['http.status_code']).toBe(200);
      expect(spanData.tags['http.response_size']).toBe('1024');
    });

    it('should handle HTTP errors in middleware', async () => {
      const mockReq = {
        method: 'POST',
        path: '/api/predictions',
        originalUrl: '/api/predictions',
        ip: '127.0.0.1',
        headers: {}
      } as any;

      const mockRes = {
        statusCode: 500,
        setHeader: jest.fn(),
        get: jest.fn().mockReturnValue(undefined),
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 5);
          }
        })
      } as unknown as Response;

      const middleware = tracing.tracingMiddleware();
      const next = jest.fn();

      middleware(mockReq, mockRes, next);

      await new Promise(resolve => setTimeout(resolve, 15));

      const completedSpans = tracing.getRecentTraces(10);
      const spanData = completedSpans[0];
      
      expect(spanData.status).toBe('error');
      expect(spanData.tags['http.status_code']).toBe(500);
      expect(spanData.logs.some(log => log.level === 'error')).toBe(true);
    });

    it('should use existing trace ID from headers', () => {
      const existingTraceId = 'existing-trace-123';
      const existingParentSpanId = 'parent-span-456';

      const mockReq = {
        method: 'GET',
        path: '/api/test',
        originalUrl: '/api/test',
        headers: {
          'x-trace-id': existingTraceId,
          'x-parent-span-id': existingParentSpanId
        }
      } as any;

      const mockRes = {
        statusCode: 200,
        setHeader: jest.fn(),
        get: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            callback();
          }
        })
      } as unknown as Response;

      const middleware = tracing.tracingMiddleware();
      const next = jest.fn();

      middleware(mockReq, mockRes, next);

      expect((mockReq as any).traceId).toBe(existingTraceId);
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-trace-id', existingTraceId);

      const completedSpans = tracing.getRecentTraces(10);
      const spanData = completedSpans[0];
      
      expect(spanData.traceId).toBe(existingTraceId);
      expect(spanData.parentSpanId).toBe(existingParentSpanId);
    });
  });

  describe('Trace Retrieval', () => {
    it('should retrieve traces by trace ID', () => {
      const traceId = 'test-trace-123';
      
      const span1 = tracing.startSpan({ traceId, operation: 'operation-1' });
      const span2 = tracing.startSpan({ traceId, operation: 'operation-2' });
      const span3 = tracing.startSpan({ operation: 'different-trace' });
      
      span1.finish();
      span2.finish();
      span3.finish();

      const traceSpans = tracing.getTrace(traceId);
      
      expect(traceSpans).toHaveLength(2);
      expect(traceSpans.every(span => span.traceId === traceId)).toBe(true);
      expect(traceSpans.map(span => span.operation)).toContain('operation-1');
      expect(traceSpans.map(span => span.operation)).toContain('operation-2');
    });

    it('should retrieve recent traces with limit', () => {
      // Create multiple spans
      for (let i = 0; i < 15; i++) {
        const span = tracing.startSpan({ operation: `operation-${i}` });
        span.finish();
      }

      const recentTraces = tracing.getRecentTraces(10);
      
      expect(recentTraces).toHaveLength(10);
      // Should be sorted by start time (most recent first)
      expect(recentTraces[0].operation).toBe('operation-14');
      expect(recentTraces[9].operation).toBe('operation-5');
    });

    it('should return empty array for non-existent trace ID', () => {
      const traceSpans = tracing.getTrace('non-existent-trace');
      expect(traceSpans).toHaveLength(0);
    });
  });

  describe('Metrics Integration', () => {
    it('should record prediction metrics for prediction operations', () => {
      const span = tracing.startSpan({
        operation: 'prediction-calculation',
        tags: {
          'model.type': 'xgboost',
          'prediction.type': 'win_probability'
        }
      });

      // Simulate some processing time
      setTimeout(() => span.finish(), 100);

      // Wait for span to finish
      setTimeout(() => {
        expect(mockMetrics.recordPredictionLatency).toHaveBeenCalledWith(
          'xgboost',
          'win_probability',
          expect.any(Number)
        );
      }, 150);
    });

    it('should not record metrics for HTTP operations', () => {
      const span = tracing.startSpan({
        operation: 'HTTP GET /api/test'
      });

      span.finish();

      expect(mockMetrics.recordPredictionLatency).not.toHaveBeenCalled();
    });

    it('should handle missing model tags gracefully', () => {
      const span = tracing.startSpan({
        operation: 'model-inference'
      });

      span.finish();

      expect(mockMetrics.recordPredictionLatency).toHaveBeenCalledWith(
        'unknown',
        'unknown',
        expect.any(Number)
      );
    });
  });

  describe('Memory Management', () => {
    it('should limit completed spans to prevent memory leaks', () => {
      // Create more spans than the limit (10000)
      for (let i = 0; i < 10005; i++) {
        const span = tracing.startSpan({ operation: `operation-${i}` });
        span.finish();
      }

      const recentTraces = tracing.getRecentTraces(20000);
      
      // Should not exceed the maximum limit
      expect(recentTraces.length).toBeLessThanOrEqual(10000);
      
      // Should contain the most recent spans
      expect(recentTraces[0].operation).toBe('operation-10004');
    });

    it('should clean up active spans when finished', () => {
      const span1 = tracing.startSpan({ operation: 'operation-1' });
      const span2 = tracing.startSpan({ operation: 'operation-2' });
      
      expect(tracing.getActiveSpansCount()).toBe(2);
      
      span1.finish();
      expect(tracing.getActiveSpansCount()).toBe(1);
      
      span2.finish();
      expect(tracing.getActiveSpansCount()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle finishing non-existent spans gracefully', () => {
      expect(() => {
        tracing.finishSpan('non-existent-span-id');
      }).not.toThrow();
    });

    it('should handle adding logs to non-existent spans gracefully', () => {
      expect(() => {
        tracing.addLogToSpan('non-existent-span-id', 'info', 'test message');
      }).not.toThrow();
    });

    it('should handle adding tags to non-existent spans gracefully', () => {
      expect(() => {
        tracing.addTagToSpan('non-existent-span-id', 'test.tag', 'test-value');
      }).not.toThrow();
    });
  });
});
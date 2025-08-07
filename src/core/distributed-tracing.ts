import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PrometheusMetrics } from './prometheus-metrics';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  tags: Record<string, string | number | boolean>;
  logs: TraceLog[];
}

export interface TraceLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  fields?: Record<string, any>;
}

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, string | number | boolean>;
  logs: TraceLog[];
  status: 'ok' | 'error' | 'timeout';
}

/**
 * Distributed tracing service with correlation IDs
 * Provides request tracing across microservices and external API calls
 */
export class DistributedTracing {
  private static instance: DistributedTracing;
  private readonly activeSpans: Map<string, TraceContext> = new Map();
  private readonly completedSpans: Span[] = [];
  private readonly metrics: PrometheusMetrics;
  private readonly maxCompletedSpans: number = 10000;

  private constructor() {
    this.metrics = PrometheusMetrics.getInstance();
  }

  public static getInstance(): DistributedTracing {
    if (!DistributedTracing.instance) {
      DistributedTracing.instance = new DistributedTracing();
    }
    return DistributedTracing.instance;
  }

  /**
   * Express middleware for request tracing
   */
  public tracingMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Extract or generate trace ID
      const traceId = req.headers['x-trace-id'] as string || uuidv4();
      const spanId = uuidv4();
      const parentSpanId = req.headers['x-parent-span-id'] as string;

      // Set trace headers for downstream services
      req.headers['x-trace-id'] = traceId;
      req.headers['x-span-id'] = spanId;
      
      // Add trace ID to response headers
      res.setHeader('x-trace-id', traceId);

      // Create span for this request
      const span = this.startSpan({
        traceId,
        spanId,
        parentSpanId,
        operation: `${req.method} ${req.path}`,
        tags: {
          'http.method': req.method,
          'http.url': req.originalUrl,
          'http.user_agent': req.headers['user-agent'] || '',
          'http.remote_addr': req.ip || req.connection.remoteAddress || ''
        }
      });

      // Store span in request for access in handlers
      (req as any).span = span;
      (req as any).traceId = traceId;

      // Finish span when response ends
      res.on('finish', () => {
        span.setTag('http.status_code', res.statusCode);
        span.setTag('http.response_size', res.get('content-length') || 0);
        
        if (res.statusCode >= 400) {
          span.setStatus('error');
          span.log('error', `HTTP ${res.statusCode} response`);
        }
        
        span.finish();
      });

      next();
    };
  }

  /**
   * Start a new span
   */
  public startSpan(options: {
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
    operation: string;
    tags?: Record<string, string | number | boolean>;
  }): TraceSpan {
    const traceId = options.traceId || uuidv4();
    const spanId = options.spanId || uuidv4();
    
    const context: TraceContext = {
      traceId,
      spanId,
      parentSpanId: options.parentSpanId,
      operation: options.operation,
      startTime: Date.now(),
      tags: options.tags || {},
      logs: []
    };

    this.activeSpans.set(spanId, context);
    
    return new TraceSpan(this, context);
  }

  /**
   * Finish a span
   */
  public finishSpan(spanId: string, status: 'ok' | 'error' | 'timeout' = 'ok'): void {
    const context = this.activeSpans.get(spanId);
    if (!context) {
      return;
    }

    const endTime = Date.now();
    const duration = endTime - context.startTime;

    const completedSpan: Span = {
      ...context,
      endTime,
      duration,
      status
    };

    // Add to completed spans (with size limit)
    this.completedSpans.push(completedSpan);
    if (this.completedSpans.length > this.maxCompletedSpans) {
      this.completedSpans.shift();
    }

    // Remove from active spans
    this.activeSpans.delete(spanId);

    // Record metrics
    this.recordSpanMetrics(completedSpan);
  }

  /**
   * Add log to span
   */
  public addLogToSpan(spanId: string, level: 'info' | 'warn' | 'error' | 'debug', message: string, fields?: Record<string, any>): void {
    const context = this.activeSpans.get(spanId);
    if (context) {
      context.logs.push({
        timestamp: Date.now(),
        level,
        message,
        fields
      });
    }
  }

  /**
   * Add tag to span
   */
  public addTagToSpan(spanId: string, key: string, value: string | number | boolean): void {
    const context = this.activeSpans.get(spanId);
    if (context) {
      context.tags[key] = value;
    }
  }

  /**
   * Get trace by ID
   */
  public getTrace(traceId: string): Span[] {
    return this.completedSpans.filter(span => span.traceId === traceId);
  }

  /**
   * Get recent traces
   */
  public getRecentTraces(limit: number = 100): Span[] {
    return this.completedSpans
      .slice(-limit)
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
  }

  /**
   * Get active spans count
   */
  public getActiveSpansCount(): number {
    return this.activeSpans.size;
  }

  /**
   * Record span metrics in Prometheus
   */
  private recordSpanMetrics(span: Span): void {
    if (span.duration) {
      // Record operation duration
      const durationSeconds = span.duration / 1000;
      
      // Use a generic histogram for span durations
      // This would ideally be a dedicated tracing histogram
      if (span.operation.startsWith('HTTP')) {
        // HTTP requests are already tracked by HTTP metrics
        return;
      }

      // For other operations, we can use prediction latency as a proxy
      // In a real implementation, you'd want dedicated tracing metrics
      if (span.operation.includes('prediction') || span.operation.includes('model')) {
        this.metrics.recordPredictionLatency(
          span.tags['model.type'] as string || 'unknown',
          span.tags['prediction.type'] as string || 'unknown',
          durationSeconds
        );
      }
    }
  }

  /**
   * Clear completed spans (useful for testing)
   */
  public clearCompletedSpans(): void {
    this.completedSpans.length = 0;
  }
}

/**
 * Trace span wrapper class
 */
export class TraceSpan {
  constructor(
    private readonly tracer: DistributedTracing,
    private readonly context: TraceContext
  ) {}

  public getTraceId(): string {
    return this.context.traceId;
  }

  public getSpanId(): string {
    return this.context.spanId;
  }

  public setTag(key: string, value: string | number | boolean): void {
    this.tracer.addTagToSpan(this.context.spanId, key, value);
  }

  public log(level: 'info' | 'warn' | 'error' | 'debug', message: string, fields?: Record<string, any>): void {
    this.tracer.addLogToSpan(this.context.spanId, level, message, fields);
  }

  public setStatus(status: 'ok' | 'error' | 'timeout'): void {
    this.context.tags['span.status'] = status;
  }

  public finish(): void {
    const status = this.context.tags['span.status'] as 'ok' | 'error' | 'timeout' || 'ok';
    this.tracer.finishSpan(this.context.spanId, status);
  }

  /**
   * Create a child span
   */
  public createChildSpan(operation: string, tags?: Record<string, string | number | boolean>): TraceSpan {
    return this.tracer.startSpan({
      traceId: this.context.traceId,
      parentSpanId: this.context.spanId,
      operation,
      tags
    });
  }
}
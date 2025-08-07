import { LoadTestingSuite } from '../../testing/load-testing-suite';
import { WebSocketService } from '../../api/websocket-service';
import { APIGateway } from '../../api/api-gateway';
import { DatabaseService } from '../../core/database-service';
import { RedisCache } from '../../core/redis-cache';

// Mock dependencies
jest.mock('../../api/websocket-service');
jest.mock('../../api/api-gateway');
jest.mock('../../core/database-service');
jest.mock('../../core/redis-cache');
jest.mock('../../core/logger');

describe('Load Testing Suite', () => {
  let loadTestingSuite: LoadTestingSuite;
  let mockWebSocketService: jest.Mocked<WebSocketService>;
  let mockAPIGateway: jest.Mocked<APIGateway>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockRedisCache: jest.Mocked<RedisCache>;

  beforeEach(() => {
    mockWebSocketService = new WebSocketService({} as any, {} as any) as jest.Mocked<WebSocketService>;
    mockAPIGateway = new APIGateway({} as any, {} as any, {} as any) as jest.Mocked<APIGateway>;
    mockDatabaseService = new DatabaseService({} as any) as jest.Mocked<DatabaseService>;
    mockRedisCache = new RedisCache({} as any) as jest.Mocked<RedisCache>;

    loadTestingSuite = new LoadTestingSuite(
      mockWebSocketService,
      mockAPIGateway,
      mockDatabaseService,
      mockRedisCache
    );
  });

  describe('Peak Game Day Traffic Simulation', () => {
    it('should handle 10,000 concurrent WebSocket connections', async () => {
      const targetConnections = 10000;
      const rampUpDuration = 30000; // 30 seconds
      const testDuration = 300000; // 5 minutes

      // Mock WebSocket connection handling
      mockWebSocketService.handleConnection.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10)); // 0-10ms connection time
        return { connectionId: Math.random().toString(), success: true };
      });

      mockWebSocketService.broadcastProbabilityUpdate.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5)); // 0-5ms broadcast time
      });

      const result = await loadTestingSuite.simulatePeakTraffic({
        targetConnections,
        rampUpDuration,
        testDuration,
        messageFrequency: 1000, // 1 message per second per connection
        scenarioType: 'peak_game_day'
      });

      expect(result.totalConnections).toBe(targetConnections);
      expect(result.successfulConnections).toBeGreaterThan(targetConnections * 0.95); // 95% success rate
      expect(result.averageResponseTime).toBeLessThan(100); // < 100ms average response
      expect(result.errorRate).toBeLessThan(0.05); // < 5% error rate
      expect(result.throughput).toBeGreaterThan(9000); // > 9000 messages/second
    });

    it('should maintain performance under sustained load', async () => {
      const testConfig = {
        targetConnections: 5000,
        rampUpDuration: 15000,
        testDuration: 600000, // 10 minutes sustained load
        messageFrequency: 500,
        scenarioType: 'sustained_load' as const
      };

      // Mock sustained performance
      let responseTimeIncrease = 0;
      mockWebSocketService.handleConnection.mockImplementation(async () => {
        responseTimeIncrease += 0.1; // Slight degradation over time
        await new Promise(resolve => setTimeout(resolve, 10 + responseTimeIncrease));
        return { connectionId: Math.random().toString(), success: true };
      });

      const result = await loadTestingSuite.simulatePeakTraffic(testConfig);

      // Performance should not degrade significantly over time
      expect(result.performanceDegradation).toBeLessThan(0.2); // < 20% degradation
      expect(result.memoryLeaks).toBe(false);
      expect(result.connectionStability).toBeGreaterThan(0.98); // > 98% stable connections
    });

    it('should handle burst traffic patterns', async () => {
      const burstConfig = {
        targetConnections: 15000,
        rampUpDuration: 5000, // Very fast ramp-up
        testDuration: 60000,
        messageFrequency: 2000, // High frequency
        scenarioType: 'burst_traffic' as const
      };

      // Mock burst handling with some failures
      mockWebSocketService.handleConnection.mockImplementation(async () => {
        const success = Math.random() > 0.1; // 90% success rate during burst
        await new Promise(resolve => setTimeout(resolve, success ? 15 : 100));
        return { connectionId: Math.random().toString(), success };
      });

      const result = await loadTestingSuite.simulatePeakTraffic(burstConfig);

      expect(result.burstHandling.peakConnectionsPerSecond).toBeGreaterThan(1000);
      expect(result.burstHandling.recoveryTime).toBeLessThan(10000); // < 10 seconds recovery
      expect(result.burstHandling.systemStability).toBe(true);
    });
  });

  describe('API Load Testing', () => {
    it('should handle high-frequency API requests', async () => {
      const apiTestConfig = {
        endpoints: [
          '/api/probabilities',
          '/api/games/live',
          '/api/predictions',
          '/api/historical'
        ],
        requestsPerSecond: 1000,
        testDuration: 180000, // 3 minutes
        concurrentUsers: 500
      };

      // Mock API responses
      mockAPIGateway.handleRequest.mockImplementation(async (req) => {
        const responseTime = Math.random() * 50 + 10; // 10-60ms
        await new Promise(resolve => setTimeout(resolve, responseTime));
        
        return {
          statusCode: Math.random() > 0.05 ? 200 : 500, // 95% success rate
          body: { data: 'mock response' },
          headers: {}
        };
      });

      const result = await loadTestingSuite.testAPILoad(apiTestConfig);

      expect(result.totalRequests).toBeGreaterThan(150000); // Should handle high volume
      expect(result.averageResponseTime).toBeLessThan(100);
      expect(result.p95ResponseTime).toBeLessThan(200);
      expect(result.p99ResponseTime).toBeLessThan(500);
      expect(result.errorRate).toBeLessThan(0.1);
    });

    it('should maintain database performance under load', async () => {
      const dbTestConfig = {
        queryTypes: ['SELECT', 'INSERT', 'UPDATE'],
        queriesPerSecond: 500,
        testDuration: 120000,
        connectionPoolSize: 50
      };

      // Mock database operations
      mockDatabaseService.query.mockImplementation(async (query) => {
        const queryTime = query.startsWith('SELECT') ? 
          Math.random() * 20 + 5 : // 5-25ms for SELECT
          Math.random() * 50 + 10; // 10-60ms for INSERT/UPDATE
        
        await new Promise(resolve => setTimeout(resolve, queryTime));
        return [{ id: 1, data: 'mock' }];
      });

      const result = await loadTestingSuite.testDatabaseLoad(dbTestConfig);

      expect(result.averageQueryTime).toBeLessThan(50);
      expect(result.connectionPoolUtilization).toBeLessThan(0.8); // < 80% utilization
      expect(result.deadlocks).toBe(0);
      expect(result.timeouts).toBeLessThan(10);
    });

    it('should validate cache performance under high load', async () => {
      const cacheTestConfig = {
        operations: ['GET', 'SET', 'DEL'],
        operationsPerSecond: 2000,
        testDuration: 60000,
        keySpaceSize: 10000
      };

      // Mock Redis operations
      mockRedisCache.get.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5 + 1)); // 1-6ms
        return Math.random() > 0.2 ? 'cached_value' : null; // 80% hit rate
      });

      mockRedisCache.set.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 3 + 1)); // 1-4ms
      });

      const result = await loadTestingSuite.testCacheLoad(cacheTestConfig);

      expect(result.hitRate).toBeGreaterThan(0.75); // > 75% hit rate
      expect(result.averageResponseTime).toBeLessThan(10);
      expect(result.memoryUsage).toBeLessThan(0.9); // < 90% memory usage
      expect(result.evictionRate).toBeLessThan(0.1); // < 10% eviction rate
    });
  });

  describe('Stress Testing', () => {
    it('should identify system breaking points', async () => {
      const stressConfig = {
        startLoad: 1000,
        maxLoad: 50000,
        incrementStep: 2000,
        stepDuration: 30000,
        breakingPointThreshold: 0.5 // 50% error rate
      };

      // Mock progressive system degradation
      let currentLoad = stressConfig.startLoad;
      mockWebSocketService.handleConnection.mockImplementation(async () => {
        const errorRate = Math.min(currentLoad / 30000, 0.8); // Increase error rate with load
        const success = Math.random() > errorRate;
        await new Promise(resolve => setTimeout(resolve, success ? 20 : 200));
        return { connectionId: Math.random().toString(), success };
      });

      const result = await loadTestingSuite.findBreakingPoint(stressConfig);

      expect(result.breakingPoint).toBeGreaterThan(10000); // Should handle at least 10k
      expect(result.breakingPoint).toBeLessThan(stressConfig.maxLoad);
      expect(result.degradationPattern).toBeDefined();
      expect(result.recoveryTime).toBeLessThan(60000); // < 1 minute recovery
    });

    it('should test system recovery after overload', async () => {
      const recoveryConfig = {
        overloadDuration: 60000,
        overloadLevel: 20000,
        recoveryMonitorDuration: 300000,
        normalLoad: 5000
      };

      // Mock overload and recovery
      let isOverloaded = true;
      setTimeout(() => { isOverloaded = false; }, recoveryConfig.overloadDuration);

      mockWebSocketService.handleConnection.mockImplementation(async () => {
        const errorRate = isOverloaded ? 0.7 : 0.05;
        const success = Math.random() > errorRate;
        await new Promise(resolve => setTimeout(resolve, success ? 20 : 200));
        return { connectionId: Math.random().toString(), success };
      });

      const result = await loadTestingSuite.testRecoveryAfterOverload(recoveryConfig);

      expect(result.recoveryTime).toBeLessThan(120000); // < 2 minutes
      expect(result.finalPerformance.errorRate).toBeLessThan(0.1);
      expect(result.dataIntegrity).toBe(true);
      expect(result.serviceAvailability).toBeGreaterThan(0.95);
    });
  });

  describe('Scalability Testing', () => {
    it('should validate horizontal scaling effectiveness', async () => {
      const scalingConfig = {
        baselineInstances: 2,
        maxInstances: 10,
        loadPerInstance: 2000,
        scalingTriggerThreshold: 0.8,
        testDuration: 300000
      };

      // Mock scaling behavior
      let currentInstances = scalingConfig.baselineInstances;
      mockWebSocketService.handleConnection.mockImplementation(async () => {
        const loadPerInstance = 10000 / currentInstances; // Distribute load
        const errorRate = Math.max(0, (loadPerInstance - 2000) / 10000); // Error increases with load per instance
        const success = Math.random() > errorRate;
        
        // Simulate auto-scaling
        if (errorRate > scalingConfig.scalingTriggerThreshold && currentInstances < scalingConfig.maxInstances) {
          currentInstances++;
        }
        
        await new Promise(resolve => setTimeout(resolve, success ? 15 : 100));
        return { connectionId: Math.random().toString(), success };
      });

      const result = await loadTestingSuite.testHorizontalScaling(scalingConfig);

      expect(result.scalingEfficiency).toBeGreaterThan(0.7); // > 70% efficiency
      expect(result.maxInstancesUsed).toBeGreaterThan(scalingConfig.baselineInstances);
      expect(result.costEffectiveness).toBeGreaterThan(0.6); // > 60% cost effective
      expect(result.performanceConsistency).toBeGreaterThan(0.8);
    });

    it('should test vertical scaling limits', async () => {
      const verticalConfig = {
        baselineResources: { cpu: 2, memory: 4096 },
        maxResources: { cpu: 16, memory: 32768 },
        loadIncrement: 1000,
        resourceUtilizationThreshold: 0.9
      };

      const result = await loadTestingSuite.testVerticalScaling(verticalConfig);

      expect(result.optimalConfiguration.cpu).toBeGreaterThan(verticalConfig.baselineResources.cpu);
      expect(result.optimalConfiguration.memory).toBeGreaterThan(verticalConfig.baselineResources.memory);
      expect(result.resourceEfficiency).toBeGreaterThan(0.6);
      expect(result.diminishingReturnsPoint).toBeDefined();
    });
  });

  describe('Performance Regression Testing', () => {
    it('should detect performance regressions', async () => {
      const baselineMetrics = {
        averageResponseTime: 45,
        throughput: 8500,
        errorRate: 0.02,
        memoryUsage: 2048
      };

      const currentMetrics = await loadTestingSuite.measureCurrentPerformance({
        testDuration: 60000,
        load: 5000
      });

      const regressionResult = loadTestingSuite.detectRegressions(baselineMetrics, currentMetrics);

      expect(regressionResult.hasRegressions).toBeDefined();
      expect(regressionResult.regressionDetails).toBeDefined();
      
      if (regressionResult.hasRegressions) {
        expect(regressionResult.severity).toBeOneOf(['minor', 'major', 'critical']);
        expect(regressionResult.affectedMetrics.length).toBeGreaterThan(0);
      }
    });

    it('should validate performance improvements', async () => {
      const beforeMetrics = {
        averageResponseTime: 80,
        throughput: 6000,
        errorRate: 0.08,
        memoryUsage: 3072
      };

      const afterMetrics = {
        averageResponseTime: 45,
        throughput: 8500,
        errorRate: 0.02,
        memoryUsage: 2048
      };

      const improvementResult = loadTestingSuite.validateImprovements(beforeMetrics, afterMetrics);

      expect(improvementResult.hasImprovements).toBe(true);
      expect(improvementResult.responseTimeImprovement).toBeCloseTo(0.4375, 2); // 43.75% improvement
      expect(improvementResult.throughputImprovement).toBeCloseTo(0.4167, 2); // 41.67% improvement
      expect(improvementResult.overallScore).toBeGreaterThan(0.3);
    });
  });

  describe('Resource Utilization Testing', () => {
    it('should monitor system resources under load', async () => {
      const resourceConfig = {
        monitoringDuration: 180000,
        load: 8000,
        resourceTypes: ['cpu', 'memory', 'disk', 'network']
      };

      const result = await loadTestingSuite.monitorResourceUtilization(resourceConfig);

      expect(result.cpu.average).toBeLessThan(0.8); // < 80% CPU
      expect(result.cpu.peak).toBeLessThan(0.95); // < 95% peak CPU
      expect(result.memory.average).toBeLessThan(0.85); // < 85% memory
      expect(result.memory.leaks).toBe(false);
      expect(result.disk.ioWait).toBeLessThan(0.1); // < 10% IO wait
      expect(result.network.bandwidth).toBeLessThan(0.7); // < 70% bandwidth
    });

    it('should identify resource bottlenecks', async () => {
      const bottleneckConfig = {
        testScenarios: [
          { name: 'cpu_intensive', load: 10000, duration: 60000 },
          { name: 'memory_intensive', load: 5000, duration: 60000 },
          { name: 'io_intensive', load: 3000, duration: 60000 }
        ]
      };

      const result = await loadTestingSuite.identifyBottlenecks(bottleneckConfig);

      expect(result.primaryBottleneck).toBeOneOf(['cpu', 'memory', 'disk', 'network', 'database']);
      expect(result.bottleneckSeverity).toBeOneOf(['low', 'medium', 'high', 'critical']);
      expect(result.recommendations).toHaveLength.greaterThan(0);
      expect(result.estimatedImpact).toBeDefined();
    });
  });
});

// Helper function for test assertions
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});
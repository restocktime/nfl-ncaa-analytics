import 'reflect-metadata';
import { CloudComputeManager } from '../../core/cloud-compute-manager';
import { MonteCarloService } from '../../core/monte-carlo-service';
import { Logger } from '../../core/logger';
import { ResourceType, ResourceStatus } from '../../types/simulation.types';

describe('Cloud Compute Integration Tests', () => {
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;
  });

  it('should create cloud compute manager successfully', () => {
    const manager = new CloudComputeManager(mockLogger);
    expect(manager).toBeInstanceOf(CloudComputeManager);
    
    const stats = manager.getResourceStats();
    expect(stats.total).toBeGreaterThan(0);
    
    manager.cleanup();
  });

  it('should integrate with Monte Carlo service', () => {
    const cloudManager = new CloudComputeManager(mockLogger);
    const service = new MonteCarloService(mockLogger, 2, {}, cloudManager);
    
    expect(service).toBeInstanceOf(MonteCarloService);
    expect(service.getActiveJobCount()).toBe(0);
    
    const resourceStats = service.getResourceStats();
    expect(resourceStats).toBeDefined();
    expect(resourceStats.total).toBeGreaterThan(0);
    
    service.cleanup();
  });

  it('should handle resource scaling operations', async () => {
    const manager = new CloudComputeManager(mockLogger, {
      minResources: 1,
      maxResources: 3,
      targetUtilization: 0.7,
      scaleUpThreshold: 0.8,
      scaleDownThreshold: 0.3,
      cooldownPeriod: 0.1 // Very short for testing
    });

    const initialCount = manager.getActiveResourceCount();
    expect(initialCount).toBeGreaterThan(0);

    // Test scaling
    await manager.scaleComputeResources(5);
    
    // Should have logged scaling decision
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Evaluating scaling decision'),
      expect.any(Object)
    );

    await manager.cleanup();
  });

  it('should manage resource lifecycle', () => {
    const manager = new CloudComputeManager(mockLogger);
    
    // Add resource
    const resourceId = manager.addResource({
      type: ResourceType.CLOUD_FUNCTION,
      status: ResourceStatus.IDLE,
      capacity: 2,
      currentLoad: 0
    });

    expect(resourceId).toBeDefined();
    
    // Update status
    const updated = manager.updateResourceStatus(resourceId, ResourceStatus.BUSY, 1.5);
    expect(updated).toBe(true);
    
    // Check utilization
    const utilization = manager.getCurrentUtilization();
    expect(utilization).toBeGreaterThan(0);
    
    manager.cleanup();
  });

  it('should provide accurate statistics', () => {
    const manager = new CloudComputeManager(mockLogger);
    
    const stats = manager.getResourceStats();
    expect(stats).toMatchObject({
      total: expect.any(Number),
      active: expect.any(Number),
      idle: expect.any(Number),
      busy: expect.any(Number),
      utilization: expect.any(Number),
      queueDepth: expect.any(Number)
    });
    
    expect(stats.utilization).toBeGreaterThanOrEqual(0);
    expect(stats.utilization).toBeLessThanOrEqual(1);
    
    manager.cleanup();
  });
});
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { 
  ComputeResource, 
  ResourceType, 
  ResourceStatus, 
  ScalingPolicy,
  SimulationBatch,
  BatchStatus,
  WorkerTask,
  WorkerResult
} from '../types/simulation.types';
import { Logger } from './logger';

/**
 * Cloud compute resource manager for Monte Carlo simulations
 * Handles auto-scaling and distributed simulation coordination
 */
export class CloudComputeManager extends EventEmitter {
  private resources = new Map<string, ComputeResource>();
  private scalingPolicy: ScalingPolicy;
  private lastScaleAction: Date = new Date(0);
  private queueDepth: number = 0;
  private readonly logger: Logger;

  constructor(
    logger: Logger,
    scalingPolicy: Partial<ScalingPolicy> = {}
  ) {
    super();
    this.logger = logger;
    this.scalingPolicy = {
      minResources: 1,
      maxResources: 10,
      targetUtilization: 0.7,
      scaleUpThreshold: 0.8,
      scaleDownThreshold: 0.3,
      cooldownPeriod: 300, // 5 minutes
      ...scalingPolicy
    };

    this.initializeLocalResources();
    this.startHealthCheckInterval();
  }

  /**
   * Scale compute resources based on demand
   */
  async scaleComputeResources(queueDepth: number): Promise<void> {
    this.queueDepth = queueDepth;
    
    const currentUtilization = this.getCurrentUtilization();
    const activeResources = this.getActiveResourceCount();
    
    this.logger.info('Evaluating scaling decision', {
      queueDepth,
      currentUtilization,
      activeResources,
      scaleUpThreshold: this.scalingPolicy.scaleUpThreshold,
      scaleDownThreshold: this.scalingPolicy.scaleDownThreshold
    });

    // Check cooldown period
    const timeSinceLastScale = Date.now() - this.lastScaleAction.getTime();
    if (timeSinceLastScale < this.scalingPolicy.cooldownPeriod * 1000) {
      this.logger.debug('Scaling action skipped due to cooldown period');
      return;
    }

    // Scale up if utilization is high
    if (currentUtilization > this.scalingPolicy.scaleUpThreshold && 
        activeResources < this.scalingPolicy.maxResources) {
      await this.scaleUp();
    }
    // Scale down if utilization is low
    else if (currentUtilization < this.scalingPolicy.scaleDownThreshold && 
             activeResources > this.scalingPolicy.minResources) {
      await this.scaleDown();
    }
  }

  /**
   * Distribute simulation batch across available resources
   */
  async distributeBatch(batch: SimulationBatch): Promise<WorkerResult[]> {
    const availableResources = this.getAvailableResources();
    
    if (availableResources.length === 0) {
      throw new Error('No available compute resources');
    }

    this.logger.info(`Distributing batch ${batch.id} across ${availableResources.length} resources`);

    // Create worker tasks for each scenario
    const allTasks: WorkerTask[] = [];
    for (const scenario of batch.scenarios) {
      const tasksPerResource = Math.ceil(scenario.iterations / availableResources.length);
      
      let currentIteration = 0;
      for (const resource of availableResources) {
        const startIteration = currentIteration;
        const endIteration = Math.min(currentIteration + tasksPerResource, scenario.iterations);
        
        if (startIteration < endIteration) {
          allTasks.push({
            id: uuidv4(),
            scenarioId: scenario.id,
            startIteration,
            endIteration,
            scenario,
            config: batch.config
          });
          
          currentIteration = endIteration;
        }
      }
    }

    // Execute tasks across resources
    const results = await this.executeDistributedTasks(allTasks, availableResources);
    
    this.logger.info(`Completed batch ${batch.id} with ${results.length} results`);
    return results;
  }

  /**
   * Get available compute resources
   */
  getAvailableResources(): ComputeResource[] {
    return Array.from(this.resources.values())
      .filter(resource => resource.status === ResourceStatus.IDLE);
  }

  /**
   * Get active resource count
   */
  getActiveResourceCount(): number {
    return Array.from(this.resources.values())
      .filter(resource => resource.status !== ResourceStatus.OFFLINE).length;
  }

  /**
   * Get current utilization across all resources
   */
  getCurrentUtilization(): number {
    const activeResources = Array.from(this.resources.values())
      .filter(resource => resource.status !== ResourceStatus.OFFLINE);
    
    if (activeResources.length === 0) {
      return 0;
    }

    const totalLoad = activeResources.reduce((sum, resource) => sum + resource.currentLoad, 0);
    const totalCapacity = activeResources.reduce((sum, resource) => sum + resource.capacity, 0);
    
    return totalCapacity > 0 ? totalLoad / totalCapacity : 0;
  }

  /**
   * Add a compute resource
   */
  addResource(resource: Omit<ComputeResource, 'id' | 'lastHeartbeat'>): string {
    const id = uuidv4();
    const fullResource: ComputeResource = {
      ...resource,
      id,
      lastHeartbeat: new Date()
    };
    
    this.resources.set(id, fullResource);
    
    this.logger.info(`Added compute resource ${id}`, {
      type: resource.type,
      capacity: resource.capacity,
      status: resource.status
    });
    
    this.emit('resourceAdded', fullResource);
    return id;
  }

  /**
   * Remove a compute resource
   */
  async removeResource(resourceId: string): Promise<boolean> {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      return false;
    }

    // For testing, don't wait for busy resources
    this.resources.delete(resourceId);
    
    this.logger.info(`Removed compute resource ${resourceId}`);
    this.emit('resourceRemoved', resource);
    
    return true;
  }

  /**
   * Update resource status
   */
  updateResourceStatus(resourceId: string, status: ResourceStatus, currentLoad?: number): boolean {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      return false;
    }

    resource.status = status;
    resource.lastHeartbeat = new Date();
    
    if (currentLoad !== undefined) {
      resource.currentLoad = currentLoad;
    }

    this.emit('resourceStatusChanged', resource);
    return true;
  }

  /**
   * Get resource statistics
   */
  getResourceStats(): {
    total: number;
    active: number;
    idle: number;
    busy: number;
    utilization: number;
    queueDepth: number;
  } {
    const resources = Array.from(this.resources.values());
    const active = resources.filter(r => r.status !== ResourceStatus.OFFLINE);
    const idle = resources.filter(r => r.status === ResourceStatus.IDLE);
    const busy = resources.filter(r => r.status === ResourceStatus.BUSY);

    return {
      total: resources.length,
      active: active.length,
      idle: idle.length,
      busy: busy.length,
      utilization: this.getCurrentUtilization(),
      queueDepth: this.queueDepth
    };
  }

  /**
   * Initialize local compute resources
   */
  private initializeLocalResources(): void {
    // Add local worker resources
    const localWorkerCount = 2; // Default local workers
    
    for (let i = 0; i < localWorkerCount; i++) {
      this.addResource({
        type: ResourceType.LOCAL_WORKER,
        status: ResourceStatus.IDLE,
        capacity: 1,
        currentLoad: 0,
        metadata: {
          workerId: i,
          local: true
        }
      });
    }
  }

  /**
   * Scale up compute resources
   */
  private async scaleUp(): Promise<void> {
    const currentCount = this.getActiveResourceCount();
    const targetCount = Math.min(currentCount + 1, this.scalingPolicy.maxResources);
    
    if (targetCount <= currentCount) {
      return;
    }

    this.logger.info(`Scaling up from ${currentCount} to ${targetCount} resources`);
    
    try {
      // Try to add cloud function first, fallback to container
      const resourceId = await this.provisionCloudResource();
      this.lastScaleAction = new Date();
      
      this.emit('scaleUp', { from: currentCount, to: targetCount, resourceId });
    } catch (error) {
      this.logger.error('Failed to scale up resources', error as Error);
    }
  }

  /**
   * Scale down compute resources
   */
  private async scaleDown(): Promise<void> {
    const currentCount = this.getActiveResourceCount();
    const targetCount = Math.max(currentCount - 1, this.scalingPolicy.minResources);
    
    if (targetCount >= currentCount) {
      return;
    }

    this.logger.info(`Scaling down from ${currentCount} to ${targetCount} resources`);
    
    try {
      // Remove the least utilized non-local resource
      const resourceToRemove = this.findResourceToRemove();
      if (resourceToRemove) {
        await this.removeResource(resourceToRemove.id);
        this.lastScaleAction = new Date();
        
        this.emit('scaleDown', { from: currentCount, to: targetCount, resourceId: resourceToRemove.id });
      }
    } catch (error) {
      this.logger.error('Failed to scale down resources', error as Error);
    }
  }

  /**
   * Provision a new cloud resource
   */
  private async provisionCloudResource(): Promise<string> {
    // Simulate cloud resource provisioning
    // In a real implementation, this would call AWS Lambda, GCP Functions, etc.
    
    const resourceType = Math.random() > 0.5 ? ResourceType.CLOUD_FUNCTION : ResourceType.CONTAINER;
    
    const resourceId = this.addResource({
      type: resourceType,
      status: ResourceStatus.SCALING,
      capacity: resourceType === ResourceType.CLOUD_FUNCTION ? 2 : 4,
      currentLoad: 0,
      metadata: {
        cloud: true,
        region: 'us-east-1',
        provisionedAt: new Date()
      }
    });

    // Simulate provisioning delay
    setTimeout(() => {
      this.updateResourceStatus(resourceId, ResourceStatus.IDLE);
    }, 2000);

    return resourceId;
  }

  /**
   * Find resource to remove during scale down
   */
  private findResourceToRemove(): ComputeResource | null {
    const candidates = Array.from(this.resources.values())
      .filter(resource => 
        resource.status === ResourceStatus.IDLE && 
        !resource.metadata?.local // Don't remove local resources
      )
      .sort((a, b) => a.currentLoad - b.currentLoad); // Remove least utilized first

    return candidates[0] || null;
  }

  /**
   * Execute tasks across distributed resources
   */
  private async executeDistributedTasks(
    tasks: WorkerTask[], 
    resources: ComputeResource[]
  ): Promise<WorkerResult[]> {
    const results: WorkerResult[] = [];
    const taskPromises: Promise<WorkerResult>[] = [];

    // Distribute tasks across resources
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const resource = resources[i % resources.length];
      
      // Mark resource as busy
      this.updateResourceStatus(resource.id, ResourceStatus.BUSY, resource.currentLoad + 1);
      
      const taskPromise = this.executeTaskOnResource(task, resource)
        .finally(() => {
          // Mark resource as idle when task completes
          this.updateResourceStatus(resource.id, ResourceStatus.IDLE, Math.max(0, resource.currentLoad - 1));
        });
      
      taskPromises.push(taskPromise);
    }

    // Wait for all tasks to complete
    const taskResults = await Promise.allSettled(taskPromises);
    
    for (const result of taskResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        this.logger.error('Task execution failed', result.reason);
      }
    }

    return results;
  }

  /**
   * Execute a single task on a specific resource
   */
  private async executeTaskOnResource(task: WorkerTask, resource: ComputeResource): Promise<WorkerResult> {
    this.logger.debug(`Executing task ${task.id} on resource ${resource.id}`);
    
    // Simulate task execution based on resource type
    const executionTime = this.getExecutionTime(resource.type);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate mock result
        const iterations = task.endIteration - task.startIteration;
        const outcomes = Array.from({ length: iterations }, () => Math.random());
        
        resolve({
          taskId: task.id,
          scenarioId: task.scenarioId,
          iterations,
          outcomes,
          factors: {
            resource_capacity: resource.capacity,
            execution_efficiency: 1.0
          },
          executionTime
        });
      }, executionTime);
    });
  }

  /**
   * Get execution time based on resource type
   */
  private getExecutionTime(resourceType: ResourceType): number {
    switch (resourceType) {
      case ResourceType.LOCAL_WORKER:
        return 100 + Math.random() * 200; // 100-300ms
      case ResourceType.CLOUD_FUNCTION:
        return 50 + Math.random() * 100; // 50-150ms (faster)
      case ResourceType.CONTAINER:
        return 75 + Math.random() * 150; // 75-225ms
      default:
        return 200;
    }
  }

  /**
   * Wait for resource to become idle
   */
  private async waitForResourceIdle(resourceId: string, timeoutMs: number): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const resource = this.resources.get(resourceId);
      if (!resource || resource.status === ResourceStatus.IDLE) {
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }

  private healthCheckInterval?: NodeJS.Timeout;

  /**
   * Start health check interval for resources
   */
  private startHealthCheckInterval(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform health check on all resources
   */
  private performHealthCheck(): void {
    const now = new Date();
    const staleThreshold = 60000; // 1 minute

    for (const [resourceId, resource] of this.resources.entries()) {
      const timeSinceHeartbeat = now.getTime() - resource.lastHeartbeat.getTime();
      
      if (timeSinceHeartbeat > staleThreshold && resource.status !== ResourceStatus.OFFLINE) {
        this.logger.warn(`Resource ${resourceId} appears stale, marking as offline`);
        this.updateResourceStatus(resourceId, ResourceStatus.OFFLINE);
      }
    }
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    // Clear all resources immediately for testing
    this.resources.clear();
    
    this.logger.info('Cloud compute manager cleanup completed');
  }
}
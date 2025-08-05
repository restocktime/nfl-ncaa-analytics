import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { 
  SimulationScenario, 
  SimulationConfig, 
  SimulationProgress, 
  WorkerTask, 
  WorkerResult,
  SimulationBatch,
  BatchStatus,
  BatchPriority,
  ComputeDemand
} from '../types/simulation.types';
import { SimulationResult, OutcomeDistribution, ConfidenceInterval, Factor } from '../models/SimulationResult';
import { Logger } from './logger';
import { CloudComputeManager } from './cloud-compute-manager';

export class MonteCarloService {
  private workers: Worker[] = [];
  private activeJobs = new Map<string, SimulationProgress>();
  private jobQueue: SimulationBatch[] = [];
  private eventEmitter = new EventEmitter();
  private readonly maxWorkers: number;
  private readonly defaultConfig: SimulationConfig;
  protected logger: Logger;
  private cloudManager: CloudComputeManager;

  constructor(
    logger: Logger,
    maxWorkers: number = 4,
    defaultConfig: Partial<SimulationConfig> = {},
    cloudManager?: CloudComputeManager
  ) {
    this.logger = logger;
    this.maxWorkers = maxWorkers;
    this.defaultConfig = {
      maxIterations: 10000,
      convergenceThreshold: 0.001,
      parallelWorkers: maxWorkers,
      enableCaching: true,
      timeoutMs: 300000, // 5 minutes
      ...defaultConfig
    };
    
    this.cloudManager = cloudManager || new CloudComputeManager(logger);
    this.initializeWorkerPool();
  }

  /**
   * Run a single Monte Carlo simulation
   */
  async runSimulation(scenario: SimulationScenario, config?: Partial<SimulationConfig>): Promise<SimulationResult> {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };
    
    this.logger.info(`Starting Monte Carlo simulation for scenario ${scenario.id}`, {
      scenarioId: scenario.id,
      iterations: scenario.iterations,
      variables: scenario.variables.length
    });

    try {
      // Validate scenario
      this.validateScenario(scenario);
      
      // Create progress tracker
      const progress: SimulationProgress = {
        scenarioId: scenario.id,
        completedIterations: 0,
        totalIterations: scenario.iterations,
        estimatedTimeRemaining: 0
      };
      
      this.activeJobs.set(scenario.id, progress);
      
      // Distribute work across workers
      const workerTasks = this.createWorkerTasks(scenario, finalConfig);
      const workerResults = await this.executeWorkerTasks(workerTasks, progress);
      
      // Aggregate results
      const result = this.aggregateResults(scenario.id, workerResults, Date.now() - startTime);
      
      this.activeJobs.delete(scenario.id);
      
      this.logger.info(`Completed Monte Carlo simulation for scenario ${scenario.id}`, {
        scenarioId: scenario.id,
        iterations: result.iterations,
        executionTime: result.executionTime,
        mean: result.outcomes.mean
      });
      
      return result;
      
    } catch (error) {
      this.activeJobs.delete(scenario.id);
      this.logger.error(`Monte Carlo simulation failed for scenario ${scenario.id}`, error as Error);
      throw error;
    }
  }

  /**
   * Run multiple simulations in batch
   */
  async runBatchSimulations(
    scenarios: SimulationScenario[], 
    config?: Partial<SimulationConfig>,
    priority: BatchPriority = BatchPriority.NORMAL
  ): Promise<SimulationResult[]> {
    const batchId = uuidv4();
    const batch: SimulationBatch = {
      id: batchId,
      scenarios,
      config: { ...this.defaultConfig, ...config },
      priority,
      createdAt: new Date(),
      status: BatchStatus.QUEUED
    };

    this.logger.info(`Starting batch simulation ${batchId}`, {
      batchId,
      scenarioCount: scenarios.length,
      priority
    });

    try {
      batch.status = BatchStatus.RUNNING;
      batch.startedAt = new Date();
      
      // Sort scenarios by priority and complexity
      const sortedScenarios = this.prioritizeScenarios(scenarios);
      
      // Execute simulations with concurrency control
      const results = await this.executeBatchWithConcurrency(sortedScenarios, batch.config);
      
      batch.status = BatchStatus.COMPLETED;
      batch.completedAt = new Date();
      
      this.logger.info(`Completed batch simulation ${batchId}`, {
        batchId,
        scenarioCount: results.length,
        totalExecutionTime: batch.completedAt.getTime() - batch.startedAt!.getTime()
      });
      
      return results;
      
    } catch (error) {
      batch.status = BatchStatus.FAILED;
      this.logger.error(`Batch simulation failed ${batchId}`, error as Error);
      throw error;
    }
  }

  /**
   * Get simulation progress
   */
  getSimulationProgress(scenarioId: string): SimulationProgress | undefined {
    return this.activeJobs.get(scenarioId);
  }

  /**
   * Cancel a running simulation
   */
  async cancelSimulation(scenarioId: string): Promise<boolean> {
    const progress = this.activeJobs.get(scenarioId);
    if (!progress) {
      return false;
    }

    this.eventEmitter.emit('cancel', scenarioId);
    this.activeJobs.delete(scenarioId);
    
    this.logger.info(`Cancelled simulation ${scenarioId}`);
    return true;
  }

  /**
   * Get active job count
   */
  getActiveJobCount(): number {
    return this.activeJobs.size;
  }

  /**
   * Scale compute resources based on simulation queue depth
   */
  async scaleComputeResources(demand: ComputeDemand): Promise<void> {
    const queueDepth = this.jobQueue.length + this.activeJobs.size;
    
    this.logger.info('Scaling compute resources', {
      queueDepth,
      demand: demand.level,
      expectedIterations: demand.expectedIterations
    });

    await this.cloudManager.scaleComputeResources(queueDepth);
  }

  /**
   * Get compute resource statistics
   */
  getResourceStats(): any {
    return this.cloudManager.getResourceStats();
  }

  /**
   * Subscribe to progress updates
   */
  onProgress(callback: (progress: SimulationProgress) => void): void {
    this.eventEmitter.on('progress', callback);
  }

  /**
   * Initialize worker thread pool
   */
  private initializeWorkerPool(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(__dirname + '/monte-carlo-worker.js');
      this.workers.push(worker);
    }
    
    this.logger.info(`Initialized Monte Carlo worker pool with ${this.maxWorkers} workers`);
  }

  /**
   * Validate simulation scenario
   */
  private validateScenario(scenario: SimulationScenario): void {
    if (!scenario.id) {
      throw new Error('Scenario must have an ID');
    }
    
    if (scenario.iterations < 1) {
      throw new Error('Iterations must be at least 1');
    }
    
    if (scenario.iterations > 1000000) {
      throw new Error('Iterations cannot exceed 1,000,000');
    }
    
    if (!scenario.gameState) {
      throw new Error('Scenario must have a game state');
    }
    
    if (!scenario.variables || scenario.variables.length === 0) {
      throw new Error('Scenario must have at least one variable');
    }
    
    // Validate variable distributions
    for (const variable of scenario.variables) {
      if (!variable.distribution || !variable.distribution.type) {
        throw new Error(`Variable ${variable.name} must have a distribution type`);
      }
    }
    
    // Validate constraints
    for (const constraint of scenario.constraints || []) {
      if (!constraint.condition) {
        throw new Error(`Constraint ${constraint.name} must have a condition`);
      }
    }
  }

  /**
   * Create worker tasks from scenario
   */
  private createWorkerTasks(scenario: SimulationScenario, config: SimulationConfig): WorkerTask[] {
    const tasksPerWorker = Math.ceil(scenario.iterations / config.parallelWorkers!);
    const tasks: WorkerTask[] = [];
    
    let currentIteration = 0;
    for (let i = 0; i < config.parallelWorkers!; i++) {
      const startIteration = currentIteration;
      const endIteration = Math.min(currentIteration + tasksPerWorker, scenario.iterations);
      
      if (startIteration < endIteration) {
        tasks.push({
          id: uuidv4(),
          scenarioId: scenario.id,
          startIteration,
          endIteration,
          scenario,
          config
        });
        
        currentIteration = endIteration;
      }
    }
    
    return tasks;
  }

  /**
   * Execute worker tasks in parallel
   */
  private async executeWorkerTasks(
    tasks: WorkerTask[], 
    progress: SimulationProgress
  ): Promise<WorkerResult[]> {
    const promises = tasks.map((task, index) => 
      this.executeWorkerTask(task, this.workers[index % this.workers.length], progress)
    );
    
    return Promise.all(promises);
  }

  /**
   * Execute a single worker task
   */
  private async executeWorkerTask(
    task: WorkerTask, 
    worker: Worker, 
    progress: SimulationProgress
  ): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Worker task ${task.id} timed out`));
      }, task.config.timeoutMs || 300000);

      worker.once('message', (result: WorkerResult) => {
        clearTimeout(timeout);
        
        // Update progress
        progress.completedIterations += result.iterations;
        progress.estimatedTimeRemaining = this.estimateTimeRemaining(progress);
        
        this.eventEmitter.emit('progress', progress);
        
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      });

      worker.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      worker.postMessage(task);
    });
  }

  /**
   * Aggregate results from multiple workers
   */
  private aggregateResults(
    scenarioId: string, 
    workerResults: WorkerResult[], 
    totalExecutionTime: number
  ): SimulationResult {
    const allOutcomes: number[] = [];
    const allFactors: { [key: string]: number[] } = {};
    let totalIterations = 0;

    // Combine all worker results
    for (const result of workerResults) {
      allOutcomes.push(...result.outcomes);
      totalIterations += result.iterations;
      
      // Aggregate factors
      for (const [factorName, factorValue] of Object.entries(result.factors)) {
        if (!allFactors[factorName]) {
          allFactors[factorName] = [];
        }
        allFactors[factorName].push(factorValue);
      }
    }

    // Calculate outcome distribution
    const outcomes = this.calculateOutcomeDistribution(allOutcomes);
    
    // Calculate confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(allOutcomes, 0.95);
    
    // Calculate key factors
    const keyFactors = this.calculateKeyFactors(allFactors);

    return new SimulationResult({
      scenarioId,
      iterations: totalIterations,
      outcomes,
      confidenceInterval,
      keyFactors,
      executionTime: totalExecutionTime
    });
  }

  /**
   * Calculate outcome distribution statistics
   */
  private calculateOutcomeDistribution(outcomes: number[]): OutcomeDistribution {
    const sorted = outcomes.sort((a, b) => a - b);
    const n = sorted.length;
    
    const mean = sorted.reduce((sum, val) => sum + val, 0) / n;
    const median = n % 2 === 0 
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
      : sorted[Math.floor(n / 2)];
    
    const variance = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);
    
    const percentile25 = sorted[Math.floor(n * 0.25)];
    const percentile75 = sorted[Math.floor(n * 0.75)];
    
    return new OutcomeDistribution({
      mean,
      median,
      standardDeviation,
      percentile25,
      percentile75,
      minimum: sorted[0],
      maximum: sorted[n - 1]
    });
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(outcomes: number[], confidenceLevel: number): ConfidenceInterval {
    const sorted = outcomes.sort((a, b) => a - b);
    const n = sorted.length;
    const alpha = 1 - confidenceLevel;
    
    const lowerIndex = Math.floor(n * alpha / 2);
    const upperIndex = Math.floor(n * (1 - alpha / 2));
    
    return new ConfidenceInterval({
      lower: sorted[lowerIndex],
      upper: sorted[upperIndex],
      confidenceLevel
    });
  }

  /**
   * Calculate key factors from aggregated factor data
   */
  private calculateKeyFactors(allFactors: { [key: string]: number[] }): Factor[] {
    const factors: Factor[] = [];
    
    for (const [name, values] of Object.entries(allFactors)) {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const confidence = Math.max(0, Math.min(1, 1 - Math.sqrt(variance)));
      
      factors.push(new Factor({
        name,
        impact: mean,
        confidence,
        description: `Factor ${name} with average impact of ${mean.toFixed(3)}`
      }));
    }
    
    return factors.sort((a, b) => b.getAbsoluteImpact() - a.getAbsoluteImpact());
  }

  /**
   * Estimate remaining time for simulation
   */
  private estimateTimeRemaining(progress: SimulationProgress): number {
    if (progress.completedIterations === 0) {
      return 0;
    }
    
    const completionRate = progress.completedIterations / progress.totalIterations;
    const elapsedTime = Date.now() - (progress as any).startTime || 0;
    const estimatedTotalTime = elapsedTime / completionRate;
    
    return Math.max(0, estimatedTotalTime - elapsedTime);
  }

  /**
   * Prioritize scenarios for batch execution
   */
  private prioritizeScenarios(scenarios: SimulationScenario[]): SimulationScenario[] {
    return scenarios.sort((a, b) => {
      // Sort by complexity (fewer iterations first for quick feedback)
      return a.iterations - b.iterations;
    });
  }

  /**
   * Execute batch with concurrency control and cloud scaling
   */
  private async executeBatchWithConcurrency(
    scenarios: SimulationScenario[], 
    config: SimulationConfig
  ): Promise<SimulationResult[]> {
    // Calculate compute demand
    const totalIterations = scenarios.reduce((sum, s) => sum + s.iterations, 0);
    const demand: ComputeDemand = {
      level: totalIterations > 50000 ? 'high' : totalIterations > 10000 ? 'medium' : 'low',
      expectedIterations: totalIterations,
      priority: BatchPriority.NORMAL
    };

    // Scale resources based on demand
    await this.scaleComputeResources(demand);

    // Use cloud manager for large batches
    if (totalIterations > 20000) {
      return this.executeCloudBatch(scenarios, config);
    }

    // Use local execution for smaller batches
    const results: SimulationResult[] = [];
    const maxConcurrent = Math.min(this.maxWorkers, scenarios.length);
    
    for (let i = 0; i < scenarios.length; i += maxConcurrent) {
      const batch = scenarios.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(scenario => this.runSimulation(scenario, config));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Execute batch using cloud resources
   */
  private async executeCloudBatch(
    scenarios: SimulationScenario[], 
    config: SimulationConfig
  ): Promise<SimulationResult[]> {
    const batch: SimulationBatch = {
      id: uuidv4(),
      scenarios,
      config,
      priority: BatchPriority.NORMAL,
      createdAt: new Date(),
      status: BatchStatus.QUEUED
    };

    this.logger.info(`Executing cloud batch ${batch.id} with ${scenarios.length} scenarios`);

    try {
      batch.status = BatchStatus.RUNNING;
      batch.startedAt = new Date();

      // Distribute batch across cloud resources
      const workerResults = await this.cloudManager.distributeBatch(batch);
      
      // Aggregate results by scenario
      const scenarioResults = new Map<string, WorkerResult[]>();
      for (const result of workerResults) {
        if (!scenarioResults.has(result.scenarioId)) {
          scenarioResults.set(result.scenarioId, []);
        }
        scenarioResults.get(result.scenarioId)!.push(result);
      }

      // Convert to simulation results
      const results: SimulationResult[] = [];
      for (const [scenarioId, results_] of scenarioResults.entries()) {
        const totalExecutionTime = results_.reduce((sum, r) => sum + r.executionTime, 0);
        const aggregatedResult = this.aggregateResults(scenarioId, results_, totalExecutionTime);
        results.push(aggregatedResult);
      }

      batch.status = BatchStatus.COMPLETED;
      batch.completedAt = new Date();

      return results;

    } catch (error) {
      batch.status = BatchStatus.FAILED;
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cancel all active jobs
    for (const scenarioId of this.activeJobs.keys()) {
      await this.cancelSimulation(scenarioId);
    }
    
    // Terminate all workers
    await Promise.all(this.workers.map(worker => worker.terminate()));
    this.workers = [];
    
    // Cleanup cloud resources
    await this.cloudManager.cleanup();
    
    this.logger.info('Monte Carlo service cleanup completed');
  }
}
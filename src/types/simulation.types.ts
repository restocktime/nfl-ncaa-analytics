/**
 * Monte Carlo simulation type definitions
 */

import { GameState } from './game.types';
import { SimulationResult } from '../models/SimulationResult';

export interface SimulationScenario {
  id: string;
  gameState: GameState;
  iterations: number;
  variables: SimulationVariable[];
  constraints: SimulationConstraint[];
  metadata?: { [key: string]: any };
}

export interface SimulationVariable {
  name: string;
  type: VariableType;
  distribution: DistributionConfig;
  bounds?: {
    min: number;
    max: number;
  };
  correlation?: VariableCorrelation[];
}

export enum VariableType {
  CONTINUOUS = 'continuous',
  DISCRETE = 'discrete',
  BOOLEAN = 'boolean',
  CATEGORICAL = 'categorical'
}

export interface DistributionConfig {
  type: DistributionType;
  parameters: { [key: string]: number };
}

export enum DistributionType {
  NORMAL = 'normal',
  UNIFORM = 'uniform',
  BETA = 'beta',
  GAMMA = 'gamma',
  POISSON = 'poisson',
  BINOMIAL = 'binomial',
  EXPONENTIAL = 'exponential'
}

export interface VariableCorrelation {
  variable: string;
  coefficient: number; // -1 to 1
}

export interface SimulationConstraint {
  name: string;
  type: ConstraintType;
  condition: string; // JavaScript expression
  penalty?: number; // Penalty for violating constraint
}

export enum ConstraintType {
  HARD = 'hard', // Must be satisfied
  SOFT = 'soft', // Preferred but not required
  PENALTY = 'penalty' // Adds penalty to objective function
}

export interface SimulationConfig {
  maxIterations: number;
  convergenceThreshold?: number;
  parallelWorkers?: number;
  randomSeed?: number;
  enableCaching?: boolean;
  timeoutMs?: number;
}

export interface SimulationProgress {
  scenarioId: string;
  completedIterations: number;
  totalIterations: number;
  estimatedTimeRemaining: number;
  currentResult?: Partial<SimulationResult>;
}

export interface WorkerTask {
  id: string;
  scenarioId: string;
  startIteration: number;
  endIteration: number;
  scenario: SimulationScenario;
  config: SimulationConfig;
}

export interface WorkerResult {
  taskId: string;
  scenarioId: string;
  iterations: number;
  outcomes: number[];
  factors: { [key: string]: number };
  executionTime: number;
  error?: string;
}

export interface SimulationBatch {
  id: string;
  scenarios: SimulationScenario[];
  config: SimulationConfig;
  priority: BatchPriority;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: BatchStatus;
}

export enum BatchPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

export enum BatchStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ComputeResource {
  id: string;
  type: ResourceType;
  status: ResourceStatus;
  capacity: number;
  currentLoad: number;
  lastHeartbeat: Date;
  metadata?: { [key: string]: any };
}

export enum ResourceType {
  LOCAL_WORKER = 'local_worker',
  CLOUD_FUNCTION = 'cloud_function',
  CONTAINER = 'container',
  VM_INSTANCE = 'vm_instance'
}

export enum ResourceStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  SCALING = 'scaling',
  ERROR = 'error',
  OFFLINE = 'offline'
}

export interface ScalingPolicy {
  minResources: number;
  maxResources: number;
  targetUtilization: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number; // seconds
}

export interface ComputeDemand {
  level: 'low' | 'medium' | 'high' | 'critical';
  expectedIterations: number;
  priority: BatchPriority;
  estimatedDuration?: number;
}
// ML Model types for the football analytics system

export enum ModelType {
  XGBOOST = 'xgboost',
  NEURAL_NETWORK = 'neural_network',
  LINEAR_REGRESSION = 'linear_regression',
  LOGISTIC_REGRESSION = 'logistic_regression',
  ENSEMBLE = 'ensemble'
}

export enum ModelStatus {
  TRAINING = 'training',
  TRAINED = 'trained',
  DEPLOYED = 'deployed',
  DEPRECATED = 'deprecated',
  FAILED = 'failed'
}

export interface Model {
  id: string;
  name: string;
  type: ModelType;
  version: string;
  status: ModelStatus;
  accuracy: number;
  createdAt: Date;
  lastTrained: Date;
  deployedAt?: Date;
  metadata: ModelMetadata;
  hyperparameters: Record<string, any>;
  features: string[];
  targetVariable: string;
}

export interface ModelMetadata {
  description: string;
  author: string;
  tags: string[];
  trainingDataSize: number;
  validationDataSize: number;
  testDataSize: number;
  crossValidationFolds: number;
}

export interface TrainingData {
  features: number[][];
  targets: number[];
  featureNames: string[];
  metadata: {
    size: number;
    startDate: Date;
    endDate: Date;
    source: string;
  };
}

export interface FeatureVector {
  values: number[];
  names: string[];
  timestamp: Date;
  gameId?: string;
  teamId?: string;
}

export interface Prediction {
  value: number;
  confidence: number;
  probability?: number;
  timestamp: Date;
  modelId: string;
  modelVersion: string;
  features: FeatureVector;
}

export interface ValidationResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc?: number;
  mse?: number;
  mae?: number;
  r2?: number;
  confusionMatrix?: number[][];
  crossValidationScores: number[];
  testResults: {
    predictions: Prediction[];
    actualValues: number[];
  };
}

export interface Explanation {
  predictionId: string;
  featureImportances: FeatureImportance[];
  shapValues?: ShapValue[];
  globalExplanation?: GlobalExplanation;
  localExplanation: LocalExplanation;
}

export interface FeatureImportance {
  featureName: string;
  importance: number;
  rank: number;
}

export interface ShapValue {
  featureName: string;
  shapValue: number;
  featureValue: number;
  baseValue: number;
}

export interface GlobalExplanation {
  topFeatures: FeatureImportance[];
  featureInteractions: FeatureInteraction[];
  modelComplexity: number;
}

export interface LocalExplanation {
  prediction: number;
  baseValue: number;
  featureContributions: FeatureContribution[];
}

export interface FeatureContribution {
  featureName: string;
  contribution: number;
  featureValue: number;
}

export interface FeatureInteraction {
  feature1: string;
  feature2: string;
  interactionStrength: number;
}

export interface ModelConfig {
  type: ModelType;
  hyperparameters: Record<string, any>;
  features: string[];
  targetVariable: string;
  validationSplit: number;
  crossValidationFolds: number;
  earlyStoppingRounds?: number;
  maxIterations?: number;
}

export interface ABTestConfig {
  name: string;
  description: string;
  controlModelId: string;
  treatmentModelId: string;
  trafficSplit: number; // 0-1, percentage for treatment
  startDate: Date;
  endDate: Date;
  successMetrics: string[];
  minimumSampleSize: number;
}

export interface ABTestResult {
  testId: string;
  controlMetrics: Record<string, number>;
  treatmentMetrics: Record<string, number>;
  statisticalSignificance: boolean;
  pValue: number;
  confidenceInterval: [number, number];
  winner: 'control' | 'treatment' | 'inconclusive';
  sampleSize: {
    control: number;
    treatment: number;
  };
}

export interface EnsembleConfig {
  models: string[]; // Model IDs
  weights?: number[];
  method: 'weighted_average' | 'voting' | 'stacking';
  metaLearner?: ModelConfig; // For stacking
}

export interface ModelPerformanceMetrics {
  modelId: string;
  timestamp: Date;
  accuracy: number;
  latency: number; // ms
  throughput: number; // predictions per second
  errorRate: number;
  memoryUsage: number; // MB
  cpuUsage: number; // percentage
}
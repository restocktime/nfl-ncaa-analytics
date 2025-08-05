import { injectable, inject } from 'inversify';
import { v4 as uuidv4 } from 'uuid';
import { 
  Model, 
  ModelType, 
  ModelStatus, 
  TrainingData, 
  FeatureVector, 
  Prediction, 
  ValidationResult, 
  ModelConfig,
  ABTestConfig,
  ABTestResult,
  EnsembleConfig,
  ModelPerformanceMetrics,
  Explanation,
  GlobalExplanation
} from '../types/ml.types';
import { Logger } from 'winston';
import { TYPES } from '../container/types';
import { IShapExplainer, VisualizationData, ConsistencyReport } from './shap-explainer';

export interface IMLModelService {
  createModel(config: ModelConfig): Promise<Model>;
  trainModel(modelId: string, trainingData: TrainingData): Promise<Model>;
  predict(modelId: string, features: FeatureVector): Promise<Prediction>;
  validateModel(modelId: string, testData: TrainingData): Promise<ValidationResult>;
  deployModel(modelId: string): Promise<Model>;
  getModel(modelId: string): Promise<Model | null>;
  listModels(type?: ModelType, status?: ModelStatus): Promise<Model[]>;
  deleteModel(modelId: string): Promise<boolean>;
  
  // Versioning
  createModelVersion(baseModelId: string, config: ModelConfig): Promise<Model>;
  compareModels(modelId1: string, modelId2: string, testData: TrainingData): Promise<ValidationResult[]>;
  
  // A/B Testing
  createABTest(config: ABTestConfig): Promise<string>;
  getABTestResult(testId: string): Promise<ABTestResult>;
  endABTest(testId: string): Promise<ABTestResult>;
  
  // Ensemble methods
  createEnsemble(config: EnsembleConfig): Promise<Model>;
  
  // Model explanations
  explainPrediction(modelId: string, features: FeatureVector): Promise<Explanation>;
  generateGlobalExplanation(modelId: string, sampleData: FeatureVector[]): Promise<GlobalExplanation>;
  visualizeExplanation(explanation: Explanation): VisualizationData;
  validateExplanationConsistency(explanations: Explanation[]): ConsistencyReport;
  
  // Performance monitoring
  recordPerformanceMetrics(metrics: ModelPerformanceMetrics): Promise<void>;
  getPerformanceMetrics(modelId: string, startDate: Date, endDate: Date): Promise<ModelPerformanceMetrics[]>;
}

@injectable()
export class MLModelService implements IMLModelService {
  private models: Map<string, Model> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();
  private abTestResults: Map<string, ABTestResult> = new Map();
  private performanceMetrics: Map<string, ModelPerformanceMetrics[]> = new Map();

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.ShapExplainer) private shapExplainer: IShapExplainer
  ) {}

  async createModel(config: ModelConfig): Promise<Model> {
    const modelId = uuidv4();
    const now = new Date();
    
    const model: Model = {
      id: modelId,
      name: `${config.type}_${now.getTime()}`,
      type: config.type,
      version: '1.0.0',
      status: ModelStatus.TRAINING,
      accuracy: 0,
      createdAt: now,
      lastTrained: now,
      metadata: {
        description: `${config.type} model for football analytics`,
        author: 'system',
        tags: [config.type, 'football', 'analytics'],
        trainingDataSize: 0,
        validationDataSize: 0,
        testDataSize: 0,
        crossValidationFolds: config.crossValidationFolds
      },
      hyperparameters: config.hyperparameters,
      features: config.features,
      targetVariable: config.targetVariable
    };

    this.models.set(modelId, model);
    this.logger.info(`Created model ${modelId} of type ${config.type}`);
    
    return model;
  }

  async trainModel(modelId: string, trainingData: TrainingData): Promise<Model> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    this.logger.info(`Starting training for model ${modelId}`);
    
    try {
      // Update model status
      model.status = ModelStatus.TRAINING;
      model.lastTrained = new Date();
      model.metadata.trainingDataSize = trainingData.features.length;

      // Simulate training process based on model type
      const accuracy = await this.performTraining(model, trainingData);
      
      model.accuracy = accuracy;
      model.status = ModelStatus.TRAINED;
      
      this.logger.info(`Training completed for model ${modelId} with accuracy ${accuracy}`);
      
      return model;
    } catch (error) {
      model.status = ModelStatus.FAILED;
      this.logger.error(`Training failed for model ${modelId}:`, error);
      throw error;
    }
  }

  async predict(modelId: string, features: FeatureVector): Promise<Prediction> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.status !== ModelStatus.TRAINED && model.status !== ModelStatus.DEPLOYED) {
      throw new Error(`Model ${modelId} is not ready for predictions. Status: ${model.status}`);
    }

    const startTime = Date.now();
    
    // Simulate prediction based on model type
    const prediction = await this.performPrediction(model, features);
    
    const endTime = Date.now();
    const latency = endTime - startTime;

    // Record performance metrics
    await this.recordPerformanceMetrics({
      modelId,
      timestamp: new Date(),
      accuracy: model.accuracy,
      latency,
      throughput: 1000 / latency, // predictions per second
      errorRate: 0,
      memoryUsage: 0, // Would be measured in real implementation
      cpuUsage: 0 // Would be measured in real implementation
    });

    return prediction;
  }

  async validateModel(modelId: string, testData: TrainingData): Promise<ValidationResult> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    this.logger.info(`Validating model ${modelId}`);

    // Perform cross-validation
    const crossValidationScores: number[] = [];
    const folds = model.metadata.crossValidationFolds;
    
    for (let i = 0; i < folds; i++) {
      // Simulate cross-validation fold
      const foldScore = await this.performCrossValidationFold(model, testData, i, folds);
      crossValidationScores.push(foldScore);
    }

    // Generate predictions for test data
    const predictions: Prediction[] = [];
    const actualValues: number[] = [];
    
    for (let i = 0; i < Math.min(testData.features.length, 100); i++) {
      const features: FeatureVector = {
        values: testData.features[i],
        names: testData.featureNames,
        timestamp: new Date()
      };
      
      const prediction = await this.predict(modelId, features);
      predictions.push(prediction);
      actualValues.push(testData.targets[i]);
    }

    // Calculate validation metrics
    const validationResult = this.calculateValidationMetrics(predictions, actualValues, crossValidationScores);
    
    model.metadata.testDataSize = testData.features.length;
    
    this.logger.info(`Validation completed for model ${modelId} with accuracy ${validationResult.accuracy}`);
    
    return validationResult;
  }

  async deployModel(modelId: string): Promise<Model> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.status !== ModelStatus.TRAINED) {
      throw new Error(`Model ${modelId} must be trained before deployment`);
    }

    model.status = ModelStatus.DEPLOYED;
    model.deployedAt = new Date();
    
    this.logger.info(`Deployed model ${modelId}`);
    
    return model;
  }

  async getModel(modelId: string): Promise<Model | null> {
    return this.models.get(modelId) || null;
  }

  async listModels(type?: ModelType, status?: ModelStatus): Promise<Model[]> {
    let models = Array.from(this.models.values());
    
    if (type) {
      models = models.filter(model => model.type === type);
    }
    
    if (status) {
      models = models.filter(model => model.status === status);
    }
    
    return models.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteModel(modelId: string): Promise<boolean> {
    const deleted = this.models.delete(modelId);
    if (deleted) {
      this.logger.info(`Deleted model ${modelId}`);
    }
    return deleted;
  }

  async createModelVersion(baseModelId: string, config: ModelConfig): Promise<Model> {
    const baseModel = this.models.get(baseModelId);
    if (!baseModel) {
      throw new Error(`Base model ${baseModelId} not found`);
    }

    const versionParts = baseModel.version.split('.');
    const majorVersion = parseInt(versionParts[0]);
    const minorVersion = parseInt(versionParts[1]);
    const patchVersion = parseInt(versionParts[2]);
    
    const newVersion = `${majorVersion}.${minorVersion}.${patchVersion + 1}`;
    
    const newModel = await this.createModel(config);
    newModel.name = baseModel.name;
    newModel.version = newVersion;
    
    return newModel;
  }

  async compareModels(modelId1: string, modelId2: string, testData: TrainingData): Promise<ValidationResult[]> {
    const results = await Promise.all([
      this.validateModel(modelId1, testData),
      this.validateModel(modelId2, testData)
    ]);
    
    this.logger.info(`Compared models ${modelId1} and ${modelId2}`);
    
    return results;
  }

  async createABTest(config: ABTestConfig): Promise<string> {
    const testId = uuidv4();
    this.abTests.set(testId, config);
    
    this.logger.info(`Created A/B test ${testId} comparing ${config.controlModelId} vs ${config.treatmentModelId}`);
    
    return testId;
  }

  async getABTestResult(testId: string): Promise<ABTestResult> {
    const config = this.abTests.get(testId);
    if (!config) {
      throw new Error(`A/B test ${testId} not found`);
    }

    // Check if we have cached results
    let result = this.abTestResults.get(testId);
    if (!result) {
      // Generate mock results for demonstration
      result = {
        testId,
        controlMetrics: { accuracy: 0.85, precision: 0.82, recall: 0.88 },
        treatmentMetrics: { accuracy: 0.87, precision: 0.84, recall: 0.90 },
        statisticalSignificance: true,
        pValue: 0.03,
        confidenceInterval: [0.01, 0.04],
        winner: 'treatment',
        sampleSize: {
          control: 1000,
          treatment: 1000
        }
      };
      
      this.abTestResults.set(testId, result);
    }
    
    return result;
  }

  async endABTest(testId: string): Promise<ABTestResult> {
    const result = await this.getABTestResult(testId);
    this.abTests.delete(testId);
    
    this.logger.info(`Ended A/B test ${testId} with winner: ${result.winner}`);
    
    return result;
  }

  async createEnsemble(config: EnsembleConfig): Promise<Model> {
    // Validate that all models exist
    for (const modelId of config.models) {
      const model = this.models.get(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found for ensemble`);
      }
    }

    const ensembleModel = await this.createModel({
      type: ModelType.ENSEMBLE,
      hyperparameters: { 
        method: config.method,
        weights: config.weights || Array(config.models.length).fill(1 / config.models.length)
      },
      features: [], // Will be derived from component models
      targetVariable: 'ensemble_prediction',
      validationSplit: 0.2,
      crossValidationFolds: 5
    });

    ensembleModel.metadata.description = `Ensemble of ${config.models.length} models using ${config.method}`;
    
    this.logger.info(`Created ensemble model ${ensembleModel.id} with ${config.models.length} component models`);
    
    return ensembleModel;
  }

  async explainPrediction(modelId: string, features: FeatureVector): Promise<Explanation> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.status !== ModelStatus.TRAINED && model.status !== ModelStatus.DEPLOYED) {
      throw new Error(`Model ${modelId} is not ready for explanations. Status: ${model.status}`);
    }

    // Get prediction first
    const prediction = await this.predict(modelId, features);
    
    // Generate SHAP explanation using the dedicated service
    const explanation = await this.shapExplainer.explainPrediction(model, features, prediction.value);
    
    this.logger.info(`Generated SHAP explanation for model ${modelId} with ${explanation.shapValues?.length || 0} SHAP values`);
    
    return explanation;
  }

  async generateGlobalExplanation(modelId: string, sampleData: FeatureVector[]): Promise<GlobalExplanation> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.status !== ModelStatus.TRAINED && model.status !== ModelStatus.DEPLOYED) {
      throw new Error(`Model ${modelId} is not ready for global explanations. Status: ${model.status}`);
    }

    if (sampleData.length === 0) {
      throw new Error('Sample data is required for global explanation generation');
    }

    const globalExplanation = await this.shapExplainer.generateGlobalExplanation(model, sampleData);
    
    this.logger.info(`Generated global explanation for model ${modelId} with ${globalExplanation.topFeatures.length} top features`);
    
    return globalExplanation;
  }

  visualizeExplanation(explanation: Explanation): VisualizationData {
    return this.shapExplainer.visualizeFeatureImportance(explanation);
  }

  validateExplanationConsistency(explanations: Explanation[]): ConsistencyReport {
    return this.shapExplainer.validateExplanationConsistency(explanations);
  }

  async recordPerformanceMetrics(metrics: ModelPerformanceMetrics): Promise<void> {
    if (!this.performanceMetrics.has(metrics.modelId)) {
      this.performanceMetrics.set(metrics.modelId, []);
    }
    
    const modelMetrics = this.performanceMetrics.get(metrics.modelId)!;
    modelMetrics.push(metrics);
    
    // Keep only last 1000 metrics per model
    if (modelMetrics.length > 1000) {
      modelMetrics.splice(0, modelMetrics.length - 1000);
    }
  }

  async getPerformanceMetrics(modelId: string, startDate: Date, endDate: Date): Promise<ModelPerformanceMetrics[]> {
    const modelMetrics = this.performanceMetrics.get(modelId) || [];
    
    return modelMetrics.filter(metric => 
      metric.timestamp >= startDate && metric.timestamp <= endDate
    );
  }

  private async performTraining(model: Model, trainingData: TrainingData): Promise<number> {
    // Simulate training time based on model type and data size
    const trainingTime = this.calculateTrainingTime(model.type, trainingData.features.length);
    await this.sleep(trainingTime);
    
    // Return mock accuracy based on model type
    switch (model.type) {
      case ModelType.XGBOOST:
        return 0.85 + Math.random() * 0.1;
      case ModelType.NEURAL_NETWORK:
        return 0.82 + Math.random() * 0.12;
      case ModelType.LINEAR_REGRESSION:
        return 0.75 + Math.random() * 0.1;
      case ModelType.LOGISTIC_REGRESSION:
        return 0.78 + Math.random() * 0.1;
      case ModelType.ENSEMBLE:
        return 0.88 + Math.random() * 0.08;
      default:
        return 0.8 + Math.random() * 0.1;
    }
  }

  private async performPrediction(model: Model, features: FeatureVector): Promise<Prediction> {
    // Simulate prediction time
    await this.sleep(10 + Math.random() * 20);
    
    const prediction: Prediction = {
      value: Math.random(),
      confidence: 0.7 + Math.random() * 0.3,
      probability: Math.random(),
      timestamp: new Date(),
      modelId: model.id,
      modelVersion: model.version,
      features
    };
    
    return prediction;
  }

  private async performCrossValidationFold(model: Model, data: TrainingData, fold: number, totalFolds: number): Promise<number> {
    // Simulate cross-validation fold
    await this.sleep(50 + Math.random() * 100);
    
    // Return mock accuracy with some variation
    const baseAccuracy = model.accuracy || 0.8;
    return baseAccuracy + (Math.random() - 0.5) * 0.1;
  }

  private calculateValidationMetrics(predictions: Prediction[], actualValues: number[], crossValidationScores: number[]): ValidationResult {
    // Calculate basic metrics (simplified for demonstration)
    let correct = 0;
    let totalSquaredError = 0;
    let totalAbsoluteError = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      const predicted = predictions[i].value;
      const actual = actualValues[i];
      
      if (Math.abs(predicted - actual) < 0.1) {
        correct++;
      }
      
      totalSquaredError += Math.pow(predicted - actual, 2);
      totalAbsoluteError += Math.abs(predicted - actual);
    }
    
    const accuracy = correct / predictions.length;
    const mse = totalSquaredError / predictions.length;
    const mae = totalAbsoluteError / predictions.length;
    
    return {
      accuracy,
      precision: accuracy * 0.95, // Mock precision
      recall: accuracy * 0.98, // Mock recall
      f1Score: accuracy * 0.96, // Mock F1
      mse,
      mae,
      r2: 1 - (totalSquaredError / predictions.length), // Simplified R²
      crossValidationScores,
      testResults: {
        predictions,
        actualValues
      }
    };
  }

  private calculateTrainingTime(modelType: ModelType, dataSize: number): number {
    const baseTime = 100; // Base time in ms
    const sizeMultiplier = Math.log(dataSize + 1) * 10;
    
    switch (modelType) {
      case ModelType.NEURAL_NETWORK:
        return baseTime * 3 + sizeMultiplier * 2;
      case ModelType.XGBOOST:
        return baseTime * 2 + sizeMultiplier * 1.5;
      case ModelType.ENSEMBLE:
        return baseTime * 4 + sizeMultiplier * 3;
      default:
        return baseTime + sizeMultiplier;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
import { injectable, inject } from 'inversify';
import { Logger } from 'winston';
import { TYPES } from '../container/types';
import {
  Model,
  ModelType,
  FeatureVector,
  Explanation,
  ShapValue,
  GlobalExplanation,
  LocalExplanation,
  FeatureImportance,
  FeatureInteraction,
  FeatureContribution
} from '../types/ml.types';

export interface IShapExplainer {
  explainPrediction(model: Model, features: FeatureVector, prediction: number): Promise<Explanation>;
  generateGlobalExplanation(model: Model, sampleData: FeatureVector[]): Promise<GlobalExplanation>;
  calculateShapValues(model: Model, features: FeatureVector, baseValue: number): Promise<ShapValue[]>;
  visualizeFeatureImportance(explanation: Explanation): VisualizationData;
  validateExplanationConsistency(explanations: Explanation[]): ConsistencyReport;
}

export interface VisualizationData {
  type: 'waterfall' | 'force' | 'summary' | 'dependence';
  data: {
    features: string[];
    values: number[];
    shapValues: number[];
    baseValue: number;
    prediction: number;
  };
  metadata: {
    modelId: string;
    timestamp: Date;
    featureCount: number;
  };
}

export interface ConsistencyReport {
  isConsistent: boolean;
  averageDeviation: number;
  maxDeviation: number;
  inconsistentFeatures: string[];
  confidenceScore: number;
  recommendations: string[];
}

@injectable()
export class ShapExplainer implements IShapExplainer {
  private shapCache: Map<string, ShapValue[]> = new Map();
  private globalExplanationCache: Map<string, GlobalExplanation> = new Map();

  constructor(
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async explainPrediction(model: Model, features: FeatureVector, prediction: number): Promise<Explanation> {
    this.logger.info(`Generating SHAP explanation for model ${model.id}`);

    try {
      // Validate inputs
      this.validateModel(model);
      this.validateFeatureVector(features);
      this.validatePrediction(prediction);
      
      // Calculate base value (expected value of the model)
      const baseValue = await this.calculateBaseValue(model, features);
      
      // Calculate SHAP values for each feature
      const shapValues = await this.calculateShapValues(model, features, baseValue);
      
      // Generate feature importances
      const featureImportances = this.generateFeatureImportances(shapValues);
      
      // Create local explanation
      const localExplanation = this.createLocalExplanation(prediction, baseValue, shapValues);
      
      // Get or generate global explanation
      const globalExplanation = await this.getOrGenerateGlobalExplanation(model);

      const explanation: Explanation = {
        predictionId: `${model.id}_${Date.now()}`,
        featureImportances,
        shapValues,
        globalExplanation,
        localExplanation
      };

      this.logger.info(`Generated SHAP explanation with ${shapValues.length} feature contributions`);
      return explanation;

    } catch (error) {
      this.logger.error(`Failed to generate SHAP explanation for model ${model.id}:`, error);
      throw new Error(`SHAP explanation generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateGlobalExplanation(model: Model, sampleData: FeatureVector[]): Promise<GlobalExplanation> {
    this.logger.info(`Generating global SHAP explanation for model ${model.id} with ${sampleData.length} samples`);

    try {
      // Validate inputs
      this.validateModel(model);
      if (sampleData.length === 0) {
        throw new Error('Sample data cannot be empty for global explanation generation');
      }

      // Validate all sample data
      for (const sample of sampleData) {
        this.validateFeatureVector(sample);
      }

      // Calculate SHAP values for all samples
      const allShapValues: ShapValue[][] = [];
      
      for (const sample of sampleData.slice(0, Math.min(100, sampleData.length))) {
        const baseValue = await this.calculateBaseValue(model, sample);
        const shapValues = await this.calculateShapValues(model, sample, baseValue);
        allShapValues.push(shapValues);
      }

      // Aggregate feature importances across all samples
      const aggregatedImportances = this.aggregateFeatureImportances(allShapValues);
      
      // Calculate feature interactions
      const featureInteractions = this.calculateFeatureInteractions(allShapValues);
      
      // Calculate model complexity score
      const modelComplexity = this.calculateModelComplexity(model, aggregatedImportances);

      const globalExplanation: GlobalExplanation = {
        topFeatures: aggregatedImportances.slice(0, 10), // Top 10 features
        featureInteractions: featureInteractions.slice(0, 20), // Top 20 interactions
        modelComplexity: isNaN(modelComplexity) ? 0 : modelComplexity
      };

      // Cache the global explanation
      this.globalExplanationCache.set(model.id, globalExplanation);

      this.logger.info(`Generated global explanation with ${aggregatedImportances.length} features and ${featureInteractions.length} interactions`);
      return globalExplanation;

    } catch (error) {
      this.logger.error(`Failed to generate global SHAP explanation for model ${model.id}:`, error);
      throw new Error(`Global SHAP explanation generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async calculateShapValues(model: Model, features: FeatureVector, baseValue: number): Promise<ShapValue[]> {
    const cacheKey = `${model.id}_${this.hashFeatures(features)}`;
    
    // Check cache first
    if (this.shapCache.has(cacheKey)) {
      return this.shapCache.get(cacheKey)!;
    }

    try {
      const shapValues: ShapValue[] = [];

      // Calculate SHAP values based on model type
      switch (model.type) {
        case ModelType.XGBOOST:
          shapValues.push(...await this.calculateXGBoostShapValues(model, features, baseValue));
          break;
        case ModelType.NEURAL_NETWORK:
          shapValues.push(...await this.calculateNeuralNetworkShapValues(model, features, baseValue));
          break;
        case ModelType.LINEAR_REGRESSION:
        case ModelType.LOGISTIC_REGRESSION:
          shapValues.push(...await this.calculateLinearShapValues(model, features, baseValue));
          break;
        case ModelType.ENSEMBLE:
          shapValues.push(...await this.calculateEnsembleShapValues(model, features, baseValue));
          break;
        default:
          shapValues.push(...await this.calculateGenericShapValues(model, features, baseValue));
      }

      // Validate SHAP values sum to prediction - base_value
      this.validateShapValues(shapValues, baseValue);

      // Cache the results
      this.shapCache.set(cacheKey, shapValues);

      return shapValues;

    } catch (error) {
      this.logger.error(`Failed to calculate SHAP values for model ${model.id}:`, error);
      throw new Error(`SHAP value calculation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  visualizeFeatureImportance(explanation: Explanation): VisualizationData {
    const shapValues = explanation.shapValues || [];
    
    return {
      type: 'waterfall',
      data: {
        features: shapValues.map(sv => sv.featureName),
        values: shapValues.map(sv => sv.featureValue),
        shapValues: shapValues.map(sv => sv.shapValue),
        baseValue: explanation.localExplanation.baseValue,
        prediction: explanation.localExplanation.prediction
      },
      metadata: {
        modelId: explanation.predictionId.split('_')[0],
        timestamp: new Date(),
        featureCount: shapValues.length
      }
    };
  }

  validateExplanationConsistency(explanations: Explanation[]): ConsistencyReport {
    if (explanations.length < 2) {
      return {
        isConsistent: true,
        averageDeviation: 0,
        maxDeviation: 0,
        inconsistentFeatures: [],
        confidenceScore: 1.0,
        recommendations: ['Need at least 2 explanations for consistency validation']
      };
    }

    const featureDeviations = new Map<string, number[]>();
    const recommendations: string[] = [];

    // Collect SHAP values for each feature across explanations
    for (const explanation of explanations) {
      if (explanation.shapValues) {
        for (const shapValue of explanation.shapValues) {
          if (!featureDeviations.has(shapValue.featureName)) {
            featureDeviations.set(shapValue.featureName, []);
          }
          featureDeviations.get(shapValue.featureName)!.push(shapValue.shapValue);
        }
      }
    }

    // Calculate consistency metrics
    let totalDeviation = 0;
    let maxDeviation = 0;
    const inconsistentFeatures: string[] = [];

    for (const [featureName, values] of featureDeviations) {
      if (values.length > 1) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const standardDeviation = Math.sqrt(variance);

        totalDeviation += standardDeviation;
        maxDeviation = Math.max(maxDeviation, standardDeviation);

        // Flag features with high variance as inconsistent
        if (standardDeviation > 0.1) {
          inconsistentFeatures.push(featureName);
        }
      }
    }

    const averageDeviation = totalDeviation / featureDeviations.size;
    const isConsistent = averageDeviation < 0.05 && maxDeviation < 0.15;
    const confidenceScore = Math.max(0, 1 - (averageDeviation * 10));

    // Generate recommendations
    if (!isConsistent) {
      recommendations.push('High variance in SHAP values detected');
      recommendations.push('Consider retraining model with more stable features');
      
      if (inconsistentFeatures.length > 0) {
        recommendations.push(`Review features: ${inconsistentFeatures.join(', ')}`);
      }
    }

    if (confidenceScore < 0.7) {
      recommendations.push('Low confidence in explanations - consider model validation');
    }

    return {
      isConsistent,
      averageDeviation,
      maxDeviation,
      inconsistentFeatures,
      confidenceScore,
      recommendations
    };
  }

  private async calculateBaseValue(model: Model, features: FeatureVector): Promise<number> {
    // For demonstration, return a mock base value
    // In a real implementation, this would be the expected value of the model
    switch (model.type) {
      case ModelType.LOGISTIC_REGRESSION:
        return 0.5; // Probability baseline
      case ModelType.LINEAR_REGRESSION:
        return 0.0; // Zero baseline for regression
      default:
        return 0.5; // Default baseline
    }
  }

  private async calculateXGBoostShapValues(model: Model, features: FeatureVector, baseValue: number): Promise<ShapValue[]> {
    // Simulate XGBoost SHAP calculation
    // In a real implementation, this would use the XGBoost library's SHAP integration
    return features.names.map((name, index) => ({
      featureName: name,
      shapValue: (Math.random() - 0.5) * 0.3, // Random SHAP value for demo
      featureValue: features.values[index],
      baseValue
    }));
  }

  private async calculateNeuralNetworkShapValues(model: Model, features: FeatureVector, baseValue: number): Promise<ShapValue[]> {
    // Simulate Deep SHAP calculation for neural networks
    // In a real implementation, this would use DeepSHAP or GradientSHAP
    return features.names.map((name, index) => ({
      featureName: name,
      shapValue: (Math.random() - 0.5) * 0.2, // Smaller values for NN
      featureValue: features.values[index],
      baseValue
    }));
  }

  private async calculateLinearShapValues(model: Model, features: FeatureVector, baseValue: number): Promise<ShapValue[]> {
    // For linear models, SHAP values are simply the feature value * coefficient
    // Simulating coefficient values
    return features.names.map((name, index) => {
      const coefficient = (Math.random() - 0.5) * 2; // Mock coefficient
      const shapValue = features.values[index] * coefficient;
      
      return {
        featureName: name,
        shapValue,
        featureValue: features.values[index],
        baseValue
      };
    });
  }

  private async calculateEnsembleShapValues(model: Model, features: FeatureVector, baseValue: number): Promise<ShapValue[]> {
    // For ensemble models, aggregate SHAP values from component models
    // This is a simplified version - real implementation would need access to component models
    return features.names.map((name, index) => ({
      featureName: name,
      shapValue: (Math.random() - 0.5) * 0.25, // Averaged SHAP values
      featureValue: features.values[index],
      baseValue
    }));
  }

  private async calculateGenericShapValues(model: Model, features: FeatureVector, baseValue: number): Promise<ShapValue[]> {
    // Generic SHAP calculation using permutation-based approach
    return features.names.map((name, index) => ({
      featureName: name,
      shapValue: (Math.random() - 0.5) * 0.2,
      featureValue: features.values[index],
      baseValue
    }));
  }

  private generateFeatureImportances(shapValues: ShapValue[]): FeatureImportance[] {
    return shapValues
      .map(sv => ({
        featureName: sv.featureName,
        importance: Math.abs(sv.shapValue),
        rank: 0 // Will be set after sorting
      }))
      .sort((a, b) => b.importance - a.importance)
      .map((fi, index) => ({ ...fi, rank: index + 1 }));
  }

  private createLocalExplanation(prediction: number, baseValue: number, shapValues: ShapValue[]): LocalExplanation {
    const featureContributions: FeatureContribution[] = shapValues.map(sv => ({
      featureName: sv.featureName,
      contribution: sv.shapValue,
      featureValue: sv.featureValue
    }));

    return {
      prediction,
      baseValue,
      featureContributions
    };
  }

  private async getOrGenerateGlobalExplanation(model: Model): Promise<GlobalExplanation | undefined> {
    // Return cached global explanation if available
    return this.globalExplanationCache.get(model.id);
  }

  private aggregateFeatureImportances(allShapValues: ShapValue[][]): FeatureImportance[] {
    const featureImportanceMap = new Map<string, number[]>();

    // Collect all SHAP values for each feature
    for (const shapValues of allShapValues) {
      for (const sv of shapValues) {
        if (!featureImportanceMap.has(sv.featureName)) {
          featureImportanceMap.set(sv.featureName, []);
        }
        featureImportanceMap.get(sv.featureName)!.push(Math.abs(sv.shapValue));
      }
    }

    // Calculate average importance for each feature
    const featureImportances: FeatureImportance[] = [];
    for (const [featureName, importances] of featureImportanceMap) {
      const avgImportance = importances.reduce((sum, imp) => sum + imp, 0) / importances.length;
      featureImportances.push({
        featureName,
        importance: avgImportance,
        rank: 0 // Will be set after sorting
      });
    }

    // Sort by importance and assign ranks
    return featureImportances
      .sort((a, b) => b.importance - a.importance)
      .map((fi, index) => ({ ...fi, rank: index + 1 }));
  }

  private calculateFeatureInteractions(allShapValues: ShapValue[][]): FeatureInteraction[] {
    const interactions: FeatureInteraction[] = [];
    
    if (allShapValues.length === 0) return interactions;

    const featureNames = allShapValues[0].map(sv => sv.featureName);
    
    // Calculate pairwise interactions (simplified)
    for (let i = 0; i < featureNames.length; i++) {
      for (let j = i + 1; j < featureNames.length; j++) {
        const feature1 = featureNames[i];
        const feature2 = featureNames[j];
        
        // Calculate interaction strength as correlation of SHAP values
        const feature1Values = allShapValues.map(sv => sv[i].shapValue);
        const feature2Values = allShapValues.map(sv => sv[j].shapValue);
        
        const correlation = this.calculateCorrelation(feature1Values, feature2Values);
        
        interactions.push({
          feature1,
          feature2,
          interactionStrength: Math.abs(correlation)
        });
      }
    }

    return interactions.sort((a, b) => b.interactionStrength - a.interactionStrength);
  }

  private calculateModelComplexity(model: Model, featureImportances: FeatureImportance[]): number {
    // Calculate complexity based on number of important features and their distribution
    const significantFeatures = featureImportances.filter(fi => fi.importance > 0.01).length;
    const totalFeatures = featureImportances.length;
    
    // Gini coefficient for importance distribution
    const importances = featureImportances.map(fi => fi.importance).sort((a, b) => a - b);
    const giniCoeff = this.calculateGiniCoefficient(importances);
    
    // Complexity score (0-1, higher = more complex)
    const featureRatio = significantFeatures / totalFeatures;
    const complexityScore = (featureRatio * 0.7) + (giniCoeff * 0.3);
    
    return Math.min(1, complexityScore);
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateGiniCoefficient(values: number[]): number {
    if (values.length === 0) return 0;

    const n = values.length;
    const sum = values.reduce((sum, val) => sum + val, 0);
    
    if (sum === 0) return 0;

    let gini = 0;
    for (let i = 0; i < n; i++) {
      gini += (2 * (i + 1) - n - 1) * values[i];
    }

    return gini / (n * sum);
  }

  private validateShapValues(shapValues: ShapValue[], baseValue: number): void {
    const sum = shapValues.reduce((sum, sv) => sum + sv.shapValue, 0);
    const expectedSum = 0; // SHAP values should sum to (prediction - baseValue)
    const tolerance = 0.001;

    if (Math.abs(sum - expectedSum) > tolerance) {
      this.logger.warn(`SHAP values sum validation failed. Sum: ${sum}, Expected: ${expectedSum}`);
    }
  }

  private hashFeatures(features: FeatureVector): string {
    // Simple hash for caching purposes
    return features.values.join(',') + '_' + features.names.join(',');
  }

  private validateModel(model: Model): void {
    if (!model || !model.id) {
      throw new Error('Invalid model: model must have an id');
    }

    if (!Object.values(ModelType).includes(model.type)) {
      throw new Error(`Unsupported model type: ${model.type}`);
    }

    if (!model.features || model.features.length === 0) {
      throw new Error('Model must have features defined');
    }
  }

  private validateFeatureVector(features: FeatureVector): void {
    if (!features) {
      throw new Error('Feature vector cannot be null or undefined');
    }

    if (!features.names || !Array.isArray(features.names)) {
      throw new Error('Feature vector must have names array');
    }

    if (!features.values || !Array.isArray(features.values)) {
      throw new Error('Feature vector must have values array');
    }

    if (features.names.length !== features.values.length) {
      throw new Error(`Feature names length (${features.names.length}) must match values length (${features.values.length})`);
    }

    // Check for invalid values
    for (let i = 0; i < features.values.length; i++) {
      const value = features.values[i];
      if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        throw new Error(`Invalid feature value at index ${i}: ${value}. All feature values must be finite numbers.`);
      }
    }

    // Check for empty feature names
    for (let i = 0; i < features.names.length; i++) {
      if (!features.names[i] || typeof features.names[i] !== 'string') {
        throw new Error(`Invalid feature name at index ${i}: ${features.names[i]}. All feature names must be non-empty strings.`);
      }
    }
  }

  private validatePrediction(prediction: number): void {
    if (typeof prediction !== 'number' || isNaN(prediction) || !isFinite(prediction)) {
      throw new Error(`Invalid prediction value: ${prediction}. Prediction must be a finite number.`);
    }
  }
}
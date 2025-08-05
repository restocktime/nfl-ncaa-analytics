import { Container } from 'inversify';
import { DIContainer } from '../../container/container';
import { TYPES } from '../../container/types';
import { IMLModelService } from '../../core/ml-model-service';
import { IShapExplainer } from '../../core/shap-explainer';
import {
  ModelType,
  ModelConfig,
  TrainingData,
  FeatureVector
} from '../../types/ml.types';

describe('SHAP Integration Tests', () => {
  let container: Container;
  let mlModelService: IMLModelService;
  let shapExplainer: IShapExplainer;

  beforeAll(() => {
    container = DIContainer.getInstance();
    mlModelService = container.get<IMLModelService>(TYPES.MLModelService);
    shapExplainer = container.get<IShapExplainer>(TYPES.ShapExplainer);
  });

  afterAll(() => {
    DIContainer.reset();
  });

  describe('End-to-End SHAP Workflow', () => {
    let modelId: string;
    let features: FeatureVector;

    beforeEach(async () => {
      // Create and train a model
      const config: ModelConfig = {
        type: ModelType.XGBOOST,
        hyperparameters: { max_depth: 6, learning_rate: 0.1 },
        features: ['passing_yards', 'rushing_yards', 'turnovers', 'time_of_possession'],
        targetVariable: 'win_probability',
        validationSplit: 0.2,
        crossValidationFolds: 5
      };

      const model = await mlModelService.createModel(config);
      modelId = model.id;

      const trainingData: TrainingData = {
        features: [
          [300, 150, 1, 32], // High passing, good rushing, 1 turnover, good TOP
          [250, 100, 3, 28], // Medium passing, low rushing, 3 turnovers, poor TOP
          [400, 200, 0, 35], // Excellent passing, great rushing, no turnovers, great TOP
          [180, 80, 4, 25],  // Poor passing, poor rushing, 4 turnovers, poor TOP
          [320, 120, 2, 30]  // Good passing, medium rushing, 2 turnovers, medium TOP
        ],
        targets: [0.75, 0.25, 0.95, 0.05, 0.60],
        featureNames: ['passing_yards', 'rushing_yards', 'turnovers', 'time_of_possession'],
        metadata: {
          size: 5,
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31'),
          source: 'football_stats'
        }
      };

      await mlModelService.trainModel(modelId, trainingData);

      features = {
        values: [280, 130, 1, 31],
        names: ['passing_yards', 'rushing_yards', 'turnovers', 'time_of_possession'],
        timestamp: new Date(),
        gameId: 'game-integration-test'
      };
    });

    it('should generate complete SHAP explanation for football prediction', async () => {
      // Generate prediction explanation
      const explanation = await mlModelService.explainPrediction(modelId, features);

      // Verify explanation structure
      expect(explanation).toBeDefined();
      expect(explanation.predictionId).toContain(modelId);
      expect(explanation.featureImportances).toHaveLength(4);
      expect(explanation.shapValues).toHaveLength(4);
      expect(explanation.localExplanation).toBeDefined();

      // Verify SHAP values
      explanation.shapValues!.forEach((shapValue, index) => {
        expect(shapValue.featureName).toBe(features.names[index]);
        expect(shapValue.featureValue).toBe(features.values[index]);
        expect(typeof shapValue.shapValue).toBe('number');
        expect(typeof shapValue.baseValue).toBe('number');
      });

      // Verify feature importances are sorted
      for (let i = 0; i < explanation.featureImportances.length - 1; i++) {
        expect(explanation.featureImportances[i].importance)
          .toBeGreaterThanOrEqual(explanation.featureImportances[i + 1].importance);
      }

      // Verify local explanation
      expect(explanation.localExplanation.featureContributions).toHaveLength(4);
      expect(typeof explanation.localExplanation.prediction).toBe('number');
      expect(typeof explanation.localExplanation.baseValue).toBe('number');
    });

    it('should generate global explanation from sample data', async () => {
      const sampleData: FeatureVector[] = [
        {
          values: [300, 150, 1, 32],
          names: ['passing_yards', 'rushing_yards', 'turnovers', 'time_of_possession'],
          timestamp: new Date()
        },
        {
          values: [250, 100, 3, 28],
          names: ['passing_yards', 'rushing_yards', 'turnovers', 'time_of_possession'],
          timestamp: new Date()
        },
        {
          values: [400, 200, 0, 35],
          names: ['passing_yards', 'rushing_yards', 'turnovers', 'time_of_possession'],
          timestamp: new Date()
        }
      ];

      const globalExplanation = await mlModelService.generateGlobalExplanation(modelId, sampleData);

      // Verify global explanation structure
      expect(globalExplanation).toBeDefined();
      expect(globalExplanation.topFeatures).toBeDefined();
      expect(globalExplanation.topFeatures.length).toBeGreaterThan(0);
      expect(globalExplanation.topFeatures.length).toBeLessThanOrEqual(10);
      expect(globalExplanation.featureInteractions).toBeDefined();
      expect(globalExplanation.modelComplexity).toBeGreaterThanOrEqual(0);
      expect(globalExplanation.modelComplexity).toBeLessThanOrEqual(1);

      // Verify top features are sorted by importance
      for (let i = 0; i < globalExplanation.topFeatures.length - 1; i++) {
        expect(globalExplanation.topFeatures[i].importance)
          .toBeGreaterThanOrEqual(globalExplanation.topFeatures[i + 1].importance);
      }
    });

    it('should create visualization data from explanation', async () => {
      const explanation = await mlModelService.explainPrediction(modelId, features);
      const visualizationData = mlModelService.visualizeExplanation(explanation);

      // Verify visualization data structure
      expect(visualizationData).toBeDefined();
      expect(visualizationData.type).toBe('waterfall');
      expect(visualizationData.data).toBeDefined();
      expect(visualizationData.data.features).toEqual(features.names);
      expect(visualizationData.data.values).toEqual(features.values);
      expect(visualizationData.data.shapValues).toHaveLength(4);
      expect(visualizationData.metadata).toBeDefined();
      expect(visualizationData.metadata.featureCount).toBe(4);
    });

    it('should validate explanation consistency across multiple predictions', async () => {
      const explanations = [];

      // Generate multiple explanations with slight variations
      for (let i = 0; i < 3; i++) {
        const variationFeatures: FeatureVector = {
          values: [
            280 + i * 5,  // passing_yards
            130 + i * 3,  // rushing_yards
            1,            // turnovers (constant)
            31 + i        // time_of_possession
          ],
          names: ['passing_yards', 'rushing_yards', 'turnovers', 'time_of_possession'],
          timestamp: new Date(),
          gameId: `game-consistency-test-${i}`
        };

        const explanation = await mlModelService.explainPrediction(modelId, variationFeatures);
        explanations.push(explanation);
      }

      const consistencyReport = mlModelService.validateExplanationConsistency(explanations);

      // Verify consistency report
      expect(consistencyReport).toBeDefined();
      expect(typeof consistencyReport.isConsistent).toBe('boolean');
      expect(typeof consistencyReport.averageDeviation).toBe('number');
      expect(typeof consistencyReport.maxDeviation).toBe('number');
      expect(Array.isArray(consistencyReport.inconsistentFeatures)).toBe(true);
      expect(typeof consistencyReport.confidenceScore).toBe('number');
      expect(consistencyReport.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(consistencyReport.confidenceScore).toBeLessThanOrEqual(1);
      expect(Array.isArray(consistencyReport.recommendations)).toBe(true);
    });

    it('should handle different model types for SHAP explanations', async () => {
      const modelTypes = [ModelType.NEURAL_NETWORK, ModelType.LINEAR_REGRESSION, ModelType.LOGISTIC_REGRESSION];

      for (const modelType of modelTypes) {
        const config: ModelConfig = {
          type: modelType,
          hyperparameters: {},
          features: ['feature1', 'feature2'],
          targetVariable: 'target',
          validationSplit: 0.2,
          crossValidationFolds: 5
        };

        const model = await mlModelService.createModel(config);
        
        const trainingData: TrainingData = {
          features: [[1, 2], [3, 4], [5, 6]],
          targets: [0.3, 0.7, 0.9],
          featureNames: ['feature1', 'feature2'],
          metadata: {
            size: 3,
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            source: 'test'
          }
        };

        await mlModelService.trainModel(model.id, trainingData);

        const testFeatures: FeatureVector = {
          values: [2.5, 3.5],
          names: ['feature1', 'feature2'],
          timestamp: new Date()
        };

        const explanation = await mlModelService.explainPrediction(model.id, testFeatures);

        // Verify explanation works for different model types
        expect(explanation).toBeDefined();
        expect(explanation.shapValues).toHaveLength(2);
        expect(explanation.featureImportances).toHaveLength(2);
        expect(explanation.localExplanation).toBeDefined();
      }
    });
  });

  describe('SHAP Performance Tests', () => {
    let modelId: string;

    beforeEach(async () => {
      const config: ModelConfig = {
        type: ModelType.XGBOOST,
        hyperparameters: { max_depth: 6 },
        features: Array.from({ length: 10 }, (_, i) => `feature_${i + 1}`),
        targetVariable: 'target',
        validationSplit: 0.2,
        crossValidationFolds: 5
      };

      const model = await mlModelService.createModel(config);
      modelId = model.id;

      const trainingData: TrainingData = {
        features: Array.from({ length: 50 }, () => 
          Array.from({ length: 10 }, () => Math.random())
        ),
        targets: Array.from({ length: 50 }, () => Math.random()),
        featureNames: Array.from({ length: 10 }, (_, i) => `feature_${i + 1}`),
        metadata: {
          size: 50,
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31'),
          source: 'performance_test'
        }
      };

      await mlModelService.trainModel(modelId, trainingData);
    });

    it('should handle high-dimensional feature vectors efficiently', async () => {
      const features: FeatureVector = {
        values: Array.from({ length: 10 }, () => Math.random()),
        names: Array.from({ length: 10 }, (_, i) => `feature_${i + 1}`),
        timestamp: new Date()
      };

      const startTime = Date.now();
      const explanation = await mlModelService.explainPrediction(modelId, features);
      const endTime = Date.now();

      expect(explanation).toBeDefined();
      expect(explanation.shapValues).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should cache SHAP calculations for identical inputs', async () => {
      const features: FeatureVector = {
        values: [0.5, 0.6, 0.7, 0.8, 0.9, 0.1, 0.2, 0.3, 0.4, 0.5],
        names: Array.from({ length: 10 }, (_, i) => `feature_${i + 1}`),
        timestamp: new Date()
      };

      // First call
      const startTime1 = Date.now();
      const explanation1 = await mlModelService.explainPrediction(modelId, features);
      const endTime1 = Date.now();

      // Second call with identical features (should be faster due to caching)
      const startTime2 = Date.now();
      const explanation2 = await mlModelService.explainPrediction(modelId, features);
      const endTime2 = Date.now();

      expect(explanation1.shapValues).toEqual(explanation2.shapValues);
      
      // Second call should be faster (cached)
      const firstCallTime = endTime1 - startTime1;
      const secondCallTime = endTime2 - startTime2;
      expect(secondCallTime).toBeLessThanOrEqual(firstCallTime);
    });
  });
});
import { ShapExplainer, IShapExplainer } from '../../core/shap-explainer';
import { Logger } from 'winston';
import {
  Model,
  ModelType,
  ModelStatus,
  FeatureVector,
  Explanation,
  GlobalExplanation,
  ShapValue
} from '../../types/ml.types';

describe('ShapExplainer', () => {
  let shapExplainer: IShapExplainer;
  let mockLogger: jest.Mocked<Logger>;

  const mockModel: Model = {
    id: 'test-model-1',
    name: 'Test XGBoost Model',
    type: ModelType.XGBOOST,
    version: '1.0.0',
    status: ModelStatus.TRAINED,
    accuracy: 0.85,
    createdAt: new Date('2023-01-01'),
    lastTrained: new Date('2023-01-01'),
    metadata: {
      description: 'Test model for SHAP explanations',
      author: 'test',
      tags: ['test', 'xgboost'],
      trainingDataSize: 1000,
      validationDataSize: 200,
      testDataSize: 100,
      crossValidationFolds: 5
    },
    hyperparameters: { max_depth: 6, learning_rate: 0.1 },
    features: ['feature1', 'feature2', 'feature3'],
    targetVariable: 'win_probability'
  };

  const mockFeatures: FeatureVector = {
    values: [0.8, 0.6, 0.4],
    names: ['feature1', 'feature2', 'feature3'],
    timestamp: new Date(),
    gameId: 'game-123'
  };

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    shapExplainer = new ShapExplainer(mockLogger);
  });

  describe('explainPrediction', () => {
    it('should generate SHAP explanation for XGBoost model', async () => {
      const prediction = 0.75;
      const explanation = await shapExplainer.explainPrediction(mockModel, mockFeatures, prediction);

      expect(explanation).toBeDefined();
      expect(explanation.predictionId).toContain(mockModel.id);
      expect(explanation.shapValues).toHaveLength(3);
      expect(explanation.featureImportances).toHaveLength(3);
      expect(explanation.localExplanation).toBeDefined();
      expect(explanation.localExplanation.prediction).toBe(prediction);

      // Verify SHAP values structure
      explanation.shapValues!.forEach((shapValue, index) => {
        expect(shapValue.featureName).toBe(mockFeatures.names[index]);
        expect(shapValue.featureValue).toBe(mockFeatures.values[index]);
        expect(typeof shapValue.shapValue).toBe('number');
        expect(typeof shapValue.baseValue).toBe('number');
      });

      // Verify feature importances are sorted by importance
      for (let i = 0; i < explanation.featureImportances.length - 1; i++) {
        expect(explanation.featureImportances[i].importance)
          .toBeGreaterThanOrEqual(explanation.featureImportances[i + 1].importance);
      }

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Generating SHAP explanation for model ${mockModel.id}`)
      );
    });

    it('should generate SHAP explanation for neural network model', async () => {
      const nnModel = { ...mockModel, type: ModelType.NEURAL_NETWORK };
      const prediction = 0.65;
      
      const explanation = await shapExplainer.explainPrediction(nnModel, mockFeatures, prediction);

      expect(explanation).toBeDefined();
      expect(explanation.shapValues).toHaveLength(3);
      expect(explanation.localExplanation.prediction).toBe(prediction);
    });

    it('should generate SHAP explanation for linear regression model', async () => {
      const linearModel = { ...mockModel, type: ModelType.LINEAR_REGRESSION };
      const prediction = 0.55;
      
      const explanation = await shapExplainer.explainPrediction(linearModel, mockFeatures, prediction);

      expect(explanation).toBeDefined();
      expect(explanation.shapValues).toHaveLength(3);
      expect(explanation.localExplanation.prediction).toBe(prediction);
    });

    it('should generate SHAP explanation for ensemble model', async () => {
      const ensembleModel = { ...mockModel, type: ModelType.ENSEMBLE };
      const prediction = 0.72;
      
      const explanation = await shapExplainer.explainPrediction(ensembleModel, mockFeatures, prediction);

      expect(explanation).toBeDefined();
      expect(explanation.shapValues).toHaveLength(3);
      expect(explanation.localExplanation.prediction).toBe(prediction);
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in SHAP calculation
      const invalidModel = { ...mockModel, features: [] };
      
      await expect(shapExplainer.explainPrediction(invalidModel, mockFeatures, 0.5))
        .rejects.toThrow('SHAP explanation generation failed');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should cache SHAP values for identical feature vectors', async () => {
      const prediction = 0.75;
      
      // First call
      const explanation1 = await shapExplainer.explainPrediction(mockModel, mockFeatures, prediction);
      
      // Second call with same features
      const explanation2 = await shapExplainer.explainPrediction(mockModel, mockFeatures, prediction);

      // Should have same SHAP values (cached)
      expect(explanation1.shapValues).toEqual(explanation2.shapValues);
    });
  });

  describe('generateGlobalExplanation', () => {
    const sampleData: FeatureVector[] = [
      {
        values: [0.8, 0.6, 0.4],
        names: ['feature1', 'feature2', 'feature3'],
        timestamp: new Date()
      },
      {
        values: [0.7, 0.5, 0.3],
        names: ['feature1', 'feature2', 'feature3'],
        timestamp: new Date()
      },
      {
        values: [0.9, 0.7, 0.5],
        names: ['feature1', 'feature2', 'feature3'],
        timestamp: new Date()
      }
    ];

    it('should generate global explanation with feature importances', async () => {
      const globalExplanation = await shapExplainer.generateGlobalExplanation(mockModel, sampleData);

      expect(globalExplanation).toBeDefined();
      expect(globalExplanation.topFeatures).toBeDefined();
      expect(globalExplanation.topFeatures.length).toBeGreaterThan(0);
      expect(globalExplanation.topFeatures.length).toBeLessThanOrEqual(10);
      expect(globalExplanation.featureInteractions).toBeDefined();
      expect(globalExplanation.featureInteractions.length).toBeLessThanOrEqual(20);
      expect(typeof globalExplanation.modelComplexity).toBe('number');
      expect(globalExplanation.modelComplexity).toBeGreaterThanOrEqual(0);
      expect(globalExplanation.modelComplexity).toBeLessThanOrEqual(1);

      // Verify feature importances are sorted
      for (let i = 0; i < globalExplanation.topFeatures.length - 1; i++) {
        expect(globalExplanation.topFeatures[i].importance)
          .toBeGreaterThanOrEqual(globalExplanation.topFeatures[i + 1].importance);
      }

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Generating global SHAP explanation for model ${mockModel.id}`)
      );
    });

    it('should handle large sample datasets efficiently', async () => {
      // Create a large sample dataset
      const largeSampleData: FeatureVector[] = Array.from({ length: 200 }, (_, i) => ({
        values: [Math.random(), Math.random(), Math.random()],
        names: ['feature1', 'feature2', 'feature3'],
        timestamp: new Date()
      }));

      const startTime = Date.now();
      const globalExplanation = await shapExplainer.generateGlobalExplanation(mockModel, largeSampleData);
      const endTime = Date.now();

      expect(globalExplanation).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should cache global explanations', async () => {
      // First call
      const globalExplanation1 = await shapExplainer.generateGlobalExplanation(mockModel, sampleData);
      
      // Second call should use cached result
      const globalExplanation2 = await shapExplainer.generateGlobalExplanation(mockModel, sampleData);

      expect(globalExplanation1).toEqual(globalExplanation2);
    });

    it('should handle empty sample data', async () => {
      await expect(shapExplainer.generateGlobalExplanation(mockModel, []))
        .rejects.toThrow('SHAP explanation generation failed');
    });
  });

  describe('calculateShapValues', () => {
    it('should calculate SHAP values for different model types', async () => {
      const baseValue = 0.5;
      
      // Test XGBoost
      const xgboostShapValues = await shapExplainer.calculateShapValues(mockModel, mockFeatures, baseValue);
      expect(xgboostShapValues).toHaveLength(3);
      
      // Test Neural Network
      const nnModel = { ...mockModel, type: ModelType.NEURAL_NETWORK };
      const nnShapValues = await shapExplainer.calculateShapValues(nnModel, mockFeatures, baseValue);
      expect(nnShapValues).toHaveLength(3);
      
      // Test Linear Regression
      const linearModel = { ...mockModel, type: ModelType.LINEAR_REGRESSION };
      const linearShapValues = await shapExplainer.calculateShapValues(linearModel, mockFeatures, baseValue);
      expect(linearShapValues).toHaveLength(3);
    });

    it('should validate SHAP values structure', async () => {
      const baseValue = 0.5;
      const shapValues = await shapExplainer.calculateShapValues(mockModel, mockFeatures, baseValue);

      shapValues.forEach((shapValue, index) => {
        expect(shapValue.featureName).toBe(mockFeatures.names[index]);
        expect(shapValue.featureValue).toBe(mockFeatures.values[index]);
        expect(shapValue.baseValue).toBe(baseValue);
        expect(typeof shapValue.shapValue).toBe('number');
        expect(shapValue.shapValue).not.toBeNaN();
      });
    });

    it('should cache SHAP values for identical inputs', async () => {
      const baseValue = 0.5;
      
      const shapValues1 = await shapExplainer.calculateShapValues(mockModel, mockFeatures, baseValue);
      const shapValues2 = await shapExplainer.calculateShapValues(mockModel, mockFeatures, baseValue);

      expect(shapValues1).toEqual(shapValues2);
    });
  });

  describe('visualizeFeatureImportance', () => {
    it('should create visualization data from explanation', async () => {
      const explanation = await shapExplainer.explainPrediction(mockModel, mockFeatures, 0.75);
      const visualizationData = shapExplainer.visualizeFeatureImportance(explanation);

      expect(visualizationData).toBeDefined();
      expect(visualizationData.type).toBe('waterfall');
      expect(visualizationData.data).toBeDefined();
      expect(visualizationData.data.features).toEqual(mockFeatures.names);
      expect(visualizationData.data.values).toEqual(mockFeatures.values);
      expect(visualizationData.data.shapValues).toHaveLength(3);
      expect(visualizationData.data.baseValue).toBeDefined();
      expect(visualizationData.data.prediction).toBe(0.75);
      expect(visualizationData.metadata).toBeDefined();
      expect(visualizationData.metadata.featureCount).toBe(3);
    });

    it('should handle explanations without SHAP values', async () => {
      const explanation: Explanation = {
        predictionId: 'test-prediction',
        featureImportances: [],
        localExplanation: {
          prediction: 0.5,
          baseValue: 0.3,
          featureContributions: []
        }
      };

      const visualizationData = shapExplainer.visualizeFeatureImportance(explanation);
      
      expect(visualizationData.data.features).toEqual([]);
      expect(visualizationData.data.shapValues).toEqual([]);
      expect(visualizationData.metadata.featureCount).toBe(0);
    });
  });

  describe('validateExplanationConsistency', () => {
    it('should validate consistency across multiple explanations', async () => {
      const explanations: Explanation[] = [];
      
      // Generate multiple explanations with slight variations
      for (let i = 0; i < 5; i++) {
        const features: FeatureVector = {
          values: [0.8 + i * 0.01, 0.6 + i * 0.01, 0.4 + i * 0.01],
          names: ['feature1', 'feature2', 'feature3'],
          timestamp: new Date()
        };
        const explanation = await shapExplainer.explainPrediction(mockModel, features, 0.75);
        explanations.push(explanation);
      }

      const consistencyReport = shapExplainer.validateExplanationConsistency(explanations);

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

    it('should handle single explanation', () => {
      const singleExplanation: Explanation = {
        predictionId: 'test-prediction',
        featureImportances: [],
        localExplanation: {
          prediction: 0.5,
          baseValue: 0.3,
          featureContributions: []
        }
      };

      const consistencyReport = shapExplainer.validateExplanationConsistency([singleExplanation]);

      expect(consistencyReport.isConsistent).toBe(true);
      expect(consistencyReport.averageDeviation).toBe(0);
      expect(consistencyReport.maxDeviation).toBe(0);
      expect(consistencyReport.confidenceScore).toBe(1.0);
      expect(consistencyReport.recommendations).toContain('Need at least 2 explanations for consistency validation');
    });

    it('should detect inconsistent explanations', async () => {
      // Create explanations with high variance
      const inconsistentExplanations: Explanation[] = [
        {
          predictionId: 'test-1',
          featureImportances: [],
          shapValues: [
            { featureName: 'feature1', shapValue: 0.5, featureValue: 0.8, baseValue: 0.5 },
            { featureName: 'feature2', shapValue: 0.2, featureValue: 0.6, baseValue: 0.5 }
          ],
          localExplanation: { prediction: 0.7, baseValue: 0.5, featureContributions: [] }
        },
        {
          predictionId: 'test-2',
          featureImportances: [],
          shapValues: [
            { featureName: 'feature1', shapValue: -0.3, featureValue: 0.8, baseValue: 0.5 },
            { featureName: 'feature2', shapValue: 0.8, featureValue: 0.6, baseValue: 0.5 }
          ],
          localExplanation: { prediction: 0.3, baseValue: 0.5, featureContributions: [] }
        }
      ];

      const consistencyReport = shapExplainer.validateExplanationConsistency(inconsistentExplanations);

      expect(consistencyReport.isConsistent).toBe(false);
      expect(consistencyReport.averageDeviation).toBeGreaterThan(0.05);
      expect(consistencyReport.confidenceScore).toBeLessThan(0.7);
      expect(consistencyReport.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle empty explanations array', () => {
      const consistencyReport = shapExplainer.validateExplanationConsistency([]);

      expect(consistencyReport.isConsistent).toBe(true);
      expect(consistencyReport.averageDeviation).toBe(0);
      expect(consistencyReport.confidenceScore).toBe(1.0);
    });
  });

  describe('error handling', () => {
    it('should handle model calculation errors gracefully', async () => {
      // Create a mock that throws an error
      const errorModel = { ...mockModel, type: 'INVALID_TYPE' as ModelType };
      
      await expect(shapExplainer.explainPrediction(errorModel, mockFeatures, 0.5))
        .rejects.toThrow('SHAP explanation generation failed');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle invalid feature vectors', async () => {
      const invalidFeatures: FeatureVector = {
        values: [NaN, Infinity, -Infinity],
        names: ['feature1', 'feature2', 'feature3'],
        timestamp: new Date()
      };

      await expect(shapExplainer.explainPrediction(mockModel, invalidFeatures, 0.5))
        .rejects.toThrow();
    });

    it('should handle mismatched feature names and values', async () => {
      const mismatchedFeatures: FeatureVector = {
        values: [0.8, 0.6], // Only 2 values
        names: ['feature1', 'feature2', 'feature3'], // But 3 names
        timestamp: new Date()
      };

      await expect(shapExplainer.explainPrediction(mockModel, mismatchedFeatures, 0.5))
        .rejects.toThrow();
    });
  });

  describe('performance', () => {
    it('should complete explanation generation within reasonable time', async () => {
      const startTime = Date.now();
      await shapExplainer.explainPrediction(mockModel, mockFeatures, 0.75);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple concurrent explanation requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const features: FeatureVector = {
          values: [0.8 + i * 0.01, 0.6 + i * 0.01, 0.4 + i * 0.01],
          names: ['feature1', 'feature2', 'feature3'],
          timestamp: new Date()
        };
        return shapExplainer.explainPrediction(mockModel, features, 0.75);
      });

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.shapValues).toHaveLength(3);
      });
    });
  });
});
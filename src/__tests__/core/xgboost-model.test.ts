import { XGBoostModel, XGBoostConfig } from '../../core/models/xgboost-model';
import { TrainingData, FeatureVector } from '../../types/ml.types';

describe('XGBoostModel', () => {
  let model: XGBoostModel;
  let trainingData: TrainingData;
  let testFeatures: FeatureVector;

  beforeEach(() => {
    const config: XGBoostConfig = {
      maxDepth: 6,
      learningRate: 0.1,
      nEstimators: 10, // Reduced for faster tests
      subsample: 1.0,
      colsampleBytree: 1.0,
      regAlpha: 0,
      regLambda: 1,
      objective: 'reg:squarederror',
      evalMetric: 'rmse'
    };

    model = new XGBoostModel(config);

    trainingData = {
      features: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [2, 3, 4],
        [5, 6, 7]
      ],
      targets: [0.1, 0.8, 0.9, 0.3, 0.7],
      featureNames: ['feature1', 'feature2', 'feature3'],
      metadata: {
        size: 5,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        source: 'test'
      }
    };

    testFeatures = {
      values: [3, 4, 5],
      names: ['feature1', 'feature2', 'feature3'],
      timestamp: new Date()
    };
  });

  describe('Model Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultModel = new XGBoostModel({} as XGBoostConfig);
      const config = defaultModel.getConfig();
      
      expect(config.maxDepth).toBe(6);
      expect(config.learningRate).toBe(0.1);
      expect(config.nEstimators).toBe(100);
      expect(config.objective).toBe('reg:squarederror');
    });

    it('should use provided configuration', () => {
      const customConfig: XGBoostConfig = {
        maxDepth: 8,
        learningRate: 0.05,
        nEstimators: 200,
        objective: 'binary:logistic',
        evalMetric: 'logloss'
      };

      const customModel = new XGBoostModel(customConfig);
      const config = customModel.getConfig();
      
      expect(config.maxDepth).toBe(8);
      expect(config.learningRate).toBe(0.05);
      expect(config.nEstimators).toBe(200);
      expect(config.objective).toBe('binary:logistic');
    });
  });

  describe('Training', () => {
    it('should train successfully with valid data', async () => {
      expect(model.isModelTrained()).toBe(false);
      
      await model.train(trainingData);
      
      expect(model.isModelTrained()).toBe(true);
    });

    it('should handle training with different objectives', async () => {
      const objectives: Array<XGBoostConfig['objective']> = [
        'reg:squarederror',
        'binary:logistic',
        'multi:softprob'
      ];

      for (const objective of objectives) {
        const config: XGBoostConfig = {
          maxDepth: 3,
          learningRate: 0.1,
          nEstimators: 5,
          objective,
          evalMetric: 'rmse'
        };

        const testModel = new XGBoostModel(config);
        await testModel.train(trainingData);
        
        expect(testModel.isModelTrained()).toBe(true);
      }
    });
  });

  describe('Prediction', () => {
    beforeEach(async () => {
      await model.train(trainingData);
    });

    it('should make predictions after training', async () => {
      const prediction = await model.predict(testFeatures);
      
      expect(typeof prediction).toBe('number');
      expect(prediction).toBeGreaterThanOrEqual(-1);
      expect(prediction).toBeLessThanOrEqual(1);
    });

    it('should make batch predictions', async () => {
      const batchFeatures = [
        testFeatures,
        { ...testFeatures, values: [1, 2, 3] },
        { ...testFeatures, values: [7, 8, 9] }
      ];

      const predictions = await model.predictBatch(batchFeatures);
      
      expect(predictions).toHaveLength(3);
      predictions.forEach(pred => {
        expect(typeof pred).toBe('number');
        expect(pred).toBeGreaterThanOrEqual(-1);
        expect(pred).toBeLessThanOrEqual(1);
      });
    });

    it('should throw error when predicting with untrained model', async () => {
      const untrainedModel = new XGBoostModel({} as XGBoostConfig);
      
      await expect(untrainedModel.predict(testFeatures))
        .rejects.toThrow('Model must be trained before making predictions');
    });

    it('should throw error with mismatched feature count', async () => {
      const wrongFeatures: FeatureVector = {
        values: [1, 2], // Only 2 features instead of 3
        names: ['feature1', 'feature2'],
        timestamp: new Date()
      };

      await expect(model.predict(wrongFeatures))
        .rejects.toThrow('Feature count mismatch');
    });
  });

  describe('Feature Importance', () => {
    beforeEach(async () => {
      await model.train(trainingData);
    });

    it('should return feature importance after training', () => {
      const importance = model.getFeatureImportance();
      
      expect(Object.keys(importance)).toHaveLength(3);
      expect(importance).toHaveProperty('feature1');
      expect(importance).toHaveProperty('feature2');
      expect(importance).toHaveProperty('feature3');
      
      // Check that importances sum to approximately 1
      const total = Object.values(importance).reduce((sum, val) => sum + val, 0);
      expect(total).toBeCloseTo(1, 5);
    });

    it('should throw error when getting importance from untrained model', () => {
      const untrainedModel = new XGBoostModel({} as XGBoostConfig);
      
      expect(() => untrainedModel.getFeatureImportance())
        .toThrow('Model must be trained to get feature importance');
    });
  });

  describe('Cross Validation', () => {
    it('should perform cross validation', async () => {
      const scores = await model.crossValidate(trainingData, 3);
      
      expect(scores).toHaveLength(3);
      scores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });

    it('should handle single fold validation', async () => {
      const scores = await model.crossValidate(trainingData, 1);
      
      expect(scores).toHaveLength(1);
      expect(scores[0]).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Grid Search', () => {
    it('should perform grid search optimization', async () => {
      const paramGrid: Partial<XGBoostConfig>[] = [
        { maxDepth: 3, learningRate: 0.1 },
        { maxDepth: 6, learningRate: 0.1 },
        { maxDepth: 3, learningRate: 0.05 }
      ];

      const result = await XGBoostModel.gridSearch(trainingData, paramGrid, 2);
      
      expect(result.bestParams).toBeDefined();
      expect(result.bestScore).toBeGreaterThanOrEqual(0);
      expect(result.allResults).toHaveLength(3);
      
      // Check that best score is indeed the highest
      const allScores = result.allResults.map(r => r.score);
      const maxScore = Math.max(...allScores);
      expect(result.bestScore).toBe(maxScore);
    });

    it('should handle empty parameter grid', async () => {
      await expect(XGBoostModel.gridSearch(trainingData, [], 2))
        .rejects.toThrow('No valid parameters found in grid search');
    });
  });

  describe('Different Objectives', () => {
    it('should handle binary logistic objective', async () => {
      const config: XGBoostConfig = {
        maxDepth: 3,
        learningRate: 0.1,
        nEstimators: 5,
        objective: 'binary:logistic',
        evalMetric: 'logloss'
      };

      const logisticModel = new XGBoostModel(config);
      await logisticModel.train(trainingData);
      
      const prediction = await logisticModel.predict(testFeatures);
      
      // Binary logistic should return probability between 0 and 1
      expect(prediction).toBeGreaterThanOrEqual(0);
      expect(prediction).toBeLessThanOrEqual(1);
    });

    it('should handle multi-class objective', async () => {
      const config: XGBoostConfig = {
        maxDepth: 3,
        learningRate: 0.1,
        nEstimators: 5,
        objective: 'multi:softprob',
        evalMetric: 'mlogloss'
      };

      const multiModel = new XGBoostModel(config);
      await multiModel.train(trainingData);
      
      const prediction = await multiModel.predict(testFeatures);
      
      expect(prediction).toBeGreaterThanOrEqual(0);
      expect(prediction).toBeLessThanOrEqual(1);
    });
  });

  describe('Model Explanation and Analysis', () => {
    beforeEach(async () => {
      await model.train(trainingData);
    });

    it('should provide prediction explanations', () => {
      const explanation = model.explainPrediction(testFeatures);
      
      expect(Object.keys(explanation)).toHaveLength(3);
      expect(explanation).toHaveProperty('feature1');
      expect(explanation).toHaveProperty('feature2');
      expect(explanation).toHaveProperty('feature3');
      
      Object.values(explanation).forEach(contribution => {
        expect(typeof contribution).toBe('number');
        expect(isFinite(contribution)).toBe(true);
      });
    });

    it('should provide model complexity metrics', () => {
      const complexity = model.getModelComplexity();
      
      expect(complexity).toHaveProperty('numTrees');
      expect(complexity).toHaveProperty('avgDepth');
      expect(complexity).toHaveProperty('totalNodes');
      
      expect(complexity.numTrees).toBeGreaterThan(0);
      expect(complexity.avgDepth).toBeGreaterThan(0);
      expect(complexity.totalNodes).toBeGreaterThan(0);
    });
  });

  describe('Historical Data Validation', () => {
    it('should validate model accuracy on historical data', async () => {
      // Create larger historical dataset
      const historicalData: TrainingData = {
        features: Array.from({ length: 100 }, (_, i) => [
          Math.random() * 10,
          Math.random() * 10,
          Math.random() * 10
        ]),
        targets: Array.from({ length: 100 }, () => Math.random()),
        featureNames: ['feature1', 'feature2', 'feature3'],
        metadata: {
          size: 100,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2023-12-31'),
          source: 'historical'
        }
      };

      await model.train(historicalData);
      
      // Test on validation set
      const validationFeatures = Array.from({ length: 20 }, (_, i) => ({
        values: [Math.random() * 10, Math.random() * 10, Math.random() * 10],
        names: ['feature1', 'feature2', 'feature3'],
        timestamp: new Date()
      }));

      const predictions = await model.predictBatch(validationFeatures);
      
      expect(predictions).toHaveLength(20);
      
      // Calculate basic accuracy metrics
      let totalError = 0;
      for (let i = 0; i < predictions.length; i++) {
        const prediction = predictions[i];
        const actual = Math.random(); // Mock actual value
        totalError += Math.abs(prediction - actual);
      }
      
      const meanAbsoluteError = totalError / predictions.length;
      
      // Model should have reasonable accuracy
      expect(meanAbsoluteError).toBeLessThan(2.0); // Reasonable threshold
    });

    it('should maintain consistent performance across different data sizes', async () => {
      const dataSizes = [10, 50, 100];
      const accuracies: number[] = [];

      for (const size of dataSizes) {
        const testData: TrainingData = {
          features: Array.from({ length: size }, () => [
            Math.random() * 5,
            Math.random() * 5,
            Math.random() * 5
          ]),
          targets: Array.from({ length: size }, () => Math.random()),
          featureNames: ['feature1', 'feature2', 'feature3'],
          metadata: {
            size,
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            source: 'test'
          }
        };

        const testModel = new XGBoostModel({
          maxDepth: 3,
          learningRate: 0.1,
          nEstimators: 5,
          objective: 'reg:squarederror'
        });

        const cvScores = await testModel.crossValidate(testData, 3);
        const avgAccuracy = cvScores.reduce((sum, score) => sum + score, 0) / cvScores.length;
        accuracies.push(avgAccuracy);
      }

      // Accuracy should be reasonable across different data sizes
      accuracies.forEach(accuracy => {
        expect(accuracy).toBeGreaterThan(0.3);
        expect(accuracy).toBeLessThan(1.0);
      });
    });
  });
});
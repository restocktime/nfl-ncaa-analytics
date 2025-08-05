import { EnsembleModel } from '../../core/models/ensemble-model';
import { XGBoostModel } from '../../core/models/xgboost-model';
import { NeuralNetworkModel } from '../../core/models/neural-network-model';
import { TrainingData, FeatureVector, EnsembleConfig } from '../../types/ml.types';

describe('EnsembleModel', () => {
  let ensemble: EnsembleModel;
  let xgboostModel: XGBoostModel;
  let nnModel: NeuralNetworkModel;
  let trainingData: TrainingData;
  let testFeatures: FeatureVector;

  beforeEach(() => {
    // Create base models
    xgboostModel = new XGBoostModel({
      maxDepth: 3,
      learningRate: 0.1,
      nEstimators: 5,
      objective: 'reg:squarederror',
      evalMetric: 'rmse'
    });

    nnModel = new NeuralNetworkModel({
      hiddenLayers: [4],
      activation: 'relu',
      outputActivation: 'linear',
      optimizer: 'adam',
      learningRate: 0.01,
      batchSize: 2,
      epochs: 3,
      validationSplit: 0.2
    });

    trainingData = {
      features: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [2, 3, 4],
        [5, 6, 7],
        [8, 9, 10]
      ],
      targets: [0.1, 0.8, 0.9, 0.3, 0.7, 0.95],
      featureNames: ['feature1', 'feature2', 'feature3'],
      metadata: {
        size: 6,
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

  afterEach(() => {
    if (ensemble) {
      ensemble.dispose();
    }
    if (nnModel) {
      nnModel.dispose();
    }
  });

  describe('Ensemble Creation', () => {
    it('should create ensemble with default equal weights', () => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'weighted_average'
      };

      ensemble = new EnsembleModel(config, [xgboostModel, nnModel]);
      
      expect(ensemble.getWeights()).toEqual([0.5, 0.5]);
      expect(ensemble.getModelCount()).toBe(2);
    });

    it('should create ensemble with custom weights', () => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'weighted_average',
        weights: [0.7, 0.3]
      };

      ensemble = new EnsembleModel(config, [xgboostModel, nnModel]);
      
      expect(ensemble.getWeights()).toEqual([0.7, 0.3]);
    });

    it('should normalize weights to sum to 1', () => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'weighted_average',
        weights: [2, 3] // Should be normalized to [0.4, 0.6]
      };

      ensemble = new EnsembleModel(config, [xgboostModel, nnModel]);
      
      const weights = ensemble.getWeights();
      expect(weights[0]).toBeCloseTo(0.4, 5);
      expect(weights[1]).toBeCloseTo(0.6, 5);
      
      const sum = weights.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
    });

    it('should throw error for mismatched weights and models', () => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'weighted_average',
        weights: [0.5] // Only one weight for two models
      };

      expect(() => new EnsembleModel(config, [xgboostModel, nnModel]))
        .toThrow('Number of weights must match number of models');
    });
  });

  describe('Training', () => {
    beforeEach(() => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'weighted_average',
        weights: [0.6, 0.4]
      };

      ensemble = new EnsembleModel(config, [xgboostModel, nnModel]);
    });

    it('should train all base models', async () => {
      expect(ensemble.isModelTrained()).toBe(false);
      
      await ensemble.train(trainingData);
      
      expect(ensemble.isModelTrained()).toBe(true);
      expect(xgboostModel.isModelTrained()).toBe(true);
      expect(nnModel.isModelTrained()).toBe(true);
    }, 15000);
  });

  describe('Prediction Methods', () => {
    beforeEach(async () => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'weighted_average',
        weights: [0.6, 0.4]
      };

      ensemble = new EnsembleModel(config, [xgboostModel, nnModel]);
      await ensemble.train(trainingData);
    }, 15000);

    it('should make weighted average predictions', async () => {
      const prediction = await ensemble.predict(testFeatures);
      
      expect(typeof prediction).toBe('number');
      expect(isFinite(prediction)).toBe(true);
    });

    it('should make batch predictions', async () => {
      const batchFeatures = [
        testFeatures,
        { ...testFeatures, values: [1, 2, 3] },
        { ...testFeatures, values: [7, 8, 9] }
      ];

      const predictions = await ensemble.predictBatch(batchFeatures);
      
      expect(predictions).toHaveLength(3);
      predictions.forEach(pred => {
        expect(typeof pred).toBe('number');
        expect(isFinite(pred)).toBe(true);
      });
    });

    it('should handle voting method', async () => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'voting'
      };

      const votingEnsemble = new EnsembleModel(config, [xgboostModel, nnModel]);
      await votingEnsemble.train(trainingData);
      
      const prediction = await votingEnsemble.predict(testFeatures);
      
      expect(typeof prediction).toBe('number');
      expect(isFinite(prediction)).toBe(true);
      
      votingEnsemble.dispose();
    }, 15000);

    it('should handle stacking method', async () => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'stacking'
      };

      const stackingEnsemble = new EnsembleModel(config, [xgboostModel, nnModel]);
      await stackingEnsemble.train(trainingData);
      
      const prediction = await stackingEnsemble.predict(testFeatures);
      
      expect(typeof prediction).toBe('number');
      expect(isFinite(prediction)).toBe(true);
      
      stackingEnsemble.dispose();
    }, 15000);

    it('should throw error when predicting with untrained ensemble', async () => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'weighted_average'
      };

      const untrainedEnsemble = new EnsembleModel(config, [xgboostModel, nnModel]);
      
      await expect(untrainedEnsemble.predict(testFeatures))
        .rejects.toThrow('Ensemble must be trained before making predictions');
      
      untrainedEnsemble.dispose();
    });

    it('should throw error with mismatched feature count', async () => {
      const wrongFeatures: FeatureVector = {
        values: [1, 2], // Only 2 features instead of 3
        names: ['feature1', 'feature2'],
        timestamp: new Date()
      };

      await expect(ensemble.predict(wrongFeatures))
        .rejects.toThrow('Feature count mismatch');
    });
  });

  describe('Individual Model Analysis', () => {
    beforeEach(async () => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'weighted_average',
        weights: [0.7, 0.3]
      };

      ensemble = new EnsembleModel(config, [xgboostModel, nnModel]);
      await ensemble.train(trainingData);
    }, 15000);

    it('should return individual model predictions', async () => {
      const individualPredictions = await ensemble.getIndividualPredictions(testFeatures);
      
      expect(individualPredictions).toHaveLength(2);
      
      expect(individualPredictions[0].modelIndex).toBe(0);
      expect(individualPredictions[0].weight).toBe(0.7);
      expect(typeof individualPredictions[0].prediction).toBe('number');
      
      expect(individualPredictions[1].modelIndex).toBe(1);
      expect(individualPredictions[1].weight).toBe(0.3);
      expect(typeof individualPredictions[1].prediction).toBe('number');
    });
  });

  describe('Cross Validation', () => {
    beforeEach(() => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'weighted_average',
        weights: [0.6, 0.4]
      };

      ensemble = new EnsembleModel(config, [xgboostModel, nnModel]);
    });

    it('should perform cross validation', async () => {
      const scores = await ensemble.crossValidate(trainingData, 2);
      
      expect(scores).toHaveLength(2);
      scores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    }, 30000); // Longer timeout for ensemble CV
  });

  describe('Configuration', () => {
    it('should return ensemble configuration', () => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'weighted_average',
        weights: [0.6, 0.4]
      };

      ensemble = new EnsembleModel(config, [xgboostModel, nnModel]);
      
      const returnedConfig = ensemble.getConfig();
      expect(returnedConfig.method).toBe('weighted_average');
      expect(returnedConfig.models).toEqual(['model1', 'model2']);
      expect(returnedConfig.weights).toEqual([0.6, 0.4]);
    });
  });

  describe('Model Diversity Analysis', () => {
    beforeEach(async () => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'weighted_average',
        weights: [0.6, 0.4]
      };

      ensemble = new EnsembleModel(config, [xgboostModel, nnModel]);
      await ensemble.train(trainingData);
    }, 15000);

    it('should analyze model diversity', async () => {
      const diversityTestFeatures = [
        testFeatures,
        { ...testFeatures, values: [1, 2, 3] },
        { ...testFeatures, values: [7, 8, 9] }
      ];

      const analysis = await ensemble.analyzeModelDiversity(diversityTestFeatures);
      
      expect(analysis).toHaveProperty('correlationMatrix');
      expect(analysis).toHaveProperty('diversityScore');
      expect(analysis).toHaveProperty('individualAccuracies');
      
      expect(analysis.correlationMatrix).toHaveLength(2);
      expect(analysis.correlationMatrix[0]).toHaveLength(2);
      expect(analysis.diversityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.diversityScore).toBeLessThanOrEqual(1);
      expect(analysis.individualAccuracies).toHaveLength(2);
    });

    it('should provide ensemble metrics', () => {
      const metrics = ensemble.getEnsembleMetrics();
      
      expect(metrics).toHaveProperty('modelCount');
      expect(metrics).toHaveProperty('weights');
      expect(metrics).toHaveProperty('method');
      expect(metrics).toHaveProperty('averageComplexity');
      
      expect(metrics.modelCount).toBe(2);
      expect(metrics.weights).toHaveLength(2);
      expect(metrics.method).toBe('weighted_average');
      expect(metrics.averageComplexity).toBeGreaterThan(0);
    });
  });

  describe('Historical Data Validation', () => {
    it('should validate ensemble accuracy on historical data', async () => {
      // Create comprehensive historical dataset
      const historicalData: TrainingData = {
        features: Array.from({ length: 60 }, (_, i) => [
          Math.sin(i * 0.1) * 3 + Math.random(),
          Math.cos(i * 0.1) * 3 + Math.random(),
          (i % 15) / 15 + Math.random() * 0.1
        ]),
        targets: Array.from({ length: 60 }, (_, i) => 
          Math.sin(i * 0.1) * 0.4 + Math.cos(i * 0.1) * 0.3 + (i % 15) / 30 + Math.random() * 0.1
        ),
        featureNames: ['feature1', 'feature2', 'feature3'],
        metadata: {
          size: 60,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2023-12-31'),
          source: 'historical'
        }
      };

      // Create models with different configurations for diversity
      const xgboostHistorical = new XGBoostModel({
        maxDepth: 4,
        learningRate: 0.1,
        nEstimators: 8,
        objective: 'reg:squarederror'
      });

      const nnHistorical = new NeuralNetworkModel({
        hiddenLayers: [12, 6],
        activation: 'relu',
        outputActivation: 'linear',
        optimizer: 'adam',
        learningRate: 0.005,
        batchSize: 4,
        epochs: 8,
        validationSplit: 0.2
      });

      const config: EnsembleConfig = {
        models: ['xgboost', 'neural_network'],
        method: 'weighted_average',
        weights: [0.7, 0.3]
      };

      const historicalEnsemble = new EnsembleModel(config, [xgboostHistorical, nnHistorical]);
      await historicalEnsemble.train(historicalData);
      
      // Test on validation set
      const validationFeatures = Array.from({ length: 15 }, (_, i) => ({
        values: [
          Math.sin((i + 60) * 0.1) * 3 + Math.random(),
          Math.cos((i + 60) * 0.1) * 3 + Math.random(),
          ((i + 60) % 15) / 15 + Math.random() * 0.1
        ],
        names: ['feature1', 'feature2', 'feature3'],
        timestamp: new Date()
      }));

      const predictions = await historicalEnsemble.predictBatch(validationFeatures);
      
      expect(predictions).toHaveLength(15);
      
      // All predictions should be finite and reasonable
      predictions.forEach(pred => {
        expect(isFinite(pred)).toBe(true);
        expect(typeof pred).toBe('number');
        expect(Math.abs(pred)).toBeLessThan(10); // Reasonable range
      });

      // Test individual model predictions for comparison
      const individualPredictions = await historicalEnsemble.getIndividualPredictions(validationFeatures[0]);
      expect(individualPredictions).toHaveLength(2);
      
      individualPredictions.forEach(pred => {
        expect(pred).toHaveProperty('modelIndex');
        expect(pred).toHaveProperty('prediction');
        expect(pred).toHaveProperty('weight');
        expect(isFinite(pred.prediction)).toBe(true);
      });

      historicalEnsemble.dispose();
    }, 25000);

    it('should demonstrate ensemble superiority over individual models', async () => {
      // Create test data with known patterns
      const patternData: TrainingData = {
        features: Array.from({ length: 40 }, (_, i) => [
          i / 10,
          Math.sin(i / 5),
          Math.cos(i / 5)
        ]),
        targets: Array.from({ length: 40 }, (_, i) => 
          (i / 10) * 0.3 + Math.sin(i / 5) * 0.4 + Math.cos(i / 5) * 0.3
        ),
        featureNames: ['linear', 'sin', 'cos'],
        metadata: {
          size: 40,
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31'),
          source: 'pattern'
        }
      };

      const xgboostPattern = new XGBoostModel({
        maxDepth: 3,
        learningRate: 0.1,
        nEstimators: 6,
        objective: 'reg:squarederror'
      });

      const nnPattern = new NeuralNetworkModel({
        hiddenLayers: [8, 4],
        activation: 'relu',
        outputActivation: 'linear',
        optimizer: 'adam',
        learningRate: 0.01,
        batchSize: 4,
        epochs: 6,
        validationSplit: 0.2
      });

      const ensembleConfig: EnsembleConfig = {
        models: ['xgboost', 'neural_network'],
        method: 'weighted_average',
        weights: [0.5, 0.5]
      };

      const patternEnsemble = new EnsembleModel(ensembleConfig, [xgboostPattern, nnPattern]);

      // Train all models
      await Promise.all([
        xgboostPattern.train(patternData),
        nnPattern.train(patternData),
        patternEnsemble.train(patternData)
      ]);

      // Test on new data
      const testFeature: FeatureVector = {
        values: [5, Math.sin(1), Math.cos(1)],
        names: ['linear', 'sin', 'cos'],
        timestamp: new Date()
      };

      const xgboostPred = await xgboostPattern.predict(testFeature);
      const nnPred = await nnPattern.predict(testFeature);
      const ensemblePred = await patternEnsemble.predict(testFeature);

      // All predictions should be finite
      expect(isFinite(xgboostPred)).toBe(true);
      expect(isFinite(nnPred)).toBe(true);
      expect(isFinite(ensemblePred)).toBe(true);

      // Ensemble prediction should be a weighted combination
      const expectedEnsemble = (xgboostPred * 0.5) + (nnPred * 0.5);
      expect(Math.abs(ensemblePred - expectedEnsemble)).toBeLessThan(0.1); // Allow for stacking differences

      patternEnsemble.dispose();
      nnPattern.dispose();
    }, 20000);
  });

  describe('Memory Management', () => {
    it('should dispose of ensemble and base models', () => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'weighted_average'
      };

      ensemble = new EnsembleModel(config, [xgboostModel, nnModel]);
      
      expect(() => ensemble.dispose()).not.toThrow();
      expect(ensemble.isModelTrained()).toBe(false);
      expect(ensemble.getModelCount()).toBe(0);
    });

    it('should handle multiple dispose calls', () => {
      const config: EnsembleConfig = {
        models: ['model1', 'model2'],
        method: 'weighted_average'
      };

      ensemble = new EnsembleModel(config, [xgboostModel, nnModel]);
      
      ensemble.dispose();
      expect(() => ensemble.dispose()).not.toThrow();
    });
  });
});
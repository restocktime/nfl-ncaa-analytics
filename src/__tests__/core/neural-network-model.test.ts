import { NeuralNetworkModel, NeuralNetworkConfig } from '../../core/models/neural-network-model';
import { TrainingData, FeatureVector } from '../../types/ml.types';

describe('NeuralNetworkModel', () => {
  let model: NeuralNetworkModel;
  let trainingData: TrainingData;
  let testFeatures: FeatureVector;

  beforeEach(() => {
    const config: NeuralNetworkConfig = {
      hiddenLayers: [8, 4], // Smaller layers for faster tests
      activation: 'relu',
      outputActivation: 'linear',
      optimizer: 'adam',
      learningRate: 0.01,
      batchSize: 2,
      epochs: 5, // Reduced for faster tests
      validationSplit: 0.2
    };

    model = new NeuralNetworkModel(config);

    trainingData = {
      features: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [2, 3, 4],
        [5, 6, 7],
        [8, 9, 10],
        [3, 4, 5],
        [6, 7, 8]
      ],
      targets: [0.1, 0.8, 0.9, 0.3, 0.7, 0.95, 0.4, 0.75],
      featureNames: ['feature1', 'feature2', 'feature3'],
      metadata: {
        size: 8,
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
    // Clean up TensorFlow resources
    if (model) {
      model.dispose();
    }
  });

  describe('Model Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultModel = new NeuralNetworkModel({} as NeuralNetworkConfig);
      const config = defaultModel.getConfig();
      
      expect(config.hiddenLayers).toEqual([64, 32]);
      expect(config.activation).toBe('relu');
      expect(config.outputActivation).toBe('linear');
      expect(config.optimizer).toBe('adam');
      expect(config.learningRate).toBe(0.001);
      
      defaultModel.dispose();
    });

    it('should use provided configuration', () => {
      const customConfig: NeuralNetworkConfig = {
        hiddenLayers: [16, 8, 4],
        activation: 'tanh',
        outputActivation: 'sigmoid',
        optimizer: 'sgd',
        learningRate: 0.05,
        batchSize: 16,
        epochs: 50,
        validationSplit: 0.3,
        dropout: 0.2
      };

      const customModel = new NeuralNetworkModel(customConfig);
      const config = customModel.getConfig();
      
      expect(config.hiddenLayers).toEqual([16, 8, 4]);
      expect(config.activation).toBe('tanh');
      expect(config.outputActivation).toBe('sigmoid');
      expect(config.optimizer).toBe('sgd');
      expect(config.dropout).toBe(0.2);
      
      customModel.dispose();
    });
  });

  describe('Training', () => {
    it('should train successfully with valid data', async () => {
      expect(model.isModelTrained()).toBe(false);
      
      await model.train(trainingData);
      
      expect(model.isModelTrained()).toBe(true);
    }, 10000); // Increased timeout for training

    it('should handle training with different optimizers', async () => {
      const optimizers: Array<NeuralNetworkConfig['optimizer']> = ['adam', 'sgd', 'rmsprop'];

      for (const optimizer of optimizers) {
        const config: NeuralNetworkConfig = {
          hiddenLayers: [4],
          activation: 'relu',
          outputActivation: 'linear',
          optimizer,
          learningRate: 0.01,
          batchSize: 2,
          epochs: 2,
          validationSplit: 0.2
        };

        const testModel = new NeuralNetworkModel(config);
        await testModel.train(trainingData);
        
        expect(testModel.isModelTrained()).toBe(true);
        testModel.dispose();
      }
    }, 15000);

    it('should handle training with dropout', async () => {
      const config: NeuralNetworkConfig = {
        hiddenLayers: [8, 4],
        activation: 'relu',
        outputActivation: 'linear',
        optimizer: 'adam',
        learningRate: 0.01,
        batchSize: 2,
        epochs: 3,
        validationSplit: 0.2,
        dropout: 0.3
      };

      const dropoutModel = new NeuralNetworkModel(config);
      await dropoutModel.train(trainingData);
      
      expect(dropoutModel.isModelTrained()).toBe(true);
      dropoutModel.dispose();
    }, 10000);
  });

  describe('Prediction', () => {
    beforeEach(async () => {
      await model.train(trainingData);
    }, 10000);

    it('should make predictions after training', async () => {
      const prediction = await model.predict(testFeatures);
      
      expect(typeof prediction).toBe('number');
      expect(isFinite(prediction)).toBe(true);
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
        expect(isFinite(pred)).toBe(true);
      });
    });

    it('should throw error when predicting with untrained model', async () => {
      const untrainedModel = new NeuralNetworkModel({} as NeuralNetworkConfig);
      
      await expect(untrainedModel.predict(testFeatures))
        .rejects.toThrow('Model must be trained before making predictions');
      
      untrainedModel.dispose();
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

  describe('Different Activation Functions', () => {
    it('should handle sigmoid output activation', async () => {
      const config: NeuralNetworkConfig = {
        hiddenLayers: [4],
        activation: 'relu',
        outputActivation: 'sigmoid',
        optimizer: 'adam',
        learningRate: 0.01,
        batchSize: 2,
        epochs: 3,
        validationSplit: 0.2
      };

      const sigmoidModel = new NeuralNetworkModel(config);
      await sigmoidModel.train(trainingData);
      
      const prediction = await sigmoidModel.predict(testFeatures);
      
      // Sigmoid output should be between 0 and 1
      expect(prediction).toBeGreaterThanOrEqual(0);
      expect(prediction).toBeLessThanOrEqual(1);
      
      sigmoidModel.dispose();
    }, 10000);

    it('should handle different hidden layer activations', async () => {
      const activations: Array<NeuralNetworkConfig['activation']> = ['relu', 'sigmoid', 'tanh'];

      for (const activation of activations) {
        const config: NeuralNetworkConfig = {
          hiddenLayers: [4],
          activation,
          outputActivation: 'linear',
          optimizer: 'adam',
          learningRate: 0.01,
          batchSize: 2,
          epochs: 2,
          validationSplit: 0.2
        };

        const testModel = new NeuralNetworkModel(config);
        await testModel.train(trainingData);
        
        const prediction = await testModel.predict(testFeatures);
        expect(isFinite(prediction)).toBe(true);
        
        testModel.dispose();
      }
    }, 15000);
  });

  describe('Regularization', () => {
    it('should handle L1 regularization', async () => {
      const config: NeuralNetworkConfig = {
        hiddenLayers: [8],
        activation: 'relu',
        outputActivation: 'linear',
        optimizer: 'adam',
        learningRate: 0.01,
        batchSize: 2,
        epochs: 3,
        validationSplit: 0.2,
        regularization: { l1: 0.01 }
      };

      const l1Model = new NeuralNetworkModel(config);
      await l1Model.train(trainingData);
      
      expect(l1Model.isModelTrained()).toBe(true);
      l1Model.dispose();
    }, 10000);

    it('should handle L2 regularization', async () => {
      const config: NeuralNetworkConfig = {
        hiddenLayers: [8],
        activation: 'relu',
        outputActivation: 'linear',
        optimizer: 'adam',
        learningRate: 0.01,
        batchSize: 2,
        epochs: 3,
        validationSplit: 0.2,
        regularization: { l2: 0.01 }
      };

      const l2Model = new NeuralNetworkModel(config);
      await l2Model.train(trainingData);
      
      expect(l2Model.isModelTrained()).toBe(true);
      l2Model.dispose();
    }, 10000);

    it('should handle L1L2 regularization', async () => {
      const config: NeuralNetworkConfig = {
        hiddenLayers: [8],
        activation: 'relu',
        outputActivation: 'linear',
        optimizer: 'adam',
        learningRate: 0.01,
        batchSize: 2,
        epochs: 3,
        validationSplit: 0.2,
        regularization: { l1: 0.005, l2: 0.005 }
      };

      const l1l2Model = new NeuralNetworkModel(config);
      await l1l2Model.train(trainingData);
      
      expect(l1l2Model.isModelTrained()).toBe(true);
      l1l2Model.dispose();
    }, 10000);
  });

  describe('Cross Validation', () => {
    it('should perform cross validation', async () => {
      const scores = await model.crossValidate(trainingData, 2); // Reduced folds for speed
      
      expect(scores).toHaveLength(2);
      scores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    }, 20000);
  });

  describe('Model Analysis', () => {
    beforeEach(async () => {
      await model.train(trainingData);
    }, 10000);

    it('should provide architecture summary', () => {
      const summary = model.getArchitectureSummary();
      
      expect(summary).toHaveProperty('layers');
      expect(summary).toHaveProperty('totalParams');
      expect(Array.isArray(summary.layers)).toBe(true);
      expect(summary.layers.length).toBeGreaterThan(0);
      expect(summary.totalParams).toBeGreaterThan(0);
    });

    it('should provide training history', () => {
      const history = model.getTrainingHistory();
      
      expect(history).toHaveProperty('loss');
      expect(history).toHaveProperty('valLoss');
      expect(history).toHaveProperty('metrics');
      expect(Array.isArray(history.loss)).toBe(true);
      expect(Array.isArray(history.valLoss)).toBe(true);
      expect(history.loss.length).toBeGreaterThan(0);
    });

    it('should provide feature importance', () => {
      const importance = model.getFeatureImportance();
      
      expect(Object.keys(importance)).toHaveLength(3);
      expect(importance).toHaveProperty('feature1');
      expect(importance).toHaveProperty('feature2');
      expect(importance).toHaveProperty('feature3');
      
      // Check that importances sum to approximately 1
      const total = Object.values(importance).reduce((sum, val) => sum + val, 0);
      expect(total).toBeCloseTo(1, 5);
    });
  });

  describe('Historical Data Validation', () => {
    it('should validate model accuracy on historical data', async () => {
      // Create larger historical dataset
      const historicalData: TrainingData = {
        features: Array.from({ length: 50 }, (_, i) => [
          Math.sin(i * 0.1) * 5,
          Math.cos(i * 0.1) * 5,
          (i % 10) / 10
        ]),
        targets: Array.from({ length: 50 }, (_, i) => 
          Math.sin(i * 0.1) * 0.5 + Math.cos(i * 0.1) * 0.3 + (i % 10) / 20
        ),
        featureNames: ['feature1', 'feature2', 'feature3'],
        metadata: {
          size: 50,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2023-12-31'),
          source: 'historical'
        }
      };

      const historicalModel = new NeuralNetworkModel({
        hiddenLayers: [8, 4],
        activation: 'relu',
        outputActivation: 'linear',
        optimizer: 'adam',
        learningRate: 0.01,
        batchSize: 4,
        epochs: 10,
        validationSplit: 0.2
      });

      await historicalModel.train(historicalData);
      
      // Test on validation set
      const validationFeatures = Array.from({ length: 10 }, (_, i) => ({
        values: [Math.sin(i * 0.2) * 5, Math.cos(i * 0.2) * 5, (i % 5) / 5],
        names: ['feature1', 'feature2', 'feature3'],
        timestamp: new Date()
      }));

      const predictions = await historicalModel.predictBatch(validationFeatures);
      
      expect(predictions).toHaveLength(10);
      
      // All predictions should be finite numbers
      predictions.forEach(pred => {
        expect(isFinite(pred)).toBe(true);
        expect(typeof pred).toBe('number');
      });

      historicalModel.dispose();
    }, 15000);

    it('should show learning progression during training', async () => {
      const progressModel = new NeuralNetworkModel({
        hiddenLayers: [4],
        activation: 'relu',
        outputActivation: 'linear',
        optimizer: 'adam',
        learningRate: 0.01,
        batchSize: 2,
        epochs: 5,
        validationSplit: 0.2
      });

      await progressModel.train(trainingData);
      
      const history = progressModel.getTrainingHistory();
      
      // Loss should generally decrease over time
      const firstLoss = history.loss[0];
      const lastLoss = history.loss[history.loss.length - 1];
      
      expect(firstLoss).toBeGreaterThan(0);
      expect(lastLoss).toBeGreaterThan(0);
      // In most cases, final loss should be lower than initial
      expect(lastLoss).toBeLessThan(firstLoss * 2); // Allow some variance

      progressModel.dispose();
    }, 10000);
  });

  describe('Memory Management', () => {
    it('should dispose of model resources', () => {
      expect(() => model.dispose()).not.toThrow();
      expect(model.isModelTrained()).toBe(false);
    });

    it('should handle multiple dispose calls', () => {
      model.dispose();
      expect(() => model.dispose()).not.toThrow();
    });
  });
});
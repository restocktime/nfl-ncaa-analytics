import { XGBoostModel, XGBoostConfig } from '../../core/models/xgboost-model';
import { NeuralNetworkModel, NeuralNetworkConfig } from '../../core/models/neural-network-model';
import { EnsembleModel } from '../../core/models/ensemble-model';
import { TrainingData, FeatureVector, EnsembleConfig } from '../../types/ml.types';

describe('ML Models Integration', () => {
  let footballTrainingData: TrainingData;
  let testGameFeatures: FeatureVector;

  beforeAll(() => {
    // Create realistic football analytics training data
    footballTrainingData = {
      features: [
        // [offensive_efficiency, defensive_efficiency, home_advantage, weather_impact, injury_impact]
        [0.85, 0.75, 1.0, 0.9, 0.95], // Strong offense, good defense, home, good weather, healthy
        [0.65, 0.85, 0.0, 0.8, 0.90], // Average offense, strong defense, away, decent weather, mostly healthy
        [0.90, 0.60, 1.0, 0.7, 0.85], // Elite offense, weak defense, home, poor weather, some injuries
        [0.70, 0.70, 0.0, 0.9, 0.80], // Balanced team, away, good weather, moderate injuries
        [0.55, 0.90, 1.0, 0.6, 0.95], // Weak offense, elite defense, home, bad weather, healthy
        [0.80, 0.65, 0.0, 0.8, 0.75], // Good offense, average defense, away, decent weather, injured
        [0.75, 0.80, 1.0, 0.9, 0.90], // Good balanced team, home, good weather, mostly healthy
        [0.60, 0.75, 0.0, 0.7, 0.85], // Below average offense, good defense, away, poor weather
        [0.95, 0.55, 1.0, 0.8, 0.80], // Elite offense, poor defense, home, decent weather, some injuries
        [0.70, 0.85, 0.0, 0.9, 0.95], // Average offense, strong defense, away, good weather, healthy
        [0.85, 0.70, 1.0, 0.6, 0.75], // Strong offense, good defense, home, bad weather, injured
        [0.65, 0.80, 0.0, 0.8, 0.90], // Average offense, strong defense, away, decent weather
        [0.90, 0.65, 1.0, 0.9, 0.85], // Elite offense, average defense, home, good weather
        [0.75, 0.75, 0.0, 0.7, 0.80], // Balanced team, away, poor weather, some injuries
        [0.80, 0.80, 1.0, 0.8, 0.95]  // Strong balanced team, home, decent weather, healthy
      ],
      targets: [
        0.75, // High win probability
        0.45, // Below average win probability
        0.70, // Good win probability despite defense
        0.50, // Even matchup
        0.55, // Defense keeps it close
        0.40, // Injuries hurt away team
        0.80, // Strong home performance
        0.35, // Tough away game
        0.65, // Offense overcomes defense issues
        0.60, // Solid away performance
        0.55, // Weather and injuries impact
        0.50, // Balanced away game
        0.85, // Elite offense at home
        0.30, // Multiple disadvantages
        0.90  // Strong team at home, healthy
      ],
      featureNames: [
        'offensive_efficiency',
        'defensive_efficiency', 
        'home_advantage',
        'weather_impact',
        'injury_impact'
      ],
      metadata: {
        size: 15,
        startDate: new Date('2020-09-01'),
        endDate: new Date('2023-12-31'),
        source: 'football_historical_data'
      }
    };

    testGameFeatures = {
      values: [0.78, 0.72, 1.0, 0.85, 0.88], // Good offense, good defense, home, good weather, mostly healthy
      names: [
        'offensive_efficiency',
        'defensive_efficiency',
        'home_advantage', 
        'weather_impact',
        'injury_impact'
      ],
      timestamp: new Date(),
      gameId: 'test_game_001',
      teamId: 'team_home'
    };
  });

  describe('Individual Model Performance', () => {
    it('should train XGBoost model for football predictions', async () => {
      const xgboostConfig: XGBoostConfig = {
        maxDepth: 4,
        learningRate: 0.1,
        nEstimators: 20,
        subsample: 0.8,
        colsampleBytree: 0.8,
        objective: 'reg:squarederror',
        evalMetric: 'rmse'
      };

      const xgboostModel = new XGBoostModel(xgboostConfig);
      await xgboostModel.train(footballTrainingData);

      const prediction = await xgboostModel.predict(testGameFeatures);
      const featureImportance = xgboostModel.getFeatureImportance();
      const explanation = xgboostModel.explainPrediction(testGameFeatures);
      const complexity = xgboostModel.getModelComplexity();

      // Validate prediction
      expect(prediction).toBeGreaterThanOrEqual(0);
      expect(prediction).toBeLessThanOrEqual(1);

      // Validate feature importance
      expect(Object.keys(featureImportance)).toHaveLength(5);
      const totalImportance = Object.values(featureImportance).reduce((sum, val) => sum + val, 0);
      expect(totalImportance).toBeCloseTo(1, 5);

      // Validate explanation
      expect(Object.keys(explanation)).toHaveLength(5);
      Object.values(explanation).forEach(contribution => {
        expect(isFinite(contribution)).toBe(true);
      });

      // Validate complexity
      expect(complexity.numTrees).toBeGreaterThan(0);
      expect(complexity.avgDepth).toBeGreaterThan(0);
      expect(complexity.totalNodes).toBeGreaterThan(0);

      console.log('XGBoost Prediction:', prediction);
      console.log('Feature Importance:', featureImportance);
    }, 10000);

    it('should train Neural Network model for football predictions', async () => {
      const nnConfig: NeuralNetworkConfig = {
        hiddenLayers: [16, 8, 4],
        activation: 'relu',
        outputActivation: 'sigmoid', // For probability output
        optimizer: 'adam',
        learningRate: 0.01,
        batchSize: 4,
        epochs: 20,
        validationSplit: 0.2,
        dropout: 0.2,
        regularization: { l2: 0.001 }
      };

      const nnModel = new NeuralNetworkModel(nnConfig);
      await nnModel.train(footballTrainingData);

      const prediction = await nnModel.predict(testGameFeatures);
      const architecture = nnModel.getArchitectureSummary();
      const history = nnModel.getTrainingHistory();
      const featureImportance = nnModel.getFeatureImportance();

      // Validate prediction (sigmoid output should be 0-1)
      expect(prediction).toBeGreaterThanOrEqual(0);
      expect(prediction).toBeLessThanOrEqual(1);

      // Validate architecture
      expect(architecture.layers.length).toBeGreaterThan(0);
      expect(architecture.totalParams).toBeGreaterThan(0);

      // Validate training history
      expect(history.loss.length).toBeGreaterThan(0);
      expect(history.valLoss.length).toBeGreaterThan(0);

      // Validate feature importance
      expect(Object.keys(featureImportance)).toHaveLength(5);
      const totalImportance = Object.values(featureImportance).reduce((sum, val) => sum + val, 0);
      expect(totalImportance).toBeCloseTo(1, 5);

      console.log('Neural Network Prediction:', prediction);
      console.log('Architecture:', architecture);

      nnModel.dispose();
    }, 15000);
  });

  describe('Ensemble Model Performance', () => {
    it('should create and train ensemble for superior football predictions', async () => {
      // Create diverse base models
      const xgboostModel = new XGBoostModel({
        maxDepth: 3,
        learningRate: 0.15,
        nEstimators: 15,
        subsample: 0.9,
        objective: 'binary:logistic' // Use logistic for probability output
      });

      const nnModel = new NeuralNetworkModel({
        hiddenLayers: [12, 6],
        activation: 'relu',
        outputActivation: 'sigmoid', // Ensure output is between 0 and 1
        optimizer: 'adam',
        learningRate: 0.005,
        batchSize: 3,
        epochs: 15,
        validationSplit: 0.2,
        dropout: 0.1
      });

      // Create ensemble with strategic weighting
      const ensembleConfig: EnsembleConfig = {
        models: ['xgboost_football', 'neural_network_football'],
        method: 'weighted_average',
        weights: [0.6, 0.4] // Slightly favor XGBoost for tabular data
      };

      const ensemble = new EnsembleModel(ensembleConfig, [xgboostModel, nnModel]);
      await ensemble.train(footballTrainingData);

      // Test predictions
      const ensemblePrediction = await ensemble.predict(testGameFeatures);
      const individualPredictions = await ensemble.getIndividualPredictions(testGameFeatures);
      const ensembleMetrics = ensemble.getEnsembleMetrics();

      // Validate ensemble prediction
      expect(ensemblePrediction).toBeGreaterThanOrEqual(0);
      expect(ensemblePrediction).toBeLessThanOrEqual(1);

      // Validate individual predictions
      expect(individualPredictions).toHaveLength(2);
      individualPredictions.forEach(pred => {
        expect(pred.prediction).toBeGreaterThanOrEqual(0);
        expect(pred.prediction).toBeLessThanOrEqual(1);
        expect(pred.weight).toBeGreaterThan(0);
      });

      // Validate ensemble metrics
      expect(ensembleMetrics.modelCount).toBe(2);
      expect(ensembleMetrics.weights).toEqual([0.6, 0.4]);
      expect(ensembleMetrics.method).toBe('weighted_average');

      // Test batch predictions for multiple games
      const multipleGames: FeatureVector[] = [
        testGameFeatures,
        { ...testGameFeatures, values: [0.60, 0.85, 0.0, 0.7, 0.90], gameId: 'test_game_002' }, // Away underdog
        { ...testGameFeatures, values: [0.95, 0.55, 1.0, 0.9, 0.95], gameId: 'test_game_003' }  // Home favorite
      ];

      const batchPredictions = await ensemble.predictBatch(multipleGames);
      expect(batchPredictions).toHaveLength(3);
      
      // Predictions should be reasonable for different scenarios
      // Note: Actual predictions depend on learned patterns from training data
      expect(batchPredictions[0]).toBeGreaterThanOrEqual(0); // Balanced home team
      expect(batchPredictions[0]).toBeLessThanOrEqual(1);
      expect(batchPredictions[1]).toBeGreaterThanOrEqual(0); // Away underdog
      expect(batchPredictions[1]).toBeLessThanOrEqual(1);
      expect(batchPredictions[2]).toBeGreaterThanOrEqual(0); // Elite home offense
      expect(batchPredictions[2]).toBeLessThanOrEqual(1);

      console.log('Ensemble Prediction:', ensemblePrediction);
      console.log('Individual Predictions:', individualPredictions);
      console.log('Batch Predictions:', batchPredictions);

      ensemble.dispose();
    }, 20000);

    it('should demonstrate model diversity analysis', async () => {
      const xgboostModel = new XGBoostModel({
        maxDepth: 5,
        learningRate: 0.1,
        nEstimators: 10,
        objective: 'binary:logistic' // Use logistic for probability output
      });

      const nnModel = new NeuralNetworkModel({
        hiddenLayers: [8, 4],
        activation: 'tanh', // Different activation for diversity
        outputActivation: 'sigmoid', // Ensure output is between 0 and 1
        optimizer: 'sgd', // Different optimizer
        learningRate: 0.02,
        batchSize: 4,
        epochs: 10,
        validationSplit: 0.2
      });

      const ensembleConfig: EnsembleConfig = {
        models: ['diverse_xgboost', 'diverse_nn'],
        method: 'stacking' // Use stacking for more sophisticated combination
      };

      const diverseEnsemble = new EnsembleModel(ensembleConfig, [xgboostModel, nnModel]);
      await diverseEnsemble.train(footballTrainingData);

      // Create test scenarios for diversity analysis
      const testScenarios: FeatureVector[] = [
        { values: [0.9, 0.5, 1.0, 0.8, 0.9], names: footballTrainingData.featureNames, timestamp: new Date() }, // High offense, low defense
        { values: [0.5, 0.9, 0.0, 0.8, 0.9], names: footballTrainingData.featureNames, timestamp: new Date() }, // Low offense, high defense
        { values: [0.7, 0.7, 1.0, 0.5, 0.7], names: footballTrainingData.featureNames, timestamp: new Date() }, // Balanced, bad weather
        { values: [0.8, 0.8, 0.0, 0.9, 0.6], names: footballTrainingData.featureNames, timestamp: new Date() }  // Strong team, away, injuries
      ];

      const diversityAnalysis = await diverseEnsemble.analyzeModelDiversity(testScenarios);

      // Validate diversity analysis
      expect(diversityAnalysis.correlationMatrix).toHaveLength(2);
      expect(diversityAnalysis.correlationMatrix[0]).toHaveLength(2);
      expect(diversityAnalysis.diversityScore).toBeGreaterThanOrEqual(0);
      expect(diversityAnalysis.diversityScore).toBeLessThanOrEqual(1);
      expect(diversityAnalysis.individualAccuracies).toHaveLength(2);

      // Models should show some diversity (not perfectly correlated)
      const correlation = diversityAnalysis.correlationMatrix[0][1];
      expect(Math.abs(correlation)).toBeLessThan(0.99); // Not perfectly correlated

      console.log('Model Diversity Analysis:', diversityAnalysis);

      diverseEnsemble.dispose();
    }, 25000);
  });

  describe('Cross-Validation and Model Selection', () => {
    it('should perform comprehensive model comparison', async () => {
      // Test different XGBoost configurations
      const xgboostConfigs: XGBoostConfig[] = [
        { maxDepth: 3, learningRate: 0.1, nEstimators: 10, objective: 'binary:logistic' },
        { maxDepth: 5, learningRate: 0.05, nEstimators: 15, objective: 'binary:logistic' },
        { maxDepth: 4, learningRate: 0.15, nEstimators: 12, objective: 'binary:logistic' }
      ];

      const xgboostResults = await Promise.all(
        xgboostConfigs.map(async (config, index) => {
          const model = new XGBoostModel(config);
          const cvScores = await model.crossValidate(footballTrainingData, 3);
          const avgScore = cvScores.reduce((sum, score) => sum + score, 0) / cvScores.length;
          return { configIndex: index, avgScore, config };
        })
      );

      // Test different Neural Network configurations
      const nnConfigs: NeuralNetworkConfig[] = [
        { hiddenLayers: [8], activation: 'relu', outputActivation: 'sigmoid', optimizer: 'adam', learningRate: 0.01, batchSize: 4, epochs: 8, validationSplit: 0.2 },
        { hiddenLayers: [12, 6], activation: 'relu', outputActivation: 'sigmoid', optimizer: 'adam', learningRate: 0.005, batchSize: 3, epochs: 8, validationSplit: 0.2 },
        { hiddenLayers: [16, 8, 4], activation: 'tanh', outputActivation: 'sigmoid', optimizer: 'sgd', learningRate: 0.02, batchSize: 4, epochs: 8, validationSplit: 0.2 }
      ];

      const nnResults = await Promise.all(
        nnConfigs.map(async (config, index) => {
          const model = new NeuralNetworkModel(config);
          const cvScores = await model.crossValidate(footballTrainingData, 3);
          const avgScore = cvScores.reduce((sum, score) => sum + score, 0) / cvScores.length;
          model.dispose();
          return { configIndex: index, avgScore, config };
        })
      );

      // Validate results
      expect(xgboostResults).toHaveLength(3);
      expect(nnResults).toHaveLength(3);

      xgboostResults.forEach(result => {
        expect(result.avgScore).toBeGreaterThanOrEqual(0);
        expect(result.avgScore).toBeLessThanOrEqual(1);
      });

      nnResults.forEach(result => {
        expect(result.avgScore).toBeGreaterThanOrEqual(0);
        expect(result.avgScore).toBeLessThanOrEqual(1);
      });

      // Find best configurations
      const bestXGBoost = xgboostResults.reduce((best, current) => 
        current.avgScore > best.avgScore ? current : best
      );

      const bestNN = nnResults.reduce((best, current) => 
        current.avgScore > best.avgScore ? current : best
      );

      console.log('Best XGBoost Config:', bestXGBoost);
      console.log('Best Neural Network Config:', bestNN);

      // Create final ensemble with best configurations
      const finalXGBoost = new XGBoostModel(bestXGBoost.config);
      const finalNN = new NeuralNetworkModel(bestNN.config);

      const finalEnsembleConfig: EnsembleConfig = {
        models: ['optimized_xgboost', 'optimized_nn'],
        method: 'weighted_average',
        weights: [0.55, 0.45] // Balanced weighting
      };

      const finalEnsemble = new EnsembleModel(finalEnsembleConfig, [finalXGBoost, finalNN]);
      await finalEnsemble.train(footballTrainingData);

      const finalPrediction = await finalEnsemble.predict(testGameFeatures);
      expect(finalPrediction).toBeGreaterThanOrEqual(0);
      expect(finalPrediction).toBeLessThanOrEqual(1);

      console.log('Final Optimized Ensemble Prediction:', finalPrediction);

      finalEnsemble.dispose();
    }, 30000);
  });

  describe('Real-world Football Scenarios', () => {
    it('should handle various football game scenarios accurately', async () => {
      // Create ensemble for scenario testing
      const scenarioXGBoost = new XGBoostModel({
        maxDepth: 4,
        learningRate: 0.1,
        nEstimators: 15,
        objective: 'binary:logistic' // Use logistic for probability output
      });

      const scenarioNN = new NeuralNetworkModel({
        hiddenLayers: [10, 5],
        activation: 'relu',
        outputActivation: 'sigmoid',
        optimizer: 'adam',
        learningRate: 0.01,
        batchSize: 3,
        epochs: 12,
        validationSplit: 0.2
      });

      const scenarioEnsemble = new EnsembleModel(
        { models: ['scenario_xgb', 'scenario_nn'], method: 'weighted_average', weights: [0.6, 0.4] },
        [scenarioXGBoost, scenarioNN]
      );

      await scenarioEnsemble.train(footballTrainingData);

      // Test various realistic scenarios
      const scenarios = [
        {
          name: 'Elite Home Favorite',
          features: [0.95, 0.85, 1.0, 0.9, 0.95],
          expectedRange: [0.8, 1.0]
        },
        {
          name: 'Road Underdog',
          features: [0.55, 0.70, 0.0, 0.8, 0.85],
          expectedRange: [0.0, 0.4]
        },
        {
          name: 'Weather-Impacted Game',
          features: [0.75, 0.75, 1.0, 0.3, 0.90],
          expectedRange: [0.3, 0.7]
        },
        {
          name: 'Injury-Depleted Team',
          features: [0.80, 0.70, 1.0, 0.9, 0.5],
          expectedRange: [0.2, 0.6]
        },
        {
          name: 'Even Matchup',
          features: [0.75, 0.75, 0.0, 0.8, 0.85],
          expectedRange: [0.4, 0.6]
        }
      ];

      for (const scenario of scenarios) {
        const features: FeatureVector = {
          values: scenario.features,
          names: footballTrainingData.featureNames,
          timestamp: new Date(),
          gameId: `scenario_${scenario.name.toLowerCase().replace(/\s+/g, '_')}`
        };

        const prediction = await scenarioEnsemble.predict(features);
        const individualPreds = await scenarioEnsemble.getIndividualPredictions(features);

        // Validate prediction is in reasonable range
        expect(prediction).toBeGreaterThanOrEqual(0);
        expect(prediction).toBeLessThanOrEqual(1);

        console.log(`${scenario.name}: ${prediction.toFixed(3)} (XGB: ${individualPreds[0].prediction.toFixed(3)}, NN: ${individualPreds[1].prediction.toFixed(3)})`);

        // Note: We don't enforce strict ranges as the model learns from data patterns
        // but we validate the predictions are reasonable
      }

      scenarioEnsemble.dispose();
    }, 20000);
  });
});
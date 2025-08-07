import { Game } from '../models/Game';
import { GameProbabilities } from '../models/GameProbabilities';
import { SimulationResult } from '../models/SimulationResult';
import { MLModelService } from './ml-model-service';
import { Logger } from './logger';

// Create a simple logger instance for testing
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta),
  error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta),
  debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta)
};

export interface ProbabilityEngine {
  calculateWinProbability(gameState: any): Promise<number>;
}

export interface BacktestingMetrics {
  brierScore: number;
  logLoss: number;
  accuracy: number;
  calibration: number;
  sharpness: number;
  totalPredictions: number;
}

export interface BacktestingResult {
  modelId: string;
  modelVersion: string;
  testPeriod: {
    startDate: Date;
    endDate: Date;
  };
  metrics: BacktestingMetrics;
  gameResults: GameBacktestResult[];
  performanceByWeek: WeeklyPerformance[];
}

export interface GameBacktestResult {
  gameId: string;
  actualOutcome: number; // 1 for home win, 0 for away win
  predictedProbability: number;
  brierScore: number;
  logLoss: number;
  predictionTimestamp: Date;
}

export interface WeeklyPerformance {
  week: number;
  season: number;
  gamesCount: number;
  averageBrierScore: number;
  averageLogLoss: number;
  accuracy: number;
}

export interface HistoricalDataPoint {
  game: Game;
  actualOutcome: number;
  gameState: any; // Game state at prediction time
  timestamp: Date;
}

export class BacktestingService {
  private mlModelService: MLModelService;
  private probabilityEngine: ProbabilityEngine;

  constructor(
    mlModelService: MLModelService,
    probabilityEngine: ProbabilityEngine
  ) {
    this.mlModelService = mlModelService;
    this.probabilityEngine = probabilityEngine;
  }

  /**
   * Run backtesting on historical data for a specific model
   */
  async runBacktest(
    modelId: string,
    historicalData: HistoricalDataPoint[],
    startDate: Date,
    endDate: Date
  ): Promise<BacktestingResult> {
    logger.info(`Starting backtest for model ${modelId} from ${startDate} to ${endDate}`);

    const filteredData = historicalData.filter(
      point => point.timestamp >= startDate && point.timestamp <= endDate
    );

    const gameResults: GameBacktestResult[] = [];
    const weeklyResults = new Map<string, WeeklyPerformance>();

    for (const dataPoint of filteredData) {
      try {
        // Generate prediction using the model
        const prediction = await this.generatePrediction(modelId, dataPoint);
        
        // Calculate metrics for this prediction
        const brierScore = this.calculateBrierScore(prediction.probability, dataPoint.actualOutcome);
        const logLoss = this.calculateLogLoss(prediction.probability, dataPoint.actualOutcome);

        const gameResult: GameBacktestResult = {
          gameId: dataPoint.game.id,
          actualOutcome: dataPoint.actualOutcome,
          predictedProbability: prediction.probability,
          brierScore,
          logLoss,
          predictionTimestamp: dataPoint.timestamp
        };

        gameResults.push(gameResult);

        // Update weekly performance tracking
        const weekKey = this.getWeekKey(dataPoint.game);
        this.updateWeeklyPerformance(weeklyResults, weekKey, gameResult, dataPoint.game);

      } catch (error) {
        logger.error(`Error processing game ${dataPoint.game.id}:`, error);
      }
    }

    // Calculate overall metrics
    const metrics = this.calculateOverallMetrics(gameResults);
    const performanceByWeek = Array.from(weeklyResults.values());

    const result: BacktestingResult = {
      modelId,
      modelVersion: await this.getModelVersion(modelId),
      testPeriod: { startDate, endDate },
      metrics,
      gameResults,
      performanceByWeek
    };

    logger.info(`Backtest completed for model ${modelId}. Overall Brier Score: ${metrics.brierScore}`);
    return result;
  }

  /**
   * Compare performance of multiple models
   */
  async compareModels(
    modelIds: string[],
    historicalData: HistoricalDataPoint[],
    startDate: Date,
    endDate: Date
  ): Promise<ModelComparison> {
    const results: BacktestingResult[] = [];

    for (const modelId of modelIds) {
      const result = await this.runBacktest(modelId, historicalData, startDate, endDate);
      results.push(result);
    }

    return this.generateModelComparison(results);
  }

  /**
   * Generate prediction for a historical data point
   */
  private async generatePrediction(
    modelId: string,
    dataPoint: HistoricalDataPoint
  ): Promise<{ probability: number }> {
    // This would use the ML model to generate a prediction
    // For now, we'll simulate this with the probability engine
    const probabilities = await this.probabilityEngine.calculateWinProbability(dataPoint.gameState);
    return { probability: probabilities };
  }

  /**
   * Calculate Brier Score for a single prediction
   */
  private calculateBrierScore(predictedProbability: number, actualOutcome: number): number {
    return Math.pow(predictedProbability - actualOutcome, 2);
  }

  /**
   * Calculate Log Loss for a single prediction
   */
  private calculateLogLoss(predictedProbability: number, actualOutcome: number): number {
    // Clamp probability to avoid log(0)
    const clampedProb = Math.max(0.001, Math.min(0.999, predictedProbability));
    
    if (actualOutcome === 1) {
      return -Math.log(clampedProb);
    } else {
      return -Math.log(1 - clampedProb);
    }
  }

  /**
   * Calculate overall metrics from game results
   */
  private calculateOverallMetrics(gameResults: GameBacktestResult[]): BacktestingMetrics {
    if (gameResults.length === 0) {
      throw new Error('No game results to calculate metrics from');
    }

    const totalBrierScore = gameResults.reduce((sum, result) => sum + result.brierScore, 0);
    const totalLogLoss = gameResults.reduce((sum, result) => sum + result.logLoss, 0);
    
    // Calculate accuracy (predictions > 0.5 that were correct)
    const correctPredictions = gameResults.filter(result => 
      (result.predictedProbability > 0.5 && result.actualOutcome === 1) ||
      (result.predictedProbability <= 0.5 && result.actualOutcome === 0)
    ).length;

    // Calculate calibration (how well predicted probabilities match actual frequencies)
    const calibration = this.calculateCalibration(gameResults);
    
    // Calculate sharpness (how far predictions are from 0.5)
    const sharpness = this.calculateSharpness(gameResults);

    return {
      brierScore: totalBrierScore / gameResults.length,
      logLoss: totalLogLoss / gameResults.length,
      accuracy: correctPredictions / gameResults.length,
      calibration,
      sharpness,
      totalPredictions: gameResults.length
    };
  }

  /**
   * Calculate calibration metric
   */
  private calculateCalibration(gameResults: GameBacktestResult[]): number {
    const bins = 10;
    const binSize = 1.0 / bins;
    let totalCalibrationError = 0;

    for (let i = 0; i < bins; i++) {
      const binStart = i * binSize;
      const binEnd = (i + 1) * binSize;
      
      const binResults = gameResults.filter(result => 
        result.predictedProbability >= binStart && result.predictedProbability < binEnd
      );

      if (binResults.length > 0) {
        const avgPredicted = binResults.reduce((sum, r) => sum + r.predictedProbability, 0) / binResults.length;
        const avgActual = binResults.reduce((sum, r) => sum + r.actualOutcome, 0) / binResults.length;
        const binWeight = binResults.length / gameResults.length;
        
        totalCalibrationError += binWeight * Math.abs(avgPredicted - avgActual);
      }
    }

    return totalCalibrationError;
  }

  /**
   * Calculate sharpness metric
   */
  private calculateSharpness(gameResults: GameBacktestResult[]): number {
    const avgDistance = gameResults.reduce((sum, result) => 
      sum + Math.abs(result.predictedProbability - 0.5), 0
    ) / gameResults.length;
    
    return avgDistance;
  }

  /**
   * Get week key for grouping results
   */
  private getWeekKey(game: Game): string {
    // This would extract week and season from game data
    // For now, we'll use a simple approach
    const date = new Date(game.scheduledTime);
    const year = date.getFullYear();
    const week = Math.ceil(date.getDate() / 7);
    return `${year}-${week}`;
  }

  /**
   * Update weekly performance tracking
   */
  private updateWeeklyPerformance(
    weeklyResults: Map<string, WeeklyPerformance>,
    weekKey: string,
    gameResult: GameBacktestResult,
    game: Game
  ): void {
    if (!weeklyResults.has(weekKey)) {
      const [year, week] = weekKey.split('-').map(Number);
      weeklyResults.set(weekKey, {
        week,
        season: year,
        gamesCount: 0,
        averageBrierScore: 0,
        averageLogLoss: 0,
        accuracy: 0
      });
    }

    const weeklyPerf = weeklyResults.get(weekKey)!;
    const newCount = weeklyPerf.gamesCount + 1;
    
    // Update running averages
    weeklyPerf.averageBrierScore = (weeklyPerf.averageBrierScore * weeklyPerf.gamesCount + gameResult.brierScore) / newCount;
    weeklyPerf.averageLogLoss = (weeklyPerf.averageLogLoss * weeklyPerf.gamesCount + gameResult.logLoss) / newCount;
    
    // Update accuracy
    const isCorrect = (gameResult.predictedProbability > 0.5 && gameResult.actualOutcome === 1) ||
                     (gameResult.predictedProbability <= 0.5 && gameResult.actualOutcome === 0);
    weeklyPerf.accuracy = (weeklyPerf.accuracy * weeklyPerf.gamesCount + (isCorrect ? 1 : 0)) / newCount;
    
    weeklyPerf.gamesCount = newCount;
  }

  /**
   * Get model version
   */
  private async getModelVersion(modelId: string): Promise<string> {
    // This would fetch the actual model version
    return '1.0.0';
  }

  /**
   * Generate model comparison report
   */
  private generateModelComparison(results: BacktestingResult[]): ModelComparison {
    const comparisons: ModelPerformanceComparison[] = results.map(result => ({
      modelId: result.modelId,
      modelVersion: result.modelVersion,
      metrics: result.metrics,
      rank: 0 // Will be calculated below
    }));

    // Rank models by Brier Score (lower is better)
    comparisons.sort((a, b) => a.metrics.brierScore - b.metrics.brierScore);
    comparisons.forEach((comp, index) => comp.rank = index + 1);

    return {
      comparisonDate: new Date(),
      models: comparisons,
      bestModel: comparisons[0],
      summary: this.generateComparisonSummary(comparisons)
    };
  }

  /**
   * Generate comparison summary
   */
  private generateComparisonSummary(comparisons: ModelPerformanceComparison[]): string {
    const best = comparisons[0];
    const worst = comparisons[comparisons.length - 1];
    
    const brierImprovement = ((worst.metrics.brierScore - best.metrics.brierScore) / worst.metrics.brierScore * 100).toFixed(2);
    
    return `Best performing model: ${best.modelId} with Brier Score of ${best.metrics.brierScore.toFixed(4)}. ` +
           `This represents a ${brierImprovement}% improvement over the worst performing model.`;
  }
}

export interface ModelComparison {
  comparisonDate: Date;
  models: ModelPerformanceComparison[];
  bestModel: ModelPerformanceComparison;
  summary: string;
}

export interface ModelPerformanceComparison {
  modelId: string;
  modelVersion: string;
  metrics: BacktestingMetrics;
  rank: number;
}
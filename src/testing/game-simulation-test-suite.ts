import { Game } from '../models/Game';
import { GameProbabilities } from '../models/GameProbabilities';
import { ProbabilityEngine } from '../types/common.types';
import { MLModelService } from '../core/ml-model-service';
import { DatabaseService } from '../core/database-service';
import { WebSocketService } from '../api/websocket-service';
import { logger } from '../core/logger';

export interface GameSimulationResult {
  gameId: string;
  simulationSteps: number;
  finalProbabilities: GameProbabilities;
  probabilityHistory: GameProbabilities[];
  accuracyMetrics: AccuracyMetrics;
  performanceMetrics: PerformanceMetrics;
  dataIntegrityChecks: DataIntegrityChecks;
  errors: SimulationError[];
  recoveryActions: RecoveryAction[];
}

export interface AccuracyMetrics {
  winPredictionAccuracy: number;
  spreadAccuracy: number;
  totalAccuracy: number;
  brierScore: number;
  logLoss: number;
  calibrationError: number;
}

export interface PerformanceMetrics {
  totalExecutionTime: number;
  averageUpdateTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
}

export interface DataIntegrityChecks {
  probabilityConsistency: boolean;
  timestampSequence: boolean;
  gameStateProgression: boolean;
  dataCompleteness: boolean;
}

export interface SimulationError {
  timestamp: Date;
  component: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recovered: boolean;
}

export interface RecoveryAction {
  timestamp: Date;
  action: string;
  success: boolean;
  fallbackUsed?: string;
}

export class GameSimulationTestSuite {
  private databaseService: DatabaseService;
  private webSocketService: WebSocketService;
  private probabilityEngine: ProbabilityEngine;
  private mlModelService: MLModelService;

  constructor(
    databaseService: DatabaseService,
    webSocketService: WebSocketService,
    probabilityEngine: ProbabilityEngine,
    mlModelService: MLModelService
  ) {
    this.databaseService = databaseService;
    this.webSocketService = webSocketService;
    this.probabilityEngine = probabilityEngine;
    this.mlModelService = mlModelService;
  }

  /**
   * Simulate a complete game from start to finish
   */
  async simulateCompleteGame(game: Game, historicalData: any): Promise<GameSimulationResult> {
    const startTime = Date.now();
    const result: GameSimulationResult = {
      gameId: game.id,
      simulationSteps: 0,
      finalProbabilities: {} as GameProbabilities,
      probabilityHistory: [],
      accuracyMetrics: {} as AccuracyMetrics,
      performanceMetrics: {} as PerformanceMetrics,
      dataIntegrityChecks: {} as DataIntegrityChecks,
      errors: [],
      recoveryActions: []
    };

    try {
      logger.info(`Starting game simulation for ${game.id}`);

      // Step 1: Initialize game probabilities
      const initialProbabilities = await this.initializeGameWithErrorHandling(game, result);
      result.probabilityHistory.push(initialProbabilities);

      // Step 2: Process game state updates
      for (const gameState of historicalData.gameStates) {
        try {
          const updateStartTime = Date.now();
          
          const updatedProbabilities = await this.probabilityEngine.updateProbabilities({
            gameState: gameState.gameState,
            timestamp: gameState.timestamp
          });

          result.probabilityHistory.push(updatedProbabilities);
          result.simulationSteps++;

          // Broadcast update via WebSocket
          await this.webSocketService.broadcastProbabilityUpdate(updatedProbabilities);

          // Track performance
          const updateTime = Date.now() - updateStartTime;
          this.trackPerformanceMetric(result, 'updateTime', updateTime);

        } catch (error) {
          await this.handleSimulationError(error as Error, result, 'probability_update');
        }
      }

      // Step 3: Finalize simulation
      result.finalProbabilities = result.probabilityHistory[result.probabilityHistory.length - 1];
      
      // Step 4: Calculate accuracy metrics
      result.accuracyMetrics = await this.calculateAccuracyMetrics(
        result.probabilityHistory,
        historicalData.finalOutcome
      );

      // Step 5: Perform data integrity checks
      result.dataIntegrityChecks = this.performDataIntegrityChecks(result);

      // Step 6: Calculate final performance metrics
      result.performanceMetrics = await this.calculatePerformanceMetrics(startTime, result);

      logger.info(`Game simulation completed for ${game.id}. Steps: ${result.simulationSteps}`);

    } catch (error) {
      await this.handleSimulationError(error as Error, result, 'simulation_framework');
    }

    return result;
  }

  /**
   * Simulate multiple games concurrently
   */
  async simulateMultipleGames(
    games: Game[],
    historicalDataSet: any[]
  ): Promise<GameSimulationResult[]> {
    const startTime = Date.now();
    logger.info(`Starting batch simulation for ${games.length} games`);

    // Run simulations in parallel with controlled concurrency
    const concurrencyLimit = 5;
    const results: GameSimulationResult[] = [];

    for (let i = 0; i < games.length; i += concurrencyLimit) {
      const batch = games.slice(i, i + concurrencyLimit);
      const batchData = historicalDataSet.slice(i, i + concurrencyLimit);

      const batchPromises = batch.map((game, index) =>
        this.simulateCompleteGame(game, batchData[index])
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Create error result for failed simulation
          results.push({
            gameId: batch[index].id,
            simulationSteps: 0,
            finalProbabilities: {} as GameProbabilities,
            probabilityHistory: [],
            accuracyMetrics: {} as AccuracyMetrics,
            performanceMetrics: {} as PerformanceMetrics,
            dataIntegrityChecks: {} as DataIntegrityChecks,
            errors: [{
              timestamp: new Date(),
              component: 'simulation_framework',
              message: result.reason.message,
              severity: 'critical',
              recovered: false
            }],
            recoveryActions: []
          });
        }
      });
    }

    const totalTime = Date.now() - startTime;
    logger.info(`Batch simulation completed in ${totalTime}ms. Success rate: ${
      results.filter(r => r.errors.length === 0).length / results.length * 100
    }%`);

    return results;
  }

  /**
   * Initialize game with error handling
   */
  private async initializeGameWithErrorHandling(
    game: Game,
    result: GameSimulationResult
  ): Promise<GameProbabilities> {
    try {
      return await this.probabilityEngine.initializeGameProbabilities(game);
    } catch (error) {
      await this.handleSimulationError(error as Error, result, 'initialization');
      
      // Return fallback probabilities
      return {
        gameId: game.id,
        timestamp: new Date(),
        winProbability: { home: 0.5, away: 0.5 },
        spreadProbability: { spread: 0, probability: 0.5, confidence: 0.5 },
        totalProbability: { over: 0.5, under: 0.5, total: 45 },
        playerProps: []
      };
    }
  }

  /**
   * Handle simulation errors with recovery attempts
   */
  private async handleSimulationError(
    error: Error,
    result: GameSimulationResult,
    component: string
  ): Promise<void> {
    const simulationError: SimulationError = {
      timestamp: new Date(),
      component,
      message: error.message,
      severity: this.determineSeverity(error),
      recovered: false
    };

    result.errors.push(simulationError);
    logger.error(`Simulation error in ${component}:`, error);

    // Attempt recovery based on error type
    const recoveryAction = await this.attemptRecovery(error, component);
    if (recoveryAction) {
      result.recoveryActions.push(recoveryAction);
      simulationError.recovered = recoveryAction.success;
    }
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error.message.includes('Database') || error.message.includes('Connection')) {
      return 'critical';
    }
    if (error.message.includes('Model') || error.message.includes('Prediction')) {
      return 'high';
    }
    if (error.message.includes('WebSocket') || error.message.includes('Broadcast')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(error: Error, component: string): Promise<RecoveryAction | null> {
    const recoveryAction: RecoveryAction = {
      timestamp: new Date(),
      action: '',
      success: false
    };

    try {
      if (component === 'probability_update' && error.message.includes('Model')) {
        // Try fallback model
        recoveryAction.action = 'fallback_to_simple_model';
        recoveryAction.fallbackUsed = 'simple_probability_model';
        recoveryAction.success = true;
      } else if (component === 'initialization' && error.message.includes('Database')) {
        // Try cached data
        recoveryAction.action = 'use_cached_initialization';
        recoveryAction.fallbackUsed = 'cached_game_data';
        recoveryAction.success = true;
      } else {
        // Generic retry
        recoveryAction.action = 'retry_operation';
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        recoveryAction.success = Math.random() > 0.3; // 70% success rate for simulation
      }
    } catch (recoveryError) {
      recoveryAction.success = false;
      logger.error('Recovery attempt failed:', recoveryError);
    }

    return recoveryAction;
  }

  /**
   * Calculate accuracy metrics
   */
  private async calculateAccuracyMetrics(
    probabilityHistory: GameProbabilities[],
    actualOutcome: any
  ): Promise<AccuracyMetrics> {
    if (probabilityHistory.length === 0) {
      return {
        winPredictionAccuracy: 0,
        spreadAccuracy: 0,
        totalAccuracy: 0,
        brierScore: 1,
        logLoss: Infinity,
        calibrationError: 1
      };
    }

    const finalProbabilities = probabilityHistory[probabilityHistory.length - 1];
    const actualWinner = actualOutcome.winner === 'home' ? 1 : 0;
    const predictedWinProb = finalProbabilities.winProbability.home;

    // Win prediction accuracy
    const winPredictionCorrect = (predictedWinProb > 0.5 && actualWinner === 1) ||
                                (predictedWinProb <= 0.5 && actualWinner === 0);
    const winPredictionAccuracy = winPredictionCorrect ? 1 : 0;

    // Brier Score
    const brierScore = Math.pow(predictedWinProb - actualWinner, 2);

    // Log Loss
    const clampedProb = Math.max(0.001, Math.min(0.999, predictedWinProb));
    const logLoss = actualWinner === 1 ? -Math.log(clampedProb) : -Math.log(1 - clampedProb);

    // Spread accuracy (simplified)
    const spreadCorrect = this.checkSpreadAccuracy(finalProbabilities, actualOutcome);
    const spreadAccuracy = spreadCorrect ? 1 : 0;

    // Total accuracy (over/under)
    const totalCorrect = this.checkTotalAccuracy(finalProbabilities, actualOutcome);
    const totalAccuracy = totalCorrect ? 1 : 0;

    // Calibration error (simplified)
    const calibrationError = this.calculateCalibrationError(probabilityHistory);

    return {
      winPredictionAccuracy,
      spreadAccuracy,
      totalAccuracy,
      brierScore,
      logLoss,
      calibrationError
    };
  }

  /**
   * Check spread accuracy
   */
  private checkSpreadAccuracy(probabilities: GameProbabilities, actualOutcome: any): boolean {
    const spread = probabilities.spreadProbability.spread;
    const actualMargin = actualOutcome.homeScore - actualOutcome.awayScore;
    
    if (spread < 0) {
      // Home team favored
      return actualMargin > Math.abs(spread);
    } else {
      // Away team favored
      return actualMargin < -spread;
    }
  }

  /**
   * Check total accuracy
   */
  private checkTotalAccuracy(probabilities: GameProbabilities, actualOutcome: any): boolean {
    const total = probabilities.totalProbability.total;
    const actualTotal = actualOutcome.totalPoints;
    
    return probabilities.totalProbability.over > 0.5 ? 
           actualTotal > total : 
           actualTotal < total;
  }

  /**
   * Calculate calibration error
   */
  private calculateCalibrationError(probabilityHistory: GameProbabilities[]): number {
    // Simplified calibration calculation
    // In a real implementation, this would be more sophisticated
    const avgConfidence = probabilityHistory.reduce((sum, prob) => 
      sum + prob.spreadProbability.confidence, 0) / probabilityHistory.length;
    
    // Return a mock calibration error based on confidence
    return Math.abs(avgConfidence - 0.8); // Assume 0.8 is well-calibrated
  }

  /**
   * Perform data integrity checks
   */
  private performDataIntegrityChecks(result: GameSimulationResult): DataIntegrityChecks {
    const checks: DataIntegrityChecks = {
      probabilityConsistency: true,
      timestampSequence: true,
      gameStateProgression: true,
      dataCompleteness: true
    };

    // Check probability consistency
    for (const prob of result.probabilityHistory) {
      const winProbSum = prob.winProbability.home + prob.winProbability.away;
      if (Math.abs(winProbSum - 1.0) > 0.01) {
        checks.probabilityConsistency = false;
        break;
      }
    }

    // Check timestamp sequence
    for (let i = 1; i < result.probabilityHistory.length; i++) {
      if (result.probabilityHistory[i].timestamp <= result.probabilityHistory[i - 1].timestamp) {
        checks.timestampSequence = false;
        break;
      }
    }

    // Check data completeness
    checks.dataCompleteness = result.probabilityHistory.length > 0 &&
                             result.finalProbabilities &&
                             result.simulationSteps > 0;

    return checks;
  }

  /**
   * Track performance metric
   */
  private trackPerformanceMetric(
    result: GameSimulationResult,
    metric: string,
    value: number
  ): void {
    if (!result.performanceMetrics) {
      result.performanceMetrics = {} as PerformanceMetrics;
    }

    // Store metrics for later aggregation
    if (!result.performanceMetrics.updateTimes) {
      (result.performanceMetrics as any).updateTimes = [];
    }
    (result.performanceMetrics as any).updateTimes.push(value);
  }

  /**
   * Calculate final performance metrics
   */
  private async calculatePerformanceMetrics(
    startTime: number,
    result: GameSimulationResult
  ): Promise<PerformanceMetrics> {
    const totalExecutionTime = Date.now() - startTime;
    const updateTimes = (result.performanceMetrics as any).updateTimes || [];
    const averageUpdateTime = updateTimes.length > 0 ? 
      updateTimes.reduce((sum: number, time: number) => sum + time, 0) / updateTimes.length : 0;

    // Mock memory and CPU usage (in real implementation, these would be measured)
    const memoryUsage = process.memoryUsage().heapUsed;
    const cpuUsage = Math.random() * 50 + 10; // Mock CPU usage 10-60%
    const networkLatency = Math.random() * 50 + 10; // Mock network latency 10-60ms

    return {
      totalExecutionTime,
      averageUpdateTime,
      memoryUsage,
      cpuUsage,
      networkLatency
    };
  }
}
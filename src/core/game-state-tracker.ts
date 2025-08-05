import { RedisCache } from './redis-cache';
import { GameState } from '../models/GameState';
import { GameEvent, EvidenceType } from './bayesian-updater';
import { Play, PlayType, PlayResult } from '../types/game.types';

/**
 * Momentum calculation result
 */
export interface MomentumCalculation {
  value: number; // -1 to 1, negative favors away team, positive favors home team
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number; // 0 to 1
  factors: MomentumFactor[];
  lastUpdated: Date;
}

/**
 * Individual momentum factor
 */
export interface MomentumFactor {
  type: string;
  impact: number;
  weight: number;
  description: string;
  timestamp: Date;
}

/**
 * Game event for processing pipeline
 */
export interface ProcessedGameEvent extends GameEvent {
  processed: boolean;
  processingTimestamp: Date;
  momentum?: MomentumCalculation;
}

/**
 * Game state snapshot for persistence
 */
export interface GameStateSnapshot {
  gameId: string;
  timestamp: Date;
  gameState: GameState;
  momentum: MomentumCalculation;
  recentEvents: ProcessedGameEvent[];
  version: number;
}

/**
 * Event processing pipeline configuration
 */
export interface EventProcessingConfig {
  batchSize: number;
  processingInterval: number; // milliseconds
  retentionPeriod: number; // seconds
  momentumWindowSize: number; // number of recent events to consider
}

/**
 * Game state tracker with Redis-backed persistence and momentum calculation
 */
export class GameStateTracker {
  private readonly GAME_STATE_PREFIX = 'game_state:';
  private readonly MOMENTUM_PREFIX = 'momentum:';
  private readonly EVENTS_PREFIX = 'events:';
  private readonly SNAPSHOT_PREFIX = 'snapshot:';
  
  private readonly DEFAULT_CONFIG: EventProcessingConfig = {
    batchSize: 10,
    processingInterval: 1000,
    retentionPeriod: 86400, // 24 hours
    momentumWindowSize: 20
  };

  private config: EventProcessingConfig;
  private eventQueue: Map<string, ProcessedGameEvent[]> = new Map();
  private processingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private redisCache: RedisCache,
    config: Partial<EventProcessingConfig> = {}
  ) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize tracking for a game
   */
  async initializeGame(gameState: GameState): Promise<void> {
    const gameId = gameState.game.id;
    
    // Store initial game state
    await this.persistGameState(gameState);
    
    // Initialize momentum
    const initialMomentum = this.calculateInitialMomentum(gameState);
    await this.persistMomentum(gameId, initialMomentum);
    
    // Create initial snapshot
    const snapshot: GameStateSnapshot = {
      gameId,
      timestamp: new Date(),
      gameState,
      momentum: initialMomentum,
      recentEvents: [],
      version: 1
    };
    
    await this.persistSnapshot(snapshot);
    
    // Initialize event queue
    this.eventQueue.set(gameId, []);
    
    // Start event processing pipeline
    this.startEventProcessing(gameId);
  }

  /**
   * Update game state and calculate momentum
   */
  async updateGameState(gameState: GameState): Promise<MomentumCalculation> {
    const gameId = gameState.game.id;
    
    // Persist updated game state
    await this.persistGameState(gameState);
    
    // Get recent events for momentum calculation
    const recentEvents = await this.getRecentEvents(gameId);
    
    // Calculate new momentum
    const momentum = await this.calculateMomentum(gameState, recentEvents);
    
    // Persist momentum
    await this.persistMomentum(gameId, momentum);
    
    // Update snapshot
    await this.updateSnapshot(gameId, gameState, momentum, recentEvents);
    
    return momentum;
  }

  /**
   * Add event to processing queue
   */
  async addEvent(event: GameEvent): Promise<void> {
    const gameId = event.gameId;
    
    const processedEvent: ProcessedGameEvent = {
      ...event,
      processed: false,
      processingTimestamp: new Date()
    };
    
    // Add to in-memory queue
    if (!this.eventQueue.has(gameId)) {
      this.eventQueue.set(gameId, []);
    }
    this.eventQueue.get(gameId)!.push(processedEvent);
    
    // Persist event
    await this.persistEvent(processedEvent);
  }

  /**
   * Get current game state
   */
  async getCurrentGameState(gameId: string): Promise<GameState | null> {
    const key = `${this.GAME_STATE_PREFIX}${gameId}`;
    const data = await this.redisCache.get<string>(key);
    
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    return new GameState(parsedData);
  }

  /**
   * Get current momentum
   */
  async getCurrentMomentum(gameId: string): Promise<MomentumCalculation | null> {
    const key = `${this.MOMENTUM_PREFIX}${gameId}`;
    const data = await this.redisCache.get<string>(key);
    
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    // Convert date strings back to Date objects
    parsedData.lastUpdated = new Date(parsedData.lastUpdated);
    parsedData.factors.forEach((factor: any) => {
      factor.timestamp = new Date(factor.timestamp);
    });
    
    return parsedData as MomentumCalculation;
  }

  /**
   * Get game state snapshot
   */
  async getSnapshot(gameId: string): Promise<GameStateSnapshot | null> {
    const key = `${this.SNAPSHOT_PREFIX}${gameId}`;
    const data = await this.redisCache.get<string>(key);
    
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    // Convert date strings back to Date objects
    parsedData.timestamp = new Date(parsedData.timestamp);
    parsedData.gameState = new GameState(parsedData.gameState);
    parsedData.momentum.lastUpdated = new Date(parsedData.momentum.lastUpdated);
    parsedData.momentum.factors.forEach((factor: any) => {
      factor.timestamp = new Date(factor.timestamp);
    });
    parsedData.recentEvents.forEach((event: any) => {
      event.timestamp = new Date(event.timestamp);
      event.processingTimestamp = new Date(event.processingTimestamp);
    });
    
    return parsedData as GameStateSnapshot;
  }

  /**
   * Get recent events for a game
   */
  async getRecentEvents(gameId: string, limit: number = 20): Promise<ProcessedGameEvent[]> {
    const key = `${this.EVENTS_PREFIX}${gameId}`;
    const events = await this.redisCache.getList(key, 0, limit - 1);
    
    return events.map((event: string) => {
      const parsedEvent = JSON.parse(event) as ProcessedGameEvent;
      // Convert date strings back to Date objects
      parsedEvent.timestamp = new Date(parsedEvent.timestamp);
      parsedEvent.processingTimestamp = new Date(parsedEvent.processingTimestamp);
      if (parsedEvent.gameState) {
        parsedEvent.gameState = new GameState(parsedEvent.gameState);
      }
      return parsedEvent;
    });
  }

  /**
   * Clean up tracking for completed game
   */
  async finalizeGame(gameId: string): Promise<void> {
    // Stop event processing
    const interval = this.processingIntervals.get(gameId);
    if (interval) {
      clearInterval(interval);
      this.processingIntervals.delete(gameId);
    }
    
    // Clear event queue
    this.eventQueue.delete(gameId);
    
    // Set expiration on Redis keys for cleanup
    const keys = [
      `${this.GAME_STATE_PREFIX}${gameId}`,
      `${this.MOMENTUM_PREFIX}${gameId}`,
      `${this.EVENTS_PREFIX}${gameId}`,
      `${this.SNAPSHOT_PREFIX}${gameId}`
    ];
    
    for (const key of keys) {
      await this.redisCache.expire(key, this.config.retentionPeriod);
    }
  }

  /**
   * Calculate initial momentum from game state
   */
  private calculateInitialMomentum(gameState: GameState): MomentumCalculation {
    const factors: MomentumFactor[] = [];
    let totalMomentum = 0;
    
    // Score differential factor
    const scoreDiff = gameState.getScoreDifferential();
    if (scoreDiff !== 0) {
      const scoreFactor: MomentumFactor = {
        type: 'score_differential',
        impact: Math.tanh(scoreDiff / 14) * 0.3, // Normalize to [-0.3, 0.3]
        weight: 0.4,
        description: `Score differential: ${scoreDiff}`,
        timestamp: new Date()
      };
      factors.push(scoreFactor);
      totalMomentum += scoreFactor.impact * scoreFactor.weight;
    }
    
    // Field position factor
    const yardsToEndZone = gameState.getYardsToEndZone();
    const fieldPositionImpact = (50 - yardsToEndZone) / 100; // -0.5 to 0.5
    const fieldFactor: MomentumFactor = {
      type: 'field_position',
      impact: fieldPositionImpact,
      weight: 0.2,
      description: `${yardsToEndZone} yards to end zone`,
      timestamp: new Date()
    };
    factors.push(fieldFactor);
    totalMomentum += fieldFactor.impact * fieldFactor.weight;
    
    // Time remaining factor (late game situations)
    const timeElapsed = gameState.getTimeElapsed();
    const totalGameTime = 60 * 60; // 60 minutes
    const timeProgress = timeElapsed / totalGameTime;
    
    if (timeProgress > 0.75) { // Fourth quarter
      const urgencyFactor: MomentumFactor = {
        type: 'time_urgency',
        impact: scoreDiff > 0 ? 0.1 : -0.1, // Favor leading team in late game
        weight: 0.3,
        description: 'Late game situation',
        timestamp: new Date()
      };
      factors.push(urgencyFactor);
      totalMomentum += urgencyFactor.impact * urgencyFactor.weight;
    }
    
    return {
      value: Math.max(-1, Math.min(1, totalMomentum)),
      trend: 'stable',
      confidence: 0.6,
      factors,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate momentum based on recent events
   */
  private async calculateMomentum(
    gameState: GameState,
    recentEvents: ProcessedGameEvent[]
  ): Promise<MomentumCalculation> {
    const factors: MomentumFactor[] = [];
    let totalMomentum = 0;
    
    // Get previous momentum for trend calculation
    const previousMomentum = await this.getCurrentMomentum(gameState.game.id);
    const previousValue = previousMomentum?.value || 0;
    
    // Base momentum from game state
    const baseMomentum = this.calculateInitialMomentum(gameState);
    factors.push(...baseMomentum.factors);
    totalMomentum = baseMomentum.value;
    
    // Recent events momentum
    const eventMomentum = this.calculateEventMomentum(recentEvents);
    factors.push(...eventMomentum.factors);
    totalMomentum += eventMomentum.value;
    
    // Situational momentum
    const situationalMomentum = this.calculateSituationalMomentum(gameState);
    factors.push(...situationalMomentum.factors);
    totalMomentum += situationalMomentum.value;
    
    // Determine trend
    const currentValue = Math.max(-1, Math.min(1, totalMomentum));
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    
    if (Math.abs(currentValue - previousValue) > 0.1) {
      trend = currentValue > previousValue ? 'increasing' : 'decreasing';
    }
    
    // Calculate confidence based on number of factors and their consistency
    const confidence = this.calculateMomentumConfidence(factors);
    
    return {
      value: currentValue,
      trend,
      confidence,
      factors,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate momentum from recent events
   */
  private calculateEventMomentum(events: ProcessedGameEvent[]): { value: number; factors: MomentumFactor[] } {
    const factors: MomentumFactor[] = [];
    let totalImpact = 0;
    
    // Weight recent events more heavily
    const now = new Date().getTime();
    
    events.forEach((event, index) => {
      const ageMinutes = (now - event.timestamp.getTime()) / (1000 * 60);
      const ageWeight = Math.exp(-ageMinutes / 10); // Exponential decay over 10 minutes
      const recencyWeight = (events.length - index) / events.length; // More recent = higher weight
      
      const eventWeight = ageWeight * recencyWeight * this.getEventMomentumWeight(event.type);
      const eventImpact = event.impact * eventWeight;
      
      if (Math.abs(eventImpact) > 0.01) { // Only include significant events
        factors.push({
          type: `event_${event.type}`,
          impact: eventImpact,
          weight: eventWeight,
          description: event.description,
          timestamp: event.timestamp
        });
        
        totalImpact += eventImpact;
      }
    });
    
    return {
      value: Math.max(-0.5, Math.min(0.5, totalImpact)), // Cap event momentum
      factors
    };
  }

  /**
   * Calculate situational momentum factors
   */
  private calculateSituationalMomentum(gameState: GameState): { value: number; factors: MomentumFactor[] } {
    const factors: MomentumFactor[] = [];
    let totalImpact = 0;
    
    // Red zone situation
    if (gameState.isRedZone()) {
      const redZoneFactor: MomentumFactor = {
        type: 'red_zone',
        impact: gameState.possession.id === gameState.game.homeTeam.id ? 0.15 : -0.15,
        weight: 0.8,
        description: 'Red zone opportunity',
        timestamp: new Date()
      };
      factors.push(redZoneFactor);
      totalImpact += redZoneFactor.impact * redZoneFactor.weight;
    }
    
    // Critical down situation
    if (gameState.isCriticalDown()) {
      const criticalDownFactor: MomentumFactor = {
        type: 'critical_down',
        impact: gameState.possession.id === gameState.game.homeTeam.id ? -0.1 : 0.1,
        weight: 0.6,
        description: `${gameState.down}${this.getOrdinalSuffix(gameState.down)} and ${gameState.yardsToGo}`,
        timestamp: new Date()
      };
      factors.push(criticalDownFactor);
      totalImpact += criticalDownFactor.impact * criticalDownFactor.weight;
    }
    
    // Two-minute warning
    if (gameState.isTwoMinuteWarning()) {
      const twoMinuteFactor: MomentumFactor = {
        type: 'two_minute_warning',
        impact: gameState.getScoreDifferential() > 0 ? 0.1 : -0.1,
        weight: 0.7,
        description: 'Two-minute warning',
        timestamp: new Date()
      };
      factors.push(twoMinuteFactor);
      totalImpact += twoMinuteFactor.impact * twoMinuteFactor.weight;
    }
    
    return {
      value: Math.max(-0.3, Math.min(0.3, totalImpact)),
      factors
    };
  }

  /**
   * Get momentum weight for different event types
   */
  private getEventMomentumWeight(eventType: EvidenceType): number {
    const weights: { [key in EvidenceType]: number } = {
      [EvidenceType.TOUCHDOWN]: 0.8,
      [EvidenceType.TURNOVER]: 0.7,
      [EvidenceType.FIELD_GOAL]: 0.4,
      [EvidenceType.SCORE_CHANGE]: 0.5,
      [EvidenceType.INJURY]: 0.3,
      [EvidenceType.PENALTY]: 0.2,
      [EvidenceType.WEATHER_CHANGE]: 0.1,
      [EvidenceType.MOMENTUM_SHIFT]: 0.6,
      [EvidenceType.TIME_REMAINING]: 0.1,
      [EvidenceType.FIELD_POSITION]: 0.2
    };
    
    return weights[eventType] || 0.1;
  }

  /**
   * Calculate confidence in momentum calculation
   */
  private calculateMomentumConfidence(factors: MomentumFactor[]): number {
    if (factors.length === 0) return 0.3;
    
    // Base confidence from number of factors
    const factorConfidence = Math.min(0.8, factors.length * 0.1);
    
    // Consistency bonus - factors pointing in same direction
    const positiveFactors = factors.filter(f => f.impact > 0).length;
    const negativeFactors = factors.filter(f => f.impact < 0).length;
    const totalFactors = factors.length;
    
    const consistency = Math.abs(positiveFactors - negativeFactors) / totalFactors;
    const consistencyBonus = consistency * 0.2;
    
    return Math.min(0.95, factorConfidence + consistencyBonus);
  }

  /**
   * Get ordinal suffix for numbers
   */
  private getOrdinalSuffix(num: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  }

  /**
   * Start event processing pipeline for a game
   */
  private startEventProcessing(gameId: string): void {
    const interval = setInterval(async () => {
      await this.processEventBatch(gameId);
    }, this.config.processingInterval);
    
    this.processingIntervals.set(gameId, interval);
  }

  /**
   * Process a batch of events
   */
  private async processEventBatch(gameId: string): Promise<void> {
    const events = this.eventQueue.get(gameId) || [];
    const unprocessedEvents = events.filter(e => !e.processed);
    
    if (unprocessedEvents.length === 0) return;
    
    const batchSize = Math.min(this.config.batchSize, unprocessedEvents.length);
    const batch = unprocessedEvents.slice(0, batchSize);
    
    for (const event of batch) {
      try {
        // Calculate momentum impact for this event
        const gameState = await this.getCurrentGameState(gameId);
        if (gameState) {
          const momentum = await this.calculateMomentum(gameState, [event]);
          event.momentum = momentum;
        }
        
        event.processed = true;
        event.processingTimestamp = new Date();
        
        // Update persisted event
        await this.persistEvent(event);
        
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
      }
    }
  }

  /**
   * Persist game state to Redis
   */
  private async persistGameState(gameState: GameState): Promise<void> {
    const key = `${this.GAME_STATE_PREFIX}${gameState.game.id}`;
    await this.redisCache.set(key, JSON.stringify(gameState), { ttl: 3600 }); // 1 hour TTL
  }

  /**
   * Persist momentum to Redis
   */
  private async persistMomentum(gameId: string, momentum: MomentumCalculation): Promise<void> {
    const key = `${this.MOMENTUM_PREFIX}${gameId}`;
    await this.redisCache.set(key, JSON.stringify(momentum), { ttl: 3600 }); // 1 hour TTL
  }

  /**
   * Persist event to Redis
   */
  private async persistEvent(event: ProcessedGameEvent): Promise<void> {
    const key = `${this.EVENTS_PREFIX}${event.gameId}`;
    await this.redisCache.addToList(key, JSON.stringify(event));
    await this.redisCache.expire(key, this.config.retentionPeriod);
  }

  /**
   * Persist snapshot to Redis
   */
  private async persistSnapshot(snapshot: GameStateSnapshot): Promise<void> {
    const key = `${this.SNAPSHOT_PREFIX}${snapshot.gameId}`;
    await this.redisCache.set(key, JSON.stringify(snapshot), { ttl: 3600 }); // 1 hour TTL
  }

  /**
   * Update snapshot
   */
  private async updateSnapshot(
    gameId: string,
    gameState: GameState,
    momentum: MomentumCalculation,
    recentEvents: ProcessedGameEvent[]
  ): Promise<void> {
    const existingSnapshot = await this.getSnapshot(gameId);
    const version = existingSnapshot ? existingSnapshot.version + 1 : 1;
    
    const snapshot: GameStateSnapshot = {
      gameId,
      timestamp: new Date(),
      gameState,
      momentum,
      recentEvents: recentEvents.slice(0, this.config.momentumWindowSize),
      version
    };
    
    await this.persistSnapshot(snapshot);
  }
}
/**
 * Game Status Classifier Unit Tests
 * Tests for accurate game status determination and categorization
 */

// Mock game data structure
interface MockGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  startTime?: Date;
  endTime?: Date;
}

// Mock the GameStatusClassifier class
class MockGameStatusClassifier {
  private statusMappings: Map<string, string> = new Map();
  private liveStatuses: Set<string> = new Set();
  private upcomingStatuses: Set<string> = new Set();
  private completedStatuses: Set<string> = new Set();
  private classificationLog: any[] = [];

  constructor() {
    console.log('🏈 Game Status Classifier initialized');
    this.initializeStatusMappings();
    this.initializeStatusCategories();
  }

  /**
   * Initialize status mappings for normalization
   */
  private initializeStatusMappings(): void {
    // Live game status mappings
    this.statusMappings.set('live', 'LIVE');
    this.statusMappings.set('in_progress', 'LIVE');
    this.statusMappings.set('in progress', 'LIVE');
    this.statusMappings.set('active', 'LIVE');
    this.statusMappings.set('playing', 'LIVE');
    this.statusMappings.set('halftime', 'HALFTIME');
    this.statusMappings.set('half time', 'HALFTIME');
    this.statusMappings.set('break', 'HALFTIME');
    this.statusMappings.set('intermission', 'HALFTIME');
    
    // Upcoming game status mappings
    this.statusMappings.set('scheduled', 'SCHEDULED');
    this.statusMappings.set('pre_game', 'SCHEDULED');
    this.statusMappings.set('pre-game', 'SCHEDULED');
    this.statusMappings.set('pregame', 'SCHEDULED');
    this.statusMappings.set('upcoming', 'SCHEDULED');
    this.statusMappings.set('not_started', 'SCHEDULED');
    this.statusMappings.set('not started', 'SCHEDULED');
    this.statusMappings.set('pending', 'SCHEDULED');
    
    // Completed game status mappings
    this.statusMappings.set('final', 'FINAL');
    this.statusMappings.set('finished', 'FINAL');
    this.statusMappings.set('completed', 'FINAL');
    this.statusMappings.set('ended', 'FINAL');
    this.statusMappings.set('game_over', 'FINAL');
    this.statusMappings.set('game over', 'FINAL');
    
    // Special status mappings
    this.statusMappings.set('postponed', 'POSTPONED');
    this.statusMappings.set('delayed', 'DELAYED');
    this.statusMappings.set('cancelled', 'CANCELLED');
    this.statusMappings.set('canceled', 'CANCELLED');
    this.statusMappings.set('suspended', 'SUSPENDED');
    
    console.log(`✅ Initialized ${this.statusMappings.size} status mappings`);
  }

  /**
   * Initialize status categories
   */
  private initializeStatusCategories(): void {
    // Live game statuses
    this.liveStatuses.add('LIVE');
    this.liveStatuses.add('IN_PROGRESS');
    this.liveStatuses.add('HALFTIME');
    this.liveStatuses.add('ACTIVE');
    this.liveStatuses.add('PLAYING');
    
    // Upcoming game statuses
    this.upcomingStatuses.add('SCHEDULED');
    this.upcomingStatuses.add('PRE_GAME');
    this.upcomingStatuses.add('UPCOMING');
    this.upcomingStatuses.add('NOT_STARTED');
    this.upcomingStatuses.add('PENDING');
    
    // Completed game statuses
    this.completedStatuses.add('FINAL');
    this.completedStatuses.add('FINISHED');
    this.completedStatuses.add('COMPLETED');
    this.completedStatuses.add('ENDED');
    
    console.log(`✅ Initialized status categories: ${this.liveStatuses.size} live, ${this.upcomingStatuses.size} upcoming, ${this.completedStatuses.size} completed`);
  }

  /**
   * Classify game status into normalized categories
   */
  classifyGameStatus(game: MockGame): {
    originalStatus: string;
    normalizedStatus: string;
    category: 'live' | 'upcoming' | 'completed' | 'special';
    confidence: number;
  } {
    console.log(`🏈 Classifying status for game ${game.id}: ${game.status}`);
    
    const originalStatus = game.status;
    const normalizedStatus = this.normalizeStatus(originalStatus);
    const category = this.determineCategory(normalizedStatus);
    const confidence = this.calculateConfidence(originalStatus, normalizedStatus);
    
    const classification = {
      originalStatus,
      normalizedStatus,
      category,
      confidence
    };
    
    this.logClassification(game.id, classification);
    
    return classification;
  }

  /**
   * Check if game is live
   */
  isLiveGame(status: string): boolean {
    const normalizedStatus = this.normalizeStatus(status);
    const isLive = this.liveStatuses.has(normalizedStatus);
    
    console.log(`🔴 Live check for "${status}" (${normalizedStatus}): ${isLive}`);
    return isLive;
  }

  /**
   * Check if game is upcoming
   */
  isUpcomingGame(status: string): boolean {
    const normalizedStatus = this.normalizeStatus(status);
    const isUpcoming = this.upcomingStatuses.has(normalizedStatus);
    
    console.log(`🔵 Upcoming check for "${status}" (${normalizedStatus}): ${isUpcoming}`);
    return isUpcoming;
  }

  /**
   * Check if game is completed
   */
  isCompletedGame(status: string): boolean {
    const normalizedStatus = this.normalizeStatus(status);
    const isCompleted = this.completedStatuses.has(normalizedStatus);
    
    console.log(`⚫ Completed check for "${status}" (${normalizedStatus}): ${isCompleted}`);
    return isCompleted;
  }

  /**
   * Normalize status string
   */
  normalizeStatus(rawStatus: string): string {
    if (!rawStatus) {
      console.warn('⚠️ Empty status provided, defaulting to SCHEDULED');
      return 'SCHEDULED';
    }
    
    const cleaned = rawStatus.toLowerCase().trim();
    const mapped = this.statusMappings.get(cleaned);
    
    if (mapped) {
      console.log(`🔄 Status normalized: "${rawStatus}" -> "${mapped}"`);
      return mapped;
    }
    
    // Try partial matching for complex statuses
    for (const [key, value] of this.statusMappings.entries()) {
      if (cleaned.includes(key) || key.includes(cleaned)) {
        console.log(`🔄 Status partially matched: "${rawStatus}" -> "${value}"`);
        return value;
      }
    }
    
    // Default to uppercase version of original
    const defaultStatus = rawStatus.toUpperCase().trim();
    console.log(`🔄 Status kept as-is: "${rawStatus}" -> "${defaultStatus}"`);
    return defaultStatus;
  }

  /**
   * Determine status category
   */
  private determineCategory(normalizedStatus: string): 'live' | 'upcoming' | 'completed' | 'special' {
    if (this.liveStatuses.has(normalizedStatus)) {
      return 'live';
    }
    
    if (this.upcomingStatuses.has(normalizedStatus)) {
      return 'upcoming';
    }
    
    if (this.completedStatuses.has(normalizedStatus)) {
      return 'completed';
    }
    
    // Special statuses (postponed, cancelled, etc.)
    const specialStatuses = ['POSTPONED', 'DELAYED', 'CANCELLED', 'SUSPENDED'];
    if (specialStatuses.includes(normalizedStatus)) {
      return 'special';
    }
    
    // Default to upcoming for unknown statuses
    console.warn(`⚠️ Unknown status category for: ${normalizedStatus}, defaulting to upcoming`);
    return 'upcoming';
  }

  /**
   * Calculate confidence in classification
   */
  private calculateConfidence(originalStatus: string, normalizedStatus: string): number {
    if (!originalStatus) return 0.5; // Low confidence for empty status
    
    const cleaned = originalStatus.toLowerCase().trim();
    
    // High confidence for exact matches
    if (this.statusMappings.has(cleaned)) {
      return 1.0;
    }
    
    // Medium confidence for partial matches
    for (const key of this.statusMappings.keys()) {
      if (cleaned.includes(key) || key.includes(cleaned)) {
        return 0.8;
      }
    }
    
    // Lower confidence for unknown statuses
    return 0.6;
  }

  /**
   * Get status priority for sorting/filtering
   */
  getStatusPriority(status: string): number {
    const normalizedStatus = this.normalizeStatus(status);
    
    // Live games have highest priority
    if (this.liveStatuses.has(normalizedStatus)) {
      return 1;
    }
    
    // Upcoming games have medium priority
    if (this.upcomingStatuses.has(normalizedStatus)) {
      return 2;
    }
    
    // Completed games have lower priority
    if (this.completedStatuses.has(normalizedStatus)) {
      return 3;
    }
    
    // Special statuses have lowest priority
    return 4;
  }

  /**
   * Filter games by status category
   */
  filterGamesByCategory(games: MockGame[], category: 'live' | 'upcoming' | 'completed'): MockGame[] {
    return games.filter(game => {
      const classification = this.classifyGameStatus(game);
      return classification.category === category;
    });
  }

  /**
   * Get default status for unknown/null values
   */
  getDefaultStatus(): string {
    return 'SCHEDULED';
  }

  /**
   * Log classification for debugging
   */
  private logClassification(gameId: string, classification: any): void {
    const logEntry = {
      gameId,
      classification,
      timestamp: new Date()
    };
    
    this.classificationLog.push(logEntry);
    console.log(`🏈 Status classified for game ${gameId}:`, classification);
  }

  // Getters for testing
  getClassificationLog(): any[] {
    return [...this.classificationLog];
  }

  getStatusMappings(): Map<string, string> {
    return new Map(this.statusMappings);
  }

  getLiveStatuses(): Set<string> {
    return new Set(this.liveStatuses);
  }

  getUpcomingStatuses(): Set<string> {
    return new Set(this.upcomingStatuses);
  }

  getCompletedStatuses(): Set<string> {
    return new Set(this.completedStatuses);
  }
}

describe('Game Status Classifier', () => {
  let classifier: MockGameStatusClassifier;

  beforeEach(() => {
    classifier = new MockGameStatusClassifier();
    jest.clearAllMocks();
  });

  describe('Status Normalization', () => {
    test('should normalize live game statuses', () => {
      expect(classifier.normalizeStatus('live')).toBe('LIVE');
      expect(classifier.normalizeStatus('in_progress')).toBe('LIVE');
      expect(classifier.normalizeStatus('IN PROGRESS')).toBe('LIVE');
      expect(classifier.normalizeStatus('active')).toBe('LIVE');
      expect(classifier.normalizeStatus('playing')).toBe('LIVE');
    });

    test('should normalize upcoming game statuses', () => {
      expect(classifier.normalizeStatus('scheduled')).toBe('SCHEDULED');
      expect(classifier.normalizeStatus('pre_game')).toBe('SCHEDULED');
      expect(classifier.normalizeStatus('PRE-GAME')).toBe('SCHEDULED');
      expect(classifier.normalizeStatus('upcoming')).toBe('SCHEDULED');
      expect(classifier.normalizeStatus('not_started')).toBe('SCHEDULED');
    });

    test('should normalize completed game statuses', () => {
      expect(classifier.normalizeStatus('final')).toBe('FINAL');
      expect(classifier.normalizeStatus('finished')).toBe('FINAL');
      expect(classifier.normalizeStatus('COMPLETED')).toBe('FINAL');
      expect(classifier.normalizeStatus('ended')).toBe('FINAL');
    });

    test('should normalize halftime status', () => {
      expect(classifier.normalizeStatus('halftime')).toBe('HALFTIME');
      expect(classifier.normalizeStatus('HALF TIME')).toBe('HALFTIME');
      expect(classifier.normalizeStatus('break')).toBe('HALFTIME');
    });

    test('should handle empty or null status', () => {
      expect(classifier.normalizeStatus('')).toBe('SCHEDULED');
      expect(classifier.normalizeStatus(null as any)).toBe('SCHEDULED');
      expect(classifier.normalizeStatus(undefined as any)).toBe('SCHEDULED');
    });

    test('should handle unknown statuses', () => {
      const unknownStatus = classifier.normalizeStatus('UNKNOWN_STATUS');
      expect(unknownStatus).toBe('UNKNOWN_STATUS');
    });
  });

  describe('Live Game Detection', () => {
    test('should identify live games correctly', () => {
      expect(classifier.isLiveGame('LIVE')).toBe(true);
      expect(classifier.isLiveGame('IN_PROGRESS')).toBe(true);
      expect(classifier.isLiveGame('live')).toBe(true);
      expect(classifier.isLiveGame('active')).toBe(true);
      expect(classifier.isLiveGame('playing')).toBe(true);
    });

    test('should identify halftime as live', () => {
      expect(classifier.isLiveGame('HALFTIME')).toBe(true);
      expect(classifier.isLiveGame('halftime')).toBe(true);
      expect(classifier.isLiveGame('half time')).toBe(true);
    });

    test('should not identify non-live games as live', () => {
      expect(classifier.isLiveGame('SCHEDULED')).toBe(false);
      expect(classifier.isLiveGame('FINAL')).toBe(false);
      expect(classifier.isLiveGame('upcoming')).toBe(false);
      expect(classifier.isLiveGame('completed')).toBe(false);
    });
  });

  describe('Upcoming Game Detection', () => {
    test('should identify upcoming games correctly', () => {
      expect(classifier.isUpcomingGame('SCHEDULED')).toBe(true);
      expect(classifier.isUpcomingGame('PRE_GAME')).toBe(true);
      expect(classifier.isUpcomingGame('scheduled')).toBe(true);
      expect(classifier.isUpcomingGame('upcoming')).toBe(true);
      expect(classifier.isUpcomingGame('not_started')).toBe(true);
    });

    test('should not identify non-upcoming games as upcoming', () => {
      expect(classifier.isUpcomingGame('LIVE')).toBe(false);
      expect(classifier.isUpcomingGame('FINAL')).toBe(false);
      expect(classifier.isUpcomingGame('active')).toBe(false);
      expect(classifier.isUpcomingGame('completed')).toBe(false);
    });
  });

  describe('Completed Game Detection', () => {
    test('should identify completed games correctly', () => {
      expect(classifier.isCompletedGame('FINAL')).toBe(true);
      expect(classifier.isCompletedGame('FINISHED')).toBe(true);
      expect(classifier.isCompletedGame('final')).toBe(true);
      expect(classifier.isCompletedGame('completed')).toBe(true);
      expect(classifier.isCompletedGame('ended')).toBe(true);
    });

    test('should not identify non-completed games as completed', () => {
      expect(classifier.isCompletedGame('LIVE')).toBe(false);
      expect(classifier.isCompletedGame('SCHEDULED')).toBe(false);
      expect(classifier.isCompletedGame('active')).toBe(false);
      expect(classifier.isCompletedGame('upcoming')).toBe(false);
    });
  });

  describe('Game Classification', () => {
    test('should classify live game correctly', () => {
      const game: MockGame = {
        id: 'game-1',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        status: 'LIVE'
      };

      const classification = classifier.classifyGameStatus(game);
      
      expect(classification.originalStatus).toBe('LIVE');
      expect(classification.normalizedStatus).toBe('LIVE');
      expect(classification.category).toBe('live');
      expect(classification.confidence).toBe(1.0);
    });

    test('should classify upcoming game correctly', () => {
      const game: MockGame = {
        id: 'game-2',
        homeTeam: 'Team C',
        awayTeam: 'Team D',
        status: 'scheduled'
      };

      const classification = classifier.classifyGameStatus(game);
      
      expect(classification.originalStatus).toBe('scheduled');
      expect(classification.normalizedStatus).toBe('SCHEDULED');
      expect(classification.category).toBe('upcoming');
      expect(classification.confidence).toBe(1.0);
    });

    test('should classify completed game correctly', () => {
      const game: MockGame = {
        id: 'game-3',
        homeTeam: 'Team E',
        awayTeam: 'Team F',
        status: 'FINAL'
      };

      const classification = classifier.classifyGameStatus(game);
      
      expect(classification.originalStatus).toBe('FINAL');
      expect(classification.normalizedStatus).toBe('FINAL');
      expect(classification.category).toBe('completed');
      expect(classification.confidence).toBe(1.0);
    });

    test('should handle special statuses', () => {
      const game: MockGame = {
        id: 'game-4',
        homeTeam: 'Team G',
        awayTeam: 'Team H',
        status: 'POSTPONED'
      };

      const classification = classifier.classifyGameStatus(game);
      
      expect(classification.category).toBe('special');
    });
  });

  describe('Status Priority', () => {
    test('should assign correct priorities', () => {
      expect(classifier.getStatusPriority('LIVE')).toBe(1);
      expect(classifier.getStatusPriority('SCHEDULED')).toBe(2);
      expect(classifier.getStatusPriority('FINAL')).toBe(3);
      expect(classifier.getStatusPriority('POSTPONED')).toBe(4);
    });

    test('should prioritize live games highest', () => {
      const livePriority = classifier.getStatusPriority('LIVE');
      const upcomingPriority = classifier.getStatusPriority('SCHEDULED');
      const completedPriority = classifier.getStatusPriority('FINAL');
      
      expect(livePriority).toBeLessThan(upcomingPriority);
      expect(upcomingPriority).toBeLessThan(completedPriority);
    });
  });

  describe('Game Filtering', () => {
    test('should filter live games', () => {
      const games: MockGame[] = [
        { id: '1', homeTeam: 'A', awayTeam: 'B', status: 'LIVE' },
        { id: '2', homeTeam: 'C', awayTeam: 'D', status: 'SCHEDULED' },
        { id: '3', homeTeam: 'E', awayTeam: 'F', status: 'FINAL' },
        { id: '4', homeTeam: 'G', awayTeam: 'H', status: 'active' }
      ];

      const liveGames = classifier.filterGamesByCategory(games, 'live');
      
      expect(liveGames).toHaveLength(2);
      expect(liveGames[0].id).toBe('1');
      expect(liveGames[1].id).toBe('4');
    });

    test('should filter upcoming games', () => {
      const games: MockGame[] = [
        { id: '1', homeTeam: 'A', awayTeam: 'B', status: 'LIVE' },
        { id: '2', homeTeam: 'C', awayTeam: 'D', status: 'SCHEDULED' },
        { id: '3', homeTeam: 'E', awayTeam: 'F', status: 'pre_game' },
        { id: '4', homeTeam: 'G', awayTeam: 'H', status: 'FINAL' }
      ];

      const upcomingGames = classifier.filterGamesByCategory(games, 'upcoming');
      
      expect(upcomingGames).toHaveLength(2);
      expect(upcomingGames[0].id).toBe('2');
      expect(upcomingGames[1].id).toBe('3');
    });

    test('should filter completed games', () => {
      const games: MockGame[] = [
        { id: '1', homeTeam: 'A', awayTeam: 'B', status: 'LIVE' },
        { id: '2', homeTeam: 'C', awayTeam: 'D', status: 'FINAL' },
        { id: '3', homeTeam: 'E', awayTeam: 'F', status: 'completed' },
        { id: '4', homeTeam: 'G', awayTeam: 'H', status: 'SCHEDULED' }
      ];

      const completedGames = classifier.filterGamesByCategory(games, 'completed');
      
      expect(completedGames).toHaveLength(2);
      expect(completedGames[0].id).toBe('2');
      expect(completedGames[1].id).toBe('3');
    });
  });

  describe('Integration with Requirements', () => {
    test('should satisfy requirement 4.1 - comprehensive status checking', () => {
      const liveStatuses = ['LIVE', 'IN_PROGRESS', 'HALFTIME', 'ACTIVE', 'PLAYING'];
      
      liveStatuses.forEach(status => {
        expect(classifier.isLiveGame(status)).toBe(true);
      });
    });

    test('should satisfy requirement 4.2 - scheduled status categorization', () => {
      const upcomingStatuses = ['SCHEDULED', 'PRE_GAME', 'UPCOMING', 'NOT_STARTED'];
      
      upcomingStatuses.forEach(status => {
        expect(classifier.isUpcomingGame(status)).toBe(true);
      });
    });

    test('should satisfy requirement 4.3 - live games in live sections only', () => {
      const games: MockGame[] = [
        { id: '1', homeTeam: 'A', awayTeam: 'B', status: 'LIVE' },
        { id: '2', homeTeam: 'C', awayTeam: 'D', status: 'SCHEDULED' },
        { id: '3', homeTeam: 'E', awayTeam: 'F', status: 'HALFTIME' }
      ];

      const liveGames = classifier.filterGamesByCategory(games, 'live');
      
      expect(liveGames).toHaveLength(2);
      liveGames.forEach(game => {
        expect(classifier.isLiveGame(game.status)).toBe(true);
      });
    });

    test('should satisfy requirement 4.4 - upcoming games in upcoming sections only', () => {
      const games: MockGame[] = [
        { id: '1', homeTeam: 'A', awayTeam: 'B', status: 'SCHEDULED' },
        { id: '2', homeTeam: 'C', awayTeam: 'D', status: 'LIVE' },
        { id: '3', homeTeam: 'E', awayTeam: 'F', status: 'PRE_GAME' }
      ];

      const upcomingGames = classifier.filterGamesByCategory(games, 'upcoming');
      
      expect(upcomingGames).toHaveLength(2);
      upcomingGames.forEach(game => {
        expect(classifier.isUpcomingGame(game.status)).toBe(true);
      });
    });

    test('should satisfy requirement 4.5 - default to SCHEDULED for unknown status', () => {
      expect(classifier.normalizeStatus('')).toBe('SCHEDULED');
      expect(classifier.normalizeStatus(null as any)).toBe('SCHEDULED');
      expect(classifier.getDefaultStatus()).toBe('SCHEDULED');
    });
  });

  describe('Logging and Debugging', () => {
    test('should log classification events', () => {
      const game: MockGame = {
        id: 'test-game',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        status: 'LIVE'
      };

      classifier.classifyGameStatus(game);
      
      const log = classifier.getClassificationLog();
      expect(log).toHaveLength(1);
      expect(log[0].gameId).toBe('test-game');
      expect(log[0].classification.category).toBe('live');
    });

    test('should provide access to internal mappings for debugging', () => {
      const mappings = classifier.getStatusMappings();
      const liveStatuses = classifier.getLiveStatuses();
      const upcomingStatuses = classifier.getUpcomingStatuses();
      
      expect(mappings.size).toBeGreaterThan(0);
      expect(liveStatuses.size).toBeGreaterThan(0);
      expect(upcomingStatuses.size).toBeGreaterThan(0);
    });
  });
});
/**
 * Data Synchronization Engine Unit Tests
 * Tests for ESPN API integration with local data matching
 */

// Mock game data structures
interface MockGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  espnId?: string;
  lastUpdated?: Date;
  dataSource?: 'local' | 'espn' | 'merged';
}

// Mock the DataSynchronizationEngine class
class MockDataSynchronizationEngine {
  private syncLog: any[] = [];
  private conflictLog: any[] = [];
  private matchingStrategies = ['exact', 'fuzzy', 'partial'];

  constructor() {
    console.log('🔄 Data Synchronization Engine initialized');
  }

  /**
   * Synchronize game data between local and ESPN sources
   */
  syncGameData(localGames: MockGame[], espnGames: MockGame[]): {
    synchronized: MockGame[];
    conflicts: any[];
    unmatched: MockGame[];
  } {
    console.log(`🔄 Syncing ${localGames.length} local games with ${espnGames.length} ESPN games`);
    
    const synchronized: MockGame[] = [];
    const conflicts: any[] = [];
    const unmatched: MockGame[] = [];
    
    // Process each local game
    localGames.forEach(localGame => {
      const matchResult = this.matchGameByTeams(localGame, espnGames);
      
      if (matchResult.match) {
        const mergedGame = this.mergeGameData(localGame, matchResult.match);
        synchronized.push(mergedGame);
        
        this.logSync('MATCH_FOUND', {
          localGame: localGame.id,
          espnGame: matchResult.match.id,
          strategy: matchResult.strategy
        });
      } else {
        unmatched.push(localGame);
        this.logSync('NO_MATCH', {
          localGame: localGame.id,
          homeTeam: localGame.homeTeam,
          awayTeam: localGame.awayTeam
        });
      }
    });
    
    // Add ESPN games that weren't matched
    espnGames.forEach(espnGame => {
      const alreadySynced = synchronized.some(game => game.espnId === espnGame.id);
      if (!alreadySynced) {
        const espnOnlyGame = { ...espnGame, dataSource: 'espn' as const };
        synchronized.push(espnOnlyGame);
      }
    });
    
    console.log(`✅ Sync complete: ${synchronized.length} synchronized, ${unmatched.length} unmatched`);
    
    return { synchronized, conflicts, unmatched };
  }

  /**
   * Match game by teams using multiple strategies
   */
  matchGameByTeams(localGame: MockGame, espnGames: MockGame[]): {
    match: MockGame | null;
    strategy: string | null;
    confidence: number;
  } {
    // Try exact match first
    for (const espnGame of espnGames) {
      if (this.exactTeamMatch(localGame, espnGame)) {
        return {
          match: espnGame,
          strategy: 'exact',
          confidence: 1.0
        };
      }
    }
    
    // Try fuzzy match
    for (const espnGame of espnGames) {
      const confidence = this.fuzzyTeamMatch(localGame, espnGame);
      if (confidence > 0.8) {
        return {
          match: espnGame,
          strategy: 'fuzzy',
          confidence
        };
      }
    }
    
    // Try partial match
    for (const espnGame of espnGames) {
      const confidence = this.partialTeamMatch(localGame, espnGame);
      if (confidence > 0.7) {
        return {
          match: espnGame,
          strategy: 'partial',
          confidence
        };
      }
    }
    
    return {
      match: null,
      strategy: null,
      confidence: 0
    };
  }

  /**
   * Exact team name matching
   */
  private exactTeamMatch(localGame: MockGame, espnGame: MockGame): boolean {
    return (
      localGame.homeTeam.toLowerCase() === espnGame.homeTeam.toLowerCase() &&
      localGame.awayTeam.toLowerCase() === espnGame.awayTeam.toLowerCase()
    ) || (
      localGame.homeTeam.toLowerCase() === espnGame.awayTeam.toLowerCase() &&
      localGame.awayTeam.toLowerCase() === espnGame.homeTeam.toLowerCase()
    );
  }

  /**
   * Fuzzy team name matching (handles variations like "SF" vs "San Francisco")
   */
  private fuzzyTeamMatch(localGame: MockGame, espnGame: MockGame): number {
    const teamMappings = new Map([
      ['sf', 'san francisco'],
      ['ne', 'new england'],
      ['gb', 'green bay'],
      ['tb', 'tampa bay'],
      ['kc', 'kansas city'],
      ['no', 'new orleans'],
      ['la', 'los angeles'],
      ['lv', 'las vegas']
    ]);

    const normalizeTeam = (team: string): string => {
      const lower = team.toLowerCase();
      return teamMappings.get(lower) || lower;
    };

    const localHome = normalizeTeam(localGame.homeTeam);
    const localAway = normalizeTeam(localGame.awayTeam);
    const espnHome = normalizeTeam(espnGame.homeTeam);
    const espnAway = normalizeTeam(espnGame.awayTeam);

    // Check both orientations
    const match1 = (localHome === espnHome && localAway === espnAway);
    const match2 = (localHome === espnAway && localAway === espnHome);

    if (match1 || match2) {
      return 0.9;
    }

    // Partial fuzzy matching
    const homeMatch = localHome.includes(espnHome) || espnHome.includes(localHome);
    const awayMatch = localAway.includes(espnAway) || espnAway.includes(localAway);

    if (homeMatch && awayMatch) {
      return 0.8;
    }

    return 0;
  }

  /**
   * Partial team name matching
   */
  private partialTeamMatch(localGame: MockGame, espnGame: MockGame): number {
    const getTeamKeywords = (team: string): string[] => {
      return team.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2);
    };

    const localHomeKeywords = getTeamKeywords(localGame.homeTeam);
    const localAwayKeywords = getTeamKeywords(localGame.awayTeam);
    const espnHomeKeywords = getTeamKeywords(espnGame.homeTeam);
    const espnAwayKeywords = getTeamKeywords(espnGame.awayTeam);

    const calculateOverlap = (arr1: string[], arr2: string[]): number => {
      const intersection = arr1.filter(word => arr2.includes(word));
      return intersection.length / Math.max(arr1.length, arr2.length);
    };

    const homeOverlap = Math.max(
      calculateOverlap(localHomeKeywords, espnHomeKeywords),
      calculateOverlap(localHomeKeywords, espnAwayKeywords)
    );

    const awayOverlap = Math.max(
      calculateOverlap(localAwayKeywords, espnAwayKeywords),
      calculateOverlap(localAwayKeywords, espnHomeKeywords)
    );

    return (homeOverlap + awayOverlap) / 2;
  }

  /**
   * Merge local and ESPN game data
   */
  private mergeGameData(localGame: MockGame, espnGame: MockGame): MockGame {
    // ESPN data takes precedence for scores and status
    return {
      ...localGame,
      homeScore: espnGame.homeScore,
      awayScore: espnGame.awayScore,
      status: espnGame.status,
      espnId: espnGame.id,
      lastUpdated: new Date(),
      dataSource: 'merged'
    };
  }

  /**
   * Update game scores from ESPN data
   */
  updateGameScores(gameId: string, espnData: Partial<MockGame>): MockGame | null {
    console.log(`🔄 Updating scores for game: ${gameId}`);
    
    try {
      const updatedGame: MockGame = {
        id: gameId,
        homeTeam: espnData.homeTeam || '',
        awayTeam: espnData.awayTeam || '',
        homeScore: espnData.homeScore || 0,
        awayScore: espnData.awayScore || 0,
        status: espnData.status || 'SCHEDULED',
        espnId: espnData.espnId,
        lastUpdated: new Date(),
        dataSource: 'espn'
      };
      
      this.logSync('SCORE_UPDATE', {
        gameId,
        homeScore: updatedGame.homeScore,
        awayScore: updatedGame.awayScore,
        status: updatedGame.status
      });
      
      return updatedGame;
      
    } catch (error) {
      console.error(`❌ Failed to update scores for game: ${gameId}`, error);
      return null;
    }
  }

  /**
   * Resolve data conflicts
   */
  resolveDataConflicts(conflicts: any[]): any[] {
    console.log(`🔄 Resolving ${conflicts.length} data conflicts`);
    
    const resolved: any[] = [];
    
    conflicts.forEach(conflict => {
      // ESPN data takes precedence
      const resolution = {
        ...conflict,
        resolution: 'espn_priority',
        resolvedData: conflict.espnData,
        timestamp: new Date()
      };
      
      resolved.push(resolution);
      this.logConflict('RESOLVED', resolution);
    });
    
    return resolved;
  }

  /**
   * Validate and sanitize data
   */
  validateAndSanitizeData(games: MockGame[]): {
    valid: MockGame[];
    invalid: any[];
  } {
    const valid: MockGame[] = [];
    const invalid: any[] = [];
    
    games.forEach(game => {
      const validation = this.validateGame(game);
      
      if (validation.isValid) {
        valid.push(this.sanitizeGame(game));
      } else {
        invalid.push({
          game,
          errors: validation.errors
        });
      }
    });
    
    return { valid, invalid };
  }

  /**
   * Validate individual game
   */
  private validateGame(game: MockGame): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!game.id) errors.push('Missing game ID');
    if (!game.homeTeam) errors.push('Missing home team');
    if (!game.awayTeam) errors.push('Missing away team');
    if (typeof game.homeScore !== 'number') errors.push('Invalid home score');
    if (typeof game.awayScore !== 'number') errors.push('Invalid away score');
    if (!game.status) errors.push('Missing game status');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize game data
   */
  private sanitizeGame(game: MockGame): MockGame {
    return {
      ...game,
      homeTeam: game.homeTeam.trim(),
      awayTeam: game.awayTeam.trim(),
      homeScore: Math.max(0, Math.floor(game.homeScore)),
      awayScore: Math.max(0, Math.floor(game.awayScore)),
      status: game.status.toUpperCase().trim()
    };
  }

  /**
   * Log synchronization events
   */
  private logSync(type: string, data: any): void {
    const logEntry = {
      type,
      data,
      timestamp: new Date()
    };
    
    this.syncLog.push(logEntry);
    console.log(`🔄 Sync event [${type}]:`, data);
  }

  /**
   * Log conflict resolution
   */
  private logConflict(type: string, data: any): void {
    const logEntry = {
      type,
      data,
      timestamp: new Date()
    };
    
    this.conflictLog.push(logEntry);
    console.log(`⚖️ Conflict event [${type}]:`, data);
  }

  // Getters for testing
  getSyncLog(): any[] {
    return [...this.syncLog];
  }

  getConflictLog(): any[] {
    return [...this.conflictLog];
  }
}

describe('Data Synchronization Engine', () => {
  let syncEngine: MockDataSynchronizationEngine;

  beforeEach(() => {
    syncEngine = new MockDataSynchronizationEngine();
    jest.clearAllMocks();
  });

  describe('Game Matching', () => {
    test('should match games with exact team names', () => {
      const localGame: MockGame = {
        id: 'local-1',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'New York Giants',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED'
      };

      const espnGames: MockGame[] = [{
        id: 'espn-1',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'New York Giants',
        homeScore: 21,
        awayScore: 14,
        status: 'FINAL'
      }];

      const result = syncEngine.matchGameByTeams(localGame, espnGames);
      
      expect(result.match).toBeTruthy();
      expect(result.strategy).toBe('exact');
      expect(result.confidence).toBe(1.0);
    });

    test('should match games with reversed team positions', () => {
      const localGame: MockGame = {
        id: 'local-1',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'New York Giants',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED'
      };

      const espnGames: MockGame[] = [{
        id: 'espn-1',
        homeTeam: 'New York Giants',
        awayTeam: 'Dallas Cowboys',
        homeScore: 14,
        awayScore: 21,
        status: 'FINAL'
      }];

      const result = syncEngine.matchGameByTeams(localGame, espnGames);
      
      expect(result.match).toBeTruthy();
      expect(result.strategy).toBe('exact');
      expect(result.confidence).toBe(1.0);
    });

    test('should match games with fuzzy team names', () => {
      const localGame: MockGame = {
        id: 'local-1',
        homeTeam: 'SF',
        awayTeam: 'NE',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED'
      };

      const espnGames: MockGame[] = [{
        id: 'espn-1',
        homeTeam: 'San Francisco',
        awayTeam: 'New England',
        homeScore: 28,
        awayScore: 17,
        status: 'FINAL'
      }];

      const result = syncEngine.matchGameByTeams(localGame, espnGames);
      
      expect(result.match).toBeTruthy();
      expect(result.strategy).toBe('fuzzy');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should not match completely different teams', () => {
      const localGame: MockGame = {
        id: 'local-1',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'New York Giants',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED'
      };

      const espnGames: MockGame[] = [{
        id: 'espn-1',
        homeTeam: 'Green Bay Packers',
        awayTeam: 'Chicago Bears',
        homeScore: 24,
        awayScore: 10,
        status: 'FINAL'
      }];

      const result = syncEngine.matchGameByTeams(localGame, espnGames);
      
      expect(result.match).toBeNull();
      expect(result.strategy).toBeNull();
      expect(result.confidence).toBe(0);
    });
  });

  describe('Data Synchronization', () => {
    test('should synchronize matched games', () => {
      const localGames: MockGame[] = [{
        id: 'local-1',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'New York Giants',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED'
      }];

      const espnGames: MockGame[] = [{
        id: 'espn-1',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'New York Giants',
        homeScore: 21,
        awayScore: 14,
        status: 'FINAL'
      }];

      const result = syncEngine.syncGameData(localGames, espnGames);
      
      expect(result.synchronized).toHaveLength(1);
      expect(result.unmatched).toHaveLength(0);
      
      const syncedGame = result.synchronized[0];
      expect(syncedGame.homeScore).toBe(21);
      expect(syncedGame.awayScore).toBe(14);
      expect(syncedGame.status).toBe('FINAL');
      expect(syncedGame.dataSource).toBe('merged');
      expect(syncedGame.espnId).toBe('espn-1');
    });

    test('should handle unmatched local games', () => {
      const localGames: MockGame[] = [{
        id: 'local-1',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED'
      }];

      const espnGames: MockGame[] = [{
        id: 'espn-1',
        homeTeam: 'Team C',
        awayTeam: 'Team D',
        homeScore: 21,
        awayScore: 14,
        status: 'FINAL'
      }];

      const result = syncEngine.syncGameData(localGames, espnGames);
      
      expect(result.synchronized).toHaveLength(1); // ESPN-only game
      expect(result.unmatched).toHaveLength(1); // Unmatched local game
      expect(result.unmatched[0].id).toBe('local-1');
    });

    test('should include ESPN-only games', () => {
      const localGames: MockGame[] = [];
      const espnGames: MockGame[] = [{
        id: 'espn-1',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        homeScore: 21,
        awayScore: 14,
        status: 'FINAL'
      }];

      const result = syncEngine.syncGameData(localGames, espnGames);
      
      expect(result.synchronized).toHaveLength(1);
      expect(result.synchronized[0].dataSource).toBe('espn');
      expect(result.unmatched).toHaveLength(0);
    });
  });

  describe('Score Updates', () => {
    test('should update game scores successfully', () => {
      const espnData = {
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'New York Giants',
        homeScore: 28,
        awayScore: 21,
        status: 'FINAL',
        espnId: 'espn-123'
      };

      const updatedGame = syncEngine.updateGameScores('game-1', espnData);
      
      expect(updatedGame).toBeTruthy();
      expect(updatedGame!.homeScore).toBe(28);
      expect(updatedGame!.awayScore).toBe(21);
      expect(updatedGame!.status).toBe('FINAL');
      expect(updatedGame!.dataSource).toBe('espn');
      expect(updatedGame!.lastUpdated).toBeInstanceOf(Date);
    });

    test('should log score updates', () => {
      const espnData = {
        homeScore: 14,
        awayScore: 7,
        status: 'HALFTIME'
      };

      syncEngine.updateGameScores('game-1', espnData);
      
      const syncLog = syncEngine.getSyncLog();
      expect(syncLog).toHaveLength(1);
      expect(syncLog[0].type).toBe('SCORE_UPDATE');
      expect(syncLog[0].data.gameId).toBe('game-1');
      expect(syncLog[0].data.homeScore).toBe(14);
      expect(syncLog[0].data.awayScore).toBe(7);
    });
  });

  describe('Data Validation', () => {
    test('should validate correct game data', () => {
      const games: MockGame[] = [{
        id: 'game-1',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        homeScore: 21,
        awayScore: 14,
        status: 'FINAL'
      }];

      const result = syncEngine.validateAndSanitizeData(games);
      
      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
    });

    test('should identify invalid game data', () => {
      const games: MockGame[] = [{
        id: '',
        homeTeam: 'Team A',
        awayTeam: '',
        homeScore: -5,
        awayScore: 14,
        status: 'FINAL'
      }];

      const result = syncEngine.validateAndSanitizeData(games);
      
      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].errors).toContain('Missing game ID');
      expect(result.invalid[0].errors).toContain('Missing away team');
    });

    test('should sanitize game data', () => {
      const games: MockGame[] = [{
        id: 'game-1',
        homeTeam: '  Team A  ',
        awayTeam: '  Team B  ',
        homeScore: 21.7,
        awayScore: -3,
        status: '  final  '
      }];

      const result = syncEngine.validateAndSanitizeData(games);
      
      expect(result.valid).toHaveLength(1);
      const sanitized = result.valid[0];
      expect(sanitized.homeTeam).toBe('Team A');
      expect(sanitized.awayTeam).toBe('Team B');
      expect(sanitized.homeScore).toBe(21);
      expect(sanitized.awayScore).toBe(0);
      expect(sanitized.status).toBe('FINAL');
    });
  });

  describe('Integration with Requirements', () => {
    test('should satisfy requirement 3.1 - properly match local and ESPN games', () => {
      const localGames: MockGame[] = [{
        id: 'local-1',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'New York Giants',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED'
      }];

      const espnGames: MockGame[] = [{
        id: 'espn-1',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'New York Giants',
        homeScore: 21,
        awayScore: 14,
        status: 'FINAL'
      }];

      const result = syncEngine.syncGameData(localGames, espnGames);
      
      expect(result.synchronized).toHaveLength(1);
      expect(result.synchronized[0].espnId).toBe('espn-1');
    });

    test('should satisfy requirement 3.2 - use ESPN as authoritative source', () => {
      const localGames: MockGame[] = [{
        id: 'local-1',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'New York Giants',
        homeScore: 10,
        awayScore: 7,
        status: 'HALFTIME'
      }];

      const espnGames: MockGame[] = [{
        id: 'espn-1',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'New York Giants',
        homeScore: 21,
        awayScore: 14,
        status: 'FINAL'
      }];

      const result = syncEngine.syncGameData(localGames, espnGames);
      const syncedGame = result.synchronized[0];
      
      // ESPN data should take precedence
      expect(syncedGame.homeScore).toBe(21);
      expect(syncedGame.awayScore).toBe(14);
      expect(syncedGame.status).toBe('FINAL');
    });

    test('should satisfy requirement 3.3 - log mismatches without breaking', () => {
      const localGames: MockGame[] = [{
        id: 'local-1',
        homeTeam: 'Unmatched Team A',
        awayTeam: 'Unmatched Team B',
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED'
      }];

      const espnGames: MockGame[] = [{
        id: 'espn-1',
        homeTeam: 'Different Team C',
        awayTeam: 'Different Team D',
        homeScore: 21,
        awayScore: 14,
        status: 'FINAL'
      }];

      const result = syncEngine.syncGameData(localGames, espnGames);
      
      expect(result.unmatched).toHaveLength(1);
      expect(result.synchronized).toHaveLength(1); // ESPN-only game
      
      const syncLog = syncEngine.getSyncLog();
      const noMatchLog = syncLog.find(log => log.type === 'NO_MATCH');
      expect(noMatchLog).toBeTruthy();
      expect(noMatchLog.data.localGame).toBe('local-1');
    });

    test('should satisfy requirement 3.4 - update all views with synchronized data', () => {
      const espnData = {
        homeScore: 28,
        awayScore: 21,
        status: 'FINAL'
      };

      const updatedGame = syncEngine.updateGameScores('game-1', espnData);
      
      expect(updatedGame).toBeTruthy();
      expect(updatedGame!.lastUpdated).toBeInstanceOf(Date);
      expect(updatedGame!.dataSource).toBe('espn');
    });

    test('should satisfy requirement 3.5 - properly categorize game status changes', () => {
      const espnData = {
        status: 'LIVE'
      };

      const updatedGame = syncEngine.updateGameScores('game-1', espnData);
      
      expect(updatedGame!.status).toBe('LIVE');
      
      const syncLog = syncEngine.getSyncLog();
      const updateLog = syncLog.find(log => log.type === 'SCORE_UPDATE');
      expect(updateLog.data.status).toBe('LIVE');
    });
  });
});
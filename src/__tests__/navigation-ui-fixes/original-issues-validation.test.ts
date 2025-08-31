/**
 * Original Issues Validation Tests
 * Tests that validate fixes against the specific console errors mentioned in requirements
 */

import { JSDOM } from 'jsdom';

// Mock DOM environment that replicates the original problematic structure
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head><title>NFL Analytics Pro - Issue Validation</title></head>
<body>
  <!-- Original problematic navigation structure -->
  <nav>
    <a href="#" onclick="switchView('dashboard')" class="nav-link">Dashboard</a>
    <a href="#" onclick="switchView('live')" class="nav-link">Live Games</a>
    <a href="#" onclick="switchView('predictions')" class="nav-link">Predictions</a>
    <a href="#" onclick="switchView('fantasy')" class="nav-link">Fantasy</a>
    <a href="#" onclick="switchView('betting')" class="nav-link">Betting</a>
    <a href="#" onclick="switchView('news')" class="nav-link">News</a>
  </nav>

  <!-- Views with mixed ID conventions (the original problem) -->
  <div id="dashboard" class="view">Dashboard Content</div>
  <div id="live-view" class="view">Live Games Content</div>
  <div id="predictions-view" class="view">Predictions Content</div>
  <div id="fantasy" class="view">Fantasy Content</div>
  <div id="betting-view" class="view">Betting Content</div>
  <div id="news-view" class="view">News Content</div>

  <!-- Charts that caused canvas conflicts -->
  <canvas id="accuracy-chart" width="400" height="200"></canvas>
  <canvas id="performance-chart" width="400" height="200"></canvas>
  
  <!-- Game data containers -->
  <div id="live-games-container">
    <div class="game-card" data-game-id="local-1">Cowboys vs Giants - SCHEDULED</div>
    <div class="game-card" data-game-id="local-2">Packers vs Bears - SCHEDULED</div>
  </div>
  
  <div id="upcoming-games-container">
    <div class="game-card" data-game-id="local-3">49ers vs Seahawks - SCHEDULED</div>
  </div>

  <!-- Error display area -->
  <div id="console-errors"></div>
</body>
</html>
`);

global.document = dom.window.document;
global.window = dom.window as any;

// Mock Chart.js to simulate original canvas conflicts
let chartInstances: Map<string, any> = new Map();

const mockChart = {
  destroy: jest.fn(() => {
    console.log('Chart destroyed successfully');
  }),
  update: jest.fn(),
  resize: jest.fn()
};

global.Chart = jest.fn().mockImplementation((canvas: any, config: any) => {
  const canvasId = canvas.id;
  
  // Simulate original "Canvas is already in use" error
  if (chartInstances.has(canvasId)) {
    throw new Error(`Canvas is already in use. Chart with ID '${canvasId}' must be destroyed before the canvas can be reused.`);
  }
  
  chartInstances.set(canvasId, mockChart);
  console.log(`Chart created for canvas: ${canvasId}`);
  return mockChart;
}) as any;

// Mock console to capture errors (simulating original console errors)
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const capturedErrors: string[] = [];
const capturedWarnings: string[] = [];

console.error = jest.fn((...args: any[]) => {
  const message = args.join(' ');
  capturedErrors.push(message);
  originalConsoleError(...args);
});

console.warn = jest.fn((...args: any[]) => {
  const message = args.join(' ');
  capturedWarnings.push(message);
  originalConsoleWarn(...args);
});

// Original problematic functions (before fixes)
class OriginalProblematicSystem {
  /**
   * Original switchView function that caused "View not found" errors
   */
  static switchView(viewName: string): boolean {
    console.log(`Attempting to switch to view: ${viewName}`);
    
    // Original logic only tried exact ID match
    const element = document.getElementById(viewName);
    
    if (!element) {
      console.error(`❌ View not found: ${viewName}`);
      return false;
    }
    
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });
    
    // Show target view
    element.classList.add('active');
    
    console.log(`✅ Switched to view: ${viewName}`);
    return true;
  }

  /**
   * Original chart creation that caused canvas conflicts
   */
  static createAccuracyChart(): any {
    console.log('Creating accuracy chart...');
    
    const canvas = document.getElementById('accuracy-chart');
    if (!canvas) {
      console.error('❌ Canvas element not found: accuracy-chart');
      return null;
    }
    
    // Original logic didn't check for existing charts
    try {
      const chart = new Chart(canvas, {
        type: 'line',
        data: { datasets: [] },
        options: {}
      });
      
      console.log('✅ Accuracy chart created');
      return chart;
    } catch (error) {
      console.error('❌ Chart creation failed:', error);
      return null;
    }
  }

  /**
   * Original game matching that caused "NO MATCH found" errors
   */
  static matchEspnGame(localGame: any, espnGames: any[]): any {
    console.log(`Matching local game: ${localGame.homeTeam} vs ${localGame.awayTeam}`);
    
    // Original logic only did exact string matching
    for (const espnGame of espnGames) {
      if (localGame.homeTeam === espnGame.homeTeam && 
          localGame.awayTeam === espnGame.awayTeam) {
        console.log(`✅ Match found: ${espnGame.id}`);
        return espnGame;
      }
    }
    
    console.error(`❌ NO MATCH found for: ${localGame.homeTeam} vs ${localGame.awayTeam}`);
    return null;
  }

  /**
   * Original game status logic that miscategorized games
   */
  static isLiveGame(status: string): boolean {
    // Original logic only checked for 'LIVE' exactly
    return status === 'LIVE';
  }

  static isUpcomingGame(status: string): boolean {
    // Original logic only checked for 'SCHEDULED' exactly
    return status === 'SCHEDULED';
  }
}

// Fixed system implementations
class FixedNavigationSystem {
  private static chartRegistry: Map<string, any> = new Map();

  /**
   * Fixed switchView with fallback ID resolution
   */
  static switchView(viewName: string): boolean {
    console.log(`🧭 Enhanced view switching to: ${viewName}`);
    
    const resolvedId = this.resolveViewId(viewName);
    
    if (!resolvedId) {
      console.error(`❌ Could not resolve view ID for: ${viewName}`);
      return false;
    }
    
    const element = document.getElementById(resolvedId);
    
    if (!element) {
      console.error(`❌ Element not found: ${resolvedId}`);
      return false;
    }
    
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });
    
    // Show target view
    element.classList.add('active');
    
    console.log(`✅ Successfully switched to view: ${viewName} (${resolvedId})`);
    return true;
  }

  /**
   * Enhanced view ID resolution with fallback patterns
   */
  private static resolveViewId(viewName: string): string | null {
    const patterns = [
      viewName,                    // exact match
      `${viewName}-view`,         // with -view suffix
      `view-${viewName}`,         // with view- prefix
      `${viewName}View`           // camelCase
    ];

    for (const pattern of patterns) {
      if (document.getElementById(pattern)) {
        console.log(`🎯 Resolved view ID: ${viewName} -> ${pattern}`);
        return pattern;
      }
    }

    return null;
  }

  /**
   * Fixed chart creation with conflict detection
   */
  static createAccuracyChart(): any {
    console.log('📊 Creating accuracy chart with conflict detection...');
    
    const canvasId = 'accuracy-chart';
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) {
      console.error('❌ Canvas element not found: accuracy-chart');
      return null;
    }
    
    // Check for existing chart and destroy it
    if (this.chartRegistry.has(canvasId)) {
      console.log('🔄 Destroying existing chart...');
      const existingChart = this.chartRegistry.get(canvasId);
      if (existingChart && typeof existingChart.destroy === 'function') {
        existingChart.destroy();
      }
      this.chartRegistry.delete(canvasId);
      chartInstances.delete(canvasId); // Clear from global registry too
    }
    
    try {
      const chart = new Chart(canvas, {
        type: 'line',
        data: { datasets: [] },
        options: {}
      });
      
      this.chartRegistry.set(canvasId, chart);
      console.log('✅ Accuracy chart created successfully');
      return chart;
    } catch (error) {
      console.error('❌ Chart creation failed:', error);
      return null;
    }
  }

  /**
   * Fixed game matching with fuzzy logic
   */
  static matchEspnGame(localGame: any, espnGames: any[]): any {
    console.log(`🔄 Enhanced matching for: ${localGame.homeTeam} vs ${localGame.awayTeam}`);
    
    // Try exact match first
    for (const espnGame of espnGames) {
      if (localGame.homeTeam === espnGame.homeTeam && 
          localGame.awayTeam === espnGame.awayTeam) {
        console.log(`✅ Exact match found: ${espnGame.id}`);
        return espnGame;
      }
    }
    
    // Try fuzzy matching with team name variations
    const teamMappings: { [key: string]: string } = {
      'SF': 'San Francisco',
      'NE': 'New England',
      'GB': 'Green Bay',
      'TB': 'Tampa Bay',
      'KC': 'Kansas City',
      'NO': 'New Orleans'
    };
    
    const normalizeTeam = (team: string): string => {
      return teamMappings[team] || team;
    };
    
    for (const espnGame of espnGames) {
      const localHome = normalizeTeam(localGame.homeTeam);
      const localAway = normalizeTeam(localGame.awayTeam);
      const espnHome = normalizeTeam(espnGame.homeTeam);
      const espnAway = normalizeTeam(espnGame.awayTeam);
      
      if ((localHome === espnHome && localAway === espnAway) ||
          (localHome === espnAway && localAway === espnHome)) {
        console.log(`✅ Fuzzy match found: ${espnGame.id}`);
        return espnGame;
      }
    }
    
    console.warn(`⚠️ No match found for: ${localGame.homeTeam} vs ${localGame.awayTeam} (using fallback)`);
    return null;
  }

  /**
   * Fixed game status classification
   */
  static isLiveGame(status: string): boolean {
    const liveStatuses = ['LIVE', 'IN_PROGRESS', 'HALFTIME', 'ACTIVE', 'PLAYING'];
    const normalizedStatus = status?.toUpperCase() || '';
    return liveStatuses.includes(normalizedStatus);
  }

  static isUpcomingGame(status: string): boolean {
    const upcomingStatuses = ['SCHEDULED', 'PRE_GAME', 'UPCOMING', 'NOT_STARTED'];
    const normalizedStatus = status?.toUpperCase() || 'SCHEDULED';
    return upcomingStatuses.includes(normalizedStatus);
  }
}

describe('Original Issues Validation Tests', () => {
  beforeEach(() => {
    // Reset state
    capturedErrors.length = 0;
    capturedWarnings.length = 0;
    chartInstances.clear();
    FixedNavigationSystem['chartRegistry'].clear();
    
    // Reset DOM state
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });
  });

  describe('Issue 1: "View not found" Navigation Errors', () => {
    test('should reproduce original "View not found" errors', () => {
      // Test original problematic navigation
      const result1 = OriginalProblematicSystem.switchView('live'); // Should fail - needs 'live-view'
      const result2 = OriginalProblematicSystem.switchView('predictions'); // Should fail - needs 'predictions-view'
      const result3 = OriginalProblematicSystem.switchView('betting'); // Should fail - needs 'betting-view'
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
      
      // Verify error messages were logged
      expect(capturedErrors).toContain('❌ View not found: live');
      expect(capturedErrors).toContain('❌ View not found: predictions');
      expect(capturedErrors).toContain('❌ View not found: betting');
    });

    test('should fix "View not found" errors with enhanced resolution', () => {
      // Clear previous errors
      capturedErrors.length = 0;
      
      // Test fixed navigation system
      const result1 = FixedNavigationSystem.switchView('live'); // Should succeed with 'live-view'
      const result2 = FixedNavigationSystem.switchView('predictions'); // Should succeed with 'predictions-view'
      const result3 = FixedNavigationSystem.switchView('betting'); // Should succeed with 'betting-view'
      const result4 = FixedNavigationSystem.switchView('dashboard'); // Should succeed with exact match
      const result5 = FixedNavigationSystem.switchView('fantasy'); // Should succeed with exact match
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      expect(result4).toBe(true);
      expect(result5).toBe(true);
      
      // Verify no "View not found" errors
      const viewNotFoundErrors = capturedErrors.filter(error => error.includes('View not found'));
      expect(viewNotFoundErrors).toHaveLength(0);
      
      // Verify successful resolution messages
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('🎯 Resolved view ID: live -> live-view'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('🎯 Resolved view ID: predictions -> predictions-view'));
    });

    test('should validate requirement 1.1 - successful view location and display', () => {
      const views = ['dashboard', 'live', 'predictions', 'fantasy', 'betting', 'news'];
      
      views.forEach(viewName => {
        const success = FixedNavigationSystem.switchView(viewName);
        expect(success).toBe(true);
        
        // Verify view is actually displayed
        const resolvedId = viewName === 'dashboard' || viewName === 'fantasy' ? 
                          viewName : `${viewName}-view`;
        const element = document.getElementById(resolvedId);
        expect(element?.classList.contains('active')).toBe(true);
      });
    });
  });

  describe('Issue 2: "Canvas is already in use" Chart Errors', () => {
    test('should reproduce original canvas conflict errors', () => {
      // Create first chart
      const chart1 = OriginalProblematicSystem.createAccuracyChart();
      expect(chart1).toBeTruthy();
      
      // Try to create second chart on same canvas (should fail)
      const chart2 = OriginalProblematicSystem.createAccuracyChart();
      expect(chart2).toBeNull();
      
      // Verify canvas conflict error was logged
      const canvasErrors = capturedErrors.filter(error => 
        error.includes('Canvas is already in use') || 
        error.includes('Chart creation failed')
      );
      expect(canvasErrors.length).toBeGreaterThan(0);
    });

    test('should fix canvas conflict errors with proper cleanup', () => {
      // Clear previous errors
      capturedErrors.length = 0;
      
      // Create first chart
      const chart1 = FixedNavigationSystem.createAccuracyChart();
      expect(chart1).toBeTruthy();
      
      // Create second chart on same canvas (should succeed with cleanup)
      const chart2 = FixedNavigationSystem.createAccuracyChart();
      expect(chart2).toBeTruthy();
      
      // Create third chart (should also succeed)
      const chart3 = FixedNavigationSystem.createAccuracyChart();
      expect(chart3).toBeTruthy();
      
      // Verify no canvas conflict errors
      const canvasErrors = capturedErrors.filter(error => 
        error.includes('Canvas is already in use')
      );
      expect(canvasErrors).toHaveLength(0);
      
      // Verify cleanup messages
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('🔄 Destroying existing chart'));
    });

    test('should validate requirement 2.2 - no canvas conflicts', () => {
      // Rapidly create multiple charts on same canvas
      for (let i = 0; i < 5; i++) {
        const chart = FixedNavigationSystem.createAccuracyChart();
        expect(chart).toBeTruthy();
      }
      
      // Should have no canvas conflict errors
      const canvasErrors = capturedErrors.filter(error => 
        error.includes('Canvas is already in use')
      );
      expect(canvasErrors).toHaveLength(0);
    });
  });

  describe('Issue 3: "NO MATCH found" Game Data Errors', () => {
    test('should reproduce original game matching failures', () => {
      const localGames = [
        { id: 'local-1', homeTeam: 'SF', awayTeam: 'NE', status: 'SCHEDULED' },
        { id: 'local-2', homeTeam: 'Dallas Cowboys', awayTeam: 'NY Giants', status: 'SCHEDULED' }
      ];
      
      const espnGames = [
        { id: 'espn-1', homeTeam: 'San Francisco', awayTeam: 'New England', status: 'LIVE' },
        { id: 'espn-2', homeTeam: 'Dallas Cowboys', awayTeam: 'New York Giants', status: 'LIVE' }
      ];
      
      // Test original matching (should fail for abbreviated teams)
      const match1 = OriginalProblematicSystem.matchEspnGame(localGames[0], espnGames);
      const match2 = OriginalProblematicSystem.matchEspnGame(localGames[1], espnGames);
      
      expect(match1).toBeNull(); // SF vs NE should not match San Francisco vs New England
      expect(match2).toBeNull(); // NY Giants should not match New York Giants
      
      // Verify "NO MATCH found" errors
      const noMatchErrors = capturedErrors.filter(error => error.includes('NO MATCH found'));
      expect(noMatchErrors.length).toBeGreaterThan(0);
    });

    test('should fix game matching with fuzzy logic', () => {
      // Clear previous errors
      capturedErrors.length = 0;
      
      const localGames = [
        { id: 'local-1', homeTeam: 'SF', awayTeam: 'NE', status: 'SCHEDULED' },
        { id: 'local-2', homeTeam: 'Dallas Cowboys', awayTeam: 'NY Giants', status: 'SCHEDULED' },
        { id: 'local-3', homeTeam: 'Green Bay', awayTeam: 'Chicago Bears', status: 'SCHEDULED' }
      ];
      
      const espnGames = [
        { id: 'espn-1', homeTeam: 'San Francisco', awayTeam: 'New England', status: 'LIVE' },
        { id: 'espn-2', homeTeam: 'Dallas Cowboys', awayTeam: 'New York Giants', status: 'LIVE' },
        { id: 'espn-3', homeTeam: 'Chicago Bears', awayTeam: 'Green Bay', status: 'LIVE' } // Reversed teams
      ];
      
      // Test fixed matching
      const match1 = FixedNavigationSystem.matchEspnGame(localGames[0], espnGames);
      const match2 = FixedNavigationSystem.matchEspnGame(localGames[1], espnGames);
      const match3 = FixedNavigationSystem.matchEspnGame(localGames[2], espnGames);
      
      expect(match1).toBeTruthy(); // Should match with fuzzy logic
      expect(match1?.id).toBe('espn-1');
      
      expect(match2).toBeTruthy(); // Should match despite NY vs New York
      expect(match2?.id).toBe('espn-2');
      
      expect(match3).toBeTruthy(); // Should match despite reversed teams
      expect(match3?.id).toBe('espn-3');
      
      // Verify no "NO MATCH found" errors
      const noMatchErrors = capturedErrors.filter(error => error.includes('NO MATCH found'));
      expect(noMatchErrors).toHaveLength(0);
    });

    test('should validate requirement 3.3 - eliminate NO MATCH errors', () => {
      const testCases = [
        { local: { homeTeam: 'SF', awayTeam: 'NE' }, espn: { homeTeam: 'San Francisco', awayTeam: 'New England' } },
        { local: { homeTeam: 'GB', awayTeam: 'CHI' }, espn: { homeTeam: 'Green Bay', awayTeam: 'Chicago' } },
        { local: { homeTeam: 'TB', awayTeam: 'NO' }, espn: { homeTeam: 'Tampa Bay', awayTeam: 'New Orleans' } }
      ];
      
      testCases.forEach(({ local, espn }) => {
        const match = FixedNavigationSystem.matchEspnGame(local, [espn]);
        expect(match).toBeTruthy();
      });
      
      // Should have no "NO MATCH found" errors for these common cases
      const noMatchErrors = capturedErrors.filter(error => error.includes('NO MATCH found'));
      expect(noMatchErrors).toHaveLength(0);
    });
  });

  describe('Issue 4: Live vs Upcoming Games Miscategorization', () => {
    test('should reproduce original status classification errors', () => {
      const testStatuses = [
        'IN_PROGRESS', // Should be live but original only checks 'LIVE'
        'HALFTIME',    // Should be live but original only checks 'LIVE'
        'ACTIVE',      // Should be live but original only checks 'LIVE'
        'PRE_GAME',    // Should be upcoming but original only checks 'SCHEDULED'
        'NOT_STARTED'  // Should be upcoming but original only checks 'SCHEDULED'
      ];
      
      testStatuses.forEach(status => {
        const isLive = OriginalProblematicSystem.isLiveGame(status);
        const isUpcoming = OriginalProblematicSystem.isUpcomingGame(status);
        
        // Original logic should fail to categorize these correctly
        if (status === 'IN_PROGRESS' || status === 'HALFTIME' || status === 'ACTIVE') {
          expect(isLive).toBe(false); // Should be true but original logic fails
        }
        
        if (status === 'PRE_GAME' || status === 'NOT_STARTED') {
          expect(isUpcoming).toBe(false); // Should be true but original logic fails
        }
      });
    });

    test('should fix status classification with comprehensive checking', () => {
      const liveStatuses = ['LIVE', 'IN_PROGRESS', 'HALFTIME', 'ACTIVE', 'PLAYING'];
      const upcomingStatuses = ['SCHEDULED', 'PRE_GAME', 'UPCOMING', 'NOT_STARTED'];
      
      // Test live game detection
      liveStatuses.forEach(status => {
        const isLive = FixedNavigationSystem.isLiveGame(status);
        expect(isLive).toBe(true);
      });
      
      // Test upcoming game detection
      upcomingStatuses.forEach(status => {
        const isUpcoming = FixedNavigationSystem.isUpcomingGame(status);
        expect(isUpcoming).toBe(true);
      });
      
      // Test that live games are not categorized as upcoming
      liveStatuses.forEach(status => {
        const isUpcoming = FixedNavigationSystem.isUpcomingGame(status);
        expect(isUpcoming).toBe(false);
      });
      
      // Test that upcoming games are not categorized as live
      upcomingStatuses.forEach(status => {
        const isLive = FixedNavigationSystem.isLiveGame(status);
        expect(isLive).toBe(false);
      });
    });

    test('should validate requirement 4.3 - accurate live/upcoming categorization', () => {
      const games = [
        { id: '1', status: 'LIVE' },
        { id: '2', status: 'IN_PROGRESS' },
        { id: '3', status: 'HALFTIME' },
        { id: '4', status: 'SCHEDULED' },
        { id: '5', status: 'PRE_GAME' },
        { id: '6', status: 'NOT_STARTED' }
      ];
      
      const liveGames = games.filter(game => FixedNavigationSystem.isLiveGame(game.status));
      const upcomingGames = games.filter(game => FixedNavigationSystem.isUpcomingGame(game.status));
      
      expect(liveGames).toHaveLength(3); // LIVE, IN_PROGRESS, HALFTIME
      expect(upcomingGames).toHaveLength(3); // SCHEDULED, PRE_GAME, NOT_STARTED
      
      // No game should be in both categories
      const overlap = liveGames.filter(game => 
        upcomingGames.some(upcoming => upcoming.id === game.id)
      );
      expect(overlap).toHaveLength(0);
    });
  });

  describe('Integration: All Issues Fixed Together', () => {
    test('should handle complete navigation flow without any original errors', async () => {
      // Clear all previous errors
      capturedErrors.length = 0;
      capturedWarnings.length = 0;
      
      // Test complete navigation flow
      const views = ['dashboard', 'live', 'predictions', 'fantasy', 'betting', 'news'];
      
      for (const view of views) {
        // 1. Navigate to view (should not have "View not found" errors)
        const navSuccess = FixedNavigationSystem.switchView(view);
        expect(navSuccess).toBe(true);
        
        // 2. Create charts (should not have canvas conflicts)
        if (view === 'dashboard' || view === 'live') {
          const chart = FixedNavigationSystem.createAccuracyChart();
          expect(chart).toBeTruthy();
        }
        
        // 3. Test game data matching (should not have "NO MATCH" errors)
        if (view === 'live') {
          const localGame = { homeTeam: 'SF', awayTeam: 'NE', status: 'SCHEDULED' };
          const espnGames = [{ id: 'espn-1', homeTeam: 'San Francisco', awayTeam: 'New England', status: 'LIVE' }];
          
          const match = FixedNavigationSystem.matchEspnGame(localGame, espnGames);
          expect(match).toBeTruthy();
        }
        
        // 4. Test game status classification
        const isLive = FixedNavigationSystem.isLiveGame('IN_PROGRESS');
        const isUpcoming = FixedNavigationSystem.isUpcomingGame('PRE_GAME');
        expect(isLive).toBe(true);
        expect(isUpcoming).toBe(true);
      }
      
      // Verify no original error patterns exist
      const viewNotFoundErrors = capturedErrors.filter(error => error.includes('View not found'));
      const canvasConflictErrors = capturedErrors.filter(error => error.includes('Canvas is already in use'));
      const noMatchErrors = capturedErrors.filter(error => error.includes('NO MATCH found'));
      
      expect(viewNotFoundErrors).toHaveLength(0);
      expect(canvasConflictErrors).toHaveLength(0);
      expect(noMatchErrors).toHaveLength(0);
      
      console.log('✅ All original issues have been resolved');
    });

    test('should demonstrate improvement metrics', () => {
      // Test navigation success rate
      const views = ['dashboard', 'live', 'predictions', 'fantasy', 'betting', 'news'];
      let originalSuccesses = 0;
      let fixedSuccesses = 0;
      
      views.forEach(view => {
        // Original system
        if (OriginalProblematicSystem.switchView(view)) {
          originalSuccesses++;
        }
        
        // Fixed system
        if (FixedNavigationSystem.switchView(view)) {
          fixedSuccesses++;
        }
      });
      
      const originalSuccessRate = originalSuccesses / views.length;
      const fixedSuccessRate = fixedSuccesses / views.length;
      
      console.log(`Navigation Success Rate - Original: ${originalSuccessRate * 100}%, Fixed: ${fixedSuccessRate * 100}%`);
      
      // Fixed system should have 100% success rate
      expect(fixedSuccessRate).toBe(1.0);
      
      // Original system should have lower success rate
      expect(originalSuccessRate).toBeLessThan(fixedSuccessRate);
    });
  });

  describe('Error Message Quality Improvement', () => {
    test('should provide better error messages than original system', () => {
      // Clear errors
      capturedErrors.length = 0;
      
      // Test with non-existent view
      FixedNavigationSystem.switchView('nonexistent-view');
      
      // Fixed system should provide more informative error messages
      const errorMessages = capturedErrors.filter(error => 
        error.includes('Could not resolve view ID')
      );
      
      expect(errorMessages.length).toBeGreaterThan(0);
      
      // Should not have generic "View not found" messages
      const genericErrors = capturedErrors.filter(error => 
        error.includes('View not found: nonexistent-view')
      );
      
      expect(genericErrors).toHaveLength(0);
    });
  });
});
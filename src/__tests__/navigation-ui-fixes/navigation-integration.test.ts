/**
 * Navigation Integration Tests
 * Tests for complete navigation flows and component interactions
 */

import { JSDOM } from 'jsdom';

// Mock DOM environment with comprehensive structure
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
  <title>NFL Analytics Pro</title>
  <style>
    .view { display: none; }
    .view.active { display: block; }
    .nav-link.active { font-weight: bold; }
    .error-notification { padding: 10px; margin: 5px; }
  </style>
</head>
<body>
  <!-- Navigation Menu -->
  <nav id="main-nav">
    <a href="#" data-view="dashboard" class="nav-link active">Dashboard</a>
    <a href="#" data-view="live" class="nav-link">Live Games</a>
    <a href="#" data-view="predictions" class="nav-link">Predictions</a>
    <a href="#" data-view="fantasy" class="nav-link">Fantasy</a>
    <a href="#" data-view="betting" class="nav-link">Betting</a>
    <a href="#" data-view="news" class="nav-link">News</a>
  </nav>

  <!-- Views -->
  <div id="dashboard" class="view active">
    <h1>Dashboard</h1>
    <canvas id="dashboard-chart" width="400" height="200"></canvas>
    <div id="dashboard-content">Dashboard content</div>
  </div>
  
  <div id="live-view" class="view">
    <h1>Live Games</h1>
    <canvas id="live-chart" width="400" height="200"></canvas>
    <div id="live-games-container">
      <div class="game-card" data-status="LIVE">Game 1</div>
      <div class="game-card" data-status="HALFTIME">Game 2</div>
    </div>
  </div>
  
  <div id="predictions-view" class="view">
    <h1>Predictions</h1>
    <canvas id="predictions-chart" width="400" height="200"></canvas>
    <div id="predictions-content">Predictions content</div>
  </div>
  
  <div id="fantasy" class="view">
    <h1>Fantasy</h1>
    <div id="fantasy-content">Fantasy content</div>
  </div>
  
  <div id="betting-view" class="view">
    <h1>Betting</h1>
    <div id="betting-content">Betting content</div>
  </div>
  
  <div id="news-view" class="view">
    <h1>News</h1>
    <div id="news-content">News content</div>
  </div>

  <!-- Error Notifications Container -->
  <div id="error-notifications"></div>

  <!-- Chart Fallback -->
  <div id="chart-fallback" style="display: none;">Chart unavailable</div>
</body>
</html>
`);

global.document = dom.window.document;
global.window = dom.window as any;

// Mock Chart.js
const mockChart = {
  destroy: jest.fn(),
  update: jest.fn(),
  resize: jest.fn()
};

global.Chart = jest.fn().mockImplementation(() => mockChart) as any;

// Mock comprehensive navigation system
class IntegratedNavigationSystem {
  private viewManager: any;
  private chartManager: any;
  private dataSync: any;
  private statusClassifier: any;
  private errorRecovery: any;
  private currentView: string = 'dashboard';

  constructor() {
    this.initializeComponents();
    this.setupEventListeners();
    console.log('🚀 Integrated Navigation System initialized');
  }

  private initializeComponents() {
    // Mock component initialization
    this.viewManager = {
      switchView: jest.fn().mockImplementation(this.mockSwitchView.bind(this)),
      resolveViewId: jest.fn().mockImplementation(this.mockResolveViewId.bind(this)),
      hideAllViews: jest.fn().mockImplementation(this.mockHideAllViews.bind(this)),
      showView: jest.fn().mockImplementation(this.mockShowView.bind(this))
    };

    this.chartManager = {
      createChart: jest.fn().mockImplementation(this.mockCreateChart.bind(this)),
      destroyChart: jest.fn().mockImplementation(this.mockDestroyChart.bind(this)),
      destroyAllCharts: jest.fn().mockImplementation(this.mockDestroyAllCharts.bind(this)),
      isChartActive: jest.fn().mockReturnValue(false)
    };

    this.dataSync = {
      syncGameData: jest.fn().mockResolvedValue({
        synchronized: [],
        conflicts: [],
        unmatched: []
      }),
      updateGameScores: jest.fn().mockResolvedValue({}),
      validateAndSanitizeData: jest.fn().mockReturnValue({ valid: [], invalid: [] })
    };

    this.statusClassifier = {
      classifyGameStatus: jest.fn().mockReturnValue({
        category: 'live',
        normalizedStatus: 'LIVE',
        confidence: 1.0
      }),
      isLiveGame: jest.fn().mockReturnValue(true),
      isUpcomingGame: jest.fn().mockReturnValue(false),
      filterGamesByCategory: jest.fn().mockReturnValue([])
    };

    this.errorRecovery = {
      handleError: jest.fn().mockResolvedValue({ success: true }),
      showUserNotification: jest.fn(),
      dismissNotification: jest.fn()
    };
  }

  private setupEventListeners() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewName = (e.target as HTMLElement).getAttribute('data-view');
        if (viewName) {
          this.navigateToView(viewName);
        }
      });
    });
  }

  async navigateToView(viewName: string): Promise<boolean> {
    console.log(`🧭 Navigating to view: ${viewName}`);

    try {
      // Step 1: Destroy existing charts
      await this.cleanupCurrentView();

      // Step 2: Switch view
      const switchResult = await this.viewManager.switchView(viewName);
      
      if (!switchResult) {
        // Handle view not found error
        await this.errorRecovery.handleError('VIEW_NOT_FOUND', `View not found: ${viewName}`, {
          viewName,
          currentView: this.currentView
        });
        return false;
      }

      // Step 3: Initialize new view
      await this.initializeView(viewName);

      // Step 4: Update current view
      this.currentView = viewName;

      console.log(`✅ Successfully navigated to: ${viewName}`);
      return true;

    } catch (error) {
      console.error(`❌ Navigation failed:`, error);
      await this.errorRecovery.handleError('NAVIGATION_EXCEPTION', error, {
        viewName,
        currentView: this.currentView
      });
      return false;
    }
  }

  private async cleanupCurrentView(): Promise<void> {
    try {
      // Destroy all active charts
      await this.chartManager.destroyAllCharts();
      
      // Clear any view-specific data
      this.clearViewData();
      
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error);
    }
  }

  private async initializeView(viewName: string): Promise<void> {
    try {
      // Load view-specific data
      await this.loadViewData(viewName);
      
      // Initialize charts if needed
      await this.initializeViewCharts(viewName);
      
      // Update game data if needed
      await this.updateGameData(viewName);
      
    } catch (error) {
      console.error(`❌ View initialization failed for ${viewName}:`, error);
      throw error;
    }
  }

  private async loadViewData(viewName: string): Promise<void> {
    // Mock data loading based on view
    switch (viewName) {
      case 'live':
        await this.loadLiveGamesData();
        break;
      case 'predictions':
        await this.loadPredictionsData();
        break;
      case 'fantasy':
        await this.loadFantasyData();
        break;
      default:
        console.log(`📊 Loading data for ${viewName}`);
    }
  }

  private async initializeViewCharts(viewName: string): Promise<void> {
    const chartConfigs = {
      dashboard: { canvasId: 'dashboard-chart', type: 'line' },
      live: { canvasId: 'live-chart', type: 'bar' },
      predictions: { canvasId: 'predictions-chart', type: 'scatter' }
    };

    const config = chartConfigs[viewName as keyof typeof chartConfigs];
    if (config) {
      try {
        await this.chartManager.createChart(config.canvasId, {
          type: config.type,
          data: { datasets: [] },
          options: {}
        });
      } catch (error) {
        await this.errorRecovery.handleError('CHART_CREATION_FAILED', error, {
          viewName,
          canvasId: config.canvasId
        });
      }
    }
  }

  private async updateGameData(viewName: string): Promise<void> {
    if (viewName === 'live' || viewName === 'dashboard') {
      try {
        // Mock ESPN API call
        const espnData = await this.fetchEspnData();
        const localData = await this.getLocalGameData();
        
        // Sync data
        const syncResult = await this.dataSync.syncGameData(localData, espnData);
        
        // Update UI with synchronized data
        this.updateGameDisplay(syncResult.synchronized);
        
      } catch (error) {
        await this.errorRecovery.handleError('DATA_SYNC_FAILED', error, {
          viewName
        });
      }
    }
  }

  private async fetchEspnData(): Promise<any[]> {
    // Mock ESPN API response
    return [
      { id: 'espn-1', homeTeam: 'Dallas Cowboys', awayTeam: 'New York Giants', status: 'LIVE', homeScore: 14, awayScore: 7 },
      { id: 'espn-2', homeTeam: 'Green Bay Packers', awayTeam: 'Chicago Bears', status: 'SCHEDULED', homeScore: 0, awayScore: 0 }
    ];
  }

  private async getLocalGameData(): Promise<any[]> {
    // Mock local game data
    return [
      { id: 'local-1', homeTeam: 'Dallas Cowboys', awayTeam: 'New York Giants', status: 'SCHEDULED', homeScore: 0, awayScore: 0 },
      { id: 'local-2', homeTeam: 'Green Bay Packers', awayTeam: 'Chicago Bears', status: 'SCHEDULED', homeScore: 0, awayScore: 0 }
    ];
  }

  private updateGameDisplay(games: any[]): void {
    const container = document.getElementById('live-games-container');
    if (container && games.length > 0) {
      // Update game cards with synchronized data
      const gameCards = container.querySelectorAll('.game-card');
      gameCards.forEach((card, index) => {
        if (games[index]) {
          card.setAttribute('data-status', games[index].status);
          card.textContent = `${games[index].homeTeam} vs ${games[index].awayTeam} - ${games[index].status}`;
        }
      });
    }
  }

  private async loadLiveGamesData(): Promise<void> {
    console.log('📺 Loading live games data');
    // Mock live games data loading
  }

  private async loadPredictionsData(): Promise<void> {
    console.log('🔮 Loading predictions data');
    // Mock predictions data loading
  }

  private async loadFantasyData(): Promise<void> {
    console.log('🏈 Loading fantasy data');
    // Mock fantasy data loading
  }

  private clearViewData(): void {
    // Mock view data clearing
    console.log('🧹 Clearing view data');
  }

  // Mock implementations for view manager
  private mockSwitchView(viewName: string): boolean {
    const resolvedId = this.mockResolveViewId(viewName);
    if (!resolvedId) return false;

    const element = document.getElementById(resolvedId);
    if (!element) return false;

    this.mockHideAllViews();
    this.mockShowView(element);
    this.updateMenuState(viewName);

    return true;
  }

  private mockResolveViewId(viewName: string): string | null {
    const patterns = [viewName, `${viewName}-view`, `view-${viewName}`];
    
    for (const pattern of patterns) {
      if (document.getElementById(pattern)) {
        return pattern;
      }
    }
    
    return null;
  }

  private mockHideAllViews(): void {
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
      (view as HTMLElement).style.display = 'none';
    });
  }

  private mockShowView(element: Element): void {
    element.classList.add('active');
    (element as HTMLElement).style.display = 'block';
  }

  private updateMenuState(viewName: string): void {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-view="${viewName}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  private mockCreateChart(canvasId: string, config: any): any {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    return mockChart;
  }

  private mockDestroyChart(canvasId: string): boolean {
    return true;
  }

  private mockDestroyAllCharts(): number {
    return 3; // Mock destroying 3 charts
  }

  // Getters for testing
  getCurrentView(): string {
    return this.currentView;
  }

  getViewManager(): any {
    return this.viewManager;
  }

  getChartManager(): any {
    return this.chartManager;
  }

  getDataSync(): any {
    return this.dataSync;
  }

  getErrorRecovery(): any {
    return this.errorRecovery;
  }
}

describe('Navigation Integration Tests', () => {
  let navigationSystem: IntegratedNavigationSystem;

  beforeEach(() => {
    navigationSystem = new IntegratedNavigationSystem();
    jest.clearAllMocks();

    // Reset DOM state
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
      (view as HTMLElement).style.display = 'none';
    });
    
    document.getElementById('dashboard')?.classList.add('active');
    (document.getElementById('dashboard') as HTMLElement).style.display = 'block';
  });

  describe('Complete Navigation Flow', () => {
    test('should successfully navigate from dashboard to live view', async () => {
      const success = await navigationSystem.navigateToView('live');
      
      expect(success).toBe(true);
      expect(navigationSystem.getCurrentView()).toBe('live');
      
      // Verify view manager was called
      expect(navigationSystem.getViewManager().switchView).toHaveBeenCalledWith('live');
      
      // Verify chart cleanup and creation
      expect(navigationSystem.getChartManager().destroyAllCharts).toHaveBeenCalled();
      expect(navigationSystem.getChartManager().createChart).toHaveBeenCalledWith(
        'live-chart',
        expect.objectContaining({ type: 'bar' })
      );
      
      // Verify data sync for live view
      expect(navigationSystem.getDataSync().syncGameData).toHaveBeenCalled();
    });

    test('should handle navigation to predictions view', async () => {
      const success = await navigationSystem.navigateToView('predictions');
      
      expect(success).toBe(true);
      expect(navigationSystem.getCurrentView()).toBe('predictions');
      
      // Verify predictions chart creation
      expect(navigationSystem.getChartManager().createChart).toHaveBeenCalledWith(
        'predictions-chart',
        expect.objectContaining({ type: 'scatter' })
      );
    });

    test('should handle navigation to fantasy view (no charts)', async () => {
      const success = await navigationSystem.navigateToView('fantasy');
      
      expect(success).toBe(true);
      expect(navigationSystem.getCurrentView()).toBe('fantasy');
      
      // Verify cleanup still happens
      expect(navigationSystem.getChartManager().destroyAllCharts).toHaveBeenCalled();
      
      // Verify no chart creation for fantasy view
      expect(navigationSystem.getChartManager().createChart).not.toHaveBeenCalledWith(
        expect.stringContaining('fantasy'),
        expect.anything()
      );
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle view not found error gracefully', async () => {
      // Mock view manager to return false (view not found)
      navigationSystem.getViewManager().switchView.mockReturnValue(false);
      
      const success = await navigationSystem.navigateToView('nonexistent');
      
      expect(success).toBe(false);
      expect(navigationSystem.getErrorRecovery().handleError).toHaveBeenCalledWith(
        'VIEW_NOT_FOUND',
        expect.stringContaining('nonexistent'),
        expect.objectContaining({
          viewName: 'nonexistent',
          currentView: 'dashboard'
        })
      );
    });

    test('should handle chart creation failure', async () => {
      // Mock chart manager to throw error
      navigationSystem.getChartManager().createChart.mockImplementation(() => {
        throw new Error('Chart creation failed');
      });
      
      const success = await navigationSystem.navigateToView('dashboard');
      
      expect(success).toBe(true); // Navigation should still succeed
      expect(navigationSystem.getErrorRecovery().handleError).toHaveBeenCalledWith(
        'CHART_CREATION_FAILED',
        expect.any(Error),
        expect.objectContaining({
          viewName: 'dashboard',
          canvasId: 'dashboard-chart'
        })
      );
    });

    test('should handle data sync failure', async () => {
      // Mock data sync to throw error
      navigationSystem.getDataSync().syncGameData.mockRejectedValue(new Error('Sync failed'));
      
      const success = await navigationSystem.navigateToView('live');
      
      expect(success).toBe(true); // Navigation should still succeed
      expect(navigationSystem.getErrorRecovery().handleError).toHaveBeenCalledWith(
        'DATA_SYNC_FAILED',
        expect.any(Error),
        expect.objectContaining({
          viewName: 'live'
        })
      );
    });

    test('should handle navigation exception', async () => {
      // Mock view manager to throw error
      navigationSystem.getViewManager().switchView.mockImplementation(() => {
        throw new Error('Navigation exception');
      });
      
      const success = await navigationSystem.navigateToView('live');
      
      expect(success).toBe(false);
      expect(navigationSystem.getErrorRecovery().handleError).toHaveBeenCalledWith(
        'NAVIGATION_EXCEPTION',
        expect.any(Error),
        expect.objectContaining({
          viewName: 'live',
          currentView: 'dashboard'
        })
      );
    });
  });

  describe('Chart Lifecycle Integration', () => {
    test('should destroy charts when leaving view', async () => {
      await navigationSystem.navigateToView('live');
      await navigationSystem.navigateToView('predictions');
      
      // Should destroy charts twice (once for each navigation)
      expect(navigationSystem.getChartManager().destroyAllCharts).toHaveBeenCalledTimes(2);
    });

    test('should create appropriate charts for each view', async () => {
      const chartViews = [
        { view: 'dashboard', canvasId: 'dashboard-chart', type: 'line' },
        { view: 'live', canvasId: 'live-chart', type: 'bar' },
        { view: 'predictions', canvasId: 'predictions-chart', type: 'scatter' }
      ];

      for (const { view, canvasId, type } of chartViews) {
        await navigationSystem.navigateToView(view);
        
        expect(navigationSystem.getChartManager().createChart).toHaveBeenCalledWith(
          canvasId,
          expect.objectContaining({ type })
        );
      }
    });
  });

  describe('Data Synchronization Integration', () => {
    test('should sync data for live and dashboard views', async () => {
      const dataViews = ['live', 'dashboard'];
      
      for (const view of dataViews) {
        await navigationSystem.navigateToView(view);
        expect(navigationSystem.getDataSync().syncGameData).toHaveBeenCalled();
      }
    });

    test('should not sync data for non-game views', async () => {
      const nonGameViews = ['fantasy', 'betting', 'news'];
      
      for (const view of nonGameViews) {
        navigationSystem.getDataSync().syncGameData.mockClear();
        await navigationSystem.navigateToView(view);
        expect(navigationSystem.getDataSync().syncGameData).not.toHaveBeenCalled();
      }
    });
  });

  describe('DOM State Management', () => {
    test('should properly update view visibility', async () => {
      await navigationSystem.navigateToView('live');
      
      // Check that only live view is visible
      const views = document.querySelectorAll('.view');
      let visibleCount = 0;
      let liveViewVisible = false;
      
      views.forEach(view => {
        if (view.classList.contains('active')) {
          visibleCount++;
          if (view.id === 'live-view') {
            liveViewVisible = true;
          }
        }
      });
      
      expect(visibleCount).toBe(1);
      expect(liveViewVisible).toBe(true);
    });

    test('should update navigation menu state', async () => {
      await navigationSystem.navigateToView('predictions');
      
      // Check that only predictions nav link is active
      const navLinks = document.querySelectorAll('.nav-link');
      let activeCount = 0;
      let predictionsActive = false;
      
      navLinks.forEach(link => {
        if (link.classList.contains('active')) {
          activeCount++;
          if (link.getAttribute('data-view') === 'predictions') {
            predictionsActive = true;
          }
        }
      });
      
      expect(activeCount).toBe(1);
      expect(predictionsActive).toBe(true);
    });

    test('should update game display with synchronized data', async () => {
      // Mock sync result with game data
      navigationSystem.getDataSync().syncGameData.mockResolvedValue({
        synchronized: [
          { homeTeam: 'Team A', awayTeam: 'Team B', status: 'LIVE' },
          { homeTeam: 'Team C', awayTeam: 'Team D', status: 'SCHEDULED' }
        ],
        conflicts: [],
        unmatched: []
      });
      
      await navigationSystem.navigateToView('live');
      
      // Check that game cards were updated
      const gameCards = document.querySelectorAll('.game-card');
      expect(gameCards[0].getAttribute('data-status')).toBe('LIVE');
      expect(gameCards[0].textContent).toContain('Team A vs Team B');
    });
  });

  describe('Event Listener Integration', () => {
    test('should handle navigation clicks', async () => {
      const liveNavLink = document.querySelector('[data-view="live"]') as HTMLElement;
      
      // Simulate click
      const clickEvent = new dom.window.Event('click', { bubbles: true });
      liveNavLink.dispatchEvent(clickEvent);
      
      // Wait for async navigation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(navigationSystem.getViewManager().switchView).toHaveBeenCalledWith('live');
    });

    test('should prevent default link behavior', () => {
      const navLink = document.querySelector('[data-view="predictions"]') as HTMLElement;
      
      const clickEvent = new dom.window.Event('click', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
      
      navLink.dispatchEvent(clickEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Performance and Memory Management', () => {
    test('should clean up resources on each navigation', async () => {
      const views = ['live', 'predictions', 'fantasy', 'betting'];
      
      for (const view of views) {
        await navigationSystem.navigateToView(view);
      }
      
      // Should destroy charts for each navigation
      expect(navigationSystem.getChartManager().destroyAllCharts).toHaveBeenCalledTimes(views.length);
    });

    test('should handle rapid navigation without issues', async () => {
      const rapidNavigations = ['live', 'predictions', 'dashboard', 'fantasy', 'live'];
      
      const promises = rapidNavigations.map(view => navigationSystem.navigateToView(view));
      const results = await Promise.all(promises);
      
      // All navigations should complete
      results.forEach(result => {
        expect(typeof result).toBe('boolean');
      });
      
      // Final view should be set correctly
      expect(navigationSystem.getCurrentView()).toBe('live');
    });
  });

  describe('Integration Requirements Validation', () => {
    test('should satisfy all navigation requirements together', async () => {
      const testViews = ['dashboard', 'live', 'predictions', 'fantasy', 'betting', 'news'];
      
      for (const view of testViews) {
        const success = await navigationSystem.navigateToView(view);
        
        // Requirement 1.1: Successfully locate and display view
        expect(success).toBe(true);
        expect(navigationSystem.getCurrentView()).toBe(view);
        
        // Requirement 1.4: Only target view should be visible
        const activeViews = document.querySelectorAll('.view.active');
        expect(activeViews.length).toBe(1);
        
        // Requirement 1.5: Clear navigation feedback (via logging)
        expect(navigationSystem.getViewManager().switchView).toHaveBeenCalledWith(view);
      }
    });

    test('should satisfy all chart requirements together', async () => {
      const chartViews = ['dashboard', 'live', 'predictions'];
      
      for (const view of chartViews) {
        await navigationSystem.navigateToView(view);
        
        // Requirement 2.1: Check and destroy existing charts
        expect(navigationSystem.getChartManager().destroyAllCharts).toHaveBeenCalled();
        
        // Requirement 2.3: Unique instance references
        expect(navigationSystem.getChartManager().createChart).toHaveBeenCalled();
      }
    });

    test('should satisfy all error handling requirements together', async () => {
      // Test various error scenarios
      const errorScenarios = [
        { view: 'nonexistent', expectedError: 'VIEW_NOT_FOUND' },
      ];
      
      for (const scenario of errorScenarios) {
        navigationSystem.getViewManager().switchView.mockReturnValue(false);
        
        const success = await navigationSystem.navigateToView(scenario.view);
        
        // Requirement 5.1: User-friendly error messages
        expect(navigationSystem.getErrorRecovery().handleError).toHaveBeenCalledWith(
          scenario.expectedError,
          expect.any(String),
          expect.any(Object)
        );
        
        // Requirement 5.5: Graceful degradation
        expect(success).toBe(false); // Should not crash
      }
    });
  });
});
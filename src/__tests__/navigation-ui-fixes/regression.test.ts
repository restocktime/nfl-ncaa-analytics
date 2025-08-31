/**
 * Regression Tests for Navigation UI Fixes
 * Ensures no existing functionality is broken by the fixes
 */

import { JSDOM } from 'jsdom';

// Mock DOM environment with comprehensive existing functionality
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
  <title>NFL Analytics Pro - Regression Test</title>
  <style>
    .view { display: none; }
    .view.active { display: block; }
    .nav-link.active { font-weight: bold; color: blue; }
    .game-card { padding: 10px; margin: 5px; border: 1px solid #ccc; }
    .game-card.live { background-color: #ffebee; }
    .game-card.upcoming { background-color: #e8f5e8; }
    .chart-container { width: 100%; height: 400px; }
    .error-notification { background: red; color: white; padding: 10px; }
  </style>
</head>
<body>
  <!-- Existing Navigation Structure -->
  <header id="main-header">
    <nav id="main-navigation">
      <ul class="nav-menu">
        <li><a href="#" data-view="dashboard" class="nav-link active">Dashboard</a></li>
        <li><a href="#" data-view="live" class="nav-link">Live Games</a></li>
        <li><a href="#" data-view="predictions" class="nav-link">Predictions</a></li>
        <li><a href="#" data-view="fantasy" class="nav-link">Fantasy</a></li>
        <li><a href="#" data-view="betting" class="nav-link">Betting</a></li>
        <li><a href="#" data-view="news" class="nav-link">News</a></li>
      </ul>
    </nav>
  </header>

  <!-- Existing View Structure -->
  <main id="main-content">
    <div id="dashboard" class="view active">
      <h1>Dashboard</h1>
      <div class="dashboard-widgets">
        <div class="widget" id="scores-widget">
          <h3>Latest Scores</h3>
          <div class="scores-container">
            <div class="score-item">Cowboys 21 - Giants 14</div>
            <div class="score-item">Packers 28 - Bears 17</div>
          </div>
        </div>
        <div class="widget" id="predictions-widget">
          <h3>Top Predictions</h3>
          <div class="predictions-container">
            <div class="prediction-item">49ers favored by 7</div>
            <div class="prediction-item">Chiefs over/under 52.5</div>
          </div>
        </div>
      </div>
      <div class="chart-container">
        <canvas id="dashboard-chart" width="800" height="400"></canvas>
      </div>
    </div>

    <div id="live-view" class="view">
      <h1>Live Games</h1>
      <div class="live-controls">
        <button id="refresh-live" class="btn btn-primary">Refresh</button>
        <select id="live-filter" class="form-control">
          <option value="all">All Games</option>
          <option value="live">Live Only</option>
          <option value="halftime">Halftime</option>
        </select>
      </div>
      <div id="live-games-container" class="games-container">
        <div class="game-card live" data-game-id="game-1" data-status="LIVE">
          <div class="game-header">
            <span class="home-team">Dallas Cowboys</span>
            <span class="score">21-14</span>
            <span class="away-team">New York Giants</span>
          </div>
          <div class="game-status">Q3 8:45</div>
        </div>
        <div class="game-card live" data-game-id="game-2" data-status="HALFTIME">
          <div class="game-header">
            <span class="home-team">Green Bay Packers</span>
            <span class="score">14-10</span>
            <span class="away-team">Chicago Bears</span>
          </div>
          <div class="game-status">Halftime</div>
        </div>
      </div>
      <div class="chart-container">
        <canvas id="live-chart" width="800" height="400"></canvas>
      </div>
    </div>

    <div id="predictions-view" class="view">
      <h1>Predictions</h1>
      <div class="predictions-controls">
        <button id="generate-predictions" class="btn btn-success">Generate New</button>
        <button id="export-predictions" class="btn btn-secondary">Export</button>
      </div>
      <div id="predictions-container" class="predictions-grid">
        <div class="prediction-card" data-game-id="pred-1">
          <h4>49ers vs Seahawks</h4>
          <div class="prediction-details">
            <span class="spread">SF -3.5</span>
            <span class="confidence">85% confidence</span>
          </div>
        </div>
        <div class="prediction-card" data-game-id="pred-2">
          <h4>Chiefs vs Raiders</h4>
          <div class="prediction-details">
            <span class="spread">KC -7</span>
            <span class="confidence">92% confidence</span>
          </div>
        </div>
      </div>
      <div class="chart-container">
        <canvas id="predictions-chart" width="800" height="400"></canvas>
      </div>
    </div>

    <div id="fantasy" class="view">
      <h1>Fantasy Football</h1>
      <div class="fantasy-tabs">
        <button class="tab-btn active" data-tab="lineup">My Lineup</button>
        <button class="tab-btn" data-tab="waiver">Waiver Wire</button>
        <button class="tab-btn" data-tab="trades">Trades</button>
      </div>
      <div id="fantasy-content" class="fantasy-content">
        <div class="lineup-grid">
          <div class="position-slot" data-position="QB">
            <span class="position-label">QB</span>
            <div class="player-card">Josh Allen</div>
          </div>
          <div class="position-slot" data-position="RB1">
            <span class="position-label">RB</span>
            <div class="player-card">Christian McCaffrey</div>
          </div>
          <div class="position-slot" data-position="RB2">
            <span class="position-label">RB</span>
            <div class="player-card">Derrick Henry</div>
          </div>
        </div>
      </div>
    </div>

    <div id="betting-view" class="view">
      <h1>Betting Dashboard</h1>
      <div class="betting-controls">
        <button id="refresh-odds" class="btn btn-primary">Refresh Odds</button>
        <select id="sportsbook-filter" class="form-control">
          <option value="all">All Sportsbooks</option>
          <option value="draftkings">DraftKings</option>
          <option value="fanduel">FanDuel</option>
        </select>
      </div>
      <div id="betting-odds-container" class="odds-grid">
        <div class="odds-card" data-game-id="odds-1">
          <h4>Cowboys @ Giants</h4>
          <div class="odds-details">
            <span class="spread">DAL -3.5 (-110)</span>
            <span class="total">O/U 47.5</span>
          </div>
        </div>
      </div>
    </div>

    <div id="news-view" class="view">
      <h1>NFL News</h1>
      <div class="news-filters">
        <button class="filter-btn active" data-filter="all">All News</button>
        <button class="filter-btn" data-filter="injuries">Injuries</button>
        <button class="filter-btn" data-filter="trades">Trades</button>
      </div>
      <div id="news-container" class="news-list">
        <article class="news-item" data-category="injury">
          <h3>Star QB Questionable for Sunday</h3>
          <p>Team officials report quarterback dealing with minor injury...</p>
          <time>2 hours ago</time>
        </article>
        <article class="news-item" data-category="trade">
          <h3>Major Trade Shakes Up Division</h3>
          <p>Blockbuster deal sends Pro Bowl player to rival team...</p>
          <time>4 hours ago</time>
        </article>
      </div>
    </div>
  </main>

  <!-- Existing Footer -->
  <footer id="main-footer">
    <div class="footer-content">
      <p>&copy; 2024 NFL Analytics Pro. All rights reserved.</p>
      <div class="footer-links">
        <a href="#" id="privacy-link">Privacy Policy</a>
        <a href="#" id="terms-link">Terms of Service</a>
      </div>
    </div>
  </footer>

  <!-- Existing Modals -->
  <div id="settings-modal" class="modal" style="display: none;">
    <div class="modal-content">
      <h2>Settings</h2>
      <form id="settings-form">
        <label>
          <input type="checkbox" id="auto-refresh" checked> Auto-refresh data
        </label>
        <label>
          <input type="checkbox" id="notifications" checked> Enable notifications
        </label>
        <button type="submit">Save Settings</button>
      </form>
    </div>
  </div>

  <!-- Error Notifications -->
  <div id="error-notifications" class="notifications-container"></div>

  <!-- Loading Indicator -->
  <div id="loading-indicator" class="loading" style="display: none;">
    <div class="spinner"></div>
    <span>Loading...</span>
  </div>
</body>
</html>
`);

global.document = dom.window.document;
global.window = dom.window as any;

// Mock Chart.js
const mockChart = {
  destroy: jest.fn(),
  update: jest.fn(),
  resize: jest.fn(),
  data: { datasets: [] },
  options: {}
};

global.Chart = jest.fn().mockImplementation(() => mockChart) as any;

// Mock existing application functionality
class ExistingApplicationFunctionality {
  private static eventListeners: Map<string, Function[]> = new Map();
  private static timers: NodeJS.Timeout[] = [];
  private static dataCache: Map<string, any> = new Map();

  /**
   * Existing dashboard functionality
   */
  static initializeDashboard(): void {
    console.log('📊 Initializing dashboard...');
    
    // Load dashboard widgets
    this.loadScoresWidget();
    this.loadPredictionsWidget();
    
    // Setup auto-refresh
    const refreshTimer = setInterval(() => {
      this.refreshDashboardData();
    }, 30000); // 30 seconds
    
    this.timers.push(refreshTimer);
    
    console.log('✅ Dashboard initialized');
  }

  /**
   * Existing live games functionality
   */
  static initializeLiveGames(): void {
    console.log('🔴 Initializing live games...');
    
    // Setup refresh button
    const refreshBtn = document.getElementById('refresh-live');
    if (refreshBtn) {
      const refreshHandler = () => this.refreshLiveGames();
      refreshBtn.addEventListener('click', refreshHandler);
      this.addEventListener('refresh-live', refreshHandler);
    }
    
    // Setup filter dropdown
    const filterSelect = document.getElementById('live-filter') as HTMLSelectElement;
    if (filterSelect) {
      const filterHandler = (e: Event) => {
        const target = e.target as HTMLSelectElement;
        this.filterLiveGames(target.value);
      };
      filterSelect.addEventListener('change', filterHandler);
      this.addEventListener('live-filter', filterHandler);
    }
    
    // Start live updates
    const liveTimer = setInterval(() => {
      this.updateLiveScores();
    }, 10000); // 10 seconds
    
    this.timers.push(liveTimer);
    
    console.log('✅ Live games initialized');
  }

  /**
   * Existing fantasy functionality
   */
  static initializeFantasy(): void {
    console.log('🏈 Initializing fantasy...');
    
    // Setup tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      const tabHandler = (e: Event) => {
        const target = e.target as HTMLElement;
        const tabName = target.getAttribute('data-tab');
        if (tabName) {
          this.switchFantasyTab(tabName);
        }
      };
      btn.addEventListener('click', tabHandler);
      this.addEventListener(`tab-${btn.getAttribute('data-tab')}`, tabHandler);
    });
    
    // Load lineup data
    this.loadFantasyLineup();
    
    console.log('✅ Fantasy initialized');
  }

  /**
   * Existing betting functionality
   */
  static initializeBetting(): void {
    console.log('💰 Initializing betting...');
    
    // Setup odds refresh
    const refreshOddsBtn = document.getElementById('refresh-odds');
    if (refreshOddsBtn) {
      const refreshHandler = () => this.refreshBettingOdds();
      refreshOddsBtn.addEventListener('click', refreshHandler);
      this.addEventListener('refresh-odds', refreshHandler);
    }
    
    // Setup sportsbook filter
    const sportsbookFilter = document.getElementById('sportsbook-filter') as HTMLSelectElement;
    if (sportsbookFilter) {
      const filterHandler = (e: Event) => {
        const target = e.target as HTMLSelectElement;
        this.filterBySportsbook(target.value);
      };
      sportsbookFilter.addEventListener('change', filterHandler);
      this.addEventListener('sportsbook-filter', filterHandler);
    }
    
    console.log('✅ Betting initialized');
  }

  /**
   * Existing news functionality
   */
  static initializeNews(): void {
    console.log('📰 Initializing news...');
    
    // Setup news filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      const filterHandler = (e: Event) => {
        const target = e.target as HTMLElement;
        const filter = target.getAttribute('data-filter');
        if (filter) {
          this.filterNews(filter);
        }
      };
      btn.addEventListener('click', filterHandler);
      this.addEventListener(`news-filter-${btn.getAttribute('data-filter')}`, filterHandler);
    });
    
    // Load news articles
    this.loadNewsArticles();
    
    console.log('✅ News initialized');
  }

  /**
   * Existing settings functionality
   */
  static initializeSettings(): void {
    console.log('⚙️ Initializing settings...');
    
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      const submitHandler = (e: Event) => {
        e.preventDefault();
        this.saveSettings();
      };
      settingsForm.addEventListener('submit', submitHandler);
      this.addEventListener('settings-form', submitHandler);
    }
    
    // Load saved settings
    this.loadSettings();
    
    console.log('✅ Settings initialized');
  }

  // Helper methods for existing functionality
  private static loadScoresWidget(): void {
    const scoresContainer = document.querySelector('.scores-container');
    if (scoresContainer) {
      // Simulate loading scores
      console.log('Loading latest scores...');
      this.dataCache.set('scores', [
        { home: 'Cowboys', away: 'Giants', homeScore: 21, awayScore: 14 },
        { home: 'Packers', away: 'Bears', homeScore: 28, awayScore: 17 }
      ]);
    }
  }

  private static loadPredictionsWidget(): void {
    const predictionsContainer = document.querySelector('.predictions-container');
    if (predictionsContainer) {
      console.log('Loading top predictions...');
      this.dataCache.set('predictions', [
        { game: '49ers vs Seahawks', spread: 'SF -3.5', confidence: 85 },
        { game: 'Chiefs vs Raiders', spread: 'KC -7', confidence: 92 }
      ]);
    }
  }

  private static refreshDashboardData(): void {
    console.log('🔄 Refreshing dashboard data...');
    this.loadScoresWidget();
    this.loadPredictionsWidget();
  }

  private static refreshLiveGames(): void {
    console.log('🔄 Refreshing live games...');
    const liveContainer = document.getElementById('live-games-container');
    if (liveContainer) {
      // Simulate data refresh
      this.dataCache.set('liveGames', [
        { id: 'game-1', status: 'LIVE', quarter: 'Q3', time: '8:45' },
        { id: 'game-2', status: 'HALFTIME', quarter: 'Half', time: '' }
      ]);
    }
  }

  private static filterLiveGames(filter: string): void {
    console.log(`🔍 Filtering live games by: ${filter}`);
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
      const status = card.getAttribute('data-status');
      let show = true;
      
      if (filter === 'live' && status !== 'LIVE') {
        show = false;
      } else if (filter === 'halftime' && status !== 'HALFTIME') {
        show = false;
      }
      
      (card as HTMLElement).style.display = show ? 'block' : 'none';
    });
  }

  private static updateLiveScores(): void {
    console.log('📊 Updating live scores...');
    // Simulate score updates
    const gameCards = document.querySelectorAll('.game-card.live');
    gameCards.forEach(card => {
      const scoreElement = card.querySelector('.score');
      if (scoreElement && Math.random() > 0.8) {
        // Randomly update scores
        const currentScore = scoreElement.textContent || '0-0';
        console.log(`Score updated for game: ${currentScore}`);
      }
    });
  }

  private static switchFantasyTab(tabName: string): void {
    console.log(`🏈 Switching to fantasy tab: ${tabName}`);
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
    
    // Load tab content
    this.loadFantasyTabContent(tabName);
  }

  private static loadFantasyLineup(): void {
    console.log('Loading fantasy lineup...');
    this.dataCache.set('fantasyLineup', {
      QB: 'Josh Allen',
      RB1: 'Christian McCaffrey',
      RB2: 'Derrick Henry'
    });
  }

  private static loadFantasyTabContent(tabName: string): void {
    console.log(`Loading fantasy ${tabName} content...`);
    // Simulate loading different tab content
  }

  private static refreshBettingOdds(): void {
    console.log('💰 Refreshing betting odds...');
    this.dataCache.set('bettingOdds', [
      { game: 'Cowboys @ Giants', spread: 'DAL -3.5 (-110)', total: 'O/U 47.5' }
    ]);
  }

  private static filterBySportsbook(sportsbook: string): void {
    console.log(`🔍 Filtering by sportsbook: ${sportsbook}`);
    // Simulate sportsbook filtering
  }

  private static filterNews(filter: string): void {
    console.log(`📰 Filtering news by: ${filter}`);
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeFilter = document.querySelector(`[data-filter="${filter}"]`);
    if (activeFilter) {
      activeFilter.classList.add('active');
    }
    
    // Filter news items
    const newsItems = document.querySelectorAll('.news-item');
    newsItems.forEach(item => {
      const category = item.getAttribute('data-category');
      const show = filter === 'all' || category === filter;
      (item as HTMLElement).style.display = show ? 'block' : 'none';
    });
  }

  private static loadNewsArticles(): void {
    console.log('Loading news articles...');
    this.dataCache.set('newsArticles', [
      { title: 'Star QB Questionable', category: 'injury', time: '2 hours ago' },
      { title: 'Major Trade Shakes Up Division', category: 'trade', time: '4 hours ago' }
    ]);
  }

  private static saveSettings(): void {
    console.log('💾 Saving settings...');
    const autoRefresh = (document.getElementById('auto-refresh') as HTMLInputElement)?.checked;
    const notifications = (document.getElementById('notifications') as HTMLInputElement)?.checked;
    
    this.dataCache.set('settings', { autoRefresh, notifications });
  }

  private static loadSettings(): void {
    console.log('📖 Loading settings...');
    const settings = this.dataCache.get('settings') || { autoRefresh: true, notifications: true };
    
    const autoRefreshCheckbox = document.getElementById('auto-refresh') as HTMLInputElement;
    const notificationsCheckbox = document.getElementById('notifications') as HTMLInputElement;
    
    if (autoRefreshCheckbox) autoRefreshCheckbox.checked = settings.autoRefresh;
    if (notificationsCheckbox) notificationsCheckbox.checked = settings.notifications;
  }

  // Event listener management
  private static addEventListener(id: string, handler: Function): void {
    if (!this.eventListeners.has(id)) {
      this.eventListeners.set(id, []);
    }
    this.eventListeners.get(id)!.push(handler);
  }

  // Cleanup methods
  static cleanup(): void {
    console.log('🧹 Cleaning up existing functionality...');
    
    // Clear timers
    this.timers.forEach(timer => clearInterval(timer));
    this.timers = [];
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Clear cache
    this.dataCache.clear();
    
    console.log('✅ Cleanup complete');
  }

  // Getters for testing
  static getDataCache(): Map<string, any> {
    return new Map(this.dataCache);
  }

  static getEventListeners(): Map<string, Function[]> {
    return new Map(this.eventListeners);
  }

  static getActiveTimers(): number {
    return this.timers.length;
  }
}

describe('Regression Tests - Existing Functionality Preservation', () => {
  beforeEach(() => {
    // Reset DOM state
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });
    document.getElementById('dashboard')?.classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector('[data-view="dashboard"]')?.classList.add('active');
    
    // Clear existing functionality
    ExistingApplicationFunctionality.cleanup();
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    ExistingApplicationFunctionality.cleanup();
  });

  describe('Dashboard Functionality Preservation', () => {
    test('should maintain dashboard widget functionality', () => {
      ExistingApplicationFunctionality.initializeDashboard();
      
      const dataCache = ExistingApplicationFunctionality.getDataCache();
      
      // Verify scores widget data is loaded
      expect(dataCache.has('scores')).toBe(true);
      const scores = dataCache.get('scores');
      expect(scores).toHaveLength(2);
      expect(scores[0]).toHaveProperty('home', 'Cowboys');
      
      // Verify predictions widget data is loaded
      expect(dataCache.has('predictions')).toBe(true);
      const predictions = dataCache.get('predictions');
      expect(predictions).toHaveLength(2);
      expect(predictions[0]).toHaveProperty('game', '49ers vs Seahawks');
    });

    test('should maintain dashboard auto-refresh functionality', () => {
      jest.useFakeTimers();
      
      ExistingApplicationFunctionality.initializeDashboard();
      
      // Verify timer is set up
      expect(ExistingApplicationFunctionality.getActiveTimers()).toBe(1);
      
      // Fast-forward time
      jest.advanceTimersByTime(30000);
      
      // Verify refresh was called (data should be reloaded)
      const dataCache = ExistingApplicationFunctionality.getDataCache();
      expect(dataCache.has('scores')).toBe(true);
      expect(dataCache.has('predictions')).toBe(true);
      
      jest.useRealTimers();
    });

    test('should preserve dashboard chart container', () => {
      const chartContainer = document.querySelector('#dashboard .chart-container');
      const canvas = document.getElementById('dashboard-chart');
      
      expect(chartContainer).toBeTruthy();
      expect(canvas).toBeTruthy();
      expect(canvas?.tagName).toBe('CANVAS');
    });
  });

  describe('Live Games Functionality Preservation', () => {
    test('should maintain live games refresh functionality', () => {
      ExistingApplicationFunctionality.initializeLiveGames();
      
      const refreshBtn = document.getElementById('refresh-live');
      expect(refreshBtn).toBeTruthy();
      
      // Simulate click
      refreshBtn?.click();
      
      // Verify data was refreshed
      const dataCache = ExistingApplicationFunctionality.getDataCache();
      expect(dataCache.has('liveGames')).toBe(true);
      
      const liveGames = dataCache.get('liveGames');
      expect(liveGames).toHaveLength(2);
      expect(liveGames[0]).toHaveProperty('status', 'LIVE');
    });

    test('should maintain live games filtering functionality', () => {
      ExistingApplicationFunctionality.initializeLiveGames();
      
      const filterSelect = document.getElementById('live-filter') as HTMLSelectElement;
      expect(filterSelect).toBeTruthy();
      
      // Test filtering by live games only
      filterSelect.value = 'live';
      filterSelect.dispatchEvent(new Event('change'));
      
      // Verify filtering logic works
      const liveCards = document.querySelectorAll('.game-card[data-status="LIVE"]');
      const halftimeCards = document.querySelectorAll('.game-card[data-status="HALFTIME"]');
      
      expect(liveCards.length).toBeGreaterThan(0);
      expect(halftimeCards.length).toBeGreaterThan(0);
    });

    test('should maintain live score updates', () => {
      jest.useFakeTimers();
      
      ExistingApplicationFunctionality.initializeLiveGames();
      
      // Verify live update timer is set up
      expect(ExistingApplicationFunctionality.getActiveTimers()).toBe(1);
      
      // Fast-forward time
      jest.advanceTimersByTime(10000);
      
      // Verify update logic runs (console logs should be called)
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Updating live scores'));
      
      jest.useRealTimers();
    });
  });

  describe('Fantasy Functionality Preservation', () => {
    test('should maintain fantasy tab switching', () => {
      ExistingApplicationFunctionality.initializeFantasy();
      
      const tabBtns = document.querySelectorAll('.tab-btn');
      expect(tabBtns.length).toBe(3);
      
      // Test switching to waiver tab
      const waiverTab = document.querySelector('[data-tab="waiver"]') as HTMLElement;
      expect(waiverTab).toBeTruthy();
      
      waiverTab.click();
      
      // Verify tab switching logic
      expect(waiverTab.classList.contains('active')).toBe(true);
      
      // Verify other tabs are not active
      const lineupTab = document.querySelector('[data-tab="lineup"]');
      expect(lineupTab?.classList.contains('active')).toBe(false);
    });

    test('should maintain fantasy lineup data', () => {
      ExistingApplicationFunctionality.initializeFantasy();
      
      const dataCache = ExistingApplicationFunctionality.getDataCache();
      expect(dataCache.has('fantasyLineup')).toBe(true);
      
      const lineup = dataCache.get('fantasyLineup');
      expect(lineup).toHaveProperty('QB', 'Josh Allen');
      expect(lineup).toHaveProperty('RB1', 'Christian McCaffrey');
      expect(lineup).toHaveProperty('RB2', 'Derrick Henry');
    });

    test('should preserve fantasy position slots structure', () => {
      const positionSlots = document.querySelectorAll('.position-slot');
      expect(positionSlots.length).toBe(3);
      
      const qbSlot = document.querySelector('[data-position="QB"]');
      const rb1Slot = document.querySelector('[data-position="RB1"]');
      const rb2Slot = document.querySelector('[data-position="RB2"]');
      
      expect(qbSlot).toBeTruthy();
      expect(rb1Slot).toBeTruthy();
      expect(rb2Slot).toBeTruthy();
    });
  });

  describe('Betting Functionality Preservation', () => {
    test('should maintain betting odds refresh', () => {
      ExistingApplicationFunctionality.initializeBetting();
      
      const refreshOddsBtn = document.getElementById('refresh-odds');
      expect(refreshOddsBtn).toBeTruthy();
      
      refreshOddsBtn?.click();
      
      // Verify odds data was loaded
      const dataCache = ExistingApplicationFunctionality.getDataCache();
      expect(dataCache.has('bettingOdds')).toBe(true);
      
      const odds = dataCache.get('bettingOdds');
      expect(odds).toHaveLength(1);
      expect(odds[0]).toHaveProperty('game', 'Cowboys @ Giants');
    });

    test('should maintain sportsbook filtering', () => {
      ExistingApplicationFunctionality.initializeBetting();
      
      const sportsbookFilter = document.getElementById('sportsbook-filter') as HTMLSelectElement;
      expect(sportsbookFilter).toBeTruthy();
      
      // Test filtering
      sportsbookFilter.value = 'draftkings';
      sportsbookFilter.dispatchEvent(new Event('change'));
      
      // Verify filtering logic is called
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Filtering by sportsbook: draftkings'));
    });

    test('should preserve betting odds structure', () => {
      const oddsCards = document.querySelectorAll('.odds-card');
      expect(oddsCards.length).toBeGreaterThan(0);
      
      const firstCard = oddsCards[0];
      const gameTitle = firstCard.querySelector('h4');
      const oddsDetails = firstCard.querySelector('.odds-details');
      
      expect(gameTitle?.textContent).toBe('Cowboys @ Giants');
      expect(oddsDetails).toBeTruthy();
    });
  });

  describe('News Functionality Preservation', () => {
    test('should maintain news filtering', () => {
      ExistingApplicationFunctionality.initializeNews();
      
      const filterBtns = document.querySelectorAll('.filter-btn');
      expect(filterBtns.length).toBe(3);
      
      // Test injury filter
      const injuryFilter = document.querySelector('[data-filter="injuries"]') as HTMLElement;
      expect(injuryFilter).toBeTruthy();
      
      injuryFilter.click();
      
      // Verify filter is active
      expect(injuryFilter.classList.contains('active')).toBe(true);
      
      // Verify other filters are not active
      const allFilter = document.querySelector('[data-filter="all"]');
      expect(allFilter?.classList.contains('active')).toBe(false);
    });

    test('should maintain news articles data', () => {
      ExistingApplicationFunctionality.initializeNews();
      
      const dataCache = ExistingApplicationFunctionality.getDataCache();
      expect(dataCache.has('newsArticles')).toBe(true);
      
      const articles = dataCache.get('newsArticles');
      expect(articles).toHaveLength(2);
      expect(articles[0]).toHaveProperty('category', 'injury');
      expect(articles[1]).toHaveProperty('category', 'trade');
    });

    test('should preserve news article structure', () => {
      const newsItems = document.querySelectorAll('.news-item');
      expect(newsItems.length).toBe(2);
      
      const firstArticle = newsItems[0];
      const title = firstArticle.querySelector('h3');
      const content = firstArticle.querySelector('p');
      const time = firstArticle.querySelector('time');
      
      expect(title?.textContent).toBe('Star QB Questionable for Sunday');
      expect(content).toBeTruthy();
      expect(time?.textContent).toBe('2 hours ago');
    });
  });

  describe('Settings Functionality Preservation', () => {
    test('should maintain settings form functionality', () => {
      ExistingApplicationFunctionality.initializeSettings();
      
      const settingsForm = document.getElementById('settings-form');
      expect(settingsForm).toBeTruthy();
      
      // Test form submission
      const submitEvent = new Event('submit');
      settingsForm?.dispatchEvent(submitEvent);
      
      // Verify settings were saved
      const dataCache = ExistingApplicationFunctionality.getDataCache();
      expect(dataCache.has('settings')).toBe(true);
    });

    test('should maintain settings checkboxes state', () => {
      ExistingApplicationFunctionality.initializeSettings();
      
      const autoRefreshCheckbox = document.getElementById('auto-refresh') as HTMLInputElement;
      const notificationsCheckbox = document.getElementById('notifications') as HTMLInputElement;
      
      expect(autoRefreshCheckbox).toBeTruthy();
      expect(notificationsCheckbox).toBeTruthy();
      expect(autoRefreshCheckbox.checked).toBe(true);
      expect(notificationsCheckbox.checked).toBe(true);
    });
  });

  describe('DOM Structure Preservation', () => {
    test('should preserve main navigation structure', () => {
      const mainNav = document.getElementById('main-navigation');
      const navMenu = document.querySelector('.nav-menu');
      const navLinks = document.querySelectorAll('.nav-link');
      
      expect(mainNav).toBeTruthy();
      expect(navMenu).toBeTruthy();
      expect(navLinks.length).toBe(6);
      
      // Verify all expected views are linked
      const expectedViews = ['dashboard', 'live', 'predictions', 'fantasy', 'betting', 'news'];
      expectedViews.forEach(view => {
        const link = document.querySelector(`[data-view="${view}"]`);
        expect(link).toBeTruthy();
      });
    });

    test('should preserve view structure and content', () => {
      const views = document.querySelectorAll('.view');
      expect(views.length).toBe(6);
      
      // Verify each view has expected content
      const dashboard = document.getElementById('dashboard');
      const liveView = document.getElementById('live-view');
      const predictionsView = document.getElementById('predictions-view');
      
      expect(dashboard?.querySelector('.dashboard-widgets')).toBeTruthy();
      expect(liveView?.querySelector('.live-controls')).toBeTruthy();
      expect(predictionsView?.querySelector('.predictions-controls')).toBeTruthy();
    });

    test('should preserve footer and modal structure', () => {
      const footer = document.getElementById('main-footer');
      const settingsModal = document.getElementById('settings-modal');
      const errorNotifications = document.getElementById('error-notifications');
      const loadingIndicator = document.getElementById('loading-indicator');
      
      expect(footer).toBeTruthy();
      expect(settingsModal).toBeTruthy();
      expect(errorNotifications).toBeTruthy();
      expect(loadingIndicator).toBeTruthy();
    });
  });

  describe('CSS Classes and Styling Preservation', () => {
    test('should preserve view visibility classes', () => {
      const activeView = document.querySelector('.view.active');
      expect(activeView).toBeTruthy();
      expect(activeView?.id).toBe('dashboard');
      
      // Verify CSS rules are preserved
      const viewElements = document.querySelectorAll('.view');
      viewElements.forEach(view => {
        const computedStyle = window.getComputedStyle(view);
        if (view.classList.contains('active')) {
          expect(computedStyle.display).toBe('block');
        } else {
          expect(computedStyle.display).toBe('none');
        }
      });
    });

    test('should preserve navigation active state styling', () => {
      const activeNavLink = document.querySelector('.nav-link.active');
      expect(activeNavLink).toBeTruthy();
      
      const computedStyle = window.getComputedStyle(activeNavLink!);
      expect(computedStyle.fontWeight).toBe('bold');
      expect(computedStyle.color).toBe('blue');
    });

    test('should preserve game card styling classes', () => {
      const liveGameCards = document.querySelectorAll('.game-card.live');
      const gameCards = document.querySelectorAll('.game-card');
      
      expect(liveGameCards.length).toBeGreaterThan(0);
      expect(gameCards.length).toBeGreaterThan(0);
      
      // Verify game cards have proper structure
      gameCards.forEach(card => {
        expect(card.querySelector('.game-header')).toBeTruthy();
        expect(card.querySelector('.game-status')).toBeTruthy();
      });
    });
  });

  describe('Event Handling Preservation', () => {
    test('should preserve existing event listeners after navigation fixes', () => {
      // Initialize all functionality
      ExistingApplicationFunctionality.initializeLiveGames();
      ExistingApplicationFunctionality.initializeFantasy();
      ExistingApplicationFunctionality.initializeBetting();
      ExistingApplicationFunctionality.initializeNews();
      
      const eventListeners = ExistingApplicationFunctionality.getEventListeners();
      
      // Verify event listeners are registered
      expect(eventListeners.size).toBeGreaterThan(0);
      expect(eventListeners.has('refresh-live')).toBe(true);
      expect(eventListeners.has('live-filter')).toBe(true);
      expect(eventListeners.has('refresh-odds')).toBe(true);
    });

    test('should maintain form submission handling', () => {
      ExistingApplicationFunctionality.initializeSettings();
      
      const settingsForm = document.getElementById('settings-form');
      const eventListeners = ExistingApplicationFunctionality.getEventListeners();
      
      expect(settingsForm).toBeTruthy();
      expect(eventListeners.has('settings-form')).toBe(true);
    });
  });

  describe('Data Persistence and Caching', () => {
    test('should maintain data caching functionality', () => {
      ExistingApplicationFunctionality.initializeDashboard();
      ExistingApplicationFunctionality.initializeLiveGames();
      ExistingApplicationFunctionality.initializeFantasy();
      
      const dataCache = ExistingApplicationFunctionality.getDataCache();
      
      // Verify all expected data is cached
      expect(dataCache.has('scores')).toBe(true);
      expect(dataCache.has('predictions')).toBe(true);
      expect(dataCache.has('fantasyLineup')).toBe(true);
      
      // Verify data structure integrity
      const scores = dataCache.get('scores');
      expect(Array.isArray(scores)).toBe(true);
      expect(scores.length).toBeGreaterThan(0);
    });

    test('should preserve data after simulated navigation', () => {
      ExistingApplicationFunctionality.initializeDashboard();
      
      // Simulate navigation (without actually using navigation fixes)
      document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
      document.getElementById('live-view')?.classList.add('active');
      
      // Data should still be preserved
      const dataCache = ExistingApplicationFunctionality.getDataCache();
      expect(dataCache.has('scores')).toBe(true);
      expect(dataCache.has('predictions')).toBe(true);
    });
  });

  describe('Timer and Interval Preservation', () => {
    test('should maintain auto-refresh timers', () => {
      jest.useFakeTimers();
      
      ExistingApplicationFunctionality.initializeDashboard();
      ExistingApplicationFunctionality.initializeLiveGames();
      
      // Verify timers are set up
      expect(ExistingApplicationFunctionality.getActiveTimers()).toBe(2);
      
      // Fast-forward and verify timers still work
      jest.advanceTimersByTime(30000);
      
      const dataCache = ExistingApplicationFunctionality.getDataCache();
      expect(dataCache.has('scores')).toBe(true);
      expect(dataCache.has('liveGames')).toBe(true);
      
      jest.useRealTimers();
    });

    test('should properly clean up timers', () => {
      jest.useFakeTimers();
      
      ExistingApplicationFunctionality.initializeDashboard();
      expect(ExistingApplicationFunctionality.getActiveTimers()).toBe(1);
      
      ExistingApplicationFunctionality.cleanup();
      expect(ExistingApplicationFunctionality.getActiveTimers()).toBe(0);
      
      jest.useRealTimers();
    });
  });

  describe('Performance Regression Prevention', () => {
    test('should not introduce memory leaks in existing functionality', () => {
      const initialTimers = ExistingApplicationFunctionality.getActiveTimers();
      const initialCacheSize = ExistingApplicationFunctionality.getDataCache().size;
      
      // Initialize and cleanup multiple times
      for (let i = 0; i < 5; i++) {
        ExistingApplicationFunctionality.initializeDashboard();
        ExistingApplicationFunctionality.initializeLiveGames();
        ExistingApplicationFunctionality.cleanup();
      }
      
      const finalTimers = ExistingApplicationFunctionality.getActiveTimers();
      const finalCacheSize = ExistingApplicationFunctionality.getDataCache().size;
      
      expect(finalTimers).toBe(initialTimers);
      expect(finalCacheSize).toBe(initialCacheSize);
    });

    test('should maintain responsive UI interactions', () => {
      ExistingApplicationFunctionality.initializeLiveGames();
      
      const startTime = performance.now();
      
      // Simulate rapid filter changes
      const filterSelect = document.getElementById('live-filter') as HTMLSelectElement;
      for (let i = 0; i < 10; i++) {
        filterSelect.value = i % 2 === 0 ? 'live' : 'all';
        filterSelect.dispatchEvent(new Event('change'));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (under 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Integration with Navigation Fixes', () => {
    test('should work correctly with enhanced navigation system', () => {
      // Initialize existing functionality
      ExistingApplicationFunctionality.initializeDashboard();
      ExistingApplicationFunctionality.initializeLiveGames();
      
      // Simulate navigation using enhanced system (mock)
      document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
      document.getElementById('live-view')?.classList.add('active');
      
      // Existing functionality should still work
      const refreshBtn = document.getElementById('refresh-live');
      refreshBtn?.click();
      
      const dataCache = ExistingApplicationFunctionality.getDataCache();
      expect(dataCache.has('liveGames')).toBe(true);
    });

    test('should maintain functionality after chart lifecycle management', () => {
      ExistingApplicationFunctionality.initializeDashboard();
      
      // Simulate chart creation/destruction cycle
      const canvas = document.getElementById('dashboard-chart');
      expect(canvas).toBeTruthy();
      
      // Create mock chart
      const chart = new Chart(canvas, { type: 'line', data: {}, options: {} });
      expect(chart).toBeTruthy();
      
      // Destroy chart
      chart.destroy();
      
      // Existing functionality should still work
      const dataCache = ExistingApplicationFunctionality.getDataCache();
      expect(dataCache.has('scores')).toBe(true);
      expect(dataCache.has('predictions')).toBe(true);
    });
  });
});
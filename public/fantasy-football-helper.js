// Fantasy Football Helper - Frontend Integration
console.log('🏈 Loading Fantasy Football Helper...');

class FantasyFootballHelper {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api/v1/fantasy';
        this.currentUser = null;
        this.currentLeague = null;
        this.currentWeek = this.getCurrentNFLWeek();
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Fantasy Football Helper...');
        
        // Wait for main app to be ready
        if (window.footballApp) {
            this.currentUser = window.footballApp.currentUser;
        }
        
        // Add fantasy navigation to sidebar
        this.addFantasyNavigation();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ Fantasy Football Helper initialized');
    }

    addFantasyNavigation() {
        const sidebar = document.querySelector('.sidebar-menu');
        if (!sidebar) return;

        // Add Fantasy section to sidebar
        const fantasySection = document.createElement('div');
        fantasySection.className = 'menu-section';
        fantasySection.innerHTML = `
            <div class="section-title">
                <i class="fas fa-trophy"></i>
                Fantasy Helper
            </div>
            <div class="menu-item" data-view="fantasy-dashboard">
                <i class="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
            </div>
            <div class="menu-item" data-view="fantasy-lineup">
                <i class="fas fa-users"></i>
                <span>Lineup Optimizer</span>
            </div>
            <div class="menu-item" data-view="fantasy-waiver">
                <i class="fas fa-search"></i>
                <span>Waiver Wire</span>
            </div>
            <div class="menu-item" data-view="fantasy-trades">
                <i class="fas fa-exchange-alt"></i>
                <span>Trade Analyzer</span>
            </div>
            <div class="menu-item" data-view="fantasy-projections">
                <i class="fas fa-chart-line"></i>
                <span>Player Projections</span>
            </div>
            <div class="menu-item" data-view="fantasy-league-config">
                <i class="fas fa-cog"></i>
                <span>League Setup</span>
            </div>
        `;
        
        sidebar.appendChild(fantasySection);
    }

    setupEventListeners() {
        // Handle fantasy navigation clicks
        document.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item[data-view^="fantasy-"]');
            if (menuItem) {
                e.preventDefault();
                const view = menuItem.dataset.view;
                this.switchToFantasyView(view);
            }
        });
    }

    async switchToFantasyView(viewName) {
        console.log(`🎯 Switching to fantasy view: ${viewName}`);
        
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeMenuItem = document.querySelector(`[data-view="${viewName}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }
        
        // Hide all existing views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
            view.style.display = 'none';
        });
        
        // Load fantasy view
        await this.loadFantasyView(viewName);
    }

    async loadFantasyView(viewName) {
        const contentContainer = document.querySelector('.content-container');
        if (!contentContainer) return;
        
        // Create or show fantasy view
        let fantasyView = document.getElementById(viewName + '-view');
        if (!fantasyView) {
            fantasyView = document.createElement('div');
            fantasyView.className = 'view fantasy-view active';
            fantasyView.id = viewName + '-view';
            contentContainer.appendChild(fantasyView);
        }
        
        fantasyView.classList.add('active');
        fantasyView.style.display = 'block';
        
        // Load view-specific content
        switch (viewName) {
            case 'fantasy-dashboard':
                await this.loadFantasyDashboard(fantasyView);
                break;
            case 'fantasy-lineup':
                await this.loadLineupOptimizer(fantasyView);
                break;
            case 'fantasy-waiver':
                await this.loadWaiverWire(fantasyView);
                break;
            case 'fantasy-trades':
                await this.loadTradeAnalyzer(fantasyView);
                break;
            case 'fantasy-projections':
                await this.loadPlayerProjections(fantasyView);
                break;
            case 'fantasy-league-config':
                await this.loadLeagueConfiguration(fantasyView);
                break;
        }
    }

    getCurrentNFLWeek() {
        // Calculate current NFL week (simplified)
        const now = new Date();
        const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
        const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.max(1, Math.min(18, weeksSinceStart + 1));
    }

    async loadFantasyDashboard(container) {
        console.log('📊 Loading Fantasy Dashboard...');
        
        container.innerHTML = `
            <div class="fantasy-dashboard">
                <div class="section-header">
                    <h2><i class="fas fa-trophy"></i> Fantasy Football Dashboard</h2>
                    <div class="week-selector">
                        <label>Week:</label>
                        <select id="week-selector" onchange="window.fantasyHelper.changeWeek(this.value)">
                            ${Array.from({length: 18}, (_, i) => 
                                `<option value="${i + 1}" ${i + 1 === this.currentWeek ? 'selected' : ''}>Week ${i + 1}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3><i class="fas fa-users"></i> Quick Lineup</h3>
                            <button class="btn-primary" onclick="window.fantasyHelper.optimizeLineup()">
                                <i class="fas fa-magic"></i> Optimize
                            </button>
                        </div>
                        <div class="lineup-preview" id="lineup-preview">
                            <div class="loading">Loading lineup...</div>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3><i class="fas fa-search"></i> Top Waiver Targets</h3>
                            <button class="btn-secondary" onclick="window.fantasyHelper.refreshWaivers()">
                                <i class="fas fa-sync"></i> Refresh
                            </button>
                        </div>
                        <div class="waiver-targets" id="waiver-targets">
                            <div class="loading">Loading waiver targets...</div>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-line"></i> This Week's Projections</h3>
                        </div>
                        <div class="projections-summary" id="projections-summary">
                            <div class="loading">Loading projections...</div>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3><i class="fas fa-exchange-alt"></i> Trade Opportunities</h3>
                        </div>
                        <div class="trade-opportunities" id="trade-opportunities">
                            <div class="loading">Loading trade opportunities...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Load dashboard data
        await this.loadDashboardData();
    }

    async loadLineupOptimizer(container) {
        console.log('⚡ Loading Lineup Optimizer...');
        
        container.innerHTML = `
            <div class="lineup-optimizer">
                <div class="section-header">
                    <h2><i class="fas fa-users"></i> Lineup Optimizer</h2>
                    <div class="optimizer-controls">
                        <select id="risk-level">
                            <option value="CONSERVATIVE">Conservative</option>
                            <option value="MODERATE" selected>Moderate</option>
                            <option value="AGGRESSIVE">Aggressive</option>
                        </select>
                        <button class="btn-primary" onclick="window.fantasyHelper.runOptimization()">
                            <i class="fas fa-magic"></i> Optimize Lineup
                        </button>
                    </div>
                </div>
                
                <div class="optimizer-content">
                    <div class="current-lineup">
                        <h3>Current Lineup</h3>
                        <div class="lineup-grid" id="current-lineup">
                            <div class="loading">Loading current lineup...</div>
                        </div>
                    </div>
                    
                    <div class="optimized-lineup">
                        <h3>Optimized Lineup</h3>
                        <div class="lineup-grid" id="optimized-lineup">
                            <div class="placeholder">Click "Optimize Lineup" to see recommendations</div>
                        </div>
                    </div>
                    
                    <div class="lineup-analysis">
                        <h3>Analysis</h3>
                        <div class="analysis-content" id="lineup-analysis">
                            <div class="placeholder">Optimization analysis will appear here</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        await this.loadCurrentLineup();
    }

    async loadWaiverWire(container) {
        console.log('🔍 Loading Waiver Wire...');
        
        container.innerHTML = `
            <div class="waiver-wire">
                <div class="section-header">
                    <h2><i class="fas fa-search"></i> Waiver Wire Intelligence</h2>
                    <div class="waiver-controls">
                        <select id="position-filter">
                            <option value="">All Positions</option>
                            <option value="QB">QB</option>
                            <option value="RB">RB</option>
                            <option value="WR">WR</option>
                            <option value="TE">TE</option>
                            <option value="K">K</option>
                            <option value="DEF">DEF</option>
                        </select>
                        <button class="btn-primary" onclick="window.fantasyHelper.analyzeWaivers()">
                            <i class="fas fa-search"></i> Analyze
                        </button>
                    </div>
                </div>
                
                <div class="waiver-content">
                    <div class="waiver-targets-list" id="waiver-targets-list">
                        <div class="loading">Loading waiver wire analysis...</div>
                    </div>
                </div>
            </div>
        `;
        
        await this.loadWaiverTargets();
    }

    async loadTradeAnalyzer(container) {
        console.log('🔄 Loading Trade Analyzer...');
        
        container.innerHTML = `
            <div class="trade-analyzer">
                <div class="section-header">
                    <h2><i class="fas fa-exchange-alt"></i> Trade Analyzer</h2>
                </div>
                
                <div class="trade-content">
                    <div class="trade-builder">
                        <h3>Build Trade</h3>
                        <div class="trade-sides">
                            <div class="trade-side">
                                <h4>You Give</h4>
                                <div class="player-selector" id="give-players">
                                    <div class="placeholder">Select players to trade away</div>
                                </div>
                            </div>
                            <div class="trade-arrow">
                                <i class="fas fa-exchange-alt"></i>
                            </div>
                            <div class="trade-side">
                                <h4>You Receive</h4>
                                <div class="player-selector" id="receive-players">
                                    <div class="placeholder">Select players to receive</div>
                                </div>
                            </div>
                        </div>
                        <button class="btn-primary" onclick="window.fantasyHelper.analyzeTrade()">
                            <i class="fas fa-calculator"></i> Analyze Trade
                        </button>
                    </div>
                    
                    <div class="trade-analysis" id="trade-analysis">
                        <div class="placeholder">Trade analysis will appear here</div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadPlayerProjections(container) {
        console.log('📈 Loading Player Projections...');
        
        container.innerHTML = `
            <div class="player-projections">
                <div class="section-header">
                    <h2><i class="fas fa-chart-line"></i> Player Projections</h2>
                    <div class="projection-controls">
                        <select id="projection-position">
                            <option value="">All Positions</option>
                            <option value="QB">QB</option>
                            <option value="RB">RB</option>
                            <option value="WR">WR</option>
                            <option value="TE">TE</option>
                            <option value="K">K</option>
                            <option value="DEF">DEF</option>
                        </select>
                        <select id="projection-week">
                            ${Array.from({length: 18}, (_, i) => 
                                `<option value="${i + 1}" ${i + 1 === this.currentWeek ? 'selected' : ''}>Week ${i + 1}</option>`
                            ).join('')}
                        </select>
                        <button class="btn-primary" onclick="window.fantasyHelper.loadProjections()">
                            <i class="fas fa-sync"></i> Update
                        </button>
                    </div>
                </div>
                
                <div class="projections-content">
                    <div class="projections-table" id="projections-table">
                        <div class="loading">Loading player projections...</div>
                    </div>
                </div>
            </div>
        `;
        
        await this.loadProjectionsData();
    }

    async loadLeagueConfiguration(container) {
        console.log('⚙️ Loading League Configuration...');
        
        container.innerHTML = `
            <div class="league-configuration">
                <div class="section-header">
                    <h2><i class="fas fa-cog"></i> League Configuration</h2>
                    <div class="config-actions">
                        <button class="btn-secondary" onclick="window.fantasyHelper.importLeague()">
                            <i class="fas fa-download"></i> Import League
                        </button>
                        <button class="btn-primary" onclick="window.fantasyHelper.createNewLeague()">
                            <i class="fas fa-plus"></i> Create New League
                        </button>
                    </div>
                </div>
                
                <div class="config-content">
                    <div class="config-wizard" id="config-wizard">
                        <div class="wizard-steps">
                            <div class="step active" data-step="1">
                                <div class="step-number">1</div>
                                <div class="step-title">Basic Info</div>
                            </div>
                            <div class="step" data-step="2">
                                <div class="step-number">2</div>
                                <div class="step-title">Scoring</div>
                            </div>
                            <div class="step" data-step="3">
                                <div class="step-number">3</div>
                                <div class="step-title">Roster</div>
                            </div>
                            <div class="step" data-step="4">
                                <div class="step-number">4</div>
                                <div class="step-title">Rules</div>
                            </div>
                            <div class="step" data-step="5">
                                <div class="step-number">5</div>
                                <div class="step-title">Review</div>
                            </div>
                        </div>
                        
                        <div class="wizard-content" id="wizard-content">
                            <div class="step-content active" id="step-1">
                                <h3>Basic League Information</h3>
                                <div class="form-group">
                                    <label for="league-name">League Name</label>
                                    <input type="text" id="league-name" placeholder="Enter league name">
                                </div>
                                <div class="form-group">
                                    <label for="league-size">League Size</label>
                                    <select id="league-size">
                                        <option value="8">8 Teams</option>
                                        <option value="10">10 Teams</option>
                                        <option value="12" selected>12 Teams</option>
                                        <option value="14">14 Teams</option>
                                        <option value="16">16 Teams</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="league-type">League Type</label>
                                    <select id="league-type">
                                        <option value="redraft">Redraft</option>
                                        <option value="keeper">Keeper</option>
                                        <option value="dynasty">Dynasty</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="step-content" id="step-2">
                                <h3>Scoring System</h3>
                                <div class="scoring-presets">
                                    <button class="preset-btn active" data-preset="standard">Standard</button>
                                    <button class="preset-btn" data-preset="ppr">PPR</button>
                                    <button class="preset-btn" data-preset="half-ppr">Half PPR</button>
                                    <button class="preset-btn" data-preset="custom">Custom</button>
                                </div>
                                
                                <div class="scoring-details">
                                    <div class="scoring-section">
                                        <h4>Passing</h4>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label>Passing Yards</label>
                                                <input type="number" value="0.04" step="0.01">
                                                <span class="unit">pts/yard</span>
                                            </div>
                                            <div class="form-group">
                                                <label>Passing TDs</label>
                                                <input type="number" value="4" step="0.5">
                                                <span class="unit">pts</span>
                                            </div>
                                            <div class="form-group">
                                                <label>Interceptions</label>
                                                <input type="number" value="-2" step="0.5">
                                                <span class="unit">pts</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="scoring-section">
                                        <h4>Rushing</h4>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label>Rushing Yards</label>
                                                <input type="number" value="0.1" step="0.01">
                                                <span class="unit">pts/yard</span>
                                            </div>
                                            <div class="form-group">
                                                <label>Rushing TDs</label>
                                                <input type="number" value="6" step="0.5">
                                                <span class="unit">pts</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="scoring-section">
                                        <h4>Receiving</h4>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label>Receiving Yards</label>
                                                <input type="number" value="0.1" step="0.01">
                                                <span class="unit">pts/yard</span>
                                            </div>
                                            <div class="form-group">
                                                <label>Receiving TDs</label>
                                                <input type="number" value="6" step="0.5">
                                                <span class="unit">pts</span>
                                            </div>
                                            <div class="form-group">
                                                <label>Receptions</label>
                                                <input type="number" value="0" step="0.5" id="reception-points">
                                                <span class="unit">pts</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="step-content" id="step-3">
                                <h3>Roster Positions</h3>
                                <div class="roster-config">
                                    <div class="position-group">
                                        <h4>Starting Lineup</h4>
                                        <div class="position-row">
                                            <label>QB</label>
                                            <input type="number" value="1" min="0" max="3">
                                        </div>
                                        <div class="position-row">
                                            <label>RB</label>
                                            <input type="number" value="2" min="0" max="4">
                                        </div>
                                        <div class="position-row">
                                            <label>WR</label>
                                            <input type="number" value="2" min="0" max="4">
                                        </div>
                                        <div class="position-row">
                                            <label>TE</label>
                                            <input type="number" value="1" min="0" max="3">
                                        </div>
                                        <div class="position-row">
                                            <label>FLEX (RB/WR/TE)</label>
                                            <input type="number" value="1" min="0" max="3">
                                        </div>
                                        <div class="position-row">
                                            <label>K</label>
                                            <input type="number" value="1" min="0" max="2">
                                        </div>
                                        <div class="position-row">
                                            <label>DEF</label>
                                            <input type="number" value="1" min="0" max="2">
                                        </div>
                                    </div>
                                    
                                    <div class="position-group">
                                        <h4>Bench & IR</h4>
                                        <div class="position-row">
                                            <label>Bench</label>
                                            <input type="number" value="6" min="3" max="15">
                                        </div>
                                        <div class="position-row">
                                            <label>IR</label>
                                            <input type="number" value="0" min="0" max="5">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="step-content" id="step-4">
                                <h3>League Rules</h3>
                                <div class="rules-config">
                                    <div class="form-group">
                                        <label for="waiver-system">Waiver System</label>
                                        <select id="waiver-system">
                                            <option value="FAAB">FAAB (Free Agent Acquisition Budget)</option>
                                            <option value="Rolling">Rolling List</option>
                                            <option value="Reverse">Reverse Order of Standings</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group" id="faab-budget-group">
                                        <label for="faab-budget">FAAB Budget</label>
                                        <input type="number" id="faab-budget" value="100" min="50" max="1000">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="trade-deadline">Trade Deadline</label>
                                        <input type="date" id="trade-deadline" value="2024-11-15">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Playoff Weeks</label>
                                        <div class="checkbox-group">
                                            <label><input type="checkbox" value="14"> Week 14</label>
                                            <label><input type="checkbox" value="15" checked> Week 15</label>
                                            <label><input type="checkbox" value="16" checked> Week 16</label>
                                            <label><input type="checkbox" value="17" checked> Week 17</label>
                                            <label><input type="checkbox" value="18"> Week 18</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="step-content" id="step-5">
                                <h3>Review & Confirm</h3>
                                <div class="config-summary" id="config-summary">
                                    <div class="summary-section">
                                        <h4>League Information</h4>
                                        <p><strong>Name:</strong> <span id="summary-name">My Fantasy League</span></p>
                                        <p><strong>Size:</strong> <span id="summary-size">12</span> teams</p>
                                        <p><strong>Type:</strong> <span id="summary-type">Redraft</span></p>
                                    </div>
                                    
                                    <div class="summary-section">
                                        <h4>Scoring System</h4>
                                        <p><strong>Format:</strong> <span id="summary-scoring">Standard</span></p>
                                        <p><strong>Reception Points:</strong> <span id="summary-ppr">0</span> per reception</p>
                                    </div>
                                    
                                    <div class="summary-section">
                                        <h4>Roster Setup</h4>
                                        <p><strong>Starting Lineup:</strong> <span id="summary-starters">1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX, 1 K, 1 DEF</span></p>
                                        <p><strong>Bench:</strong> <span id="summary-bench">6</span> players</p>
                                    </div>
                                    
                                    <div class="summary-section">
                                        <h4>League Rules</h4>
                                        <p><strong>Waivers:</strong> <span id="summary-waivers">FAAB ($100)</span></p>
                                        <p><strong>Trade Deadline:</strong> <span id="summary-deadline">November 15, 2024</span></p>
                                        <p><strong>Playoffs:</strong> <span id="summary-playoffs">Weeks 15-17</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="wizard-navigation">
                            <button class="btn-secondary" id="prev-btn" onclick="window.fantasyHelper.previousStep()" disabled>
                                <i class="fas fa-arrow-left"></i> Previous
                            </button>
                            <button class="btn-primary" id="next-btn" onclick="window.fantasyHelper.nextStep()">
                                Next <i class="fas fa-arrow-right"></i>
                            </button>
                            <button class="btn-success" id="finish-btn" onclick="window.fantasyHelper.finishConfiguration()" style="display: none;">
                                <i class="fas fa-check"></i> Create League
                            </button>
                        </div>
                    </div>
                    
                    <div class="import-league" id="import-league" style="display: none;">
                        <h3>Import Existing League</h3>
                        <div class="platform-selection">
                            <div class="platform-option" data-platform="espn">
                                <img src="/images/espn-logo.png" alt="ESPN">
                                <span>ESPN</span>
                            </div>
                            <div class="platform-option" data-platform="yahoo">
                                <img src="/images/yahoo-logo.png" alt="Yahoo">
                                <span>Yahoo</span>
                            </div>
                            <div class="platform-option" data-platform="sleeper">
                                <img src="/images/sleeper-logo.png" alt="Sleeper">
                                <span>Sleeper</span>
                            </div>
                            <div class="platform-option" data-platform="nfl">
                                <img src="/images/nfl-logo.png" alt="NFL.com">
                                <span>NFL.com</span>
                            </div>
                        </div>
                        
                        <div class="import-form" id="import-form" style="display: none;">
                            <div class="form-group">
                                <label for="import-league-id">League ID</label>
                                <input type="text" id="import-league-id" placeholder="Enter your league ID">
                            </div>
                            <div class="form-group">
                                <label for="import-username">Username (if required)</label>
                                <input type="text" id="import-username" placeholder="Your username">
                            </div>
                            <div class="form-group">
                                <label for="import-password">Password (if required)</label>
                                <input type="password" id="import-password" placeholder="Your password">
                            </div>
                            <button class="btn-primary" onclick="window.fantasyHelper.processImport()">
                                <i class="fas fa-download"></i> Import League
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.setupLeagueConfigurationEvents();
    }

    setupLeagueConfigurationEvents() {
        // Setup wizard navigation and form interactions
        this.currentWizardStep = 1;
        this.maxWizardStep = 5;
        
        // Scoring preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.applyScoringPreset(e.target.dataset.preset);
            });
        });
        
        // Platform selection for import
        document.querySelectorAll('.platform-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.platform-option').forEach(o => o.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                document.getElementById('import-form').style.display = 'block';
            });
        });
        
        // Waiver system change
        document.getElementById('waiver-system').addEventListener('change', (e) => {
            const faabGroup = document.getElementById('faab-budget-group');
            faabGroup.style.display = e.target.value === 'FAAB' ? 'block' : 'none';
        });
    }

    applyScoringPreset(preset) {
        const receptionPoints = document.getElementById('reception-points');
        
        switch (preset) {
            case 'ppr':
                receptionPoints.value = '1';
                break;
            case 'half-ppr':
                receptionPoints.value = '0.5';
                break;
            case 'standard':
                receptionPoints.value = '0';
                break;
            case 'custom':
                // Let user customize
                break;
        }
    }

    nextStep() {
        if (this.currentWizardStep < this.maxWizardStep) {
            // Hide current step
            document.getElementById(`step-${this.currentWizardStep}`).classList.remove('active');
            document.querySelector(`[data-step="${this.currentWizardStep}"]`).classList.remove('active');
            
            // Show next step
            this.currentWizardStep++;
            document.getElementById(`step-${this.currentWizardStep}`).classList.add('active');
            document.querySelector(`[data-step="${this.currentWizardStep}"]`).classList.add('active');
            
            // Update navigation buttons
            document.getElementById('prev-btn').disabled = false;
            
            if (this.currentWizardStep === this.maxWizardStep) {
                document.getElementById('next-btn').style.display = 'none';
                document.getElementById('finish-btn').style.display = 'inline-block';
                this.updateConfigSummary();
            }
        }
    }

    previousStep() {
        if (this.currentWizardStep > 1) {
            // Hide current step
            document.getElementById(`step-${this.currentWizardStep}`).classList.remove('active');
            document.querySelector(`[data-step="${this.currentWizardStep}"]`).classList.remove('active');
            
            // Show previous step
            this.currentWizardStep--;
            document.getElementById(`step-${this.currentWizardStep}`).classList.add('active');
            document.querySelector(`[data-step="${this.currentWizardStep}"]`).classList.add('active');
            
            // Update navigation buttons
            if (this.currentWizardStep === 1) {
                document.getElementById('prev-btn').disabled = true;
            }
            
            document.getElementById('next-btn').style.display = 'inline-block';
            document.getElementById('finish-btn').style.display = 'none';
        }
    }

    updateConfigSummary() {
        // Update summary with current form values
        document.getElementById('summary-name').textContent = 
            document.getElementById('league-name').value || 'My Fantasy League';
        document.getElementById('summary-size').textContent = 
            document.getElementById('league-size').value;
        document.getElementById('summary-type').textContent = 
            document.getElementById('league-type').value;
        
        const receptionPoints = document.getElementById('reception-points').value;
        let scoringFormat = 'Standard';
        if (receptionPoints === '1') scoringFormat = 'PPR';
        else if (receptionPoints === '0.5') scoringFormat = 'Half PPR';
        
        document.getElementById('summary-scoring').textContent = scoringFormat;
        document.getElementById('summary-ppr').textContent = receptionPoints;
        
        const waiverSystem = document.getElementById('waiver-system').value;
        const faabBudget = document.getElementById('faab-budget').value;
        document.getElementById('summary-waivers').textContent = 
            waiverSystem === 'FAAB' ? `FAAB ($${faabBudget})` : waiverSystem;
        
        const tradeDeadline = new Date(document.getElementById('trade-deadline').value);
        document.getElementById('summary-deadline').textContent = 
            tradeDeadline.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        const playoffWeeks = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => `Week ${cb.value}`).join(', ');
        document.getElementById('summary-playoffs').textContent = playoffWeeks;
    }

    importLeague() {
        document.getElementById('config-wizard').style.display = 'none';
        document.getElementById('import-league').style.display = 'block';
    }

    createNewLeague() {
        document.getElementById('config-wizard').style.display = 'block';
        document.getElementById('import-league').style.display = 'none';
    }

    async processImport() {
        const platform = document.querySelector('.platform-option.selected')?.dataset.platform;
        const leagueId = document.getElementById('import-league-id').value;
        const username = document.getElementById('import-username').value;
        const password = document.getElementById('import-password').value;
        
        if (!platform || !leagueId) {
            alert('Please select a platform and enter your league ID');
            return;
        }
        
        console.log(`Importing league from ${platform}...`);
        // Would call API to import league settings
        alert(`League import from ${platform} initiated! Settings will be populated automatically.`);
        
        // Switch back to wizard with imported settings
        this.createNewLeague();
    }

    async finishConfiguration() {
        console.log('Creating fantasy league...');
        // Would call API to create league with all settings
        alert('Fantasy league created successfully! You can now start managing your team.');
    }

    // API Methods
    async loadDashboardData() {
        try {
            // Mock data for now - would call real API
            const mockLineup = this.generateMockLineup();
            const mockWaivers = this.generateMockWaivers();
            const mockProjections = this.generateMockProjections();
            
            this.updateLineupPreview(mockLineup);
            this.updateWaiverTargets(mockWaivers);
            this.updateProjectionsSummary(mockProjections);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    generateMockLineup() {
        return {
            QB: { name: 'Josh Allen', team: 'BUF', projection: 24.5 },
            RB1: { name: 'Saquon Barkley', team: 'PHI', projection: 18.2 },
            RB2: { name: 'Derrick Henry', team: 'BAL', projection: 16.8 },
            WR1: { name: 'CeeDee Lamb', team: 'DAL', projection: 15.3 },
            WR2: { name: 'A.J. Brown', team: 'PHI', projection: 14.7 },
            TE: { name: 'Travis Kelce', team: 'KC', projection: 12.4 },
            FLEX: { name: 'Amon-Ra St. Brown', team: 'DET', projection: 13.9 },
            K: { name: 'Justin Tucker', team: 'BAL', projection: 8.5 },
            DEF: { name: 'Pittsburgh Steelers', team: 'PIT', projection: 9.2 }
        };
    }

    generateMockWaivers() {
        return [
            { name: 'Jaylen Warren', team: 'PIT', position: 'RB', opportunity: 8.5, reasoning: 'Increased workload expected' },
            { name: 'Romeo Doubs', team: 'GB', position: 'WR', opportunity: 7.8, reasoning: 'Favorable upcoming schedule' },
            { name: 'Tyler Higbee', team: 'LAR', position: 'TE', opportunity: 7.2, reasoning: 'Red zone target increase' }
        ];
    }

    generateMockProjections() {
        return [
            { name: 'Josh Allen', position: 'QB', projection: 24.5, matchup: 'vs MIA', rating: 8.5 },
            { name: 'Lamar Jackson', position: 'QB', projection: 23.8, matchup: 'vs CIN', rating: 7.2 },
            { name: 'Saquon Barkley', position: 'RB', projection: 18.2, matchup: 'vs WAS', rating: 9.1 }
        ];
    }

    updateLineupPreview(lineup) {
        const container = document.getElementById('lineup-preview');
        if (!container) return;
        
        container.innerHTML = `
            <div class="lineup-positions">
                ${Object.entries(lineup).map(([pos, player]) => `
                    <div class="position-slot">
                        <div class="position-label">${pos}</div>
                        <div class="player-info">
                            <div class="player-name">${player.name}</div>
                            <div class="player-team">${player.team}</div>
                            <div class="player-projection">${player.projection} pts</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="lineup-total">
                Total Projection: ${Object.values(lineup).reduce((sum, p) => sum + p.projection, 0).toFixed(1)} pts
            </div>
        `;
    }

    updateWaiverTargets(targets) {
        const container = document.getElementById('waiver-targets');
        if (!container) return;
        
        container.innerHTML = targets.map(target => `
            <div class="waiver-target">
                <div class="target-info">
                    <div class="target-name">${target.name} (${target.position})</div>
                    <div class="target-team">${target.team}</div>
                </div>
                <div class="target-score">${target.opportunity}/10</div>
                <div class="target-reasoning">${target.reasoning}</div>
            </div>
        `).join('');
    }

    updateProjectionsSummary(projections) {
        const container = document.getElementById('projections-summary');
        if (!container) return;
        
        container.innerHTML = projections.map(proj => `
            <div class="projection-item">
                <div class="proj-player">${proj.name} (${proj.position})</div>
                <div class="proj-matchup">${proj.matchup}</div>
                <div class="proj-points">${proj.projection} pts</div>
                <div class="proj-rating">Rating: ${proj.rating}/10</div>
            </div>
        `).join('');
    }

    // Action Methods
    async optimizeLineup() {
        console.log('⚡ Optimizing lineup...');
        // Would call API to optimize lineup
        alert('Lineup optimization complete! Check the Lineup Optimizer for details.');
    }

    async refreshWaivers() {
        console.log('🔄 Refreshing waiver wire...');
        await this.loadWaiverTargets();
    }

    async changeWeek(week) {
        this.currentWeek = parseInt(week);
        console.log(`📅 Changed to week ${this.currentWeek}`);
        // Reload current view data
    }

    async runOptimization() {
        console.log('🎯 Running lineup optimization...');
        // Would call optimization API
        alert('Lineup optimization in progress...');
    }

    async analyzeWaivers() {
        console.log('🔍 Analyzing waiver wire...');
        await this.loadWaiverTargets();
    }

    async analyzeTrade() {
        console.log('📊 Analyzing trade...');
        // Would call trade analysis API
        alert('Trade analysis complete!');
    }

    async loadProjections() {
        console.log('📈 Loading projections...');
        await this.loadProjectionsData();
    }

    async loadCurrentLineup() {
        // Load user's current lineup
        console.log('Loading current lineup...');
    }

    async loadWaiverTargets() {
        // Load waiver wire targets
        console.log('Loading waiver targets...');
        const mockTargets = this.generateMockWaivers();
        
        const container = document.getElementById('waiver-targets-list');
        if (container) {
            container.innerHTML = mockTargets.map(target => `
                <div class="waiver-target-card">
                    <div class="target-header">
                        <h4>${target.name}</h4>
                        <span class="position-badge">${target.position}</span>
                        <span class="team-badge">${target.team}</span>
                    </div>
                    <div class="target-score">
                        Opportunity Score: <strong>${target.opportunity}/10</strong>
                    </div>
                    <div class="target-reasoning">${target.reasoning}</div>
                    <div class="target-actions">
                        <button class="btn-primary btn-small">Add to Watchlist</button>
                        <button class="btn-secondary btn-small">Set FAAB Bid</button>
                    </div>
                </div>
            `).join('');
        }
    }

    async loadProjectionsData() {
        // Load player projections
        console.log('Loading projections data...');
        const mockProjections = this.generateMockProjections();
        
        const container = document.getElementById('projections-table');
        if (container) {
            container.innerHTML = `
                <table class="projections-table">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Position</th>
                            <th>Matchup</th>
                            <th>Projection</th>
                            <th>Rating</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mockProjections.map(proj => `
                            <tr>
                                <td>${proj.name}</td>
                                <td>${proj.position}</td>
                                <td>${proj.matchup}</td>
                                <td><strong>${proj.projection} pts</strong></td>
                                <td>${proj.rating}/10</td>
                                <td>
                                    <button class="btn-small">View Details</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }
}

// Initialize Fantasy Football Helper
document.addEventListener('DOMContentLoaded', () => {
    // Wait for main app to load first
    setTimeout(() => {
        window.fantasyHelper = new FantasyFootballHelper();
    }, 1000);
});

console.log('✅ Fantasy Football Helper script loaded');    /
/ Mobile-Specific Functionality
    initializeMobileFeatures() {
        this.setupTouchGestures();
        this.setupPullToRefresh();
        this.setupOfflineCapability();
        this.setupPushNotifications();
        this.setupMobileNavigation();
    }

    setupTouchGestures() {
        // Swipe gestures for player cards
        let startX, startY, currentX, currentY;
        
        document.addEventListener('touchstart', (e) => {
            const card = e.target.closest('.waiver-target-card, .projection-item');
            if (!card) return;
            
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            card.classList.add('swipeable');
        });
        
        document.addEventListener('touchmove', (e) => {
            const card = e.target.closest('.swipeable');
            if (!card) return;
            
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
            
            const deltaX = startX - currentX;
            const deltaY = Math.abs(startY - currentY);
            
            // Only swipe horizontally if vertical movement is minimal
            if (deltaY < 50 && deltaX > 50) {
                e.preventDefault();
                card.style.transform = `translateX(-${Math.min(deltaX, 100)}px)`;
                
                if (deltaX > 80) {
                    card.classList.add('swiped');
                }
            }
        });
        
        document.addEventListener('touchend', (e) => {
            const card = e.target.closest('.swipeable');
            if (!card) return;
            
            setTimeout(() => {
                card.style.transform = '';
                card.classList.remove('swipeable', 'swiped');
            }, 300);
        });
    }

    setupPullToRefresh() {
        let startY, currentY, isPulling = false;
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && startY) {
                currentY = e.touches[0].clientY;
                const pullDistance = currentY - startY;
                
                if (pullDistance > 0) {
                    isPulling = true;
                    const container = document.querySelector('.content-container');
                    if (container) {
                        container.classList.add('pull-to-refresh');
                        if (pullDistance > 60) {
                            container.classList.add('pulling');
                        }
                    }
                }
            }
        });
        
        document.addEventListener('touchend', () => {
            if (isPulling) {
                const container = document.querySelector('.content-container');
                if (container && container.classList.contains('pulling')) {
                    this.refreshCurrentView();
                }
                
                if (container) {
                    container.classList.remove('pull-to-refresh', 'pulling');
                }
                
                isPulling = false;
                startY = null;
            }
        });
    }

    async refreshCurrentView() {
        this.showToast('Refreshing...', 'info');
        
        // Simulate refresh delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh current view data
        const activeView = document.querySelector('.fantasy-view.active');
        if (activeView) {
            const viewId = activeView.id;
            if (viewId.includes('dashboard')) {
                await this.loadDashboardData();
            } else if (viewId.includes('waiver')) {
                await this.loadWaiverTargets();
            } else if (viewId.includes('projections')) {
                await this.loadProjectionsData();
            }
        }
        
        this.showToast('Updated!', 'success');
    }

    setupOfflineCapability() {
        // Service Worker registration for offline functionality
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/fantasy-sw.js')
                .then(registration => {
                    console.log('Fantasy SW registered:', registration);
                })
                .catch(error => {
                    console.log('Fantasy SW registration failed:', error);
                });
        }
        
        // Cache key data for offline use
        this.cacheFantasyData();
        
        // Handle online/offline events
        window.addEventListener('online', () => {
            this.showToast('Back online!', 'success');
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.showToast('You\'re offline. Some features may be limited.', 'warning');
        });
    }

    cacheFantasyData() {
        // Cache essential fantasy data in localStorage
        const cacheData = {
            lastUpdated: new Date().toISOString(),
            dashboardData: this.generateMockLineup(),
            waiverTargets: this.generateMockWaivers(),
            projections: this.generateMockProjections()
        };
        
        localStorage.setItem('fantasyCache', JSON.stringify(cacheData));
    }

    async syncOfflineData() {
        // Sync any offline changes when back online
        const offlineActions = JSON.parse(localStorage.getItem('offlineActions') || '[]');
        
        for (const action of offlineActions) {
            try {
                await this.processOfflineAction(action);
            } catch (error) {
                console.error('Failed to sync offline action:', error);
            }
        }
        
        // Clear offline actions after sync
        localStorage.removeItem('offlineActions');
    }

    async processOfflineAction(action) {
        // Process actions that were queued while offline
        switch (action.type) {
            case 'LINEUP_CHANGE':
                // Sync lineup changes
                break;
            case 'WAIVER_CLAIM':
                // Sync waiver claims
                break;
            case 'TRADE_PROPOSAL':
                // Sync trade proposals
                break;
        }
    }

    setupPushNotifications() {
        // Request notification permission
        if ('Notification' in window && 'serviceWorker' in navigator) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Push notifications enabled');
                    this.subscribeToPushNotifications();
                }
            });
        }
    }

    async subscribeToPushNotifications() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
            });
            
            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async sendSubscriptionToServer(subscription) {
        // Send push subscription to your server
        console.log('Push subscription:', subscription);
        // await fetch('/api/v1/fantasy/push-subscription', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(subscription)
        // });
    }

    setupMobileNavigation() {
        // Bottom navigation for mobile
        this.createMobileBottomNav();
        
        // Floating Action Button
        this.createFloatingActionButton();
        
        // Bottom sheet for actions
        this.setupBottomSheet();
    }

    createMobileBottomNav() {
        if (window.innerWidth <= 768) {
            const bottomNav = document.createElement('div');
            bottomNav.className = 'mobile-bottom-nav';
            bottomNav.innerHTML = `
                <div class="nav-item" data-view="fantasy-dashboard">
                    <i class="fas fa-home"></i>
                    <span>Home</span>
                </div>
                <div class="nav-item" data-view="fantasy-lineup">
                    <i class="fas fa-users"></i>
                    <span>Lineup</span>
                </div>
                <div class="nav-item" data-view="fantasy-waiver">
                    <i class="fas fa-search"></i>
                    <span>Waivers</span>
                </div>
                <div class="nav-item" data-view="fantasy-trades">
                    <i class="fas fa-exchange-alt"></i>
                    <span>Trades</span>
                </div>
            `;
            
            document.body.appendChild(bottomNav);
            
            // Add click handlers
            bottomNav.addEventListener('click', (e) => {
                const navItem = e.target.closest('.nav-item');
                if (navItem) {
                    const view = navItem.dataset.view;
                    this.switchToFantasyView(view);
                    
                    // Update active state
                    bottomNav.querySelectorAll('.nav-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    navItem.classList.add('active');
                }
            });
        }
    }

    createFloatingActionButton() {
        if (window.innerWidth <= 768) {
            const fab = document.createElement('button');
            fab.className = 'fab';
            fab.innerHTML = '<i class="fas fa-plus"></i>';
            fab.addEventListener('click', () => {
                this.showBottomSheet();
            });
            
            document.body.appendChild(fab);
        }
    }

    setupBottomSheet() {
        const bottomSheet = document.createElement('div');
        bottomSheet.className = 'bottom-sheet';
        bottomSheet.id = 'mobile-bottom-sheet';
        bottomSheet.innerHTML = `
            <div class="bottom-sheet-header">
                <h3>Quick Actions</h3>
                <button onclick="window.fantasyHelper.hideBottomSheet()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="bottom-sheet-content">
                <div class="quick-action" onclick="window.fantasyHelper.optimizeLineup()">
                    <i class="fas fa-magic"></i>
                    <span>Optimize Lineup</span>
                </div>
                <div class="quick-action" onclick="window.fantasyHelper.refreshWaivers()">
                    <i class="fas fa-sync"></i>
                    <span>Refresh Waivers</span>
                </div>
                <div class="quick-action" onclick="window.fantasyHelper.analyzeTrade()">
                    <i class="fas fa-calculator"></i>
                    <span>Analyze Trade</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(bottomSheet);
        
        // Close on backdrop click
        bottomSheet.addEventListener('click', (e) => {
            if (e.target === bottomSheet) {
                this.hideBottomSheet();
            }
        });
    }

    showBottomSheet() {
        const bottomSheet = document.getElementById('mobile-bottom-sheet');
        if (bottomSheet) {
            bottomSheet.classList.add('open');
        }
    }

    hideBottomSheet() {
        const bottomSheet = document.getElementById('mobile-bottom-sheet');
        if (bottomSheet) {
            bottomSheet.classList.remove('open');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    // Mobile-optimized data loading
    async loadMobileOptimizedData() {
        // Load only essential data for mobile to improve performance
        if (navigator.connection && navigator.connection.effectiveType === 'slow-2g') {
            // Load minimal data for very slow connections
            return this.loadMinimalData();
        } else {
            // Load full data for better connections
            return this.loadFullData();
        }
    }

    async loadMinimalData() {
        // Load only the most essential data
        return {
            lineup: this.generateMockLineup(),
            topWaivers: this.generateMockWaivers().slice(0, 3),
            topProjections: this.generateMockProjections().slice(0, 5)
        };
    }

    async loadFullData() {
        // Load complete data set
        return {
            lineup: this.generateMockLineup(),
            waivers: this.generateMockWaivers(),
            projections: this.generateMockProjections(),
            trades: []
        };
    }

    // Responsive image loading
    loadResponsiveImages() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers without IntersectionObserver
            images.forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
            });
        }
    }

    // Handle device orientation changes
    handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Recalculate layouts after orientation change
                this.recalculateLayouts();
            }, 100);
        });
    }

    recalculateLayouts() {
        // Trigger layout recalculation for responsive elements
        const event = new Event('resize');
        window.dispatchEvent(event);
    }

    // Initialize mobile features when DOM is ready
    initMobile() {
        if (window.innerWidth <= 768) {
            this.initializeMobileFeatures();
            this.loadResponsiveImages();
            this.handleOrientationChange();
        }
    }
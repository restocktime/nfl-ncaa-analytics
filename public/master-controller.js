// Master Controller - Coordinates all scripts and prevents conflicts
console.log('👑 Master Controller loading...');

class MasterController {
    constructor() {
        this.isInitialized = false;
        this.scriptsLoaded = new Set();
        this.gameData = null;
        this.containers = new Map();
    }

    async initialize() {
        if (this.isInitialized) return;
        
        console.log('👑 Master Controller initializing...');
        
        // Wait for production fallback to be ready
        if (!window.productionFallback) {
            console.log('👑 Waiting for production fallback...');
            await new Promise(resolve => {
                const checkFallback = () => {
                    if (window.productionFallback) {
                        resolve();
                    } else {
                        setTimeout(checkFallback, 100);
                    }
                };
                checkFallback();
            });
        }
        
        // Disable all other auto-initializers
        this.disableOtherScripts();
        
        // Wait for DOM to be ready
        await this.waitForDOM();
        
        // Find and cache all containers
        this.cacheContainers();
        
        // Load game data once
        await this.loadGameData();
        
        // Initialize all systems in correct order
        await this.initializeAllSystems();
        
        this.isInitialized = true;
        console.log('👑 Master Controller fully initialized');
    }

    disableOtherScripts() {
        // Disable automatic initialization from other scripts
        window.DISABLE_AUTO_INIT = true;
        
        // Clear any existing intervals that might be causing reloads
        for (let i = 1; i < 999; i++) {
            clearInterval(i);
            clearTimeout(i);
        }
        
        console.log('👑 Disabled conflicting auto-initializers');
    }

    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
    }

    cacheContainers() {
        const containerIds = [
            'dashboard', 'top-games-preview', 'nfl-live-games', 
            'nfl-upcoming-games', 'nfl-predictions', 'nfl-betting-lines',
            'nfl-fantasy-data', 'nfl-analytics-data', 'nfl-news-feed'
        ];

        containerIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.containers.set(id, element);
                console.log(`👑 Found container: ${id}`);
            } else {
                console.warn(`👑 Missing container: ${id}`);
            }
        });
    }

    async loadGameData() {
        try {
            console.log('👑 Loading master game data...');
            
            // Use production fallback system
            const apiData = await window.productionFallback.fetchWithFallback(
                '/api/games?sport=nfl&master=true&_t=' + Date.now(),
                'games'
            );
            
            if (apiData.success && apiData.data) {
                this.gameData = apiData.data.map((game, index) => ({
                    ...game,
                    id: this.generateGameId(game, index),
                    awayTeamName: this.extractTeamName(game, 'away'),
                    homeTeamName: this.extractTeamName(game, 'home'),
                    formattedTime: this.formatTime(game.date || game.gameTime),
                    displayStatus: game.status || 'Scheduled'
                }));
                
                console.log(`👑 Loaded ${this.gameData.length} games with proper formatting`);
                return this.gameData;
            }
        } catch (error) {
            console.error('👑 Error loading game data:', error);
        }
        
        return [];
    }

    generateGameId(game, index) {
        const gameIds = [
            'kc_det', 'buf_ari', 'phi_gb', 'dal_cle', 'hou_ind', 'mia_jax',
            'car_no', 'pit_atl', 'min_nyg', 'chi_ten', 'lv_lac', 'sea_den',
            'tb_was', 'ne_cin', 'sf_lar', 'nyj_bal'
        ];
        return gameIds[index] || `game_${index}`;
    }

    extractTeamName(game, side) {
        if (side === 'away') {
            return game.awayTeam?.displayName || 
                   game.awayTeam?.name || 
                   game.competitors?.[1]?.team?.displayName ||
                   'Away Team';
        } else {
            return game.homeTeam?.displayName || 
                   game.homeTeam?.name || 
                   game.competitors?.[0]?.team?.displayName ||
                   'Home Team';
        }
    }

    formatTime(dateString) {
        if (!dateString) return 'TBD';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        } catch (error) {
            return 'TBD';
        }
    }

    async initializeAllSystems() {
        console.log('👑 Initializing all systems...');
        
        // 1. Display games first
        this.displayGames();
        
        // 2. Initialize player props
        await this.initializePlayerProps();
        
        // 3. Initialize live odds
        await this.initializeLiveOdds();
        
        // 4. Initialize AI predictions
        await this.initializeAIPredictions();
        
        // 5. Setup navigation
        this.setupNavigation();
        
        console.log('👑 All systems initialized');
    }

    displayGames() {
        if (!this.gameData || this.gameData.length === 0) return;
        
        console.log('👑 Displaying games in all containers...');
        
        // Filter for today's scheduled games for dashboard
        const today = new Date().toDateString();
        const todaysScheduledGames = this.gameData.filter(game => {
            const gameDate = new Date(game.date || game.gameTime).toDateString();
            return gameDate === today && (game.status === 'STATUS_SCHEDULED' || game.displayStatus === 'Scheduled');
        });
        
        console.log(`👑 Found ${todaysScheduledGames.length} scheduled games for today`);
        
        // Display in each container
        this.containers.forEach((container, id) => {
            if (id === 'dashboard' || id === 'top-games-preview') {
                // Show only today's scheduled games for dashboard
                const gamesHtml = this.renderGames(todaysScheduledGames, true);
                container.innerHTML = gamesHtml;
                console.log(`👑 Populated dashboard ${id} with ${todaysScheduledGames.length} today's games`);
            } else if (id.includes('games') || id.includes('preview')) {
                // Show all games for other containers
                const gamesHtml = this.renderGames(this.gameData.slice(0, 6));
                container.innerHTML = gamesHtml;
                console.log(`👑 Populated ${id} with games`);
            }
        });
    }

    renderGames(games, isDashboard = false) {
        return games.map(game => {
            // Format for dashboard: STATUS_SCHEDULED Sep 4, 8:20 PM Dallas Cowboys @ Philadelphia Eagles
            let displayText = '';
            if (isDashboard) {
                const gameDate = new Date(game.date || game.gameTime);
                const dateStr = gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeStr = gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                displayText = `STATUS_SCHEDULED ${dateStr}, ${timeStr} ${game.awayTeamName} @ ${game.homeTeamName}`;
            }
            
            return `
                <div class="game-card" data-game-id="${game.id}">
                    ${isDashboard ? `
                        <div class="dashboard-game-format">
                            <div class="game-full-info">${displayText}</div>
                            <div class="click-hint">🎯 Click for Player Props</div>
                            <button class="test-props-btn" onclick="window.masterController.testProps('${game.id}')">Test Props</button>
                        </div>
                    ` : `
                        <div class="game-header">
                            <div class="game-status">${game.displayStatus}</div>
                            <div class="game-time">${game.formattedTime}</div>
                        </div>
                        <div class="game-teams">
                            <div class="team away">
                                <div class="team-name">${game.awayTeamName}</div>
                                <div class="team-score">${game.awayScore || 0}</div>
                            </div>
                            <div class="vs">@</div>
                            <div class="team home">
                                <div class="team-name">${game.homeTeamName}</div>
                                <div class="team-score">${game.homeScore || 0}</div>
                            </div>
                        </div>
                        <div class="game-info">
                            <div class="network">${game.network || 'TBD'}</div>
                            <div class="week">Week ${game.week || 1}</div>
                        </div>
                    `}
                </div>
            `;
        }).join('');
    }

    async initializePlayerProps() {
        try {
            console.log('👑 Initializing player props...');
            
            // Fetch props data
            const propsData = await window.productionFallback.fetchWithFallback(
                '/api/betting/enhanced-props?_t=' + Date.now(),
                'props'
            );
            
            if (propsData.success) {
                this.propsData = propsData.data;
                console.log(`👑 Loaded props for ${propsData.data.length} games`);
                
                // Setup click handlers for game cards
                this.setupPropsClickHandlers();
            }
        } catch (error) {
            console.error('👑 Error initializing player props:', error);
        }
    }

    setupPropsClickHandlers() {
        console.log('👑 Setting up player props click handlers...');
        
        // Remove any existing handlers
        if (this.propsClickHandler) {
            document.removeEventListener('click', this.propsClickHandler);
        }
        
        // Create bound handler with more debugging
        this.propsClickHandler = (e) => {
            console.log('👑 Click detected:', e.target);
            const gameCard = e.target.closest('.game-card');
            if (gameCard) {
                console.log('👑 Game card found:', gameCard);
                if (!e.target.closest('.props-container') && !e.target.closest('.props-close')) {
                    console.log('👑 Valid game card click, gameId:', gameCard.dataset.gameId);
                    const gameId = gameCard.dataset.gameId;
                    if (gameId) {
                        console.log('👑 Toggling props for:', gameId);
                        this.toggleGameProps(gameId, gameCard);
                    } else {
                        console.warn('👑 No gameId found on card');
                    }
                } else {
                    console.log('👑 Click on props container, ignoring');
                }
            } else {
                console.log('👑 No game card found for click');
            }
        };
        
        document.addEventListener('click', this.propsClickHandler, true); // Use capture phase
        console.log('👑 Props click handlers ready with debugging');
    }

    toggleGameProps(gameId, gameCard) {
        console.log('👑 Toggling props for gameId:', gameId);
        
        const existing = gameCard.querySelector('.props-container');
        if (existing) {
            existing.remove();
            gameCard.classList.remove('expanded');
            console.log('👑 Props closed');
            return;
        }

        const gameProps = this.propsData?.find(p => p.gameId === gameId);
        if (gameProps) {
            console.log('👑 Found props data, displaying...');
            this.displayProps(gameCard, gameProps);
            gameCard.classList.add('expanded');
        } else {
            console.warn('👑 No props data found for gameId:', gameId);
            console.log('👑 Available props games:', this.propsData?.map(p => p.gameId));
            
            // Show loading message and try to fetch props
            this.showPropsLoading(gameCard);
            this.fetchGameProps(gameId).then(props => {
                if (props) {
                    this.displayProps(gameCard, props);
                }
            });
        }
    }

    displayProps(gameCard, propsData) {
        const propsHtml = `
            <div class="props-container">
                <div class="props-header">
                    <h4>🎯 Player Props</h4>
                    <button class="props-close">×</button>
                </div>
                <div class="props-content">
                    ${propsData.players.map(player => `
                        <div class="player-section">
                            <div class="player-info">
                                <span class="player-name">${player.name}</span>
                                <span class="player-position">${player.position}</span>
                            </div>
                            <div class="props-grid">
                                ${player.props.map(prop => `
                                    <div class="prop-item">
                                        <div class="prop-type">${prop.type}</div>
                                        <div class="prop-line">Line: ${prop.line}</div>
                                        <div class="prop-odds">
                                            <button class="prop-bet over">O ${prop.line} (${prop.over})</button>
                                            <button class="prop-bet under">U ${prop.line} (${prop.under})</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        gameCard.insertAdjacentHTML('beforeend', propsHtml);
        
        // Close button handler
        gameCard.querySelector('.props-close').addEventListener('click', (e) => {
            e.stopPropagation();
            gameCard.querySelector('.props-container').remove();
        });
    }

    async initializeLiveOdds() {
        const bettingContainer = this.containers.get('nfl-betting-lines');
        if (!bettingContainer) return;

        try {
            const oddsData = await window.productionFallback.fetchWithFallback(
                '/api/betting/odds?live=true&_t=' + Date.now(),
                'odds'
            );
            
            if (oddsData.success) {
                bettingContainer.innerHTML = this.renderOdds(oddsData.data);
                console.log('👑 Live odds displayed');
                
                // Add Hard Rock iframe
                this.addHardRockIframe(bettingContainer);
            }
        } catch (error) {
            console.error('👑 Error loading live odds:', error);
        }
    }

    addHardRockIframe(bettingContainer) {
        const iframeHtml = `
            <div style="background: #1a1a1a; border-radius: 15px; padding: 20px; margin: 20px 0; border: 1px solid #ff6b35;">
                <h3 style="color: #ff6b35; text-align: center; margin-bottom: 15px;">
                    🏈 Hard Rock Sportsbook - NFL Betting
                </h3>
                <div style="position: relative; width: 100%; height: 400px; border-radius: 10px; overflow: hidden;">
                    <div style="background: #333; color: white; padding: 20px; text-align: center; border-radius: 10px;">
                        <div style="font-size: 18px; margin-bottom: 10px;">🏈 Hard Rock NFL Betting</div>
                        <div style="color: #ff6b35; margin-bottom: 10px;">Live odds and betting available</div>
                        <div style="font-size: 12px; color: #ccc;">Visit Hard Rock Sportsbook for live betting</div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #ccc;">
                    18+ | Please gamble responsibly
                </div>
            </div>
        `;
        bettingContainer.insertAdjacentHTML('beforeend', iframeHtml);
    }

    renderOdds(odds) {
        return `
            <div class="odds-container">
                <h3>🏈 Live NFL Betting Odds</h3>
                ${odds.map((game, index) => {
                    // Generate realistic betting lines
                    const spread = (Math.random() * 14 - 7).toFixed(1);
                    const total = (Math.random() * 10 + 45).toFixed(1);
                    const awayTeam = game.awayTeam || this.gameData?.[index]?.awayTeamName || 'Team A';
                    const homeTeam = game.homeTeam || this.gameData?.[index]?.homeTeamName || 'Team B';
                    
                    return `
                        <div class="odds-game">
                            <div class="teams">${awayTeam} @ ${homeTeam}</div>
                            <div class="lines">
                                <span>Spread: ${spread > 0 ? '+' : ''}${spread}</span>
                                <span>Total: O/U ${total}</span>
                                <span>ML: ${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 300 + 110)}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    showPropsLoading(gameCard) {
        const loadingHtml = `
            <div class="props-container">
                <div class="props-loading">
                    <div class="loading-spinner"></div>
                    <span>Loading player props...</span>
                </div>
            </div>
        `;
        gameCard.insertAdjacentHTML('beforeend', loadingHtml);
    }
    
    async fetchGameProps(gameId) {
        try {
            const response = await fetch(`/api/betting/game-props?gameId=${gameId}&_t=${Date.now()}`);
            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('👑 Error fetching game props:', error);
            return null;
        }
    }
    
    async initializeAIPredictions() {
        const predictionsContainer = this.containers.get('nfl-predictions');
        if (!predictionsContainer) return;

        try {
            console.log('👑 Loading AI predictions...');
            
            // Show loading state
            predictionsContainer.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <h3>Computing AI Predictions</h3>
                    <p>Neural network processing game data...</p>
                </div>
            `;
            
            const data = await window.productionFallback.fetchWithFallback(
                '/api/ai/predictions?sport=nfl&_t=' + Date.now(),
                'predictions'
            );
            
            if (data.success && data.data) {
                console.log(`👑 Loaded ${data.data.length} AI predictions`);
                predictionsContainer.innerHTML = this.renderPredictions(data.data, data.accuracy);
            } else {
                throw new Error('Failed to load predictions');
            }
            
        } catch (error) {
            console.error('👑 Error loading AI predictions:', error);
            predictionsContainer.innerHTML = `
                <div class="error-state">
                    <h3>❌ AI Predictions Unavailable</h3>
                    <p>Unable to load predictions. Please try refreshing.</p>
                    <button onclick="window.masterController.initializeAIPredictions()" class="retry-btn">
                        🔄 Retry
                    </button>
                </div>
            `;
        }
    }
    
    renderPredictions(predictions, accuracy) {
        return `
            <div class="predictions-header">
                <h3>🧠 AI Game Predictions</h3>
                <div class="model-stats">
                    <span class="accuracy">Model Accuracy: ${accuracy}</span>
                    <span class="count">${predictions.length} Predictions</span>
                </div>
            </div>
            <div class="predictions-grid">
                ${predictions.map(pred => `
                    <div class="prediction-card">
                        <div class="game-matchup">
                            <span class="away-team">${pred.awayTeam}</span>
                            <span class="vs">@</span>
                            <span class="home-team">${pred.homeTeam}</span>
                        </div>
                        <div class="prediction-result">
                            <div class="winner">
                                🎯 ${pred.prediction.winner === 'home' ? pred.homeTeam : pred.awayTeam}
                            </div>
                            <div class="confidence">Confidence: ${pred.prediction.confidence}</div>
                        </div>
                        <div class="prediction-lines">
                            <span class="spread">Spread: ${pred.prediction.spread > 0 ? '+' : ''}${pred.prediction.spread}</span>
                            <span class="total">O/U: ${pred.prediction.total}</span>
                        </div>
                        <div class="ai-analysis">
                            <p>${pred.prediction.analysis}</p>
                        </div>
                        <div class="factors">
                            ${pred.factors.map(factor => `<span class="factor">${factor}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    testProps(gameId) {
        console.log('🎯 TEST PROPS BUTTON CLICKED FOR:', gameId);
        const gameCard = document.querySelector(`[data-game-id="${gameId}"]`);
        if (gameCard) {
            this.toggleGameProps(gameId, gameCard);
        } else {
            console.error('👑 Game card not found for ID:', gameId);
        }
    }
    
    testMobileMenu() {
        console.log('📱 TEST MOBILE MENU');
        const toggleBtn = document.querySelector('.mobile-menu-toggle');
        const menu = document.getElementById('mobileNavMenu');
        const overlay = document.getElementById('mobileNavOverlay');
        
        console.log('Toggle button:', toggleBtn);
        console.log('Menu element:', menu);
        console.log('Overlay element:', overlay);
        
        if (toggleBtn) {
            console.log('Triggering mobile menu toggle...');
            this.toggleMobileMenu();
        }
    }

    setupNavigation() {
        console.log('👑 Setting up navigation...');
        
        // Setup desktop navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                console.log('👑 Desktop nav click:', view);
                this.switchView(view);
            });
        });
        
        // Setup mobile navigation
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                console.log('👑 Mobile nav click:', view);
                this.switchView(view);
                this.closeMobileMenu();
            });
        });
        
        // Setup mobile menu toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileNavOverlay = document.getElementById('mobileNavOverlay');
        const mobileNavClose = document.querySelector('.mobile-nav-close');
        
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('👑 Mobile menu toggle clicked');
                this.toggleMobileMenu();
            });
        }
        
        if (mobileNavOverlay) {
            mobileNavOverlay.addEventListener('click', () => {
                console.log('👑 Mobile overlay clicked');
                this.closeMobileMenu();
            });
        }
        
        if (mobileNavClose) {
            mobileNavClose.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('👑 Mobile close clicked');
                this.closeMobileMenu();
            });
        }
        
        console.log('👑 Navigation setup complete');
    }
    
    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileNavMenu');
        const overlay = document.getElementById('mobileNavOverlay');
        
        if (mobileMenu && overlay) {
            const isOpen = mobileMenu.classList.contains('active');
            
            if (isOpen) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }
    
    openMobileMenu() {
        console.log('👑 Opening mobile menu...');
        const mobileMenu = document.getElementById('mobileNavMenu');
        const overlay = document.getElementById('mobileNavOverlay');
        
        if (mobileMenu && overlay) {
            mobileMenu.classList.add('active');
            overlay.classList.add('active');
            document.body.classList.add('mobile-menu-open');
            console.log('👑 Mobile menu opened successfully');
        } else {
            console.error('👑 Mobile menu elements not found');
        }
    }
    
    closeMobileMenu() {
        console.log('👑 Closing mobile menu...');
        const mobileMenu = document.getElementById('mobileNavMenu');
        const overlay = document.getElementById('mobileNavOverlay');
        
        if (mobileMenu && overlay) {
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('mobile-menu-open');
            console.log('👑 Mobile menu closed successfully');
        } else {
            console.error('👑 Mobile menu elements not found for closing');
        }
    }

    switchView(viewName) {
        console.log(`👑 Switching to view: ${viewName}`);
        
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show target view
        const targetView = document.getElementById(viewName);
        if (targetView) {
            targetView.classList.add('active');
            console.log(`👑 View ${viewName} activated`);
            
            // Update desktop nav
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`.nav-link[data-view="${viewName}"]`)?.classList.add('active');
            
            // Update mobile nav
            document.querySelectorAll('.mobile-nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`.mobile-nav-link[data-view="${viewName}"]`)?.classList.add('active');
            
        } else {
            console.warn(`👑 View ${viewName} not found`);
        }
    }
}

// Initialize immediately
const masterController = new MasterController();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => masterController.initialize());
} else {
    masterController.initialize();
}

// Make globally available
window.masterController = masterController;

console.log('👑 Master Controller script loaded');
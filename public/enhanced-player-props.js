// Enhanced Player Props System
console.log('🎯 Loading Enhanced Player Props System...');

class EnhancedPlayerPropsManager {
    constructor() {
        this.propsCache = new Map();
        this.expandedGames = new Set();
    }

    async initialize() {
        console.log('🎯 Initializing Enhanced Player Props...');
        
        // Add click handlers to all game cards
        this.setupGameCardClickHandlers();
        
        // Fetch initial props data
        await this.fetchAllPlayerProps();
        
        // Set up auto-refresh for props
        setInterval(() => this.fetchAllPlayerProps(), 45000); // Every 45 seconds
        
        console.log('✅ Enhanced Player Props initialized');
    }

    setupGameCardClickHandlers() {
        // Use event delegation to handle dynamically created game cards
        document.addEventListener('click', (e) => {
            const gameCard = e.target.closest('.game-card');
            if (gameCard && !e.target.closest('.props-container')) {
                const gameId = gameCard.dataset.gameId || this.generateGameId(gameCard);
                this.toggleGameProps(gameId, gameCard);
            }
        });
    }

    generateGameId(gameCard) {
        // Generate ID from team names if not available
        const teams = gameCard.querySelectorAll('.team-name');
        if (teams.length >= 2) {
            const away = teams[0].textContent.trim().replace(/\s+/g, '_').toLowerCase();
            const home = teams[1].textContent.trim().replace(/\s+/g, '_').toLowerCase();
            return `${away}_vs_${home}`;
        }
        return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async toggleGameProps(gameId, gameCard) {
        console.log(`🎯 Toggling props for game: ${gameId}`);
        
        if (this.expandedGames.has(gameId)) {
            // Collapse props
            this.collapseProps(gameId, gameCard);
        } else {
            // Expand props
            await this.expandProps(gameId, gameCard);
        }
    }

    async expandProps(gameId, gameCard) {
        this.expandedGames.add(gameId);
        
        // Add loading state
        this.addPropsContainer(gameCard, `
            <div class="props-loading">
                <div class="loading-spinner"></div>
                <div>Loading player props...</div>
            </div>
        `);
        
        // Fetch props for this specific game
        const props = await this.getGameProps(gameId);
        
        // Display the props
        this.displayGameProps(gameCard, props, gameId);
    }

    collapseProps(gameId, gameCard) {
        this.expandedGames.delete(gameId);
        
        const propsContainer = gameCard.querySelector('.props-container');
        if (propsContainer) {
            propsContainer.style.maxHeight = '0px';
            setTimeout(() => {
                propsContainer.remove();
            }, 300);
        }
    }

    addPropsContainer(gameCard, content) {
        // Remove existing container
        const existing = gameCard.querySelector('.props-container');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.className = 'props-container';
        container.innerHTML = content;
        gameCard.appendChild(container);
        
        // Animate expansion
        requestAnimationFrame(() => {
            container.style.maxHeight = container.scrollHeight + 'px';
        });
    }

    async fetchAllPlayerProps() {
        try {
            console.log('🎯 Fetching all player props...');
            
            const response = await fetch('/api/betting/enhanced-props?_t=' + Date.now());
            const data = await response.json();
            
            if (data.success && data.data) {
                // Cache props by game
                data.data.forEach(gameProp => {
                    this.propsCache.set(gameProp.gameId, gameProp);
                });
                
                console.log(`🎯 Cached props for ${data.data.length} games`);
            }
        } catch (error) {
            console.error('🎯 Error fetching player props:', error);
        }
    }

    async getGameProps(gameId) {
        // First check cache
        if (this.propsCache.has(gameId)) {
            return this.propsCache.get(gameId);
        }
        
        // Fetch from API if not cached
        try {
            const response = await fetch(`/api/betting/game-props?gameId=${gameId}&_t=` + Date.now());
            const data = await response.json();
            
            if (data.success && data.data) {
                this.propsCache.set(gameId, data.data);
                return data.data;
            }
        } catch (error) {
            console.error(`🎯 Error fetching props for game ${gameId}:`, error);
        }
        
        // Return mock props if API fails
        return this.generateMockProps(gameId);
    }

    generateMockProps(gameId) {
        return {
            gameId: gameId,
            players: [
                {
                    name: 'QB Player',
                    position: 'QB',
                    team: 'HOME',
                    props: [
                        { type: 'Passing Yards', line: 275.5, over: -110, under: -110 },
                        { type: 'Passing TDs', line: 1.5, over: +140, under: -180 },
                        { type: 'Completions', line: 22.5, over: -115, under: -105 }
                    ]
                },
                {
                    name: 'RB Player',
                    position: 'RB', 
                    team: 'HOME',
                    props: [
                        { type: 'Rushing Yards', line: 85.5, over: -110, under: -110 },
                        { type: 'Rushing TDs', line: 0.5, over: +160, under: -200 },
                        { type: 'Receptions', line: 3.5, over: -120, under: +100 }
                    ]
                },
                {
                    name: 'WR Player',
                    position: 'WR',
                    team: 'AWAY',
                    props: [
                        { type: 'Receiving Yards', line: 65.5, over: -110, under: -110 },
                        { type: 'Receptions', line: 5.5, over: -105, under: -115 },
                        { type: 'Receiving TDs', line: 0.5, over: +180, under: -230 }
                    ]
                }
            ]
        };
    }

    displayGameProps(gameCard, propsData, gameId) {
        const propsHtml = `
            <div class="props-header">
                <h4>🎯 Player Props</h4>
                <button class="props-close" onclick="window.playerPropsManager.collapseProps('${gameId}', this.closest('.game-card'))">×</button>
            </div>
            
            <div class="props-content">
                ${propsData.players ? propsData.players.map(player => `
                    <div class="player-props-section">
                        <div class="player-header">
                            <div class="player-info">
                                <span class="player-name">${player.name}</span>
                                <span class="player-position">${player.position}</span>
                                <span class="player-team">${player.team}</span>
                            </div>
                        </div>
                        
                        <div class="props-grid">
                            ${player.props.map(prop => `
                                <div class="prop-item">
                                    <div class="prop-type">${prop.type}</div>
                                    <div class="prop-line">Line: ${prop.line}</div>
                                    <div class="prop-odds">
                                        <button class="prop-bet over" data-bet="over" data-odds="${prop.over}">
                                            O ${prop.line} <span class="odds">${prop.over > 0 ? '+' : ''}${prop.over}</span>
                                        </button>
                                        <button class="prop-bet under" data-bet="under" data-odds="${prop.under}">
                                            U ${prop.line} <span class="odds">${prop.under > 0 ? '+' : ''}${prop.under}</span>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('') : '<div class="no-props">No props available for this game</div>'}
                
                <div class="props-footer">
                    <div class="last-updated">Updated: ${new Date().toLocaleTimeString()}</div>
                    <div class="refresh-props">
                        <button onclick="window.playerPropsManager.refreshGameProps('${gameId}', this.closest('.game-card'))">
                            🔄 Refresh Props
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.addPropsContainer(gameCard, propsHtml);
        
        // Add bet button handlers
        this.setupPropBetHandlers(gameCard);
    }

    setupPropBetHandlers(gameCard) {
        gameCard.querySelectorAll('.prop-bet').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const bet = e.target.dataset.bet;
                const odds = e.target.dataset.odds;
                const propType = e.target.closest('.prop-item').querySelector('.prop-type').textContent;
                
                console.log(`🎯 Bet placed: ${bet} on ${propType} at ${odds}`);
                
                // Visual feedback
                e.target.style.background = '#00ff88';
                e.target.style.color = '#000';
                setTimeout(() => {
                    e.target.style.background = '';
                    e.target.style.color = '';
                }, 1000);
                
                // You can add actual bet placement logic here
                this.showBetConfirmation(propType, bet, odds);
            });
        });
    }

    showBetConfirmation(propType, bet, odds) {
        const notification = document.createElement('div');
        notification.className = 'bet-notification';
        notification.innerHTML = `
            <div class="bet-confirm">
                ✅ ${bet.toUpperCase()} bet on ${propType} at ${odds > 0 ? '+' : ''}${odds}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    async refreshGameProps(gameId, gameCard) {
        console.log(`🎯 Refreshing props for game: ${gameId}`);
        
        // Remove from cache to force fresh fetch
        this.propsCache.delete(gameId);
        
        // Show loading
        const propsContainer = gameCard.querySelector('.props-content');
        if (propsContainer) {
            propsContainer.innerHTML = '<div class="props-loading">Refreshing...</div>';
        }
        
        // Fetch fresh props
        const props = await this.getGameProps(gameId);
        this.displayGameProps(gameCard, props, gameId);
    }
}

// Initialize the enhanced player props system
const playerPropsManager = new EnhancedPlayerPropsManager();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => playerPropsManager.initialize());
} else {
    playerPropsManager.initialize();
}

// Make globally available
window.playerPropsManager = playerPropsManager;

console.log('🎯 Enhanced Player Props System loaded');
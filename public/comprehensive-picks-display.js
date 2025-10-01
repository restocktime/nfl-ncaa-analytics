/**
 * Comprehensive Picks Display Service
 * Shows ALL goldmine picks organized by category with edge values
 * Users can see every betting opportunity available
 */

class ComprehensivePicksDisplay {
    constructor() {
        this.isInitialized = false;
        this.parlayPicks = [];
        this.parlayVisible = false;
        console.log('📋 Comprehensive Picks Display initialized - Ready to show ALL picks');
    }

    /**
     * Display all picks organized by category and value
     */
    async displayAllPicks(season = 2025, week = 5) {
        try {
            console.log('🎯 Loading ALL available betting opportunities...');
            
            // Get comprehensive picks from MCP
            if (!window.weeklyPicksMCP) {
                console.error('❌ MCP system not available');
                return this.showError('MCP system not loaded');
            }

            const weeklyPicks = await window.weeklyPicksMCP.getBestWeeklyPicks(season, week);
            console.log(`📊 Retrieved ${weeklyPicks.allPicks?.length || 0} total picks`);

            // Organize picks by category with enhanced display
            const organizedPicks = this.organizePicksForDisplay(weeklyPicks);
            
            // Display in the UI
            this.renderPicksDisplay(organizedPicks);
            
            console.log('✅ All picks displayed with categories and edge values');
            
        } catch (error) {
            console.error('❌ Error displaying comprehensive picks:', error);
            this.showError('Failed to load betting opportunities');
        }
    }

    /**
     * Organize picks by category with enhanced information
     */
    organizePicksForDisplay(weeklyPicks) {
        const organized = {
            meta: weeklyPicks.meta,
            categories: {
                tackleProps: {
                    title: '🛡️ Tackle Props Goldmines',
                    description: 'Defensive tackle opportunities with edge analysis',
                    picks: weeklyPicks.tackleProps || [],
                    totalCount: weeklyPicks.tackleProps?.length || 0
                },
                playerProps: {
                    title: '🏈 Player Props Goldmines', 
                    description: 'QB, RB, WR, TE, K performance props with value',
                    picks: weeklyPicks.playerProps || [],
                    totalCount: weeklyPicks.playerProps?.length || 0
                },
                gameLines: {
                    title: '🎯 Game Lines (80%+ Confidence)',
                    description: 'High-confidence moneyline picks with 2.5+ edge',
                    picks: weeklyPicks.gameLines || [],
                    totalCount: weeklyPicks.gameLines?.length || 0
                },
                spreads: {
                    title: '📈 Point Spreads',
                    description: 'Spread betting opportunities with AI analysis', 
                    picks: weeklyPicks.spreads || [],
                    totalCount: weeklyPicks.spreads?.length || 0
                }
            },
            totals: {
                allPicks: weeklyPicks.allPicks?.length || 0,
                highEdgePicks: (weeklyPicks.allPicks || []).filter(p => p.edge >= 2.0).length,
                veryHighConfidence: (weeklyPicks.allPicks || []).filter(p => p.confidence === 'very_high').length
            }
        };

        // Sort picks within each category by edge (highest first)
        Object.keys(organized.categories).forEach(category => {
            organized.categories[category].picks.sort((a, b) => b.edge - a.edge);
        });

        return organized;
    }

    /**
     * Render comprehensive picks display in UI
     */
    renderPicksDisplay(organizedPicks) {
        const container = document.getElementById('nfl-betting') || 
                         document.getElementById('comprehensive-picks') ||
                         document.querySelector('.games-container');

        if (!container) {
            console.error('❌ No container found for picks display');
            return;
        }

        const html = this.generatePicksHTML(organizedPicks);
        container.innerHTML = html;

        console.log('🖥️ Comprehensive picks display rendered');
    }

    /**
     * Generate comprehensive HTML for all picks
     */
    generatePicksHTML(organizedPicks) {
        const { categories, totals, meta } = organizedPicks;

        let html = `
            <div class="comprehensive-picks-header">
                <h2>🎯 All Betting Opportunities - Week ${meta.week}</h2>
                <div class="picks-summary">
                    <div class="summary-stat">
                        <strong>${totals.allPicks}</strong>
                        <span>Total Goldmines</span>
                    </div>
                    <div class="summary-stat">
                        <strong>${totals.highEdgePicks}</strong>
                        <span>2.0+ Edge</span>
                    </div>
                    <div class="summary-stat">
                        <strong>${totals.veryHighConfidence}</strong>
                        <span>Very High Confidence</span>
                    </div>
                </div>
            </div>
        `;

        // Generate each category section
        Object.keys(categories).forEach(categoryKey => {
            const category = categories[categoryKey];
            if (category.totalCount > 0) {
                html += this.generateCategoryHTML(category);
            }
        });

        // Add styles
        html += this.getPicksDisplayStyles();

        return html;
    }

    /**
     * Generate HTML for a specific category
     */
    generateCategoryHTML(category) {
        let html = `
            <div class="picks-category">
                <div class="category-header">
                    <h3>${category.title}</h3>
                    <p>${category.description}</p>
                    <span class="pick-count">${category.totalCount} picks available</span>
                </div>
                <div class="picks-grid">
        `;

        category.picks.forEach(pick => {
            html += this.generatePickCard(pick);
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Generate individual pick card
     */
    generatePickCard(pick) {
        const edgeClass = pick.edge >= 2.0 ? 'high-edge' : 'medium-edge';
        const confidenceClass = pick.confidence.toLowerCase().replace('_', '-');
        
        return `
            <div class="pick-card ${edgeClass} ${confidenceClass}">
                <div class="pick-header">
                    <div class="pick-player">${pick.player || pick.team}</div>
                    <div class="pick-edge">+${pick.edge.toFixed(1)} edge</div>
                </div>
                <div class="pick-market">
                    <strong>BET: ${pick.market}</strong>
                    ${pick.line ? `<span class="line-info">Line: ${pick.line}</span>` : ''}
                    ${pick.overOdds ? `<span class="odds-info">Odds: ${pick.overOdds}</span>` : ''}
                </div>
                <div class="pick-details">
                    <div class="pick-confidence">
                        <i class="fas fa-chart-line"></i>
                        ${pick.confidence.toUpperCase()} confidence
                    </div>
                    <div class="pick-units">
                        <i class="fas fa-coins"></i>
                        ${pick.units || 1} units
                    </div>
                </div>
                ${pick.reasoning ? `<div class="pick-reasoning">${pick.reasoning}</div>` : ''}
                <div class="pick-actions">
                    <button class="buy-button" onclick="window.comprehensivePicksDisplay.addToParlay({
                        id: '${pick.id || `pick_${Math.random().toString(36).substr(2, 9)`}',
                        player: '${pick.player || pick.team}',
                        market: '${pick.market}',
                        edge: ${pick.edge},
                        confidence: '${pick.confidence}',
                        line: '${pick.line || ''}',
                        overOdds: '${pick.overOdds || ''}',
                        units: ${pick.units || 1}
                    })">
                        <i class="fas fa-shopping-cart"></i> BUY
                    </button>
                    <div class="pick-recommendation ${pick.recommendation?.toLowerCase().replace(' ', '-')}">
                        ${pick.recommendation || 'RECOMMENDED'}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * CSS styles for comprehensive picks display
     */
    getPicksDisplayStyles() {
        return `
            <style>
                .comprehensive-picks-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: rgba(255, 215, 0, 0.1);
                    border-radius: 10px;
                    border: 1px solid rgba(255, 215, 0, 0.3);
                }
                
                .picks-summary {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    margin-top: 15px;
                }
                
                .summary-stat {
                    text-align: center;
                }
                
                .summary-stat strong {
                    display: block;
                    font-size: 1.5rem;
                    color: #00ff88;
                }
                
                .picks-category {
                    margin-bottom: 40px;
                }
                
                .category-header {
                    background: rgba(0, 255, 136, 0.1);
                    border: 1px solid rgba(0, 255, 136, 0.3);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                
                .category-header h3 {
                    color: #00ff88;
                    margin: 0 0 10px 0;
                    font-size: 1.5rem;
                }
                
                .pick-count {
                    background: rgba(255, 215, 0, 0.2);
                    color: #ffd700;
                    padding: 5px 15px;
                    border-radius: 15px;
                    font-weight: bold;
                    float: right;
                }
                
                .picks-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 15px;
                }
                
                .pick-card {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    padding: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: transform 0.2s ease;
                }
                
                .pick-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0, 255, 136, 0.2);
                }
                
                .pick-card.high-edge {
                    border-color: #ffd700;
                    background: rgba(255, 215, 0, 0.05);
                }
                
                .pick-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .pick-player {
                    font-weight: bold;
                    color: white;
                }
                
                .pick-edge {
                    background: #00ff88;
                    color: black;
                    padding: 3px 8px;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    font-weight: bold;
                }
                
                .pick-market {
                    font-size: 1.1rem;
                    color: #00ff88;
                    margin-bottom: 10px;
                    font-weight: 500;
                }
                
                .pick-details {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.7);
                }
                
                .pick-reasoning {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 10px;
                    line-height: 1.3;
                }
                
                .pick-recommendation {
                    text-align: center;
                    padding: 8px;
                    border-radius: 5px;
                    font-weight: bold;
                    font-size: 0.9rem;
                }
                
                .pick-recommendation.buy {
                    background: rgba(0, 255, 136, 0.2);
                    color: #00ff88;
                    border: 1px solid #00ff88;
                }
                
                .pick-recommendation.strong-buy {
                    background: rgba(255, 215, 0, 0.2);
                    color: #ffd700;
                    border: 1px solid #ffd700;
                }

                .pick-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                }

                .buy-button {
                    background: #00ff88;
                    color: black;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.9rem;
                }

                .buy-button:hover {
                    background: #00dd77;
                    transform: translateY(-1px);
                }

                .buy-button:active {
                    transform: translateY(0);
                }

                .pick-recommendation {
                    flex: 1;
                    text-align: center;
                }

                /* Parlay Builder Styles */
                .parlay-builder {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 350px;
                    max-height: 70vh;
                    background: rgba(0, 0, 0, 0.95);
                    border: 2px solid #00ff88;
                    border-radius: 10px;
                    padding: 20px;
                    z-index: 1000;
                    color: white;
                    overflow-y: auto;
                }

                .parlay-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                    flex-wrap: wrap;
                }

                .parlay-header h3 {
                    color: #00ff88;
                    margin: 0;
                    font-size: 1.2rem;
                }

                .parlay-stats {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 5px;
                }

                .total-edge {
                    color: #ffd700;
                    font-weight: bold;
                }

                .avg-edge {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.9rem;
                }

                .close-parlay {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 5px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                }

                .parlay-picks {
                    margin-bottom: 15px;
                    max-height: 300px;
                    overflow-y: auto;
                }

                .parlay-pick {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 5px;
                    margin-bottom: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .pick-info {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }

                .pick-info strong {
                    color: white;
                    font-size: 0.9rem;
                    margin-bottom: 2px;
                }

                .pick-edge {
                    color: #00ff88;
                    font-size: 0.8rem;
                }

                .remove-pick {
                    background: rgba(255, 68, 68, 0.2);
                    border: 1px solid rgba(255, 68, 68, 0.5);
                    color: #ff4444;
                    padding: 5px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                }

                .parlay-actions {
                    display: flex;
                    gap: 10px;
                    flex-direction: column;
                }

                .place-parlay-btn {
                    background: #00ff88;
                    color: black;
                    border: none;
                    padding: 12px;
                    border-radius: 5px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .clear-parlay-btn {
                    background: rgba(255, 68, 68, 0.2);
                    border: 1px solid rgba(255, 68, 68, 0.5);
                    color: #ff4444;
                    padding: 8px;
                    border-radius: 5px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                /* Parlay Messages */
                .parlay-message {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    padding: 15px 25px;
                    border-radius: 5px;
                    font-weight: bold;
                    z-index: 1001;
                    animation: fadeInOut 3s ease-in-out;
                }

                .parlay-message.success {
                    background: #00ff88;
                    color: black;
                }

                .parlay-message.warning {
                    background: #ffd700;
                    color: black;
                }

                .parlay-message.info {
                    background: rgba(255, 255, 255, 0.9);
                    color: black;
                }

                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
                
                @media (max-width: 768px) {
                    .picks-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .picks-summary {
                        flex-direction: column;
                        gap: 15px;
                    }
                }
            </style>
        `;
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById('nfl-betting') || 
                         document.querySelector('.games-container');
        
        if (container) {
            container.innerHTML = `
                <div class="error-display">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Picks</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="retry-button">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Add pick to parlay
     */
    addToParlay(pick) {
        // Check if pick already in parlay
        const existingIndex = this.parlayPicks.findIndex(p => p.id === pick.id || 
            (p.player === pick.player && p.market === pick.market));
        
        if (existingIndex !== -1) {
            console.log(`🎯 Pick already in parlay: ${pick.market}`);
            this.showParlayMessage('Pick already added to parlay!', 'warning');
            return;
        }

        // Add to parlay
        this.parlayPicks.push({
            ...pick,
            addedAt: new Date().toISOString()
        });

        console.log(`🛒 Added to parlay: ${pick.market} (+${pick.edge.toFixed(1)} edge)`);
        this.showParlayMessage(`Added: ${pick.market}`, 'success');
        this.updateParlayDisplay();
    }

    /**
     * Remove pick from parlay
     */
    removeFromParlay(pickId) {
        const index = this.parlayPicks.findIndex(p => p.id === pickId);
        if (index !== -1) {
            const removedPick = this.parlayPicks.splice(index, 1)[0];
            console.log(`🗑️ Removed from parlay: ${removedPick.market}`);
            this.updateParlayDisplay();
        }
    }

    /**
     * Show parlay message
     */
    showParlayMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.querySelector('.parlay-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'parlay-message';
            document.body.appendChild(messageEl);
        }

        messageEl.className = `parlay-message ${type}`;
        messageEl.textContent = message;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    /**
     * Update parlay display
     */
    updateParlayDisplay() {
        if (this.parlayPicks.length === 0) {
            this.hideParlayBuilder();
            return;
        }

        this.showParlayBuilder();
    }

    /**
     * Show parlay builder
     */
    showParlayBuilder() {
        let parlayBuilder = document.querySelector('.parlay-builder');
        
        if (!parlayBuilder) {
            parlayBuilder = document.createElement('div');
            parlayBuilder.className = 'parlay-builder';
            document.body.appendChild(parlayBuilder);
        }

        const totalEdge = this.parlayPicks.reduce((sum, pick) => sum + pick.edge, 0);
        const avgEdge = totalEdge / this.parlayPicks.length;

        parlayBuilder.innerHTML = `
            <div class="parlay-header">
                <h3><i class="fas fa-layer-group"></i> Your Parlay (${this.parlayPicks.length} picks)</h3>
                <div class="parlay-stats">
                    <span class="total-edge">Total Edge: +${totalEdge.toFixed(1)}</span>
                    <span class="avg-edge">Avg: +${avgEdge.toFixed(1)}</span>
                </div>
                <button class="close-parlay" onclick="window.comprehensivePicksDisplay.hideParlayBuilder()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="parlay-picks">
                ${this.parlayPicks.map(pick => `
                    <div class="parlay-pick">
                        <div class="pick-info">
                            <strong>${pick.market}</strong>
                            <span class="pick-edge">+${pick.edge.toFixed(1)}</span>
                        </div>
                        <button class="remove-pick" onclick="window.comprehensivePicksDisplay.removeFromParlay('${pick.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
            <div class="parlay-actions">
                <button class="place-parlay-btn" onclick="window.comprehensivePicksDisplay.placeParlay()">
                    <i class="fas fa-rocket"></i> Place ${this.parlayPicks.length}-leg Parlay
                </button>
                <button class="clear-parlay-btn" onclick="window.comprehensivePicksDisplay.clearParlay()">
                    <i class="fas fa-broom"></i> Clear All
                </button>
            </div>
        `;

        this.parlayVisible = true;
    }

    /**
     * Hide parlay builder
     */
    hideParlayBuilder() {
        const parlayBuilder = document.querySelector('.parlay-builder');
        if (parlayBuilder) {
            parlayBuilder.remove();
        }
        this.parlayVisible = false;
    }

    /**
     * Clear all parlay picks
     */
    clearParlay() {
        this.parlayPicks = [];
        this.hideParlayBuilder();
        this.showParlayMessage('Parlay cleared', 'info');
    }

    /**
     * Place parlay (mock functionality)
     */
    placeParlay() {
        if (this.parlayPicks.length < 2) {
            this.showParlayMessage('Need at least 2 picks for a parlay', 'warning');
            return;
        }

        const totalEdge = this.parlayPicks.reduce((sum, pick) => sum + pick.edge, 0);
        console.log(`🚀 Placing ${this.parlayPicks.length}-leg parlay with +${totalEdge.toFixed(1)} total edge`);
        
        // Mock parlay placement
        this.showParlayMessage(`${this.parlayPicks.length}-leg parlay placed! (+${totalEdge.toFixed(1)} edge)`, 'success');
        this.clearParlay();
    }
}

// Initialize global comprehensive picks display
window.comprehensivePicksDisplay = new ComprehensivePicksDisplay();

console.log('📋 Comprehensive Picks Display loaded - Ready to show ALL goldmine opportunities');
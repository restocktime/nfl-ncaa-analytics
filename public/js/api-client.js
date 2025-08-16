/**
 * Sunday Edge Pro - Secure API Client
 * Connects to backend API service instead of directly to external APIs
 */

class SundayEdgeAPIClient {
    constructor() {
        // Use your backend API service URL
        this.baseURL = this.getAPIBaseURL();
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        console.log(`🔗 API Client initialized with base URL: ${this.baseURL}`);
    }

    // Determine API base URL based on environment
    getAPIBaseURL() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        } else if (hostname.includes('sundayedgepro.com')) {
            // Your Railway API URL
            return 'https://sunday-edge-pro-api-production.up.railway.app';
        } else {
            // Fallback for development/testing
            return 'http://localhost:3001';
        }
    }

    // Generic API fetch with caching
    async fetchWithCache(endpoint, options = {}) {
        const cacheKey = endpoint;
        const cached = this.cache.get(cacheKey);
        
        // Return cached data if fresh
        if (!options.forceRefresh && cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            console.log(`📋 Returning cached data for ${endpoint}`);
            return cached.data;
        }

        try {
            const url = `${this.baseURL}${endpoint}`;
            console.log(`📡 Fetching: ${url}`);
            
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache successful responses
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;

        } catch (error) {
            console.error(`❌ API fetch error for ${endpoint}:`, error);
            throw error;
        }
    }

    // Check API service status
    async getStatus() {
        return await this.fetchWithCache('/api/status');
    }

    // Get NFL betting odds
    async getNFLOdds(sport = 'americanfootball_nfl', forceRefresh = false) {
        const endpoint = `/api/nfl/odds?sport=${sport}`;
        return await this.fetchWithCache(endpoint, { forceRefresh });
    }

    // Get ESPN live scores
    async getLiveScores(forceRefresh = false) {
        return await this.fetchWithCache('/api/nfl/scores', { forceRefresh });
    }

    // Get comprehensive NFL data (odds + scores)
    async getComprehensiveNFLData(forceRefresh = false) {
        return await this.fetchWithCache('/api/nfl/comprehensive', { forceRefresh });
    }

    // Get today's games with odds and scores
    async getTodaysGames(forceRefresh = false) {
        try {
            const data = await this.getComprehensiveNFLData(forceRefresh);
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch NFL data');
            }

            // Combine odds and live scores
            const games = [];
            const today = new Date().toDateString();

            // Process live scores from ESPN
            if (data.liveScores && data.liveScores.games) {
                data.liveScores.games.forEach(scoreGame => {
                    const gameDate = new Date(scoreGame.gameTime).toDateString();
                    if (gameDate === today) {
                        games.push({
                            ...scoreGame,
                            hasLiveScore: true,
                            source: 'ESPN'
                        });
                    }
                });
            }

            // Add odds data if available
            if (data.odds && data.odds.games) {
                data.odds.games.forEach(oddsGame => {
                    const gameDate = new Date(oddsGame.gameTime).toDateString();
                    if (gameDate === today) {
                        // Try to find matching live score game
                        const existingGame = games.find(g => 
                            (g.homeTeam.abbreviation === oddsGame.homeTeam && 
                             g.awayTeam.abbreviation === oddsGame.awayTeam) ||
                            (g.homeTeam.name && g.homeTeam.name.includes(oddsGame.homeTeam))
                        );

                        if (existingGame) {
                            // Merge odds with live score
                            existingGame.bets = oddsGame.bets;
                            existingGame.hasOdds = true;
                        } else {
                            // Add as new game with odds only
                            games.push({
                                ...oddsGame,
                                hasOdds: true,
                                hasLiveScore: false,
                                source: 'OddsAPI'
                            });
                        }
                    }
                });
            }

            return {
                success: true,
                games,
                totalGames: games.length,
                lastUpdate: data.lastUpdate || new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error fetching today\'s games:', error);
            return {
                success: false,
                error: error.message,
                games: [],
                totalGames: 0
            };
        }
    }

    // Get best betting recommendations
    async getBestBets(sport = 'americanfootball_nfl', betType = 'all') {
        try {
            const oddsData = await this.getNFLOdds(sport);
            
            if (!oddsData.success) {
                throw new Error(oddsData.error || 'No odds data available');
            }

            // Simple analysis for best bets (you can enhance this)
            const recommendations = [];
            
            oddsData.games.forEach(game => {
                if (game.bets) {
                    // Analyze spreads
                    if (game.bets.spread && (betType === 'all' || betType === 'spread')) {
                        const homeSpread = game.bets.spread.home.line;
                        const awaySpread = game.bets.spread.away.line;
                        
                        // Simple recommendation logic (enhance with real ML)
                        if (Math.abs(homeSpread) <= 3) {
                            recommendations.push({
                                gameId: game.gameId,
                                type: 'spread',
                                team: Math.abs(homeSpread) < Math.abs(awaySpread) ? game.homeTeam : game.awayTeam,
                                recommendation: `Take ${game.homeTeam} ${homeSpread > 0 ? '+' : ''}${homeSpread}`,
                                confidence: 0.65 + Math.random() * 0.15, // Mock confidence
                                reasoning: 'Close spread indicates even matchup'
                            });
                        }
                    }

                    // Analyze totals
                    if (game.bets.totals && (betType === 'all' || betType === 'totals')) {
                        const total = game.bets.totals.over.line;
                        
                        if (total > 45 && total < 55) {
                            recommendations.push({
                                gameId: game.gameId,
                                type: 'totals',
                                recommendation: total > 50 ? `UNDER ${total}` : `OVER ${total}`,
                                confidence: 0.60 + Math.random() * 0.2,
                                reasoning: 'Total in optimal range for value'
                            });
                        }
                    }
                }
            });

            // Sort by confidence
            recommendations.sort((a, b) => b.confidence - a.confidence);

            return {
                success: true,
                recommendations: recommendations.slice(0, 10), // Top 10
                totalAnalyzed: oddsData.games.length,
                lastUpdate: oddsData.lastUpdate
            };

        } catch (error) {
            console.error('❌ Error getting best bets:', error);
            return {
                success: false,
                error: error.message,
                recommendations: []
            };
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
        console.log('🗑️ API cache cleared');
    }

    // Check if API service is online
    async isOnline() {
        try {
            await this.getStatus();
            return true;
        } catch (error) {
            console.warn('⚠️ API service offline:', error.message);
            return false;
        }
    }
}

// Create global instance
window.sundayEdgeAPI = new SundayEdgeAPIClient();

// Legacy compatibility - map old functions to new API client
window.BettingOddsIntegration = function() {
    return {
        fetchAllOdds: async (sport) => {
            const result = await window.sundayEdgeAPI.getNFLOdds(sport);
            return {
                success: result.success ? [{ games: result.games, provider: 'SundayEdgeAPI' }] : [],
                totalGames: result.totalGames || 0,
                lastUpdate: result.lastUpdate
            };
        },
        getBestBets: async (sport, betType) => {
            return await window.sundayEdgeAPI.getBestBets(sport, betType);
        },
        setupAPIKeys: () => {
            console.log('✅ API keys handled by backend service');
            return { configured: true };
        },
        getAPIStatus: () => {
            return { configured: true, backend: true };
        }
    };
};

console.log('✅ Sunday Edge Pro API Client loaded');
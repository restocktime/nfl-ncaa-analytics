/**
 * Hard Rock Bet Integration using Vercel API Endpoint
 * Replaces PHP proxy with reliable Vercel serverless functions
 */

class HardRockBetVercelIntegration {
    constructor() {
        // Use Vercel API endpoint (will be deployed to your domain)
        this.apiBaseUrl = '/api/hardrock'; // This will work when deployed to Vercel
        
        // For local testing, you can use the full Vercel URL once deployed:
        // this.apiBaseUrl = 'https://your-domain.vercel.app/api/hardrock';
        
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache
        
        console.log('🎰 Hard Rock Bet Vercel Integration initialized');
    }

    /**
     * Fetch data through the Vercel API endpoint
     */
    async fetchThroughAPI(action, eventId = null) {
        const cacheKey = `${action}_${eventId || 'all'}`;
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            console.log(`📋 Returning cached Hard Rock data for ${action}`);
            return cached.data;
        }

        try {
            let url = `${this.apiBaseUrl}?action=${action}`;
            if (eventId) {
                url += `&eventId=${eventId}`;
            }

            console.log(`📡 Fetching Hard Rock data: ${action}${eventId ? ` (Event: ${eventId})` : ''}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Unknown error from Hard Rock API');
            }

            // Cache the result
            this.cache.set(cacheKey, {
                data: result.data,
                timestamp: Date.now()
            });

            console.log(`✅ Hard Rock ${action} data fetched successfully via Vercel API`);
            console.log(`📊 Metadata:`, result.metadata);
            
            return result.data;

        } catch (error) {
            console.error(`❌ Hard Rock ${action} fetch failed:`, error.message);
            throw error;
        }
    }

    /**
     * Get NFL events from Hard Rock Bet
     */
    async getEvents() {
        return await this.fetchThroughAPI('events');
    }

    /**
     * Get odds for a specific event
     */
    async getEventOdds(eventId) {
        return await this.fetchThroughAPI('odds', eventId);
    }

    /**
     * Get live events
     */
    async getLiveEvents() {
        return await this.fetchThroughAPI('live');
    }

    /**
     * Test API connectivity and performance
     */
    async testAPI() {
        const results = {
            endpoints: [],
            performance: {},
            timestamp: new Date().toISOString()
        };

        console.log('🧪 Testing Vercel API connectivity...');

        // Test each endpoint
        const endpoints = ['events', 'live'];
        
        for (const endpoint of endpoints) {
            try {
                const start = Date.now();
                const data = await this.fetchThroughAPI(endpoint);
                const duration = Date.now() - start;

                results.endpoints.push({
                    endpoint: endpoint,
                    success: true,
                    duration: duration,
                    itemCount: Array.isArray(data) ? data.length : 1
                });

                console.log(`✅ ${endpoint}: ${duration}ms, ${Array.isArray(data) ? data.length : 1} items`);
            } catch (error) {
                results.endpoints.push({
                    endpoint: endpoint,
                    success: false,
                    error: error.message
                });

                console.log(`❌ ${endpoint}: ${error.message}`);
            }
        }

        // Calculate overall performance
        const successfulTests = results.endpoints.filter(e => e.success);
        if (successfulTests.length > 0) {
            results.performance = {
                averageResponseTime: successfulTests.reduce((sum, e) => sum + e.duration, 0) / successfulTests.length,
                successRate: (successfulTests.length / endpoints.length) * 100,
                totalItems: successfulTests.reduce((sum, e) => sum + (e.itemCount || 0), 0)
            };
        }

        return results;
    }

    /**
     * Parse Hard Rock events into standard format
     */
    parseEvents(rawEvents) {
        const games = [];

        try {
            if (!rawEvents || !Array.isArray(rawEvents)) {
                console.warn('⚠️ Invalid Hard Rock events data');
                return games;
            }

            rawEvents.forEach(event => {
                if (event.sport !== 'AMERICAN_FOOTBALL') return;

                const gameData = {
                    gameId: `hardrock_${event.id}`,
                    provider: 'hardrock',
                    homeTeam: this.normalizeTeamName(event.home_team?.name || event.homeTeam),
                    awayTeam: this.normalizeTeamName(event.away_team?.name || event.awayTeam),
                    gameTime: event.start_time || event.commence_time,
                    status: event.status || 'upcoming',
                    bets: {}
                };

                // Parse markets if available
                if (event.markets && Array.isArray(event.markets)) {
                    gameData.bets = this.parseMarkets(event.markets);
                }

                if (gameData.homeTeam && gameData.awayTeam) {
                    games.push(gameData);
                    console.log(`🏈 Parsed Hard Rock game: ${gameData.awayTeam} @ ${gameData.homeTeam}`);
                }
            });

        } catch (error) {
            console.error('❌ Error parsing Hard Rock events:', error);
        }

        return games;
    }

    /**
     * Parse Hard Rock markets into standard format
     */
    parseMarkets(markets) {
        const parsedMarkets = {
            spread: null,
            moneyline: null,
            totals: null,
            props: []
        };

        markets.forEach(market => {
            switch (market.type || market.key) {
                case 'POINT_SPREAD':
                case 'spreads':
                    parsedMarkets.spread = this.parseSpreadMarket(market);
                    break;
                    
                case 'MONEYLINE':
                case 'h2h':
                    parsedMarkets.moneyline = this.parseMoneylineMarket(market);
                    break;
                    
                case 'TOTAL_POINTS':
                case 'totals':
                    parsedMarkets.totals = this.parseTotalsMarket(market);
                    break;
                    
                default:
                    if (market.type && market.type.includes('PLAYER_')) {
                        const prop = this.parsePlayerProp(market);
                        if (prop) parsedMarkets.props.push(prop);
                    }
                    break;
            }
        });

        return parsedMarkets;
    }

    /**
     * Parse spread market
     */
    parseSpreadMarket(market) {
        try {
            const outcomes = market.outcomes || market.selections || [];
            if (outcomes.length < 2) return null;

            return {
                home: {
                    line: outcomes[0].handicap || outcomes[0].point || 0,
                    odds: this.convertOdds(outcomes[0].odds || outcomes[0].price)
                },
                away: {
                    line: outcomes[1].handicap || outcomes[1].point || 0,
                    odds: this.convertOdds(outcomes[1].odds || outcomes[1].price)
                }
            };
        } catch (error) {
            console.warn('⚠️ Error parsing Hard Rock spread:', error);
            return null;
        }
    }

    /**
     * Parse moneyline market
     */
    parseMoneylineMarket(market) {
        try {
            const outcomes = market.outcomes || market.selections || [];
            if (outcomes.length < 2) return null;

            return {
                home: {
                    odds: this.convertOdds(outcomes[0].odds || outcomes[0].price)
                },
                away: {
                    odds: this.convertOdds(outcomes[1].odds || outcomes[1].price)
                }
            };
        } catch (error) {
            console.warn('⚠️ Error parsing Hard Rock moneyline:', error);
            return null;
        }
    }

    /**
     * Parse totals market
     */
    parseTotalsMarket(market) {
        try {
            const outcomes = market.outcomes || market.selections || [];
            if (outcomes.length < 2) return null;

            const overOutcome = outcomes.find(o => o.type === 'OVER' || o.name === 'Over') || outcomes[0];
            const underOutcome = outcomes.find(o => o.type === 'UNDER' || o.name === 'Under') || outcomes[1];

            return {
                over: {
                    line: overOutcome.handicap || overOutcome.point || 45,
                    odds: this.convertOdds(overOutcome.odds || overOutcome.price)
                },
                under: {
                    line: underOutcome.handicap || underOutcome.point || 45,
                    odds: this.convertOdds(underOutcome.odds || underOutcome.price)
                }
            };
        } catch (error) {
            console.warn('⚠️ Error parsing Hard Rock totals:', error);
            return null;
        }
    }

    /**
     * Parse player prop
     */
    parsePlayerProp(market) {
        try {
            const outcomes = market.outcomes || market.selections || [];
            if (outcomes.length === 0) return null;

            return {
                type: 'player_prop',
                category: market.description || market.name || 'Unknown',
                player: market.player_name || 'Unknown Player',
                line: outcomes[0].handicap || outcomes[0].point || 0,
                odds: this.convertOdds(outcomes[0].odds || outcomes[0].price),
                selection: outcomes[0].type || outcomes[0].name || 'Over',
                bookmaker: 'Hard Rock Bet'
            };
        } catch (error) {
            console.warn('⚠️ Error parsing Hard Rock player prop:', error);
            return null;
        }
    }

    /**
     * Convert odds to American format
     */
    convertOdds(odds) {
        if (typeof odds === 'number') {
            // If decimal odds, convert to American
            if (odds > 2) {
                return Math.round((odds - 1) * 100);
            } else if (odds > 1) {
                return Math.round(-100 / (odds - 1));
            }
        }
        return odds;
    }

    /**
     * Normalize team names to abbreviations
     */
    normalizeTeamName(teamName) {
        const teamMap = {
            'Buffalo Bills': 'BUF', 'Miami Dolphins': 'MIA', 'New York Jets': 'NYJ',
            'New England Patriots': 'NE', 'Baltimore Ravens': 'BAL', 'Cincinnati Bengals': 'CIN',
            'Cleveland Browns': 'CLE', 'Pittsburgh Steelers': 'PIT', 'Houston Texans': 'HOU',
            'Indianapolis Colts': 'IND', 'Jacksonville Jaguars': 'JAX', 'Tennessee Titans': 'TEN',
            'Denver Broncos': 'DEN', 'Kansas City Chiefs': 'KC', 'Las Vegas Raiders': 'LV',
            'Los Angeles Chargers': 'LAC', 'Dallas Cowboys': 'DAL', 'New York Giants': 'NYG',
            'Philadelphia Eagles': 'PHI', 'Washington Commanders': 'WAS', 'Chicago Bears': 'CHI',
            'Detroit Lions': 'DET', 'Green Bay Packers': 'GB', 'Minnesota Vikings': 'MIN',
            'Atlanta Falcons': 'ATL', 'Carolina Panthers': 'CAR', 'New Orleans Saints': 'NO',
            'Tampa Bay Buccaneers': 'TB', 'Arizona Cardinals': 'ARI', 'Los Angeles Rams': 'LAR',
            'San Francisco 49ers': 'SF', 'Seattle Seahawks': 'SEA'
        };
        
        return teamMap[teamName] || teamName || 'UNK';
    }

    /**
     * Get comprehensive odds data
     */
    async getAllOdds() {
        try {
            console.log('🔄 Fetching all Hard Rock Bet odds via Vercel API...');
            
            const events = await this.getEvents();
            const games = this.parseEvents(events);
            
            return {
                provider: 'hardrock',
                games: games,
                totalBets: this.countTotalBets(games),
                lastUpdate: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Hard Rock Bet odds fetch failed:', error);
            throw error;
        }
    }

    /**
     * Count total bets available
     */
    countTotalBets(games) {
        return games.reduce((total, game) => {
            let gameBets = 0;
            if (game.bets?.spread) gameBets += 2;
            if (game.bets?.moneyline) gameBets += 2;
            if (game.bets?.totals) gameBets += 2;
            if (game.bets?.props) gameBets += game.bets.props.length;
            return total + gameBets;
        }, 0);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Hard Rock Bet cache cleared');
    }

    /**
     * Get API status and health
     */
    async getAPIStatus() {
        try {
            const testResults = await this.testAPI();
            
            const working = testResults.endpoints.some(e => e.success);
            const allWorking = testResults.endpoints.every(e => e.success);
            
            return {
                status: allWorking ? 'fully_operational' : working ? 'partial_service' : 'unavailable',
                endpoints: testResults.endpoints,
                performance: testResults.performance,
                cacheSize: this.cache.size,
                timestamp: testResults.timestamp
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Replace the existing integration class
window.HardRockBetIntegration = HardRockBetVercelIntegration;

console.log('✅ Hard Rock Bet Vercel Integration loaded - using serverless API endpoint');
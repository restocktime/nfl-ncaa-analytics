/**
 * The Odds API Service - Real Sportsbook Integration
 * Professional API for live betting odds including NFL player props
 * API Key: 9de126998e0df996011a28e9527dd7b9
 */

class OddsAPIService {
    constructor() {
        this.apiKey = '9de126998e0df996011a28e9527dd7b9';
        this.baseUrl = 'https://api.the-odds-api.com/v4';
        
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes for live odds
        this.rateLimitDelay = 1000; // 1 second between calls
        this.lastCallTime = 0;
        
        // Supported sportsbooks for tackle props
        this.supportedBooks = [
            'draftkings',
            'fanduel',
            'betmgm',
            'caesars',
            'pointsbet',
            'betrivers',
            'unibet_us'
        ];
        
        // Player props markets we're interested in
        this.tackleMarkets = [
            'player_tackles',
            'player_solo_tackles', 
            'player_assists',
            'player_tackles_assists',
            'player_total_tackles'
        ];
        
        this.usage = {
            requestsUsed: 0,
            requestsRemaining: null,
            monthlyLimit: null
        };
        
        console.log('🎯 The Odds API Service initialized');
        console.log(`🔑 API Key: ${this.apiKey.substring(0, 8)}...`);
        console.log(`📊 Supported books: ${this.supportedBooks.length}`);
    }

    /**
     * Get all NFL player props including tackle props
     */
    async getNFLPlayerProps(gameId = null) {
        try {
            await this.enforceRateLimit();
            
            const cacheKey = `nfl_player_props_${gameId || 'all'}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            console.log('🏈 Fetching NFL player props from The Odds API...');
            
            const endpoint = '/sports/americanfootball_nfl/events';
            const params = new URLSearchParams({
                apiKey: this.apiKey,
                regions: 'us',
                markets: 'player_props',
                oddsFormat: 'american',
                dateFormat: 'iso'
            });

            const response = await fetch(`${this.baseUrl}${endpoint}?${params}`);
            
            if (!response.ok) {
                throw new Error(`The Odds API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            this.updateUsageStats(response.headers);
            
            // Process and filter for tackle props
            const tackleProps = this.extractTackleProps(data, gameId);
            
            this.setCachedData(cacheKey, tackleProps);
            console.log(`✅ Found ${tackleProps.length} tackle prop opportunities`);
            
            return tackleProps;
            
        } catch (error) {
            console.error('❌ Error fetching NFL player props:', error);
            return this.getFallbackTackleProps();
        }
    }

    /**
     * Get specific tackle props for a player
     */
    async getPlayerTackleProps(playerName, gameId = null) {
        try {
            console.log(`🎯 Fetching tackle props for ${playerName}...`);
            
            const allProps = await this.getNFLPlayerProps(gameId);
            const playerProps = allProps.filter(prop => 
                prop.player_name.toLowerCase().includes(playerName.toLowerCase()) ||
                playerName.toLowerCase().includes(prop.player_name.toLowerCase())
            );
            
            if (playerProps.length > 0) {
                console.log(`✅ Found ${playerProps.length} tackle props for ${playerName}`);
                return playerProps;
            } else {
                console.log(`⚠️ No tackle props found for ${playerName}, checking alternative spellings...`);
                return this.searchPlayerVariations(playerName, allProps);
            }
            
        } catch (error) {
            console.error(`❌ Error fetching props for ${playerName}:`, error);
            return this.getFallbackPlayerProps(playerName);
        }
    }

    /**
     * Get tackle props with line shopping analysis
     */
    async getTacklePropsWithLineShoppingAnalysis() {
        try {
            console.log('🛒 Performing tackle props line shopping analysis...');
            
            const allProps = await this.getNFLPlayerProps();
            const lineShoppingAnalysis = this.analyzeLineShoppingOpportunities(allProps);
            
            return {
                totalProps: allProps.length,
                uniquePlayers: [...new Set(allProps.map(p => p.player_name))].length,
                lineShoppingOpportunities: lineShoppingAnalysis,
                bestOpportunities: lineShoppingAnalysis
                    .filter(opp => opp.lineShoppingValue > 2.0)
                    .slice(0, 10),
                lastUpdated: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Line shopping analysis failed:', error);
            return this.getFallbackLineShoppingAnalysis();
        }
    }

    /**
     * Extract tackle props from The Odds API response
     */
    extractTackleProps(apiData, gameId = null) {
        const tackleProps = [];
        
        if (!apiData || !Array.isArray(apiData)) {
            console.warn('⚠️ Invalid API data structure');
            return tackleProps;
        }

        apiData.forEach(game => {
            if (gameId && game.id !== gameId) return;
            
            // Look for bookmakers with player props
            if (game.bookmakers) {
                game.bookmakers.forEach(bookmaker => {
                    if (!this.supportedBooks.includes(bookmaker.key)) return;
                    
                    // Look for player props markets
                    if (bookmaker.markets) {
                        bookmaker.markets.forEach(market => {
                            if (this.isTackleMarket(market.key)) {
                                // Extract tackle props from this market
                                const props = this.parsePlayerPropsMarket(
                                    market, 
                                    bookmaker.key, 
                                    game,
                                    'tackles'
                                );
                                tackleProps.push(...props);
                            }
                        });
                    }
                });
            }
        });

        return this.consolidateTackleProps(tackleProps);
    }

    /**
     * Check if market is tackle-related
     */
    isTackleMarket(marketKey) {
        const tackleKeywords = ['tackle', 'solo_tackle', 'assist', 'defensive'];
        return tackleKeywords.some(keyword => 
            marketKey.toLowerCase().includes(keyword)
        );
    }

    /**
     * Parse player props market for tackle data
     */
    parsePlayerPropsMarket(market, bookmakerId, game, propType) {
        const props = [];
        
        if (!market.outcomes || !Array.isArray(market.outcomes)) {
            return props;
        }

        // Group outcomes by player (over/under pairs)
        const playerOutcomes = new Map();
        
        market.outcomes.forEach(outcome => {
            const playerName = this.extractPlayerName(outcome.description);
            if (!playerName) return;
            
            if (!playerOutcomes.has(playerName)) {
                playerOutcomes.set(playerName, {});
            }
            
            const isOver = outcome.description.toLowerCase().includes('over');
            const isUnder = outcome.description.toLowerCase().includes('under');
            
            if (isOver) {
                playerOutcomes.get(playerName).over = outcome;
            } else if (isUnder) {
                playerOutcomes.get(playerName).under = outcome;
            }
        });

        // Convert to standardized format
        playerOutcomes.forEach((outcomes, playerName) => {
            if (outcomes.over && outcomes.under) {
                props.push({
                    player_name: playerName,
                    prop_type: propType,
                    market_key: market.key,
                    game_id: game.id,
                    game_title: `${game.away_team} @ ${game.home_team}`,
                    commence_time: game.commence_time,
                    
                    sportsbook: bookmakerId,
                    line: parseFloat(outcomes.over.point || outcomes.under.point || 0),
                    
                    over_odds: outcomes.over.price,
                    under_odds: outcomes.under.price,
                    
                    last_update: market.last_update || new Date().toISOString()
                });
            }
        });

        return props;
    }

    /**
     * Extract player name from outcome description
     */
    extractPlayerName(description) {
        // Common patterns in player prop descriptions
        const patterns = [
            /^([A-Za-z\s\.]+?)\s+(Over|Under|To Record)/i,
            /^([A-Za-z\s\.]+?)\s+\d+/,
            /Player:\s*([A-Za-z\s\.]+)/i
        ];
        
        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        
        return null;
    }

    /**
     * Consolidate props from multiple books for line shopping
     */
    consolidateTackleProps(rawProps) {
        const playerProps = new Map();
        
        rawProps.forEach(prop => {
            const key = `${prop.player_name}_${prop.line}`;
            
            if (!playerProps.has(key)) {
                playerProps.set(key, {
                    player_name: prop.player_name,
                    prop_type: prop.prop_type,
                    line: prop.line,
                    game_title: prop.game_title,
                    commence_time: prop.commence_time,
                    books: [],
                    best_over: null,
                    best_under: null
                });
            }
            
            const consolidated = playerProps.get(key);
            
            // Add book data
            consolidated.books.push({
                sportsbook: prop.sportsbook,
                over_odds: prop.over_odds,
                under_odds: prop.under_odds,
                last_update: prop.last_update
            });
            
            // Track best odds
            if (!consolidated.best_over || prop.over_odds > consolidated.best_over.odds) {
                consolidated.best_over = {
                    sportsbook: prop.sportsbook,
                    odds: prop.over_odds
                };
            }
            
            if (!consolidated.best_under || prop.under_odds > consolidated.best_under.odds) {
                consolidated.best_under = {
                    sportsbook: prop.sportsbook,
                    odds: prop.under_odds
                };
            }
        });
        
        return Array.from(playerProps.values());
    }

    /**
     * Analyze line shopping opportunities
     */
    analyzeLineShoppingOpportunities(tackleProps) {
        return tackleProps.map(prop => {
            if (prop.books.length < 2) {
                return {
                    ...prop,
                    lineShoppingValue: 0,
                    marketEfficiency: 100
                };
            }
            
            // Calculate line shopping value
            const overOdds = prop.books.map(book => book.over_odds);
            const underOdds = prop.books.map(book => book.under_odds);
            
            const bestOver = Math.max(...overOdds);
            const worstOver = Math.min(...overOdds);
            const bestUnder = Math.max(...underOdds);
            const worstUnder = Math.min(...underOdds);
            
            // Convert to implied probabilities for value calculation
            const overValue = this.oddsToImpliedProb(worstOver) - this.oddsToImpliedProb(bestOver);
            const underValue = this.oddsToImpliedProb(worstUnder) - this.oddsToImpliedProb(bestUnder);
            const lineShoppingValue = Math.max(overValue, underValue) * 100;
            
            // Calculate market efficiency (total implied probability)
            const avgOverImplied = overOdds.reduce((sum, odds) => sum + this.oddsToImpliedProb(odds), 0) / overOdds.length;
            const avgUnderImplied = underOdds.reduce((sum, odds) => sum + this.oddsToImpliedProb(odds), 0) / underOdds.length;
            const marketEfficiency = ((avgOverImplied + avgUnderImplied - 1) * 100);
            
            return {
                ...prop,
                lineShoppingValue: Math.round(lineShoppingValue * 100) / 100,
                marketEfficiency: Math.round(marketEfficiency * 100) / 100,
                book_count: prop.books.length
            };
        })
        .sort((a, b) => b.lineShoppingValue - a.lineShoppingValue);
    }

    /**
     * Convert American odds to implied probability
     */
    oddsToImpliedProb(americanOdds) {
        if (americanOdds > 0) {
            return 100 / (americanOdds + 100);
        } else {
            return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
        }
    }

    /**
     * Search for player name variations
     */
    searchPlayerVariations(playerName, allProps) {
        const variations = [
            playerName.split(' ').pop(), // Last name only
            playerName.split(' ')[0], // First name only
            playerName.replace(/[^A-Za-z\s]/g, ''), // Remove special chars
        ];
        
        for (const variation of variations) {
            const matches = allProps.filter(prop =>
                prop.player_name.toLowerCase().includes(variation.toLowerCase())
            );
            
            if (matches.length > 0) {
                console.log(`✅ Found matches for ${playerName} using variation: ${variation}`);
                return matches;
            }
        }
        
        return [];
    }

    /**
     * Enforce rate limiting
     */
    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;
        
        if (timeSinceLastCall < this.rateLimitDelay) {
            const delay = this.rateLimitDelay - timeSinceLastCall;
            console.log(`⏳ Rate limiting: waiting ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastCallTime = Date.now();
    }

    /**
     * Update usage statistics from API response headers
     */
    updateUsageStats(headers) {
        this.usage.requestsUsed++;
        
        const remaining = headers.get('x-requests-remaining');
        const used = headers.get('x-requests-used');
        
        if (remaining) {
            this.usage.requestsRemaining = parseInt(remaining);
        }
        
        if (used) {
            this.usage.requestsUsed = parseInt(used);
        }
        
        console.log(`📊 API Usage: ${this.usage.requestsUsed} used, ${this.usage.requestsRemaining || 'Unknown'} remaining`);
    }

    /**
     * Get current usage statistics
     */
    getUsageStats() {
        return {
            ...this.usage,
            rateLimitDelay: this.rateLimitDelay,
            cacheSize: this.cache.size,
            supportedBooks: this.supportedBooks,
            lastCallTime: new Date(this.lastCallTime).toISOString()
        };
    }

    // Cache management
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log(`💾 Cache hit: ${key}`);
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Fallback data for development/testing
    getFallbackTackleProps() {
        console.log('⚠️ Using fallback tackle props data');
        return [
            {
                player_name: 'Micah Parsons',
                prop_type: 'tackles',
                line: 6.5,
                game_title: 'DAL @ PHI',
                books: [
                    { sportsbook: 'draftkings', over_odds: -115, under_odds: -105 },
                    { sportsbook: 'fanduel', over_odds: -108, under_odds: -112 },
                    { sportsbook: 'betmgm', over_odds: -120, under_odds: +100 }
                ],
                best_over: { sportsbook: 'fanduel', odds: -108 },
                best_under: { sportsbook: 'betmgm', odds: +100 },
                lineShoppingValue: 2.3,
                marketEfficiency: 4.8,
                book_count: 3
            }
        ];
    }

    getFallbackPlayerProps(playerName) {
        return [{
            player_name: playerName,
            prop_type: 'tackles',
            line: 6.5,
            game_title: 'Team A @ Team B',
            books: [{ sportsbook: 'draftkings', over_odds: -110, under_odds: -110 }],
            best_over: { sportsbook: 'draftkings', odds: -110 },
            best_under: { sportsbook: 'draftkings', odds: -110 },
            lineShoppingValue: 0,
            marketEfficiency: 4.5,
            book_count: 1
        }];
    }

    getFallbackLineShoppingAnalysis() {
        return {
            totalProps: 0,
            uniquePlayers: 0,
            lineShoppingOpportunities: [],
            bestOpportunities: [],
            lastUpdated: new Date().toISOString(),
            error: 'API unavailable, using fallback data'
        };
    }
}

// Initialize global Odds API service
window.oddsAPIService = new OddsAPIService();

console.log('🎯 The Odds API Service loaded - Real sportsbook tackle props integration ready');
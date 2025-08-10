/**
 * Real Sports Odds API Integration
 * Uses multiple real API sources for comprehensive odds data
 */

class RealOddsAPIIntegration {
    constructor() {
        // Real odds API providers
        this.apiProviders = {
            oddsapi: {
                name: 'The Odds API',
                baseUrl: 'https://api.the-odds-api.com/v4',
                apiKey: null, // User can provide their own key
                widgetKey: 'wk_c705aff93953afa57b69c84f505347fb', // Pre-configured widget access
                endpoints: {
                    sports: '/sports',
                    odds: '/sports/americanfootball_nfl/odds',
                    events: '/sports/americanfootball_nfl/events'
                },
                rateLimit: 500, // requests per month on free tier
                status: 'available'
            },
            
            rapidapi: {
                name: 'RapidAPI Sports Odds',
                baseUrl: 'https://odds.p.rapidapi.com',
                apiKey: null, // User needs to provide
                endpoints: {
                    nfl: '/v4/sports/americanfootball_nfl/odds',
                    games: '/v4/sports/americanfootball_nfl/games'
                },
                headers: {
                    'X-RapidAPI-Host': 'odds.p.rapidapi.com'
                },
                status: 'available'
            },

            // Direct sportsbook APIs (require web scraping or reverse engineering)
            hardrock: {
                name: 'Hard Rock Bet Direct',
                baseUrl: 'https://app.hardrock.bet',
                endpoints: {
                    nfl: '/sport-leagues/american_football/691198679103111169',
                    api: '/api/sportsbook/v3/sports/american_football/leagues/691198679103111169/events'
                },
                requiresProxy: true,
                status: 'scraping'
            },

            draftkings: {
                name: 'DraftKings Direct',
                baseUrl: 'https://sportsbook-api.draftkings.com',
                endpoints: {
                    nfl: '/sites/US-NJ-SB/api/v5/eventgroups/88808'
                },
                requiresProxy: true,
                status: 'scraping'
            },

            fanduel: {
                name: 'FanDuel Direct',
                baseUrl: 'https://sbapi.nj.fanduel.com',
                endpoints: {
                    events: '/api/content-managed-cards'
                },
                requiresProxy: true,
                status: 'scraping'
            }
        };

        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://cors-anywhere.herokuapp.com/',
            'https://proxy.cors.sh/',
            'https://api.codetabs.com/v1/proxy?quest='
        ];

        console.log('🎯 Real Odds API Integration initialized');
    }

    // Setup API keys (user must provide these)
    setupAPIKeys(keys) {
        if (keys.oddsapi) {
            this.apiProviders.oddsapi.apiKey = keys.oddsapi;
            console.log('✅ The Odds API key configured');
        }
        
        if (keys.rapidapi) {
            this.apiProviders.rapidapi.apiKey = keys.rapidapi;
            console.log('✅ RapidAPI key configured');
        }

        // Save to localStorage for persistence
        localStorage.setItem('betting_api_keys', JSON.stringify(keys));
        return this.getAPIStatus();
    }

    // Load API keys from storage
    loadStoredAPIKeys() {
        try {
            const stored = localStorage.getItem('betting_api_keys');
            if (stored) {
                const keys = JSON.parse(stored);
                this.setupAPIKeys(keys);
            }
        } catch (error) {
            console.log('No stored API keys found');
        }
    }

    // Get API provider status
    getAPIStatus() {
        const status = {};
        Object.entries(this.apiProviders).forEach(([key, provider]) => {
            status[key] = {
                name: provider.name,
                hasKey: !!provider.apiKey,
                status: provider.status,
                requiresKey: !['hardrock', 'draftkings', 'fanduel'].includes(key)
            };
        });
        return status;
    }

    // Fetch from The Odds API (premium, reliable)
    async fetchOddsAPI(sport = 'americanfootball_nfl') {
        const provider = this.apiProviders.oddsapi;
        
        // Use user's API key only (widget key appears to be invalid)
        const apiKey = provider.apiKey;
        
        if (!apiKey) {
            throw new Error('The Odds API key required. Get one from https://the-odds-api.com/');
        }

        try {
            console.log('📊 Fetching from The Odds API...');
            
            const response = await fetch(
                `${provider.baseUrl}${provider.endpoints.odds}?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso&bookmakers=hardrockbet,draftkings,fanduel`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'NFL-Analytics/1.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`The Odds API error: ${response.status}`);
            }

            const data = await response.json();
            return this.parseOddsAPIData(data);
            
        } catch (error) {
            console.error('❌ The Odds API failed:', error);
            throw error;
        }
    }

    // Parse The Odds API response
    parseOddsAPIData(data) {
        const games = [];

        data.forEach(game => {
            try {
                const gameData = {
                    gameId: `oddsapi_${game.id}`,
                    provider: 'oddsapi',
                    homeTeam: this.normalizeTeamName(game.home_team),
                    awayTeam: this.normalizeTeamName(game.away_team),
                    gameTime: game.commence_time,
                    status: 'upcoming',
                    bets: this.parseOddsAPIMarkets(game.bookmakers)
                };

                if (gameData.bets && Object.keys(gameData.bets).length > 0) {
                    games.push(gameData);
                }
            } catch (error) {
                console.error('Error parsing game:', error);
            }
        });

        return {
            provider: 'oddsapi',
            games: games,
            totalBets: this.countTotalBets(games),
            lastUpdate: new Date().toISOString()
        };
    }

    // Parse markets from The Odds API
    parseOddsAPIMarkets(bookmakers) {
        const markets = {
            spread: null,
            moneyline: null,
            totals: null
        };

        // Aggregate from all bookmakers to find best odds
        const allSpreads = [];
        const allMoneylines = [];
        const allTotals = [];

        bookmakers.forEach(bookmaker => {
            bookmaker.markets.forEach(market => {
                if (market.key === 'spreads') {
                    allSpreads.push({
                        bookmaker: bookmaker.title,
                        outcomes: market.outcomes
                    });
                } else if (market.key === 'h2h') {
                    allMoneylines.push({
                        bookmaker: bookmaker.title,
                        outcomes: market.outcomes
                    });
                } else if (market.key === 'totals') {
                    allTotals.push({
                        bookmaker: bookmaker.title,
                        outcomes: market.outcomes
                    });
                }
            });
        });

        // Parse spreads
        if (allSpreads.length > 0) {
            markets.spread = this.findBestSpreadOdds(allSpreads);
        }

        // Parse moneylines
        if (allMoneylines.length > 0) {
            markets.moneyline = this.findBestMoneylineOdds(allMoneylines);
        }

        // Parse totals
        if (allTotals.length > 0) {
            markets.totals = this.findBestTotalsOdds(allTotals);
        }

        return markets;
    }

    // Find best spread odds across bookmakers
    findBestSpreadOdds(spreads) {
        let bestHome = { odds: -200, line: 0, bookmaker: '' };
        let bestAway = { odds: -200, line: 0, bookmaker: '' };

        spreads.forEach(spread => {
            spread.outcomes.forEach(outcome => {
                if (outcome.name.includes('home') || outcome.name === spreads[0].outcomes[0].name) {
                    if (outcome.price > bestHome.odds) {
                        bestHome = {
                            odds: outcome.price,
                            line: outcome.point || 0,
                            bookmaker: spread.bookmaker
                        };
                    }
                } else {
                    if (outcome.price > bestAway.odds) {
                        bestAway = {
                            odds: outcome.price,
                            line: outcome.point || 0,
                            bookmaker: spread.bookmaker
                        };
                    }
                }
            });
        });

        return {
            home: { line: bestHome.line, odds: bestHome.odds },
            away: { line: bestAway.line, odds: bestAway.odds }
        };
    }

    // Find best moneyline odds
    findBestMoneylineOdds(moneylines) {
        let bestHome = { odds: -200, bookmaker: '' };
        let bestAway = { odds: -200, bookmaker: '' };

        moneylines.forEach(ml => {
            ml.outcomes.forEach(outcome => {
                if (outcome.name.includes('home') || outcome.name === moneylines[0].outcomes[0].name) {
                    if (outcome.price > bestHome.odds) {
                        bestHome = { odds: outcome.price, bookmaker: ml.bookmaker };
                    }
                } else {
                    if (outcome.price > bestAway.odds) {
                        bestAway = { odds: outcome.price, bookmaker: ml.bookmaker };
                    }
                }
            });
        });

        return {
            home: { odds: bestHome.odds },
            away: { odds: bestAway.odds }
        };
    }

    // Find best totals odds
    findBestTotalsOdds(totals) {
        let bestOver = { odds: -200, line: 45, bookmaker: '' };
        let bestUnder = { odds: -200, line: 45, bookmaker: '' };

        totals.forEach(total => {
            total.outcomes.forEach(outcome => {
                if (outcome.name === 'Over') {
                    if (outcome.price > bestOver.odds) {
                        bestOver = {
                            odds: outcome.price,
                            line: outcome.point || 45,
                            bookmaker: total.bookmaker
                        };
                    }
                } else if (outcome.name === 'Under') {
                    if (outcome.price > bestUnder.odds) {
                        bestUnder = {
                            odds: outcome.price,
                            line: outcome.point || 45,
                            bookmaker: total.bookmaker
                        };
                    }
                }
            });
        });

        return {
            over: { line: bestOver.line, odds: bestOver.odds },
            under: { line: bestUnder.line, odds: bestUnder.odds }
        };
    }

    // Fetch from RapidAPI
    async fetchRapidAPI(sport = 'americanfootball_nfl') {
        const provider = this.apiProviders.rapidapi;
        if (!provider.apiKey) {
            throw new Error('RapidAPI key required');
        }

        try {
            console.log('⚡ Fetching from RapidAPI...');
            
            const response = await fetch(
                `${provider.baseUrl}${provider.endpoints.nfl}?regions=us&markets=h2h,spreads,totals`,
                {
                    headers: {
                        'X-RapidAPI-Key': provider.apiKey,
                        'X-RapidAPI-Host': provider.headers['X-RapidAPI-Host'],
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`RapidAPI error: ${response.status}`);
            }

            const data = await response.json();
            return this.parseRapidAPIData(data);
            
        } catch (error) {
            console.error('❌ RapidAPI failed:', error);
            throw error;
        }
    }

    parseRapidAPIData(data) {
        // Similar parsing logic to The Odds API
        // Implementation would depend on RapidAPI's specific response format
        return {
            provider: 'rapidapi',
            games: [],
            totalBets: 0,
            lastUpdate: new Date().toISOString()
        };
    }

    // Scrape Hard Rock Bet (fallback when APIs not available)
    async scrapeHardRockBet() {
        try {
            console.log('🏈 Scraping Hard Rock Bet data...');
            
            const endpoints = [
                'https://app.hardrock.bet/sport-leagues/american_football/691198679103111169',
                'https://app.hardrock.bet/api/sportsbook/v3/sports/american_football/leagues/691198679103111169/events'
            ];

            for (const endpoint of endpoints) {
                try {
                    const data = await this.fetchWithProxy(endpoint);
                    if (data && this.isValidOddsData(data)) {
                        return this.parseHardRockData(data);
                    }
                } catch (error) {
                    console.log(`⚠️ Hard Rock endpoint failed: ${endpoint}`);
                    continue;
                }
            }

            throw new Error('All Hard Rock Bet endpoints failed');
            
        } catch (error) {
            console.error('❌ Hard Rock Bet scraping failed:', error);
            throw error;
        }
    }

    // Parse Hard Rock Bet scraped data
    parseHardRockData(rawData) {
        // Implementation depends on Hard Rock's actual API structure
        // This would need to be reverse engineered from their website
        const games = [];
        
        try {
            // Example parsing - actual structure would need to be determined
            if (rawData.events) {
                rawData.events.forEach(event => {
                    if (event.sport === 'AMERICAN_FOOTBALL') {
                        games.push({
                            gameId: `hr_${event.id}`,
                            provider: 'hardrock',
                            homeTeam: this.normalizeTeamName(event.home_team),
                            awayTeam: this.normalizeTeamName(event.away_team),
                            gameTime: event.start_time,
                            status: event.status || 'upcoming',
                            bets: {
                                spread: this.parseHardRockSpread(event.markets),
                                moneyline: this.parseHardRockMoneyline(event.markets),
                                totals: this.parseHardRockTotals(event.markets)
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error parsing Hard Rock data:', error);
        }

        return {
            provider: 'hardrock',
            games: games,
            totalBets: this.countTotalBets(games),
            lastUpdate: new Date().toISOString()
        };
    }

    // Utility functions
    async fetchWithProxy(url) {
        for (const proxy of this.corsProxies) {
            try {
                const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (compatible; NFLAnalytics/1.0)'
                    }
                });
                
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                continue;
            }
        }
        throw new Error('All proxy attempts failed');
    }

    isValidOddsData(data) {
        return data && (data.events || data.games || Array.isArray(data));
    }

    normalizeTeamName(team) {
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
        
        return teamMap[team] || team || 'UNK';
    }

    countTotalBets(games) {
        return games.reduce((total, game) => {
            let gameBets = 0;
            if (game.bets?.spread) gameBets += 2;
            if (game.bets?.moneyline) gameBets += 2;
            if (game.bets?.totals) gameBets += 2;
            return total + gameBets;
        }, 0);
    }

    // Main fetch function that tries all available sources
    async fetchAllRealOdds(sport = 'nfl') {
        const results = {
            success: [],
            failed: [],
            totalGames: 0,
            totalBets: 0,
            providers: [],
            lastUpdate: new Date().toISOString()
        };

        // Try The Odds API first (most reliable) - only if user has API key
        if (this.apiProviders.oddsapi.apiKey) {
            try {
                const data = await this.fetchOddsAPI();
                results.success.push(data);
                results.totalGames += data.games.length;
                results.totalBets += data.totalBets;
                console.log('✅ The Odds API: Success');
            } catch (error) {
                console.log('❌ The Odds API failed:', error.message);
                results.failed.push({
                    provider: 'oddsapi',
                    name: 'The Odds API',
                    error: error.message
                });
            }
        } else {
            console.log('⚠️ The Odds API: No API key configured, skipping...');
            results.failed.push({
                provider: 'oddsapi',
                name: 'The Odds API',
                error: 'No API key configured'
            });
        }

        // Try RapidAPI
        if (this.apiProviders.rapidapi.apiKey) {
            try {
                const data = await this.fetchRapidAPI();
                results.success.push(data);
                results.totalGames += data.games.length;
                results.totalBets += data.totalBets;
                console.log('✅ RapidAPI: Success');
            } catch (error) {
                results.failed.push({
                    provider: 'rapidapi',
                    name: 'RapidAPI Sports Odds',
                    error: error.message
                });
            }
        }

        // Web scraping disabled due to CORS issues
        console.log('⚠️ Web scraping disabled - CORS restrictions prevent direct sportsbook access');
        results.failed.push({
            provider: 'hardrock',
            name: 'Hard Rock Bet (Scraped)',
            error: 'CORS restrictions prevent web scraping'
        });

        results.providers = results.success.map(r => r.provider);
        
        if (results.success.length === 0) {
            throw new Error('No real odds data available. Please configure API keys or check network connectivity.');
        }

        return results;
    }

    // Helper parsing methods for Hard Rock (to be implemented based on actual API)
    parseHardRockSpread(markets) {
        // Implementation depends on actual Hard Rock API structure
        return null;
    }

    parseHardRockMoneyline(markets) {
        // Implementation depends on actual Hard Rock API structure  
        return null;
    }

    parseHardRockTotals(markets) {
        // Implementation depends on actual Hard Rock API structure
        return null;
    }
}

// Make available globally
window.RealOddsAPIIntegration = RealOddsAPIIntegration;

console.log('✅ Real Odds API Integration loaded - No mock data, real APIs only');
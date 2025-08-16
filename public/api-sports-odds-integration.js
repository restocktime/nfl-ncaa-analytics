/**
 * Real Sports Odds API Integration
 * Uses multiple real API sources for comprehensive odds data
 */

// API Key security encoder/decoder
class APIKeyDecoder {
    constructor() {
        // Multiple encoding layers for obfuscation
        this.salt = 'nfl_betting_analytics_2024';
        this.rotOffset = 13; // ROT13 offset
    }
    
    // Decode base64 + ROT cipher
    decode(encodedKey) {
        try {
            // First decode from base64
            const base64Decoded = atob(encodedKey);
            
            // Apply reverse ROT cipher
            let decoded = '';
            for (let i = 0; i < base64Decoded.length; i++) {
                const char = base64Decoded[i];
                if (char.match(/[a-z]/)) {
                    decoded += String.fromCharCode(((char.charCodeAt(0) - 97 - this.rotOffset + 26) % 26) + 97);
                } else if (char.match(/[A-Z]/)) {
                    decoded += String.fromCharCode(((char.charCodeAt(0) - 65 - this.rotOffset + 26) % 26) + 65);
                } else if (char.match(/[0-9]/)) {
                    decoded += String.fromCharCode(((char.charCodeAt(0) - 48 - (this.rotOffset % 10) + 10) % 10) + 48);
                } else {
                    decoded += char;
                }
            }
            
            return decoded;
        } catch (error) {
            console.error('Key decode error:', error);
            return null;
        }
    }
    
    // Encode method for generating obfuscated keys (dev use only)
    encode(plainKey) {
        let encoded = '';
        for (let i = 0; i < plainKey.length; i++) {
            const char = plainKey[i];
            if (char.match(/[a-z]/)) {
                encoded += String.fromCharCode(((char.charCodeAt(0) - 97 + this.rotOffset) % 26) + 97);
            } else if (char.match(/[A-Z]/)) {
                encoded += String.fromCharCode(((char.charCodeAt(0) - 65 + this.rotOffset) % 26) + 65);
            } else if (char.match(/[0-9]/)) {
                encoded += String.fromCharCode(((char.charCodeAt(0) - 48 + (this.rotOffset % 10)) % 10) + 48);
            } else {
                encoded += char;
            }
        }
        return btoa(encoded);
    }
}

class RealOddsAPIIntegration {
    constructor() {
        // Real odds API providers - keys must be configured by user
        this.apiProviders = {
            oddsapi: {
                name: 'The Odds API',
                baseUrl: 'https://api.the-odds-api.com/v4',
                apiKey: null, // Configure with your API key from https://the-odds-api.com/
                widgetKey: null, // Configure widget key for embedded odds displays
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

        // Try multiple request configurations, from most specific to most basic
        const requestConfigs = [
            // First try: All basic markets with specific bookmakers
            {
                url: `${provider.baseUrl}${provider.endpoints.odds}?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso&bookmakers=hardrockbet,draftkings,fanduel`,
                description: 'full request with all markets and bookmakers'
            },
            // Second try: Just basic markets with any bookmaker
            {
                url: `${provider.baseUrl}${provider.endpoints.odds}?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso`,
                description: 'basic markets with any bookmaker'
            },
            // Third try: Just h2h (moneyline) markets
            {
                url: `${provider.baseUrl}${provider.endpoints.odds}?apiKey=${apiKey}&regions=us&markets=h2h&oddsFormat=american&dateFormat=iso`,
                description: 'moneyline markets only'
            }
        ];

        for (const config of requestConfigs) {
            try {
                console.log(`📊 Fetching from The Odds API (${config.description})...`);
                
                const response = await fetch(config.url, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'NFL-Analytics/1.0'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Invalid API key. Please check your The Odds API key.');
                    } else if (response.status === 422) {
                        console.warn(`⚠️ 422 error with ${config.description}, trying simpler request...`);
                        continue; // Try next configuration
                    } else if (response.status === 429) {
                        throw new Error('API rate limit exceeded. Please wait before making more requests.');
                    } else if (response.status >= 500) {
                        throw new Error('The Odds API server error. Please try again later.');
                    } else {
                        console.warn(`⚠️ ${response.status} error with ${config.description}, trying simpler request...`);
                        continue; // Try next configuration
                    }
                }

                const data = await response.json();
                console.log(`✅ Successfully fetched odds using ${config.description}`);
                console.log(`📊 Raw API Response - Games: ${data.length}, Sample:`, data[0] || 'No games');
                
                // Check if we got any data
                if (!data || data.length === 0) {
                    console.warn('⚠️ API returned empty data - could be offseason or no upcoming games');
                }
                
                return this.parseOddsAPIData(data);
                
            } catch (error) {
                if (error.message.includes('API key') || error.message.includes('rate limit')) {
                    throw error; // Don't retry these errors
                }
                console.warn(`⚠️ Failed ${config.description}:`, error.message);
                continue; // Try next configuration
            }
        }
        
        throw new Error('All API request configurations failed. Check your API key and network connection.');
    }

    // Fetch player props for specific events (requires event IDs)
    async fetchPlayerProps(eventIds = []) {
        const provider = this.apiProviders.oddsapi;
        const apiKey = provider.apiKey;
        
        if (!apiKey) {
            throw new Error('The Odds API key required for player props.');
        }

        if (!eventIds || eventIds.length === 0) {
            console.log('⚠️ No event IDs provided for player props, skipping...');
            return [];
        }

        const playerPropsData = [];
        
        // Player props markets available in The Odds API
        const propsMarkets = ['player_pass_yards', 'player_rush_yards', 'player_rec_yards', 'player_pass_tds', 'player_anytime_td'];
        
        for (const eventId of eventIds.slice(0, 3)) { // Limit to 3 events to avoid rate limits
            try {
                console.log(`🏈 Fetching player props for event ${eventId}...`);
                
                const response = await fetch(
                    `${provider.baseUrl}/sports/americanfootball_nfl/events/${eventId}/odds?apiKey=${apiKey}&regions=us&markets=${propsMarkets.join(',')}&oddsFormat=american&dateFormat=iso`,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'NFL-Analytics/1.0'
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    playerPropsData.push(data);
                    console.log(`✅ Player props fetched for event ${eventId}`);
                } else {
                    console.warn(`⚠️ Failed to fetch props for event ${eventId}: ${response.status}`);
                }
                
                // Rate limiting - wait between requests
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.warn(`⚠️ Error fetching props for event ${eventId}:`, error.message);
                continue;
            }
        }

        return playerPropsData;
    }

    // Get event IDs for current NFL games
    async fetchEventIds() {
        const provider = this.apiProviders.oddsapi;
        const apiKey = provider.apiKey;
        
        if (!apiKey) {
            return [];
        }

        try {
            console.log('🗓️ Fetching NFL event IDs...');
            
            const response = await fetch(
                `${provider.baseUrl}/sports/americanfootball_nfl/events?apiKey=${apiKey}&regions=us&dateFormat=iso`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'NFL-Analytics/1.0'
                    }
                }
            );

            if (response.ok) {
                const events = await response.json();
                const eventIds = events.map(event => event.id);
                console.log(`✅ Found ${eventIds.length} NFL events`);
                return eventIds;
            } else {
                console.warn('⚠️ Failed to fetch event IDs:', response.status);
                return [];
            }
            
        } catch (error) {
            console.warn('⚠️ Error fetching event IDs:', error.message);
            return [];
        }
    }

    // Merge player props data into existing games
    mergePlayerProps(mainData, playerPropsArray) {
        if (!playerPropsArray || playerPropsArray.length === 0) {
            return;
        }

        playerPropsArray.forEach(propData => {
            if (!propData || !propData.id) return;
            
            // Find the corresponding game in main data
            const game = mainData.games.find(g => g.gameId === `oddsapi_${propData.id}`);
            if (game && propData.bookmakers) {
                // Initialize props array if it doesn't exist
                if (!game.bets.props) {
                    game.bets.props = [];
                }
                
                // Parse player props from bookmakers
                propData.bookmakers.forEach(bookmaker => {
                    bookmaker.markets.forEach(market => {
                        if (market.key.startsWith('player_')) {
                            market.outcomes.forEach(outcome => {
                                game.bets.props.push({
                                    type: 'player_prop',
                                    category: market.key.replace('player_', '').replace('_', ' '),
                                    player: outcome.description || 'Unknown Player',
                                    line: outcome.point || 0,
                                    odds: outcome.price || -110,
                                    bookmaker: bookmaker.title,
                                    market: market.key,
                                    selection: outcome.name
                                });
                            });
                        }
                    });
                });
                
                console.log(`📊 Added ${game.bets.props.length} player props for ${game.homeTeam} vs ${game.awayTeam}`);
            }
        });
    }

    // Parse The Odds API response
    parseOddsAPIData(data) {
        console.log(`🔄 Parsing ${data.length} games from The Odds API...`);
        const games = [];

        data.forEach((game, index) => {
            try {
                console.log(`🏈 Parsing game ${index + 1}: ${game.away_team} @ ${game.home_team} (${new Date(game.commence_time).toLocaleDateString()})`);
                
                const gameData = {
                    gameId: `oddsapi_${game.id}`,
                    provider: 'oddsapi',
                    homeTeam: this.normalizeTeamName(game.home_team),
                    awayTeam: this.normalizeTeamName(game.away_team),
                    gameTime: game.commence_time,
                    status: 'upcoming',
                    bets: this.parseOddsAPIMarkets(game.bookmakers || [])
                };

                console.log(`📊 Game parsed - ${gameData.awayTeam} @ ${gameData.homeTeam}, Bets: ${Object.keys(gameData.bets).join(', ')}`);
                
                // Debug spread information
                if (gameData.bets.spread) {
                    console.log(`   🏈 Spread: Home ${gameData.bets.spread.home.line} (${gameData.bets.spread.home.odds}), Away ${gameData.bets.spread.away.line} (${gameData.bets.spread.away.odds})`);
                }

                if (gameData.bets && Object.keys(gameData.bets).length > 0) {
                    games.push(gameData);
                } else {
                    console.warn(`⚠️ No betting markets found for ${gameData.awayTeam} @ ${gameData.homeTeam}`);
                }
            } catch (error) {
                console.error(`❌ Error parsing game ${index + 1}:`, error);
            }
        });

        console.log(`✅ Parsed ${games.length} games with betting data`);

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
            totals: null,
            props: []
        };

        // Aggregate from all bookmakers to find best odds
        const allSpreads = [];
        const allMoneylines = [];
        const allTotals = [];
        const allProps = [];

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
                } else if (market.key.startsWith('player_')) {
                    allProps.push({
                        bookmaker: bookmaker.title,
                        market: market.key,
                        description: market.description || market.key.replace('player_', '').replace('_', ' '),
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

        // Parse player props
        if (allProps.length > 0) {
            markets.props = this.parsePlayerProps(allProps);
        }

        return markets;
    }

    // Find best spread odds across bookmakers
    findBestSpreadOdds(spreads) {
        let bestHome = { odds: -200, line: 0, bookmaker: '' };
        let bestAway = { odds: -200, line: 0, bookmaker: '' };

        // Get team names from the game data to properly identify home/away
        let homeTeamName = null;
        let awayTeamName = null;
        
        spreads.forEach(spread => {
            spread.outcomes.forEach((outcome, index) => {
                // Determine which team is home/away based on typical API structure
                const isHomeTeam = index === 0; // First outcome is typically home team
                
                if (isHomeTeam) {
                    homeTeamName = outcome.name;
                    if (outcome.price > bestHome.odds) {
                        bestHome = {
                            odds: outcome.price,
                            line: outcome.point || 0,
                            bookmaker: spread.bookmaker,
                            teamName: outcome.name
                        };
                    }
                } else {
                    awayTeamName = outcome.name;
                    if (outcome.price > bestAway.odds) {
                        bestAway = {
                            odds: outcome.price,
                            line: outcome.point || 0,
                            bookmaker: spread.bookmaker,
                            teamName: outcome.name
                        };
                    }
                }
            });
        });

        // Ensure proper spread line formatting
        // In spread betting, lines are inverse - if home is -7, away is +7
        if (bestHome.line && bestAway.line) {
            // Verify the lines are inverse (one positive, one negative)
            if (Math.abs(bestHome.line + bestAway.line) > 0.1) {
                // Lines aren't properly inverse, fix them
                if (bestHome.line < 0) {
                    bestAway.line = Math.abs(bestHome.line);
                } else if (bestAway.line < 0) {
                    bestHome.line = Math.abs(bestAway.line);
                }
            }
        }

        console.log(`🏈 Spread parsing: Home ${homeTeamName} ${bestHome.line}, Away ${awayTeamName} ${bestAway.line}`);

        return {
            home: { 
                line: bestHome.line, 
                odds: bestHome.odds,
                teamName: bestHome.teamName 
            },
            away: { 
                line: bestAway.line, 
                odds: bestAway.odds,
                teamName: bestAway.teamName 
            }
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

    // Parse player props
    parsePlayerProps(props) {
        const parsedProps = [];
        
        props.forEach(prop => {
            prop.outcomes.forEach(outcome => {
                const playerName = outcome.description || 'Unknown Player';
                const statType = prop.market.replace('player_', '').replace('_', ' ');
                
                parsedProps.push({
                    type: 'player_prop',
                    category: statType,
                    player: playerName,
                    line: outcome.point || 0,
                    odds: outcome.price || -110,
                    bookmaker: prop.bookmaker,
                    market: prop.market,
                    selection: outcome.name // Over/Under
                });
            });
        });
        
        return parsedProps;
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

                // Try to fetch player props for additional data
                try {
                    const eventIds = await this.fetchEventIds();
                    if (eventIds.length > 0) {
                        const playerProps = await this.fetchPlayerProps(eventIds);
                        if (playerProps.length > 0) {
                            // Merge player props data into existing games
                            this.mergePlayerProps(data, playerProps);
                            console.log(`✅ Player props added for ${playerProps.length} events`);
                        }
                    }
                } catch (propsError) {
                    console.warn('⚠️ Player props fetch failed (non-critical):', propsError.message);
                }
                
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

        // Try Hard Rock Bet via CORS proxy
        try {
            console.log('🎰 Attempting Hard Rock Bet via CORS proxy...');
            
            // Check if HardRockBetIntegration is available
            if (typeof HardRockBetIntegration === 'undefined') {
                throw new Error('Hard Rock Bet integration not loaded');
            }
            
            const hardRockIntegration = new HardRockBetIntegration();
            const hardRockData = await hardRockIntegration.getAllOdds();
            
            if (hardRockData && hardRockData.games.length > 0) {
                results.success.push(hardRockData);
                results.totalGames += hardRockData.games.length;
                results.totalBets += hardRockData.totalBets;
                console.log('✅ Hard Rock Bet: Success via proxy');
            } else {
                throw new Error('No games returned from Hard Rock Bet');
            }
        } catch (error) {
            console.log('❌ Hard Rock Bet proxy failed:', error.message);
            results.failed.push({
                provider: 'hardrock',
                name: 'Hard Rock Bet (Proxy)',
                error: error.message
            });
        }

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
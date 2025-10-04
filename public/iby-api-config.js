/**
 * IBY API Configuration - Real NFL Data Sources
 * Created by IBY @benyakar94 - IG
 * Configure your real API endpoints here
 */

class IBYAPIConfig {
    constructor() {
        this.apiKeys = this.loadAPIKeys();
        this.endpoints = this.setupEndpoints();
        this.rateLimits = this.setupRateLimits();
        
        console.log('🔑 IBY API Config initializing...');
    }

    /**
     * Load API keys from browser config or localStorage
     * REPLACE THESE WITH YOUR REAL API KEYS
     */
    loadAPIKeys() {
        // Check if we're in browser environment
        const isBrowser = typeof window !== 'undefined';
        
        // Try to get keys from localStorage first, then fall back to defaults
        const getKey = (keyName, defaultValue) => {
            if (isBrowser) {
                return localStorage.getItem(`IBY_${keyName}`) || defaultValue;
            }
            return defaultValue;
        };

        return {
            // PRIMARY APPROVED APIs
            espn: null, // Free API, no key required
            theoddsapi: getKey('THE_ODDS_API_KEY', '9de126998e0df996011a28e9527dd7b9'), // Your working key
            apisports: getKey('API_SPORTS_KEY', '47647545b8ddeb4b557a8482be930f09'), // Your API-Sports key
            sleeper: null, // Free API, no key required
            
            // DISABLED - Not requested
            sportsradar: null,
            apiFootball: null,
            rapidapi: null,
            draftkings: null,
            fanduel: null,
            
            // News APIs - RSS only (free)
            nflrss: null, // Free RSS feed
            
            // Weather APIs (if needed later)
            openweather: getKey('OPENWEATHER_API_KEY', 'YOUR_OPENWEATHER_API_KEY'),
            weatherapi: getKey('WEATHER_API_KEY', 'YOUR_WEATHER_API_KEY')
        };
    }

    /**
     * Setup API endpoints
     * CUSTOMIZE THESE WITH YOUR ACTUAL ENDPOINTS
     */
    setupEndpoints() {
        return {
            // NFL Games Data - APPROVED SOURCES ONLY
            nflGames: {
                primary: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
                secondary: 'https://v1.american-football.api-sports.io/games?date={date}',
                fallback: 'https://github.com/nflverse/nflverse-data/releases/download/schedules/schedule_2025.csv'
            },
            
            // Live Scores
            liveScores: {
                primary: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
                secondary: 'https://v1.american-football.api-sports.io/games?live=all',
                fallback: 'https://github.com/nflverse/nflverse-data/releases/download/schedules/schedule_2025.csv'
            },
            
            // Player Props & Odds - THE ODDS API ONLY  
            playerProps: {
                primary: 'https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/',
                secondary: 'https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/',
                fallback: null // No fallback for betting data
            },
            
            // Team & Player Data
            teams: {
                primary: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
                secondary: 'https://v1.american-football.api-sports.io/teams',
                fallback: 'https://github.com/nflverse/nflverse-data/releases/download/teams/teams.csv'
            },
            
            // Player Stats - APPROVED SOURCES
            playerStats: {
                primary: 'https://site.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{player_id}',
                secondary: 'https://v1.american-football.api-sports.io/players/{player_id}',
                sleeper: 'https://api.sleeper.app/v1/players/nfl'
            },
            
            // Fantasy Data - SLEEPER ONLY
            fantasyRankings: {
                primary: 'https://api.sleeper.app/v1/players/nfl',
                leagues: 'https://api.sleeper.app/v1/league/{league_id}'
            },
            
            // News & Updates - APPROVED SOURCES
            news: {
                primary: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
                rss: 'https://www.nfl.com/news/rss.xml'
            },
            
            // Injury Reports - Multiple sources
            injuries: {
                primary: 'https://v1.american-football.api-sports.io/injuries',
                secondary: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
                fallback: 'https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_2025.csv'
            },
            
            // NFLVerse Data - GitHub releases
            nflverse: {
                schedules: 'https://github.com/nflverse/nflverse-data/releases/download/schedules/schedule_2025.csv',
                teams: 'https://github.com/nflverse/nflverse-data/releases/download/teams/teams.csv', 
                players: 'https://github.com/nflverse/nflverse-data/releases/download/players/players.csv',
                rosters: 'https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_2025.csv',
                github: 'https://api.github.com/repos/nflverse/nflverse-data'
            },
            
            // API-Sports NFL & NCAA
            apisports: {
                base: 'https://v1.american-football.api-sports.io',
                games: 'https://v1.american-football.api-sports.io/games',
                teams: 'https://v1.american-football.api-sports.io/teams', 
                players: 'https://v1.american-football.api-sports.io/players',
                standings: 'https://v1.american-football.api-sports.io/standings',
                injuries: 'https://v1.american-football.api-sports.io/injuries',
                odds: 'https://v1.american-football.api-sports.io/odds',
                leagues: 'https://v1.american-football.api-sports.io/leagues',
                seasons: 'https://v1.american-football.api-sports.io/seasons'
            }
        };
    }

    /**
     * Setup rate limits for each API
     */
    setupRateLimits() {
        return {
            sportsradar: { requests: 1000, window: 3600000 }, // 1000/hour
            espn: { requests: 200, window: 3600000 }, // 200/hour
            theOddsApi: { requests: 500, window: 3600000 }, // 500/hour
            newsapi: { requests: 100, window: 3600000 }, // 100/hour
            default: { requests: 60, window: 3600000 } // 60/hour default
        };
    }

    /**
     * Get headers for API requests
     */
    getHeaders(apiProvider) {
        const baseHeaders = {
            'Content-Type': 'application/json',
            'User-Agent': 'IBY-NFL-Analytics/1.0',
            'Accept': 'application/json'
        };

        switch (apiProvider) {
            case 'espn':
                return {
                    ...baseHeaders
                    // ESPN API is free, no authentication required
                };
            
            case 'theoddsapi':
                return {
                    ...baseHeaders
                    // API key passed as query parameter, not header
                };
            
            case 'apisports':
                return {
                    ...baseHeaders,
                    'x-rapidapi-key': this.apiKeys.apisports,
                    'x-rapidapi-host': 'v1.american-football.api-sports.io'
                };
            
            case 'sleeper':
                return {
                    ...baseHeaders
                    // Sleeper API is free, no authentication required
                };
            
            case 'nflverse':
                return {
                    ...baseHeaders
                    // NFLVerse CDN is free, no authentication required
                };
                
            case 'sportsradar':
                return {
                    ...baseHeaders,
                    'X-RapidAPI-Key': this.apiKeys.sportsradar
                };
            
            case 'espn':
                return {
                    ...baseHeaders,
                    'Authorization': `Bearer ${this.apiKeys.espn}`
                };
                
            case 'rapidapi':
                return {
                    ...baseHeaders,
                    'X-RapidAPI-Key': this.apiKeys.rapidapi,
                    'X-RapidAPI-Host': 'api-nfl-v1.p.rapidapi.com'
                };
                
            case 'theOddsApi':
                return {
                    ...baseHeaders,
                    'X-API-Key': this.apiKeys.theoddsapi
                };
                
            case 'newsapi':
                return {
                    ...baseHeaders,
                    'X-API-Key': this.apiKeys.newsapi
                };
                
            default:
                return baseHeaders;
        }
    }

    /**
     * Build URL with parameters
     */
    buildURL(endpoint, params = {}) {
        let url = endpoint;
        
        // Replace path parameters
        Object.entries(params).forEach(([key, value]) => {
            url = url.replace(`{${key}}`, value);
        });
        
        // Add query parameters (exclude undefined, null, and empty values)
        const queryParams = Object.entries(params)
            .filter(([key, value]) => !endpoint.includes(`{${key}}`))
            .filter(([key, value]) => value !== undefined && value !== null && value !== '' && value !== 'undefined' && value !== 'null')
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
            
        if (queryParams) {
            url += (url.includes('?') ? '&' : '?') + queryParams;
        }
        
        return url;
    }

    /**
     * Get proxy URL for CORS-blocked endpoints
     */
    getProxyURL(originalURL) {
        // Check if we're in browser and need proxy
        if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
            // Use local CORS proxy for external APIs
            return `http://localhost:8001/?url=${encodeURIComponent(originalURL)}`;
        }
        return originalURL;
    }

    /**
     * Get current week number
     */
    getCurrentWeek() {
        const now = new Date();
        const seasonStart = new Date('2025-09-05');
        const diffTime = Math.abs(now - seasonStart);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.min(18, Math.max(1, Math.ceil(diffDays / 7)));
    }

    /**
     * Get today's date in YYYY-MM-DD format
     */
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Check if API key is configured
     */
    isAPIKeyConfigured(provider) {
        const key = this.apiKeys[provider];
        return key && !key.startsWith('YOUR_') && key.length > 10;
    }

    /**
     * Get configured API providers
     */
    getConfiguredProviders() {
        return Object.keys(this.apiKeys).filter(provider => 
            this.isAPIKeyConfigured(provider)
        );
    }

    /**
     * Test API connection
     */
    async testConnection(provider, endpoint) {
        try {
            const headers = this.getHeaders(provider);
            const response = await fetch(endpoint, { 
                method: 'GET', 
                headers,
                timeout: 5000 
            });
            
            return {
                success: response.ok,
                status: response.status,
                provider,
                endpoint
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                provider,
                endpoint
            };
        }
    }

    /**
     * Get status of all API connections
     */
    getStatus() {
        const configured = this.getConfiguredProviders();
        const total = Object.keys(this.apiKeys).length;
        
        return {
            configured: configured.length,
            total,
            providers: configured,
            endpoints: Object.keys(this.endpoints).length,
            rateLimits: Object.keys(this.rateLimits).length
        };
    }
}

// Initialize IBY API Config
window.ibyAPIConfig = new IBYAPIConfig();

console.log('🔑 IBY API Config loaded - Configure your endpoints in iby-api-config.js');
console.log(`🔌 API Status: ${window.ibyAPIConfig.getStatus().configured}/${window.ibyAPIConfig.getStatus().total} providers configured`);
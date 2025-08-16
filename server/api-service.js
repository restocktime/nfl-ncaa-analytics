/**
 * Sunday Edge Pro - Secure API Service Backend
 * Handles all API requests with proper key management and caching
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your domain
app.use(cors({
    origin: [
        'https://sundayedgepro.com', 
        'https://www.sundayedgepro.com', 
        'https://nfl-ncaa-analytics-mj7g.vercel.app',
        'http://localhost:3000', 
        'http://localhost:8000'
    ],
    credentials: true
}));

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// API Keys from environment variables (SECURE)
const API_KEYS = {
    ODDS_API: process.env.ODDS_API_KEY || '22e59e4eccd8562ad4b697aeeaccb0fb',
    ESPN_API: process.env.ESPN_API_KEY,
    RAPID_API: process.env.RAPID_API_KEY
};

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class APIService {
    constructor() {
        this.baseURLs = {
            oddsAPI: 'https://api.the-odds-api.com/v4',
            espnAPI: 'https://site.api.espn.com/apis/site/v2'
        };
    }

    // Generic cache handler
    getCachedData(key) {
        const cached = cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Fetch NFL odds from The Odds API
    async fetchNFLOdds(sport = 'americanfootball_nfl') {
        const cacheKey = `odds_${sport}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const url = `${this.baseURLs.oddsAPI}/sports/${sport}/odds?apiKey=${API_KEYS.ODDS_API}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
            
            console.log(`📡 Fetching odds from: ${sport}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Odds API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Transform data for consistent format
            const transformedData = {
                success: true,
                sport,
                games: data.map(game => ({
                    gameId: game.id,
                    homeTeam: game.home_team,
                    awayTeam: game.away_team,
                    gameTime: game.commence_time,
                    bets: this.transformBookmakerData(game.bookmakers || [])
                })),
                totalGames: data.length,
                lastUpdate: new Date().toISOString(),
                provider: 'The Odds API'
            };

            this.setCachedData(cacheKey, transformedData);
            return transformedData;

        } catch (error) {
            console.error('❌ Error fetching odds:', error);
            return {
                success: false,
                error: error.message,
                games: [],
                totalGames: 0
            };
        }
    }

    // Transform bookmaker data to consistent format
    transformBookmakerData(bookmakers) {
        if (!bookmakers.length) return {};

        const bets = {};
        
        // Use first available bookmaker for simplicity
        const bookmaker = bookmakers[0];
        if (!bookmaker.markets) return {};

        bookmaker.markets.forEach(market => {
            switch (market.key) {
                case 'h2h': // Moneyline
                    bets.moneyline = {
                        home: { odds: market.outcomes.find(o => o.name === bookmaker.title)?.price || 0 },
                        away: { odds: market.outcomes.find(o => o.name !== bookmaker.title)?.price || 0 }
                    };
                    break;
                case 'spreads':
                    const homeSpread = market.outcomes.find(o => o.name === bookmaker.title);
                    const awaySpread = market.outcomes.find(o => o.name !== bookmaker.title);
                    bets.spread = {
                        home: { line: homeSpread?.point || 0, odds: homeSpread?.price || 0 },
                        away: { line: awaySpread?.point || 0, odds: awaySpread?.price || 0 }
                    };
                    break;
                case 'totals':
                    const over = market.outcomes.find(o => o.name === 'Over');
                    const under = market.outcomes.find(o => o.name === 'Under');
                    bets.totals = {
                        over: { line: over?.point || 0, odds: over?.price || 0 },
                        under: { line: under?.point || 0, odds: under?.price || 0 }
                    };
                    break;
            }
        });

        return bets;
    }

    // Fetch ESPN live scores (no API key needed)
    async fetchESPNScores() {
        const cacheKey = 'espn_scores';
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const url = `${this.baseURLs.espnAPI}/sports/football/nfl/scoreboard`;
            console.log('📡 Fetching ESPN live scores...');
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`ESPN API error: ${response.status}`);
            }

            const data = await response.json();
            
            const transformedData = {
                success: true,
                games: data.events?.map(event => {
                    const competition = event.competitions[0];
                    const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
                    const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
                    
                    return {
                        gameId: event.id,
                        homeTeam: {
                            name: homeTeam.team.displayName,
                            abbreviation: homeTeam.team.abbreviation,
                            score: homeTeam.score || '0'
                        },
                        awayTeam: {
                            name: awayTeam.team.displayName,
                            abbreviation: awayTeam.team.abbreviation,
                            score: awayTeam.score || '0'
                        },
                        status: event.status.type.description,
                        isLive: event.status.type.name === 'STATUS_IN_PROGRESS',
                        gameTime: event.date
                    };
                }) || [],
                lastUpdate: new Date().toISOString(),
                provider: 'ESPN'
            };

            this.setCachedData(cacheKey, transformedData);
            return transformedData;

        } catch (error) {
            console.error('❌ Error fetching ESPN scores:', error);
            return {
                success: false,
                error: error.message,
                games: []
            };
        }
    }

    // Get comprehensive NFL data (includes preseason)
    async getComprehensiveNFLData() {
        try {
            console.log('🔄 Fetching comprehensive NFL data (regular season + preseason)...');
            
            const [regularSeasonData, preseasonData, scoresData] = await Promise.all([
                this.fetchNFLOdds('americanfootball_nfl'),
                this.fetchNFLOdds('americanfootball_nfl_preseason'),
                this.fetchESPNScores()
            ]);

            // Combine regular season and preseason games
            const allGames = [];
            if (regularSeasonData.success) {
                allGames.push(...regularSeasonData.games.map(g => ({...g, season: 'regular'})));
            }
            if (preseasonData.success) {
                allGames.push(...preseasonData.games.map(g => ({...g, season: 'preseason'})));
            }

            const combinedOddsData = {
                success: true,
                games: allGames,
                totalGames: allGames.length,
                regularSeasonGames: regularSeasonData.success ? regularSeasonData.games.length : 0,
                preseasonGames: preseasonData.success ? preseasonData.games.length : 0,
                lastUpdate: new Date().toISOString(),
                provider: 'The Odds API'
            };

            return {
                success: true,
                odds: combinedOddsData,
                liveScores: scoresData,
                lastUpdate: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error fetching comprehensive NFL data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

const apiService = new APIService();

// API Routes
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        apiKeys: {
            oddsAPI: !!API_KEYS.ODDS_API,
            espnAPI: !!API_KEYS.ESPN_API
        }
    });
});

// Get NFL odds
app.get('/api/nfl/odds', async (req, res) => {
    try {
        const sport = req.query.sport || 'americanfootball_nfl';
        const data = await apiService.fetchNFLOdds(sport);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get ESPN live scores
app.get('/api/nfl/scores', async (req, res) => {
    try {
        const data = await apiService.fetchESPNScores();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get comprehensive NFL data (odds + scores + preseason)
app.get('/api/nfl/comprehensive', async (req, res) => {
    try {
        const data = await apiService.getComprehensiveNFLData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all NFL games (regular season + preseason) 
app.get('/api/nfl/all-games', async (req, res) => {
    try {
        const [regularSeasonData, preseasonData] = await Promise.all([
            apiService.fetchNFLOdds('americanfootball_nfl'),
            apiService.fetchNFLOdds('americanfootball_nfl_preseason')
        ]);

        const allGames = [];
        if (regularSeasonData.success) {
            allGames.push(...regularSeasonData.games.map(g => ({...g, season: 'regular'})));
        }
        if (preseasonData.success) {
            allGames.push(...preseasonData.games.map(g => ({...g, season: 'preseason'})));
        }

        res.json({
            success: true,
            games: allGames,
            totalGames: allGames.length,
            regularSeasonGames: regularSeasonData.success ? regularSeasonData.games.length : 0,
            preseasonGames: preseasonData.success ? preseasonData.games.length : 0,
            lastUpdate: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get today's games specifically (includes preseason)
app.get('/api/nfl/today', async (req, res) => {
    try {
        const data = await apiService.getComprehensiveNFLData();
        
        if (!data.success) {
            return res.status(500).json(data);
        }

        const today = new Date().toDateString();
        const todaysGames = [];

        // Filter ESPN live scores for today
        if (data.liveScores && data.liveScores.games) {
            data.liveScores.games.forEach(game => {
                const gameDate = new Date(game.gameTime).toDateString();
                if (gameDate === today) {
                    todaysGames.push({
                        ...game,
                        hasLiveScore: true,
                        source: 'ESPN'
                    });
                }
            });
        }

        // Add odds data for today's games
        if (data.odds && data.odds.games) {
            data.odds.games.forEach(game => {
                const gameDate = new Date(game.gameTime).toDateString();
                if (gameDate === today) {
                    const existingGame = todaysGames.find(g => 
                        (g.homeTeam?.abbreviation === game.homeTeam || g.homeTeam?.name?.includes(game.homeTeam)) &&
                        (g.awayTeam?.abbreviation === game.awayTeam || g.awayTeam?.name?.includes(game.awayTeam))
                    );

                    if (existingGame) {
                        existingGame.bets = game.bets;
                        existingGame.hasOdds = true;
                        existingGame.season = game.season;
                    } else {
                        todaysGames.push({
                            ...game,
                            hasOdds: true,
                            hasLiveScore: false,
                            source: 'OddsAPI'
                        });
                    }
                }
            });
        }

        res.json({
            success: true,
            games: todaysGames,
            totalGames: todaysGames.length,
            lastUpdate: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Sunday Edge Pro API Service running on port ${PORT}`);
    console.log(`📡 API Keys configured: ${Object.keys(API_KEYS).filter(k => API_KEYS[k]).join(', ')}`);
    console.log(`🌐 CORS origins: sundayedgepro.com, nfl-ncaa-analytics-mj7g.vercel.app`);
});

module.exports = app;
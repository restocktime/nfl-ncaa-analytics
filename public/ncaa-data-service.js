/**
 * NCAA Football Data Service for Sunday Edge Pro
 * Integrates with multiple NCAA APIs for real-time college football data
 */

class NCAADataService {
    constructor() {
        this.baseUrls = {
            espn: 'http://site.api.espn.com/apis/site/v2/sports/football/college-football',
            ncaaApi: 'https://ncaa-api.henrygd.me',
            collegeFB: 'https://api.collegefootballdata.com',
            oddsApi: 'https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf'
        };
        
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds for live data
        
        console.log('🏈 NCAA Data Service initialized for Sunday Edge Pro');
    }

    /**
     * Get today's NCAA games from ESPN API
     */
    async getTodaysGames() {
        const cacheKey = 'todays_games';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const url = `${this.baseUrls.espn}/scoreboard?dates=${today}`;
            
            console.log('📡 Fetching NCAA games from ESPN:', url);
            
            const response = await fetch(url);
            const data = await response.json();
            
            const games = this.parseESPNGames(data);
            this.setCache(cacheKey, games);
            
            console.log(`✅ Loaded ${games.length} NCAA games for today`);
            return games;
            
        } catch (error) {
            console.error('❌ Error fetching NCAA games:', error);
            return this.getFallbackGames();
        }
    }

    /**
     * Get live NCAA games
     */
    async getLiveGames() {
        const cacheKey = 'live_games';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // Try NCAA API first
            const url = `${this.baseUrls.ncaaApi}/scoreboard/football/fbs`;
            
            console.log('📡 Fetching live NCAA games:', url);
            
            const response = await fetch(url);
            const data = await response.json();
            
            const liveGames = this.parseNCAAApiGames(data, true); // Only live games
            this.setCache(cacheKey, liveGames, 15000); // 15 second cache for live data
            
            console.log(`🔴 Found ${liveGames.length} live NCAA games`);
            return liveGames;
            
        } catch (error) {
            console.error('❌ Error fetching live NCAA games:', error);
            return [];
        }
    }

    /**
     * Get AP Top 25 Rankings
     */
    async getTop25Rankings() {
        const cacheKey = 'top25_rankings';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // Try NCAA API for rankings
            const url = `${this.baseUrls.ncaaApi}/rankings/football/fbs/associated-press`;
            
            console.log('📡 Fetching AP Top 25 rankings:', url);
            
            const response = await fetch(url);
            const data = await response.json();
            
            const rankings = this.parseRankings(data);
            this.setCache(cacheKey, rankings, 300000); // 5 minute cache for rankings
            
            console.log(`🏆 Loaded Top 25 rankings with ${rankings.length} teams`);
            return rankings;
            
        } catch (error) {
            console.error('❌ Error fetching rankings:', error);
            return this.getFallbackRankings();
        }
    }

    /**
     * Get NCAA betting lines and odds
     */
    async getBettingLines() {
        const cacheKey = 'betting_lines';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // Use College Football Data API for betting lines
            const url = `${this.baseUrls.collegeFB}/lines?year=2024&seasonType=regular&week=1`;
            
            console.log('📡 Fetching NCAA betting lines:', url);
            
            const response = await fetch(url);
            const data = await response.json();
            
            const lines = this.parseBettingLines(data);
            this.setCache(cacheKey, lines, 60000); // 1 minute cache for betting data
            
            console.log(`💰 Loaded ${lines.length} NCAA betting lines`);
            return lines;
            
        } catch (error) {
            console.error('❌ Error fetching betting lines:', error);
            return [];
        }
    }

    /**
     * Parse ESPN games data
     */
    parseESPNGames(data) {
        if (!data.events) return [];

        return data.events.map(event => {
            const competition = event.competitions[0];
            const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
            const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
            
            return {
                id: event.id,
                name: event.name,
                shortName: event.shortName,
                date: new Date(event.date),
                status: {
                    type: competition.status.type.name,
                    displayClock: competition.status.displayClock,
                    period: competition.status.period,
                    completed: competition.status.type.completed
                },
                teams: {
                    home: {
                        id: homeTeam.id,
                        name: homeTeam.team.displayName,
                        abbreviation: homeTeam.team.abbreviation,
                        logo: homeTeam.team.logo,
                        score: homeTeam.score,
                        record: homeTeam.records?.[0]?.summary || '0-0'
                    },
                    away: {
                        id: awayTeam.id,
                        name: awayTeam.team.displayName,
                        abbreviation: awayTeam.team.abbreviation,
                        logo: awayTeam.team.logo,
                        score: awayTeam.score,
                        record: awayTeam.records?.[0]?.summary || '0-0'
                    }
                },
                venue: competition.venue?.fullName || 'TBD',
                isLive: competition.status.type.name === 'STATUS_IN_PROGRESS',
                week: event.week?.number || 1,
                season: event.season?.year || 2024
            };
        });
    }

    /**
     * Parse NCAA API games data
     */
    parseNCAAApiGames(data, liveOnly = false) {
        if (!data.games) return [];

        let games = data.games;
        
        if (liveOnly) {
            games = games.filter(game => 
                game.status === 'in_progress' || 
                game.status === 'live' ||
                (game.clock && game.clock !== 'Final')
            );
        }

        return games.map(game => ({
            id: game.id,
            name: `${game.away_team} @ ${game.home_team}`,
            date: new Date(game.start_date),
            status: {
                type: game.status,
                displayClock: game.clock || '',
                period: game.period || 0,
                completed: game.status === 'final'
            },
            teams: {
                home: {
                    name: game.home_team,
                    score: game.home_score || 0,
                    record: game.home_record || '0-0'
                },
                away: {
                    name: game.away_team,
                    score: game.away_score || 0,
                    record: game.away_record || '0-0'
                }
            },
            venue: game.venue || 'TBD',
            isLive: game.status === 'in_progress' || game.status === 'live',
            week: 1,
            season: 2024
        }));
    }

    /**
     * Parse rankings data
     */
    parseRankings(data) {
        if (!data.rankings) return [];

        return data.rankings.slice(0, 25).map((team, index) => ({
            rank: index + 1,
            team: team.school || team.team,
            record: team.record || '1-0',
            points: team.points || (1600 - (index * 50)),
            previousRank: team.previous_rank || index + 1,
            votes: team.first_place_votes || 0
        }));
    }

    /**
     * Parse betting lines data
     */
    parseBettingLines(data) {
        if (!Array.isArray(data)) return [];

        return data.map(line => ({
            gameId: line.id,
            teams: `${line.awayTeam} @ ${line.homeTeam}`,
            spread: line.lines?.[0]?.spread || 'N/A',
            overUnder: line.lines?.[0]?.overUnder || 'N/A',
            homeMoneyline: line.lines?.[0]?.homeMoneyline || 'N/A',
            awayMoneyline: line.lines?.[0]?.awayMoneyline || 'N/A',
            provider: line.lines?.[0]?.provider || 'Various'
        }));
    }

    /**
     * Get fallback games data when APIs fail
     */
    getFallbackGames() {
        return [
            {
                id: 'fallback-1',
                name: 'Georgia vs Clemson',
                shortName: 'UGA @ CLEM',
                date: new Date(),
                status: { type: 'STATUS_SCHEDULED', displayClock: '', period: 0, completed: false },
                teams: {
                    home: { name: 'Clemson Tigers', abbreviation: 'CLEM', score: 0, record: '0-0' },
                    away: { name: 'Georgia Bulldogs', abbreviation: 'UGA', score: 0, record: '0-0' }
                },
                venue: 'Mercedes-Benz Stadium',
                isLive: false,
                week: 1,
                season: 2024
            },
            {
                id: 'fallback-2',
                name: 'Alabama vs Wisconsin',
                shortName: 'ALA @ WIS',
                date: new Date(),
                status: { type: 'STATUS_IN_PROGRESS', displayClock: '2nd 8:45', period: 2, completed: false },
                teams: {
                    home: { name: 'Wisconsin Badgers', abbreviation: 'WIS', score: 14, record: '0-0' },
                    away: { name: 'Alabama Crimson Tide', abbreviation: 'ALA', score: 21, record: '0-0' }
                },
                venue: 'Camp Randall Stadium',
                isLive: true,
                week: 1,
                season: 2024
            }
        ];
    }

    /**
     * Get fallback rankings when API fails
     */
    getFallbackRankings() {
        return [
            { rank: 1, team: 'Georgia', record: '1-0', points: 1548, previousRank: 1, votes: 45 },
            { rank: 2, team: 'Texas', record: '1-0', points: 1487, previousRank: 2, votes: 12 },
            { rank: 3, team: 'Oregon', record: '1-0', points: 1423, previousRank: 3, votes: 3 },
            { rank: 4, team: 'Alabama', record: '1-0', points: 1356, previousRank: 4, votes: 2 },
            { rank: 5, team: 'Ohio State', record: '1-0', points: 1298, previousRank: 5, votes: 1 }
        ];
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log(`📋 Using cached data for: ${key}`);
            return cached.data;
        }
        return null;
    }

    setCache(key, data, timeout = null) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            timeout: timeout || this.cacheTimeout
        });
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ NCAA data cache cleared');
    }

    /**
     * Get comprehensive NCAA data for dashboard
     */
    async getDashboardData() {
        console.log('📊 Loading comprehensive NCAA dashboard data...');
        
        const [games, liveGames, rankings, bettingLines] = await Promise.all([
            this.getTodaysGames(),
            this.getLiveGames(),
            this.getTop25Rankings(),
            this.getBettingLines()
        ]);

        return {
            totalGames: games.length,
            liveGames: liveGames.length,
            allGames: games,
            liveGamesData: liveGames,
            rankings: rankings.slice(0, 10), // Top 10 for dashboard
            bettingLines: bettingLines.slice(0, 20), // Top 20 betting opportunities
            lastUpdated: new Date()
        };
    }

    /**
     * Get betting opportunities with analysis
     */
    async getBettingOpportunities() {
        const lines = await this.getBettingLines();
        const games = await this.getTodaysGames();
        
        // Combine betting lines with game data for enhanced opportunities
        return lines.map(line => {
            const game = games.find(g => g.name.includes(line.teams.split(' @ ')[0]) || 
                                          g.name.includes(line.teams.split(' @ ')[1]));
            
            return {
                ...line,
                gameData: game,
                opportunity: this.calculateBettingOpportunity(line, game),
                confidence: Math.random() * 100 // Mock confidence score
            };
        }).sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Calculate betting opportunity score (mock implementation)
     */
    calculateBettingOpportunity(line, game) {
        // This would contain real betting analysis logic
        const factors = {
            spreadValue: Math.abs(parseFloat(line.spread) || 0),
            totalValue: parseFloat(line.overUnder) || 50,
            moneylineValue: Math.abs(parseInt(line.homeMoneyline) || 0)
        };
        
        return {
            type: factors.spreadValue > 10 ? 'High Spread' : 'Close Game',
            value: factors.spreadValue + (factors.totalValue / 10),
            recommendation: factors.spreadValue > 7 ? 'Take the points' : 'Moneyline play'
        };
    }
}

// Initialize NCAA Data Service
window.ncaaDataService = new NCAADataService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NCAADataService;
}

console.log('🏈 NCAA Data Service loaded for Sunday Edge Pro Quantum');
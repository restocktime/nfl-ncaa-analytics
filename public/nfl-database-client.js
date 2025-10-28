/**
 * NFL Database Client - Browser Interface
 * Replaces external API calls with fast database queries
 * Works with the local SQLite database via a simple API layer
 */

class NFLDatabaseClient {
    constructor(apiBaseUrl) {
        // Force fallback mode when no local server is available
        if (!apiBaseUrl) {
            if (typeof window !== 'undefined' && window.productionConfig) {
                this.apiBaseUrl = window.productionConfig.getApiUrl();
            } else {
                // Check if we're on production without a backend server
                const isProduction = window.location.hostname === 'sundayedgepro.com' || 
                                   !window.location.hostname.includes('localhost');
                
                if (isProduction) {
                    // Use fallback mode for production sites without backend
                    this.apiBaseUrl = 'fallback';
                    console.log('🔄 Production detected - using fallback/ESPN mode');
                } else {
                    // Local development - try local server
                    this.apiBaseUrl = 'http://localhost:3001/api/nfl';
                }
            }
        } else {
            this.apiBaseUrl = apiBaseUrl;
        }
        
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        console.log(`🚀 NFL Database Client initialized with: ${this.apiBaseUrl}`);
    }

    /**
     * Get all teams - replaces ESPN teams API
     */
    async getTeams() {
        const cacheKey = 'teams';
        
        if (this.isValidCache(cacheKey)) {
            console.log('✅ Teams loaded from cache');
            return this.cache.get(cacheKey).data;
        }

        // Check if we should use fallback data
        if (this.apiBaseUrl === 'fallback' && window.NFL_FALLBACK_API) {
            console.log('✅ Using embedded NFL teams data (fallback mode)');
            const teams = window.NFL_FALLBACK_API.teams;
            this.setCache(cacheKey, teams);
            return teams;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/teams`);
            const result = await response.json();
            
            const teams = result.data || result;
            this.setCache(cacheKey, teams);
            console.log(`✅ Loaded ${teams.length} teams from database server`);
            return teams;
            
        } catch (error) {
            console.error('❌ Failed to load teams from database:', error);
            // Fallback to embedded data if API fails
            if (window.NFL_FALLBACK_API) {
                console.log('🔄 Falling back to embedded NFL teams data');
                return window.NFL_FALLBACK_API.teams;
            }
            return [];
        }
    }

    /**
     * Get team roster - replaces ESPN roster API calls
     */
    async getTeamRoster(teamId) {
        const cacheKey = `roster_${teamId}`;

        // Check cache but validate it has data
        if (this.isValidCache(cacheKey)) {
            const cachedData = this.cache.get(cacheKey).data;
            // If cached data is empty or invalid, clear it and fetch fresh
            if (!Array.isArray(cachedData) || cachedData.length === 0) {
                console.log(`⚠️ Cached roster for ${teamId} is empty, clearing cache...`);
                this.cache.delete(cacheKey);
            } else {
                console.log(`✅ Roster for team ${teamId} loaded from cache (${cachedData.length} players)`);
                return cachedData;
            }
        }

        // Check if we should use fallback data
        if (this.apiBaseUrl === 'fallback' && window.NFL_FALLBACK_API) {
            // Find team by name or abbreviation
            const team = window.NFL_FALLBACK_API.teams.find(t => 
                t.name === teamId || t.abbreviation === teamId || t.id == teamId
            );
            if (team && window.NFL_FALLBACK_API.players[team.name]) {
                console.log(`✅ Using embedded roster data for ${team.name} (fallback mode)`);
                const roster = window.NFL_FALLBACK_API.players[team.name];
                this.setCache(cacheKey, roster);
                return roster;
            } else {
                console.log(`⚠️ No roster data found for team: ${teamId}`);
                return [];
            }
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/team/${encodeURIComponent(teamId)}/roster`);
            const result = await response.json();

            const roster = result.roster || result.data || result;

            // If database returned empty roster, trigger ESPN fallback
            if (!Array.isArray(roster) || roster.length === 0) {
                console.log(`⚠️ Database has no roster for ${teamId}, trying ESPN live API...`);

                // Try ESPN live roster API if available
                if (window.espnLiveRosterAPI) {
                    try {
                        // Convert team ID to team name for ESPN API
                        const teams = await this.getTeams();
                        const team = teams.find(t => t.id == teamId || t.name === teamId || t.abbreviation === teamId);
                        const teamName = team ? team.name : teamId;

                        console.log(`🔄 Converting team ID ${teamId} → ${teamName} for ESPN API`);
                        const espnRoster = await window.espnLiveRosterAPI.getTeamRoster(teamName);
                        if (espnRoster && espnRoster.length > 0) {
                            this.setCache(cacheKey, espnRoster);
                            console.log(`✅ Loaded ${espnRoster.length} players from ESPN live API for ${teamName}`);
                            return espnRoster;
                        }
                    } catch (espnError) {
                        console.warn(`⚠️ ESPN API also failed for ${teamId}:`, espnError);
                    }
                }

                // Final fallback to embedded data
                if (window.NFL_FALLBACK_API) {
                    const team = window.NFL_FALLBACK_API.teams.find(t =>
                        t.name === teamId || t.abbreviation === teamId || t.id == teamId
                    );
                    if (team && window.NFL_FALLBACK_API.players[team.name]) {
                        console.log(`🔄 Using embedded fallback roster for ${team.name}`);
                        return window.NFL_FALLBACK_API.players[team.name];
                    }
                }

                return [];
            }

            this.setCache(cacheKey, roster);
            console.log(`✅ Loaded ${roster.length} players for team ${teamId} from database server`);
            return roster;

        } catch (error) {
            console.error(`❌ Failed to load roster for team ${teamId}:`, error);

            // Try ESPN live API as fallback
            if (window.espnLiveRosterAPI) {
                try {
                    // Convert team ID to team name for ESPN API
                    const teams = await this.getTeams();
                    const team = teams.find(t => t.id == teamId || t.name === teamId || t.abbreviation === teamId);
                    const teamName = team ? team.name : teamId;

                    console.log(`🔄 Converting team ID ${teamId} → ${teamName} for ESPN API (error fallback)`);
                    const espnRoster = await window.espnLiveRosterAPI.getTeamRoster(teamName);
                    if (espnRoster && espnRoster.length > 0) {
                        console.log(`✅ Loaded ${espnRoster.length} players from ESPN live API (fallback) for ${teamName}`);
                        return espnRoster;
                    }
                } catch (espnError) {
                    console.warn(`⚠️ ESPN API also failed for ${teamId}:`, espnError);
                }
            }

            // Final fallback to embedded data
            if (window.NFL_FALLBACK_API) {
                const team = window.NFL_FALLBACK_API.teams.find(t =>
                    t.name === teamId || t.abbreviation === teamId || t.id == teamId
                );
                if (team && window.NFL_FALLBACK_API.players[team.name]) {
                    console.log(`🔄 Falling back to embedded roster data for ${team.name}`);
                    return window.NFL_FALLBACK_API.players[team.name];
                }
            }
            return null;
        }
    }

    /**
     * Get games for a specific week - replaces ESPN schedule API
     */
    async getWeekGames(week, season = 2025) {
        const cacheKey = `games_${season}_${week}`;
        
        if (this.isValidCache(cacheKey)) {
            console.log(`✅ Games for week ${week} loaded from cache`);
            return this.cache.get(cacheKey).data;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/games?week=${week}&season=${season}`);
            const games = await response.json();
            
            this.setCache(cacheKey, games);
            console.log(`✅ Loaded ${games.length} games for week ${week} from database`);
            return games;
            
        } catch (error) {
            console.error(`❌ Failed to load games for week ${week}:`, error);
            return [];
        }
    }

    /**
     * Get injury report - replaces external injury APIs
     */
    async getInjuryReport(teamId = null) {
        const cacheKey = teamId ? `injuries_${teamId}` : 'injuries_all';
        
        if (this.isValidCache(cacheKey)) {
            console.log('✅ Injury report loaded from cache');
            return this.cache.get(cacheKey).data;
        }

        // Check if we should use fallback data
        if (this.apiBaseUrl === 'fallback') {
            console.log('✅ Using embedded injury data (fallback mode) - no injuries currently');
            const injuries = []; // No injury data in fallback mode
            this.setCache(cacheKey, injuries);
            return injuries;
        }

        try {
            const url = teamId ? 
                `${this.apiBaseUrl}/injuries?team=${teamId}` : 
                `${this.apiBaseUrl}/injuries`;
                
            const response = await fetch(url);
            const injuries = await response.json();
            
            this.setCache(cacheKey, injuries);
            console.log(`✅ Loaded ${injuries.length} injury reports from database`);
            return injuries;
            
        } catch (error) {
            console.error('❌ Failed to load injury report:', error);
            return [];
        }
    }

    /**
     * Get player statistics for a game
     */
    async getPlayerStats(gameId) {
        const cacheKey = `stats_${gameId}`;
        
        if (this.isValidCache(cacheKey)) {
            console.log(`✅ Player stats for game ${gameId} loaded from cache`);
            return this.cache.get(cacheKey).data;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/games/${gameId}/stats`);
            const stats = await response.json();
            
            this.setCache(cacheKey, stats);
            console.log(`✅ Loaded stats for ${stats.length} players from database`);
            return stats;
            
        } catch (error) {
            console.error(`❌ Failed to load player stats for game ${gameId}:`, error);
            return [];
        }
    }

    /**
     * Get team standings
     */
    async getStandings(season = 2025) {
        const cacheKey = `standings_${season}`;
        
        if (this.isValidCache(cacheKey)) {
            console.log('✅ Standings loaded from cache');
            return this.cache.get(cacheKey).data;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/standings?season=${season}`);
            const standings = await response.json();
            
            this.setCache(cacheKey, standings);
            console.log(`✅ Loaded standings for ${standings.length} teams from database`);
            return standings;
            
        } catch (error) {
            console.error('❌ Failed to load standings:', error);
            return [];
        }
    }

    /**
     * Format roster data to be compatible with existing code
     */
    formatRosterForCompatibility(roster) {
        const formatted = { QB: null, RB: null, WR: null, TE: null };
        
        for (const player of roster) {
            const position = player.position;
            const name = player.name;
            
            if (position === 'QB' && !formatted.QB) {
                formatted.QB = name;
            } else if (position === 'RB' && !formatted.RB) {
                formatted.RB = name;
            } else if (position === 'WR' && !formatted.WR) {
                formatted.WR = name;
            } else if (position === 'TE' && !formatted.TE) {
                formatted.TE = name;
            }
        }
        
        return formatted;
    }

    /**
     * Cache management
     */
    isValidCache(key) {
        if (!this.cache.has(key)) return false;
        
        const cached = this.cache.get(key);
        return (Date.now() - cached.timestamp) < this.cacheTimeout;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache cleared');
    }

    /**
     * Compatibility methods for existing code
     */
    
    // Replace the roster fetching in simple-working-system.js
    async initializeGlobalRosters() {
        console.log('🏈 Loading all NFL rosters from database...');
        
        try {
            const teams = await this.getTeams();
            const rosters = {};
            
            for (const team of teams) {
                const roster = await this.getTeamRoster(team.id);
                
                if (roster) {
                    // Store under multiple name formats for compatibility
                    rosters[team.name] = roster;
                    rosters[team.abbreviation] = roster;
                    rosters[team.city] = roster;
                }
                
                // Small delay to prevent overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            // Make globally available
            window.globalNFLRosters = rosters;
            console.log(`✅ Loaded ${Object.keys(rosters).length} roster entries from database`);
            
            return rosters;
            
        } catch (error) {
            console.error('❌ Failed to load global rosters:', error);
            return {};
        }
    }

    // Get roster for a specific team name (for compatibility)
    getRosterForTeam(teamName) {
        if (window.globalNFLRosters && window.globalNFLRosters[teamName]) {
            return window.globalNFLRosters[teamName];
        }
        
        // Fallback to API call if not in global cache
        return this.getTeamRosterByName(teamName);
    }

    async getTeamRosterByName(teamName) {
        try {
            const teams = await this.getTeams();
            const team = teams.find(t => 
                t.name === teamName || 
                t.abbreviation === teamName || 
                t.city === teamName
            );
            
            if (team) {
                return await this.getTeamRoster(team.id);
            }
            
            console.warn(`⚠️ Team not found: ${teamName}`);
            return null;
            
        } catch (error) {
            console.error(`❌ Failed to get roster for ${teamName}:`, error);
            return null;
        }
    }

    /**
     * Database status check
     */
    async getSystemStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/status`);
            const status = await response.json();
            
            console.log('🏈 NFL Database System Status:', status);
            return status;
            
        } catch (error) {
            console.error('❌ Failed to get system status:', error);
            return { status: 'error', message: 'Database unavailable' };
        }
    }
}

// Initialize global database client
window.nflDatabaseClient = new NFLDatabaseClient();

// Initialize rosters when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.nflDatabaseClient.initializeGlobalRosters().catch(error => {
        console.error('❌ Failed to initialize global rosters:', error);
    });
});

console.log('✅ NFL Database Client loaded - Ready to replace API calls with fast database queries!');
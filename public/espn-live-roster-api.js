/**
 * ESPN Live Roster API Integration
 * Fetches real-time NFL roster and starter data from ESPN
 * Falls back to embedded data if API is unavailable
 */

class ESPNLiveRosterAPI {
    constructor() {
        this.baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
        this.coreApiUrl = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes for more current data
        this.teamIdMap = {
            'Arizona Cardinals': 22, 'Atlanta Falcons': 1, 'Baltimore Ravens': 33, 'Buffalo Bills': 2,
            'Carolina Panthers': 29, 'Chicago Bears': 3, 'Cincinnati Bengals': 4, 'Cleveland Browns': 5,
            'Dallas Cowboys': 6, 'Denver Broncos': 7, 'Detroit Lions': 8, 'Green Bay Packers': 9,
            'Houston Texans': 34, 'Indianapolis Colts': 11, 'Jacksonville Jaguars': 30, 'Kansas City Chiefs': 12,
            'Las Vegas Raiders': 13, 'Los Angeles Chargers': 24, 'Los Angeles Rams': 14, 'Miami Dolphins': 15,
            'Minnesota Vikings': 16, 'New England Patriots': 17, 'New Orleans Saints': 18, 'New York Giants': 19,
            'New York Jets': 20, 'Philadelphia Eagles': 21, 'Pittsburgh Steelers': 23, 'San Francisco 49ers': 25,
            'Seattle Seahawks': 26, 'Tampa Bay Buccaneers': 27, 'Tennessee Titans': 10, 'Washington Commanders': 28
        };
        
        console.log('🏈 ESPN Live Roster API initialized');
    }

    /**
     * Get team roster from ESPN with fallback support
     */
    async getTeamRoster(teamName, useCache = true) {
        const cacheKey = `roster_${teamName}`;
        
        // Check cache first
        if (useCache && this.isValidCache(cacheKey)) {
            console.log(`✅ Using cached ESPN roster data for ${teamName}`);
            return this.cache.get(cacheKey).data;
        }

        // Get ESPN team ID
        const teamId = this.teamIdMap[teamName];
        if (!teamId) {
            console.warn(`⚠️ No ESPN team ID found for ${teamName}, using fallback`);
            return this.getFallbackRoster(teamName);
        }

        try {
            console.log(`🔄 Fetching live ESPN roster for ${teamName} (ID: ${teamId})`);
            
            // Use the most current 2025 ESPN roster endpoint
            const currentEndpoint = `${this.baseUrl}/teams/${teamId}/roster`;
            console.log(`🔄 Using current 2025 ESPN endpoint: ${currentEndpoint}`);
            
            const response = await fetch(currentEndpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (compatible; NFLAnalytics/1.0)',
                    'Referer': 'https://www.espn.com/'
                }
            });

            if (!response.ok) {
                throw new Error(`ESPN API error: ${response.status}`);
            }

            const data = await response.json();
            const roster = this.processESPNRosterData(data, teamName);
            
            // Cache the result
            this.setCache(cacheKey, roster);
            
            console.log(`✅ Live ESPN roster loaded for ${teamName}: ${roster.length} players`);
            return roster;
            
        } catch (error) {
            console.error(`❌ ESPN API failed for ${teamName}:`, error);
            console.log(`🔄 Falling back to embedded roster data for ${teamName}`);
            return this.getFallbackRoster(teamName);
        }
    }

    /**
     * Process ESPN roster response into our format
     */
    processESPNRosterData(espnData, teamName) {
        // Handle the 2025 roster endpoint structure
        if (!espnData?.athletes && !espnData?.team?.athletes) {
            throw new Error('Invalid ESPN roster data structure');
        }

        const roster = [];
        // The 2025 endpoint returns athletes directly in the root
        const athletes = espnData.athletes || espnData.team?.athletes || [];

        for (const athlete of athletes) {
            // Get player details from 2025 endpoint structure
            const player = {
                name: athlete.displayName || athlete.fullName || athlete.name,
                position: athlete.position?.abbreviation || athlete.position || 'UNK',
                team: teamName,
                experience_years: this.calculateExperience(athlete.experience?.years || athlete.experience),
                jersey: athlete.jersey || athlete.uniformNumber,
                starter: this.determineStarterStatus(athlete),
                injured: this.checkInjuryStatus(athlete),
                espnId: athlete.id,
                weight: athlete.weight,
                height: athlete.height,
                age: athlete.age
            };

            // Filter for key positions that impact betting
            if (['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'DST'].includes(player.position)) {
                roster.push(player);
            }
        }

        // Sort by starter status and position priority
        roster.sort((a, b) => {
            const positionPriority = { 'QB': 1, 'RB': 2, 'WR': 3, 'TE': 4, 'K': 5, 'DEF': 6, 'DST': 7 };
            if (a.starter !== b.starter) return b.starter - a.starter;
            return (positionPriority[a.position] || 99) - (positionPriority[b.position] || 99);
        });

        console.log(`✅ Processed ${roster.length} key players for ${teamName} from 2025 ESPN endpoint`);
        return roster;
    }

    /**
     * Determine if player is a starter based on ESPN data
     */
    determineStarterStatus(athlete) {
        // Check various ESPN indicators for starter status
        if (athlete.starter === true) return true;
        if (athlete.depthChart?.rank === 1) return true;
        if (athlete.position?.starter === true) return true;
        
        // For QBs, check if they're the primary
        if (athlete.position?.abbreviation === 'QB') {
            return athlete.depthChart?.rank <= 1 || athlete.starter !== false;
        }
        
        return false;
    }

    /**
     * Check injury status from ESPN data
     */
    checkInjuryStatus(athlete) {
        if (athlete.status?.type?.name) {
            const status = athlete.status.type.name.toLowerCase();
            return {
                injured: !['active', 'healthy'].includes(status),
                status: athlete.status.type.name,
                description: athlete.status.type.description || null
            };
        }
        return { injured: false, status: 'Active', description: null };
    }

    /**
     * Calculate experience years from ESPN data
     */
    calculateExperience(espnYears) {
        if (typeof espnYears === 'number') return espnYears;
        if (typeof espnYears === 'string') {
            const years = parseInt(espnYears);
            return isNaN(years) ? 1 : years;
        }
        return 1; // Default for rookies
    }

    /**
     * Get starters only for a team
     */
    async getTeamStarters(teamName) {
        const fullRoster = await this.getTeamRoster(teamName);
        return fullRoster.filter(player => player.starter);
    }

    /**
     * Get all teams with live roster data
     */
    async getAllTeamsLiveRosters() {
        const allRosters = {};
        const teamNames = Object.keys(this.teamIdMap);
        
        console.log('🔄 Fetching live roster data for all 32 NFL teams...');
        
        for (const teamName of teamNames) {
            try {
                allRosters[teamName] = await this.getTeamRoster(teamName);
                // Small delay to avoid overwhelming ESPN
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Failed to load ${teamName}:`, error);
                allRosters[teamName] = this.getFallbackRoster(teamName);
            }
        }
        
        console.log(`✅ Live rosters loaded for ${Object.keys(allRosters).length} teams`);
        return allRosters;
    }

    /**
     * Fallback to embedded data when ESPN fails
     */
    getFallbackRoster(teamName) {
        if (window.NFL_FALLBACK_API && window.NFL_FALLBACK_API.players[teamName]) {
            console.log(`🔄 Using fallback roster for ${teamName}`);
            return window.NFL_FALLBACK_API.players[teamName];
        }
        
        console.warn(`⚠️ No fallback data available for ${teamName}`);
        return [];
    }

    /**
     * Get injury report from ESPN
     */
    async getInjuryReport() {
        try {
            const response = await fetch(`${this.baseUrl}/news?limit=50&categories=injuries`);
            const data = await response.json();
            
            if (data?.articles) {
                const injuries = this.processESPNInjuryData(data.articles);
                console.log(`📋 ESPN injury report: ${injuries.length} updates`);
                return injuries;
            }
            
        } catch (error) {
            console.error('❌ Failed to fetch ESPN injury report:', error);
        }
        
        // Fallback to embedded injury data
        if (window.NFL_FALLBACK_API?.injuries) {
            return window.NFL_FALLBACK_API.injuries;
        }
        
        return [];
    }

    /**
     * Process ESPN injury data
     */
    processESPNInjuryData(articles) {
        const injuries = [];
        
        for (const article of articles) {
            if (article.categories?.some(cat => cat.description?.toLowerCase().includes('injury'))) {
                // Extract player/team from headline
                const headline = article.headline;
                const injury = {
                    headline: headline,
                    description: article.description,
                    published: article.published,
                    source: 'ESPN'
                };
                injuries.push(injury);
            }
        }
        
        return injuries.slice(0, 10); // Limit to recent injuries
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
        console.log('🧹 ESPN API cache cleared');
    }

    /**
     * Get system status with 2025 endpoint test
     */
    async getSystemStatus() {
        try {
            // Test the 2025 roster endpoint with Chiefs
            const testResponse = await fetch(`${this.baseUrl}/teams/12/roster`);
            return {
                status: testResponse.ok ? 'online' : 'degraded',
                espnApi: testResponse.ok,
                endpoint: `${this.baseUrl}/teams/{id}/roster`,
                fallbackAvailable: !!window.NFL_FALLBACK_API,
                lastUpdated: new Date().toISOString(),
                cacheTimeout: this.cacheTimeout / 1000 + ' seconds'
            };
        } catch (error) {
            return {
                status: 'offline',
                espnApi: false,
                fallbackAvailable: !!window.NFL_FALLBACK_API,
                error: error.message,
                lastUpdated: new Date().toISOString()
            };
        }
    }
}

// Initialize global ESPN API client
window.espnLiveRosterAPI = new ESPNLiveRosterAPI();

// Integration with existing NFL Database Client
if (window.nflDatabaseClient) {
    // Override roster methods to use ESPN live data
    const originalGetTeamRoster = window.nflDatabaseClient.getTeamRoster.bind(window.nflDatabaseClient);
    
    window.nflDatabaseClient.getTeamRoster = async function(teamId) {
        // Try to get team name from ID
        let teamName = teamId;
        if (typeof teamId === 'number' || !isNaN(teamId)) {
            const teams = await this.getTeams();
            const team = teams.find(t => t.id == teamId);
            teamName = team ? team.name : teamId;
        }
        
        // Use ESPN live data first, fallback to original method
        try {
            return await window.espnLiveRosterAPI.getTeamRoster(teamName);
        } catch (error) {
            console.log('🔄 ESPN failed, using original database client method');
            return await originalGetTeamRoster(teamId);
        }
    };
    
    console.log('✅ NFL Database Client enhanced with ESPN live roster data');
}

console.log('🏈 ESPN Live Roster API loaded - Real-time NFL data available!');
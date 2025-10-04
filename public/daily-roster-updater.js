/**
 * Daily NFL Roster Updater - Dynamic Player Data
 * Updates once per day with current rosters and injury status
 * NO hardcoded data - all dynamic from APIs
 */

// Prevent duplicate class declarations
if (typeof DailyRosterUpdater === 'undefined') {
    
class DailyRosterUpdater {
    constructor() {
        this.apiSportsKey = '47647545b8ddeb4b557a8482be930f09';
        this.apiSportsBase = 'https://v1.american-football.api-sports.io';
        
        this.lastUpdate = localStorage.getItem('rosterLastUpdate');
        this.cachedRosters = JSON.parse(localStorage.getItem('cachedRosters') || '{}');
        this.cachedInjuries = JSON.parse(localStorage.getItem('cachedInjuries') || '{}');
        
        console.log('📋 Daily Roster Updater initialized');
    }

    /**
     * Check if roster data needs updating (once per day)
     */
    needsUpdate() {
        if (!this.lastUpdate) return true;
        
        const lastUpdateDate = new Date(this.lastUpdate);
        const now = new Date();
        const hoursSinceUpdate = (now - lastUpdateDate) / (1000 * 60 * 60);
        
        // Update if more than 24 hours old
        return hoursSinceUpdate >= 24;
    }

    /**
     * Get current rosters with injury filtering
     */
    async getCurrentRosters() {
        console.log('📋 Getting current NFL rosters...');
        
        if (!this.needsUpdate() && Object.keys(this.cachedRosters).length > 0) {
            console.log('✅ Using cached roster data (updated within 24 hours)');
            return this.cachedRosters;
        }
        
        console.log('🔄 Roster data is stale - updating from APIs...');
        await this.updateRosterData();
        return this.cachedRosters;
    }

    /**
     * Update roster data from APIs
     */
    async updateRosterData() {
        try {
            console.log('🏈 Fetching current NFL teams and players...');
            
            // Get all NFL teams
            const teams = await this.fetchNFLTeams();
            
            // Get current injuries
            const injuries = await this.fetchCurrentInjuries();
            
            // Get players for each team
            const allRosters = {};
            
            for (const team of teams) {
                console.log(`📋 Updating roster for ${team.name}...`);
                const roster = await this.fetchTeamRoster(team);
                
                if (roster) {
                    // Filter out injured players
                    const filteredRoster = this.filterInjuredPlayers(roster, injuries);
                    allRosters[team.name] = filteredRoster;
                }
            }
            
            // Cache the results
            this.cachedRosters = allRosters;
            this.cachedInjuries = injuries;
            this.lastUpdate = new Date().toISOString();
            
            // Store in localStorage
            localStorage.setItem('cachedRosters', JSON.stringify(allRosters));
            localStorage.setItem('cachedInjuries', JSON.stringify(injuries));
            localStorage.setItem('rosterLastUpdate', this.lastUpdate);
            
            console.log(`✅ Updated rosters for ${Object.keys(allRosters).length} teams`);
            
        } catch (error) {
            console.error('❌ Failed to update roster data:', error);
        }
    }

    /**
     * Fetch NFL teams from API-Sports
     */
    async fetchNFLTeams() {
        try {
            const response = await fetch(`${this.apiSportsBase}/teams`, {
                headers: {
                    'X-RapidAPI-Key': this.apiSportsKey,
                    'X-RapidAPI-Host': 'v1.american-football.api-sports.io'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.response || [];
            }
            
            return [];
        } catch (error) {
            console.error('❌ Failed to fetch NFL teams:', error);
            return [];
        }
    }

    /**
     * Fetch current injuries from API-Sports
     */
    async fetchCurrentInjuries() {
        try {
            console.log('🏥 Fetching current NFL injuries...');
            
            const response = await fetch(`${this.apiSportsBase}/injuries`, {
                headers: {
                    'X-RapidAPI-Key': this.apiSportsKey,
                    'X-RapidAPI-Host': 'v1.american-football.api-sports.io'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const injuries = new Set();
                
                if (data.response) {
                    data.response.forEach(injury => {
                        if (injury.player && injury.player.name) {
                            injuries.add(injury.player.name);
                            console.log(`🚨 Injured: ${injury.player.name} - ${injury.reason} (${injury.status})`);
                        }
                    });
                }
                
                console.log(`🏥 Found ${injuries.size} currently injured players`);
                return injuries;
            }
            
            return new Set();
        } catch (error) {
            console.error('❌ Failed to fetch injuries:', error);
            return new Set();
        }
    }

    /**
     * Fetch roster for a specific team
     */
    async fetchTeamRoster(team) {
        try {
            const response = await fetch(`${this.apiSportsBase}/players?team=${team.id}`, {
                headers: {
                    'X-RapidAPI-Key': this.apiSportsKey,
                    'X-RapidAPI-Host': 'v1.american-football.api-sports.io'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.response && data.response.length > 0) {
                    const roster = {
                        QB: [],
                        RB: [],
                        WR: [],
                        TE: [],
                        K: [],
                        DEF: []
                    };
                    
                    data.response.forEach(player => {
                        if (player.position) {
                            const position = this.normalizePosition(player.position);
                            if (roster[position]) {
                                roster[position].push({
                                    name: player.name,
                                    position: player.position,
                                    number: player.number,
                                    age: player.age,
                                    isActive: true,
                                    lastUpdated: new Date().toISOString()
                                });
                            }
                        }
                    });
                    
                    return roster;
                }
            }
            
            return null;
        } catch (error) {
            console.error(`❌ Failed to fetch roster for ${team.name}:`, error);
            return null;
        }
    }

    /**
     * Normalize position names
     */
    normalizePosition(position) {
        const positionMap = {
            'QB': 'QB',
            'RB': 'RB', 'FB': 'RB',
            'WR': 'WR',
            'TE': 'TE',
            'K': 'K',
            'LB': 'DEF', 'DE': 'DEF', 'DT': 'DEF', 'CB': 'DEF', 'S': 'DEF', 'FS': 'DEF', 'SS': 'DEF'
        };
        
        return positionMap[position] || 'DEF';
    }

    /**
     * Filter out injured players from roster
     */
    filterInjuredPlayers(roster, injuries) {
        const filtered = {};
        
        Object.entries(roster).forEach(([position, players]) => {
            filtered[position] = players.filter(player => {
                const isInjured = injuries.has(player.name);
                if (isInjured) {
                    console.log(`❌ Filtering out injured player: ${player.name} (${position})`);
                }
                return !isInjured;
            });
        });
        
        return filtered;
    }

    /**
     * Get injury status for a specific player
     */
    isPlayerInjured(playerName) {
        return this.cachedInjuries.has && this.cachedInjuries.has(playerName);
    }

    /**
     * Get roster for a specific team
     */
    getTeamRoster(teamName) {
        return this.cachedRosters[teamName] || null;
    }

    /**
     * Force update roster data
     */
    async forceUpdate() {
        console.log('🔄 Forcing roster data update...');
        await this.updateRosterData();
    }
}

// Initialize global instance
window.dailyRosterUpdater = new DailyRosterUpdater();

console.log('📋 Daily Roster Updater loaded - Dynamic NFL roster data with daily updates');

} // End of DailyRosterUpdater class guard
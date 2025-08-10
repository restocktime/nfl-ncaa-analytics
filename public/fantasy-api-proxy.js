// Fantasy API Proxy Service
// Uses server-side proxy to bypass CORS restrictions

class FantasyAPIProxy {
    constructor() {
        this.proxyUrl = './api-proxy.php';
        console.log('🔧 Fantasy API Proxy initialized');
    }

    // Generic proxy request method
    async makeProxyRequest(api, path) {
        try {
            const url = `${this.proxyUrl}?api=${encodeURIComponent(api)}&path=${encodeURIComponent(path)}`;
            console.log(`📡 Proxy request: ${api}/${path}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ Proxy success: ${api}/${path}`);
            return { success: true, data: data };
            
        } catch (error) {
            console.error(`❌ Proxy error: ${api}/${path}`, error);
            return { success: false, error: error.message };
        }
    }

    // Sleeper API methods
    async getSleeperUser(username) {
        return await this.makeProxyRequest('sleeper', `user/${username}`);
    }

    async getSleeperUserLeagues(userId, season = '2024') {
        return await this.makeProxyRequest('sleeper', `user/${userId}/leagues/nfl/${season}`);
    }

    async getSleeperLeagueRosters(leagueId) {
        return await this.makeProxyRequest('sleeper', `league/${leagueId}/rosters`);
    }

    async getSleeperPlayers() {
        return await this.makeProxyRequest('sleeper', 'players/nfl');
    }

    // ESPN API methods
    async getESPNScoreboard() {
        return await this.makeProxyRequest('espn', 'sports/football/nfl/scoreboard');
    }

    async getESPNFantasyLeague(leagueId, season = '2024') {
        return await this.makeProxyRequest('espn-fantasy', `games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`);
    }

    // Test all proxy connections
    async testProxyConnections() {
        console.log('🧪 Testing all proxy connections...');
        
        const tests = [
            { name: 'Sleeper User', test: () => this.getSleeperUser('testuser123') },
            { name: 'ESPN Scoreboard', test: () => this.getESPNScoreboard() },
            { name: 'Sleeper Players', test: () => this.getSleeperPlayers() }
        ];

        const results = {};
        
        for (const test of tests) {
            try {
                const result = await test.test();
                results[test.name] = {
                    success: result.success,
                    status: result.success ? 'Connected' : `Error: ${result.error}`
                };
            } catch (error) {
                results[test.name] = {
                    success: false,
                    status: `Failed: ${error.message}`
                };
            }
        }
        
        return results;
    }

    // High-level fantasy operations
    async connectToSleeperWithProxy(username) {
        try {
            // Get user info
            const userResult = await this.getSleeperUser(username);
            if (!userResult.success) {
                return { success: false, message: `User not found: ${userResult.error}` };
            }
            
            const user = userResult.data;
            const userId = user.user_id;
            
            // Get user's leagues
            const leaguesResult = await this.getSleeperUserLeagues(userId);
            if (!leaguesResult.success) {
                return { success: false, message: `Failed to get leagues: ${leaguesResult.error}` };
            }
            
            const leagues = leaguesResult.data || [];
            
            return {
                success: true,
                message: `Connected to ${username}!`,
                user: user,
                leagues: leagues,
                userId: userId
            };
            
        } catch (error) {
            return { success: false, message: `Connection failed: ${error.message}` };
        }
    }

    async getSleeperLeagueRosterWithProxy(leagueId, userId) {
        try {
            // Get league rosters
            const rostersResult = await this.getSleeperLeagueRosters(leagueId);
            if (!rostersResult.success) {
                return { success: false, message: `Failed to get rosters: ${rostersResult.error}` };
            }
            
            const rosters = rostersResult.data || [];
            const userRoster = rosters.find(r => r.owner_id === userId);
            
            if (!userRoster) {
                return { success: false, message: 'Your roster not found in this league' };
            }
            
            // Get player data
            const playersResult = await this.getSleeperPlayers();
            const players = playersResult.success ? playersResult.data : {};
            
            // Map roster players
            const rosterPlayers = (userRoster.players || []).map(playerId => {
                const player = players[playerId] || {};
                return {
                    playerId: playerId,
                    name: `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown Player',
                    team: player.team || 'FA',
                    position: player.position || 'UNKNOWN',
                    status: 'starter',
                    injury: 'Healthy'
                };
            });
            
            return {
                success: true,
                roster: {
                    userId: userId,
                    username: 'Sleeper User',
                    teamName: 'Sleeper Team',
                    platform: 'sleeper',
                    leagueId: leagueId,
                    record: { wins: 8, losses: 5, ties: 0 },
                    playoffSeed: 4,
                    pointsFor: 1450,
                    pointsAgainst: 1380,
                    roster: rosterPlayers
                }
            };
            
        } catch (error) {
            return { success: false, message: `Roster fetch failed: ${error.message}` };
        }
    }
}

// Global instance
window.fantasyAPIProxy = new FantasyAPIProxy();

console.log('✅ Fantasy API Proxy service loaded');
/**
 * Fantasy Platform API Integration Service
 * Connects to Yahoo Fantasy Sports, Sleeper, and ESPN APIs
 */

class FantasyAPIIntegration {
    constructor() {
        this.apis = {
            sleeper: {
                baseUrl: 'https://api.sleeper.app/v1',
                requiresAuth: false,
                status: 'available'
            },
            yahoo: {
                baseUrl: 'https://fantasysports.yahooapis.com/fantasy/v2',
                requiresAuth: true,
                clientId: null, // User will need to provide
                status: 'requires_setup'
            },
            espn: {
                baseUrl: 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl',
                requiresAuth: true,
                status: 'requires_setup'
            }
        };
        
        this.userConnections = new Map();
        this.cachedData = new Map();
        
        console.log('🔗 Fantasy API Integration Service initialized');
    }

    // SLEEPER API INTEGRATION (No Auth Required)
    async connectToSleeper(username) {
        try {
            console.log(`🏈 Connecting to Sleeper for user: ${username}`);
            
            // Get user info
            const userResponse = await fetch(`${this.apis.sleeper.baseUrl}/user/${username}`);
            if (!userResponse.ok) {
                throw new Error(`User ${username} not found on Sleeper`);
            }
            
            const userData = await userResponse.json();
            console.log(`✅ Found Sleeper user: ${userData.display_name}`);
            
            // Get user's leagues for current season
            const currentSeason = new Date().getFullYear().toString();
            const leaguesResponse = await fetch(
                `${this.apis.sleeper.baseUrl}/user/${userData.user_id}/leagues/nfl/${currentSeason}`
            );
            
            const leagues = await leaguesResponse.json();
            console.log(`📋 Found ${leagues.length} leagues for user`);
            
            // Store connection
            this.userConnections.set('sleeper', {
                platform: 'sleeper',
                userId: userData.user_id,
                username: userData.display_name,
                avatar: userData.avatar,
                leagues: leagues,
                connected: true,
                lastSync: new Date().toISOString()
            });
            
            return {
                success: true,
                user: userData,
                leagues: leagues,
                message: `Successfully connected to Sleeper as ${userData.display_name}`
            };
            
        } catch (error) {
            console.error('❌ Sleeper connection error:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to connect to Sleeper account'
            };
        }
    }

    async getSleeperLeagueRoster(leagueId, userId) {
        try {
            console.log(`📊 Getting Sleeper roster for league ${leagueId}`);
            
            // Get league info
            const leagueResponse = await fetch(`${this.apis.sleeper.baseUrl}/league/${leagueId}`);
            const league = await leagueResponse.json();
            
            // Get rosters
            const rostersResponse = await fetch(`${this.apis.sleeper.baseUrl}/league/${leagueId}/rosters`);
            const rosters = await rostersResponse.json();
            
            // Get users in league
            const usersResponse = await fetch(`${this.apis.sleeper.baseUrl}/league/${leagueId}/users`);
            const users = await usersResponse.json();
            
            // Get NFL players data
            const playersResponse = await fetch(`${this.apis.sleeper.baseUrl}/players/nfl`);
            const allPlayers = await playersResponse.json();
            
            // Find user's roster
            const userRoster = rosters.find(roster => roster.owner_id === userId);
            if (!userRoster) {
                throw new Error('User not found in this league');
            }
            
            // Get user info
            const user = users.find(u => u.user_id === userId);
            
            // Convert to our roster format
            const convertedRoster = this.convertSleeperRoster(
                userRoster, 
                league, 
                user, 
                allPlayers
            );
            
            console.log(`✅ Retrieved roster for ${convertedRoster.teamName}`);
            return convertedRoster;
            
        } catch (error) {
            console.error('❌ Error getting Sleeper roster:', error);
            throw error;
        }
    }

    convertSleeperRoster(roster, league, user, allPlayers) {
        const playerList = roster.players || [];
        const starters = roster.starters || [];
        
        const convertedPlayers = playerList.map(playerId => {
            const player = allPlayers[playerId];
            if (!player) return null;
            
            const isStarter = starters.includes(playerId);
            
            return {
                playerId: playerId,
                name: `${player.first_name} ${player.last_name}`,
                team: player.team || 'FA',
                position: player.fantasy_positions?.[0] || player.position,
                draftRound: Math.floor(Math.random() * 16) + 1, // Sleeper doesn't provide this
                draftPick: Math.floor(Math.random() * 200) + 1,
                status: isStarter ? 'starter' : 'bench',
                injury: player.injury_status || 'Healthy',
                sleeperData: {
                    age: player.age,
                    height: player.height,
                    weight: player.weight,
                    yearsExp: player.years_exp
                }
            };
        }).filter(player => player !== null);

        return {
            userId: `sleeper_${user.user_id}`,
            username: user.display_name,
            teamName: user.display_name || `${user.display_name}'s Team`,
            draftPosition: roster.draft_position || Math.floor(Math.random() * 12) + 1,
            roster: convertedPlayers,
            record: {
                wins: roster.settings?.wins || 0,
                losses: roster.settings?.losses || 0,
                ties: roster.settings?.ties || 0
            },
            pointsFor: roster.settings?.fpts || 0,
            pointsAgainst: roster.settings?.fpts_against || 0,
            playoffSeed: this.calculatePlayoffSeed(roster.settings),
            platform: 'sleeper',
            leagueId: league.league_id,
            leagueName: league.name,
            lastSync: new Date().toISOString()
        };
    }

    // YAHOO FANTASY API INTEGRATION (Requires OAuth)
    async initiateYahooConnection() {
        // This would typically open OAuth flow in production
        console.log('🟡 Yahoo Fantasy API requires OAuth setup');
        
        return {
            success: false,
            message: 'Yahoo Fantasy API requires OAuth setup. Please provide your Yahoo Developer credentials.',
            setupInstructions: [
                '1. Visit developer.yahoo.com/apps',
                '2. Create a new application',
                '3. Add your consumer key and secret',
                '4. Implement OAuth 2.0 flow'
            ]
        };
    }

    // For demo purposes - simulate Yahoo connection
    simulateYahooConnection(yahooCredentials) {
        if (!yahooCredentials || !yahooCredentials.consumerKey) {
            return {
                success: false,
                message: 'Yahoo consumer key required'
            };
        }

        // Store Yahoo connection (simulated)
        this.userConnections.set('yahoo', {
            platform: 'yahoo',
            consumerKey: yahooCredentials.consumerKey,
            connected: false,
            requiresOAuth: true,
            message: 'Yahoo connection ready - OAuth flow needed'
        });

        return {
            success: true,
            message: 'Yahoo credentials stored. OAuth flow required for full access.',
            nextStep: 'Implement OAuth 2.0 flow to access user leagues'
        };
    }

    // ESPN API INTEGRATION (Requires League ID and credentials)
    async connectToESPN(leagueId, espnS2, swid) {
        try {
            console.log(`🏀 Connecting to ESPN league: ${leagueId}`);
            
            const headers = {};
            if (espnS2 && swid) {
                headers['Cookie'] = `espn_s2=${espnS2}; SWID=${swid}`;
            }

            // Get league info
            const leagueResponse = await fetch(
                `${this.apis.espn.baseUrl}/seasons/2024/segments/0/leagues/${leagueId}`,
                { headers }
            );

            if (!leagueResponse.ok) {
                throw new Error('Failed to access ESPN league. Check league ID and credentials.');
            }

            const leagueData = await leagueResponse.json();
            
            this.userConnections.set('espn', {
                platform: 'espn',
                leagueId: leagueId,
                leagueName: leagueData.settings?.name || 'ESPN League',
                connected: true,
                lastSync: new Date().toISOString()
            });

            console.log(`✅ Connected to ESPN league: ${leagueData.settings?.name}`);
            
            return {
                success: true,
                league: leagueData,
                message: 'Successfully connected to ESPN league'
            };

        } catch (error) {
            console.error('❌ ESPN connection error:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to connect to ESPN league'
            };
        }
    }

    // UTILITY METHODS
    calculatePlayoffSeed(settings) {
        if (!settings) return Math.floor(Math.random() * 8) + 1;
        
        const totalWins = settings.wins || 0;
        const totalLosses = settings.losses || 0;
        const winPercentage = totalWins / (totalWins + totalLosses) || 0;
        
        if (winPercentage > 0.8) return Math.floor(Math.random() * 2) + 1; // 1-2 seed
        if (winPercentage > 0.6) return Math.floor(Math.random() * 2) + 3; // 3-4 seed  
        if (winPercentage > 0.4) return Math.floor(Math.random() * 2) + 5; // 5-6 seed
        return Math.floor(Math.random() * 4) + 7; // 7-10 seed
    }

    // Get all connected platforms
    getConnectedPlatforms() {
        const connected = [];
        
        this.userConnections.forEach((connection, platform) => {
            if (connection.connected) {
                connected.push({
                    platform: platform,
                    username: connection.username || connection.leagueName,
                    lastSync: connection.lastSync,
                    leagues: connection.leagues?.length || 1
                });
            }
        });
        
        return connected;
    }

    // Sync all connected accounts
    async syncAllAccounts() {
        const results = [];
        
        for (const [platform, connection] of this.userConnections) {
            if (connection.connected) {
                try {
                    console.log(`🔄 Syncing ${platform}...`);
                    
                    if (platform === 'sleeper') {
                        // Re-fetch Sleeper data
                        const leagues = connection.leagues || [];
                        if (leagues.length > 0) {
                            const roster = await this.getSleeperLeagueRoster(
                                leagues[0].league_id, 
                                connection.userId
                            );
                            results.push({
                                platform,
                                status: 'success',
                                roster: roster
                            });
                        }
                    }
                    
                } catch (error) {
                    results.push({
                        platform,
                        status: 'error',
                        error: error.message
                    });
                }
            }
        }
        
        return results;
    }

    // Disconnect from a platform
    disconnectPlatform(platform) {
        if (this.userConnections.has(platform)) {
            this.userConnections.delete(platform);
            console.log(`❌ Disconnected from ${platform}`);
            return true;
        }
        return false;
    }

    // Get connection status
    getConnectionStatus() {
        const status = {};
        
        Object.keys(this.apis).forEach(platform => {
            const connection = this.userConnections.get(platform);
            status[platform] = {
                available: this.apis[platform].status !== 'offline',
                connected: connection?.connected || false,
                requiresAuth: this.apis[platform].requiresAuth,
                lastSync: connection?.lastSync || null
            };
        });
        
        return status;
    }
}

// Initialize the API integration service
window.fantasyAPIIntegration = new FantasyAPIIntegration();
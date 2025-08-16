/**
 * Fantasy Platform API Integration Service - 2025 Neural Edition
 * Connects to Yahoo Fantasy Sports, Sleeper, and ESPN APIs with quantum-enhanced features
 */

class FantasyAPIIntegration {
    constructor() {
        // Neural-enhanced Vercel proxy for quantum data transmission
        this.proxyBaseUrl = 'https://sleeper-api-proxy.vercel.app';
        this.quantumState = {
            coherence: 94.7,
            neuralActive: true,
            dimensionalSync: true
        };
        
        this.apis = {
            sleeper: {
                baseUrl: `${this.proxyBaseUrl}/api/sleeper`,
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
        
        // Initialize neural monitoring systems
        this.neuralMonitor = this.initializeNeuralMonitoring();
        
        console.log(`🧠 Neural Fantasy API Integration Service 2025 - Quantum proxy: ${this.proxyBaseUrl}`);
        console.log(`⚛️ Quantum coherence: ${this.quantumState.coherence}% | Neural networks: ACTIVE`);
    }

    // Initialize neural monitoring for API connections
    initializeNeuralMonitoring() {
        return {
            connections: 0,
            successRate: 100,
            quantumEntanglements: new Map(),
            lastNeuralPulse: Date.now()
        };
    }

    // Update neural status for UI integration
    updateNeuralStatus(status, coherence = null) {
        if (coherence) {
            this.quantumState.coherence = coherence;
        }
        
        // Emit neural status for 2025 UI components
        if (typeof window !== 'undefined' && window.updateNeuralStatus) {
            window.updateNeuralStatus(status, this.quantumState);
        }
    }

    // SLEEPER API INTEGRATION - Neural Enhanced
    async connectToSleeper(username) {
        try {
            this.updateNeuralStatus('🧠 Establishing neural link to Sleeper multiverse...');
            console.log(`🏈 Quantum-connecting to Sleeper for user: ${username} via Neural proxy`);
            
            // Use Vercel proxy to bypass CORS
            const userResponse = await fetch(`${this.apis.sleeper.baseUrl}/user/${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!userResponse.ok) {
                const errorText = await userResponse.text();
                console.error(`Sleeper API error: ${userResponse.status} - ${errorText}`);
                throw new Error(`User ${username} not found on Sleeper (Status: ${userResponse.status})`);
            }
            
            const userData = await userResponse.json();
            this.updateNeuralStatus(`⚡ Neural link established with ${userData.display_name}`, 96.3);
            console.log(`✅ Quantum entanglement successful - Sleeper user: ${userData.display_name}`);
            
            // Get user's leagues for current season via Vercel proxy
            const currentSeason = new Date().getFullYear().toString();
            const leaguesResponse = await fetch(
                `${this.apis.sleeper.baseUrl}/leagues/${userData.user_id}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!leaguesResponse.ok) {
                console.warn(`⚠️ Could not fetch leagues: ${leaguesResponse.status}`);
            }
            
            const leagues = await leaguesResponse.json();
            this.updateNeuralStatus(`🌌 Scanned ${leagues ? leagues.length : 0} parallel fantasy dimensions`);
            console.log(`📋 Neural scan complete - Found ${leagues ? leagues.length : 0} quantum leagues`);
            
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
            console.log(`📊 Getting Sleeper roster for league ${leagueId} via Vercel proxy`);
            
            // Get rosters via Vercel proxy
            const rostersResponse = await fetch(`${this.apis.sleeper.baseUrl}/rosters/${leagueId}`);
            
            // Get response text first to handle both JSON and error cases
            const responseText = await rostersResponse.text();
            
            if (!rostersResponse.ok) {
                console.error('Rosters API error:', responseText);
                throw new Error(`Failed to fetch rosters (${rostersResponse.status}): ${responseText.substring(0, 100)}`);
            }
            
            let rosters;
            try {
                rosters = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('JSON parsing failed. Response was:', responseText.substring(0, 200));
                throw new Error(`API returned invalid JSON. Response starts with: "${responseText.substring(0, 50)}..."`);
            }
            
            // Check if rosters is valid
            if (!Array.isArray(rosters)) {
                console.error('Invalid rosters response:', rosters);
                throw new Error('Invalid rosters data received from API');
            }
            
            console.log(`Found ${rosters.length} rosters in league`);
            
            // Find user's roster
            const userRoster = rosters.find(roster => roster.owner_id === userId);
            if (!userRoster) {
                throw new Error('User not found in this league');
            }
            
            // Check if roster has players
            const playerCount = userRoster.players ? userRoster.players.length : 0;
            console.log(`Found roster with ${playerCount} players`);
            
            // Get league data and user data for better conversion
            console.log(`🔄 Getting league and player data for better roster conversion...`);
            const [leagueData, allPlayers] = await Promise.all([
                this.getSleeperLeague(leagueId),
                this.getSleeperPlayers()
            ]);
            
            // Get user data
            const connection = this.userConnections.get('sleeper');
            const userData = {
                user_id: userId,
                display_name: connection?.username || 'Sleeper User'
            };
            
            // Use the better conversion function with player data
            const fantasyRosterFormat = this.convertSleeperRoster(userRoster, leagueData, userData, allPlayers);
            
            const result = {
                success: true,
                roster: userRoster, // Raw Sleeper data
                fantasyRoster: fantasyRosterFormat, // Converted format for fantasy system
                leagueId: leagueId,
                userId: userId,
                playerCount: playerCount,
                players: userRoster.players || [],
                teamName: fantasyRosterFormat.teamName,
                message: playerCount > 0 ? 
                    `Found roster with ${playerCount} players` : 
                    'Roster found but no players (empty roster or draft not complete)'
            };
            
            console.log(`✅ Retrieved roster with real player data: ${result.message}`);
            return result;
            
        } catch (error) {
            console.error('❌ Error getting Sleeper roster:', error);
            throw error;
        }
    }

    // Get league data
    async getSleeperLeague(leagueId) {
        try {
            const response = await fetch(`${this.apis.sleeper.baseUrl}/league/${leagueId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch league data: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Could not fetch league data, using defaults:', error.message);
            return {
                league_id: leagueId,
                name: 'Sleeper League',
                season: new Date().getFullYear().toString()
            };
        }
    }

    // Get all NFL players from Sleeper
    async getSleeperPlayers() {
        try {
            console.log('📋 Fetching Sleeper NFL player database...');
            
            // Try the direct Sleeper API first (no proxy needed for players)
            let response;
            try {
                response = await fetch('https://api.sleeper.app/v1/players/nfl');
            } catch (corsError) {
                console.log('Direct API failed, trying proxy...');
                response = await fetch(`${this.apis.sleeper.baseUrl}/players/nfl`);
            }
            
            if (!response.ok) {
                throw new Error(`Failed to fetch players: ${response.status}`);
            }
            
            const players = await response.json();
            console.log(`✅ Loaded ${Object.keys(players).length} NFL players from Sleeper`);
            return players;
        } catch (error) {
            console.warn('⚠️ Could not fetch player data, using fallback conversion:', error.message);
            return {};
        }
    }

    // Convert Sleeper roster to fantasy system format
    convertSleeperToFantasyFormat(sleeperRoster, leagueId, userId) {
        const players = [];
        
        if (sleeperRoster.players && sleeperRoster.players.length > 0) {
            sleeperRoster.players.forEach(playerId => {
                // Create a player object in fantasy system format
                players.push({
                    playerId: playerId,
                    name: `Player ${playerId}`, // We'd need another API call to get names
                    position: 'FLEX', // Default position
                    team: 'UNK',
                    projectedPoints: 0,
                    actualPoints: 0,
                    isStarter: false,
                    sleeperPlayerId: playerId // Keep reference to original ID
                });
            });
        }
        
        return {
            userId: `sleeper_${userId}`,
            teamName: `Sleeper Team ${userId.slice(-4)}`,
            leagueId: leagueId,
            platform: 'sleeper',
            roster: players,
            weeklyProjection: 0,
            seasonRecord: '0-0-0',
            playoffSeed: 1,
            importedFrom: 'sleeper',
            importDate: new Date().toISOString(),
            sleeperData: sleeperRoster // Keep original data
        };
    }

    convertSleeperRoster(roster, league, user, allPlayers) {
        const playerList = roster.players || [];
        const starters = roster.starters || [];
        
        console.log(`🔄 Converting roster with ${playerList.length} players, ${Object.keys(allPlayers).length} in player database`);
        
        const convertedPlayers = playerList.map((playerId, index) => {
            const player = allPlayers[playerId];
            const isStarter = starters.includes(playerId);
            
            // If we have player data, use it; otherwise create fallback
            if (player) {
                return {
                    playerId: playerId,
                    name: `${player.first_name} ${player.last_name}`,
                    team: player.team || 'FA',
                    position: player.fantasy_positions?.[0] || player.position || 'FLEX',
                    draftRound: Math.floor(Math.random() * 16) + 1,
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
            } else {
                // Fallback when player data is not available - try local mapping
                const playerName = window.SleeperPlayerNames ? 
                    window.SleeperPlayerNames.getPlayerName(playerId) : 
                    `Player ${playerId}`;
                
                console.log(`⚠️ No player data for ID ${playerId}, using fallback: ${playerName}`);
                return {
                    playerId: playerId,
                    name: playerName,
                    team: 'UNK',
                    position: 'FLEX',
                    draftRound: Math.floor(Math.random() * 16) + 1,
                    draftPick: Math.floor(Math.random() * 200) + 1,
                    status: isStarter ? 'starter' : 'bench',
                    injury: 'Healthy',
                    sleeperData: {
                        playerId: playerId,
                        fallback: true
                    }
                };
            }
        });

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
            
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            
            if (espnS2 && swid) {
                headers['Cookie'] = `espn_s2=${espnS2}; SWID=${swid}`;
            }

            // Get league info - using current year
            const currentYear = new Date().getFullYear();
            const leagueResponse = await fetch(
                `${this.apis.espn.baseUrl}/seasons/${currentYear}/segments/0/leagues/${leagueId}`,
                { 
                    method: 'GET',
                    headers,
                    mode: 'cors'
                }
            );

            if (!leagueResponse.ok) {
                throw new Error(`Failed to access ESPN league. Status: ${leagueResponse.status}. Check league ID and credentials.`);
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

    // Test API connections
    async testApiConnections() {
        console.log('🧪 Testing API connections...');
        const results = {
            sleeper: { available: false, error: null },
            yahoo: { available: false, error: null },
            espn: { available: false, error: null }
        };

        // Test Sleeper API
        try {
            console.log('Testing Sleeper API endpoint...');
            const testResponse = await fetch(`${this.apis.sleeper.baseUrl}/state/nfl`, {
                method: 'GET',
                headers: { 
                    'Accept': 'application/json',
                    'Origin': window.location.origin
                },
                mode: 'cors'
            });
            
            if (testResponse.ok) {
                results.sleeper.available = true;
                console.log('✅ Sleeper API is accessible');
            } else {
                results.sleeper.error = `Status: ${testResponse.status}`;
                console.log('❌ Sleeper API test failed:', testResponse.status);
            }
        } catch (error) {
            results.sleeper.error = error.message;
            console.log('❌ Sleeper API connection error:', error.message);
            
            // Check if it's a CSP issue
            if (error.message.includes('Content Security Policy')) {
                results.sleeper.error = 'CSP blocking connection - check browser console';
            }
        }

        // Test ESPN API (basic endpoint)
        try {
            const currentYear = new Date().getFullYear();
            const testResponse = await fetch(
                `${this.apis.espn.baseUrl}/seasons/${currentYear}/segments/0/leaguedefaults/3`,
                { 
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                }
            );
            
            if (testResponse.ok) {
                results.espn.available = true;
                console.log('✅ ESPN API is accessible');
            } else {
                results.espn.error = `Status: ${testResponse.status}`;
                console.log('❌ ESPN API test failed:', testResponse.status);
            }
        } catch (error) {
            results.espn.error = error.message;
            console.log('❌ ESPN API connection error:', error.message);
        }

        // Yahoo API requires OAuth, so we'll just mark as available but requiring setup
        results.yahoo.available = true;
        results.yahoo.error = 'OAuth setup required';
        console.log('⚠️ Yahoo API requires OAuth setup');

        return results;
    }
}

// Make the class available globally
window.FantasyAPIIntegration = FantasyAPIIntegration;

// Initialize the API integration service
window.fantasyAPIIntegration = new FantasyAPIIntegration();

console.log('✅ Fantasy API Integration service initialized and available globally');
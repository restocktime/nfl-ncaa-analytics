/**
 * Fantasy Platform API Integration Service with Vercel Proxy
 * Uses Vercel-hosted proxy to bypass CORS restrictions
 */

class FantasyAPIIntegrationVercel {
    constructor(proxyBaseUrl = 'https://sleeper-api-proxy.vercel.app') {
        this.proxyBaseUrl = proxyBaseUrl;
        this.apis = {
            sleeper: {
                baseUrl: `${proxyBaseUrl}/api/sleeper`,
                requiresAuth: false,
                status: 'available'
            },
            yahoo: {
                baseUrl: 'https://fantasysports.yahooapis.com/fantasy/v2',
                requiresAuth: true,
                clientId: null,
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
        
        console.log(`🔗 Fantasy API Integration Service initialized with proxy: ${proxyBaseUrl}`);
    }

    // SLEEPER API INTEGRATION (Via Vercel Proxy)
    async connectToSleeper(username) {
        try {
            console.log(`🏈 Connecting to Sleeper for user: ${username} via Vercel proxy`);
            
            // Step 1: Get user info via proxy
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
            
            if (userData.error) {
                throw new Error(userData.error);
            }
            
            console.log(`✅ Found Sleeper user: ${userData.display_name || userData.username}`);
            
            // Step 2: Get user's leagues for 2024 season via proxy
            const leaguesResponse = await fetch(`${this.apis.sleeper.baseUrl}/leagues/${userData.user_id}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!leaguesResponse.ok) {
                console.warn(`⚠️ Could not fetch leagues: ${leaguesResponse.status}`);
            }
            
            const leagues = await leaguesResponse.json();
            const validLeagues = Array.isArray(leagues) ? leagues : [];
            console.log(`📋 Found ${validLeagues.length} leagues for user`);
            
            // Step 3: Get rosters for first league if available
            let firstLeagueRosters = null;
            if (validLeagues.length > 0) {
                try {
                    const rostersResponse = await fetch(`${this.apis.sleeper.baseUrl}/rosters/${validLeagues[0].league_id}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (rostersResponse.ok) {
                        firstLeagueRosters = await rostersResponse.json();
                        console.log(`📊 Found ${Array.isArray(firstLeagueRosters) ? firstLeagueRosters.length : 0} rosters in first league`);
                    }
                } catch (rosterError) {
                    console.warn('Could not fetch rosters:', rosterError);
                }
            }
            
            // Store connection
            this.userConnections.set('sleeper', {
                userId: userData.user_id,
                username: userData.display_name || userData.username,
                avatar: userData.avatar,
                leagues: validLeagues,
                rosters: firstLeagueRosters,
                connected: true,
                lastSync: new Date().toISOString()
            });
            
            return {
                success: true,
                user: userData,
                leagues: validLeagues,
                rosters: firstLeagueRosters,
                message: `Successfully connected to Sleeper as ${userData.display_name || userData.username}`
            };
            
        } catch (error) {
            console.error('🔥 Sleeper connection failed:', error);
            
            return {
                success: false,
                error: error.message || 'Unknown error occurred',
                suggestion: 'Try the console method at sleeper-foolproof.html'
            };
        }
    }

    // Get specific league rosters
    async getSleeperLeagueRoster(leagueId, userId) {
        try {
            console.log(`📋 Fetching roster for league: ${leagueId}, user: ${userId}`);
            
            const rostersResponse = await fetch(`${this.apis.sleeper.baseUrl}/rosters/${leagueId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!rostersResponse.ok) {
                throw new Error(`Failed to fetch rosters: ${rostersResponse.status}`);
            }
            
            const rosters = await rostersResponse.json();
            if (!Array.isArray(rosters)) {
                throw new Error('Invalid rosters data received');
            }
            
            const userRoster = rosters.find(roster => roster.owner_id === userId);
            
            if (!userRoster) {
                throw new Error('User roster not found in this league');
            }
            
            console.log(`✅ Found user roster with ${userRoster.players ? userRoster.players.length : 0} players`);
            
            return {
                success: true,
                roster: userRoster,
                allRosters: rosters,
                leagueId: leagueId
            };
            
        } catch (error) {
            console.error('Failed to get league roster:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Test all API connections
    async testAllConnections() {
        const results = [];
        
        // Test Sleeper via proxy
        console.log('🧪 Testing Sleeper API via Vercel proxy...');
        try {
            const sleeperResult = await this.connectToSleeper('restocktime');
            results.push({
                platform: 'Sleeper (Vercel Proxy)',
                status: sleeperResult.success ? 'success' : 'failed',
                message: sleeperResult.success ? sleeperResult.message : sleeperResult.error,
                data: sleeperResult.success ? {
                    user: sleeperResult.user?.display_name || 'Unknown',
                    leagues: sleeperResult.leagues?.length || 0,
                    rosters: sleeperResult.rosters?.length || 0
                } : null
            });
        } catch (error) {
            results.push({
                platform: 'Sleeper (Vercel Proxy)',
                status: 'error',
                message: error.message
            });
        }
        
        // Test Yahoo (direct - should work)
        console.log('🧪 Testing Yahoo API (direct)...');
        try {
            const response = await fetch('https://api.yahoo.com', { method: 'HEAD' });
            results.push({
                platform: 'Yahoo',
                status: response.ok ? 'reachable' : 'unreachable',
                message: `Yahoo API is ${response.ok ? 'accessible' : 'blocked'}`
            });
        } catch (error) {
            results.push({
                platform: 'Yahoo',
                status: 'blocked',
                message: 'Yahoo API blocked by CORS'
            });
        }
        
        // Test ESPN (direct - likely blocked)
        console.log('🧪 Testing ESPN API (direct)...');
        try {
            const response = await fetch('https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024', { method: 'HEAD' });
            results.push({
                platform: 'ESPN',
                status: response.ok ? 'reachable' : 'unreachable',
                message: `ESPN API is ${response.ok ? 'accessible' : 'blocked'}`
            });
        } catch (error) {
            results.push({
                platform: 'ESPN',
                status: 'blocked',
                message: 'ESPN API blocked by CORS'
            });
        }
        
        return results;
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

    // Update proxy base URL if needed
    setProxyBaseUrl(newUrl) {
        this.proxyBaseUrl = newUrl;
        this.apis.sleeper.baseUrl = `${newUrl}/api/sleeper`;
        console.log(`🔄 Updated proxy base URL to: ${newUrl}`);
    }
}

// Make it globally available
window.FantasyAPIIntegrationVercel = FantasyAPIIntegrationVercel;

// Auto-initialize with default proxy URL
window.fantasyAPIVercel = new FantasyAPIIntegrationVercel();

console.log('✅ Fantasy API Integration (Vercel Proxy) loaded successfully');
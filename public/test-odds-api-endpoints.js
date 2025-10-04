/**
 * Test Script for The Odds API Endpoints
 * Tests different endpoints to see available data
 */

class OddsAPITester {
    constructor() {
        this.apiKey = '9de126998e0df996011a28e9527dd7b9';
        this.baseUrl = 'https://api.the-odds-api.com/v4';
        this.sport = 'americanfootball_nfl';
    }

    async testAllEndpoints() {
        console.log('🧪 Testing The Odds API Endpoints...\n');
        
        // Test 1: Sports list
        await this.testSportsList();
        
        // Test 2: Events/Games
        await this.testEvents();
        
        // Test 3: General odds
        await this.testOdds();
        
        // Test 4: Event-specific odds (player props)
        await this.testEventSpecificOdds();
        
        // Test 5: Historical data (if available)
        await this.testHistoricalData();
        
        console.log('✅ All endpoint tests completed!');
    }

    async testSportsList() {
        try {
            console.log('1️⃣ Testing Sports List Endpoint...');
            const url = `${this.baseUrl}/sports`;
            const params = new URLSearchParams({
                apiKey: this.apiKey
            });
            
            const response = await fetch(`${url}?${params.toString()}`);
            const data = await response.json();
            
            console.log(`📊 Sports List Response (${response.status}):`, data?.length, 'sports available');
            
            // Find NFL info
            const nflSport = data?.find(sport => sport.key === this.sport);
            if (nflSport) {
                console.log(`🏈 NFL Sport Info:`, nflSport);
            }
            
            console.log('---\n');
        } catch (error) {
            console.error('❌ Sports list test failed:', error.message);
        }
    }

    async testEvents() {
        try {
            console.log('2️⃣ Testing Events/Games Endpoint...');
            const url = `${this.baseUrl}/sports/${this.sport}/events`;
            const params = new URLSearchParams({
                apiKey: this.apiKey
            });
            
            const response = await fetch(`${url}?${params.toString()}`);
            const data = await response.json();
            
            console.log(`📅 Events Response (${response.status}):`, data?.length, 'events found');
            
            if (data && data.length > 0) {
                console.log('🔍 First Event Sample:', {
                    id: data[0].id,
                    home_team: data[0].home_team,
                    away_team: data[0].away_team,
                    commence_time: data[0].commence_time,
                    sport_title: data[0].sport_title
                });
                
                // Store first event ID for later tests
                this.firstEventId = data[0].id;
            }
            
            console.log('---\n');
        } catch (error) {
            console.error('❌ Events test failed:', error.message);
        }
    }

    async testOdds() {
        try {
            console.log('3️⃣ Testing General Odds Endpoint...');
            const url = `${this.baseUrl}/sports/${this.sport}/odds`;
            const params = new URLSearchParams({
                apiKey: this.apiKey,
                regions: 'us',
                markets: 'h2h,spreads,totals',
                oddsFormat: 'american'
            });
            
            const response = await fetch(`${url}?${params.toString()}`);
            const data = await response.json();
            
            console.log(`💰 Odds Response (${response.status}):`, data?.length, 'games with odds');
            
            if (data && data.length > 0) {
                const firstGame = data[0];
                console.log('🔍 First Game Odds Sample:', {
                    id: firstGame.id,
                    home_team: firstGame.home_team,
                    away_team: firstGame.away_team,
                    bookmakers_count: firstGame.bookmakers?.length,
                    markets_available: firstGame.bookmakers?.[0]?.markets?.map(m => m.key) || []
                });
            }
            
            console.log('---\n');
        } catch (error) {
            console.error('❌ General odds test failed:', error.message);
        }
    }

    async testEventSpecificOdds() {
        try {
            console.log('4️⃣ Testing Event-Specific Odds (Player Props)...');
            
            if (!this.firstEventId) {
                console.log('⚠️ No event ID available, skipping event-specific test');
                return;
            }
            
            const url = `${this.baseUrl}/sports/${this.sport}/events/${this.firstEventId}/odds`;
            const params = new URLSearchParams({
                apiKey: this.apiKey,
                regions: 'us',
                markets: 'player_pass_tds,player_pass_yds,player_rush_yds,player_receptions,player_receiving_yds',
                oddsFormat: 'american'
            });
            
            console.log(`🎯 Testing player props for event: ${this.firstEventId}`);
            console.log(`📞 URL: ${url}?${params.toString()}`);
            
            const response = await fetch(`${url}?${params.toString()}`);
            const data = await response.json();
            
            console.log(`🏈 Player Props Response (${response.status}):`, typeof data === 'object' ? 'data received' : 'no data');
            
            if (response.status === 200 && data) {
                console.log('🔍 Event-Specific Data Structure:', {
                    id: data.id,
                    home_team: data.home_team,
                    away_team: data.away_team,
                    bookmakers_count: data.bookmakers?.length,
                    markets_available: data.bookmakers?.[0]?.markets?.map(m => m.key) || []
                });
                
                // Check for player props specifically
                if (data.bookmakers && data.bookmakers.length > 0) {
                    const playerPropsMarkets = data.bookmakers[0].markets?.filter(m => m.key.startsWith('player_'));
                    console.log(`🎯 Player Props Markets Found: ${playerPropsMarkets?.length || 0}`);
                    
                    if (playerPropsMarkets && playerPropsMarkets.length > 0) {
                        console.log('📊 Sample Player Prop:', {
                            market: playerPropsMarkets[0].key,
                            outcomes_count: playerPropsMarkets[0].outcomes?.length,
                            sample_outcome: playerPropsMarkets[0].outcomes?.[0]
                        });
                    }
                }
            } else {
                console.log(`❌ Player props request failed: ${response.status}`);
                const errorText = await response.text();
                console.log('❌ Error details:', errorText);
            }
            
            console.log('---\n');
        } catch (error) {
            console.error('❌ Event-specific odds test failed:', error.message);
        }
    }

    async testHistoricalData() {
        try {
            console.log('5️⃣ Testing Historical Data Endpoint...');
            const url = `${this.baseUrl}/historical/sports/${this.sport}/odds`;
            const params = new URLSearchParams({
                apiKey: this.apiKey,
                regions: 'us',
                markets: 'h2h',
                oddsFormat: 'american',
                date: '2024-01-01' // Test with a past date
            });
            
            const response = await fetch(`${url}?${params.toString()}`);
            
            console.log(`📈 Historical Data Response (${response.status}):`, response.status === 200 ? 'available' : 'not available');
            
            if (response.status !== 200) {
                const errorText = await response.text();
                console.log('ℹ️ Historical data info:', errorText);
            }
            
            console.log('---\n');
        } catch (error) {
            console.error('❌ Historical data test failed:', error.message);
        }
    }

    async testUsage() {
        try {
            console.log('6️⃣ Testing Usage Information...');
            const url = `${this.baseUrl}/sports/${this.sport}/odds`;
            const params = new URLSearchParams({
                apiKey: this.apiKey,
                regions: 'us',
                markets: 'h2h'
            });
            
            const response = await fetch(`${url}?${params.toString()}`);
            
            // Check response headers for usage info
            console.log('📊 API Usage Info:');
            console.log('- Requests Used:', response.headers.get('x-requests-used'));
            console.log('- Requests Remaining:', response.headers.get('x-requests-remaining'));
            console.log('- Rate Limit:', response.headers.get('x-ratelimit-requests-remaining'));
            
        } catch (error) {
            console.error('❌ Usage test failed:', error.message);
        }
    }
}

// Initialize and run tests
const tester = new OddsAPITester();

// Export for use in browser console or other scripts
window.oddsAPITester = tester;

console.log('🧪 Odds API Tester loaded. Run: await window.oddsAPITester.testAllEndpoints()');
// Test the corrected market names
const API_KEY = '9de126998e0df996011a28e9527dd7b9';
const BASE_URL = 'https://api.the-odds-api.com/v4';
const SPORT = 'americanfootball_nfl';

async function testCorrectedMarkets() {
    console.log('🧪 Testing corrected NFL player props markets...\n');
    
    // Get first event
    const eventsResponse = await fetch(`${BASE_URL}/sports/${SPORT}/events?apiKey=${API_KEY}`);
    const events = await eventsResponse.json();
    
    if (!events || events.length === 0) {
        console.log('❌ No events available');
        return;
    }
    
    const firstEvent = events[0];
    console.log(`🏈 Testing with: ${firstEvent.away_team} @ ${firstEvent.home_team}\n`);
    
    // Test the corrected receiving yards market name
    console.log('🎯 Testing corrected "player_reception_yds" market...');
    
    try {
        const response = await fetch(
            `${BASE_URL}/sports/${SPORT}/events/${firstEvent.id}/odds?` +
            `apiKey=${API_KEY}&regions=us&markets=player_reception_yds&oddsFormat=american`
        );
        
        const data = await response.json();
        
        console.log(`📊 Status: ${response.status}`);
        console.log(`📈 Usage - Requests Remaining: ${response.headers.get('x-requests-remaining')}`);
        
        if (response.ok && data.bookmakers) {
            const bookmaker = data.bookmakers.find(b => b.markets && b.markets.length > 0);
            if (bookmaker) {
                const market = bookmaker.markets.find(m => m.key === 'player_reception_yds');
                if (market && market.outcomes) {
                    console.log(`✅ player_reception_yds: ${market.outcomes.length} outcomes available`);
                    
                    // Show first few outcomes
                    const samples = market.outcomes.slice(0, 5);
                    samples.forEach(outcome => {
                        console.log(`   📍 ${outcome.description}: ${outcome.name} ${outcome.point} (${outcome.price})`);
                    });
                } else {
                    console.log(`⚠️ No reception yards market found`);
                }
            } else {
                console.log(`⚠️ No bookmakers with market data`);
            }
        } else {
            console.log(`❌ Error: ${response.status} - ${data.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
    }
    
    // Test the comprehensive market combination that we use in our service
    console.log(`\n🧪 Testing full comprehensive market combination...`);
    
    const comprehensiveMarkets = 'player_pass_tds,player_pass_yds,player_rush_yds,player_receptions,player_reception_yds,player_sacks,player_rush_tds';
    
    try {
        const response = await fetch(
            `${BASE_URL}/sports/${SPORT}/events/${firstEvent.id}/odds?` +
            `apiKey=${API_KEY}&regions=us&markets=${comprehensiveMarkets}&oddsFormat=american`
        );
        
        const data = await response.json();
        
        console.log(`📊 Comprehensive Status: ${response.status}`);
        console.log(`📈 Usage - Requests Remaining: ${response.headers.get('x-requests-remaining')}`);
        
        if (response.ok && data.bookmakers) {
            console.log(`✅ Success: ${data.bookmakers.length} bookmakers returned`);
            
            const dkBookmaker = data.bookmakers.find(b => b.key === 'draftkings');
            if (dkBookmaker) {
                console.log(`🎯 DraftKings markets available:`);
                dkBookmaker.markets.forEach(market => {
                    console.log(`   - ${market.key}: ${market.outcomes?.length || 0} outcomes`);
                });
            }
        } else {
            console.log(`❌ Comprehensive test failed: ${response.status} - ${data.message || 'Unknown error'}`);
            if (data.message) {
                console.log(`🔍 Error details: ${data.message}`);
            }
        }
    } catch (error) {
        console.log(`❌ Comprehensive test network error: ${error.message}`);
    }
}

testCorrectedMarkets().catch(console.error);
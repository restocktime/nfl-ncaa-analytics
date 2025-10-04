// Detailed player props testing
const API_KEY = '9de126998e0df996011a28e9527dd7b9';
const BASE_URL = 'https://api.the-odds-api.com/v4';
const SPORT = 'americanfootball_nfl';

async function testPlayerPropsDetails() {
    console.log('🔍 Getting detailed player props structure...\n');
    
    // First get an event
    const eventsResponse = await fetch(`${BASE_URL}/sports/${SPORT}/events?apiKey=${API_KEY}`);
    const events = await eventsResponse.json();
    
    if (!events || events.length === 0) {
        console.log('❌ No events available');
        return;
    }
    
    const firstEvent = events[0];
    console.log(`🏈 Testing with: ${firstEvent.away_team} @ ${firstEvent.home_team}`);
    console.log(`📅 Game time: ${firstEvent.commence_time}\n`);
    
    // Test individual player props markets
    const markets = [
        'player_pass_tds',
        'player_pass_yds', 
        'player_rush_yds',
        'player_receptions',
        'player_receiving_yds', // This one failed in the previous test
        'player_tackles',
        'player_sacks'
    ];
    
    for (const market of markets) {
        console.log(`\n🎯 Testing market: ${market}`);
        
        try {
            const response = await fetch(
                `${BASE_URL}/sports/${SPORT}/events/${firstEvent.id}/odds?` +
                `apiKey=${API_KEY}&regions=us&markets=${market}&oddsFormat=american`
            );
            
            const data = await response.json();
            
            console.log(`📊 Status: ${response.status}`);
            
            if (response.ok && data.bookmakers) {
                const bookmaker = data.bookmakers.find(b => b.markets && b.markets.length > 0);
                if (bookmaker) {
                    const marketData = bookmaker.markets.find(m => m.key === market);
                    if (marketData && marketData.outcomes) {
                        console.log(`✅ ${market}: ${marketData.outcomes.length} outcomes available`);
                        
                        // Show sample outcomes
                        const samples = marketData.outcomes.slice(0, 3);
                        samples.forEach(outcome => {
                            console.log(`   📍 ${outcome.name}: ${outcome.description || 'N/A'} | Point: ${outcome.point || 'N/A'} | Price: ${outcome.price}`);
                        });
                    } else {
                        console.log(`⚠️ ${market}: No outcomes found in market data`);
                    }
                } else {
                    console.log(`⚠️ ${market}: No bookmakers with market data`);
                }
            } else {
                console.log(`❌ ${market}: Error - ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.log(`❌ ${market}: Network error - ${error.message}`);
        }
    }
    
    // Test a working combination
    console.log(`\n🧪 Testing working combination: player_pass_tds + player_pass_yds`);
    try {
        const response = await fetch(
            `${BASE_URL}/sports/${SPORT}/events/${firstEvent.id}/odds?` +
            `apiKey=${API_KEY}&regions=us&markets=player_pass_tds,player_pass_yds&oddsFormat=american`
        );
        
        const data = await response.json();
        console.log(`📊 Combination Status: ${response.status}`);
        
        if (response.ok && data.bookmakers) {
            console.log(`✅ Success: ${data.bookmakers.length} bookmakers returned`);
            
            const dkBookmaker = data.bookmakers.find(b => b.key === 'draftkings');
            if (dkBookmaker) {
                console.log(`🎯 DraftKings markets: ${dkBookmaker.markets.map(m => m.key).join(', ')}`);
                
                // Get detailed structure of one market
                const passTdsMarket = dkBookmaker.markets.find(m => m.key === 'player_pass_tds');
                if (passTdsMarket) {
                    console.log(`\n📊 Detailed player_pass_tds structure:`);
                    console.log(JSON.stringify(passTdsMarket, null, 2));
                }
            }
        } else {
            console.log(`❌ Combination failed: ${data.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.log(`❌ Combination test failed: ${error.message}`);
    }
}

testPlayerPropsDetails().catch(console.error);
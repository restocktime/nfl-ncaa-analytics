// Direct API endpoint testing using Node.js with built-in fetch

const API_KEY = '9de126998e0df996011a28e9527dd7b9';
const BASE_URL = 'https://api.the-odds-api.com/v4';
const SPORT = 'americanfootball_nfl';

async function testEndpoint(name, url, params = {}) {
    console.log(`\n🧪 Testing ${name}:`);
    console.log(`📞 URL: ${url}`);
    
    try {
        const urlWithParams = new URL(url);
        Object.entries(params).forEach(([key, value]) => {
            urlWithParams.searchParams.append(key, value);
        });
        
        console.log(`🌐 Full URL: ${urlWithParams.toString()}`);
        
        const response = await fetch(urlWithParams.toString());
        const data = await response.json();
        
        console.log(`📊 Response Status: ${response.status}`);
        console.log(`📈 Usage - Requests Used: ${response.headers.get('x-requests-used')}`);
        console.log(`📉 Usage - Requests Remaining: ${response.headers.get('x-requests-remaining')}`);
        
        if (response.ok) {
            if (Array.isArray(data)) {
                console.log(`✅ Success: ${data.length} items returned`);
                if (data.length > 0) {
                    console.log(`🔍 First item sample:`, JSON.stringify(data[0], null, 2).substring(0, 500) + '...');
                }
            } else if (typeof data === 'object') {
                console.log(`✅ Success: Object returned`);
                console.log(`🔍 Object keys:`, Object.keys(data));
                console.log(`🔍 Sample data:`, JSON.stringify(data, null, 2).substring(0, 500) + '...');
            } else {
                console.log(`✅ Success: ${typeof data} returned`);
                console.log(`🔍 Data:`, data);
            }
            return data;
        } else {
            console.log(`❌ Error: ${response.status} ${response.statusText}`);
            console.log(`❌ Error data:`, data);
            return null;
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
        return null;
    }
}

async function runAllTests() {
    console.log('🚀 Starting comprehensive API endpoint tests...\n');
    
    // Test 1: Sports list
    await testEndpoint('Sports List', `${BASE_URL}/sports`, {
        apiKey: API_KEY
    });
    
    // Test 2: Events
    const eventsData = await testEndpoint('NFL Events', `${BASE_URL}/sports/${SPORT}/events`, {
        apiKey: API_KEY
    });
    
    // Test 3: General odds
    await testEndpoint('NFL Odds (H2H)', `${BASE_URL}/sports/${SPORT}/odds`, {
        apiKey: API_KEY,
        regions: 'us',
        markets: 'h2h',
        oddsFormat: 'american'
    });
    
    // Test 4: General odds with more markets
    await testEndpoint('NFL Odds (Multiple Markets)', `${BASE_URL}/sports/${SPORT}/odds`, {
        apiKey: API_KEY,
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american'
    });
    
    // Test 5: Event-specific odds (if we have an event)
    if (eventsData && eventsData.length > 0) {
        const firstEventId = eventsData[0].id;
        
        await testEndpoint('Event-Specific H2H Odds', `${BASE_URL}/sports/${SPORT}/events/${firstEventId}/odds`, {
            apiKey: API_KEY,
            regions: 'us',
            markets: 'h2h',
            oddsFormat: 'american'
        });
        
        await testEndpoint('Event-Specific Player Props', `${BASE_URL}/sports/${SPORT}/events/${firstEventId}/odds`, {
            apiKey: API_KEY,
            regions: 'us',
            markets: 'player_pass_tds,player_pass_yds',
            oddsFormat: 'american'
        });
        
        await testEndpoint('Event-Specific All Player Props', `${BASE_URL}/sports/${SPORT}/events/${firstEventId}/odds`, {
            apiKey: API_KEY,
            regions: 'us',
            markets: 'player_pass_tds,player_pass_yds,player_rush_yds,player_receptions,player_receiving_yds,player_tackles,player_sacks',
            oddsFormat: 'american'
        });
    }
    
    // Test 6: Historical data
    await testEndpoint('Historical Data', `${BASE_URL}/historical/sports/${SPORT}/odds`, {
        apiKey: API_KEY,
        regions: 'us',
        markets: 'h2h',
        date: '2024-10-01'
    });
    
    console.log('\n✅ All tests completed!');
}

// Run if called directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { testEndpoint, runAllTests };
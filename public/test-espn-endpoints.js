// Test ESPN endpoints for NFL data
const { URL } = require('url');

async function testESPNEndpoint(name, baseUrl, additionalPaths = []) {
    console.log(`\n🧪 Testing ESPN ${name}:`);
    console.log(`📞 Base URL: ${baseUrl}`);
    
    // Test base URL
    try {
        console.log(`🌐 Fetching: ${baseUrl}`);
        
        const response = await fetch(baseUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache'
            }
        });
        
        console.log(`📊 Response Status: ${response.status}`);
        console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
        console.log(`📏 Content-Length: ${response.headers.get('content-length') || 'unknown'}`);
        
        if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            
            if (contentType.includes('application/json')) {
                // JSON response
                const data = await response.json();
                console.log(`✅ JSON Success: ${typeof data} received`);
                if (Array.isArray(data)) {
                    console.log(`📊 Array length: ${data.length}`);
                } else if (typeof data === 'object') {
                    console.log(`🔍 Object keys: ${Object.keys(data).slice(0, 10).join(', ')}`);
                }
                return data;
            } else if (contentType.includes('text/html')) {
                // HTML response - check for data patterns
                const html = await response.text();
                console.log(`✅ HTML Success: ${html.length} characters received`);
                
                // Look for common patterns
                const patterns = {
                    'JSON data': /window\.__espnfitt__\s*=\s*({.*?});/s,
                    'Player data': /<script[^>]*>.*?(?:players?|roster).*?<\/script>/is,
                    'Injury data': /<script[^>]*>.*?(?:injury|injured).*?<\/script>/is,
                    'Odds data': /<script[^>]*>.*?(?:odds?|betting).*?<\/script>/is,
                    'API endpoints': /\/api\/[^"'\s]+/g
                };
                
                console.log(`🔍 Content analysis:`);
                Object.entries(patterns).forEach(([name, pattern]) => {
                    const matches = html.match(pattern);
                    if (matches) {
                        if (name === 'API endpoints') {
                            const endpoints = [...new Set(matches)].slice(0, 5);
                            console.log(`   - ${name}: ${endpoints.join(', ')}`);
                        } else {
                            console.log(`   - ${name}: Found`);
                        }
                    } else {
                        console.log(`   - ${name}: Not found`);
                    }
                });
                
                return html;
            } else {
                const text = await response.text();
                console.log(`✅ Text Success: ${text.length} characters received`);
                console.log(`🔍 Content preview: ${text.substring(0, 200)}...`);
                return text;
            }
        } else {
            console.log(`❌ Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.log(`❌ Error content: ${errorText.substring(0, 200)}...`);
            return null;
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
        return null;
    }
}

async function testAPIEndpoints() {
    console.log('🧪 Testing potential ESPN API endpoints...\n');
    
    // Common ESPN API patterns
    const apiEndpoints = [
        'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
        'https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes',
        'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/teams',
        'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/news',
        'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
        'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news'
    ];
    
    for (const endpoint of apiEndpoints) {
        console.log(`\n🎯 Testing API: ${endpoint}`);
        
        try {
            const response = await fetch(endpoint);
            console.log(`📊 Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Success: ${typeof data} received`);
                
                if (data.teams) {
                    console.log(`📊 Teams: ${data.teams.length} teams found`);
                } else if (data.athletes) {
                    console.log(`👤 Athletes: ${data.athletes.length} athletes found`);
                } else if (data.events) {
                    console.log(`🏈 Events: ${data.events.length} events found`);
                } else if (data.articles) {
                    console.log(`📰 Articles: ${data.articles.length} articles found`);
                } else if (Array.isArray(data)) {
                    console.log(`📊 Array: ${data.length} items`);
                } else if (typeof data === 'object') {
                    console.log(`🔍 Object keys: ${Object.keys(data).slice(0, 5).join(', ')}`);
                }
            } else {
                console.log(`❌ Failed: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

async function runESPNTests() {
    console.log('🚀 Starting ESPN endpoint tests...\n');
    
    // Test main ESPN NFL pages
    await testESPNEndpoint('NFL Odds', 'https://www.espn.com/nfl/odds');
    await testESPNEndpoint('NFL Injuries', 'https://www.espn.com/nfl/injuries');
    await testESPNEndpoint('NFL Stats', 'https://www.espn.com/nfl/stats');
    
    // Test potential API endpoints
    await testAPIEndpoints();
    
    console.log('\n✅ All ESPN tests completed!');
}

runESPNTests().catch(console.error);
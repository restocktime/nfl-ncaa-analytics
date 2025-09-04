// Simple test of API client normalization
const fetch = require('node-fetch');

class TestAPIClient {
    normalizeResponse(rawData) {
        // If it's already in the expected format with .games, return as-is
        if (rawData.games) {
            return rawData;
        }
        
        // If it's in {success, data, count} format, convert to legacy format
        if (rawData.success !== undefined && rawData.data) {
            return {
                success: rawData.success,
                games: rawData.data,
                totalGames: rawData.count || rawData.data.length,
                lastUpdate: rawData.timestamp || rawData.lastUpdated,
                source: rawData.source || 'API'
            };
        }
        
        // If it's direct array, wrap it
        if (Array.isArray(rawData)) {
            return {
                success: true,
                games: rawData,
                totalGames: rawData.length,
                lastUpdate: new Date().toISOString(),
                source: 'API'
            };
        }
        
        // Return as-is for other formats
        return rawData;
    }
}

async function testNormalization() {
    console.log('🧪 Testing API response normalization...');
    
    const client = new TestAPIClient();
    
    try {
        // Test with server response format
        const response = await fetch('http://localhost:3000/api/games?sport=nfl');
        const rawData = await response.json();
        
        console.log('\n📡 Raw server response format:');
        console.log(`- success: ${rawData.success}`);
        console.log(`- data: ${rawData.data ? 'Array with ' + rawData.data.length + ' items' : 'Not found'}`);
        console.log(`- count: ${rawData.count}`);
        console.log(`- games: ${rawData.games ? 'Found' : 'Not found'}`);
        
        const normalized = client.normalizeResponse(rawData);
        
        console.log('\n✨ Normalized response format:');
        console.log(`- success: ${normalized.success}`);
        console.log(`- games: ${normalized.games ? 'Array with ' + normalized.games.length + ' items' : 'Not found'}`);
        console.log(`- totalGames: ${normalized.totalGames}`);
        console.log(`- source: ${normalized.source}`);
        
        if (normalized.games && normalized.games.length > 0) {
            console.log('\n🎮 Sample game:');
            console.log(`- ${normalized.games[0].name}`);
            console.log(`- Status: ${normalized.games[0].status}`);
            console.log(`- Teams: ${normalized.games[0].awayTeam.name} @ ${normalized.games[0].homeTeam.name}`);
        }
        
        console.log('\n✅ Normalization test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testNormalization();
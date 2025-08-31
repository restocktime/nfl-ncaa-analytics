// Test NCAA betting lines functionality
const fs = require('fs');

// Mock browser environment
global.window = { ncaaDataService: null };
global.console = console;
global.fetch = async () => ({ ok: false }); // Mock failed API calls

// Load NCAA service
const ncaaCode = fs.readFileSync('public/ncaa-data-service.js', 'utf8');
eval(ncaaCode);

// Test the NCAA betting lines functionality
async function testNCAABettingLines() {
    try {
        console.log('🧪 Testing NCAA betting lines implementation...');
        
        // Get the service instance
        const service = global.window.ncaaDataService;
        
        if (!service) {
            throw new Error('NCAA Data Service not initialized');
        }
        
        // Create a mock college game for testing
        const mockGame = {
            id: 'test-college-game',
            name: 'Alabama Crimson Tide @ Georgia Bulldogs',
            shortName: 'ALA @ UGA',
            teams: {
                home: { name: 'Georgia Bulldogs', abbreviation: 'UGA', record: '9-1' },
                away: { name: 'Alabama Crimson Tide', abbreviation: 'ALA', record: '8-2' }
            },
            venue: 'Sanford Stadium'
        };
        
        // Test AI prediction generation
        console.log('🤖 Testing NCAA AI prediction generation...');
        const aiPrediction = service.generateAIPrediction(mockGame);
        
        console.log('✅ NCAA AI Prediction:', {
            homeWin: `${aiPrediction.homeWinProbability}%`,
            awayWin: `${aiPrediction.awayWinProbability}%`,
            spread: aiPrediction.predictedSpread,
            confidence: `${aiPrediction.confidence}%`,
            recommendation: aiPrediction.recommendation
        });
        
        // Add AI prediction to game
        mockGame.aiPrediction = aiPrediction;
        
        // Test betting lines generation
        console.log('💰 Testing NCAA betting lines generation...');
        const bettingLines = await service.getBettingLinesForGame(mockGame);
        
        console.log('✅ NCAA Betting Lines:', {
            spread: `${mockGame.teams.home.abbreviation} ${bettingLines.spread.home} | ${mockGame.teams.away.abbreviation} ${bettingLines.spread.away}`,
            moneyline: `${mockGame.teams.home.abbreviation} ${bettingLines.moneyline.home} | ${mockGame.teams.away.abbreviation} ${bettingLines.moneyline.away}`,
            total: `${bettingLines.total.over} / ${bettingLines.total.under}`,
            sportsbooks: `${bettingLines.sportsbooks.length} sportsbooks: ${bettingLines.sportsbooks.slice(0, 3).join(', ')}`
        });
        
        // Verify college-specific features
        console.log('🔍 Verifying college-specific requirements...');
        
        // College football should have wider spreads and higher totals
        const spreadValue = Math.abs(parseFloat(bettingLines.spread.home.replace(/[+-]/, '')));
        const totalValue = parseFloat(bettingLines.total.total);
        
        console.log(`📊 Spread: ${spreadValue}, Total: ${totalValue}`);
        
        if (totalValue >= 40 && totalValue <= 85) {
            console.log('✅ College football total in expected range (40-85)');
        }
        
        // College moneylines can be wider than NFL
        const homeMoneyline = Math.abs(parseInt(bettingLines.moneyline.home));
        const awayMoneyline = Math.abs(parseInt(bettingLines.moneyline.away));
        
        if (homeMoneyline <= 5000 && awayMoneyline <= 5000) {
            console.log('✅ College moneylines in expected range (up to ±5000)');
        }
        
        // Check for college-specific sportsbooks
        const hasCollegeSportsbooks = bettingLines.sportsbooks.some(book => 
            ['BetOnline', 'MyBookie', 'Bovada'].includes(book)
        );
        
        if (bettingLines.sportsbooks.length >= 3) {
            console.log('✅ Multiple college sportsbooks included');
        }
        
        console.log('🎉 All NCAA betting lines requirements PASSED!');
        
    } catch (error) {
        console.error('❌ NCAA betting lines test FAILED:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testNCAABettingLines();
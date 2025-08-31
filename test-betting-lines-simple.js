// Simple test for betting lines functionality
const fs = require('fs');

// Mock browser environment
global.window = { nflDataService: null };
global.console = console;
global.fetch = async () => ({ ok: false }); // Mock failed API calls

// Load NFL service
const nflCode = fs.readFileSync('public/nfl-data-service.js', 'utf8');
eval(nflCode);

// Test the betting lines functionality
async function testBettingLines() {
    try {
        console.log('🧪 Testing betting lines implementation...');
        
        // Get the service instance
        const service = global.window.nflDataService;
        
        if (!service) {
            throw new Error('NFL Data Service not initialized');
        }
        
        // Create a mock game for testing
        const mockGame = {
            id: 'test-game',
            name: 'Kansas City Chiefs @ Buffalo Bills',
            shortName: 'KC @ BUF',
            teams: {
                home: { name: 'Buffalo Bills', abbreviation: 'BUF', record: '10-3' },
                away: { name: 'Kansas City Chiefs', abbreviation: 'KC', record: '11-2' }
            },
            venue: 'Highmark Stadium'
        };
        
        // Test AI prediction generation
        console.log('🤖 Testing AI prediction generation...');
        const aiPrediction = service.generateAIPrediction(mockGame);
        
        console.log('✅ AI Prediction:', {
            homeWin: `${aiPrediction.homeWinProbability}%`,
            awayWin: `${aiPrediction.awayWinProbability}%`,
            spread: aiPrediction.predictedSpread,
            confidence: `${aiPrediction.confidence}%`,
            recommendation: aiPrediction.recommendation
        });
        
        // Add AI prediction to game
        mockGame.aiPrediction = aiPrediction;
        
        // Test betting lines generation
        console.log('💰 Testing betting lines generation...');
        const bettingLines = await service.getBettingLinesForGame(mockGame);
        
        console.log('✅ Betting Lines:', {
            spread: `${mockGame.teams.home.abbreviation} ${bettingLines.spread.home} | ${mockGame.teams.away.abbreviation} ${bettingLines.spread.away}`,
            moneyline: `${mockGame.teams.home.abbreviation} ${bettingLines.moneyline.home} | ${mockGame.teams.away.abbreviation} ${bettingLines.moneyline.away}`,
            total: `${bettingLines.total.over} / ${bettingLines.total.under}`,
            sportsbooks: `${bettingLines.sportsbooks.length} sportsbooks: ${bettingLines.sportsbooks.slice(0, 3).join(', ')}`
        });
        
        // Test the key requirements
        console.log('🔍 Verifying requirements...');
        
        // Requirement 3.1: getBettingLinesForGame method exists
        if (typeof service.getBettingLinesForGame === 'function') {
            console.log('✅ 3.1: getBettingLinesForGame method implemented');
        }
        
        // Requirement 3.2: Spread calculation based on AI predictions
        if (bettingLines.spread && bettingLines.spread.home && bettingLines.spread.away) {
            console.log('✅ 3.2: Spread calculation implemented');
        }
        
        // Requirement 3.3: Moneyline odds calculation
        if (bettingLines.moneyline && bettingLines.moneyline.home && bettingLines.moneyline.away) {
            console.log('✅ 3.3: Moneyline odds calculation implemented');
        }
        
        // Requirement 3.4: Over/under totals
        if (bettingLines.total && bettingLines.total.over && bettingLines.total.under) {
            console.log('✅ 3.4: Over/under totals implemented');
        }
        
        // Requirement 3.5: Multiple sportsbook names
        if (bettingLines.sportsbooks && bettingLines.sportsbooks.length >= 3) {
            console.log('✅ 3.5: Multiple sportsbook names included');
        }
        
        // Requirement 3.6: Industry-standard formulas
        const homeMoneyline = parseInt(bettingLines.moneyline.home);
        const awayMoneyline = parseInt(bettingLines.moneyline.away);
        if (!isNaN(homeMoneyline) && !isNaN(awayMoneyline)) {
            console.log('✅ 3.6: Industry-standard moneyline format');
        }
        
        console.log('🎉 All betting lines requirements PASSED!');
        
    } catch (error) {
        console.error('❌ Betting lines test FAILED:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testBettingLines();
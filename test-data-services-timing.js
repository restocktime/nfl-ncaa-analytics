/**
 * Test the actual data services with timing logic
 */

const fs = require('fs');
const path = require('path');

// Read the actual service files
const nflServiceCode = fs.readFileSync(path.join(__dirname, 'public/nfl-data-service.js'), 'utf8');
const ncaaServiceCode = fs.readFileSync(path.join(__dirname, 'public/ncaa-data-service.js'), 'utf8');

// Mock browser environment
global.window = {
    errorHandler: {
        safeApiCall: async (primaryFn, fallbackFn, options) => {
            try {
                return await primaryFn();
            } catch (error) {
                console.log('Primary function failed, using fallback');
                return await fallbackFn();
            }
        },
        logError: (message, error, type, context) => {
            console.log(`[${type}] ${message}:`, error?.message || error);
        }
    },
    dataValidator: {
        validateGame: (game) => ({ isValid: true }),
        getDefaultGame: () => ({
            id: 'default',
            name: 'Default Game',
            teams: { 
                home: { name: 'Home', abbreviation: 'HOME', score: 0, record: '0-0' }, 
                away: { name: 'Away', abbreviation: 'AWAY', score: 0, record: '0-0' } 
            },
            status: { type: 'STATUS_SCHEDULED', displayClock: '', period: 0, completed: false },
            venue: 'Stadium',
            isLive: false,
            date: new Date(),
            week: 1,
            season: 2025
        })
    },
    cacheManager: new Map()
};

global.console = console;
global.fetch = async () => {
    throw new Error('No network in test environment');
};

// Execute the service code to define the classes
eval(nflServiceCode);
eval(ncaaServiceCode);

async function testServices() {
    console.log('🧪 Testing Actual Data Services with Timing Logic\n');
    
    try {
        // Initialize services
        const nflService = new NFLDataService();
        const ncaaService = new NCAADataService();
        
        console.log('✅ Services initialized successfully\n');
        
        // Test NFL off-season message
        console.log('🏈 Testing NFL Off-Season Message:');
        const nflOffSeason = nflService.generateOffseasonMessage();
        console.log(`Name: ${nflOffSeason[0].name}`);
        console.log(`Status: ${nflOffSeason[0].status.displayClock}`);
        console.log(`Phase: ${nflOffSeason[0].offSeasonInfo?.phase}`);
        console.log(`Days until season: ${nflOffSeason[0].offSeasonInfo?.daysUntilSeason}`);
        console.log(`Current events: ${nflOffSeason[0].offSeasonInfo?.currentEvents?.join(', ')}\n`);
        
        // Test NCAA off-season message
        console.log('🏈 Testing NCAA Off-Season Message:');
        const ncaaOffSeason = ncaaService.generateOffseasonMessage();
        console.log(`Name: ${ncaaOffSeason[0].name}`);
        console.log(`Status: ${ncaaOffSeason[0].status.displayClock}`);
        console.log(`Phase: ${ncaaOffSeason[0].offSeasonInfo?.phase}`);
        console.log(`Days until season: ${ncaaOffSeason[0].offSeasonInfo?.daysUntilSeason}`);
        console.log(`Current events: ${ncaaOffSeason[0].offSeasonInfo?.currentEvents?.join(', ')}\n`);
        
        // Test NFL current season detection
        console.log('📅 Testing NFL Season Detection:');
        const nflSeason = nflService.getCurrentNFLSeason();
        console.log(`Year: ${nflSeason.year}`);
        console.log(`Season Type: ${nflSeason.seasonType}`);
        console.log(`Week: ${nflSeason.week}\n`);
        
        // Test NCAA current season detection
        console.log('📅 Testing NCAA Season Detection:');
        const ncaaSeason = ncaaService.getCurrentCollegeFootballSeason();
        console.log(`Year: ${ncaaSeason.year}`);
        console.log(`Season Type: ${ncaaSeason.seasonType}`);
        console.log(`Week: ${ncaaSeason.week}\n`);
        
        // Test timing methods
        console.log('⏰ Testing Timing Methods:');
        
        // Test NFL timing
        const testTime = new Date();
        testTime.setHours(testTime.getHours() - 1.5); // 1.5 hours ago
        
        console.log('NFL Live Game Clock (1.5h ago):', nflService.generateLiveGameClock(1.5));
        console.log('NFL Current Quarter (1.5h ago):', nflService.calculateCurrentQuarter(1.5));
        
        console.log('NCAA Live Game Clock (1.5h ago):', ncaaService.generateLiveGameClock(1.5));
        console.log('NCAA Current Quarter (1.5h ago):', ncaaService.calculateCurrentQuarter(1.5));
        
        // Test score generation
        const mockTeams = {
            home: { name: 'Home Team', abbreviation: 'HOME' },
            away: { name: 'Away Team', abbreviation: 'AWAY' }
        };
        
        const nflLiveScores = nflService.generateLiveScores(mockTeams, 1.5);
        const nflFinalScores = nflService.generateFinalScores(mockTeams);
        
        console.log(`NFL Live Scores (1.5h): ${nflLiveScores.away} - ${nflLiveScores.home}`);
        console.log(`NFL Final Scores: ${nflFinalScores.away} - ${nflFinalScores.home}`);
        
        const ncaaLiveScores = ncaaService.generateLiveScores(mockTeams, 1.5);
        const ncaaFinalScores = ncaaService.generateFinalScores(mockTeams);
        
        console.log(`NCAA Live Scores (1.5h): ${ncaaLiveScores.away} - ${ncaaLiveScores.home}`);
        console.log(`NCAA Final Scores: ${ncaaFinalScores.away} - ${ncaaFinalScores.home}\n`);
        
        // Test actual game fetching (will use fallback)
        console.log('🎮 Testing Game Fetching (Fallback Mode):');
        
        try {
            const nflGames = await nflService.getTodaysGames();
            console.log(`NFL Games loaded: ${nflGames.length}`);
            if (nflGames.length > 0) {
                const firstGame = nflGames[0];
                console.log(`First NFL Game: ${firstGame.name}`);
                console.log(`Status: ${firstGame.status.type} - ${firstGame.status.displayClock}`);
                console.log(`Is Live: ${firstGame.isLive}`);
            }
        } catch (error) {
            console.log('NFL Games error:', error.message);
        }
        
        try {
            const ncaaGames = await ncaaService.getTodaysGames();
            console.log(`NCAA Games loaded: ${ncaaGames.length}`);
            if (ncaaGames.length > 0) {
                const firstGame = ncaaGames[0];
                console.log(`First NCAA Game: ${firstGame.name}`);
                console.log(`Status: ${firstGame.status.type} - ${firstGame.status.displayClock}`);
                console.log(`Is Live: ${firstGame.isLive}`);
            }
        } catch (error) {
            console.log('NCAA Games error:', error.message);
        }
        
        console.log('\n✅ All data service tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error(error.stack);
    }
}

// Run the tests
testServices();
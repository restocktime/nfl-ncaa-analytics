// Test NFL Data Service during season
console.log('🧪 Testing NFL Data Service During Season');

// Mock browser environment
global.window = { nflDataService: null };
global.Map = Map;
global.fetch = async () => { throw new Error('No network in test'); };

// Load the test service from previous file
const fs = require('fs');
const testServiceCode = fs.readFileSync('test-nfl-core.js', 'utf8');

// Extract just the class definition
const classMatch = testServiceCode.match(/class TestNFLDataService \{[\s\S]*?\n\}/);
if (!classMatch) {
    throw new Error('Could not extract TestNFLDataService class');
}

eval(classMatch[0]);

// Test during NFL season
async function testDuringNFLSeason() {
    console.log('\n📊 Testing NFL Data Service During Season\n');
    
    const service = new TestNFLDataService();
    
    // Simulate different dates during NFL season
    const testDates = [
        { date: new Date(2024, 8, 8), desc: 'Sunday Week 1 (September 8, 2024)' },      // Sunday
        { date: new Date(2024, 8, 12), desc: 'Thursday Week 2 (September 12, 2024)' },  // Thursday
        { date: new Date(2024, 8, 16), desc: 'Monday Week 2 (September 16, 2024)' },    // Monday
        { date: new Date(2024, 10, 17), desc: 'Sunday Week 11 (November 17, 2024)' },   // Sunday
        { date: new Date(2024, 11, 21), desc: 'Saturday Week 16 (December 21, 2024)' }, // Saturday
    ];
    
    for (const testCase of testDates) {
        console.log(`\n🧪 Testing: ${testCase.desc}`);
        console.log(`Day of week: ${testCase.date.toLocaleDateString('en-US', { weekday: 'long' })}`);
        
        // Get season info for this date
        const originalGetCurrentNFLSeason = service.getCurrentNFLSeason;
        service.getCurrentNFLSeason = function() {
            const year = testCase.date.getFullYear();
            const month = testCase.date.getMonth() + 1;
            
            if (month >= 9) {
                return {
                    year: year,
                    seasonType: 'regular',
                    week: Math.floor((testCase.date - new Date(year, 8, 5)) / (7 * 24 * 60 * 60 * 1000)) + 1
                };
            }
            return { year: year, seasonType: 'regular', week: 1 };
        };
        
        const season = service.getCurrentNFLSeason();
        console.log(`Season: ${season.year} ${season.seasonType}, Week ${season.week}`);
        
        // Test different times of day
        const testTimes = [
            { hour: 10, desc: 'Morning (10 AM)' },
            { hour: 14, desc: 'Afternoon (2 PM)' },
            { hour: 18, desc: 'Evening (6 PM)' },
            { hour: 21, desc: 'Night (9 PM)' }
        ];
        
        for (const timeTest of testTimes) {
            const testDateTime = new Date(testCase.date);
            testDateTime.setHours(timeTest.hour, 0, 0, 0);
            
            const games = service.generateIntelligentFallbackGames(testDateTime, season);
            
            console.log(`  ${timeTest.desc}: ${games.length} games`);
            games.forEach(game => {
                console.log(`    • ${game.shortName} - ${game.status.displayClock} at ${game.venue}`);
            });
        }
        
        // Restore original method
        service.getCurrentNFLSeason = originalGetCurrentNFLSeason;
    }
    
    console.log('\n✅ Season testing completed successfully!');
}

testDuringNFLSeason().catch(console.error);
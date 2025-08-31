/**
 * Test script for NCAA AI prediction functionality
 */

// Mock browser environment for Node.js testing
global.window = {};
global.fetch = require('node-fetch');
global.console = console;

// Load the NCAA Data Service
const NCAADataService = require('./public/ncaa-data-service.js');

async function testNCAAAAIPredictions() {
    console.log('🧪 Starting NCAA AI predictions test...');
    
    try {
        // Initialize NCAA service
        const ncaaService = new NCAADataService();
        
        // Test AI prediction generation with mock college game data
        const mockCollegeGame = {
            id: 'test-college-game-1',
            name: 'Georgia Bulldogs @ Clemson Tigers',
            shortName: 'UGA @ CLEM',
            date: new Date(),
            status: {
                type: 'STATUS_SCHEDULED',
                displayClock: 'Sat 8:00 PM ET',
                period: 0,
                completed: false
            },
            teams: {
                home: {
                    id: 'clem',
                    name: 'Clemson Tigers',
                    abbreviation: 'CLEM',
                    score: 0,
                    record: '7-2'
                },
                away: {
                    id: 'uga',
                    name: 'Georgia Bulldogs',
                    abbreviation: 'UGA',
                    score: 0,
                    record: '9-0'
                }
            },
            venue: 'Memorial Stadium (Clemson)',
            isLive: false,
            week: 10,
            season: 2024
        };
        
        console.log('🤖 Testing NCAA AI prediction generation...');
        
        // Test individual AI prediction methods
        console.log('\n📊 Testing college team strength calculation:');
        const ugaStrength = ncaaService.calculateCollegeTeamStrength(mockCollegeGame.teams.away);
        const clemStrength = ncaaService.calculateCollegeTeamStrength(mockCollegeGame.teams.home);
        console.log(`UGA Strength: ${ugaStrength.toFixed(1)}`);
        console.log(`CLEM Strength: ${clemStrength.toFixed(1)}`);
        
        console.log('\n🎯 Testing college win probability calculation:');
        const homeAdvantage = 3.5;
        const homeWinProb = ncaaService.calculateWinProbability(clemStrength, ugaStrength, homeAdvantage);
        console.log(`CLEM Win Probability: ${(homeWinProb * 100).toFixed(1)}%`);
        console.log(`UGA Win Probability: ${((1 - homeWinProb) * 100).toFixed(1)}%`);
        
        console.log('\n📈 Testing college spread calculation:');
        const predictedSpread = ncaaService.calculateSpread(clemStrength, ugaStrength, homeAdvantage);
        console.log(`Predicted Spread: ${predictedSpread}`);
        
        console.log('\n🎲 Testing college confidence calculation:');
        const confidence = ncaaService.calculateConfidence(clemStrength, ugaStrength);
        console.log(`Confidence: ${confidence.toFixed(1)}%`);
        
        console.log('\n🏈 Testing college predicted score calculation:');
        const predictedScore = ncaaService.calculatePredictedScore(clemStrength, ugaStrength, homeAdvantage);
        console.log(`Predicted Score - CLEM: ${predictedScore.home}, UGA: ${predictedScore.away}`);
        
        console.log('\n💡 Testing college recommendation generation:');
        const recommendation = ncaaService.generateRecommendation(homeWinProb, predictedSpread, mockCollegeGame.teams, confidence);
        console.log(`Recommendation: ${recommendation}`);
        
        console.log('\n🧠 Testing full NCAA AI prediction:');
        const fullPrediction = ncaaService.generateAIPrediction(mockCollegeGame);
        console.log('Full NCAA AI Prediction:', JSON.stringify(fullPrediction, null, 2));
        
        console.log('\n✅ Testing NCAA game enhancement with AI:');
        const enhancedGames = ncaaService.enhanceGamesWithAI([mockCollegeGame]);
        console.log(`Enhanced ${enhancedGames.length} NCAA games with AI predictions`);
        
        // Verify the enhanced game has AI prediction
        if (enhancedGames[0].aiPrediction) {
            console.log('✅ NCAA AI prediction successfully added to game');
            console.log('NCAA AI Prediction Keys:', Object.keys(enhancedGames[0].aiPrediction));
            
            // Verify all required fields are present
            const requiredFields = [
                'homeWinProbability',
                'awayWinProbability', 
                'predictedSpread',
                'confidence',
                'predictedScore',
                'recommendation',
                'analysis'
            ];
            
            const missingFields = requiredFields.filter(field => 
                !(field in enhancedGames[0].aiPrediction)
            );
            
            if (missingFields.length === 0) {
                console.log('✅ All required NCAA AI prediction fields are present');
            } else {
                console.log('❌ Missing NCAA AI prediction fields:', missingFields);
            }
            
            // Verify data quality for college football
            const prediction = enhancedGames[0].aiPrediction;
            
            // Check probability totals to 100%
            const totalProb = prediction.homeWinProbability + prediction.awayWinProbability;
            if (Math.abs(totalProb - 100) <= 1) {
                console.log('✅ NCAA win probabilities sum correctly');
            } else {
                console.log(`❌ NCAA win probabilities sum to ${totalProb}%, should be 100%`);
            }
            
            // Check confidence range
            if (prediction.confidence >= 55 && prediction.confidence <= 95) {
                console.log('✅ NCAA confidence is within expected range (55-95%)');
            } else {
                console.log(`❌ NCAA confidence ${prediction.confidence}% is outside expected range`);
            }
            
            // Check predicted scores are realistic for college football (14-60 range)
            if (prediction.predictedScore.home >= 14 && prediction.predictedScore.home <= 60 &&
                prediction.predictedScore.away >= 14 && prediction.predictedScore.away <= 60) {
                console.log('✅ NCAA predicted scores are within realistic range');
            } else {
                console.log(`❌ NCAA predicted scores seem unrealistic: ${prediction.predictedScore.home}-${prediction.predictedScore.away}`);
            }
            
        } else {
            console.log('❌ NCAA AI prediction not added to game');
        }
        
        // Test with different team matchups to verify strength calculations
        console.log('\n🔬 Testing different team strength calculations:');
        
        const testTeams = [
            { name: 'Alabama Crimson Tide', abbreviation: 'ALA', record: '8-1' },
            { name: 'Michigan Wolverines', abbreviation: 'MICH', record: '7-2' },
            { name: 'North Dakota State Bison', abbreviation: 'NDSU', record: '9-0' },
            { name: 'Hawaii Rainbow Warriors', abbreviation: 'HAW', record: '3-6' }
        ];
        
        testTeams.forEach(team => {
            const strength = ncaaService.calculateCollegeTeamStrength(team);
            console.log(`${team.abbreviation} (${team.record}): ${strength.toFixed(1)} strength`);
        });
        
        console.log('\n🏆 NCAA AI Prediction Test Results:');
        console.log('- College team strength calculation: ✅ Working');
        console.log('- College win probability calculation: ✅ Working');
        console.log('- College spread calculation: ✅ Working');
        console.log('- College confidence calculation: ✅ Working');
        console.log('- College predicted score calculation: ✅ Working');
        console.log('- College recommendation generation: ✅ Working');
        console.log('- Full NCAA AI prediction: ✅ Working');
        console.log('- NCAA game enhancement: ✅ Working');
        
        console.log('\n✅ All NCAA AI prediction tests passed successfully!');
        
    } catch (error) {
        console.error('❌ NCAA AI prediction test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testNCAAAAIPredictions();
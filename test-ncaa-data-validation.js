/**
 * NCAA Data Validation Test
 * Tests if NCAA data service is returning proper college football data
 */

// Mock browser environment for Node.js testing
if (typeof window === 'undefined') {
    global.window = {
        errorHandler: {
            safeApiCall: async (primaryFn, fallbackFn, options) => {
                try {
                    return await primaryFn();
                } catch (error) {
                    console.log('Primary failed, using fallback:', error.message);
                    return await fallbackFn();
                }
            },
            logError: (msg, error, type, context) => {
                console.log(`[${type}] ${msg}:`, error?.message || error);
            }
        },
        dataValidator: {
            validateGame: (game) => ({ isValid: true })
        }
    };
    
    global.fetch = require('node-fetch');
}

// Load NCAA Data Service
const fs = require('fs');
const path = require('path');

// Read and evaluate the NCAA data service
const ncaaServicePath = path.join(__dirname, 'public', 'ncaa-data-service.js');
const ncaaServiceCode = fs.readFileSync(ncaaServicePath, 'utf8');

// Remove browser-specific code and evaluate
const cleanedCode = ncaaServiceCode
    .replace(/console\.log\(/g, '// console.log(')
    .replace(/window\./g, 'global.window.');

eval(cleanedCode);

// Create NCAA data service instance
const ncaaService = new NCAADataService();

async function validateNCAAData() {
    console.log('🏈 NCAA Data Validation Test');
    console.log('=' .repeat(50));
    
    try {
        // Test 1: Get today's games
        console.log('\n📊 Test 1: Getting today\'s NCAA games...');
        const games = await ncaaService.getTodaysGames();
        
        console.log(`✅ Retrieved ${games.length} games`);
        
        if (games.length > 0) {
            const firstGame = games[0];
            console.log('\n🏈 First Game Details:');
            console.log(`   Name: ${firstGame.name}`);
            console.log(`   Home Team: ${firstGame.teams.home.name} (${firstGame.teams.home.abbreviation})`);
            console.log(`   Away Team: ${firstGame.teams.away.name} (${firstGame.teams.away.abbreviation})`);
            console.log(`   Venue: ${firstGame.venue}`);
            console.log(`   Status: ${firstGame.status.displayClock}`);
            console.log(`   Is Live: ${firstGame.isLive}`);
            
            // Check if this looks like college football
            const isCollegeFootball = checkIfCollegeFootball(firstGame);
            console.log(`   ✅ Is College Football: ${isCollegeFootball}`);
            
            if (!isCollegeFootball) {
                console.log('❌ ERROR: This appears to be NFL data, not NCAA data!');
                console.log('   Team names suggest professional teams rather than college teams');
            }
        }
        
        // Test 2: Check team names across all games
        console.log('\n📊 Test 2: Validating all team names...');
        const allTeamNames = [];
        games.forEach(game => {
            allTeamNames.push(game.teams.home.name);
            allTeamNames.push(game.teams.away.name);
        });
        
        const uniqueTeams = [...new Set(allTeamNames)];
        console.log(`   Found ${uniqueTeams.length} unique teams:`);
        
        const nflTeams = [];
        const collegeTeams = [];
        
        uniqueTeams.forEach(team => {
            if (isNFLTeam(team)) {
                nflTeams.push(team);
            } else if (isCollegeTeam(team)) {
                collegeTeams.push(team);
            }
        });
        
        console.log(`   🏈 College Teams: ${collegeTeams.length}`);
        console.log(`   🏈 NFL Teams: ${nflTeams.length}`);
        
        if (nflTeams.length > 0) {
            console.log('\n❌ ERROR: Found NFL teams in NCAA data:');
            nflTeams.forEach(team => console.log(`     - ${team}`));
        }
        
        if (collegeTeams.length > 0) {
            console.log('\n✅ College teams found:');
            collegeTeams.slice(0, 5).forEach(team => console.log(`     - ${team}`));
            if (collegeTeams.length > 5) {
                console.log(`     ... and ${collegeTeams.length - 5} more`);
            }
        }
        
        // Test 3: Check AI predictions
        console.log('\n📊 Test 3: Checking AI predictions...');
        const gamesWithAI = games.filter(game => game.aiPrediction);
        console.log(`   Games with AI predictions: ${gamesWithAI.length}`);
        
        if (gamesWithAI.length > 0) {
            const aiGame = gamesWithAI[0];
            console.log(`   Sample prediction confidence: ${aiGame.aiPrediction.confidence}%`);
            console.log(`   Sample recommendation: ${aiGame.aiPrediction.recommendation}`);
        }
        
        // Test 4: Check rankings
        console.log('\n📊 Test 4: Getting Top 25 rankings...');
        const rankings = await ncaaService.getTop25Rankings();
        console.log(`   Retrieved ${rankings.length} ranked teams`);
        
        if (rankings.length > 0) {
            console.log('   Top 5 teams:');
            rankings.slice(0, 5).forEach(team => {
                console.log(`     ${team.rank}. ${team.team} (${team.record})`);
            });
        }
        
        console.log('\n🎉 NCAA Data Validation Complete!');
        
        // Summary
        const isValid = nflTeams.length === 0 && collegeTeams.length > 0;
        console.log(`\n📋 SUMMARY: ${isValid ? '✅ VALID NCAA DATA' : '❌ INVALID - CONTAINS NFL DATA'}`);
        
        return {
            isValid,
            totalGames: games.length,
            collegeTeams: collegeTeams.length,
            nflTeams: nflTeams.length,
            gamesWithAI: gamesWithAI.length,
            rankings: rankings.length
        };
        
    } catch (error) {
        console.error('❌ Error during validation:', error);
        return { isValid: false, error: error.message };
    }
}

function checkIfCollegeFootball(game) {
    const homeTeam = game.teams.home.name.toLowerCase();
    const awayTeam = game.teams.away.name.toLowerCase();
    
    // College football indicators
    const collegeIndicators = [
        'bulldogs', 'tigers', 'buckeyes', 'wolverines', 'crimson tide',
        'longhorns', 'trojans', 'fighting irish', 'seminoles', 'nittany lions',
        'badgers', 'ducks', 'huskies', 'volunteers', 'gators', 'razorbacks',
        'university', 'college', 'state'
    ];
    
    return collegeIndicators.some(indicator => 
        homeTeam.includes(indicator) || awayTeam.includes(indicator)
    );
}

function isNFLTeam(teamName) {
    const nflTeams = [
        'Chiefs', 'Patriots', 'Cowboys', 'Packers', 'Steelers', 'Giants', 
        'Eagles', 'Ravens', 'Saints', 'Seahawks', 'Broncos', 'Colts',
        'Titans', 'Jaguars', 'Texans', 'Browns', 'Bengals', 'Bills',
        'Dolphins', 'Jets', 'Raiders', 'Chargers', 'Cardinals', 'Rams',
        'Niners', '49ers', 'Bears', 'Lions', 'Vikings', 'Falcons',
        'Panthers', 'Buccaneers', 'Commanders', 'Washington'
    ];
    
    return nflTeams.some(nflTeam => teamName.includes(nflTeam));
}

function isCollegeTeam(teamName) {
    const collegeTeams = [
        'Bulldogs', 'Tigers', 'Buckeyes', 'Wolverines', 'Crimson Tide',
        'Longhorns', 'Trojans', 'Fighting Irish', 'Seminoles', 'Nittany Lions',
        'Badgers', 'Ducks', 'Huskies', 'Volunteers', 'Gators', 'Razorbacks',
        'Aggies', 'Wildcats', 'Spartans', 'Cornhuskers', 'Sooners', 'Jayhawks'
    ];
    
    return collegeTeams.some(collegeTeam => teamName.includes(collegeTeam)) ||
           teamName.includes('University') || teamName.includes('State');
}

// Run validation if this is the main module
if (require.main === module) {
    validateNCAAData().then(result => {
        console.log('\n📊 Final Result:', result);
        process.exit(result.isValid ? 0 : 1);
    });
}

module.exports = { validateNCAAData };
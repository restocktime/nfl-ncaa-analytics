#!/usr/bin/env node

/**
 * Direct API Test for College Football Games
 * Tests ESPN and other APIs directly to see what's available RIGHT NOW
 */

const https = require('https');
const http = require('http');

console.log('🏈 CHECKING LIVE COLLEGE FOOTBALL GAMES - DIRECT API TEST');
console.log('='.repeat(60));
console.log(`Current Time: ${new Date().toLocaleString()}`);
console.log(`Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
console.log('='.repeat(60));

// Get today's date in YYYYMMDD format
const today = new Date();
const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

// APIs to test
const apis = [
    {
        name: 'ESPN College Football Scoreboard (Today)',
        url: `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${dateStr}`,
        parser: parseESPNData
    },
    {
        name: 'ESPN College Football Scoreboard (Current)',
        url: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
        parser: parseESPNData
    },
    {
        name: 'ESPN Events API',
        url: `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/events?dates=${dateStr}`,
        parser: parseESPNEventsData
    },
    {
        name: 'NCAA API (Week 1)',
        url: 'https://ncaa-api.henrygd.me/scoreboard/football/fbs/2024/1/all-conf',
        parser: parseNCAAData
    }
];

async function fetchAPI(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;
        
        const req = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; FootballAnalytics/1.0)',
                'Accept': 'application/json'
            }
        }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (error) {
                    resolve({ status: res.statusCode, data: data, error: 'Invalid JSON' });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

function parseESPNData(data) {
    if (!data || !data.events) {
        return { games: [], liveGames: [], error: 'No events in response' };
    }
    
    const games = [];
    const liveGames = [];
    
    data.events.forEach(event => {
        const competition = event.competitions && event.competitions[0];
        if (!competition) return;
        
        const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
        
        const isLive = event.status?.type?.name === 'STATUS_IN_PROGRESS';
        const isCompleted = event.status?.type?.completed;
        
        const game = {
            id: event.id,
            name: event.name || event.shortName,
            homeTeam: homeTeam?.team?.displayName || 'Home Team',
            awayTeam: awayTeam?.team?.displayName || 'Away Team',
            homeScore: homeTeam?.score || 0,
            awayScore: awayTeam?.score || 0,
            status: event.status?.type?.description || 'Unknown',
            displayClock: event.status?.displayClock || '',
            venue: competition.venue?.fullName || 'Venue TBD',
            date: new Date(event.date),
            isLive: isLive,
            isCompleted: isCompleted
        };
        
        games.push(game);
        if (isLive) {
            liveGames.push(game);
        }
    });
    
    return { games, liveGames };
}

function parseESPNEventsData(data) {
    if (!data || !data.items) {
        return { games: [], liveGames: [], error: 'No items in response' };
    }
    
    // This API has a different structure, would need to parse differently
    return { games: [], liveGames: [], info: `Found ${data.items.length} items (different structure)` };
}

function parseNCAAData(data) {
    if (!data || !data.games) {
        return { games: [], liveGames: [], error: 'No games in response' };
    }
    
    const games = data.games.map(game => ({
        id: game.id,
        name: `${game.away_team} vs ${game.home_team}`,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        homeScore: game.home_score || 0,
        awayScore: game.away_score || 0,
        status: game.status || 'Scheduled',
        venue: game.venue || 'Venue TBD',
        isLive: game.status && game.status.toLowerCase().includes('live'),
        isCompleted: game.status && game.status.toLowerCase().includes('final')
    }));
    
    const liveGames = games.filter(g => g.isLive);
    
    return { games, liveGames };
}

async function testAllAPIs() {
    console.log('🔍 Testing all college football APIs...\n');
    
    let totalLiveGames = 0;
    let totalGames = 0;
    let workingAPIs = 0;
    
    for (const api of apis) {
        console.log(`📡 Testing: ${api.name}`);
        console.log(`   URL: ${api.url}`);
        
        try {
            const result = await fetchAPI(api.url);
            
            if (result.status === 200 && result.data) {
                console.log(`   ✅ Status: ${result.status} OK`);
                
                const parsed = api.parser(result.data);
                
                if (parsed.error) {
                    console.log(`   ⚠️  Parse Error: ${parsed.error}`);
                } else if (parsed.info) {
                    console.log(`   ℹ️  Info: ${parsed.info}`);
                } else {
                    console.log(`   📊 Games Found: ${parsed.games.length}`);
                    console.log(`   🔴 Live Games: ${parsed.liveGames.length}`);
                    
                    totalGames += parsed.games.length;
                    totalLiveGames += parsed.liveGames.length;
                    workingAPIs++;
                    
                    // Show live games immediately
                    if (parsed.liveGames.length > 0) {
                        console.log('   🏈 LIVE GAMES:');
                        parsed.liveGames.forEach(game => {
                            console.log(`      🔴 ${game.awayTeam} ${game.awayScore} - ${game.homeScore} ${game.homeTeam}`);
                            console.log(`         Status: ${game.status} ${game.displayClock}`);
                            console.log(`         Venue: ${game.venue}`);
                        });
                    }
                    
                    // Show some scheduled games
                    const scheduledGames = parsed.games.filter(g => !g.isLive && !g.isCompleted).slice(0, 3);
                    if (scheduledGames.length > 0) {
                        console.log('   📅 Upcoming Games (sample):');
                        scheduledGames.forEach(game => {
                            console.log(`      📅 ${game.awayTeam} vs ${game.homeTeam}`);
                            console.log(`         Status: ${game.status}`);
                            console.log(`         Venue: ${game.venue}`);
                        });
                    }
                }
            } else {
                console.log(`   ❌ Status: ${result.status} ${result.error || 'Failed'}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log('='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`   Working APIs: ${workingAPIs}/${apis.length}`);
    console.log(`   Total Games Found: ${totalGames}`);
    console.log(`   🔴 LIVE GAMES: ${totalLiveGames}`);
    
    if (totalLiveGames === 0) {
        console.log('\n❌ NO LIVE GAMES FOUND');
        console.log('This could mean:');
        console.log('• College football season hasn\'t started yet');
        console.log('• No games scheduled for today');
        console.log('• Games are between periods or halftime');
        console.log('• APIs are not returning live status correctly');
        
        // Show what day it is
        const dayOfWeek = today.getDay();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        console.log(`\nℹ️  Today is ${dayNames[dayOfWeek]}, ${today.toLocaleDateString()}`);
        
        if (dayOfWeek === 6) { // Saturday
            console.log('✅ Saturday is the main college football day');
        } else if (dayOfWeek === 0) { // Sunday
            console.log('⚠️  Sunday has fewer college games (mostly NFL day)');
        } else {
            console.log('⚠️  Weekdays typically have fewer college football games');
        }
    } else {
        console.log(`\n🎉 FOUND ${totalLiveGames} LIVE COLLEGE FOOTBALL GAMES!`);
    }
    
    console.log('='.repeat(60));
}

// Run the test
testAllAPIs().catch(error => {
    console.error('❌ Fatal Error:', error);
    process.exit(1);
});
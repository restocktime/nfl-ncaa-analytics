// ESPN NFL Player Details Fetcher
// Fetch specific player information from ESPN athlete endpoints

async function fetchPlayerDetails() {
    console.log('🏈 Fetching detailed player information from ESPN\n');
    
    // Key player ESPN athlete IDs we found in the reference URLs
    const keyPlayers = {
        'Lamar Jackson': '3916387',
        'Patrick Mahomes': '3139477',  // Found in Chiefs roster
        'Travis Kelce': '15847',       // Found in Chiefs roster
        'DeAndre Hopkins': '15847',    // Need to find correct ID
    };
    
    // Test different years for player data
    const years = ['2025', '2024'];
    
    for (const [playerName, playerId] of Object.entries(keyPlayers)) {
        console.log(`\n🔍 Testing ${playerName} (ID: ${playerId})`);
        console.log('=' + '='.repeat(50));
        
        for (const year of years) {
            await fetchSpecificPlayer(playerName, playerId, year);
        }
    }
    
    // Also test team roster endpoints with direct parsing
    await testRosterWithDirectParsing();
}

async function fetchSpecificPlayer(playerName, playerId, year) {
    const endpoints = [
        `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${year}/athletes/${playerId}`,
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/${playerId}`,
        `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/${playerId}`
    ];
    
    console.log(`\n📅 Year ${year} - ${playerName}:`);
    
    for (const endpoint of endpoints) {
        console.log(`\n🔗 ${endpoint}`);
        
        try {
            const response = await fetch(endpoint);
            console.log(`📊 Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                
                // Extract key information
                const playerInfo = {
                    name: data.displayName || data.fullName || 'Unknown',
                    position: data.position?.abbreviation || data.position?.name || 'Unknown',
                    jersey: data.jersey || 'Unknown',
                    team: data.team?.displayName || data.teams?.[0]?.displayName || 'Unknown',
                    active: data.active,
                    status: data.status?.name || 'Unknown'
                };
                
                console.log(`✅ Player Info:`);
                console.log(`   Name: ${playerInfo.name}`);
                console.log(`   Position: ${playerInfo.position}`);
                console.log(`   Jersey: ${playerInfo.jersey}`);
                console.log(`   Team: ${playerInfo.team}`);
                console.log(`   Active: ${playerInfo.active}`);
                console.log(`   Status: ${playerInfo.status}`);
                
                // Check for injury/roster status
                if (data.injuries && Array.isArray(data.injuries)) {
                    console.log(`   Injuries: ${data.injuries.length} found`);
                    data.injuries.forEach(injury => {
                        console.log(`     - ${injury.description || 'Unknown injury'} (${injury.status || 'Unknown status'})`);
                    });
                }
                
                // Check for team roster status
                if (data.team && data.team.roster) {
                    console.log(`   Roster Status: Available`);
                }
                
                break; // Success, no need to try other endpoints
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

async function testRosterWithDirectParsing() {
    console.log('\n🏆 Testing roster endpoints with direct parsing\n');
    
    const teams = [
        { name: 'Baltimore Ravens', id: '33' },
        { name: 'Kansas City Chiefs', id: '12' },
        { name: 'New York Giants', id: '19' },
        { name: 'Indianapolis Colts', id: '11' },
        { name: 'Las Vegas Raiders', id: '13' }
    ];
    
    for (const team of teams) {
        console.log(`\n📊 ${team.name} - Direct Roster Parsing:`);
        
        // Try the team endpoint with roster enabled
        const teamUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team.id}?enable=roster,projection,stats`;
        
        try {
            const response = await fetch(teamUrl);
            console.log(`📞 ${teamUrl}`);
            console.log(`📊 Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.team && data.team.athletes) {
                    console.log(`✅ Found ${data.team.athletes.length} athletes`);
                    
                    // Filter for QBs and key players
                    const quarterbacks = data.team.athletes.filter(athlete => 
                        athlete.position && athlete.position.abbreviation === 'QB'
                    );
                    
                    const keyPlayers = data.team.athletes.filter(athlete => {
                        const name = athlete.displayName || athlete.fullName || '';
                        return ['Lamar Jackson', 'DeAndre Hopkins', 'Daniel Jones', 'Geno Smith', 'Patrick Mahomes'].some(key => 
                            name.includes(key) || key.includes(name)
                        );
                    });
                    
                    if (quarterbacks.length > 0) {
                        console.log(`🎯 Quarterbacks (${quarterbacks.length}):`);
                        quarterbacks.forEach(qb => {
                            console.log(`   - ${qb.displayName} (#${qb.jersey}) - ${qb.active ? 'ACTIVE' : 'INACTIVE'}`);
                            if (qb.injuries && qb.injuries.length > 0) {
                                qb.injuries.forEach(injury => {
                                    console.log(`     🚑 ${injury.description} (${injury.status})`);
                                });
                            }
                        });
                    }
                    
                    if (keyPlayers.length > 0) {
                        console.log(`⭐ Key Players (${keyPlayers.length}):`);
                        keyPlayers.forEach(player => {
                            console.log(`   - ${player.displayName} (${player.position?.abbreviation}) #${player.jersey} - ${player.active ? 'ACTIVE' : 'INACTIVE'}`);
                            if (player.injuries && player.injuries.length > 0) {
                                player.injuries.forEach(injury => {
                                    console.log(`     🚑 ${injury.description} (${injury.status})`);
                                });
                            }
                        });
                    }
                    
                    if (quarterbacks.length === 0 && keyPlayers.length === 0) {
                        console.log(`ℹ️  No QBs or key players found. Showing first 5 players:`);
                        data.team.athletes.slice(0, 5).forEach(athlete => {
                            console.log(`   - ${athlete.displayName} (${athlete.position?.abbreviation}) #${athlete.jersey}`);
                        });
                    }
                } else {
                    console.log(`❌ No athletes data found in team response`);
                    console.log(`🔍 Available keys: ${Object.keys(data.team || {}).join(', ')}`);
                }
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

// Test current ESPN web pages for depth chart information
async function testCurrentDepthCharts() {
    console.log('\n🌐 Testing Current ESPN Depth Chart Pages\n');
    
    const teams = [
        { name: 'Baltimore Ravens', code: 'bal' },
        { name: 'Kansas City Chiefs', code: 'kc' },
        { name: 'New York Giants', code: 'nyg' },
        { name: 'Indianapolis Colts', code: 'ind' },
        { name: 'Las Vegas Raiders', code: 'lv' }
    ];
    
    for (const team of teams) {
        console.log(`\n📊 ${team.name} Current Depth Chart:`);
        
        const depthChartUrl = `https://www.espn.com/nfl/team/depth/_/name/${team.code}`;
        
        try {
            const response = await fetch(depthChartUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
            
            console.log(`📞 ${depthChartUrl}`);
            console.log(`📊 Status: ${response.status}`);
            
            if (response.ok) {
                const html = await response.text();
                
                // Look for quarterback section
                const qbSection = html.match(/<tr[^>]*>.*?QB.*?<\/tr>/gi);
                if (qbSection) {
                    console.log(`🎯 QB Depth Chart Found:`);
                    qbSection.slice(0, 3).forEach((section, i) => {
                        const cleanText = section.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                        console.log(`   ${i + 1}. ${cleanText}`);
                    });
                }
                
                // Look for specific players
                const playersToFind = ['Lamar Jackson', 'DeAndre Hopkins', 'Daniel Jones', 'Geno Smith', 'Patrick Mahomes'];
                
                playersToFind.forEach(playerName => {
                    if (html.includes(playerName)) {
                        console.log(`⭐ ${playerName} found in depth chart`);
                        
                        // Try to extract position context
                        const playerIndex = html.indexOf(playerName);
                        const beforePlayer = html.substring(Math.max(0, playerIndex - 200), playerIndex);
                        const afterPlayer = html.substring(playerIndex, Math.min(html.length, playerIndex + 200));
                        
                        // Look for position indicators
                        const positionMatch = beforePlayer.match(/(?:QB|RB|WR|TE|K|DEF)/gi) || 
                                            afterPlayer.match(/(?:QB|RB|WR|TE|K|DEF)/gi);
                        
                        if (positionMatch) {
                            console.log(`   Position context: ${positionMatch[positionMatch.length - 1]}`);
                        }
                        
                        // Look for depth indicators (1st, 2nd, etc.)
                        const depthMatch = (beforePlayer + afterPlayer).match(/(?:1st|2nd|3rd|starter|backup)/gi);
                        if (depthMatch) {
                            console.log(`   Depth context: ${depthMatch[0]}`);
                        }
                    }
                });
                
            } else {
                console.log(`❌ Failed to fetch depth chart`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

// Main execution
async function runPlayerDetailsTest() {
    console.log('🚀 Starting ESPN Player Details Test\n');
    console.log('📅 Date:', new Date().toISOString());
    
    await fetchPlayerDetails();
    await testCurrentDepthCharts();
    
    console.log('\n✅ Player details test completed!');
}

runPlayerDetailsTest().catch(console.error);
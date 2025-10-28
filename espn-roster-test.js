// ESPN NFL Roster and Depth Chart API Testing
// Testing accurate starter information for 2025 season

async function testESPNRosterEndpoints() {
    console.log('🏈 Testing ESPN NFL Roster and Depth Chart APIs for 2025 Season\n');
    
    // Team ID mapping (ESPN team IDs)
    const teams = {
        'Baltimore Ravens': '33',
        'Kansas City Chiefs': '12', 
        'New York Giants': '19',
        'Indianapolis Colts': '11',
        'Las Vegas Raiders': '13'
    };
    
    // Test different API endpoints for each team
    for (const [teamName, teamId] of Object.entries(teams)) {
        console.log(`\n🔍 Testing ${teamName} (ID: ${teamId})`);
        console.log('=' + '='.repeat(50));
        
        await testTeamRosterEndpoints(teamName, teamId);
    }
}

async function testTeamRosterEndpoints(teamName, teamId) {
    const endpoints = [
        {
            name: 'Team Roster (Site API)',
            url: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`,
            dataPath: ['athletes']
        },
        {
            name: 'Team with Roster Enabled',
            url: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}?enable=roster,projection,stats`,
            dataPath: ['team', 'roster', 'entries']
        },
        {
            name: 'Core API Athletes',
            url: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/${teamId}/athletes?limit=200`,
            dataPath: ['items']
        },
        {
            name: 'Depth Charts',
            url: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/${teamId}/depthcharts`,
            dataPath: ['items']
        },
        {
            name: 'Alternative Athletes Endpoint',
            url: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/teams/${teamId}/athletes?limit=200`,
            dataPath: ['items']
        }
    ];
    
    for (const endpoint of endpoints) {
        await testSpecificEndpoint(teamName, endpoint);
    }
}

async function testSpecificEndpoint(teamName, endpoint) {
    console.log(`\n🧪 ${endpoint.name}:`);
    console.log(`📞 ${endpoint.url}`);
    
    try {
        const response = await fetch(endpoint.url);
        console.log(`📊 Status: ${response.status}`);
        
        if (!response.ok) {
            console.log(`❌ Failed: ${response.status} ${response.statusText}`);
            return;
        }
        
        const data = await response.json();
        
        // Navigate to the player data using the dataPath
        let playerData = data;
        for (const path of endpoint.dataPath) {
            if (playerData && typeof playerData === 'object') {
                playerData = playerData[path];
            } else {
                playerData = null;
                break;
            }
        }
        
        if (!playerData || !Array.isArray(playerData)) {
            console.log(`⚠️  No player array found at path: ${endpoint.dataPath.join('.')}`);
            console.log(`🔍 Available keys: ${data && typeof data === 'object' ? Object.keys(data).join(', ') : 'N/A'}`);
            
            // Try to find starters in the raw data
            await analyzeDataForStarters(teamName, data);
            return;
        }
        
        console.log(`✅ Found ${playerData.length} players`);
        
        // Look for QBs and key players
        const quarterbacks = [];
        const keyPlayers = [];
        
        for (const player of playerData.slice(0, 50)) { // Limit to first 50 players
            let playerInfo = null;
            
            // Handle different data structures
            if (player.athlete) {
                // Site API structure
                playerInfo = {
                    name: player.athlete.displayName || player.athlete.fullName,
                    position: player.athlete.position?.abbreviation,
                    jersey: player.athlete.jersey,
                    starter: player.starter,
                    active: player.active
                };
            } else if (player.$ref) {
                // Core API reference structure - would need additional fetch
                console.log(`🔗 Reference found: ${player.$ref}`);
                continue;
            } else if (player.displayName || player.fullName) {
                // Direct player object
                playerInfo = {
                    name: player.displayName || player.fullName,
                    position: player.position?.abbreviation || player.position,
                    jersey: player.jersey,
                    starter: player.starter,
                    active: player.active
                };
            }
            
            if (playerInfo && playerInfo.name) {
                if (playerInfo.position === 'QB') {
                    quarterbacks.push(playerInfo);
                }
                
                // Check for key players we're tracking
                const keyPlayerNames = ['Lamar Jackson', 'DeAndre Hopkins', 'Daniel Jones', 'Geno Smith'];
                if (keyPlayerNames.some(name => playerInfo.name.includes(name) || name.includes(playerInfo.name))) {
                    keyPlayers.push(playerInfo);
                }
            }
        }
        
        // Report findings
        if (quarterbacks.length > 0) {
            console.log(`🎯 Quarterbacks found:`);
            quarterbacks.forEach(qb => {
                console.log(`   - ${qb.name} (#${qb.jersey || 'N/A'}) ${qb.starter ? '[STARTER]' : ''} ${qb.active === false ? '[INACTIVE]' : ''}`);
            });
        }
        
        if (keyPlayers.length > 0) {
            console.log(`⭐ Key players found:`);
            keyPlayers.forEach(player => {
                console.log(`   - ${player.name} (${player.position}) #${player.jersey || 'N/A'} ${player.starter ? '[STARTER]' : ''}`);
            });
        }
        
        if (quarterbacks.length === 0 && keyPlayers.length === 0) {
            console.log(`ℹ️  No QBs or key players found in first 50 entries`);
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

async function analyzeDataForStarters(teamName, data) {
    console.log(`🔍 Analyzing raw data structure for ${teamName}:`);
    
    if (!data || typeof data !== 'object') {
        console.log(`⚠️  No valid data structure`);
        return;
    }
    
    // Check for common paths that might contain player data
    const pathsToCheck = [
        'athletes',
        'roster',
        'entries',
        'items',
        'players',
        'team.roster',
        'team.athletes',
        'positions'
    ];
    
    for (const path of pathsToCheck) {
        const pathParts = path.split('.');
        let current = data;
        
        for (const part of pathParts) {
            if (current && typeof current === 'object' && current[part]) {
                current = current[part];
            } else {
                current = null;
                break;
            }
        }
        
        if (current && Array.isArray(current)) {
            console.log(`📍 Found array at ${path}: ${current.length} items`);
            if (current.length > 0) {
                console.log(`   Sample item keys: ${Object.keys(current[0]).join(', ')}`);
            }
        } else if (current && typeof current === 'object') {
            console.log(`📍 Found object at ${path}: ${Object.keys(current).join(', ')}`);
        }
    }
    
    console.log(`📋 Top-level keys: ${Object.keys(data).join(', ')}`);
}

// Test specific depth chart endpoints
async function testDepthChartSpecifically() {
    console.log('\n🏆 Testing ESPN Depth Chart API Specifically\n');
    
    const teams = {
        'Baltimore Ravens': '33',
        'Kansas City Chiefs': '12'
    };
    
    for (const [teamName, teamId] of Object.entries(teams)) {
        console.log(`\n📊 ${teamName} Depth Chart:`);
        
        const depthChartUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/${teamId}/depthcharts`;
        
        try {
            const response = await fetch(depthChartUrl);
            console.log(`📞 ${depthChartUrl}`);
            console.log(`📊 Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Depth chart data received`);
                console.log(`🔍 Structure: ${Object.keys(data).join(', ')}`);
                
                if (data.items && Array.isArray(data.items)) {
                    console.log(`📍 Found ${data.items.length} depth chart items`);
                    
                    // Look for QB depth chart
                    for (const item of data.items.slice(0, 5)) {
                        if (item.$ref) {
                            console.log(`🔗 Depth chart reference: ${item.$ref}`);
                            
                            // Fetch the actual depth chart data
                            try {
                                const depthResponse = await fetch(item.$ref);
                                if (depthResponse.ok) {
                                    const depthData = await depthResponse.json();
                                    console.log(`   📋 Position: ${depthData.position?.abbreviation || 'Unknown'}`);
                                    
                                    if (depthData.athletes && Array.isArray(depthData.athletes)) {
                                        console.log(`   👥 ${depthData.athletes.length} players at this position`);
                                        
                                        for (let i = 0; i < Math.min(3, depthData.athletes.length); i++) {
                                            const athlete = depthData.athletes[i];
                                            if (athlete.$ref) {
                                                console.log(`   ${i + 1}. Reference: ${athlete.$ref}`);
                                            }
                                        }
                                    }
                                }
                            } catch (depthError) {
                                console.log(`   ❌ Error fetching depth details: ${depthError.message}`);
                            }
                        }
                    }
                }
            } else {
                console.log(`❌ Failed to fetch depth chart`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

// Test ESPN's web scraping approach (depth charts from website)
async function testESPNWebDepthCharts() {
    console.log('\n🌐 Testing ESPN Web Depth Charts\n');
    
    const teams = {
        'Baltimore Ravens': 'bal',
        'Kansas City Chiefs': 'kc',
        'New York Giants': 'nyg',
        'Indianapolis Colts': 'ind',
        'Las Vegas Raiders': 'lv'
    };
    
    for (const [teamName, teamCode] of Object.entries(teams)) {
        console.log(`\n📊 ${teamName} Web Depth Chart:`);
        
        const depthChartUrl = `https://www.espn.com/nfl/team/depth/_/name/${teamCode}`;
        console.log(`📞 ${depthChartUrl}`);
        
        try {
            const response = await fetch(depthChartUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
                }
            });
            
            console.log(`📊 Status: ${response.status}`);
            
            if (response.ok) {
                const html = await response.text();
                console.log(`✅ HTML received: ${html.length} characters`);
                
                // Look for quarterback information in the HTML
                const qbPatterns = [
                    /Quarterback.*?<\/tr>/gi,
                    /QB.*?<\/tr>/gi,
                    /<tr[^>]*>.*?QB.*?<\/tr>/gi
                ];
                
                for (const pattern of qbPatterns) {
                    const matches = html.match(pattern);
                    if (matches) {
                        console.log(`🎯 Found QB data: ${matches.length} matches`);
                        matches.slice(0, 2).forEach((match, i) => {
                            console.log(`   ${i + 1}. ${match.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`);
                        });
                        break;
                    }
                }
                
                // Look for player names we're tracking
                const playersToFind = ['Lamar Jackson', 'DeAndre Hopkins', 'Daniel Jones', 'Geno Smith'];
                playersToFind.forEach(playerName => {
                    if (html.includes(playerName)) {
                        console.log(`⭐ Found ${playerName} in depth chart`);
                        
                        // Extract context around the player name
                        const playerIndex = html.indexOf(playerName);
                        const contextStart = Math.max(0, playerIndex - 100);
                        const contextEnd = Math.min(html.length, playerIndex + 100);
                        const context = html.slice(contextStart, contextEnd).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                        console.log(`   Context: ...${context}...`);
                    }
                });
                
            } else {
                console.log(`❌ Failed to fetch web depth chart`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

// Main execution
async function runComprehensiveESPNTest() {
    console.log('🚀 Starting Comprehensive ESPN NFL Roster API Test\n');
    console.log('📅 Date:', new Date().toISOString());
    console.log('🎯 Goal: Verify starter status for key players\n');
    
    await testESPNRosterEndpoints();
    await testDepthChartSpecifically();
    await testESPNWebDepthCharts();
    
    console.log('\n✅ Comprehensive ESPN test completed!');
    console.log('\n📋 Summary of findings will be displayed above.');
}

// Run the test
runComprehensiveESPNTest().catch(console.error);
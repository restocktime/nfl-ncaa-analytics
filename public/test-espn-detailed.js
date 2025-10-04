// Get detailed ESPN API data
async function getESPNTeamsData() {
    console.log('🏈 Getting detailed ESPN NFL teams data...\n');
    
    try {
        const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams');
        const data = await response.json();
        
        console.log('📊 ESPN Teams API Response Structure:');
        console.log('- Main keys:', Object.keys(data));
        
        if (data.sports && data.sports[0] && data.sports[0].leagues) {
            const league = data.sports[0].leagues[0];
            console.log('- League:', league.name);
            console.log('- Teams count:', league.teams?.length);
            
            if (league.teams && league.teams.length > 0) {
                const firstTeam = league.teams[0];
                console.log('\n🔍 Sample team structure:');
                console.log('- Team keys:', Object.keys(firstTeam.team));
                console.log('- Team name:', firstTeam.team.displayName);
                console.log('- Team abbreviation:', firstTeam.team.abbreviation);
                console.log('- Has roster?', !!firstTeam.team.roster);
                
                // Check for roster endpoint
                if (firstTeam.team.roster) {
                    console.log('- Roster endpoint:', firstTeam.team.roster.$ref);
                }
                
                // Show first few teams
                console.log('\n📋 All NFL Teams:');
                league.teams.forEach((t, i) => {
                    if (i < 10) { // Show first 10 teams
                        console.log(`${i + 1}. ${t.team.displayName} (${t.team.abbreviation})`);
                    }
                });
                
                return league.teams;
            }
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function getESPNScoreboardData() {
    console.log('\n🏈 Getting detailed ESPN NFL scoreboard data...\n');
    
    try {
        const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
        const data = await response.json();
        
        console.log('📊 ESPN Scoreboard API Response Structure:');
        console.log('- Main keys:', Object.keys(data));
        console.log('- Events count:', data.events?.length);
        
        if (data.events && data.events.length > 0) {
            const firstEvent = data.events[0];
            console.log('\n🔍 Sample event structure:');
            console.log('- Event keys:', Object.keys(firstEvent));
            console.log('- Game name:', firstEvent.name);
            console.log('- Status:', firstEvent.status?.type?.description);
            console.log('- Date:', firstEvent.date);
            
            if (firstEvent.competitions && firstEvent.competitions[0]) {
                const competition = firstEvent.competitions[0];
                console.log('- Competition keys:', Object.keys(competition));
                console.log('- Competitors count:', competition.competitors?.length);
                
                if (competition.competitors) {
                    competition.competitors.forEach(comp => {
                        console.log(`  - ${comp.team.displayName} (${comp.homeAway})`);
                    });
                }
                
                // Check for odds
                if (competition.odds) {
                    console.log('- Has odds:', competition.odds.length, 'providers');
                }
            }
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function testRosterEndpoint() {
    console.log('\n👥 Testing individual team roster endpoints...\n');
    
    // First get teams to find roster endpoints
    try {
        const teamsResponse = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams');
        const teamsData = await teamsResponse.json();
        
        const firstTeam = teamsData.sports[0].leagues[0].teams[0];
        const teamName = firstTeam.team.displayName;
        
        // Try different roster endpoint patterns
        const rosterPatterns = [
            `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${firstTeam.team.id}/roster`,
            `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${firstTeam.team.id}`,
            `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/teams/${firstTeam.team.id}/athletes`,
        ];
        
        for (const endpoint of rosterPatterns) {
            console.log(`🧪 Testing roster endpoint: ${endpoint}`);
            
            try {
                const response = await fetch(endpoint);
                console.log(`📊 Status: ${response.status}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Success for ${teamName}!`);
                    console.log('- Data keys:', Object.keys(data));
                    
                    if (data.athletes) {
                        console.log(`👥 Athletes found: ${data.athletes.length}`);
                        if (data.athletes.length > 0) {
                            const firstAthlete = data.athletes[0];
                            console.log('- Sample athlete:', firstAthlete.displayName, firstAthlete.position?.abbreviation);
                        }
                    }
                    
                    // Show structure
                    console.log('📋 Sample data structure:');
                    console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
                    break; // Found working endpoint
                }
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
            }
        }
    } catch (error) {
        console.error('❌ Teams fetch error:', error.message);
    }
}

async function runDetailedESPNTests() {
    await getESPNTeamsData();
    await getESPNScoreboardData();
    await testRosterEndpoint();
}

runDetailedESPNTests().catch(console.error);
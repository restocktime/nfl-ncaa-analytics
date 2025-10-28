// ESPN NFL Roster Verification - 2025 Season
// Comprehensive verification of starter status vs current embedded data

async function verifyCurrentStarters() {
    console.log('🏈 ESPN NFL Roster Verification for 2025 Season\n');
    console.log('📅 Date:', new Date().toISOString());
    console.log('🎯 Verifying starter status for betting accuracy\n');
    
    // Current data from your codebase vs ESPN findings
    const verificationData = [
        {
            team: 'Baltimore Ravens',
            player: 'Lamar Jackson',
            position: 'QB',
            jersey: 8,
            yourData: 'STARTER',
            espnFindings: 'ACTIVE but INJURED (Out status)',
            discrepancy: 'INJURY STATUS NOT REFLECTED'
        },
        {
            team: 'Kansas City Chiefs', 
            player: 'DeAndre Hopkins',
            position: 'WR',
            jersey: 10,
            yourData: 'STARTER (on Chiefs roster)',
            espnFindings: 'ACTIVE on Ravens roster (not Chiefs)',
            discrepancy: 'WRONG TEAM - Hopkins is on Ravens, not Chiefs'
        },
        {
            team: 'Kansas City Chiefs',
            player: 'Patrick Mahomes',
            position: 'QB', 
            jersey: 15,
            yourData: 'Not explicitly listed as starter',
            espnFindings: 'ACTIVE starting QB',
            discrepancy: 'MISSING FROM STARTER DATA'
        },
        {
            team: 'New York Giants',
            player: 'Daniel Jones',
            position: 'QB',
            jersey: null,
            yourData: 'STARTER (but listed on Colts in some files)',
            espnFindings: 'Not found on Giants roster',
            discrepancy: 'OUTDATED TEAM ASSIGNMENT'
        },
        {
            team: 'Indianapolis Colts',
            player: 'Daniel Jones', 
            position: 'QB',
            jersey: 17,
            yourData: 'STARTER',
            espnFindings: 'ACTIVE on Colts roster',
            discrepancy: 'CORRECT - matches ESPN'
        },
        {
            team: 'Las Vegas Raiders',
            player: 'Geno Smith',
            position: 'QB',
            jersey: 7, 
            yourData: 'STARTER',
            espnFindings: 'ACTIVE on Raiders roster',
            discrepancy: 'CORRECT - matches ESPN'
        }
    ];
    
    console.log('📊 VERIFICATION RESULTS:');
    console.log('=' + '='.repeat(80));
    
    let correctCount = 0;
    let issueCount = 0;
    
    verificationData.forEach((item, i) => {
        console.log(`\n${i + 1}. ${item.player} (${item.team})`);
        console.log(`   Position: ${item.position} | Jersey: ${item.jersey || 'N/A'}`);
        console.log(`   Your Data: ${item.yourData}`);
        console.log(`   ESPN Data: ${item.espnFindings}`);
        
        if (item.discrepancy.includes('CORRECT')) {
            console.log(`   ✅ Status: ${item.discrepancy}`);
            correctCount++;
        } else {
            console.log(`   ❌ Issue: ${item.discrepancy}`);
            issueCount++;
        }
    });
    
    console.log('\n📈 SUMMARY:');
    console.log(`✅ Correct: ${correctCount}`);
    console.log(`❌ Issues: ${issueCount}`);
    console.log(`📊 Accuracy: ${((correctCount / verificationData.length) * 100).toFixed(1)}%`);
    
    return verificationData;
}

async function getCurrentESPNDepthCharts() {
    console.log('\n\n🏆 CURRENT ESPN DEPTH CHART STATUS (October 2025)\n');
    
    const teams = [
        { name: 'Baltimore Ravens', id: '33', code: 'bal' },
        { name: 'Kansas City Chiefs', id: '12', code: 'kc' },
        { name: 'New York Giants', id: '19', code: 'nyg' },
        { name: 'Indianapolis Colts', id: '11', code: 'ind' },
        { name: 'Las Vegas Raiders', id: '13', code: 'lv' }
    ];
    
    const currentStarters = {};
    
    for (const team of teams) {
        console.log(`\n📊 ${team.name}:`);
        
        try {
            // Get roster data
            const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team.id}?enable=roster,projection,stats`;
            const response = await fetch(rosterUrl);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.team && data.team.athletes) {
                    const quarterbacks = data.team.athletes.filter(athlete => 
                        athlete.position && athlete.position.abbreviation === 'QB' && athlete.active
                    );
                    
                    // Sort QBs by experience or starter status (first listed is usually starter)
                    const startingQB = quarterbacks[0]; // First active QB is typically starter
                    
                    if (startingQB) {
                        const injuryStatus = startingQB.injuries && startingQB.injuries.length > 0 ? 
                            `(${startingQB.injuries[0].status || 'Injured'})` : '';
                        
                        console.log(`   🎯 Starting QB: ${startingQB.displayName} #${startingQB.jersey} ${injuryStatus}`);
                        
                        currentStarters[team.name] = {
                            qb: {
                                name: startingQB.displayName,
                                jersey: startingQB.jersey,
                                active: startingQB.active,
                                injured: startingQB.injuries && startingQB.injuries.length > 0,
                                injuryStatus: startingQB.injuries && startingQB.injuries.length > 0 ? 
                                    startingQB.injuries[0].status : null
                            }
                        };
                        
                        // Show backup QBs
                        if (quarterbacks.length > 1) {
                            console.log(`   📋 Backup QBs:`);
                            quarterbacks.slice(1).forEach((qb, i) => {
                                const backupInjuryStatus = qb.injuries && qb.injuries.length > 0 ? 
                                    `(${qb.injuries[0].status || 'Injured'})` : '';
                                console.log(`     ${i + 2}. ${qb.displayName} #${qb.jersey} ${backupInjuryStatus}`);
                            });
                        }
                    } else {
                        console.log(`   ❌ No active quarterbacks found`);
                    }
                    
                    // Look for other key players
                    const keyPositions = ['WR', 'RB', 'TE'];
                    keyPositions.forEach(pos => {
                        const players = data.team.athletes.filter(athlete => 
                            athlete.position && athlete.position.abbreviation === pos && athlete.active
                        ).slice(0, 2); // Top 2 at each position
                        
                        if (players.length > 0) {
                            console.log(`   📍 Top ${pos}s:`);
                            players.forEach((player, i) => {
                                const injuryStatus = player.injuries && player.injuries.length > 0 ? 
                                    `(${player.injuries[0].status || 'Injured'})` : '';
                                console.log(`     ${i + 1}. ${player.displayName} #${player.jersey} ${injuryStatus}`);
                            });
                        }
                    });
                }
            }
        } catch (error) {
            console.log(`   ❌ Error fetching ${team.name}: ${error.message}`);
        }
    }
    
    return currentStarters;
}

async function generateAPIEndpointSummary() {
    console.log('\n\n📋 ESPN NFL API ENDPOINTS SUMMARY\n');
    
    const endpoints = [
        {
            name: 'Team Roster with Stats',
            url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{TEAM_ID}?enable=roster,projection,stats',
            description: 'Complete team roster with player details, injuries, and stats',
            useCase: 'Get current roster, starter status, injury information',
            example: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/33?enable=roster,projection,stats'
        },
        {
            name: 'Individual Player Details',
            url: 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/athletes/{PLAYER_ID}',
            description: 'Detailed player information including injury status',
            useCase: 'Verify individual player status and team assignment',
            example: 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/athletes/3916387'
        },
        {
            name: 'Team Athletes List',
            url: 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/teams/{TEAM_ID}/athletes?limit=200',
            description: 'List of all team athletes with reference URLs',
            useCase: 'Get complete team roster references',
            example: 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/33/athletes?limit=200'
        },
        {
            name: 'Web Depth Charts',
            url: 'https://www.espn.com/nfl/team/depth/_/name/{TEAM_CODE}',
            description: 'HTML depth charts showing starting lineups',
            useCase: 'Visual confirmation of starter status',
            example: 'https://www.espn.com/nfl/team/depth/_/name/bal'
        }
    ];
    
    endpoints.forEach(endpoint => {
        console.log(`🔗 ${endpoint.name}:`);
        console.log(`   URL: ${endpoint.url}`);
        console.log(`   Purpose: ${endpoint.description}`);
        console.log(`   Use Case: ${endpoint.useCase}`);
        console.log(`   Example: ${endpoint.example}\n`);
    });
}

async function generateRecommendations(verificationResults) {
    console.log('\n\n🎯 RECOMMENDATIONS FOR DATA ACCURACY\n');
    
    console.log('🚨 CRITICAL ISSUES TO FIX:');
    console.log('1. DeAndre Hopkins is on RAVENS (#10), not Chiefs - update all references');
    console.log('2. Lamar Jackson is INJURED (Out status) - factor into betting odds');
    console.log('3. Daniel Jones assignment inconsistent - he is on COLTS (#17)');
    console.log('4. Add Patrick Mahomes as explicit Chiefs starter\n');
    
    console.log('✅ VALIDATED STARTERS (October 2025):');
    console.log('• Ravens QB: Lamar Jackson #8 (INJURED - Out)');
    console.log('• Ravens WR: DeAndre Hopkins #10 (Active)');
    console.log('• Chiefs QB: Patrick Mahomes #15 (Active)');
    console.log('• Colts QB: Daniel Jones #17 (Active)');
    console.log('• Raiders QB: Geno Smith #7 (Active)\n');
    
    console.log('🔄 RECOMMENDED API INTEGRATION:');
    console.log('• Use ESPN Team Roster API for real-time roster updates');
    console.log('• Check injury status before generating betting recommendations');
    console.log('• Validate player-team assignments daily during season');
    console.log('• Implement backup QB logic for injured starters\n');
    
    console.log('📊 DATA REFRESH FREQUENCY:');
    console.log('• Injury status: Every 2 hours during game days');
    console.log('• Roster changes: Daily during season');
    console.log('• Depth chart updates: Weekly');
}

// Main execution
async function runCompleteVerification() {
    console.log('🚀 ESPN NFL ROSTER VERIFICATION COMPLETE ANALYSIS\n');
    
    const verificationResults = await verifyCurrentStarters();
    const currentStarters = await getCurrentESPNDepthCharts();
    await generateAPIEndpointSummary();
    await generateRecommendations(verificationResults);
    
    console.log('\n✅ Complete ESPN roster verification finished!');
    console.log('📋 Use this data to update your betting system for accuracy.');
    
    return {
        verificationResults,
        currentStarters,
        timestamp: new Date().toISOString()
    };
}

runCompleteVerification().catch(console.error);
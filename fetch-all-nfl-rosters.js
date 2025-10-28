#!/usr/bin/env node

// Script to fetch accurate 2025 NFL rosters for all 32 teams
const https = require('https');
const fs = require('fs');

// NFL team IDs for ESPN API
const NFL_TEAMS = {
    1: { name: 'Atlanta Falcons', abbreviation: 'ATL' },
    2: { name: 'Buffalo Bills', abbreviation: 'BUF' },
    3: { name: 'Chicago Bears', abbreviation: 'CHI' },
    4: { name: 'Cincinnati Bengals', abbreviation: 'CIN' },
    5: { name: 'Cleveland Browns', abbreviation: 'CLE' },
    6: { name: 'Dallas Cowboys', abbreviation: 'DAL' },
    7: { name: 'Denver Broncos', abbreviation: 'DEN' },
    8: { name: 'Detroit Lions', abbreviation: 'DET' },
    9: { name: 'Green Bay Packers', abbreviation: 'GB' },
    10: { name: 'Tennessee Titans', abbreviation: 'TEN' },
    11: { name: 'Indianapolis Colts', abbreviation: 'IND' },
    12: { name: 'Kansas City Chiefs', abbreviation: 'KC' },
    13: { name: 'Las Vegas Raiders', abbreviation: 'LV' },
    14: { name: 'Los Angeles Rams', abbreviation: 'LAR' },
    15: { name: 'Miami Dolphins', abbreviation: 'MIA' },
    16: { name: 'Minnesota Vikings', abbreviation: 'MIN' },
    17: { name: 'New England Patriots', abbreviation: 'NE' },
    18: { name: 'New Orleans Saints', abbreviation: 'NO' },
    19: { name: 'New York Giants', abbreviation: 'NYG' },
    20: { name: 'New York Jets', abbreviation: 'NYJ' },
    21: { name: 'Philadelphia Eagles', abbreviation: 'PHI' },
    22: { name: 'Arizona Cardinals', abbreviation: 'ARI' },
    23: { name: 'Pittsburgh Steelers', abbreviation: 'PIT' },
    24: { name: 'Los Angeles Chargers', abbreviation: 'LAC' },
    25: { name: 'San Francisco 49ers', abbreviation: 'SF' },
    26: { name: 'Seattle Seahawks', abbreviation: 'SEA' },
    27: { name: 'Tampa Bay Buccaneers', abbreviation: 'TB' },
    28: { name: 'Washington Commanders', abbreviation: 'WAS' },
    29: { name: 'Carolina Panthers', abbreviation: 'CAR' },
    30: { name: 'Jacksonville Jaguars', abbreviation: 'JAX' },
    33: { name: 'Baltimore Ravens', abbreviation: 'BAL' },
    34: { name: 'Houston Texans', abbreviation: 'HOU' }
};

function fetchTeamRoster(teamId) {
    return new Promise((resolve, reject) => {
        const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const roster = JSON.parse(data);
                    const teamInfo = NFL_TEAMS[teamId];
                    
                    if (!roster.athletes) {
                        console.log(`❌ No roster data for ${teamInfo.name}`);
                        resolve(null);
                        return;
                    }
                    
                    // Extract key players by position
                    const players = roster.athletes[0]?.items || [];
                    const keyPlayers = {
                        teamName: teamInfo.name,
                        abbreviation: teamInfo.abbreviation,
                        quarterbacks: [],
                        runningBacks: [],
                        wideReceivers: [],
                        tightEnds: [],
                        kickers: []
                    };
                    
                    players.forEach(player => {
                        const pos = player.position?.abbreviation;
                        const playerData = {
                            name: player.displayName,
                            position: pos,
                            jersey: player.jersey,
                            age: player.age,
                            experience: player.experience?.years || 0,
                            college: player.college?.name || '',
                            height: player.height,
                            weight: player.weight
                        };
                        
                        switch(pos) {
                            case 'QB':
                                keyPlayers.quarterbacks.push(playerData);
                                break;
                            case 'RB':
                            case 'FB':
                                keyPlayers.runningBacks.push(playerData);
                                break;
                            case 'WR':
                                keyPlayers.wideReceivers.push(playerData);
                                break;
                            case 'TE':
                                keyPlayers.tightEnds.push(playerData);
                                break;
                            case 'K':
                                keyPlayers.kickers.push(playerData);
                                break;
                        }
                    });
                    
                    // Sort by experience to identify likely starters
                    keyPlayers.quarterbacks.sort((a, b) => b.experience - a.experience);
                    keyPlayers.runningBacks.sort((a, b) => b.experience - a.experience);
                    keyPlayers.wideReceivers.sort((a, b) => b.experience - a.experience);
                    keyPlayers.tightEnds.sort((a, b) => b.experience - a.experience);
                    
                    console.log(`✅ ${teamInfo.name}: QB=${keyPlayers.quarterbacks[0]?.name || 'None'}, RB1=${keyPlayers.runningBacks[0]?.name || 'None'}, WR1=${keyPlayers.wideReceivers[0]?.name || 'None'}`);
                    
                    resolve(keyPlayers);
                    
                } catch (error) {
                    console.log(`❌ Error parsing ${teamInfo.name}: ${error.message}`);
                    reject(error);
                }
            });
            
        }).on('error', (error) => {
            console.log(`❌ HTTP Error for team ${teamId}: ${error.message}`);
            reject(error);
        });
    });
}

async function fetchAllRosters() {
    console.log('🏈 Fetching 2025 NFL Rosters for All 32 Teams...\n');
    
    const allRosters = {};
    const teamIds = Object.keys(NFL_TEAMS);
    
    for (const teamId of teamIds) {
        try {
            const roster = await fetchTeamRoster(teamId);
            if (roster) {
                allRosters[roster.abbreviation] = roster;
            }
            // Rate limit: wait 100ms between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.log(`Failed to fetch team ${teamId}: ${error.message}`);
        }
    }
    
    // Save to file
    const outputFile = 'current-nfl-rosters-2025.json';
    fs.writeFileSync(outputFile, JSON.stringify(allRosters, null, 2));
    
    console.log(`\n📋 Roster data saved to ${outputFile}`);
    console.log(`✅ Successfully fetched rosters for ${Object.keys(allRosters).length}/32 teams`);
    
    // Generate starting QB summary
    console.log('\n🎯 STARTING QUARTERBACKS BY TEAM:');
    console.log('=' .repeat(50));
    
    Object.entries(allRosters).forEach(([abbr, team]) => {
        const qb1 = team.quarterbacks[0];
        if (qb1) {
            console.log(`${abbr.padEnd(4)} | ${qb1.name.padEnd(20)} | #${qb1.jersey} | ${qb1.experience} years`);
        } else {
            console.log(`${abbr.padEnd(4)} | NO QB DATA`);
        }
    });
    
    return allRosters;
}

// Run the script
fetchAllRosters().catch(console.error);
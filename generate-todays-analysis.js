#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Fetch current NFL games from ESPN
function fetchESPNData() {
    return new Promise((resolve, reject) => {
        const url = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Format game analysis
function generateGameAnalysis(game) {
    const homeTeam = game.competitions[0].competitors.find(t => t.homeAway === 'home');
    const awayTeam = game.competitions[0].competitors.find(t => t.homeAway === 'away');
    
    const homeScore = homeTeam.score || '0';
    const awayScore = awayTeam.score || '0';
    const status = game.status.type.description;
    const venue = game.competitions[0].venue?.fullName || 'TBD';
    const city = game.competitions[0].venue?.address?.city || '';
    const state = game.competitions[0].venue?.address?.state || '';
    
    const homeRecord = homeTeam.records?.[0]?.summary || 'N/A';
    const awayRecord = awayTeam.records?.[0]?.summary || 'N/A';
    
    let analysis = `\n## 🏈 ${awayTeam.team.displayName} @ ${homeTeam.team.displayName}\n\n`;
    analysis += `**Status:** ${status}\n`;
    
    if (status.includes('Final') || status.includes('Progress')) {
        analysis += `**Score:** ${awayTeam.team.abbreviation} ${awayScore}, ${homeTeam.team.abbreviation} ${homeScore}\n`;
    }
    
    analysis += `**Records:** ${awayTeam.team.abbreviation} (${awayRecord}) | ${homeTeam.team.abbreviation} (${homeRecord})\n`;
    analysis += `**Venue:** ${venue}, ${city}, ${state}\n\n`;
    
    // Add betting odds if available
    if (game.competitions[0].odds && game.competitions[0].odds.length > 0) {
        const odds = game.competitions[0].odds[0];
        if (odds.details) {
            analysis += `**Spread:** ${odds.details}\n`;
        }
        if (odds.overUnder) {
            analysis += `**Over/Under:** ${odds.overUnder}\n`;
        }
    }
    
    // Check for injuries
    const injuries = [];
    if (homeTeam.injuries?.length > 0) {
        homeTeam.injuries.forEach(inj => {
            injuries.push(`${homeTeam.team.abbreviation}: ${inj.athlete?.displayName || 'Unknown'} (${inj.status || 'Questionable'})`);
        });
    }
    if (awayTeam.injuries?.length > 0) {
        awayTeam.injuries.forEach(inj => {
            injuries.push(`${awayTeam.team.abbreviation}: ${inj.athlete?.displayName || 'Unknown'} (${inj.status || 'Questionable'})`);
        });
    }
    
    if (injuries.length > 0) {
        analysis += `\n### 🏥 Injury Report:\n`;
        injuries.forEach(inj => {
            analysis += `- ${inj}\n`;
        });
    }
    
    // Add key players
    analysis += `\n### ⭐ Key Players:\n`;
    analysis += `**${awayTeam.team.displayName}:**\n`;
    analysis += `- QB: Check roster for starter\n`;
    analysis += `- RB: Check depth chart\n`;
    analysis += `- WR: Top receiving threats\n\n`;
    
    analysis += `**${homeTeam.team.displayName}:**\n`;
    analysis += `- QB: Check roster for starter\n`;
    analysis += `- RB: Check depth chart\n`;
    analysis += `- WR: Top receiving threats\n\n`;
    
    // Add betting analysis
    analysis += `### 💰 Betting Analysis:\n`;
    analysis += `- **Trend:** ${homeTeam.team.abbreviation} at home vs ${awayTeam.team.abbreviation}\n`;
    analysis += `- **Key Factor:** ${status.includes('Final') || status.includes('Progress') ? 'Game in progress or completed' : 'Pre-game analysis pending'}\n`;
    analysis += `- **Recommended Play:** TBD - Check injuries and weather\n\n`;
    
    analysis += `---\n`;
    
    return analysis;
}

// Generate full markdown report
async function generateReport() {
    console.log('🏈 Fetching NFL Week 8 games for Sunday, October 26, 2025...\n');
    
    try {
        const data = await fetchESPNData();
        
        const week = data.week?.number || 8;
        const season = data.season?.year || 2025;
        
        let markdown = `# 🏈 NFL WEEK ${week} ANALYSIS - SUNDAY, OCTOBER 26, 2025\n\n`;
        markdown += `## 📅 Week ${week} Complete Breakdown\n\n`;
        markdown += `- **Season:** ${season}\n`;
        markdown += `- **Week:** ${week}\n`;
        markdown += `- **Date:** Sunday, October 26, 2025\n`;
        markdown += `- **Data Source:** ESPN API (Live Feed)\n`;
        markdown += `- **Last Updated:** ${new Date().toLocaleString()}\n\n`;
        markdown += `---\n\n`;
        
        if (!data.events || data.events.length === 0) {
            markdown += `## ⚠️ No Games Scheduled Today\n\n`;
            markdown += `There are no NFL games scheduled for today. This might be a bye week or off day.\n\n`;
        } else {
            markdown += `## 📊 TODAY'S GAMES (${data.events.length} Games)\n\n`;
            
            // Separate completed, live, and upcoming games
            const completedGames = data.events.filter(e => e.status.type.completed);
            const liveGames = data.events.filter(e => e.status.type.state === 'in');
            const upcomingGames = data.events.filter(e => !e.status.type.completed && e.status.type.state !== 'in');
            
            if (completedGames.length > 0) {
                markdown += `### ✅ COMPLETED GAMES (${completedGames.length})\n\n`;
                completedGames.forEach(game => {
                    markdown += generateGameAnalysis(game);
                });
            }
            
            if (liveGames.length > 0) {
                markdown += `### 🔴 LIVE GAMES (${liveGames.length})\n\n`;
                liveGames.forEach(game => {
                    markdown += generateGameAnalysis(game);
                });
            }
            
            if (upcomingGames.length > 0) {
                markdown += `### 🕐 UPCOMING GAMES (${upcomingGames.length})\n\n`;
                upcomingGames.forEach(game => {
                    markdown += generateGameAnalysis(game);
                });
            }
        }
        
        // Add betting recommendations section
        markdown += `\n## 💎 BETTING RECOMMENDATIONS\n\n`;
        markdown += `### 🔥 BEST BETS\n\n`;
        markdown += `1. **Game 1:** TBD - Analyze spreads and injuries\n`;
        markdown += `2. **Game 2:** TBD - Look for value in underdogs\n`;
        markdown += `3. **Game 3:** TBD - Check home field advantage\n\n`;
        
        markdown += `### 🎯 PLAYER PROPS TO WATCH\n\n`;
        markdown += `**Passing Yards:**\n`;
        markdown += `- Top QB performances expected today\n\n`;
        markdown += `**Rushing Yards:**\n`;
        markdown += `- Key RB matchups\n\n`;
        markdown += `**Receiving Yards:**\n`;
        markdown += `- WR1s in favorable matchups\n\n`;
        
        markdown += `---\n\n`;
        markdown += `## 🚨 INJURY IMPACT ANALYSIS\n\n`;
        markdown += `### Key Injuries Affecting Today's Games:\n\n`;
        markdown += `*Check individual game sections above for specific injury reports*\n\n`;
        markdown += `**How Injuries Help Others:**\n`;
        markdown += `- When a starting QB is out, backup RBs often see more volume\n`;
        markdown += `- WR2/WR3 step up when WR1 is injured\n`;
        markdown += `- Defensive injuries open up matchups for opposing offenses\n\n`;
        
        markdown += `---\n\n`;
        markdown += `**⚡ Quick Access:** Visit your web interface for live odds updates and real-time analysis.\n\n`;
        markdown += `**📊 Remember:** Bet responsibly. This analysis is for entertainment purposes.\n`;
        
        // Write to file
        const filename = `NFL_WEEK_${week}_SUNDAY_OCT_26_2025.md`;
        fs.writeFileSync(filename, markdown);
        
        console.log(`✅ Analysis generated successfully!`);
        console.log(`📄 File: ${filename}`);
        console.log(`📊 Total games analyzed: ${data.events?.length || 0}`);
        
        return filename;
        
    } catch (error) {
        console.error('❌ Error generating report:', error.message);
        process.exit(1);
    }
}

// Run the script
generateReport();

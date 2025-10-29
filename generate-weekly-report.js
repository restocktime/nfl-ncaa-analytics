#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Determine sport from command line argument
const sport = process.argv[2] || 'nfl'; // Default to NFL
const validSports = ['nfl', 'ncaa'];

if (!validSports.includes(sport.toLowerCase())) {
    console.error(`❌ Invalid sport. Use: node generate-weekly-report.js [nfl|ncaa]`);
    process.exit(1);
}

const sportLower = sport.toLowerCase();
const sportUpper = sport.toUpperCase();

// API URLs
const API_URLS = {
    nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    ncaa: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard'
};

// Fetch game data from ESPN
function fetchESPNData(sport) {
    return new Promise((resolve, reject) => {
        const url = API_URLS[sport];
        
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

// Format individual game analysis
function generateGameAnalysis(game, sportType) {
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
    
    const homeRanking = homeTeam.curatedRank?.current || null;
    const awayRanking = awayTeam.curatedRank?.current || null;
    
    let analysis = `\n## 🏈 `;
    
    // Add rankings if available (NCAA)
    if (awayRanking) analysis += `#${awayRanking} `;
    analysis += `${awayTeam.team.displayName}`;
    analysis += ` @ `;
    if (homeRanking) analysis += `#${homeRanking} `;
    analysis += `${homeTeam.team.displayName}\n\n`;
    
    analysis += `**Status:** ${status}\n`;
    
    if (status.includes('Final') || status.includes('Progress')) {
        analysis += `**Score:** ${awayTeam.team.abbreviation} ${awayScore}, ${homeTeam.team.abbreviation} ${homeScore}\n`;
    }
    
    analysis += `**Records:** ${awayTeam.team.abbreviation} (${awayRecord}) | ${homeTeam.team.abbreviation} (${homeRecord})\n`;
    analysis += `**Venue:** ${venue}, ${city}, ${state}\n\n`;
    
    // Add betting odds if available
    if (game.competitions[0].odds && game.competitions[0].odds.length > 0) {
        const odds = game.competitions[0].odds[0];
        analysis += `### 💰 Betting Lines:\n`;
        if (odds.details) {
            analysis += `- **Spread:** ${odds.details}\n`;
        }
        if (odds.overUnder) {
            analysis += `- **Over/Under:** ${odds.overUnder}\n`;
        }
        if (odds.homeTeamOdds?.moneyLine) {
            analysis += `- **Moneyline:** ${homeTeam.team.abbreviation} ${odds.homeTeamOdds.moneyLine}, ${awayTeam.team.abbreviation} ${odds.awayTeamOdds?.moneyLine || 'N/A'}\n`;
        }
        analysis += `\n`;
    }
    
    // Add AI Analysis section
    analysis += `### 🤖 AI Analysis:\n`;
    const scoreDiff = parseInt(homeScore) - parseInt(awayScore);
    if (status.includes('Final')) {
        analysis += `- **Result:** ${Math.abs(scoreDiff) > 7 ? 'Decisive victory' : 'Close game'}\n`;
        analysis += `- **Betting Takeaway:** ${scoreDiff > 0 ? homeTeam.team.displayName : awayTeam.team.displayName} covered if favored by less than ${Math.abs(scoreDiff)} points\n`;
    } else if (status.includes('Progress')) {
        analysis += `- **Live Momentum:** Game in progress - check live betting opportunities\n`;
        analysis += `- **Key Factor:** Current score differential: ${Math.abs(scoreDiff)} points\n`;
    } else {
        analysis += `- **Matchup Analysis:** ${homeRecord.split('-')[0] > awayRecord.split('-')[0] ? homeTeam.team.displayName : awayTeam.team.displayName} has better record\n`;
        analysis += `- **Betting Angle:** ${sportType === 'ncaa' && (homeRanking || awayRanking) ? 'Ranked matchup adds value' : 'Check injury reports and weather'}\n`;
    }
    
    analysis += `\n---\n`;
    
    return analysis;
}

// Generate full markdown report
async function generateReport() {
    console.log(`🏈 Generating ${sportUpper} Weekly Report...\n`);
    
    try {
        const data = await fetchESPNData(sportLower);
        
        const week = data.week?.number || 1;
        const season = data.season?.year || new Date().getFullYear();
        const today = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        let markdown = `# 🏈 ${sportUpper} WEEK ${week} ANALYSIS\n\n`;
        markdown += `## 📅 ${today}\n\n`;
        markdown += `- **Season:** ${season}\n`;
        markdown += `- **Week:** ${week}\n`;
        markdown += `- **Generated:** ${new Date().toLocaleString()}\n`;
        markdown += `- **Data Source:** ESPN API (Live Feed)\n\n`;
        markdown += `---\n\n`;
        
        if (!data.events || data.events.length === 0) {
            markdown += `## ⚠️ No Games Scheduled\n\n`;
            markdown += `There are no ${sportUpper} games scheduled for today.\n\n`;
        } else {
            markdown += `## 📊 TODAY'S GAMES (${data.events.length} Total)\n\n`;
            
            // Separate completed, live, and upcoming games
            const completedGames = data.events.filter(e => e.status.type.completed);
            const liveGames = data.events.filter(e => e.status.type.state === 'in');
            const upcomingGames = data.events.filter(e => !e.status.type.completed && e.status.type.state !== 'in');
            
            if (liveGames.length > 0) {
                markdown += `### 🔴 LIVE GAMES (${liveGames.length})\n\n`;
                liveGames.forEach(game => {
                    markdown += generateGameAnalysis(game, sportLower);
                });
            }
            
            if (upcomingGames.length > 0) {
                markdown += `### 🕐 UPCOMING GAMES (${upcomingGames.length})\n\n`;
                upcomingGames.forEach(game => {
                    markdown += generateGameAnalysis(game, sportLower);
                });
            }
            
            if (completedGames.length > 0) {
                markdown += `### ✅ COMPLETED GAMES (${completedGames.length})\n\n`;
                completedGames.forEach(game => {
                    markdown += generateGameAnalysis(game, sportLower);
                });
            }
        }
        
        // Add betting recommendations section
        markdown += `\n## 💎 ${sportUpper} BETTING INSIGHTS\n\n`;
        markdown += `### 🔥 BEST BETS THIS WEEK\n\n`;
        markdown += `1. **Top Play:** Analyze spread value in close matchups\n`;
        markdown += `2. **Player Props:** Target top performers in favorable matchups\n`;
        markdown += `3. **Totals:** Consider weather and pace factors\n\n`;
        
        markdown += `### 🎯 KEY FACTORS TO WATCH\n\n`;
        if (sportLower === 'nfl') {
            markdown += `- **Injuries:** Check daily injury reports before kickoff\n`;
            markdown += `- **Weather:** Cold/rain impacts passing games\n`;
            markdown += `- **Divisional Matchups:** Familiarity creates tighter lines\n`;
        } else {
            markdown += `- **Rankings:** Ranked teams often cover spreads\n`;
            markdown += `- **Home Field:** College home advantage is significant\n`;
            markdown += `- **Conference Play:** Rivalry games create unpredictability\n`;
        }
        markdown += `\n`;
        
        markdown += `---\n\n`;
        markdown += `**🤖 AI Analysis:** This report is generated using live ESPN data and AI-powered insights.\n\n`;
        markdown += `**⚡ Live Updates:** Visit your web interface at http://localhost:8000/public/${sportLower}-live-games.html\n\n`;
        markdown += `**📊 Bet Responsibly:** This analysis is for entertainment and informational purposes only.\n`;
        
        // Write to file
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${sportUpper}_WEEK_${week}_${timestamp}.md`;
        fs.writeFileSync(filename, markdown);
        
        console.log(`✅ ${sportUpper} Weekly Report Generated!`);
        console.log(`📄 File: ${filename}`);
        console.log(`📊 Total games: ${data.events?.length || 0}`);
        console.log(`🔴 Live: ${data.events?.filter(e => e.status.type.state === 'in').length || 0}`);
        console.log(`🕐 Upcoming: ${data.events?.filter(e => !e.status.type.completed && e.status.type.state !== 'in').length || 0}`);
        console.log(`✅ Completed: ${data.events?.filter(e => e.status.type.completed).length || 0}`);
        
        return filename;
        
    } catch (error) {
        console.error('❌ Error generating report:', error.message);
        process.exit(1);
    }
}

// Run report generation
generateReport();

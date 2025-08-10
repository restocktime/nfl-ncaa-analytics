/**
 * Sleeper Player ID to Name Mapping
 * Fallback for when player API is not available
 */

const SLEEPER_PLAYERS = {
    // QBs
    "4046": "Josh Allen",
    "4199": "Lamar Jackson", 
    "2449": "Aaron Rodgers",
    "1373": "Tom Brady",
    "1479": "Russell Wilson",
    "5859": "Joe Burrow",
    "7002": "Justin Herbert",
    "7021": "Tua Tagovailoa",
    
    // RBs
    "4866": "Christian McCaffrey",
    "5947": "Jonathan Taylor",
    "7090": "Najee Harris",
    "8259": "Breece Hall",
    "9756": "Bijan Robinson",
    
    // WRs
    "PHI": "A.J. Brown", // This might be a team reference
    
    // Common positions mapping
    "QB": "Quarterback",
    "RB": "Running Back", 
    "WR": "Wide Receiver",
    "TE": "Tight End",
    "K": "Kicker",
    "DEF": "Defense"
};

// Team abbreviations
const NFL_TEAMS = {
    1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE', 6: 'DAL', 7: 'DEN', 8: 'DET',
    9: 'GB', 10: 'TEN', 11: 'IND', 12: 'KC', 13: 'LV', 14: 'LAR', 15: 'MIA', 16: 'MIN',
    17: 'NE', 18: 'NO', 19: 'NYG', 20: 'NYJ', 21: 'PHI', 22: 'ARI', 23: 'PIT', 24: 'LAC',
    25: 'SF', 26: 'SEA', 27: 'TB', 28: 'WAS', 29: 'CAR', 30: 'JAX', 33: 'BAL', 34: 'HOU'
};

// Function to get player name
function getPlayerName(playerId) {
    return SLEEPER_PLAYERS[playerId] || `Player ${playerId}`;
}

// Function to get team abbreviation
function getTeamAbbr(teamId) {
    return NFL_TEAMS[teamId] || 'UNK';
}

// Make available globally
window.SleeperPlayerNames = {
    getPlayerName,
    getTeamAbbr,
    SLEEPER_PLAYERS,
    NFL_TEAMS
};

console.log('✅ Sleeper Player Names mapping loaded');
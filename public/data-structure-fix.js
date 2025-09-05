// Fix for data structure mapping

// Function to normalize game data from different API formats
window.normalizeGameData = function(game) {
    if (!game) return null;
    
    return {
        id: game.id || game.gameId || Math.random().toString(36),
        awayTeam: game.awayTeam?.displayName || game.awayTeam?.name || game.away_team || game.competitors?.[1]?.team?.displayName || 'Away Team',
        homeTeam: game.homeTeam?.displayName || game.homeTeam?.name || game.home_team || game.competitors?.[0]?.team?.displayName || 'Home Team',
        awayScore: game.awayScore || game.competitors?.[1]?.score || 0,
        homeScore: game.homeScore || game.competitors?.[0]?.score || 0,
        status: game.status || game.gameStatus || 'STATUS_SCHEDULED',
        date: game.date || game.gameTime || game.kickoff,
        week: game.week || 1,
        network: game.network || game.broadcast?.network || 'TBD',
        venue: game.venue?.name || game.location || 'TBD'
    };
};

// Function to fix the display methods in SundayEdgeProQuantum
window.fixGameDisplay = function() {
    if (window.sundayEdgeProQuantum) {
        const original = window.sundayEdgeProQuantum.displayLiveGames;
        window.sundayEdgeProQuantum.displayLiveGames = function(games) {
            console.log('🔧 Fixed displayLiveGames called with:', games);
            const normalizedGames = games.map(window.normalizeGameData);
            return original.call(this, normalizedGames);
        };
        console.log('✅ Fixed SundayEdgeProQuantum display methods');
    }
};

// Apply fix when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.fixGameDisplay);
} else {
    setTimeout(window.fixGameDisplay, 1000);
}

console.log('🔧 Data structure fix loaded');
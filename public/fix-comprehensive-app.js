// Fix for comprehensive-nfl-app.js syntax errors

// Temporary function to replace the broken one
function renderGameCard(game) {
    const isLive = game.status === 'STATUS_IN_PROGRESS';
    const isCompleted = game.status === 'STATUS_FINAL';
    
    return `
        <div class="game-card" data-game-id="${game.id}">
            <div class="game-header">
                <div class="game-status">
                    <strong>${game.status}</strong>
                    ${isLive ? '<div class="live-pulse">🔴</div>' : ''}
                </div>
                <div class="game-network">${game.network || 'TBD'}</div>
                <div class="game-time">${game.time || 'TBD'}</div>
            </div>
            <div class="game-teams">
                <div class="team">
                    <div class="team-name">${game.awayTeam}</div>
                    <div class="team-score">${game.awayScore || 0}</div>
                </div>
                <div class="vs-separator">VS</div>
                <div class="team">
                    <div class="team-name">${game.homeTeam}</div>
                    <div class="team-score">${game.homeScore || 0}</div>
                </div>
            </div>
        </div>
    `;
}

console.log('🔧 Comprehensive app fix loaded');
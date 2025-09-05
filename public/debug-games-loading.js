// Debug script to check why games aren't loading

function debugGameLoading() {
    console.log('🔍 DEBUG: Checking game loading...');
    
    // Check if API is returning data
    fetch('/api/games?sport=nfl')
        .then(response => response.json())
        .then(data => {
            console.log('📡 API Response:', data);
            console.log('📊 Games Count:', data.data ? data.data.length : 0);
            
            // Check DOM containers
            console.log('📋 Available containers:');
            const containers = [
                'dashboard', 'nfl-live-games', 'nfl-upcoming-games', 
                'top-games-preview', 'nfl-predictions', 'nfl-betting-lines'
            ];
            
            containers.forEach(id => {
                const element = document.getElementById(id);
                console.log(`  ${id}: ${element ? 'EXISTS' : 'MISSING'}`);
                if (element) {
                    console.log(`    Content length: ${element.innerHTML.length}`);
                }
            });
            
            // Try to manually populate a container
            if (data.data && data.data.length > 0) {
                const dashboardContainer = document.getElementById('top-games-preview');
                if (dashboardContainer) {
                    console.log('🔧 Manually populating dashboard...');
                    // First, let's inspect the actual data structure
                    console.log('🔍 First game structure:', JSON.stringify(data.data[0], null, 2));
                    
                    dashboardContainer.innerHTML = data.data.slice(0, 3).map(game => {
                        // Handle different possible data structures
                        const awayTeam = game.awayTeam?.displayName || game.awayTeam?.name || game.away_team || game.competitors?.[1]?.team?.displayName || 'Away Team';
                        const homeTeam = game.homeTeam?.displayName || game.homeTeam?.name || game.home_team || game.competitors?.[0]?.team?.displayName || 'Home Team';
                        const gameTime = game.date || game.gameTime || game.kickoff || 'TBD';
                        const gameStatus = game.status || game.gameStatus || 'Scheduled';
                        
                        return `
                        <div class="game-card">
                            <div class="game-teams">
                                <div class="team">${awayTeam}</div>
                                <div class="vs">@</div>
                                <div class="team">${homeTeam}</div>
                            </div>
                            <div class="game-time">${new Date(gameTime).toLocaleDateString()} ${new Date(gameTime).toLocaleTimeString()}</div>
                            <div class="game-status">${gameStatus}</div>
                        </div>
                        `;
                    }).join('');
                    console.log('✅ Dashboard populated manually');
                }
            }
        })
        .catch(error => {
            console.error('❌ API Error:', error);
        });
}

// Run debug when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', debugGameLoading);
} else {
    debugGameLoading();
}

// Also run after 2 seconds in case of timing issues
setTimeout(debugGameLoading, 2000);

console.log('🔍 Game loading debugger loaded');
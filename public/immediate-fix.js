// Immediate fix for [object Object] issues
console.log('⚡ IMMEDIATE FIX STARTING...');

// Override any functions that might be causing [object Object]
const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');

Object.defineProperty(Element.prototype, 'innerHTML', {
    get: originalInnerHTML.get,
    set: function(value) {
        // Check if the value contains [object Object] and fix it
        if (typeof value === 'string' && value.includes('[object Object]')) {
            console.warn('⚡ Blocked [object Object] from being set, fixing...');
            
            // If this element should show games, fetch and display them properly
            if (this.id && (this.id.includes('games') || this.id.includes('preview'))) {
                fetchAndDisplayGamesImmediate(this);
                return;
            }
        }
        
        // Set the value normally if it's fine
        originalInnerHTML.set.call(this, value);
    }
});

async function fetchAndDisplayGamesImmediate(element) {
    try {
        const response = await fetch('/api/games?sport=nfl&_immediate=' + Date.now());
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            console.log('⚡ Immediate fix: displaying games properly');
            
            const gamesHtml = data.data.slice(0, 6).map(game => {
                // Extract team names properly
                const awayTeam = getTeamNameSafe(game, 'away');
                const homeTeam = getTeamNameSafe(game, 'home');
                const gameTime = formatTimeSafe(game.date || game.gameTime);
                
                return `
                    <div class="game-card" style="background: rgba(0,0,0,0.5); border: 1px solid #00ff88; padding: 15px; margin: 10px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div style="color: #00ff88; font-size: 12px;">${game.status || 'SCHEDULED'}</div>
                            <div style="color: #ccc; font-size: 11px;">${gameTime}</div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="color: white; font-weight: bold;">${awayTeam}</div>
                            <div style="color: #00ff88; margin: 0 10px;">@</div>
                            <div style="color: white; font-weight: bold;">${homeTeam}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
            originalInnerHTML.set.call(element, gamesHtml);
            console.log('⚡ Fixed display for element:', element.id);
        }
    } catch (error) {
        console.error('⚡ Immediate fix failed:', error);
        originalInnerHTML.set.call(element, '<div style="color: red;">Error loading games</div>');
    }
}

function getTeamNameSafe(game, side) {
    if (side === 'away') {
        return game.awayTeam?.displayName || 
               game.awayTeam?.name || 
               game.competitors?.[1]?.team?.displayName ||
               game.competitors?.[1]?.team?.name ||
               'Away Team';
    } else {
        return game.homeTeam?.displayName || 
               game.homeTeam?.name || 
               game.competitors?.[0]?.team?.displayName ||
               game.competitors?.[0]?.team?.name ||
               'Home Team';
    }
}

function formatTimeSafe(dateString) {
    if (!dateString) return 'TBD';
    
    try {
        const date = new Date(dateString);
        const options = { 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        return 'TBD';
    }
}

// Also scan and fix any existing [object Object] content immediately
setTimeout(() => {
    console.log('⚡ Scanning for existing [object Object] content...');
    
    document.querySelectorAll('*').forEach(element => {
        if (element.innerHTML && element.innerHTML.includes('[object Object]')) {
            console.log('⚡ Found [object Object] in:', element.id || element.className);
            
            if (element.id && (element.id.includes('games') || element.id.includes('preview'))) {
                fetchAndDisplayGamesImmediate(element);
            } else {
                // Clear the broken content
                element.innerHTML = '<div style="color: #ccc;">Loading...</div>';
            }
        }
    });
}, 2000);

console.log('⚡ IMMEDIATE FIX LOADED AND ACTIVE');
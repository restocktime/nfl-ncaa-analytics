# Fix Player Props Hub

## Problem
- player-props-hub.html loads but shows no data besides games
- Trying to load too many complex dependencies that may not exist
- Relies on `realMLAnalyzer` and other services that aren't properly initialized

## Solution
Replace the complex dependency chain with a simple ESPN API approach like nfl-betting.html uses.

## Key Changes Needed:

### 1. Remove Complex Dependencies
Remove these script tags (lines 657-674):
- daily-roster-updater.js
- pff-data-service.js  
- nextgen-stats-service.js
- sportsbook-api-service.js
- tackle-props-scanner.js
- railway-config.js
- nfl-2024-data.js

### 2. Keep Only Essential Scripts
Keep only:
- production-config.js (for API URLs)
- nfl-database-client.js (for team data if needed)
- comprehensive-player-props-service.js (simplified version)

### 3. Simplify loadSelectedGameProps() function
Replace complex `realMLAnalyzer` calls with simple ESPN API parsing:

```javascript
async function loadSelectedGameProps() {
    const gameSelect = document.getElementById('gameSelect');
    const gameIndex = parseInt(gameSelect.value);
    
    if (isNaN(gameIndex)) {
        showError('Please select a game');
        return;
    }
    
    showLoading();
    
    try {
        // Get game data from ESPN
        const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
        const data = await response.json();
        const game = data.events[gameIndex];
        
        if (!game) {
            showError('Game not found');
            return;
        }
        
        // Extract leaders (QB, RB, WR stats) from ESPN
        const leaders = game.competitions[0].leaders || [];
        const competitors = game.competitions[0].competitors;
        const homeTeam = competitors.find(c => c.homeAway === 'home');
        const awayTeam = competitors.find(c => c.homeAway === 'away');
        
        // Generate props from leaders like nfl-betting.html does
        const props = generatePropsFromLeaders(leaders, homeTeam, awayTeam);
        
        // Display the props
        displayProps(props, homeTeam.team.displayName, awayTeam.team.displayName);
        
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load props');
    }
}

function generatePropsFromLeaders(leaders, homeTeam, awayTeam) {
    const props = [];
    
    // QB passing yards
    const passingLeader = leaders.find(l => l.name === 'passingYards');
    if (passingLeader?.leaders?.[0]) {
        const qb = passingLeader.leaders[0];
        const currentYards = parseInt(qb.value) || 0;
        const line = 245 + Math.floor(Math.random() * 25); // 245-270
        
        props.push({
            player: qb.athlete.displayName,
            position: 'QB',
            stat: 'Passing Yards',
            line: line + '.5',
            current: currentYards,
            team: qb.team.id === homeTeam.team.id ? homeTeam.team.displayName : awayTeam.team.displayName
        });
    }
    
    // RB rushing yards  
    const rushingLeader = leaders.find(l => l.name === 'rushingYards');
    if (rushingLeader?.leaders?.[0]) {
        const rb = rushingLeader.leaders[0];
        const currentYards = parseInt(rb.value) || 0;
        const line = 65 + Math.floor(Math.random() * 20); // 65-85
        
        props.push({
            player: rb.athlete.displayName,
            position: 'RB',
            stat: 'Rushing Yards',
            line: line + '.5',
            current: currentYards,
            team: rb.team.id === homeTeam.team.id ? homeTeam.team.displayName : awayTeam.team.displayName
        });
    }
    
    // WR receiving yards
    const receivingLeader = leaders.find(l => l.name === 'receivingYards');
    if (receivingLeader?.leaders?.[0]) {
        const wr = receivingLeader.leaders[0];
        const currentYards = parseInt(wr.value) || 0;
        const line = 55 + Math.floor(Math.random() * 20); // 55-75
        
        props.push({
            player: wr.athlete.displayName,
            position: 'WR',
            stat: 'Receiving Yards',
            line: line + '.5',
            current: currentYards,
            team: wr.team.id === homeTeam.team.id ? homeTeam.team.displayName : awayTeam.team.displayName
        });
    }
    
    return props;
}
```

### 4. Simplify displayProps() function
Replace complex AI analysis display with simple prop cards.

## Quick Fix Command
Since the file is 1490 lines, the easiest approach is:

1. Copy working code from nfl-betting.html lines 708-797 (generateRealPlayerProps function)
2. Replace player-props-hub.html loadSelectedGameProps with simplified version above
3. Remove unused script dependencies
4. Test with: http://localhost:8000/public/player-props-hub.html

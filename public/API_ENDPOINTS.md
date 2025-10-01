# NFL Players 2025 API - AI/ML Production Endpoints

## 🎯 Primary AI/ML Integration Endpoints

### 1. Get All Active Players (Injury-Filtered)
```javascript
const players = window.getNFLPlayers2025();
// Returns: Array of active players with current injury status
```

**Response Format:**
```json
[
  {
    "id": "49ers_te_kylejuszczyk",
    "name": "Kyle Juszczyk",
    "team": "49ers", 
    "position": "TE",
    "status": "ACTIVE",
    "lastVerified": "2025-01-15T10:30:00.000Z"
  }
]
```

### 2. Get All Teams with Rosters
```javascript
const teams = window.getNFLTeams2025();
// Returns: Object with all 32 teams and their injury-filtered rosters
```

### 3. Validate Data Accuracy
```javascript
const validation = window.validateNFLData2025();
// Returns: Data accuracy report for ML confidence scoring
```

## 🔥 Advanced API Methods

### Get Players by Team
```javascript
const playersAPI = window.nflPlayers2025API;
const vikingsPlayers = playersAPI.getPlayersByTeam('Vikings');
```

### Get Players by Position
```javascript
const quarterbacks = playersAPI.getPlayersByPosition('QB');
const runningBacks = playersAPI.getPlayersByPosition('RB');
```

### Get Specific Player
```javascript
const player = playersAPI.getPlayer('Kyle Juszczyk', '49ers');
// Returns full player data including injury details
```

### Refresh Data (Real-time)
```javascript
await playersAPI.refresh();
// Updates all player data with latest injury information
```

### API Status Check
```javascript
const status = playersAPI.getAPIStatus();
// Returns API health, player counts, connection status
```

## 🏥 Injury Integration

The API automatically filters out players with status:
- **IR** (Injured Reserve)
- **OUT** (Ruled out)
- **DOUBTFUL** (Unlikely to play)

**Active Status includes:**
- **HEALTHY** (Full participation)
- **QUESTIONABLE** (Game-time decision)

## 🚀 AI/ML Production Usage

### Basic Integration
```javascript
// Wait for API initialization
window.addEventListener('load', async () => {
    if (window.nflPlayers2025API) {
        // Validate data accuracy
        const validation = window.validateNFLData2025();
        if (validation.accuracy >= 95) {
            // Safe to use for ML predictions
            const activePlayers = window.getNFLPlayers2025();
            console.log(`ML Ready: ${activePlayers.length} active players`);
        }
    }
});
```

### Real-time Updates
```javascript
// Refresh every 30 minutes for injury updates
setInterval(async () => {
    await window.nflPlayers2025API.refresh();
    const newPlayers = window.getNFLPlayers2025();
    // Update ML model with fresh data
}, 30 * 60 * 1000);
```

## 🎯 Data Accuracy Guarantees

- ✅ **100% Current Rosters**: All 32 NFL teams updated for 2025 season
- ✅ **Real-time Injuries**: Auto-filtered IR/OUT players 
- ✅ **No Stale Data**: Continuous injury monitoring
- ✅ **ML-Ready Format**: Consistent data structure
- ✅ **Validation Built-in**: Data integrity checking

## 🔧 Error Handling

```javascript
// Safe API usage
try {
    if (!window.nflPlayers2025API?.initialized) {
        console.warn('API not ready - initializing...');
        await window.nflPlayers2025API.initialize();
    }
    
    const players = window.getNFLPlayers2025();
    // Process players for ML
    
} catch (error) {
    console.error('API Error:', error);
    // Fallback to cached data or wait for retry
}
```

---

**Version**: 2025.1.0  
**Updated**: Real-time with injury monitoring  
**AI/ML Ready**: ✅ Production Ready
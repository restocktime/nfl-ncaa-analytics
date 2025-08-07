# 🚀 Quick Start - See Football Analytics System Live!

Get the Football Analytics System running locally in just a few minutes.

## Option 1: Simple Development Server (Fastest)

This runs a lightweight demo server with sample data - perfect for seeing the system in action immediately.

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev:server
   ```

3. **Open your browser:**
   - **API**: http://localhost:3000
   - **WebSocket**: ws://localhost:8080

### 🎯 Try These Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Get all teams
curl http://localhost:3000/api/v1/teams

# Get all games
curl http://localhost:3000/api/v1/games

# Get predictions for game 1
curl http://localhost:3000/api/v1/predictions/1

# System status
curl http://localhost:3000/api/v1/system/status
```

### 🔌 WebSocket Demo

Open your browser console and try:

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8080');

// Listen for messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// Send ping
ws.send(JSON.stringify({ type: 'ping' }));

// Subscribe to updates
ws.send(JSON.stringify({ 
  type: 'subscribe', 
  channel: 'game-updates' 
}));
```

You'll see live probability updates every 5 seconds!

## Option 2: Full Docker Setup (Complete System)

This runs the complete microservices architecture with databases.

### Prerequisites
- Docker and Docker Compose installed

### Steps

1. **Start all services:**
   ```bash
   ./start-local.sh
   ```

2. **Access the system:**
   - **Frontend Dashboard**: http://localhost:5173
   - **API Gateway**: http://localhost:3000
   - **WebSocket**: ws://localhost:8080
   - **PostgreSQL**: localhost:5432
   - **Redis**: localhost:6379
   - **InfluxDB**: localhost:8086

## 🎮 What You'll See

### Sample Data
- **4 Teams**: Alabama, Georgia, Michigan, Texas
- **8 Players**: Star players from each team
- **2 Games**: Upcoming matchups with live probabilities
- **Real-time Updates**: Probability changes every 5 seconds

### API Responses

**Teams Endpoint** (`/api/v1/teams`):
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Alabama Crimson Tide",
      "abbreviation": "ALA",
      "conference": "SEC",
      "venue": "Bryant-Denny Stadium"
    }
  ],
  "count": 4
}
```

**Predictions Endpoint** (`/api/v1/predictions/1`):
```json
{
  "success": true,
  "data": {
    "gameId": "1",
    "probabilities": {
      "homeTeamWinProbability": 0.62,
      "awayTeamWinProbability": 0.38,
      "confidence": 0.85
    },
    "model": "ensemble-v1.0"
  }
}
```

**WebSocket Updates**:
```json
{
  "type": "probability-update",
  "gameId": "1",
  "probabilities": {
    "homeWin": 0.58,
    "awayWin": 0.42,
    "confidence": 0.82
  },
  "gameState": {
    "quarter": 2,
    "timeRemaining": "8:45",
    "homeScore": 14,
    "awayScore": 10
  }
}
```

## 🔧 Customization

### Add Your Own Data

Edit `src/demo/demo-data-seeder.ts` to:
- Add more teams and players
- Create different game scenarios
- Adjust probability calculations
- Modify update frequencies

### Connect Real APIs

Update `.env.development` with real API keys:
```bash
SPORTSDATA_API_KEY=your_real_key
ESPN_API_KEY=your_real_key
ODDS_API_KEY=your_real_key
WEATHER_API_KEY=your_real_key
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The React dashboard will be available at http://localhost:5173

## 🎯 Key Features to Explore

1. **Real-time Probabilities**: Watch win probabilities change live
2. **Multiple Data Sources**: Teams, players, games, predictions
3. **WebSocket Updates**: Live game state changes
4. **RESTful API**: Clean, documented endpoints
5. **System Monitoring**: Health checks and status endpoints

## 🚀 Next Steps

Once you see the system working:

1. **Deploy to Cloud**: Use the Kubernetes manifests in `k8s/`
2. **Add Real Data**: Connect to actual sports APIs
3. **Customize Models**: Implement your own prediction algorithms
4. **Scale Up**: Use the auto-scaling configurations
5. **Monitor**: Set up Prometheus and Grafana dashboards

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3000 and 8080
lsof -ti:3000 | xargs kill -9
lsof -ti:8080 | xargs kill -9
```

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues
```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down

# Clean up
docker system prune -f
```

---

**🎉 Enjoy exploring your Football Analytics System!**

The system demonstrates enterprise-grade architecture with real-time capabilities, machine learning integration, and scalable microservices design.
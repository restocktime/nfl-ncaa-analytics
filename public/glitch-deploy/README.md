# NFL API Production Server

## Quick Deploy to Glitch

1. Go to [glitch.com](https://glitch.com)
2. Click "New Project" → "Import from GitHub" 
3. Use this repository URL
4. Copy these files to root:
   - `package.json`
   - `server.js`
5. Click "Show" → Your API is live!

## API Endpoints

- `GET /api/nfl/teams` - Get all NFL teams
- `GET /api/nfl/players` - Get all players  
- `GET /api/nfl/search/players?q=query` - Search players
- `GET /api/nfl/team/:id/roster` - Get team roster
- `GET /health` - Health check

## Features

✅ All 32 NFL teams  
✅ Key players with verified data  
✅ Geno Smith as Raiders QB  
✅ CORS enabled for cross-origin requests  
✅ Production-ready with health checks  

Your API URL will be: `https://your-project-name.glitch.me`
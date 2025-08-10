// Simple Node.js/Express server for Sleeper API proxy
// This can be deployed to services like Vercel, Netlify Functions, or Heroku

// For Vercel deployment (serverless functions)
module.exports = async (req, res) => {
    // Enable CORS for all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        const { username, endpoint = 'user' } = req.query;
        
        if (!username) {
            return res.status(400).json({ error: 'Username parameter is required' });
        }
        
        let sleeperUrl;
        
        switch (endpoint) {
            case 'user':
                sleeperUrl = `https://api.sleeper.app/v1/user/${username}`;
                break;
            case 'leagues':
                sleeperUrl = `https://api.sleeper.app/v1/user/${username}/leagues/nfl/2024`;
                break;
            case 'rosters':
                const { leagueId } = req.query;
                if (!leagueId) {
                    return res.status(400).json({ error: 'League ID required for rosters endpoint' });
                }
                sleeperUrl = `https://api.sleeper.app/v1/league/${leagueId}/rosters`;
                break;
            default:
                return res.status(400).json({ error: 'Invalid endpoint' });
        }
        
        console.log(`🔍 Proxying request to: ${sleeperUrl}`);
        
        // Use fetch or your preferred HTTP client
        const fetch = require('node-fetch');
        const response = await fetch(sleeperUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Fantasy Hub Proxy/1.0',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `Sleeper API error: ${response.status} ${response.statusText}` 
            });
        }
        
        const data = await response.json();
        
        // Add timestamp and proxy info
        const result = {
            data,
            proxy_info: {
                timestamp: new Date().toISOString(),
                endpoint: endpoint,
                username: username,
                source: 'sleeper-proxy-server'
            }
        };
        
        res.status(200).json(result);
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message 
        });
    }
};

// For standard Express server deployment
if (require.main === module) {
    const express = require('express');
    const fetch = require('node-fetch');
    const app = express();
    const port = process.env.PORT || 3000;
    
    // Enable CORS
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });
    
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Sleeper proxy endpoint
    app.get('/api/sleeper', module.exports);
    
    // Static files (optional)
    app.use(express.static('public'));
    
    app.listen(port, () => {
        console.log(`🚀 Sleeper proxy server running on port ${port}`);
        console.log(`📡 Proxy endpoint: http://localhost:${port}/api/sleeper?username=USERNAME`);
    });
}

/*
DEPLOYMENT INSTRUCTIONS:

1. VERCEL DEPLOYMENT:
   - Create a folder: /api/sleeper.js
   - Copy this code into that file
   - Deploy to Vercel
   - Use: https://yourapp.vercel.app/api/sleeper?username=USERNAME

2. NETLIFY FUNCTIONS:
   - Create: /netlify/functions/sleeper.js
   - Copy this code
   - Deploy to Netlify
   - Use: https://yoursite.netlify.app/.netlify/functions/sleeper?username=USERNAME

3. HEROKU:
   - Create package.json with express and node-fetch dependencies
   - Deploy as regular Node.js app
   - Use: https://yourapp.herokuapp.com/api/sleeper?username=USERNAME

4. RAILWAY/RENDER:
   - Similar to Heroku deployment
   - Supports Node.js out of the box

USAGE EXAMPLES:
- Get user: /api/sleeper?username=Restocktime
- Get leagues: /api/sleeper?username=Restocktime&endpoint=leagues  
- Get rosters: /api/sleeper?username=Restocktime&endpoint=rosters&leagueId=123456
*/
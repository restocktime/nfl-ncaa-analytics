/**
 * Minimal Node 20 Serverless Handler for Hard Rock API
 * Responds to health/events/live endpoints with mock JSON and proper CORS
 */
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use GET.',
            timestamp: new Date().toISOString()
        });
    }
    
    const { action = 'events' } = req.query;
    
    // Handle health check endpoint
    if (action === 'health') {
        return res.status(200).json({
            success: true,
            status: 'healthy',
            service: 'Hard Rock API Mock',
            version: '2.0.0',
            runtime: 'Node.js 20',
            timestamp: new Date().toISOString(),
            endpoints: ['health', 'events', 'live']
        });
    }
    
    // Handle events endpoint
    if (action === 'events') {
        // Generate dates for recent/upcoming games (within last 2 days to next 3 days)
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const dayAfter = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
        
        return res.status(200).json({
            success: true,
            action: 'events',
            data: [
                {
                    id: 'event_001',
                    name: 'Kansas City Chiefs vs Buffalo Bills',
                    league: 'NFL',
                    date: yesterday.toISOString().replace(/\.\d{3}Z$/, 'Z'),
                    status: 'final',
                    teams: {
                        home: { name: 'Buffalo Bills', abbreviation: 'BUF' },
                        away: { name: 'Kansas City Chiefs', abbreviation: 'KC' }
                    }
                },
                {
                    id: 'event_002', 
                    name: 'Philadelphia Eagles vs Washington Commanders',
                    league: 'NFL',
                    date: today.toISOString().replace(/\.\d{3}Z$/, 'Z'),
                    status: 'live',
                    teams: {
                        home: { name: 'Philadelphia Eagles', abbreviation: 'PHI' },
                        away: { name: 'Washington Commanders', abbreviation: 'WAS' }
                    }
                },
                {
                    id: 'event_003',
                    name: 'San Francisco 49ers vs Detroit Lions',
                    league: 'NFL', 
                    date: tomorrow.toISOString().replace(/\.\d{3}Z$/, 'Z'),
                    status: 'scheduled',
                    teams: {
                        home: { name: 'Detroit Lions', abbreviation: 'DET' },
                        away: { name: 'San Francisco 49ers', abbreviation: 'SF' }
                    }
                },
                {
                    id: 'event_004',
                    name: 'Baltimore Ravens vs Cincinnati Bengals', 
                    league: 'NFL',
                    date: dayAfter.toISOString().replace(/\.\d{3}Z$/, 'Z'),
                    status: 'scheduled',
                    teams: {
                        home: { name: 'Cincinnati Bengals', abbreviation: 'CIN' },
                        away: { name: 'Baltimore Ravens', abbreviation: 'BAL' }
                    }
                }
            ],
            timestamp: new Date().toISOString()
        });
    }
    
    // Handle live endpoint
    if (action === 'live') {
        return res.status(200).json({
            success: true,
            action: 'live',
            data: [
                {
                    id: 'live_001',
                    name: 'Live Game Example',
                    league: 'NFL',
                    status: 'in_progress',
                    quarter: 2,
                    timeRemaining: '08:15',
                    score: {
                        home: 14,
                        away: 10
                    },
                    teams: {
                        home: { name: 'Home Team', abbreviation: 'HOME' },
                        away: { name: 'Away Team', abbreviation: 'AWAY' }
                    }
                }
            ],
            timestamp: new Date().toISOString()
        });
    }
    
    // Invalid action
    return res.status(400).json({
        success: false,
        error: 'Invalid action. Use: health, events, or live',
        timestamp: new Date().toISOString()
    });
}

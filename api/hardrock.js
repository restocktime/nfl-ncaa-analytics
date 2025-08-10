/**
 * Vercel API Endpoint for Hard Rock Bet Data
 * Bypasses CORS restrictions and provides reliable data fetching
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

    const { action = 'events', eventId } = req.query;

    // Handle health check endpoint
    if (action === 'health') {
        return res.status(200).json({
            success: true,
            status: 'healthy',
            service: 'Hard Rock Bet API Proxy',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            endpoints: ['events', 'live', 'odds'],
            deployment: {
                vercel: true,
                runtime: 'Node.js 18',
                region: process.env.VERCEL_REGION || 'unknown'
            }
        });
    }

    // Hard Rock Bet API endpoints
    const hardRockEndpoints = {
        events: 'https://app.hardrock.bet/api/sportsbook/v3/sports/american_football/leagues/691198679103111169/events',
        odds: `https://app.hardrock.bet/api/sportsbook/v3/sports/american_football/leagues/691198679103111169/events/${eventId}/markets`,
        live: 'https://app.hardrock.bet/api/sportsbook/v3/sports/american_football/leagues/691198679103111169/events/live'
    };

    // Validate action
    if (!hardRockEndpoints[action] && action !== 'health') {
        return res.status(400).json({
            success: false,
            error: `Invalid action. Use: ${Object.keys(hardRockEndpoints).join(', ')}, health`,
            timestamp: new Date().toISOString()
        });
    }

    // For odds action, eventId is required
    if (action === 'odds' && !eventId) {
        return res.status(400).json({
            success: false,
            error: 'Event ID required for odds endpoint',
            timestamp: new Date().toISOString()
        });
    }

    try {
        console.log(`[HardRock API] Fetching ${action}${eventId ? ` for event ${eventId}` : ''}`);

        const url = action === 'odds' 
            ? `https://app.hardrock.bet/api/sportsbook/v3/sports/american_football/leagues/691198679103111169/events/${eventId}/markets`
            : hardRockEndpoints[action];

        // Fetch from Hard Rock Bet with appropriate headers
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Origin': 'https://app.hardrock.bet',
                'Referer': 'https://app.hardrock.bet/sport-leagues/american_football/691198679103111169',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            }
        });

        if (!response.ok) {
            console.error(`[HardRock API] HTTP ${response.status}: ${response.statusText}`);
            
            // Provide different error messages based on status
            let errorMessage = `Hard Rock Bet API returned ${response.status}`;
            if (response.status === 404) {
                errorMessage = 'Hard Rock Bet endpoint not found - may be temporarily unavailable';
            } else if (response.status === 403) {
                errorMessage = 'Hard Rock Bet access forbidden - API may be blocked';
            } else if (response.status === 429) {
                errorMessage = 'Hard Rock Bet rate limit exceeded - try again later';
            } else if (response.status >= 500) {
                errorMessage = 'Hard Rock Bet server error - try again later';
            }

            return res.status(response.status).json({
                success: false,
                error: errorMessage,
                httpStatus: response.status,
                action: action,
                timestamp: new Date().toISOString()
            });
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn(`[HardRock API] Unexpected content type: ${contentType}`);
            
            return res.status(500).json({
                success: false,
                error: 'Hard Rock Bet returned non-JSON response',
                contentType: contentType,
                action: action,
                timestamp: new Date().toISOString()
            });
        }

        const data = await response.json();
        
        console.log(`[HardRock API] Success: ${action} - ${Array.isArray(data) ? data.length : 'non-array'} items`);

        // Cache headers for better performance (5 minutes for events, 1 minute for live)
        const cacheMaxAge = action === 'live' ? 60 : 300;
        res.setHeader('Cache-Control', `public, max-age=${cacheMaxAge}, s-maxage=${cacheMaxAge}`);
        res.setHeader('Expires', new Date(Date.now() + cacheMaxAge * 1000).toUTCString());

        // Return successful response
        return res.status(200).json({
            success: true,
            action: action,
            provider: 'hardrock',
            data: data,
            metadata: {
                itemCount: Array.isArray(data) ? data.length : 1,
                timestamp: new Date().toISOString(),
                cacheMaxAge: cacheMaxAge,
                endpoint: action
            }
        });

    } catch (error) {
        console.error(`[HardRock API] Error:`, error);

        // Provide helpful error messages
        let errorMessage = 'Failed to fetch data from Hard Rock Bet';
        if (error.code === 'ENOTFOUND') {
            errorMessage = 'Hard Rock Bet domain not found - DNS issue';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Hard Rock Bet connection refused';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Hard Rock Bet request timeout';
        } else if (error.name === 'AbortError') {
            errorMessage = 'Hard Rock Bet request aborted';
        } else if (error.message.includes('JSON')) {
            errorMessage = 'Hard Rock Bet returned invalid JSON';
        }

        return res.status(500).json({
            success: false,
            error: errorMessage,
            action: action,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: new Date().toISOString()
        });
    }
}
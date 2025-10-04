/**
 * Railway Configuration
 * Update this file after deploying to Railway
 */

// REAL NFL API - LIVE DEPLOYMENT
window.RAILWAY_API_URL = 'https://nfl-api-production.onrender.com';

// For now, let's create a simple fallback API endpoint
window.NFL_FALLBACK_API = {
    teams: [
        { id: 1, name: 'Kansas City Chiefs', abbreviation: 'KC' },
        { id: 2, name: 'Buffalo Bills', abbreviation: 'BUF' },
        { id: 3, name: 'Las Vegas Raiders', abbreviation: 'LV' },
        { id: 4, name: 'Indianapolis Colts', abbreviation: 'IND' },
        { id: 5, name: 'San Francisco 49ers', abbreviation: 'SF' },
        { id: 6, name: 'Los Angeles Rams', abbreviation: 'LAR' }
    ],
    players: {
        'Las Vegas Raiders': [
            { name: 'Geno Smith', position: 'QB', team: 'Las Vegas Raiders', experience_years: 12 },
            { name: 'Gardner Minshew II', position: 'QB', team: 'Las Vegas Raiders', experience_years: 6 },
            { name: 'Davante Adams', position: 'WR', team: 'Las Vegas Raiders', experience_years: 11 }
        ],
        'Kansas City Chiefs': [
            { name: 'Patrick Mahomes', position: 'QB', team: 'Kansas City Chiefs', experience_years: 8 },
            { name: 'Travis Kelce', position: 'TE', team: 'Kansas City Chiefs', experience_years: 12 }
        ]
    }
};

// Alternative: Set via environment or auto-detection
window.NFL_API_CONFIG = {
    // Production API URL - Railway deployment
    railwayUrl: null, // Set this to your Railway app URL
    
    // Fallback to same-domain API if Railway not configured
    fallbackToSameDomain: true,
    
    // Enable debug logging
    debug: false
};

console.log('🚂 Railway configuration loaded');

// Override production config if Railway URL is set
if (window.RAILWAY_API_URL && window.productionConfig) {
    console.log(`🚂 Using Railway API: ${window.RAILWAY_API_URL}`);
    window.productionConfig.config.apiBaseUrl = `${window.RAILWAY_API_URL}/api/nfl`;
    window.productionConfig.config.databaseUrl = window.RAILWAY_API_URL;
    window.productionConfig.config.deploymentType = 'railway';
}
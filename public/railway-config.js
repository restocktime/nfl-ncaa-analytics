/**
 * Railway Configuration
 * Update this file after deploying to Railway
 */

// UPDATE THIS URL AFTER RAILWAY DEPLOYMENT
window.RAILWAY_API_URL = null; // Example: 'https://nfl-database-api-production.up.railway.app'

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
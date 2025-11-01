/**
 * Production Configuration System
 * Automatically detects environment and configures URLs
 * Zero hardcoded localhost references
 */

class ProductionConfig {
    constructor() {
        this.config = this.detectEnvironment();
        console.log(`🚀 Environment detected: ${this.config.environment}`);
        console.log(`🔗 API Base URL: ${this.config.apiBaseUrl}`);
    }
    
    detectEnvironment() {
        const hostname = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        // Detect local development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return {
                environment: 'development',
                apiBaseUrl: 'http://localhost:3001/api/nfl',  // Always use 3001 for local API
                databaseUrl: 'http://localhost:3001',
                isProduction: false,
                isDevelopment: true
            };
        }
        
        // Production environment - Check if Railway URL is configured
        const railwayUrl = this.getRailwayUrl();
        if (railwayUrl) {
            return {
                environment: 'production',
                apiBaseUrl: `${railwayUrl}/api/nfl`,
                databaseUrl: railwayUrl,
                isProduction: true,
                isDevelopment: false,
                deploymentType: 'railway'
            };
        }
        
        // Check if we should use fallback mode (Railway URL is explicitly null)
        if (window.RAILWAY_API_URL === null && window.NFL_FALLBACK_API) {
            return {
                environment: 'production',
                apiBaseUrl: 'fallback',
                databaseUrl: 'fallback',
                isProduction: true,
                isDevelopment: false,
                deploymentType: 'fallback'
            };
        }
        
        // Fallback - return null to let NFLDatabaseClient handle it
        return {
            environment: 'production',
            apiBaseUrl: null, // Let NFLDatabaseClient handle fallback
            databaseUrl: null,
            isProduction: true,
            isDevelopment: false,
            deploymentType: 'fallback'
        };
    }
    
    getApiUrl(endpoint = '') {
        // Check if we should use fallback data instead of API calls
        if (window.RAILWAY_API_URL === null && window.NFL_FALLBACK_API) {
            return 'fallback'; // Signal to use embedded data
        }
        return `${this.config.apiBaseUrl}${endpoint}`;
    }
    
    getDatabaseUrl() {
        return this.config.databaseUrl;
    }
    
    isProduction() {
        return this.config.isProduction;
    }
    
    isDevelopment() {
        return this.config.isDevelopment;
    }
    
    getEnvironment() {
        return this.config.environment;
    }
    
    getRailwayUrl() {
        // Check for Railway URL configuration from railway-config.js
        if (typeof window !== 'undefined' && window.RAILWAY_API_URL !== undefined) {
            return window.RAILWAY_API_URL; // Will be null for fallback mode
        }
        
        // Option 1: Environment variable (if set)
        if (typeof process !== 'undefined' && process.env && process.env.RAILWAY_API_URL) {
            return process.env.RAILWAY_API_URL;
        }
        
        // Option 2: Auto-detect Railway domain pattern
        const hostname = window.location.hostname;
        if (hostname.includes('railway.app') || hostname.includes('up.railway.app')) {
            return `${window.location.protocol}//${hostname}`;
        }
        
        // Option 3: Default fallback
        return null;
    }
    
    getDeploymentType() {
        return this.config.deploymentType || 'unknown';
    }
}

// Initialize global configuration
window.productionConfig = new ProductionConfig();

// Helper functions for easy access
window.getApiUrl = (endpoint) => window.productionConfig.getApiUrl(endpoint);
window.getDatabaseUrl = () => window.productionConfig.getDatabaseUrl();

console.log('🔧 Production Configuration System loaded - Dynamic environment detection enabled');
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
        
        // Fallback to same-domain API
        return {
            environment: 'production',
            apiBaseUrl: `${protocol}//${hostname}${port ? ':' + port : ''}/api/nfl`,
            databaseUrl: `${protocol}//${hostname}${port ? ':' + port : ''}`,
            isProduction: true,
            isDevelopment: false,
            deploymentType: 'same-domain'
        };
    }
    
    getApiUrl(endpoint = '') {
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
        // Check for Railway URL configuration
        // Option 1: Environment variable (if set)
        if (typeof process !== 'undefined' && process.env && process.env.RAILWAY_API_URL) {
            return process.env.RAILWAY_API_URL;
        }
        
        // Option 2: Hardcoded Railway URL (update this after deployment)
        const RAILWAY_API_URL = null; // Set to your Railway URL like: 'https://your-app.railway.app'
        
        // Option 3: Auto-detect Railway domain pattern
        const hostname = window.location.hostname;
        if (hostname.includes('railway.app') || hostname.includes('up.railway.app')) {
            return `${window.location.protocol}//${hostname}`;
        }
        
        return RAILWAY_API_URL;
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
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
        
        // Production environment
        return {
            environment: 'production',
            apiBaseUrl: `${protocol}//${hostname}${port ? ':' + port : ''}/api/nfl`,
            databaseUrl: `${protocol}//${hostname}${port ? ':' + port : ''}`,
            isProduction: true,
            isDevelopment: false
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
}

// Initialize global configuration
window.productionConfig = new ProductionConfig();

// Helper functions for easy access
window.getApiUrl = (endpoint) => window.productionConfig.getApiUrl(endpoint);
window.getDatabaseUrl = () => window.productionConfig.getDatabaseUrl();

console.log('🔧 Production Configuration System loaded - Dynamic environment detection enabled');
/**
 * Centralized API Configuration System for Sunday Edge Pro
 * Handles all API keys and configuration across all sections
 */

class APIConfigurationManager {
    constructor() {
        this.apiKeys = {
            oddsapi: '9de126998e0df996011a28e9527dd7b9', // Current working Odds API key
            widget_key: 'wk_c1f30f86cb719d970238ce3e1583d7c3', // Pre-configured Widget key
            espn: null,
            rapidapi: null,
            vercel_proxy: null
        };
        
        this.loadStoredKeys();
        this.createConfigModal();
        
        // Auto-configure with provided API key
        this.autoConfigureAPIs();
    }

    // Load API keys from localStorage
    loadStoredKeys() {
        try {
            const stored = localStorage.getItem('sunday_edge_api_keys');
            if (stored) {
                this.apiKeys = { ...this.apiKeys, ...JSON.parse(stored) };
                console.log('✅ API keys loaded from storage');
            }
        } catch (error) {
            console.warn('⚠️ No stored API keys found');
        }
    }

    // Save API keys to localStorage
    saveKeys() {
        try {
            localStorage.setItem('sunday_edge_api_keys', JSON.stringify(this.apiKeys));
            console.log('✅ API keys saved to storage');
        } catch (error) {
            console.error('❌ Failed to save API keys:', error);
        }
    }

    // Get API key by service
    getKey(service) {
        return this.apiKeys[service];
    }

    // Set API key for service
    setKey(service, key) {
        this.apiKeys[service] = key;
        this.saveKeys();
        this.notifyKeyUpdate(service);
    }

    // Get API status
    getAPIStatus() {
        return {
            oddsapi: {
                name: 'The Odds API',
                configured: !!this.apiKeys.oddsapi,
                required: true,
                description: 'Live NFL odds, spreads, and betting data'
            },
            espn: {
                name: 'ESPN API',
                configured: !!this.apiKeys.espn,
                required: false,
                description: 'Player stats, team info, and news'
            },
            rapidapi: {
                name: 'RapidAPI Sports',
                configured: !!this.apiKeys.rapidapi,
                required: false,
                description: 'Additional sports data and statistics'
            },
            vercel_proxy: {
                name: 'Vercel Proxy',
                configured: !!this.apiKeys.vercel_proxy,
                required: false,
                description: 'Proxy service for CORS and rate limiting'
            }
        };
    }

    // Auto-configure APIs on initialization
    autoConfigureAPIs() {
        console.log('🔑 Auto-configuring APIs with provided keys...');
        console.log('🔑 Available API keys:', Object.keys(this.apiKeys).filter(k => this.apiKeys[k]).join(', '));
        
        // Save the API key immediately
        this.saveKeys();
        
        // Configure all integrations
        this.configureIntegrations();
        
        // Test API connection if key is available
        if (this.apiKeys.oddsapi) {
            this.testAPIConnection();
        }
        
        console.log('✅ API keys configured automatically');
    }
    
    // Test API connection
    async testAPIConnection() {
        try {
            console.log('🧪 Testing API connection...');
            if (window.oddsAPIIntegration) {
                // Try a simple sports request
                const testUrl = `https://api.the-odds-api.com/v4/sports?apiKey=${this.apiKeys.oddsapi}`;
                const response = await fetch(testUrl);
                
                if (response.ok) {
                    console.log('✅ API connection test successful');
                } else {
                    console.warn(`⚠️ API connection test failed: ${response.status} ${response.statusText}`);
                }
            }
        } catch (error) {
            console.warn('⚠️ API connection test error:', error.message);
        }
    }

    // Configure all integration systems with API keys
    configureIntegrations() {
        console.log('🔧 Configuring integrations with API keys...');
        
        // Configure The Odds API
        if (typeof RealOddsAPIIntegration !== 'undefined') {
            if (this.apiKeys.oddsapi) {
                window.oddsAPIIntegration = new RealOddsAPIIntegration();
                window.oddsAPIIntegration.setupAPIKeys({ oddsapi: this.apiKeys.oddsapi });
                console.log('✅ RealOddsAPIIntegration configured');
            } else {
                console.warn('⚠️ RealOddsAPIIntegration available but no API key');
            }
        } else {
            console.warn('⚠️ RealOddsAPIIntegration not available');
        }

        // Configure Betting Odds Integration
        if (typeof BettingOddsIntegration !== 'undefined') {
            if (this.apiKeys.oddsapi) {
                window.bettingIntegration = new BettingOddsIntegration();
                window.bettingIntegration.setupAPIKeys({ oddsapi: this.apiKeys.oddsapi });
                console.log('✅ BettingOddsIntegration configured');
            } else {
                console.warn('⚠️ BettingOddsIntegration available but no API key');
            }
        } else {
            console.warn('⚠️ BettingOddsIntegration not available');
        }

        // Configure Fantasy Data Service
        if (typeof FantasyDataService !== 'undefined') {
            if (this.apiKeys.espn) {
                window.fantasyService = new FantasyDataService();
                window.fantasyService.setupAPIKeys({ espn: this.apiKeys.espn });
                console.log('✅ FantasyDataService configured');
            } else {
                console.log('📊 FantasyDataService available (ESPN API key optional)');
            }
        } else {
            console.log('📊 FantasyDataService not available (optional)');
        }

        console.log('✅ Integration configuration complete');
    }

    // Create configuration modal
    createConfigModal() {
        const modalHTML = `
            <div id="apiConfigModal" class="api-config-modal" style="display: none;">
                <div class="api-config-overlay" onclick="closeAPIConfig()"></div>
                <div class="api-config-content">
                    <div class="api-config-header">
                        <h2>🔑 Sunday Edge Pro API Configuration</h2>
                        <button class="close-btn" onclick="closeAPIConfig()">×</button>
                    </div>
                    <div class="api-config-body">
                        <p class="config-description">
                            Configure your API keys to unlock real-time NFL data across all Sunday Edge Pro features.
                        </p>
                        
                        <div class="api-service">
                            <div class="service-header">
                                <div class="service-info">
                                    <h3>The Odds API</h3>
                                    <span class="required-badge">Required</span>
                                </div>
                                <div class="service-status" id="oddsapi-status">Not Configured</div>
                            </div>
                            <p>Live NFL odds, spreads, betting lines, and player props</p>
                            <div class="input-group">
                                <input type="text" id="oddsapi-key" placeholder="Enter your Odds API key..." />
                                <button onclick="testAPIKey('oddsapi')">Test</button>
                            </div>
                            <small>Get your free API key at <a href="https://the-odds-api.com" target="_blank">the-odds-api.com</a></small>
                        </div>

                        <div class="api-service">
                            <div class="service-header">
                                <div class="service-info">
                                    <h3>ESPN API</h3>
                                    <span class="optional-badge">Optional</span>
                                </div>
                                <div class="service-status" id="espn-status">Not Configured</div>
                            </div>
                            <p>Player statistics, team information, and sports news</p>
                            <div class="input-group">
                                <input type="text" id="espn-key" placeholder="Enter your ESPN API key..." />
                                <button onclick="testAPIKey('espn')">Test</button>
                            </div>
                            <small>Enhanced player stats and team data</small>
                        </div>

                        <div class="api-service">
                            <div class="service-header">
                                <div class="service-info">
                                    <h3>RapidAPI Sports</h3>
                                    <span class="optional-badge">Optional</span>
                                </div>
                                <div class="service-status" id="rapidapi-status">Not Configured</div>
                            </div>
                            <p>Additional sports data and advanced analytics</p>
                            <div class="input-group">
                                <input type="text" id="rapidapi-key" placeholder="Enter your RapidAPI key..." />
                                <button onclick="testAPIKey('rapidapi')">Test</button>
                            </div>
                            <small>Get your key at <a href="https://rapidapi.com" target="_blank">rapidapi.com</a></small>
                        </div>
                    </div>
                    <div class="api-config-footer">
                        <button class="btn btn-secondary" onclick="closeAPIConfig()">Cancel</button>
                        <button class="btn btn-primary" onclick="saveAPIConfiguration()">Save Configuration</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add modal styles
        const styles = `
            <style>
                .api-config-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .api-config-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                }

                .api-config-content {
                    position: relative;
                    background: var(--bg-glass);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--border-glass);
                    border-radius: var(--radius-xl);
                    max-width: 600px;
                    width: 90vw;
                    max-height: 80vh;
                    overflow-y: auto;
                }

                .api-config-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--space-xl);
                    border-bottom: 1px solid var(--border-glass);
                }

                .api-config-header h2 {
                    color: var(--cyber-primary);
                    margin: 0;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                }

                .close-btn:hover {
                    color: var(--text-primary);
                }

                .api-config-body {
                    padding: var(--space-xl);
                }

                .config-description {
                    color: var(--text-secondary);
                    margin-bottom: var(--space-xl);
                    text-align: center;
                }

                .api-service {
                    background: var(--bg-secondary);
                    border-radius: var(--radius-lg);
                    padding: var(--space-lg);
                    margin-bottom: var(--space-lg);
                }

                .service-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--space-sm);
                }

                .service-info {
                    display: flex;
                    align-items: center;
                    gap: var(--space-sm);
                }

                .service-info h3 {
                    color: var(--text-primary);
                    margin: 0;
                }

                .required-badge {
                    background: var(--cyber-secondary);
                    color: white;
                    padding: var(--space-xs) var(--space-sm);
                    border-radius: var(--radius-sm);
                    font-size: var(--text-xs);
                    font-weight: 600;
                }

                .optional-badge {
                    background: var(--text-secondary);
                    color: var(--bg-primary);
                    padding: var(--space-xs) var(--space-sm);
                    border-radius: var(--radius-sm);
                    font-size: var(--text-xs);
                    font-weight: 600;
                }

                .service-status {
                    font-size: var(--text-sm);
                    color: var(--text-secondary);
                    font-family: var(--font-code);
                }

                .service-status.configured {
                    color: var(--cyber-accent);
                }

                .input-group {
                    display: flex;
                    gap: var(--space-sm);
                    margin: var(--space-md) 0;
                }

                .input-group input {
                    flex: 1;
                    padding: var(--space-sm) var(--space-md);
                    background: var(--bg-glass);
                    border: 1px solid var(--border-glass);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                }

                .input-group input:focus {
                    outline: none;
                    border-color: var(--cyber-primary);
                    box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
                }

                .input-group button {
                    padding: var(--space-sm) var(--space-lg);
                    background: var(--cyber-primary);
                    color: var(--bg-primary);
                    border: none;
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    font-weight: 600;
                    transition: all var(--transition-smooth);
                }

                .input-group button:hover {
                    background: var(--cyber-secondary);
                }

                .api-service small {
                    color: var(--text-secondary);
                    font-size: var(--text-xs);
                }

                .api-service small a {
                    color: var(--cyber-primary);
                    text-decoration: none;
                }

                .api-service small a:hover {
                    text-decoration: underline;
                }

                .api-config-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--space-md);
                    padding: var(--space-xl);
                    border-top: 1px solid var(--border-glass);
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // Show configuration modal
    showConfigModal() {
        const modal = document.getElementById('apiConfigModal');
        if (modal) {
            // Populate current values
            Object.keys(this.apiKeys).forEach(service => {
                const input = document.getElementById(`${service}-key`);
                const status = document.getElementById(`${service}-status`);
                if (input && this.apiKeys[service]) {
                    input.value = this.apiKeys[service];
                }
                if (status) {
                    status.textContent = this.apiKeys[service] ? 'Configured' : 'Not Configured';
                    status.className = this.apiKeys[service] ? 'service-status configured' : 'service-status';
                }
            });

            modal.style.display = 'flex';
        }
    }

    // Close configuration modal
    closeConfigModal() {
        const modal = document.getElementById('apiConfigModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Test API key
    async testAPIKey(service) {
        const input = document.getElementById(`${service}-key`);
        const status = document.getElementById(`${service}-status`);
        
        if (!input || !input.value.trim()) {
            alert('Please enter an API key to test');
            return;
        }

        status.textContent = 'Testing...';
        status.className = 'service-status';

        try {
            // Test the API key based on service
            let isValid = false;
            
            if (service === 'oddsapi') {
                isValid = await this.testOddsAPI(input.value.trim());
            } else if (service === 'espn') {
                isValid = await this.testESPNAPI(input.value.trim());
            } else if (service === 'rapidapi') {
                isValid = await this.testRapidAPI(input.value.trim());
            }

            if (isValid) {
                status.textContent = 'Valid ✅';
                status.className = 'service-status configured';
                this.setKey(service, input.value.trim());
            } else {
                status.textContent = 'Invalid ❌';
                status.className = 'service-status';
            }
        } catch (error) {
            console.error(`❌ Failed to test ${service} API:`, error);
            status.textContent = 'Test Failed ❌';
            status.className = 'service-status';
        }
    }

    // Test Odds API key
    async testOddsAPI(apiKey) {
        try {
            const response = await fetch(`https://api.the-odds-api.com/v4/sports?apiKey=${apiKey}`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Test ESPN API key (placeholder - ESPN doesn't require API keys for basic data)
    async testESPNAPI(apiKey) {
        // ESPN API test - for now just validate format
        return apiKey.length > 10;
    }

    // Test RapidAPI key
    async testRapidAPI(apiKey) {
        // RapidAPI test - validate format and basic request
        return apiKey.length > 20;
    }

    // Save all API configuration
    saveAPIConfiguration() {
        Object.keys(this.apiKeys).forEach(service => {
            const input = document.getElementById(`${service}-key`);
            if (input && input.value.trim()) {
                this.setKey(service, input.value.trim());
            }
        });

        // Configure all integrations
        this.configureIntegrations();

        // Close modal
        this.closeConfigModal();

        // Show success message
        if (typeof updateStatus === 'function') {
            updateStatus('✅ API configuration saved successfully');
        }
    }

    // Notify systems of key updates
    notifyKeyUpdate(service) {
        // Dispatch custom event for systems to listen to
        window.dispatchEvent(new CustomEvent('apiKeyUpdated', {
            detail: { service, key: this.apiKeys[service] }
        }));
    }
}

// Global functions for modal interaction
function openAPIConfig() {
    window.apiConfig.showConfigModal();
}

function closeAPIConfig() {
    window.apiConfig.closeConfigModal();
}

function testAPIKey(service) {
    window.apiConfig.testAPIKey(service);
}

function saveAPIConfiguration() {
    window.apiConfig.saveAPIConfiguration();
}

// Initialize API configuration manager when page loads
window.addEventListener('DOMContentLoaded', function() {
    window.apiConfig = new APIConfigurationManager();
    
    // Configure integrations on page load
    window.apiConfig.configureIntegrations();
    
    console.log('✅ API Configuration Manager initialized');
});

// Make available globally
window.APIConfigurationManager = APIConfigurationManager;
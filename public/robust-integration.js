/**
 * Robust Integration Script
 * Integrates all error handling, caching, and validation systems with existing data services
 */

class RobustIntegration {
    constructor() {
        this.initialized = false;
        this.services = {};
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        
        console.log('🔧 Robust Integration initializing...');
        this.initialize();
    }
    
    /**
     * Initialize all robust systems
     */
    async initialize() {
        try {
            // Wait for all error handling systems to be available
            await this.waitForSystems();
            
            // Initialize data services with error handling
            this.initializeDataServices();
            
            // Setup global error recovery
            this.setupGlobalErrorRecovery();
            
            // Setup periodic health checks
            this.setupHealthChecks();
            
            // Setup UI integration
            this.setupUIIntegration();
            
            this.initialized = true;
            console.log('✅ Robust Integration initialized successfully');
            
        } catch (error) {
            console.error('❌ Robust Integration initialization failed:', error);
            // Continue with basic functionality
            this.initializeFallbackMode();
        }
    }
    
    /**
     * Wait for all required systems to be available
     */
    async waitForSystems() {
        const requiredSystems = [
            'errorHandler',
            'cacheManager', 
            'dataValidator',
            'loadingStateManager'
        ];
        
        const maxWait = 10000; // 10 seconds
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            const allAvailable = requiredSystems.every(system => window[system]);
            
            if (allAvailable) {
                console.log('✅ All robust systems available');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error('Timeout waiting for robust systems');
    }
    
    /**
     * Initialize data services with enhanced error handling
     */
    initializeDataServices() {
        // Enhance NFL Data Service
        if (window.nflDataService) {
            this.services.nfl = this.enhanceDataService(window.nflDataService, 'NFL');
            console.log('🏈 NFL Data Service enhanced with robust error handling');
        }
        
        // Enhance NCAA Data Service
        if (window.ncaaDataService) {
            this.services.ncaa = this.enhanceDataService(window.ncaaDataService, 'NCAA');
            console.log('🏈 NCAA Data Service enhanced with robust error handling');
        }
        
        // Create enhanced service if none exist
        if (!this.services.nfl && !this.services.ncaa) {
            console.warn('⚠️ No data services found, creating emergency services');
            this.createEmergencyServices();
        }
    }
    
    /**
     * Enhance a data service with robust error handling
     */
    enhanceDataService(service, type) {
        const originalMethods = {};
        
        // Wrap key methods with error handling
        const methodsToWrap = ['getTodaysGames', 'getLiveGames', 'getUpcomingGames'];
        
        methodsToWrap.forEach(methodName => {
            if (typeof service[methodName] === 'function') {
                originalMethods[methodName] = service[methodName].bind(service);
                
                service[methodName] = async (...args) => {
                    const cacheKey = `${type.toLowerCase()}_${methodName}`;
                    
                    return await window.errorHandler.safeApiCall(
                        () => originalMethods[methodName](...args),
                        () => this.getEmergencyFallback(type, methodName),
                        {
                            retries: 3,
                            delay: 1000,
                            timeout: 15000,
                            cacheKey: cacheKey,
                            cacheDuration: 30000
                        }
                    );
                };
            }
        });
        
        return service;
    }
    
    /**
     * Get emergency fallback data
     */
    getEmergencyFallback(type, methodName) {
        console.log(`🚨 Emergency fallback for ${type} ${methodName}`);
        
        const fallbackGame = {
            id: `emergency-${type.toLowerCase()}-${Date.now()}`,
            name: `${type} Data Loading...`,
            shortName: 'Loading...',
            date: new Date(),
            status: {
                type: 'STATUS_SCHEDULED',
                displayClock: 'Please wait...',
                period: 0,
                completed: false
            },
            teams: {
                home: {
                    id: 'emergency-home',
                    name: 'Loading Home Team',
                    abbreviation: 'HOME',
                    logo: '',
                    score: 0,
                    record: '0-0'
                },
                away: {
                    id: 'emergency-away',
                    name: 'Loading Away Team',
                    abbreviation: 'AWAY',
                    logo: '',
                    score: 0,
                    record: '0-0'
                }
            },
            venue: 'Loading...',
            isLive: false,
            week: 1,
            season: new Date().getFullYear(),
            aiPrediction: {
                homeWinProbability: 50,
                awayWinProbability: 50,
                predictedSpread: 'Loading...',
                confidence: 0,
                predictedScore: { home: 0, away: 0 },
                recommendation: 'Data loading...',
                analysis: 'Please wait while we load the latest data.'
            },
            bettingLines: {
                spread: { home: 'Loading...', away: 'Loading...', odds: '-110' },
                moneyline: { home: 'Loading...', away: 'Loading...' },
                total: { over: 'Loading...', under: 'Loading...', odds: '-110' },
                sportsbooks: ['Loading...']
            },
            mlAlgorithms: {
                neuralNetwork: { prediction: 'Loading...', confidence: 0, accuracy: 'N/A' },
                xgboost: { prediction: 'Loading...', confidence: 0, accuracy: 'N/A' },
                ensemble: { prediction: 'Loading...', confidence: 0, accuracy: 'N/A' },
                consensus: { prediction: 'Loading...', confidence: 0, edge: 'LOW' }
            }
        };
        
        return [fallbackGame];
    }
    
    /**
     * Create emergency services when none exist
     */
    createEmergencyServices() {
        const EmergencyService = class {
            async getTodaysGames() {
                return window.robustIntegration.getEmergencyFallback('Emergency', 'getTodaysGames');
            }
            
            async getLiveGames() {
                return [];
            }
            
            async getUpcomingGames() {
                return [];
            }
        };
        
        if (!window.nflDataService) {
            window.nflDataService = new EmergencyService();
            this.services.nfl = window.nflDataService;
        }
        
        if (!window.ncaaDataService) {
            window.ncaaDataService = new EmergencyService();
            this.services.ncaa = window.ncaaDataService;
        }
    }
    
    /**
     * Setup global error recovery
     */
    setupGlobalErrorRecovery() {
        // Handle network errors
        window.addEventListener('online', () => {
            console.log('🌐 Network connection restored, refreshing data...');
            this.refreshAllData();
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 Network connection lost, using cached data...');
            this.showOfflineMessage();
        });
        
        // Handle visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.initialized) {
                // Tab became visible, refresh stale data
                this.refreshStaleData();
            }
        });
    }
    
    /**
     * Setup periodic health checks
     */
    setupHealthChecks() {
        // Check system health every 30 seconds
        setInterval(() => {
            this.performHealthCheck();
        }, 30000);
        
        // Initial health check
        setTimeout(() => {
            this.performHealthCheck();
        }, 5000);
    }
    
    /**
     * Perform system health check
     */
    async performHealthCheck() {
        try {
            const healthStatus = {
                errorHandler: !!window.errorHandler,
                cacheManager: !!window.cacheManager,
                dataValidator: !!window.dataValidator,
                loadingStateManager: !!window.loadingStateManager,
                nflService: !!this.services.nfl,
                ncaaService: !!this.services.ncaa,
                timestamp: new Date().toISOString()
            };
            
            // Check for blank sections
            window.loadingStateManager?.checkForBlankSections();
            
            // Log health status
            const healthyComponents = Object.values(healthStatus).filter(Boolean).length - 1; // -1 for timestamp
            const totalComponents = Object.keys(healthStatus).length - 1;
            
            if (healthyComponents < totalComponents) {
                console.warn(`⚠️ System health: ${healthyComponents}/${totalComponents} components healthy`, healthStatus);
            }
            
        } catch (error) {
            console.error('❌ Health check failed:', error);
        }
    }
    
    /**
     * Setup UI integration
     */
    setupUIIntegration() {
        // Add global retry function
        window.retryDataLoad = (type) => {
            this.retryDataLoad(type);
        };
        
        // Add global refresh function
        window.refreshAllData = () => {
            this.refreshAllData();
        };
        
        // Add data status indicators
        this.addDataStatusIndicators();
    }
    
    /**
     * Retry data loading for a specific type
     */
    async retryDataLoad(type) {
        const retryKey = `retry_${type}`;
        const currentAttempts = this.retryAttempts.get(retryKey) || 0;
        
        if (currentAttempts >= this.maxRetries) {
            console.warn(`⚠️ Max retries reached for ${type}`);
            return;
        }
        
        this.retryAttempts.set(retryKey, currentAttempts + 1);
        
        try {
            console.log(`🔄 Retrying data load for ${type} (attempt ${currentAttempts + 1})`);
            
            if (type === 'nfl' && this.services.nfl) {
                // Clear cache and retry
                window.cacheManager?.clearByTags(['nfl']);
                const games = await this.services.nfl.getTodaysGames();
                this.updateUI('nfl', games);
            } else if (type === 'ncaa' && this.services.ncaa) {
                // Clear cache and retry
                window.cacheManager?.clearByTags(['ncaa']);
                const games = await this.services.ncaa.getTodaysGames();
                this.updateUI('ncaa', games);
            }
            
            // Reset retry count on success
            this.retryAttempts.delete(retryKey);
            
        } catch (error) {
            console.error(`❌ Retry failed for ${type}:`, error);
            
            // Show error state if max retries reached
            if (currentAttempts + 1 >= this.maxRetries) {
                this.showMaxRetriesError(type);
            }
        }
    }
    
    /**
     * Refresh all data
     */
    async refreshAllData() {
        console.log('🔄 Refreshing all data...');
        
        // Clear all caches
        window.cacheManager?.clear();
        
        // Reset retry counts
        this.retryAttempts.clear();
        
        // Refresh NFL data
        if (this.services.nfl) {
            try {
                const nflGames = await this.services.nfl.getTodaysGames();
                this.updateUI('nfl', nflGames);
            } catch (error) {
                console.error('❌ Failed to refresh NFL data:', error);
            }
        }
        
        // Refresh NCAA data
        if (this.services.ncaa) {
            try {
                const ncaaGames = await this.services.ncaa.getTodaysGames();
                this.updateUI('ncaa', ncaaGames);
            } catch (error) {
                console.error('❌ Failed to refresh NCAA data:', error);
            }
        }
    }
    
    /**
     * Refresh stale data
     */
    refreshStaleData() {
        const staleThreshold = 5 * 60 * 1000; // 5 minutes
        const cacheStats = window.cacheManager?.getStats();
        
        if (cacheStats && cacheStats.averageAge > staleThreshold) {
            console.log('🔄 Refreshing stale data...');
            this.refreshAllData();
        }
    }
    
    /**
     * Update UI with new data
     */
    updateUI(type, data) {
        // This will be implemented by specific pages
        if (window.updateGamesDisplay) {
            window.updateGamesDisplay(type, data);
        }
        
        // Hide loading states
        const containerId = `${type}-games-container`;
        window.loadingStateManager?.hideLoadingState(containerId);
    }
    
    /**
     * Show offline message
     */
    showOfflineMessage() {
        const offlineMessage = document.createElement('div');
        offlineMessage.id = 'offline-message';
        offlineMessage.className = 'warning-state';
        offlineMessage.innerHTML = `
            <div class="warning-icon">📴</div>
            <p class="warning-message">You're offline. Showing cached data.</p>
        `;
        
        document.body.insertBefore(offlineMessage, document.body.firstChild);
        
        // Remove when back online
        window.addEventListener('online', () => {
            const msg = document.getElementById('offline-message');
            if (msg) msg.remove();
        }, { once: true });
    }
    
    /**
     * Show max retries error
     */
    showMaxRetriesError(type) {
        const containerId = `${type}-games-container`;
        window.loadingStateManager?.showErrorState(
            containerId,
            'Unable to load data after multiple attempts. Please check your connection and refresh the page.',
            null
        );
    }
    
    /**
     * Add data status indicators
     */
    addDataStatusIndicators() {
        // Add status indicators to show data freshness
        const addStatusIndicator = (containerId, status, message) => {
            const container = document.getElementById(containerId);
            if (container) {
                const indicator = document.createElement('div');
                indicator.className = `data-status ${status}`;
                indicator.innerHTML = `
                    <div class="data-status-dot"></div>
                    <span>${message}</span>
                `;
                container.insertBefore(indicator, container.firstChild);
            }
        };
        
        // This will be called by specific implementations
        window.addDataStatusIndicator = addStatusIndicator;
    }
    
    /**
     * Initialize fallback mode when robust systems fail
     */
    initializeFallbackMode() {
        console.warn('⚠️ Initializing fallback mode - limited error handling available');
        
        // Basic error handling without robust systems
        window.addEventListener('error', (event) => {
            console.error('JavaScript Error:', event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            event.preventDefault();
        });
        
        this.initialized = true;
    }
    
    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            initialized: this.initialized,
            services: Object.keys(this.services),
            retryAttempts: Object.fromEntries(this.retryAttempts),
            errorStats: window.errorHandler?.getErrorStats(),
            cacheStats: window.cacheManager?.getStats(),
            loadingStats: window.loadingStateManager?.getLoadingStats()
        };
    }
}

// Initialize robust integration when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.robustIntegration = new RobustIntegration();
});

console.log('🔧 Robust Integration script loaded');
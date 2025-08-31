/**
 * Loading State Manager
 * Ensures system never shows blank sections or loading states indefinitely
 */

class LoadingStateManager {
    constructor() {
        this.loadingStates = new Map();
        this.maxLoadingTime = 15000; // 15 seconds max loading time
        this.loadingTimeouts = new Map();
        
        console.log('⏳ Loading State Manager initialized');
        this.initializeLoadingStates();
    }
    
    /**
     * Initialize loading states for all sections
     */
    initializeLoadingStates() {
        // Define all sections that should never be blank
        this.criticalSections = [
            'nfl-games-container',
            'ncaa-games-container',
            'ai-predictions-section',
            'betting-lines-section',
            'ml-algorithms-section',
            'live-games-section',
            'upcoming-games-section'
        ];
        
        // Monitor these sections
        this.startSectionMonitoring();
    }
    
    /**
     * Show loading state for a section
     */
    showLoadingState(sectionId, message = 'Loading...', showSpinner = true) {
        try {
            const element = document.getElementById(sectionId);
            if (!element) {
                console.warn(`Loading state: Section ${sectionId} not found`);
                return;
            }
            
            // Clear any existing timeout
            this.clearLoadingTimeout(sectionId);
            
            // Set loading state
            this.loadingStates.set(sectionId, {
                startTime: Date.now(),
                message: message,
                isLoading: true
            });
            
            // Create loading HTML
            const loadingHTML = this.createLoadingHTML(message, showSpinner);
            element.innerHTML = loadingHTML;
            
            // Set timeout to prevent infinite loading
            const timeoutId = setTimeout(() => {
                this.handleLoadingTimeout(sectionId);
            }, this.maxLoadingTime);
            
            this.loadingTimeouts.set(sectionId, timeoutId);
            
            console.log(`⏳ Loading state set for ${sectionId}: ${message}`);
            
        } catch (error) {
            window.errorHandler?.logError('Failed to show loading state', error, 'LOADING_STATE_ERROR', { sectionId });
        }
    }
    
    /**
     * Hide loading state for a section
     */
    hideLoadingState(sectionId) {
        try {
            // Clear loading state
            this.loadingStates.delete(sectionId);
            
            // Clear timeout
            this.clearLoadingTimeout(sectionId);
            
            console.log(`✅ Loading state cleared for ${sectionId}`);
            
        } catch (error) {
            window.errorHandler?.logError('Failed to hide loading state', error, 'LOADING_STATE_ERROR', { sectionId });
        }
    }
    
    /**
     * Handle loading timeout - show error state instead of infinite loading
     */
    handleLoadingTimeout(sectionId) {
        try {
            const element = document.getElementById(sectionId);
            if (!element) return;
            
            console.warn(`⚠️ Loading timeout for ${sectionId}, showing error state`);
            
            // Show error state instead of infinite loading
            this.showErrorState(sectionId, 'Unable to load data', () => {
                this.retryLoading(sectionId);
            });
            
            // Update loading state
            const loadingState = this.loadingStates.get(sectionId);
            if (loadingState) {
                loadingState.isLoading = false;
                loadingState.timedOut = true;
            }
            
        } catch (error) {
            window.errorHandler?.logError('Failed to handle loading timeout', error, 'LOADING_TIMEOUT_ERROR', { sectionId });
        }
    }
    
    /**
     * Show error state with retry option
     */
    showErrorState(sectionId, message = 'Unable to load data', retryCallback = null) {
        try {
            const element = document.getElementById(sectionId);
            if (!element) return;
            
            const retryButton = retryCallback ? 
                `<button onclick="window.loadingStateManager.executeRetry('${sectionId}')" class="retry-button">
                    <span class="retry-icon">🔄</span> Try Again
                </button>` : '';
            
            element.innerHTML = `
                <div class="error-state">
                    <div class="error-content">
                        <div class="error-icon">⚠️</div>
                        <h3>Data Unavailable</h3>
                        <p>${message}</p>
                        ${retryButton}
                    </div>
                </div>
            `;
            
            // Store retry callback
            if (retryCallback) {
                this.retryCallbacks = this.retryCallbacks || new Map();
                this.retryCallbacks.set(sectionId, retryCallback);
            }
            
            console.log(`❌ Error state shown for ${sectionId}: ${message}`);
            
        } catch (error) {
            window.errorHandler?.logError('Failed to show error state', error, 'ERROR_STATE_ERROR', { sectionId });
        }
    }
    
    /**
     * Execute retry callback
     */
    executeRetry(sectionId) {
        try {
            const retryCallback = this.retryCallbacks?.get(sectionId);
            if (retryCallback) {
                console.log(`🔄 Retrying loading for ${sectionId}`);
                this.showLoadingState(sectionId, 'Retrying...');
                retryCallback();
            }
        } catch (error) {
            window.errorHandler?.logError('Failed to execute retry', error, 'RETRY_ERROR', { sectionId });
        }
    }
    
    /**
     * Retry loading for a section
     */
    retryLoading(sectionId) {
        // This will be overridden by specific implementations
        console.log(`🔄 Retry loading requested for ${sectionId}`);
        
        // Try to reload the appropriate data service
        if (sectionId.includes('nfl')) {
            this.retryNFLData();
        } else if (sectionId.includes('ncaa')) {
            this.retryNCAAData();
        } else {
            // Generic retry - just show loading and hope for the best
            this.showLoadingState(sectionId, 'Retrying...');
            setTimeout(() => {
                this.showErrorState(sectionId, 'Retry failed. Please refresh the page.');
            }, 5000);
        }
    }
    
    /**
     * Retry NFL data loading
     */
    async retryNFLData() {
        try {
            if (window.nflDataService) {
                // Clear cache and retry
                window.nflDataService.clearCache();
                const games = await window.nflDataService.getTodaysGames();
                
                // Update UI with new data
                if (window.updateNFLGamesDisplay) {
                    window.updateNFLGamesDisplay(games);
                }
            }
        } catch (error) {
            window.errorHandler?.logError('NFL data retry failed', error, 'RETRY_ERROR');
        }
    }
    
    /**
     * Retry NCAA data loading
     */
    async retryNCAAData() {
        try {
            if (window.ncaaDataService) {
                // Clear cache and retry
                window.ncaaDataService.clearCache();
                const games = await window.ncaaDataService.getTodaysGames();
                
                // Update UI with new data
                if (window.updateNCAAGamesDisplay) {
                    window.updateNCAAGamesDisplay(games);
                }
            }
        } catch (error) {
            window.errorHandler?.logError('NCAA data retry failed', error, 'RETRY_ERROR');
        }
    }
    
    /**
     * Create loading HTML with spinner
     */
    createLoadingHTML(message, showSpinner = true) {
        const spinner = showSpinner ? `
            <div class="loading-spinner">
                <div class="spinner-ring"></div>
            </div>
        ` : '';
        
        return `
            <div class="loading-state">
                <div class="loading-content">
                    ${spinner}
                    <p class="loading-message">${message}</p>
                    <div class="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Clear loading timeout
     */
    clearLoadingTimeout(sectionId) {
        const timeoutId = this.loadingTimeouts.get(sectionId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.loadingTimeouts.delete(sectionId);
        }
    }
    
    /**
     * Start monitoring sections for blank content
     */
    startSectionMonitoring() {
        // Check every 5 seconds for blank sections
        setInterval(() => {
            this.checkForBlankSections();
        }, 5000);
    }
    
    /**
     * Check for blank sections and fix them
     */
    checkForBlankSections() {
        try {
            this.criticalSections.forEach(sectionId => {
                const element = document.getElementById(sectionId);
                if (element) {
                    const content = element.innerHTML.trim();
                    const isBlank = !content || 
                                   content === '' || 
                                   content.includes('undefined') ||
                                   content.includes('null') ||
                                   element.children.length === 0;
                    
                    if (isBlank && !this.loadingStates.has(sectionId)) {
                        console.warn(`🚨 Blank section detected: ${sectionId}`);
                        this.showLoadingState(sectionId, 'Loading sports data...');
                        
                        // Try to reload data for this section
                        setTimeout(() => {
                            this.retryLoading(sectionId);
                        }, 1000);
                    }
                }
            });
        } catch (error) {
            window.errorHandler?.logError('Section monitoring failed', error, 'MONITORING_ERROR');
        }
    }
    
    /**
     * Show skeleton loading for better UX
     */
    showSkeletonLoading(sectionId, type = 'games') {
        try {
            const element = document.getElementById(sectionId);
            if (!element) return;
            
            let skeletonHTML = '';
            
            switch (type) {
                case 'games':
                    skeletonHTML = this.createGamesSkeleton();
                    break;
                case 'predictions':
                    skeletonHTML = this.createPredictionsSkeleton();
                    break;
                case 'betting':
                    skeletonHTML = this.createBettingSkeleton();
                    break;
                default:
                    skeletonHTML = this.createGenericSkeleton();
            }
            
            element.innerHTML = skeletonHTML;
            
        } catch (error) {
            window.errorHandler?.logError('Failed to show skeleton loading', error, 'SKELETON_ERROR', { sectionId });
        }
    }
    
    /**
     * Create games skeleton
     */
    createGamesSkeleton() {
        return `
            <div class="skeleton-container">
                ${Array(3).fill(0).map(() => `
                    <div class="skeleton-game-card">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-line skeleton-teams"></div>
                        <div class="skeleton-line skeleton-score"></div>
                        <div class="skeleton-line skeleton-status"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Create predictions skeleton
     */
    createPredictionsSkeleton() {
        return `
            <div class="skeleton-container">
                <div class="skeleton-line skeleton-header"></div>
                <div class="skeleton-line skeleton-prediction"></div>
                <div class="skeleton-line skeleton-confidence"></div>
            </div>
        `;
    }
    
    /**
     * Create betting skeleton
     */
    createBettingSkeleton() {
        return `
            <div class="skeleton-container">
                <div class="skeleton-line skeleton-spread"></div>
                <div class="skeleton-line skeleton-moneyline"></div>
                <div class="skeleton-line skeleton-total"></div>
            </div>
        `;
    }
    
    /**
     * Create generic skeleton
     */
    createGenericSkeleton() {
        return `
            <div class="skeleton-container">
                ${Array(4).fill(0).map(() => `
                    <div class="skeleton-line"></div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Get loading statistics
     */
    getLoadingStats() {
        const stats = {
            activeLoadingStates: this.loadingStates.size,
            timedOutSections: 0,
            averageLoadingTime: 0
        };
        
        let totalLoadingTime = 0;
        const now = Date.now();
        
        for (const [sectionId, state] of this.loadingStates.entries()) {
            if (state.timedOut) {
                stats.timedOutSections++;
            }
            totalLoadingTime += now - state.startTime;
        }
        
        if (this.loadingStates.size > 0) {
            stats.averageLoadingTime = totalLoadingTime / this.loadingStates.size;
        }
        
        return stats;
    }
}

// Initialize global loading state manager
window.loadingStateManager = new LoadingStateManager();

console.log('⏳ Loading State Manager loaded and active');
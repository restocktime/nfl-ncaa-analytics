/**
 * Cache Buster and Data Refresh Manager
 * Ensures fresh data and resolves caching issues
 */

class CacheBuster {
    constructor() {
        this.lastFetch = new Map();
        this.refreshIntervals = new Map();
        this.init();
    }

    init() {
        console.log('🔄 Cache Buster initialized');
        
        // Clear any existing cache on page load
        this.clearBrowserCache();
        
        // Set up automatic refresh for live data
        this.setupAutoRefresh();
        
        // Add visibility change handler
        this.setupVisibilityHandler();
    }

    // Clear browser cache programmatically
    clearBrowserCache() {
        try {
            // Clear localStorage sports data
            Object.keys(localStorage).forEach(key => {
                if (key.includes('nfl') || key.includes('ncaa') || key.includes('games')) {
                    localStorage.removeItem(key);
                }
            });
            
            // Clear sessionStorage
            sessionStorage.clear();
            
            console.log('✅ Browser cache cleared');
        } catch (error) {
            console.warn('⚠️ Could not clear cache:', error);
        }
    }

    // Add cache-busting parameters to API calls
    addCacheBuster(url) {
        const separator = url.includes('?') ? '&' : '?';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `${url}${separator}_t=${timestamp}&_r=${random}`;
    }

    // Fetch with cache busting
    async fetchWithCacheBuster(url, options = {}) {
        const busteredUrl = this.addCacheBuster(url);
        
        const defaultOptions = {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                ...options.headers
            }
        };

        try {
            console.log(`🔍 Fetching fresh data: ${busteredUrl}`);
            const response = await fetch(busteredUrl, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.lastFetch.set(url, Date.now());
            return response;
        } catch (error) {
            console.error(`❌ Fetch failed for ${url}:`, error);
            throw error;
        }
    }

    // Setup automatic refresh for live data
    setupAutoRefresh() {
        // Refresh live games every 30 seconds
        this.setAutoRefresh('/api/games', 30000, () => {
            if (window.location.pathname.includes('nfl') || window.location.pathname.includes('ncaa')) {
                this.refreshGameData();
            }
        });

        // Refresh betting odds every 60 seconds
        this.setAutoRefresh('/api/betting/odds', 60000, () => {
            if (window.location.pathname.includes('betting') || window.location.hash.includes('betting')) {
                this.refreshBettingData();
            }
        });
    }

    setAutoRefresh(endpoint, interval, callback) {
        if (this.refreshIntervals.has(endpoint)) {
            clearInterval(this.refreshIntervals.get(endpoint));
        }

        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                callback();
            }
        }, interval);

        this.refreshIntervals.set(endpoint, intervalId);
    }

    // Handle visibility change to pause/resume updates
    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                console.log('👁️ Page visible - resuming updates');
                this.refreshAllData();
            } else {
                console.log('🙈 Page hidden - pausing updates');
            }
        });
    }

    // Refresh game data for current sport
    async refreshGameData() {
        try {
            const sport = this.getCurrentSport();
            const endpoint = sport === 'ncaa' ? '/api/ncaa/games' : '/api/games';
            
            const response = await this.fetchWithCacheBuster(endpoint);
            const data = await response.json();
            
            // Update game displays if functions exist
            if (typeof updateGameDisplay === 'function') {
                updateGameDisplay(data);
            }
            
            if (typeof refreshLiveScores === 'function') {
                refreshLiveScores(data);
            }

            console.log(`✅ Refreshed ${sport.toUpperCase()} game data: ${data.count} games`);
            
        } catch (error) {
            console.error('❌ Failed to refresh game data:', error);
        }
    }

    // Refresh betting data
    async refreshBettingData() {
        try {
            const response = await this.fetchWithCacheBuster('/api/betting/odds');
            const data = await response.json();
            
            if (typeof updateBettingOdds === 'function') {
                updateBettingOdds(data);
            }

            console.log('✅ Refreshed betting odds data');
            
        } catch (error) {
            console.error('❌ Failed to refresh betting data:', error);
        }
    }

    // Determine current sport from page
    getCurrentSport() {
        if (window.location.pathname.includes('ncaa') || window.location.hash.includes('ncaa')) {
            return 'ncaa';
        }
        return 'nfl';
    }

    // Refresh all data
    refreshAllData() {
        this.refreshGameData();
        if (window.location.pathname.includes('betting')) {
            this.refreshBettingData();
        }
    }

    // Manual refresh trigger
    forceRefresh() {
        console.log('🔄 Force refreshing all data...');
        this.clearBrowserCache();
        this.refreshAllData();
        
        // Reload page if needed
        if (confirm('Force reload the page to ensure fresh content?')) {
            window.location.reload(true);
        }
    }

    // Cleanup intervals
    destroy() {
        this.refreshIntervals.forEach(intervalId => clearInterval(intervalId));
        this.refreshIntervals.clear();
    }
}

// Initialize cache buster
window.cacheBuster = new CacheBuster();

// Global force refresh function
window.forceRefresh = () => {
    window.cacheBuster.forceRefresh();
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheBuster;
}

console.log('🔄 Cache Buster loaded and ready');
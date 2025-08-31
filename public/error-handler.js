/**
 * Comprehensive Error Handler and Fallback System
 * Provides robust error handling, logging, and fallback data for the football analytics system
 */

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.fallbackCache = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
        
        console.log('🛡️ Error Handler initialized');
        this.setupGlobalErrorHandling();
    }
    
    /**
     * Setup global error handling to catch unhandled errors
     */
    setupGlobalErrorHandling() {
        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', event.reason, 'PROMISE_REJECTION');
            event.preventDefault(); // Prevent console error
        });
        
        // Catch JavaScript errors
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', event.error, 'JS_ERROR', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
    }
    
    /**
     * Log errors without displaying them to users
     */
    logError(message, error, type = 'GENERAL', context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: message,
            error: error?.message || error,
            stack: error?.stack,
            type: type,
            context: context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Add to error log
        this.errorLog.push(errorEntry);
        
        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }
        
        // Log to console for debugging (but not to user)
        console.warn(`🚨 [${type}] ${message}:`, error);
        
        // Could send to analytics service here
        this.sendErrorToAnalytics(errorEntry);
    }
    
    /**
     * Send error to analytics (mock implementation)
     */
    sendErrorToAnalytics(errorEntry) {
        // In a real implementation, this would send to your analytics service
        // For now, we'll just store it locally
        try {
            const errors = JSON.parse(localStorage.getItem('error_analytics') || '[]');
            errors.push(errorEntry);
            
            // Keep only last 50 errors in localStorage
            if (errors.length > 50) {
                errors.splice(0, errors.length - 50);
            }
            
            localStorage.setItem('error_analytics', JSON.stringify(errors));
        } catch (e) {
            // If localStorage fails, just continue silently
        }
    }
    
    /**
     * Wrap API calls with comprehensive error handling and retry logic
     */
    async safeApiCall(apiFunction, fallbackFunction, options = {}) {
        const {
            retries = this.retryAttempts,
            delay = this.retryDelay,
            timeout = 10000,
            cacheKey = null,
            cacheDuration = 30000
        } = options;
        
        // Check cache first
        if (cacheKey) {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return cached;
            }
        }
        
        let lastError = null;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // Add timeout to the API call
                const result = await this.withTimeout(apiFunction(), timeout);
                
                // Validate the result
                if (this.validateApiResponse(result)) {
                    // Cache successful result
                    if (cacheKey) {
                        this.setCache(cacheKey, result, cacheDuration);
                    }
                    
                    return result;
                } else {
                    throw new Error('Invalid API response format');
                }
                
            } catch (error) {
                lastError = error;
                
                this.logError(
                    `API call failed (attempt ${attempt}/${retries})`,
                    error,
                    'API_ERROR',
                    { attempt, retries, cacheKey }
                );
                
                // If this isn't the last attempt, wait before retrying
                if (attempt < retries) {
                    await this.sleep(delay * attempt); // Exponential backoff
                }
            }
        }
        
        // All retries failed, use fallback
        this.logError(
            'All API retries failed, using fallback',
            lastError,
            'API_FALLBACK',
            { retries, cacheKey }
        );
        
        try {
            const fallbackResult = await fallbackFunction();
            
            // Cache fallback result with shorter duration
            if (cacheKey) {
                this.setCache(cacheKey, fallbackResult, cacheDuration / 2);
            }
            
            return fallbackResult;
        } catch (fallbackError) {
            this.logError('Fallback function also failed', fallbackError, 'FALLBACK_ERROR');
            
            // Return empty but valid structure to prevent UI breaks
            return this.getEmptyValidStructure(cacheKey);
        }
    }
    
    /**
     * Add timeout to promises
     */
    withTimeout(promise, timeoutMs) {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
            )
        ]);
    }
    
    /**
     * Validate API response structure
     */
    validateApiResponse(response) {
        if (!response) return false;
        
        // Check for common valid structures
        if (Array.isArray(response)) return true;
        if (typeof response === 'object') {
            // Check for common API response patterns
            if (response.events || response.games || response.data || response.items) {
                return true;
            }
            // Check for game objects
            if (response.id && response.teams) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Validate game objects to ensure they have required fields
     */
    validateGameObject(game) {
        const requiredFields = ['id', 'name', 'teams', 'date', 'status'];
        const requiredTeamFields = ['name', 'abbreviation'];
        
        try {
            // Check main game fields
            for (const field of requiredFields) {
                if (!game[field]) {
                    this.logError(`Game missing required field: ${field}`, null, 'VALIDATION_ERROR');
                    return false;
                }
            }
            
            // Check team structure
            if (!game.teams.home || !game.teams.away) {
                this.logError('Game missing home or away team', null, 'VALIDATION_ERROR');
                return false;
            }
            
            // Check team fields
            for (const team of [game.teams.home, game.teams.away]) {
                for (const field of requiredTeamFields) {
                    if (!team[field]) {
                        this.logError(`Team missing required field: ${field}`, null, 'VALIDATION_ERROR');
                        return false;
                    }
                }
            }
            
            return true;
        } catch (error) {
            this.logError('Error validating game object', error, 'VALIDATION_ERROR');
            return false;
        }
    }
    
    /**
     * Sanitize and fix game objects
     */
    sanitizeGameObject(game) {
        try {
            const sanitized = {
                id: game.id || `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: game.name || 'TBD vs TBD',
                shortName: game.shortName || 'TBD @ TBD',
                date: game.date ? new Date(game.date) : new Date(),
                status: {
                    type: game.status?.type || 'STATUS_SCHEDULED',
                    displayClock: game.status?.displayClock || '',
                    period: game.status?.period || 0,
                    completed: game.status?.completed || false
                },
                teams: {
                    home: {
                        id: game.teams?.home?.id || 'home-team',
                        name: game.teams?.home?.name || 'Home Team',
                        abbreviation: game.teams?.home?.abbreviation || 'HOME',
                        logo: game.teams?.home?.logo || '',
                        score: parseInt(game.teams?.home?.score) || 0,
                        record: game.teams?.home?.record || '0-0'
                    },
                    away: {
                        id: game.teams?.away?.id || 'away-team',
                        name: game.teams?.away?.name || 'Away Team',
                        abbreviation: game.teams?.away?.abbreviation || 'AWAY',
                        logo: game.teams?.away?.logo || '',
                        score: parseInt(game.teams?.away?.score) || 0,
                        record: game.teams?.away?.record || '0-0'
                    }
                },
                venue: game.venue || 'TBD',
                isLive: game.isLive || false,
                week: game.week || 1,
                season: game.season || new Date().getFullYear()
            };
            
            return sanitized;
        } catch (error) {
            this.logError('Error sanitizing game object', error, 'SANITIZATION_ERROR');
            return this.getDefaultGameObject();
        }
    }
    
    /**
     * Get default game object when all else fails
     */
    getDefaultGameObject() {
        return {
            id: `default-game-${Date.now()}`,
            name: 'Game Data Unavailable',
            shortName: 'N/A @ N/A',
            date: new Date(),
            status: {
                type: 'STATUS_SCHEDULED',
                displayClock: 'Data Loading...',
                period: 0,
                completed: false
            },
            teams: {
                home: {
                    id: 'default-home',
                    name: 'Home Team',
                    abbreviation: 'HOME',
                    logo: '',
                    score: 0,
                    record: '0-0'
                },
                away: {
                    id: 'default-away',
                    name: 'Away Team',
                    abbreviation: 'AWAY',
                    logo: '',
                    score: 0,
                    record: '0-0'
                }
            },
            venue: 'TBD',
            isLive: false,
            week: 1,
            season: new Date().getFullYear()
        };
    }
    
    /**
     * Get empty but valid structure based on cache key
     */
    getEmptyValidStructure(cacheKey) {
        if (cacheKey?.includes('games')) {
            return [];
        }
        if (cacheKey?.includes('rankings')) {
            return [];
        }
        if (cacheKey?.includes('betting')) {
            return {};
        }
        
        return null;
    }
    
    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Cache management with expiration
     */
    setCache(key, data, duration = 30000) {
        this.fallbackCache.set(key, {
            data: data,
            timestamp: Date.now(),
            duration: duration
        });
    }
    
    getFromCache(key) {
        const cached = this.fallbackCache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.duration) {
            return cached.data;
        }
        
        // Remove expired cache
        if (cached) {
            this.fallbackCache.delete(key);
        }
        
        return null;
    }
    
    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, cached] of this.fallbackCache.entries()) {
            if (now - cached.timestamp >= cached.duration) {
                this.fallbackCache.delete(key);
            }
        }
    }
    
    /**
     * Get error statistics for monitoring
     */
    getErrorStats() {
        const stats = {
            totalErrors: this.errorLog.length,
            errorsByType: {},
            recentErrors: this.errorLog.slice(-10),
            cacheSize: this.fallbackCache.size
        };
        
        // Count errors by type
        this.errorLog.forEach(error => {
            stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
        });
        
        return stats;
    }
    
    /**
     * Show loading state instead of blank sections
     */
    showLoadingState(elementId, message = 'Loading...') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>${message}</p>
                </div>
            `;
        }
    }
    
    /**
     * Show error state with retry option
     */
    showErrorState(elementId, message = 'Unable to load data', retryFunction = null) {
        const element = document.getElementById(elementId);
        if (element) {
            const retryButton = retryFunction ? 
                `<button onclick="${retryFunction.name}()" class="retry-button">Try Again</button>` : '';
            
            element.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <p>${message}</p>
                    ${retryButton}
                </div>
            `;
        }
    }
    
    /**
     * Ensure system never shows blank sections
     */
    preventBlankSections() {
        // Find all sections that might be empty
        const sections = document.querySelectorAll('.game-section, .prediction-section, .betting-section, .ml-section');
        
        sections.forEach(section => {
            if (!section.innerHTML.trim() || section.innerHTML.includes('undefined')) {
                this.showLoadingState(section.id || 'unknown-section', 'Loading sports data...');
            }
        });
    }
}

// Initialize global error handler
window.errorHandler = new ErrorHandler();

// Clean up expired cache every 5 minutes
setInterval(() => {
    window.errorHandler.clearExpiredCache();
}, 300000);

console.log('🛡️ Error Handler loaded and active');
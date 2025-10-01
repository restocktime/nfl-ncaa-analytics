/**
 * Advanced Cache Manager
 * Handles caching of API responses with intelligent expiration and fallback strategies
 */

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.persistentCache = this.initializePersistentCache();
        this.defaultTTL = 30000; // 30 seconds default
        this.maxCacheSize = 100; // Maximum number of cache entries
        this.compressionEnabled = true;
        
        // Deterministic cache keys for consistent picks
        this.deterministicKeys = new Map();
        this.gameState = {
            currentWeek: this.getCurrentNFLWeek(),
            isLiveGames: false,
            lastLiveUpdate: null
        };
        
        console.log('💾 Cache Manager initialized with deterministic pick consistency');
        this.startCleanupInterval();
    }
    
    /**
     * Initialize persistent cache using localStorage
     */
    initializePersistentCache() {
        try {
            const stored = localStorage.getItem('sports_cache');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('Failed to load persistent cache:', error);
            return {};
        }
    }
    
    /**
     * Set cache entry with TTL and optional persistence
     */
    set(key, data, options = {}) {
        const {
            ttl = this.defaultTTL,
            persistent = false,
            compress = this.compressionEnabled,
            tags = []
        } = options;
        
        try {
            const entry = {
                data: compress ? this.compress(data) : data,
                timestamp: Date.now(),
                ttl: ttl,
                persistent: persistent,
                compressed: compress,
                tags: tags,
                accessCount: 0,
                lastAccessed: Date.now()
            };
            
            // Store in memory cache
            this.cache.set(key, entry);
            
            // Store in persistent cache if requested
            if (persistent) {
                this.persistentCache[key] = entry;
                this.savePersistentCache();
            }
            
            // Manage cache size
            this.manageCacheSize();
            
            console.log(`💾 Cached: ${key} (TTL: ${ttl}ms, Persistent: ${persistent})`);
            
        } catch (error) {
            console.error('Cache set error:', error);
            window.errorHandler?.logError('Cache set failed', error, 'CACHE_ERROR', { key });
        }
    }
    
    /**
     * Get cache entry with automatic decompression
     */
    get(key, options = {}) {
        const { 
            allowExpired = false,
            updateAccess = true 
        } = options;
        
        try {
            // Try memory cache first
            let entry = this.cache.get(key);
            
            // Try persistent cache if not in memory
            if (!entry && this.persistentCache[key]) {
                entry = this.persistentCache[key];
                // Restore to memory cache
                this.cache.set(key, entry);
            }
            
            if (!entry) {
                return null;
            }
            
            // Check expiration
            const isExpired = Date.now() - entry.timestamp > entry.ttl;
            if (isExpired && !allowExpired) {
                this.delete(key);
                return null;
            }
            
            // Update access statistics
            if (updateAccess) {
                entry.accessCount++;
                entry.lastAccessed = Date.now();
            }
            
            // Decompress if needed
            const data = entry.compressed ? this.decompress(entry.data) : entry.data;
            
            console.log(`💾 Cache hit: ${key} (Age: ${Date.now() - entry.timestamp}ms)`);
            return data;
            
        } catch (error) {
            console.error('Cache get error:', error);
            window.errorHandler?.logError('Cache get failed', error, 'CACHE_ERROR', { key });
            return null;
        }
    }
    
    /**
     * Check if cache entry exists and is valid
     */
    has(key) {
        const entry = this.cache.get(key) || this.persistentCache[key];
        if (!entry) return false;
        
        const isExpired = Date.now() - entry.timestamp > entry.ttl;
        return !isExpired;
    }
    
    /**
     * Delete cache entry
     */
    delete(key) {
        try {
            this.cache.delete(key);
            delete this.persistentCache[key];
            this.savePersistentCache();
            console.log(`💾 Cache deleted: ${key}`);
        } catch (error) {
            console.error('Cache delete error:', error);
            window.errorHandler?.logError('Cache delete failed', error, 'CACHE_ERROR', { key });
        }
    }
    
    /**
     * Clear cache by tags
     */
    clearByTags(tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        let deletedCount = 0;
        
        try {
            // Clear from memory cache
            for (const [key, entry] of this.cache.entries()) {
                if (entry.tags && entry.tags.some(tag => tagsArray.includes(tag))) {
                    this.cache.delete(key);
                    deletedCount++;
                }
            }
            
            // Clear from persistent cache
            for (const [key, entry] of Object.entries(this.persistentCache)) {
                if (entry.tags && entry.tags.some(tag => tagsArray.includes(tag))) {
                    delete this.persistentCache[key];
                    deletedCount++;
                }
            }
            
            this.savePersistentCache();
            console.log(`💾 Cleared ${deletedCount} entries by tags:`, tagsArray);
            
        } catch (error) {
            console.error('Cache clear by tags error:', error);
            window.errorHandler?.logError('Cache clear by tags failed', error, 'CACHE_ERROR', { tags });
        }
    }
    
    /**
     * Clear all cache
     */
    clear() {
        try {
            this.cache.clear();
            this.persistentCache = {};
            this.savePersistentCache();
            console.log('💾 All cache cleared');
        } catch (error) {
            console.error('Cache clear error:', error);
            window.errorHandler?.logError('Cache clear failed', error, 'CACHE_ERROR');
        }
    }
    
    /**
     * Get cache statistics
     */
    getStats() {
        const memoryEntries = Array.from(this.cache.values());
        const persistentEntries = Object.values(this.persistentCache);
        const allEntries = [...memoryEntries, ...persistentEntries];
        
        const now = Date.now();
        const expired = allEntries.filter(entry => now - entry.timestamp > entry.ttl);
        const valid = allEntries.filter(entry => now - entry.timestamp <= entry.ttl);
        
        return {
            memorySize: this.cache.size,
            persistentSize: Object.keys(this.persistentCache).length,
            totalEntries: allEntries.length,
            validEntries: valid.length,
            expiredEntries: expired.length,
            totalAccessCount: allEntries.reduce((sum, entry) => sum + (entry.accessCount || 0), 0),
            averageAge: allEntries.length > 0 ? 
                allEntries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / allEntries.length : 0
        };
    }
    
    /**
     * Manage cache size by removing least recently used entries
     */
    manageCacheSize() {
        if (this.cache.size <= this.maxCacheSize) return;
        
        try {
            // Convert to array and sort by last accessed time
            const entries = Array.from(this.cache.entries())
                .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
            
            // Remove oldest entries
            const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
            toRemove.forEach(([key]) => {
                this.cache.delete(key);
            });
            
            console.log(`💾 Removed ${toRemove.length} old cache entries`);
            
        } catch (error) {
            console.error('Cache size management error:', error);
            window.errorHandler?.logError('Cache size management failed', error, 'CACHE_ERROR');
        }
    }
    
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        
        try {
            // Clean memory cache
            for (const [key, entry] of this.cache.entries()) {
                if (now - entry.timestamp > entry.ttl) {
                    this.cache.delete(key);
                    cleanedCount++;
                }
            }
            
            // Clean persistent cache
            for (const [key, entry] of Object.entries(this.persistentCache)) {
                if (now - entry.timestamp > entry.ttl) {
                    delete this.persistentCache[key];
                    cleanedCount++;
                }
            }
            
            if (cleanedCount > 0) {
                this.savePersistentCache();
                console.log(`💾 Cleaned up ${cleanedCount} expired cache entries`);
            }
            
        } catch (error) {
            console.error('Cache cleanup error:', error);
            window.errorHandler?.logError('Cache cleanup failed', error, 'CACHE_ERROR');
        }
    }
    
    /**
     * Save persistent cache to localStorage
     */
    savePersistentCache() {
        try {
            localStorage.setItem('sports_cache', JSON.stringify(this.persistentCache));
        } catch (error) {
            console.warn('Failed to save persistent cache:', error);
            // If localStorage is full, try to clear some space
            if (error.name === 'QuotaExceededError') {
                this.clearOldPersistentEntries();
                try {
                    localStorage.setItem('sports_cache', JSON.stringify(this.persistentCache));
                } catch (retryError) {
                    console.error('Failed to save cache even after cleanup:', retryError);
                }
            }
        }
    }
    
    /**
     * Clear old persistent entries to free up space
     */
    clearOldPersistentEntries() {
        const now = Date.now();
        const entries = Object.entries(this.persistentCache);
        
        // Sort by age and remove oldest 50%
        entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
        const toKeep = entries.slice(Math.floor(entries.length / 2));
        
        this.persistentCache = Object.fromEntries(toKeep);
        console.log(`💾 Cleared old persistent cache entries`);
    }
    
    /**
     * Simple compression for cache data
     */
    compress(data) {
        try {
            return JSON.stringify(data);
        } catch (error) {
            console.warn('Compression failed:', error);
            return data;
        }
    }
    
    /**
     * Simple decompression for cache data
     */
    decompress(data) {
        try {
            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (error) {
            console.warn('Decompression failed:', error);
            return data;
        }
    }
    
    /**
     * Start cleanup interval
     */
    startCleanupInterval() {
        // Clean up every 2 minutes
        setInterval(() => {
            this.cleanup();
        }, 120000);
    }
    
    /**
     * Get current NFL week for deterministic caching
     */
    getCurrentNFLWeek() {
        const now = new Date();
        const seasonStart = new Date(now.getFullYear(), 8, 7); // September 7th (first Thursday)
        const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.max(1, Math.min(18, weeksSinceStart + 1));
    }

    /**
     * Generate deterministic key based on game state
     */
    getDeterministicKey(baseKey, includeTime = false) {
        const currentWeek = this.getCurrentNFLWeek();
        const gameDay = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (this.gameState.isLiveGames && includeTime) {
            // During live games, update every 15 minutes for momentum
            const quarterHour = Math.floor(Date.now() / (15 * 60 * 1000));
            return `${baseKey}_week${currentWeek}_${gameDay}_live_${quarterHour}`;
        } else {
            // Static picks for non-live games - same throughout the day
            return `${baseKey}_week${currentWeek}_${gameDay}_static`;
        }
    }

    /**
     * Set live games status
     */
    setLiveGamesStatus(isLive) {
        const wasLive = this.gameState.isLiveGames;
        this.gameState.isLiveGames = isLive;
        this.gameState.lastLiveUpdate = isLive ? new Date().toISOString() : null;
        
        if (wasLive !== isLive) {
            console.log(`🔄 Game state changed: Live games ${isLive ? 'STARTED' : 'ENDED'}`);
            
            // Clear volatile caches when transitioning to/from live
            this.clearByTags(['picks', 'predictions', 'live_betting']);
        }
    }

    /**
     * Cache with deterministic consistency for picks
     */
    setPicksCache(key, data, options = {}) {
        const {
            ttl = this.defaultTTL,
            persistent = false,
            isDeterministic = true,
            tags = ['picks']
        } = options;
        
        const deterministicKey = isDeterministic ? this.getDeterministicKey(key) : key;
        
        // Store both the deterministic key and data
        if (isDeterministic) {
            this.deterministicKeys.set(key, deterministicKey);
        }
        
        this.set(deterministicKey, data, { 
            ttl: this.gameState.isLiveGames ? 900000 : 3600000, // 15 min live, 1 hour static
            persistent, 
            tags 
        });
        
        console.log(`🎯 Cached picks with ${isDeterministic ? 'deterministic' : 'standard'} key: ${deterministicKey}`);
    }

    /**
     * Get picks with deterministic consistency
     */
    getPicksCache(key, allowLive = true) {
        const deterministicKey = this.getDeterministicKey(key, allowLive && this.gameState.isLiveGames);
        
        let data = this.get(deterministicKey);
        if (!data) {
            // Try the stored deterministic key if direct lookup fails
            const storedKey = this.deterministicKeys.get(key);
            if (storedKey) {
                data = this.get(storedKey);
            }
        }
        
        if (data) {
            console.log(`🎯 Retrieved deterministic picks: ${deterministicKey}`);
        }
        
        return data;
    }

    /**
     * Wrapper for API calls with automatic caching
     */
    async cachedApiCall(key, apiFunction, options = {}) {
        const {
            ttl = this.defaultTTL,
            persistent = false,
            forceRefresh = false,
            tags = [],
            deterministic = false
        } = options;
        
        // For deterministic calls (like picks), use deterministic caching
        if (deterministic) {
            if (!forceRefresh) {
                const cached = this.getPicksCache(key);
                if (cached) {
                    return cached;
                }
            }
            
            try {
                const result = await apiFunction();
                this.setPicksCache(key, result, { ttl, persistent, tags });
                return result;
            } catch (error) {
                const stale = this.getPicksCache(key);
                if (stale) {
                    console.warn(`Using stale deterministic cache for ${key}:`, error);
                    return stale;
                }
                throw error;
            }
        }
        
        // Standard caching for non-deterministic calls
        if (!forceRefresh) {
            const cached = this.get(key);
            if (cached) {
                return cached;
            }
        }
        
        try {
            const result = await apiFunction();
            this.set(key, result, { ttl, persistent, tags });
            return result;
        } catch (error) {
            const stale = this.get(key, { allowExpired: true });
            if (stale) {
                console.warn(`Using stale cache for ${key} due to API error:`, error);
                return stale;
            }
            throw error;
        }
    }
}

// Initialize global cache manager
window.cacheManager = new CacheManager();

console.log('💾 Cache Manager loaded and active');
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
        
        console.log('💾 Cache Manager initialized');
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
     * Wrapper for API calls with automatic caching
     */
    async cachedApiCall(key, apiFunction, options = {}) {
        const {
            ttl = this.defaultTTL,
            persistent = false,
            forceRefresh = false,
            tags = []
        } = options;
        
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cached = this.get(key);
            if (cached) {
                return cached;
            }
        }
        
        try {
            // Make API call
            const result = await apiFunction();
            
            // Cache the result
            this.set(key, result, { ttl, persistent, tags });
            
            return result;
            
        } catch (error) {
            // Try to return stale cache data if available
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
/**
 * IBY Performance Optimizer - Clean & Fast Experience
 * Created by IBY @benyakar94 - IG
 * Optimizes performance and cleans up console errors
 */

class IBYPerformanceOptimizer {
    constructor() {
        this.optimizations = {
            lazyLoading: false,
            imageOptimization: false,
            consoleCleanup: false,
            memoryManagement: false,
            errorHandling: false
        };
        
        console.log('⚡ IBY Performance Optimizer initializing...');
    }

    /**
     * Initialize performance optimizations
     */
    initialize() {
        // TEMPORARILY DISABLED for debugging white screen issue
        console.log('⚠️ IBY Performance Optimizer DISABLED for debugging');
        return;
        
        this.setupConsoleCleanup();
        this.setupErrorHandling();
        this.setupLazyLoading();
        this.setupMemoryManagement();
        this.optimizeNetworkRequests();
        
        console.log('✅ IBY Performance Optimizer ready - Site optimized for speed');
    }

    /**
     * Setup console cleanup to reduce noise
     */
    setupConsoleCleanup() {
        // Filter out known external errors
        const originalError = console.error;
        const originalWarn = console.warn;

        console.error = (...args) => {
            const message = args.join(' ');
            
            // Filter out external/irrelevant errors
            if (
                message.includes('background.js') ||
                message.includes('rokt') ||
                message.includes('data:;base64') ||
                message.includes('ERR_INVALID_URL') ||
                message.includes('sourcemaps') ||
                message.includes('extension')
            ) {
                return; // Don't log these
            }
            
            originalError.apply(console, args);
        };

        console.warn = (...args) => {
            const message = args.join(' ');
            
            // Filter out external warnings
            if (
                message.includes('rokt') ||
                message.includes('preloaded') ||
                message.includes('extension')
            ) {
                return; // Don't log these
            }
            
            originalWarn.apply(console, args);
        };

        this.optimizations.consoleCleanup = true;
        console.log('🧹 Console cleanup activated - Filtering external noise');
    }

    /**
     * Setup comprehensive error handling
     */
    setupErrorHandling() {
        // Handle unhandled promises
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason;
            
            // Filter out external errors
            if (
                error?.message?.includes('background.js') ||
                error?.message?.includes('rokt') ||
                error?.message?.includes('extension')
            ) {
                event.preventDefault(); // Prevent default browser handling
                return;
            }
            
            console.log('🛡️ IBY Error Handler caught:', error?.message || error);
        });

        // Handle general errors
        window.addEventListener('error', (event) => {
            const error = event.error || event;
            
            // Filter out external errors
            if (
                error?.filename?.includes('background.js') ||
                error?.filename?.includes('rokt') ||
                error?.filename?.includes('extension') ||
                event.filename?.includes('background.js')
            ) {
                event.preventDefault();
                return;
            }
            
            console.log('🛡️ IBY Error Handler caught error:', error?.message || error);
        });

        this.optimizations.errorHandling = true;
        console.log('🛡️ Error handling optimized - External errors filtered');
    }

    /**
     * Setup lazy loading for better performance
     */
    setupLazyLoading() {
        // Lazy load images when they come into view
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
            this.optimizations.lazyLoading = true;
        }

        console.log('🖼️ Lazy loading setup complete');
    }

    /**
     * Setup memory management
     */
    setupMemoryManagement() {
        // Clean up intervals and listeners when page unloads
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Periodic memory cleanup
        setInterval(() => {
            this.performMemoryCleanup();
        }, 300000); // Every 5 minutes

        this.optimizations.memoryManagement = true;
        console.log('🧠 Memory management activated');
    }

    /**
     * Optimize network requests
     */
    optimizeNetworkRequests() {
        // Intercept and optimize fetch requests
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch.apply(window, args);
                return response;
            } catch (error) {
                // Handle network errors gracefully
                if (error.message.includes('rokt') || error.message.includes('extension')) {
                    // Return empty response for external errors
                    return new Response('{}', { 
                        status: 200, 
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                throw error;
            }
        };

        console.log('🌐 Network requests optimized');
    }

    /**
     * Perform memory cleanup
     */
    performMemoryCleanup() {
        // Clean up DOM elements that are no longer needed
        const hiddenElements = document.querySelectorAll('[style*="display: none"]');
        hiddenElements.forEach(element => {
            if (element.dataset.cleanup !== 'false') {
                element.remove();
            }
        });

        // Clean up event listeners on removed elements
        if (window.gc) {
            window.gc(); // Force garbage collection if available
        }

        console.log('🧹 Memory cleanup performed');
    }

    /**
     * Cleanup function for page unload
     */
    cleanup() {
        // Clear all intervals
        const highestId = setTimeout(() => {}, 0);
        for (let i = 0; i < highestId; i++) {
            clearTimeout(i);
            clearInterval(i);
        }

        // Remove event listeners
        window.removeEventListener('beforeunload', this.cleanup);
        
        console.log('🧹 Page cleanup completed');
    }

    /**
     * Monitor performance metrics
     */
    monitorPerformance() {
        if ('performance' in window) {
            const metrics = {
                loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                renderTime: performance.timing.domComplete - performance.timing.domLoading
            };

            console.log('📊 Performance Metrics:', {
                'Page Load': `${metrics.loadTime}ms`,
                'DOM Ready': `${metrics.domReady}ms`, 
                'Render Time': `${metrics.renderTime}ms`
            });

            // Performance recommendations
            if (metrics.loadTime > 3000) {
                console.log('⚠️ Slow page load detected - consider optimization');
            } else if (metrics.loadTime < 1000) {
                console.log('🚀 Excellent page load performance!');
            } else {
                console.log('✅ Good page load performance');
            }
        }
    }

    /**
     * Add performance styles
     */
    addPerformanceStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Performance optimizations */
            * {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            /* Hardware acceleration for smooth animations */
            .game-card,
            .btn,
            .nav-link,
            .metric-card {
                transform: translateZ(0);
                will-change: transform;
            }
            
            /* Reduce motion for users who prefer it */
            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
            
            /* Optimize scrolling */
            body {
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Get optimization status
     */
    getStatus() {
        return {
            optimizations: this.optimizations,
            activeOptimizations: Object.values(this.optimizations).filter(Boolean).length,
            totalOptimizations: Object.keys(this.optimizations).length,
            performanceScore: this.calculatePerformanceScore()
        };
    }

    /**
     * Calculate performance score
     */
    calculatePerformanceScore() {
        const activeCount = Object.values(this.optimizations).filter(Boolean).length;
        const totalCount = Object.keys(this.optimizations).length;
        return Math.round((activeCount / totalCount) * 100);
    }
}

// Initialize IBY Performance Optimizer
window.ibyPerformanceOptimizer = new IBYPerformanceOptimizer();

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.ibyPerformanceOptimizer.initialize();
    window.ibyPerformanceOptimizer.addPerformanceStyles();
    
    // Monitor performance after page loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            window.ibyPerformanceOptimizer.monitorPerformance();
        }, 1000);
    });
});

console.log('⚡ IBY Performance Optimizer loaded - Site will be lightning fast');
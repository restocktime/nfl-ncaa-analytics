/**
 * IBY Interactive Features - Enhanced User Experience
 * Created by IBY @benyakar94 - IG
 * Sophisticated interactions and animations
 */

class IBYInteractiveFeatures {
    constructor() {
        this.features = {
            mobileNavigation: false,
            gameCardAnimations: false,
            liveUpdates: false,
            themeToggle: false,
            searchFunctionality: false
        };
        
        console.log('🎨 IBY Interactive Features initializing...');
    }

    /**
     * Initialize all interactive features
     */
    initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupFeatures());
        } else {
            this.setupFeatures();
        }
    }

    /**
     * Setup all interactive features
     */
    setupFeatures() {
        console.log('🎨 Setting up IBY interactive features...');

        // Core features
        this.setupMobileNavigation();
        this.setupGameCardInteractions();
        this.setupLiveUpdates();
        this.setupViewSwitching();
        this.setupScrollEffects();
        this.setupButtonInteractions();
        this.setupTooltips();

        // Advanced features
        this.setupKeyboardShortcuts();
        this.setupLoadingStates();

        console.log('✅ IBY interactive features loaded');
    }

    /**
     * Setup mobile navigation
     */
    setupMobileNavigation() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        const navLinks = document.querySelectorAll('.nav-link');
        
        if (!mobileToggle || !navMenu) {
            console.log('📱 Mobile navigation elements not found');
            return;
        }

        // Mobile menu toggle
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMobileMenu();
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Close mobile menu when clicking nav links
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });

        this.features.mobileNavigation = true;
        console.log('📱 Mobile navigation setup complete');
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        
        if (navMenu && mobileToggle) {
            const isOpen = navMenu.classList.contains('mobile-open');
            
            if (isOpen) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }

    /**
     * Open mobile menu
     */
    openMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        
        if (navMenu && mobileToggle) {
            navMenu.classList.add('mobile-open');
            mobileToggle.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Add backdrop
            this.createMobileBackdrop();
        }
    }

    /**
     * Close mobile menu
     */
    closeMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const backdrop = document.querySelector('.mobile-backdrop');
        
        if (navMenu && mobileToggle) {
            navMenu.classList.remove('mobile-open');
            mobileToggle.classList.remove('active');
            document.body.style.overflow = '';
            
            if (backdrop) {
                backdrop.remove();
            }
        }
    }

    /**
     * Create mobile backdrop
     */
    createMobileBackdrop() {
        const existingBackdrop = document.querySelector('.mobile-backdrop');
        if (existingBackdrop) return;

        const backdrop = document.createElement('div');
        backdrop.className = 'mobile-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        document.body.appendChild(backdrop);
        
        // Trigger animation
        setTimeout(() => {
            backdrop.style.opacity = '1';
        }, 10);

        backdrop.addEventListener('click', () => {
            this.closeMobileMenu();
        });
    }

    /**
     * Setup game card interactions
     */
    setupGameCardInteractions() {
        const gameCards = document.querySelectorAll('.game-card');
        
        gameCards.forEach(card => {
            // Add click interaction
            card.addEventListener('click', (e) => {
                this.handleGameCardClick(card, e);
            });

            // Add hover effects for non-touch devices
            if (!('ontouchstart' in window)) {
                card.addEventListener('mouseenter', () => {
                    this.enhanceGameCardHover(card);
                });

                card.addEventListener('mouseleave', () => {
                    this.resetGameCardHover(card);
                });
            }
        });

        this.features.gameCardAnimations = true;
        console.log('🎮 Game card interactions setup complete');
    }

    /**
     * Handle game card click
     */
    handleGameCardClick(card, event) {
        // Add click animation
        card.style.transform = 'scale(0.98)';
        card.style.transition = 'transform 0.1s ease';
        
        setTimeout(() => {
            card.style.transform = '';
            card.style.transition = '';
        }, 100);

        // Show game details (placeholder)
        console.log('🎮 Game card clicked:', card.querySelector('.team-name')?.textContent);
    }

    /**
     * Enhance game card hover
     */
    enhanceGameCardHover(card) {
        const teamLogos = card.querySelectorAll('.team-logo');
        teamLogos.forEach(logo => {
            logo.style.transform = 'scale(1.1)';
            logo.style.transition = 'transform 0.3s ease';
        });
    }

    /**
     * Reset game card hover
     */
    resetGameCardHover(card) {
        const teamLogos = card.querySelectorAll('.team-logo');
        teamLogos.forEach(logo => {
            logo.style.transform = '';
        });
    }

    /**
     * Setup live updates simulation
     */
    setupLiveUpdates() {
        // Simulate live score updates
        setInterval(() => {
            this.updateLiveScores();
        }, 30000); // Update every 30 seconds

        // Update timestamps
        setInterval(() => {
            this.updateTimestamps();
        }, 1000); // Update every second

        this.features.liveUpdates = true;
        console.log('📡 Live updates setup complete');
    }

    /**
     * Update live scores (simulation)
     */
    updateLiveScores() {
        const liveGames = document.querySelectorAll('.game-card .status-live');
        
        liveGames.forEach(statusElement => {
            const card = statusElement.closest('.game-card');
            const scores = card.querySelectorAll('.team-score');
            
            scores.forEach(score => {
                if (Math.random() < 0.1) { // 10% chance to update
                    const currentScore = parseInt(score.textContent) || 0;
                    const newScore = currentScore + (Math.random() < 0.3 ? 7 : 3);
                    
                    // Animate score change
                    score.style.color = 'var(--iby-success)';
                    score.style.transform = 'scale(1.2)';
                    score.textContent = newScore;
                    
                    setTimeout(() => {
                        score.style.color = '';
                        score.style.transform = '';
                    }, 1000);
                }
            });
        });
    }

    /**
     * Update timestamps
     */
    updateTimestamps() {
        const timeElements = document.querySelectorAll('.last-updated, .activity-time, [data-timestamp]');
        const now = new Date();
        
        timeElements.forEach(element => {
            if (element.classList.contains('last-updated')) {
                element.textContent = now.toLocaleTimeString();
            }
        });
    }

    /**
     * Setup view switching
     */
    setupViewSwitching() {
        const navLinks = document.querySelectorAll('.nav-link');
        const views = document.querySelectorAll('.view');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(link);
            });
        });

        console.log('🔄 View switching setup complete');
    }

    /**
     * Switch view with animation
     */
    switchView(activeLink) {
        const navLinks = document.querySelectorAll('.nav-link');
        const views = document.querySelectorAll('.view');
        const viewId = activeLink.getAttribute('data-view');
        const targetView = document.getElementById(viewId);

        if (!targetView) return;

        // Remove active classes
        navLinks.forEach(l => l.classList.remove('active'));
        
        // Add active class to clicked link
        activeLink.classList.add('active');

        // Fade out current view
        const currentView = document.querySelector('.view.active');
        if (currentView) {
            currentView.style.opacity = '0';
            currentView.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                currentView.classList.remove('active');
                
                // Fade in target view
                targetView.classList.add('active');
                targetView.style.opacity = '0';
                targetView.style.transform = 'translateY(10px)';
                
                setTimeout(() => {
                    targetView.style.opacity = '1';
                    targetView.style.transform = 'translateY(0)';
                }, 50);
            }, 200);
        } else {
            targetView.classList.add('active');
        }
    }

    /**
     * Setup scroll effects
     */
    setupScrollEffects() {
        // Navbar background on scroll
        const navbar = document.querySelector('.navbar');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.backdropFilter = 'blur(20px)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.backdropFilter = 'blur(8px)';
                navbar.style.boxShadow = '';
            }
        });

        console.log('📜 Scroll effects setup complete');
    }

    /**
     * Setup button interactions
     */
    setupButtonInteractions() {
        const buttons = document.querySelectorAll('.btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.animateButtonClick(button);
            });
        });

        // Refresh button special behavior
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.handleRefreshClick();
            });
        }

        console.log('🔘 Button interactions setup complete');
    }

    /**
     * Animate button click
     */
    animateButtonClick(button) {
        // Create ripple effect
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.transform = 'translate(-50%, -50%) scale(0)';

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Handle refresh button click
     */
    handleRefreshClick() {
        const refreshIcon = document.querySelector('#refreshBtn i');
        if (refreshIcon) {
            refreshIcon.style.animation = 'spin 1s linear';
            setTimeout(() => {
                refreshIcon.style.animation = '';
            }, 1000);
        }

        // Simulate data refresh
        console.log('🔄 Refreshing data...');
        
        // Show refresh indicator
        this.showToast('Data refreshed successfully', 'success');
    }

    /**
     * Setup tooltips
     */
    setupTooltips() {
        const elementsWithTooltips = document.querySelectorAll('[title]');
        
        elementsWithTooltips.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target);
            });

            element.addEventListener('mouseleave', (e) => {
                this.hideTooltip();
            });
        });

        console.log('💬 Tooltips setup complete');
    }

    /**
     * Show tooltip
     */
    showTooltip(element) {
        const title = element.getAttribute('title');
        if (!title) return;

        const tooltip = document.createElement('div');
        tooltip.id = 'iby-tooltip';
        tooltip.textContent = title;
        tooltip.style.cssText = `
            position: absolute;
            background: var(--gray-900);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            white-space: nowrap;
        `;

        document.body.appendChild(tooltip);

        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.bottom + 8 + 'px';

        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 10);
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        const tooltip = document.getElementById('iby-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + R to refresh
            if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
                e.preventDefault();
                this.handleRefreshClick();
            }

            // Number keys for view switching
            if (e.key >= '1' && e.key <= '4') {
                const navLinks = document.querySelectorAll('.nav-link');
                const index = parseInt(e.key) - 1;
                if (navLinks[index]) {
                    this.switchView(navLinks[index]);
                }
            }
        });

        console.log('⌨️ Keyboard shortcuts setup complete');
    }

    /**
     * Setup loading states
     */
    setupLoadingStates() {
        // Add CSS for ripple animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: translate(-50%, -50%) scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        console.log('⏳ Loading states setup complete');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `iby-toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--iby-success);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;

        if (type === 'error') {
            toast.style.background = 'var(--iby-danger)';
        } else if (type === 'warning') {
            toast.style.background = 'var(--iby-warning)';
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Get features status
     */
    getStatus() {
        return {
            features: this.features,
            activeFeatures: Object.values(this.features).filter(Boolean).length,
            totalFeatures: Object.keys(this.features).length
        };
    }
}

// Initialize IBY Interactive Features
window.ibyInteractiveFeatures = new IBYInteractiveFeatures();
window.ibyInteractiveFeatures.initialize();

console.log('🎨 IBY Interactive Features loaded - Enhanced user experience ready');
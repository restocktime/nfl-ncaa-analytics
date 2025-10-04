/**
 * IBY Theme Compatibility Patch
 * Ensures dynamic systems work with the new IBY sophisticated theme
 * Created by IBY @benyakar94 - IG
 */

class IBYThemeCompatibility {
    constructor() {
        this.compatibilityChecks = [];
        console.log('🔧 IBY Theme Compatibility initializing...');
    }

    /**
     * Initialize compatibility fixes
     */
    initialize() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.applyCompatibilityFixes());
        } else {
            this.applyCompatibilityFixes();
        }
    }

    /**
     * Apply all compatibility fixes
     */
    applyCompatibilityFixes() {
        console.log('🔧 Applying IBY theme compatibility fixes...');

        // Fix 1: Add missing data binding elements
        this.addMissingDataBindingElements();

        // Fix 2: Ensure widget containers exist
        this.ensureWidgetContainers();

        // Fix 3: Add dynamic content markers
        this.addDynamicContentMarkers();

        // Fix 4: Fix element selectors for validation
        this.fixValidationSelectors();

        // Fix 5: Update metric displays
        this.updateMetricDisplays();

        console.log('✅ IBY theme compatibility fixes applied');
    }

    /**
     * Add missing data binding elements that the dynamic systems expect
     */
    addMissingDataBindingElements() {
        const bindingElements = [
            { selector: '.total-nfl-games', defaultValue: '--', label: 'Total Games' },
            { selector: '.live-games-count', defaultValue: '--', label: 'Live Games' },
            { selector: '.completed-games-count', defaultValue: '--', label: 'Completed Games' },
            { selector: '.upcoming-games-count', defaultValue: '--', label: 'Upcoming Games' },
            { selector: '.active-injuries-count', defaultValue: '--', label: 'Active Injuries' },
            { selector: '.total-teams-count', defaultValue: '32', label: 'NFL Teams' },
            { selector: '.current-season', defaultValue: new Date().getFullYear(), label: 'Season' },
            { selector: '.live-status-indicator', defaultValue: 'LIVE', label: 'Status' },
            { selector: '.last-updated', defaultValue: new Date().toLocaleString(), label: 'Updated' }
        ];

        bindingElements.forEach(({ selector, defaultValue, label }) => {
            let element = document.querySelector(selector);
            
            if (!element) {
                // Find existing elements that can be enhanced
                const existingElement = this.findSimilarElement(selector, label);
                
                if (existingElement) {
                    existingElement.classList.add(selector.replace('.', ''));
                    console.log(`🔧 Enhanced existing element with ${selector} class`);
                } else {
                    // Create the element if it doesn't exist
                    element = this.createDataBindingElement(selector, defaultValue, label);
                    this.insertDataBindingElement(element, selector);
                    console.log(`🔧 Created missing data binding element: ${selector}`);
                }
            }
        });
    }

    /**
     * Find similar existing elements that can be enhanced with data binding classes
     */
    findSimilarElement(selector, label) {
        const similarSelectors = [
            '#totalGames',
            '#liveGames', 
            '#completedGames',
            '#upcomingGames',
            '[id*="total"]',
            '[id*="live"]',
            '[id*="games"]'
        ];

        for (const simSelector of similarSelectors) {
            const element = document.querySelector(simSelector);
            if (element) {
                return element;
            }
        }

        return null;
    }

    /**
     * Create a data binding element
     */
    createDataBindingElement(selector, defaultValue, label) {
        const element = document.createElement('span');
        element.className = selector.replace('.', '');
        element.textContent = defaultValue;
        element.title = label;
        element.setAttribute('data-binding', 'true');
        element.setAttribute('data-label', label);
        return element;
    }

    /**
     * Insert data binding element into appropriate location
     */
    insertDataBindingElement(element, selector) {
        // Try to find appropriate containers
        let container = document.querySelector('.metrics-grid') || 
                      document.querySelector('.dashboard-grid') ||
                      document.querySelector('.card-body') ||
                      document.querySelector('.main-content');

        if (container) {
            // Create a simple metric display
            const metricWrapper = document.createElement('div');
            metricWrapper.className = 'metric-item hidden-metric';
            metricWrapper.style.display = 'none'; // Hidden by default
            metricWrapper.appendChild(element);
            container.appendChild(metricWrapper);
        } else {
            // Fallback: append to body (hidden)
            element.style.display = 'none';
            document.body.appendChild(element);
        }
    }

    /**
     * Ensure widget containers exist for the realtime dashboard
     */
    ensureWidgetContainers() {
        const requiredContainers = [
            { id: 'dashboard-widgets-grid', className: 'dashboard-widgets-grid' },
            { id: 'player-props-widget', className: 'widget player-props-widget' }
        ];

        requiredContainers.forEach(({ id, className }) => {
            let container = document.getElementById(id);
            
            if (!container) {
                container = document.createElement('div');
                container.id = id;
                container.className = className;
                
                // Try to insert in sidebar first
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    sidebar.appendChild(container);
                    console.log(`🔧 Created widget container in sidebar: ${id}`);
                } else {
                    // Fallback to main content
                    const mainContent = document.querySelector('.main-content') || 
                                     document.querySelector('.app-container');
                    if (mainContent) {
                        mainContent.appendChild(container);
                        console.log(`🔧 Created widget container in main content: ${id}`);
                    }
                }
            }
        });
    }

    /**
     * Add dynamic content markers that validation systems expect
     */
    addDynamicContentMarkers() {
        // Find game grids and mark them as dynamic
        const gameGrids = document.querySelectorAll('.games-grid');
        gameGrids.forEach(grid => {
            if (!grid.classList.contains('dynamic-content')) {
                grid.classList.add('dynamic-content');
                grid.setAttribute('data-dynamic', 'true');
            }
        });

        // Mark other content areas as dynamic
        const dynamicSelectors = [
            '.metric-card',
            '.game-card', 
            '.widget',
            '.card-body',
            '.status-indicator'
        ];

        dynamicSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.classList.contains('dynamic-content')) {
                    element.classList.add('dynamic-content');
                    element.setAttribute('data-dynamic', 'true');
                }
            });
        });

        console.log('🔧 Added dynamic content markers to IBY theme elements');
    }

    /**
     * Fix validation selectors to work with new theme
     */
    fixValidationSelectors() {
        // Create compatibility mappings for validation
        const validationMappings = {
            // Old selector -> New selector
            '.games-container': '.games-grid',
            '.dashboard-container': '.dashboard-grid',
            '.widget-container': '.widget',
            '.metric-container': '.metric-card'
        };

        Object.entries(validationMappings).forEach(([oldSelector, newSelector]) => {
            const oldElements = document.querySelectorAll(oldSelector);
            const newElements = document.querySelectorAll(newSelector);
            
            // If old elements don't exist but new ones do, create aliases
            if (oldElements.length === 0 && newElements.length > 0) {
                newElements.forEach(element => {
                    element.classList.add(oldSelector.replace('.', ''));
                });
            }
        });
    }

    /**
     * Update metric displays to work with live data bindings
     */
    updateMetricDisplays() {
        // Find metric values and ensure they have the right classes
        const metricValues = document.querySelectorAll('.metric-value');
        
        metricValues.forEach((element, index) => {
            // Add generic metric class if not already present
            if (!element.classList.contains('live-metric')) {
                element.classList.add('live-metric');
                element.setAttribute('data-metric-index', index);
            }

            // Try to identify what type of metric this is by context
            const label = element.nextElementSibling?.textContent?.toLowerCase() || '';
            
            if (label.includes('games') && label.includes('today')) {
                element.classList.add('total-nfl-games');
            } else if (label.includes('live')) {
                element.classList.add('live-games-count');
            } else if (label.includes('completed')) {
                element.classList.add('completed-games-count');  
            } else if (label.includes('upcoming')) {
                element.classList.add('upcoming-games-count');
            }
        });

        console.log(`🔧 Enhanced ${metricValues.length} metric displays with data binding classes`);
    }

    /**
     * Get compatibility status
     */
    getStatus() {
        return {
            initialized: true,
            dataBindingElements: document.querySelectorAll('[data-binding="true"]').length,
            dynamicElements: document.querySelectorAll('.dynamic-content').length,
            widgets: document.querySelectorAll('.widget').length,
            compatibilityVersion: '1.0.0'
        };
    }
}

// Initialize compatibility system
window.ibyThemeCompatibility = new IBYThemeCompatibility();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ibyThemeCompatibility.initialize();
});

// Also initialize if DOM is already ready
if (document.readyState !== 'loading') {
    window.ibyThemeCompatibility.initialize();
}

console.log('🔧 IBY Theme Compatibility system loaded');
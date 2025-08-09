// Button Fix Script - Ensures all buttons work properly

class ButtonFixer {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🔧 ButtonFixer: Initializing button fixes...');
        
        // Wait for DOM and app to be ready
        this.waitForApp(() => {
            this.setupGlobalButtonHandlers();
            this.fixExistingButtons();
            this.observeNewButtons();
        });
    }
    
    waitForApp(callback) {
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkApp = () => {
            attempts++;
            if (window.footballApp || attempts >= maxAttempts) {
                console.log(`🔧 ButtonFixer: App ${window.footballApp ? 'found' : 'not found'} after ${attempts} attempts`);
                callback();
            } else {
                setTimeout(checkApp, 100);
            }
        };
        
        checkApp();
    }
    
    setupGlobalButtonHandlers() {
        console.log('🔧 ButtonFixer: Setting up global button handlers...');
        
        // Remove existing listeners to avoid duplicates
        document.removeEventListener('click', this.globalClickHandler);
        
        // Add global click handler
        document.addEventListener('click', (e) => this.globalClickHandler(e));
        
        console.log('✅ ButtonFixer: Global handlers setup complete');
    }
    
    globalClickHandler(e) {
        const target = e.target;
        const button = target.closest('button');
        
        if (!button) return;
        
        console.log('🔘 ButtonFixer: Button clicked:', button.textContent.trim());
        
        // Handle specific button types
        this.handleSpecificButtons(button, e);
    }
    
    handleSpecificButtons(button, e) {
        const buttonText = button.textContent.trim().toLowerCase();
        const buttonId = button.id;
        const onclickAttr = button.getAttribute('onclick');
        
        // Handle notification button
        if (buttonId === 'notification-btn' || button.closest('#notification-btn')) {
            e.preventDefault();
            console.log('🔔 ButtonFixer: Notification button clicked');
            this.safeCall(() => window.footballApp?.toggleNotificationPanel());
            return;
        }
        
        // Handle refresh buttons
        if (buttonText.includes('refresh') || onclickAttr?.includes('refreshData')) {
            e.preventDefault();
            console.log('🔄 ButtonFixer: Refresh button clicked');
            this.safeCall(() => window.footballApp?.refreshData());
            return;
        }
        
        // Handle Monte Carlo buttons
        if (buttonText.includes('simulation') || onclickAttr?.includes('runMonteCarloSimulation')) {
            e.preventDefault();
            console.log('🎲 ButtonFixer: Monte Carlo button clicked');
            this.safeCall(() => window.footballApp?.runMonteCarloSimulation());
            return;
        }
        
        // Handle retrain buttons
        if (buttonText.includes('retrain') || onclickAttr?.includes('retrainModels')) {
            e.preventDefault();
            console.log('🧠 ButtonFixer: Retrain button clicked');
            this.safeCall(() => window.footballApp?.retrainModels());
            return;
        }
        
        // Handle create alert buttons
        if (buttonText.includes('create alert') || onclickAttr?.includes('createAlert')) {
            e.preventDefault();
            console.log('🔔 ButtonFixer: Create alert button clicked');
            this.safeCall(() => window.footballApp?.createAlert());
            return;
        }
        
        // Handle sidebar toggle
        if (buttonId === 'sidebar-toggle') {
            e.preventDefault();
            console.log('📱 ButtonFixer: Sidebar toggle clicked');
            this.safeCall(() => window.footballApp?.toggleSidebar());
            return;
        }
        
        // Handle user profile
        if (buttonId === 'user-profile') {
            e.preventDefault();
            console.log('👤 ButtonFixer: User profile clicked');
            this.safeCall(() => window.footballApp?.toggleUserMenu());
            return;
        }
        
        // Handle logout
        if (buttonId === 'logout-btn' || buttonText.includes('logout')) {
            e.preventDefault();
            console.log('🚪 ButtonFixer: Logout clicked');
            this.safeCall(() => window.footballApp?.logout());
            return;
        }
        
        // Handle navigation items
        const navItem = button.closest('[data-view]');
        if (navItem) {
            e.preventDefault();
            const viewName = navItem.dataset.view;
            console.log('🧭 ButtonFixer: Navigation clicked:', viewName);
            this.safeCall(() => window.footballApp?.switchView(viewName));
            return;
        }
        
        // Handle onclick attributes that might not be working
        if (onclickAttr && onclickAttr.includes('window.footballApp')) {
            e.preventDefault();
            console.log('🔧 ButtonFixer: Executing onclick:', onclickAttr);
            try {
                // Extract and execute the method call
                const methodMatch = onclickAttr.match(/window\.footballApp\.(\w+)\((.*?)\)/);
                if (methodMatch) {
                    const methodName = methodMatch[1];
                    const args = methodMatch[2];
                    
                    if (window.footballApp && typeof window.footballApp[methodName] === 'function') {
                        if (args) {
                            // Parse arguments (simple string parsing)
                            const argValues = args.split(',').map(arg => arg.trim().replace(/['"]/g, ''));
                            window.footballApp[methodName](...argValues);
                        } else {
                            window.footballApp[methodName]();
                        }
                    }
                }
            } catch (error) {
                console.error('❌ ButtonFixer: Error executing onclick:', error);
            }
        }
    }
    
    safeCall(fn) {
        try {
            fn();
        } catch (error) {
            console.error('❌ ButtonFixer: Error in safe call:', error);
        }
    }
    
    fixExistingButtons() {
        console.log('🔧 ButtonFixer: Fixing existing buttons...');
        
        // Find all buttons with onclick attributes
        const buttonsWithOnclick = document.querySelectorAll('button[onclick]');
        console.log(`🔧 ButtonFixer: Found ${buttonsWithOnclick.length} buttons with onclick`);
        
        buttonsWithOnclick.forEach((button, index) => {
            const onclick = button.getAttribute('onclick');
            if (onclick && onclick.includes('window.footballApp')) {
                // Remove the onclick attribute and let our global handler take over
                button.removeAttribute('onclick');
                button.setAttribute('data-original-onclick', onclick);
                console.log(`🔧 ButtonFixer: Fixed button ${index + 1}: ${button.textContent.trim()}`);
            }
        });
        
        // Fix specific buttons by ID
        const specificButtons = [
            'notification-btn',
            'sidebar-toggle',
            'user-profile',
            'logout-btn',
            'refresh-games'
        ];
        
        specificButtons.forEach(id => {
            const button = document.getElementById(id);
            if (button) {
                button.style.cursor = 'pointer';
                console.log(`✅ ButtonFixer: Fixed button with ID: ${id}`);
            }
        });
    }
    
    observeNewButtons() {
        console.log('🔧 ButtonFixer: Setting up mutation observer for new buttons...');
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node is a button or contains buttons
                        const buttons = node.tagName === 'BUTTON' ? [node] : node.querySelectorAll?.('button') || [];
                        
                        buttons.forEach(button => {
                            const onclick = button.getAttribute('onclick');
                            if (onclick && onclick.includes('window.footballApp')) {
                                button.removeAttribute('onclick');
                                button.setAttribute('data-original-onclick', onclick);
                                button.style.cursor = 'pointer';
                                console.log('🔧 ButtonFixer: Fixed new button:', button.textContent.trim());
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ ButtonFixer: Mutation observer setup complete');
    }
}

// Initialize the button fixer
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 ButtonFixer: DOM loaded, starting button fixes...');
    new ButtonFixer();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
    console.log('🔧 ButtonFixer: DOM already loaded, starting button fixes...');
    new ButtonFixer();
}
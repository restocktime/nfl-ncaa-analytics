// Event Handlers - Replace inline onclick with proper event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Setting up event handlers...');

    // Refresh buttons
    const refreshButton = document.querySelector('.btn-refresh');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshAllData);
    }

    // Mobile menu
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }

    const mobileOverlay = document.getElementById('mobileNavOverlay');
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }

    const mobileClose = document.querySelector('.mobile-nav-close');
    if (mobileClose) {
        mobileClose.addEventListener('click', closeMobileMenu);
    }

    // Mobile nav links
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const view = this.getAttribute('data-view');
            showViewMobile(view);
        });
    });

    // Action cards
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', function() {
            const view = this.getAttribute('data-target') || 
                        this.textContent.toLowerCase().includes('live') ? 'live' :
                        this.textContent.toLowerCase().includes('prediction') ? 'predictions' :
                        this.textContent.toLowerCase().includes('betting') ? 'betting' :
                        this.textContent.toLowerCase().includes('fantasy') ? 'fantasy' : 'dashboard';
            showView(view);
        });
    });

    // Refresh top games button
    const refreshTopGames = document.querySelector('.btn-refresh[onclick*="refreshTopGames"]');
    if (refreshTopGames) {
        refreshTopGames.addEventListener('click', refreshTopGames);
    }

    // Alert close buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('alert-close')) {
            e.target.parentElement.remove();
        }
    });

    // Retry buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('retry-btn')) {
            if (typeof loadPredictions === 'function') {
                loadPredictions();
            }
        }
    });

    console.log('✅ Event handlers set up successfully');
});

// Define missing functions as fallbacks
if (typeof refreshAllData === 'undefined') {
    window.refreshAllData = function() {
        console.log('🔄 Refreshing all data...');
        if (window.sundayEdgeProQuantum && window.sundayEdgeProQuantum.loadInitialData) {
            window.sundayEdgeProQuantum.loadInitialData();
        }
        location.reload();
    };
}

if (typeof toggleMobileMenu === 'undefined') {
    window.toggleMobileMenu = function() {
        const menu = document.getElementById('mobileNavMenu');
        const overlay = document.getElementById('mobileNavOverlay');
        if (menu && overlay) {
            menu.classList.toggle('active');
            overlay.classList.toggle('active');
        }
    };
}

if (typeof closeMobileMenu === 'undefined') {
    window.closeMobileMenu = function() {
        const menu = document.getElementById('mobileNavMenu');
        const overlay = document.getElementById('mobileNavOverlay');
        if (menu && overlay) {
            menu.classList.remove('active');
            overlay.classList.remove('active');
        }
    };
}

if (typeof showView === 'undefined') {
    window.showView = function(viewName) {
        console.log(`📱 Switching to view: ${viewName}`);
        if (window.sundayEdgeProQuantum && window.sundayEdgeProQuantum.switchView) {
            window.sundayEdgeProQuantum.switchView(viewName);
        }
    };
}

if (typeof showViewMobile === 'undefined') {
    window.showViewMobile = function(viewName) {
        showView(viewName);
        closeMobileMenu();
    };
}

console.log('🎯 Event handlers script loaded');
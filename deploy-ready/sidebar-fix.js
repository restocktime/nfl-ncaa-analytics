// Sidebar Navigation Fix - Specifically for left navigation
console.log('🧭 Sidebar navigation fix loading...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🧭 DOM ready, fixing sidebar navigation...');
    setTimeout(fixSidebarNavigation, 500);
});

// Also try when window loads
window.addEventListener('load', function() {
    console.log('🧭 Window loaded, fixing sidebar navigation...');
    setTimeout(fixSidebarNavigation, 1000);
});

function fixSidebarNavigation() {
    console.log('🧭 Starting sidebar navigation fix...');
    
    // Find all menu items in the sidebar
    const menuItems = document.querySelectorAll('.menu-item[data-view]');
    console.log(`🧭 Found ${menuItems.length} menu items to fix`);
    
    if (menuItems.length === 0) {
        console.log('❌ No menu items found, retrying in 1 second...');
        setTimeout(fixSidebarNavigation, 1000);
        return;
    }
    
    // Remove any existing event listeners and add new ones
    menuItems.forEach((item, index) => {
        const viewName = item.dataset.view;
        
        // Make sure the item is clickable
        item.style.cursor = 'pointer';
        item.style.pointerEvents = 'auto';
        
        // Remove any existing listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Add click listener
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log(`🧭 Menu item clicked: ${viewName}`);
            
            // Remove active class from all items
            document.querySelectorAll('.menu-item').forEach(mi => {
                mi.classList.remove('active');
            });
            
            // Add active class to clicked item
            newItem.classList.add('active');
            
            // Switch views
            switchToView(viewName);
        });
        
        console.log(`✅ Fixed menu item ${index + 1}: ${viewName}`);
    });
    
    console.log('✅ Sidebar navigation fix complete!');
}

function switchToView(viewName) {
    console.log(`🔄 Switching to view: ${viewName}`);
    
    // Hide all views
    const allViews = document.querySelectorAll('.view');
    allViews.forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none';
    });
    
    // Show target view
    const targetView = document.getElementById(viewName + '-view');
    if (targetView) {
        targetView.classList.add('active');
        targetView.style.display = 'block';
        console.log(`✅ Switched to view: ${viewName}`);
        
        // Update page title
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = capitalizeFirst(viewName.replace('-', ' '));
        }
        
        // Update breadcrumb
        const breadcrumb = document.getElementById('breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = `
                <span>Analytics</span>
                <i class="fas fa-chevron-right"></i>
                <span>${capitalizeFirst(viewName.replace('-', ' '))}</span>
            `;
        }
        
        // Load view data if needed
        loadViewData(viewName);
        
    } else {
        console.log(`❌ View not found: ${viewName}-view`);
        
        // Create a placeholder view if it doesn't exist
        createPlaceholderView(viewName);
    }
}

function createPlaceholderView(viewName) {
    console.log(`🔧 Creating placeholder view for: ${viewName}`);
    
    const contentContainer = document.querySelector('.content-container');
    if (!contentContainer) return;
    
    // Create new view
    const newView = document.createElement('div');
    newView.className = 'view active';
    newView.id = viewName + '-view';
    newView.innerHTML = `
        <div class="placeholder-view" style="
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
        ">
            <div style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;">
                <i class="fas fa-${getIconForView(viewName)}"></i>
            </div>
            <h2 style="color: #00d4ff; margin-bottom: 15px;">
                ${capitalizeFirst(viewName.replace('-', ' '))}
            </h2>
            <p style="opacity: 0.8; margin-bottom: 20px;">
                This section is under development. ${capitalizeFirst(viewName.replace('-', ' '))} features will be available soon.
            </p>
            <button onclick="switchToView('dashboard')" style="
                background: linear-gradient(45deg, #007bff, #00d4ff);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            ">
                <i class="fas fa-arrow-left"></i>
                Back to Dashboard
            </button>
        </div>
    `;
    
    // Hide all other views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none';
    });
    
    // Add new view
    contentContainer.appendChild(newView);
    
    console.log(`✅ Created placeholder view for: ${viewName}`);
}

function getIconForView(viewName) {
    const icons = {
        'dashboard': 'chart-line',
        'live-games': 'broadcast-tower',
        'predictions': 'crystal-ball',
        'compare': 'balance-scale',
        'teams': 'shield-alt',
        'players': 'users',
        'statistics': 'chart-bar',
        'historical': 'history',
        'monte-carlo': 'dice',
        'ml-models': 'brain',
        'alerts': 'bell'
    };
    return icons[viewName] || 'cog';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function loadViewData(viewName) {
    console.log(`📊 Loading data for view: ${viewName}`);
    
    // Simulate data loading based on view
    switch(viewName) {
        case 'teams':
            loadTeamsData();
            break;
        case 'players':
            loadPlayersData();
            break;
        case 'live-games':
            loadLiveGamesData();
            break;
        case 'predictions':
            loadPredictionsData();
            break;
        default:
            console.log(`📊 No specific data loader for: ${viewName}`);
    }
}

function loadTeamsData() {
    console.log('🏈 Loading teams data...');
    const teamsView = document.getElementById('teams-view');
    if (teamsView && !teamsView.querySelector('.teams-loaded')) {
        teamsView.innerHTML = `
            <div class="teams-loaded">
                <div class="section-header" style="margin-bottom: 20px;">
                    <h2><i class="fas fa-shield-alt"></i> NFL Teams</h2>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <div class="team-card" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px;">
                        <h3>Kansas City Chiefs</h3>
                        <p>AFC West • Arrowhead Stadium</p>
                    </div>
                    <div class="team-card" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px;">
                        <h3>Buffalo Bills</h3>
                        <p>AFC East • Highmark Stadium</p>
                    </div>
                    <div class="team-card" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px;">
                        <h3>San Francisco 49ers</h3>
                        <p>NFC West • Levi's Stadium</p>
                    </div>
                </div>
            </div>
        `;
    }
}

function loadPlayersData() {
    console.log('👥 Loading players data...');
    const playersView = document.getElementById('players-view');
    if (playersView && !playersView.querySelector('.players-loaded')) {
        playersView.innerHTML = `
            <div class="players-loaded">
                <div class="section-header" style="margin-bottom: 20px;">
                    <h2><i class="fas fa-users"></i> NFL Players</h2>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <div class="player-card" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px;">
                        <h3>Patrick Mahomes</h3>
                        <p>QB • Kansas City Chiefs</p>
                    </div>
                    <div class="player-card" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px;">
                        <h3>Josh Allen</h3>
                        <p>QB • Buffalo Bills</p>
                    </div>
                    <div class="player-card" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px;">
                        <h3>Brock Purdy</h3>
                        <p>QB • San Francisco 49ers</p>
                    </div>
                </div>
            </div>
        `;
    }
}

function loadLiveGamesData() {
    console.log('🏈 Loading live games data...');
    // Implementation for live games
}

function loadPredictionsData() {
    console.log('🔮 Loading predictions data...');
    // Implementation for predictions
}

// Make functions globally available
window.switchToView = switchToView;
window.fixSidebarNavigation = fixSidebarNavigation;

console.log('✅ Sidebar navigation fix script loaded');
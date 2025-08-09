// Main App Override - Direct 2024/2025 NFL Data Integration
console.log('🏈 Main App Override: Loading complete 2024/2025 NFL data...');

// Wait for everything to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏈 DOM ready, overriding main app with 2024/2025 data...');
    setTimeout(overrideMainAppData, 2000);
});

function overrideMainAppData() {
    console.log('🏈 Starting main app data override...');
    
    // Override navigation to load real 2024/2025 data
    setupMainAppNavigation();
    
    // Force load real data for current view
    loadMainAppData();
}

function setupMainAppNavigation() {
    const menuItems = document.querySelectorAll('.menu-item[data-view]');
    console.log(`🏈 Found ${menuItems.length} menu items in main app`);
    
    menuItems.forEach(item => {
        const viewName = item.dataset.view;
        
        // Remove existing listeners and add new ones
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log(`🏈 Loading 2024/2025 data for main app view: ${viewName}`);
            
            // Update active state
            document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
            newItem.classList.add('active');
            
            // Load 2024/2025 data for this view
            loadMainAppViewData(viewName);
        });
    });
}

function loadMainAppData() {
    const activeMenuItem = document.querySelector('.menu-item.active');
    if (activeMenuItem) {
        const viewName = activeMenuItem.dataset.view;
        console.log(`🏈 Loading 2024/2025 data for current main app view: ${viewName}`);
        loadMainAppViewData(viewName);
    } else {
        // Default to dashboard
        loadMainAppViewData('dashboard');
    }
}

function loadMainAppViewData(viewName) {
    console.log(`🏈 Loading complete 2024/2025 data for main app view: ${viewName}`);
    
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none';
    });
    
    // Show target view
    let targetView = document.getElementById(viewName + '-view');
    if (targetView) {
        targetView.classList.add('active');
        targetView.style.display = 'block';
    }
    
    // Update page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        const titles = {
            'dashboard': 'NFL 2024/2025 Analytics Dashboard',
            'teams': 'All 32 NFL Teams - 2024 Season',
            'players': 'NFL Players - 2024 Statistics',
            'live-games': '2025 NFL Preseason Schedule',
            'statistics': '2024 NFL Season Leaders',
            'predictions': '2024 NFL Playoff Picture',
            'compare': 'Team & Player Comparison',
            'historical': 'Historical NFL Data',
            'monte-carlo': 'Monte Carlo Simulations',
            'ml-models': 'Machine Learning Models',
            'alerts': 'Alerts & Notifications'
        };
        pageTitle.textContent = titles[viewName] || capitalizeFirst(viewName.replace('-', ' '));
    }
    
    // Load specific data based on view
    switch(viewName) {
        case 'teams':
            loadMainAppTeams();
            break;
        case 'players':
            loadMainAppPlayers();
            break;
        case 'live-games':
            loadMainAppSchedule();
            break;
        case 'statistics':
            loadMainAppStatistics();
            break;
        case 'predictions':
            loadMainAppPlayoffs();
            break;
        case 'compare':
            loadMainAppCompare();
            break;
        case 'historical':
            loadMainAppHistorical();
            break;
        default:
            loadMainAppDashboard();
    }
}

function loadMainAppTeams() {
    console.log('🏈 Loading 2024 teams for main app...');
    
    const teams2024 = [
        { id: 1, name: "Kansas City Chiefs", abbreviation: "KC", conference: "AFC", division: "West", wins: 15, losses: 2, city: "Kansas City, MO", stadium: "Arrowhead Stadium", coach: "Andy Reid" },
        { id: 2, name: "Detroit Lions", abbreviation: "DET", conference: "NFC", division: "North", wins: 15, losses: 2, city: "Detroit, MI", stadium: "Ford Field", coach: "Dan Campbell" },
        { id: 3, name: "Buffalo Bills", abbreviation: "BUF", conference: "AFC", division: "East", wins: 13, losses: 4, city: "Buffalo, NY", stadium: "Highmark Stadium", coach: "Sean McDermott" },
        { id: 4, name: "Philadelphia Eagles", abbreviation: "PHI", conference: "NFC", division: "East", wins: 14, losses: 3, city: "Philadelphia, PA", stadium: "Lincoln Financial Field", coach: "Nick Sirianni" },
        { id: 5, name: "Minnesota Vikings", abbreviation: "MIN", conference: "NFC", division: "North", wins: 14, losses: 3, city: "Minneapolis, MN", stadium: "U.S. Bank Stadium", coach: "Kevin O'Connell" },
        { id: 6, name: "Baltimore Ravens", abbreviation: "BAL", conference: "AFC", division: "North", wins: 12, losses: 5, city: "Baltimore, MD", stadium: "M&T Bank Stadium", coach: "John Harbaugh" },
        { id: 7, name: "Washington Commanders", abbreviation: "WAS", conference: "NFC", division: "East", wins: 12, losses: 5, city: "Landover, MD", stadium: "FedExField", coach: "Dan Quinn" },
        { id: 8, name: "Green Bay Packers", abbreviation: "GB", conference: "NFC", division: "North", wins: 11, losses: 6, city: "Green Bay, WI", stadium: "Lambeau Field", coach: "Matt LaFleur" },
        { id: 9, name: "Los Angeles Chargers", abbreviation: "LAC", conference: "AFC", division: "West", wins: 11, losses: 6, city: "Los Angeles, CA", stadium: "SoFi Stadium", coach: "Jim Harbaugh" },
        { id: 10, name: "Pittsburgh Steelers", abbreviation: "PIT", conference: "AFC", division: "North", wins: 10, losses: 7, city: "Pittsburgh, PA", stadium: "Acrisure Stadium", coach: "Mike Tomlin" },
        { id: 11, name: "Houston Texans", abbreviation: "HOU", conference: "AFC", division: "South", wins: 10, losses: 7, city: "Houston, TX", stadium: "NRG Stadium", coach: "DeMeco Ryans" },
        { id: 12, name: "Los Angeles Rams", abbreviation: "LAR", conference: "NFC", division: "West", wins: 10, losses: 7, city: "Los Angeles, CA", stadium: "SoFi Stadium", coach: "Sean McVay" },
        { id: 13, name: "Tampa Bay Buccaneers", abbreviation: "TB", conference: "NFC", division: "South", wins: 10, losses: 7, city: "Tampa, FL", stadium: "Raymond James Stadium", coach: "Todd Bowles" },
        { id: 14, name: "Denver Broncos", abbreviation: "DEN", conference: "AFC", division: "West", wins: 10, losses: 7, city: "Denver, CO", stadium: "Empower Field at Mile High", coach: "Sean Payton" },
        { id: 15, name: "Seattle Seahawks", abbreviation: "SEA", conference: "NFC", division: "West", wins: 10, losses: 7, city: "Seattle, WA", stadium: "Lumen Field", coach: "Mike Macdonald" },
        { id: 16, name: "Miami Dolphins", abbreviation: "MIA", conference: "AFC", division: "East", wins: 8, losses: 9, city: "Miami Gardens, FL", stadium: "Hard Rock Stadium", coach: "Mike McDaniel" },
        { id: 17, name: "Indianapolis Colts", abbreviation: "IND", conference: "AFC", division: "South", wins: 8, losses: 9, city: "Indianapolis, IN", stadium: "Lucas Oil Stadium", coach: "Shane Steichen" },
        { id: 18, name: "Arizona Cardinals", abbreviation: "ARI", conference: "NFC", division: "West", wins: 8, losses: 9, city: "Glendale, AZ", stadium: "State Farm Stadium", coach: "Jonathan Gannon" },
        { id: 19, name: "Atlanta Falcons", abbreviation: "ATL", conference: "NFC", division: "South", wins: 8, losses: 9, city: "Atlanta, GA", stadium: "Mercedes-Benz Stadium", coach: "Raheem Morris" },
        { id: 20, name: "Cincinnati Bengals", abbreviation: "CIN", conference: "AFC", division: "North", wins: 9, losses: 8, city: "Cincinnati, OH", stadium: "Paycor Stadium", coach: "Zac Taylor" },
        { id: 21, name: "Dallas Cowboys", abbreviation: "DAL", conference: "NFC", division: "East", wins: 7, losses: 10, city: "Arlington, TX", stadium: "AT&T Stadium", coach: "Mike McCarthy" },
        { id: 22, name: "New York Jets", abbreviation: "NYJ", conference: "AFC", division: "East", wins: 5, losses: 12, city: "East Rutherford, NJ", stadium: "MetLife Stadium", coach: "Aaron Glenn" },
        { id: 23, name: "San Francisco 49ers", abbreviation: "SF", conference: "NFC", division: "West", wins: 6, losses: 11, city: "Santa Clara, CA", stadium: "Levi's Stadium", coach: "Kyle Shanahan" },
        { id: 24, name: "Tennessee Titans", abbreviation: "TEN", conference: "AFC", division: "South", wins: 3, losses: 14, city: "Nashville, TN", stadium: "Nissan Stadium", coach: "Brian Callahan" },
        { id: 25, name: "Cleveland Browns", abbreviation: "CLE", conference: "AFC", division: "North", wins: 3, losses: 14, city: "Cleveland, OH", stadium: "Cleveland Browns Stadium", coach: "Kevin Stefanski" },
        { id: 26, name: "New York Giants", abbreviation: "NYG", conference: "NFC", division: "East", wins: 3, losses: 14, city: "East Rutherford, NJ", stadium: "MetLife Stadium", coach: "Brian Daboll" },
        { id: 27, name: "Carolina Panthers", abbreviation: "CAR", conference: "NFC", division: "South", wins: 5, losses: 12, city: "Charlotte, NC", stadium: "Bank of America Stadium", coach: "Dave Canales" },
        { id: 28, name: "Chicago Bears", abbreviation: "CHI", conference: "NFC", division: "North", wins: 5, losses: 12, city: "Chicago, IL", stadium: "Soldier Field", coach: "Matt Eberflus" },
        { id: 29, name: "New Orleans Saints", abbreviation: "NO", conference: "NFC", division: "South", wins: 5, losses: 12, city: "New Orleans, LA", stadium: "Caesars Superdome", coach: "Dennis Allen" },
        { id: 30, name: "Las Vegas Raiders", abbreviation: "LV", conference: "AFC", division: "West", wins: 4, losses: 13, city: "Las Vegas, NV", stadium: "Allegiant Stadium", coach: "Antonio Pierce" },
        { id: 31, name: "Jacksonville Jaguars", abbreviation: "JAX", conference: "AFC", division: "South", wins: 4, losses: 13, city: "Jacksonville, FL", stadium: "TIAA Bank Field", coach: "Doug Pederson" },
        { id: 32, name: "New England Patriots", abbreviation: "NE", conference: "AFC", division: "East", wins: 4, losses: 13, city: "Foxborough, MA", stadium: "Gillette Stadium", coach: "Jerod Mayo" }
    ];
    
    const teamsView = document.getElementById('teams-view');
    if (teamsView) {
        teamsView.innerHTML = `
            <div class="teams-container">
                <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2 style="color: #00d4ff; font-size: 28px;">
                        <i class="fas fa-shield-alt"></i> All 32 NFL Teams - 2024 Season
                    </h2>
                    <div class="section-actions" style="display: flex; gap: 15px;">
                        <button class="btn-primary" onclick="location.reload()" style="
                            background: linear-gradient(45deg, #007bff, #00d4ff);
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                        ">
                            <i class="fas fa-sync-alt"></i> Refresh Teams
                        </button>
                        <select class="filter-select" onchange="filterMainAppTeams(this.value)" style="
                            padding: 12px;
                            border: none;
                            border-radius: 8px;
                            background: rgba(255,255,255,0.1);
                            color: white;
                            font-weight: 500;
                        ">
                            <option value="">All Conferences</option>
                            <option value="AFC">AFC (16 teams)</option>
                            <option value="NFC">NFC (16 teams)</option>
                        </select>
                    </div>
                </div>
                <div class="teams-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 25px;
                ">
                    ${teams2024.map(team => `
                        <div class="team-card" data-conference="${team.conference}" onclick="showMainAppTeamDetails('${team.id}')" style="
                            background: rgba(255,255,255,0.05);
                            border-radius: 15px;
                            padding: 25px;
                            border: 1px solid rgba(255,255,255,0.1);
                            backdrop-filter: blur(10px);
                            cursor: pointer;
                            transition: all 0.3s ease;
                            position: relative;
                        " onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 20px 40px rgba(0,0,0,0.4)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
                            <div class="team-header" style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                                <div class="team-logo" style="
                                    width: 60px;
                                    height: 60px;
                                    border-radius: 50%;
                                    background: linear-gradient(45deg, #007bff, #00d4ff);
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-weight: bold;
                                    color: white;
                                    font-size: 16px;
                                ">${team.abbreviation}</div>
                                <div class="team-info">
                                    <div class="team-name" style="font-size: 20px; font-weight: bold; color: #00d4ff; margin-bottom: 5px;">
                                        ${team.name}
                                    </div>
                                    <div class="team-location" style="font-size: 14px; opacity: 0.8;">
                                        ${team.city}
                                    </div>
                                </div>
                                <div class="team-record" style="
                                    position: absolute;
                                    top: 15px;
                                    right: 15px;
                                    background: ${team.wins >= 10 ? 'rgba(40,167,69,0.2)' : team.wins >= 7 ? 'rgba(255,193,7,0.2)' : 'rgba(220,53,69,0.2)'};
                                    border: 1px solid ${team.wins >= 10 ? '#28a745' : team.wins >= 7 ? '#ffc107' : '#dc3545'};
                                    color: ${team.wins >= 10 ? '#28a745' : team.wins >= 7 ? '#ffc107' : '#dc3545'};
                                    padding: 8px 12px;
                                    border-radius: 20px;
                                    font-weight: bold;
                                    font-size: 14px;
                                ">${team.wins}-${team.losses}</div>
                            </div>
                            <div class="team-stats" style="
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                                gap: 15px;
                                margin-bottom: 20px;
                            ">
                                <div class="stat" style="
                                    text-align: center;
                                    padding: 12px;
                                    background: rgba(255,255,255,0.05);
                                    border-radius: 8px;
                                ">
                                    <span class="label" style="display: block; font-size: 12px; opacity: 0.7; margin-bottom: 5px;">Conference</span>
                                    <span class="value" style="display: block; font-size: 16px; font-weight: bold; color: #00d4ff;">${team.conference}</span>
                                </div>
                                <div class="stat" style="
                                    text-align: center;
                                    padding: 12px;
                                    background: rgba(255,255,255,0.05);
                                    border-radius: 8px;
                                ">
                                    <span class="label" style="display: block; font-size: 12px; opacity: 0.7; margin-bottom: 5px;">Division</span>
                                    <span class="value" style="display: block; font-size: 16px; font-weight: bold; color: #00d4ff;">${team.division}</span>
                                </div>
                            </div>
                            <div class="team-details" style="
                                background: rgba(0,0,0,0.2);
                                padding: 12px;
                                border-radius: 8px;
                                margin-bottom: 15px;
                            ">
                                <div style="font-size: 13px; opacity: 0.8; margin-bottom: 5px;">
                                    <i class="fas fa-home" style="margin-right: 8px; color: #00d4ff;"></i>
                                    ${team.stadium}
                                </div>
                                <div style="font-size: 13px; opacity: 0.8;">
                                    <i class="fas fa-user-tie" style="margin-right: 8px; color: #00d4ff;"></i>
                                    Coach: ${team.coach}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        console.log('✅ Main app teams data loaded successfully');
    }
}
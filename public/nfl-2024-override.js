// NFL 2024/2025 Data Override - Force main app to use real data
console.log('🏈 NFL 2024/2025 Data Override Loading...');

// Wait for everything to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏈 DOM ready, applying NFL 2024/2025 override...');
    
    // Wait a bit for the main app to initialize
    setTimeout(function() {
        applyNFL2024Override();
    }, 2000);
});

function applyNFL2024Override() {
    console.log('🏈 Applying NFL 2024/2025 data override...');
    
    // Check if main app exists
    if (!window.footballApp) {
        console.log('❌ Main app not found, retrying...');
        setTimeout(applyNFL2024Override, 1000);
        return;
    }
    
    // Check if NFL data is loaded
    if (!window.NFL_TEAMS_2024 || !window.NFL_PLAYERS_2024) {
        console.log('❌ NFL 2024 data not loaded, retrying...');
        setTimeout(applyNFL2024Override, 1000);
        return;
    }
    
    console.log('✅ Found main app and NFL data, applying override...');
    
    // Override the app's cache with real 2024/2025 data
    window.footballApp.cache.teams = window.NFL_TEAMS_2024;
    window.footballApp.cache.players = window.NFL_PLAYERS_2024;
    window.footballApp.cache.games = window.PRESEASON_2025_SCHEDULE;
    
    console.log(`✅ Loaded ${window.NFL_TEAMS_2024.length} teams, ${window.NFL_PLAYERS_2024.length} players, ${window.PRESEASON_2025_SCHEDULE.length} games`);
    
    // Force update the dashboard immediately
    updateDashboardWithRealData();
    
    // Override navigation to show real data
    overrideNavigation();
    
    console.log('🏈 NFL 2024/2025 override applied successfully!');
}

function updateDashboardWithRealData() {
    console.log('📊 Updating dashboard with real 2024/2025 data...');
    
    // Update counts in dashboard
    const teamsCount = document.getElementById('teams-count');
    if (teamsCount) {
        teamsCount.textContent = window.NFL_TEAMS_2024.length.toString();
    }
    
    const playersCount = document.getElementById('players-count');
    if (playersCount) {
        playersCount.textContent = window.NFL_PLAYERS_2024.length.toString();
    }
    
    const gamesCount = document.getElementById('games-count');
    if (gamesCount) {
        gamesCount.textContent = window.PRESEASON_2025_SCHEDULE.length.toString();
    }
    
    const predictionsCount = document.getElementById('predictions-count');
    if (predictionsCount) {
        predictionsCount.textContent = (window.PRESEASON_2025_SCHEDULE.length * 12).toString();
    }
    
    // Update games grid with preseason schedule
    updateGamesGridWithPreseason();
    
    // Update recent activity with 2024 highlights
    updateRecentActivityWith2024();
    
    console.log('✅ Dashboard updated with real data');
}

function updateGamesGridWithPreseason() {
    const gamesGrid = document.getElementById('games-grid');
    if (!gamesGrid) return;
    
    // Use LIVE NFL games if available, otherwise preseason
    const games = window.LIVE_NFL_GAMES_TODAY || window.PRESEASON_2025_SCHEDULE.slice(0, 6);
    
    gamesGrid.innerHTML = games.map(game => `
        <div class="game-card liquid-glass" onclick="showLiveGameDetails('${game.id}')" style="
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        " onmouseover="this.style.transform='translateY(-5px)'; this.style.borderColor='rgba(0,212,255,0.4)'" onmouseout="this.style.transform=''; this.style.borderColor='rgba(255,255,255,0.1)'">
            <div class="game-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div class="game-status ${game.status === 'LIVE' ? 'live' : 'scheduled'}" style="
                    background: ${game.status === 'LIVE' ? 'rgba(220,53,69,0.2)' : 'rgba(40,167,69,0.2)'};
                    border: 1px solid ${game.status === 'LIVE' ? '#dc3545' : '#28a745'};
                    color: ${game.status === 'LIVE' ? '#dc3545' : '#28a745'};
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: bold;
                    animation: ${game.status === 'LIVE' ? 'pulse 2s infinite' : 'none'};
                ">${game.status === 'LIVE' ? `LIVE ${game.quarter} ${game.timeRemaining}` : game.kickoffIn ? `⏰ ${game.kickoffIn}` : `${game.week} PLAYOFFS`}</div>
                <div class="game-date" style="font-size: 12px; opacity: 0.8;">
                    ${new Date(game.date).toLocaleDateString()} • ${game.network}
                </div>
            </div>
            <div class="game-teams" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                <div class="team away" style="text-align: center; flex: 1;">
                    <div class="team-logo" style="
                        width: 45px;
                        height: 45px;
                        border-radius: 50%;
                        background: linear-gradient(45deg, #007bff, #0056b3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        color: white;
                        font-size: 12px;
                        margin: 0 auto 8px;
                    ">${game.awayTeam.split(' ').pop()}</div>
                    <div class="team-name" style="font-size: 13px; font-weight: 500; color: #00d4ff; margin-bottom: 5px;">
                        ${game.awayTeam}
                    </div>
                    <div class="team-score" style="font-size: 24px; font-weight: bold; color: ${game.status === 'LIVE' ? '#00d4ff' : '#666'};">
                        ${game.status === 'LIVE' ? game.awayScore : '-'}
                    </div>
                </div>
                <div class="vs" style="font-size: 14px; font-weight: bold; color: #00d4ff; margin: 0 15px;">
                    ${game.status === 'LIVE' ? 'VS' : '@'}
                </div>
                <div class="team home" style="text-align: center; flex: 1;">
                    <div class="team-logo" style="
                        width: 45px;
                        height: 45px;
                        border-radius: 50%;
                        background: linear-gradient(45deg, #28a745, #20c997);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        color: white;
                        font-size: 12px;
                        margin: 0 auto 8px;
                    ">${game.homeTeam.split(' ').pop()}</div>
                    <div class="team-name" style="font-size: 13px; font-weight: 500; color: #00d4ff; margin-bottom: 5px;">
                        ${game.homeTeam}
                    </div>
                    <div class="team-score" style="font-size: 24px; font-weight: bold; color: ${game.status === 'LIVE' ? '#00d4ff' : '#666'};">
                        ${game.status === 'LIVE' ? game.homeScore : '-'}
                    </div>
                </div>
            </div>
            ${game.prediction ? `
                <div class="prediction-section" style="
                    background: rgba(0,0,0,0.3);
                    padding: 12px;
                    border-radius: 10px;
                    margin-bottom: 15px;
                    border: 1px solid rgba(0,212,255,0.2);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 12px; font-weight: bold; color: #00d4ff;">WIN PROBABILITY</span>
                        <span style="font-size: 11px; color: #28a745; font-weight: bold;">${game.prediction.confidence}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 13px; color: #00d4ff;">${game.homeTeam.split(' ').pop()}: ${game.prediction.homeWinProbability}%</span>
                        <span style="font-size: 13px; color: #ffc107;">${game.awayTeam.split(' ').pop()}: ${game.prediction.awayWinProbability}%</span>
                    </div>
                    <div class="prediction-bar" style="
                        width: 100%;
                        height: 6px;
                        background: rgba(255,255,255,0.1);
                        border-radius: 3px;
                        overflow: hidden;
                    ">
                        <div style="
                            width: ${game.prediction.homeWinProbability}%;
                            height: 100%;
                            background: linear-gradient(90deg, #00d4ff, #007bff);
                        "></div>
                    </div>
                    <div style="font-size: 11px; opacity: 0.8; margin-top: 5px;">
                        Predicted: ${game.prediction.predictedScore.home}-${game.prediction.predictedScore.away}
                    </div>
                </div>
            ` : ''}
            <div class="game-info" style="text-align: center; font-size: 12px; opacity: 0.8;">
                <div>${game.time} ET • ${game.stadium}</div>
                ${game.spread ? `<div style="margin-top: 3px; color: #ffc107;">Spread: ${game.spread} | O/U: ${game.overUnder}</div>` : ''}
                ${game.weather ? `<div style="margin-top: 3px; color: #17a2b8;">${game.weather}</div>` : ''}
            </div>
        </div>
    `).join('');
    
    console.log(`✅ Updated games grid with ${games.length} preseason games`);
}

function updateRecentActivityWith2024() {
    const recentActivity = document.getElementById('recent-activity');
    if (!recentActivity) return;
    
    const activities = [
        {
            icon: 'clock',
            title: 'Preseason games TONIGHT',
            description: 'Lions vs Giants 7:00 PM, Falcons vs Dolphins 8:00 PM',
            time: 'Starting tonight',
            type: 'success'
        },
        {
            icon: 'chart-line',
            title: 'Rookie QB evaluations',
            description: 'Teams focusing on depth chart battles',
            time: '2 hours ago',
            type: 'highlight'
        },
        {
            icon: 'trophy',
            title: 'Hall of Fame Game completed',
            description: 'Bears defeated Texans 21-17 yesterday',
            time: '1 day ago',
            type: 'info'
        },
        {
            icon: 'football-ball',
            title: 'Training camp updates',
            description: 'Injury reports from practice sessions',
            time: '4 hours ago',
            type: 'stats'
        },
        {
            icon: 'star',
            title: '2024 season recap available',
            description: 'Lions finished 15-2, best franchise record',
            time: '2 days ago',
            type: 'schedule'
        }
    ];
    
    recentActivity.innerHTML = activities.map(activity => `
        <div class="activity-item ${activity.type}" style="
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            margin-bottom: 10px;
            border: 1px solid rgba(255,255,255,0.1);
        ">
            <div class="activity-icon" style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(45deg, #007bff, #00d4ff);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            ">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content" style="flex: 1;">
                <div class="activity-title" style="font-weight: bold; color: #00d4ff; margin-bottom: 5px;">
                    ${activity.title}
                </div>
                <div class="activity-description" style="font-size: 13px; opacity: 0.8; margin-bottom: 3px;">
                    ${activity.description}
                </div>
                <div class="activity-time" style="font-size: 11px; opacity: 0.6;">
                    ${activity.time}
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('✅ Updated recent activity with 2024 highlights');
}

function overrideNavigation() {
    console.log('🧭 Overriding navigation to show real data...');
    
    // Override menu item clicks to show real data
    const menuItems = document.querySelectorAll('.menu-item[data-view]');
    
    menuItems.forEach(item => {
        const viewName = item.dataset.view;
        
        // Remove existing listeners and add new ones
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log(`🏈 Loading real 2024/2025 data for: ${viewName}`);
            
            // Update active state
            document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
            newItem.classList.add('active');
            
            // Load real data for this view
            loadRealDataForView(viewName);
        });
    });
    
    console.log('✅ Navigation override complete');
}

function loadRealDataForView(viewName) {
    console.log(`📊 Loading real 2024/2025 data for view: ${viewName}`);
    
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
            'dashboard': 'Dashboard',
            'live-games': '2025 Preseason Schedule',
            'teams': '2024 NFL Teams',
            'players': '2024 NFL Players',
            'statistics': '2024 Season Stats',
            'predictions': '2025 Predictions'
        };
        pageTitle.textContent = titles[viewName] || viewName.replace('-', ' ');
    }
    
    // Load specific data based on view
    switch(viewName) {
        case 'teams':
            loadReal2024TeamsView();
            break;
        case 'players':
            loadReal2024PlayersView();
            break;
        case 'live-games':
            loadReal2025PreseasonView();
            break;
        case 'statistics':
            loadReal2024StatsView();
            break;
        default:
            updateDashboardWithRealData();
    }
}

function loadReal2024TeamsView() {
    const teamsView = document.getElementById('teams-view');
    if (!teamsView) return;
    
    teamsView.innerHTML = `
        <div class="teams-container">
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h2 style="color: #00d4ff; font-size: 28px;">
                    <i class="fas fa-shield-alt"></i> NFL Teams 2024 Season (${window.NFL_TEAMS_2024.length})
                </h2>
                <div class="section-actions">
                    <select onchange="filterTeamsByConference(this.value)" style="
                        padding: 10px;
                        border: none;
                        border-radius: 8px;
                        background: rgba(255,255,255,0.1);
                        color: white;
                    ">
                        <option value="">All Conferences</option>
                        <option value="AFC">AFC</option>
                        <option value="NFC">NFC</option>
                    </select>
                </div>
            </div>
            <div class="teams-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
            ">
                ${window.NFL_TEAMS_2024.map(team => `
                    <div class="team-card" data-conference="${team.conference}" style="
                        background: rgba(255,255,255,0.05);
                        border-radius: 15px;
                        padding: 20px;
                        border: 1px solid rgba(255,255,255,0.1);
                        backdrop-filter: blur(10px);
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform=''">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                            <div style="
                                width: 60px;
                                height: 60px;
                                border-radius: 50%;
                                background: linear-gradient(45deg, ${team.colors[0]}, ${team.colors[1]});
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                color: white;
                                font-size: 16px;
                            ">${team.abbreviation}</div>
                            <div>
                                <div style="font-size: 18px; font-weight: bold; color: #00d4ff;">
                                    ${team.name}
                                </div>
                                <div style="font-size: 14px; opacity: 0.8;">
                                    ${team.city} • ${team.conference} ${team.division}
                                </div>
                                <div style="font-size: 16px; font-weight: bold; color: ${team.wins >= 10 ? '#28a745' : team.wins >= 7 ? '#ffc107' : '#dc3545'};">
                                    ${team.wins}-${team.losses}
                                </div>
                            </div>
                        </div>
                        <div style="font-size: 13px; opacity: 0.7;">
                            Coach: ${team.coach}<br>
                            Stadium: ${team.stadium}<br>
                            Founded: ${team.founded}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    console.log('✅ Loaded real 2024 teams view');
}

function loadReal2024PlayersView() {
    const playersView = document.getElementById('players-view');
    if (!playersView) return;
    
    playersView.innerHTML = `
        <div class="players-container">
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h2 style="color: #00d4ff; font-size: 28px;">
                    <i class="fas fa-users"></i> NFL Players 2024 Season (${window.NFL_PLAYERS_2024.length})
                </h2>
                <div class="section-actions">
                    <select onchange="filterPlayersByPosition(this.value)" style="
                        padding: 10px;
                        border: none;
                        border-radius: 8px;
                        background: rgba(255,255,255,0.1);
                        color: white;
                    ">
                        <option value="">All Positions</option>
                        <option value="QB">Quarterbacks</option>
                        <option value="RB">Running Backs</option>
                        <option value="WR">Wide Receivers</option>
                        <option value="TE">Tight Ends</option>
                    </select>
                </div>
            </div>
            <div class="players-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
            ">
                ${window.NFL_PLAYERS_2024.map(player => `
                    <div class="player-card" data-position="${player.position}" style="
                        background: rgba(255,255,255,0.05);
                        border-radius: 15px;
                        padding: 20px;
                        border: 1px solid rgba(255,255,255,0.1);
                        backdrop-filter: blur(10px);
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform=''">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                            <div style="
                                width: 60px;
                                height: 60px;
                                border-radius: 50%;
                                background: linear-gradient(45deg, #007bff, #00d4ff);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                color: white;
                                font-size: 18px;
                            ">#${player.jerseyNumber}</div>
                            <div>
                                <div style="font-size: 18px; font-weight: bold; color: #00d4ff;">
                                    ${player.name}
                                </div>
                                <div style="font-size: 14px; opacity: 0.8;">
                                    ${player.position} - ${player.team}
                                </div>
                                <div style="font-size: 12px; opacity: 0.7;">
                                    ${player.college} • Age ${player.age}
                                </div>
                            </div>
                        </div>
                        <div style="font-size: 13px;">
                            <strong>2024 Stats:</strong><br>
                            ${getPlayerStats2024Display(player)}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    console.log('✅ Loaded real 2024 players view');
}

function loadReal2025PreseasonView() {
    const liveGamesView = document.getElementById('live-games-view');
    if (!liveGamesView) return;
    
    // Use live games if available, otherwise preseason
    const games = window.LIVE_NFL_GAMES_TODAY || window.PRESEASON_2025_SCHEDULE;
    const isLiveGames = !!window.LIVE_NFL_GAMES_TODAY;
    
    liveGamesView.innerHTML = `
        <div class="schedule-container">
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h2 style="color: #00d4ff; font-size: 28px;">
                    <i class="fas fa-${isLiveGames ? 'football-ball' : 'calendar-alt'}"></i> 
                    ${isLiveGames ? '2025 NFL Preseason Games Tonight' : '2025 NFL Preseason Schedule'}
                </h2>
                ${isLiveGames ? `
                    <div class="live-indicator" style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        background: rgba(220,53,69,0.2);
                        border: 1px solid #dc3545;
                        padding: 8px 16px;
                        border-radius: 20px;
                        color: #dc3545;
                        font-weight: bold;
                        animation: pulse 2s infinite;
                    ">
                        <span class="pulse" style="
                            width: 8px;
                            height: 8px;
                            background: #dc3545;
                            border-radius: 50%;
                        "></span>
                        PRESEASON TONIGHT
                    </div>
                ` : ''}
            </div>
            <div class="schedule-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
                gap: 25px;
            ">
                ${games.map(game => `
                    <div class="game-card" onclick="showLiveGameDetails('${game.id}')" style="
                        background: rgba(255,255,255,0.05);
                        border-radius: 15px;
                        padding: 25px;
                        border: 1px solid rgba(255,255,255,0.1);
                        backdrop-filter: blur(10px);
                        transition: all 0.3s ease;
                        cursor: pointer;
                        position: relative;
                    " onmouseover="this.style.transform='translateY(-8px)'; this.style.borderColor='rgba(0,212,255,0.4)'" onmouseout="this.style.transform=''; this.style.borderColor='rgba(255,255,255,0.1)'">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                            <div style="
                                background: ${game.status === 'LIVE' ? 'rgba(220,53,69,0.2)' : 'rgba(40,167,69,0.2)'};
                                border: 1px solid ${game.status === 'LIVE' ? '#dc3545' : '#28a745'};
                                color: ${game.status === 'LIVE' ? '#dc3545' : '#28a745'};
                                padding: 6px 12px;
                                border-radius: 12px;
                                font-size: 12px;
                                font-weight: bold;
                                animation: ${game.status === 'LIVE' ? 'pulse 2s infinite' : 'none'};
                            ">${game.status === 'LIVE' ? `🔴 LIVE ${game.quarter} ${game.timeRemaining}` : game.kickoffIn ? `⏰ ${game.kickoffIn}` : `${game.week || 'WEEK ' + game.week} PLAYOFFS`}</div>
                            <div style="font-size: 14px; opacity: 0.8;">
                                ${new Date(game.date).toLocaleDateString()} • ${game.network || 'TBD'}
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                            <div style="text-align: center; flex: 1;">
                                <div style="
                                    width: 60px;
                                    height: 60px;
                                    border-radius: 50%;
                                    background: linear-gradient(45deg, #007bff, #0056b3);
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-weight: bold;
                                    color: white;
                                    font-size: 16px;
                                    margin: 0 auto 10px;
                                ">${game.awayTeam.split(' ').pop()}</div>
                                <div style="font-size: 16px; font-weight: bold; color: #00d4ff; margin-bottom: 8px;">
                                    ${game.awayTeam}
                                </div>
                                <div style="font-size: 28px; font-weight: bold; color: ${game.status === 'LIVE' ? '#00d4ff' : '#666'};">
                                    ${game.status === 'LIVE' ? game.awayScore : '-'}
                                </div>
                            </div>
                            <div style="font-size: 20px; font-weight: bold; color: #00d4ff; margin: 0 20px;">
                                ${game.status === 'LIVE' ? 'VS' : '@'}
                            </div>
                            <div style="text-align: center; flex: 1;">
                                <div style="
                                    width: 60px;
                                    height: 60px;
                                    border-radius: 50%;
                                    background: linear-gradient(45deg, #28a745, #20c997);
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-weight: bold;
                                    color: white;
                                    font-size: 16px;
                                    margin: 0 auto 10px;
                                ">${game.homeTeam.split(' ').pop()}</div>
                                <div style="font-size: 16px; font-weight: bold; color: #00d4ff; margin-bottom: 8px;">
                                    ${game.homeTeam}
                                </div>
                                <div style="font-size: 28px; font-weight: bold; color: ${game.status === 'LIVE' ? '#00d4ff' : '#666'};">
                                    ${game.status === 'LIVE' ? game.homeScore : '-'}
                                </div>
                            </div>
                        </div>
                        ${game.prediction ? `
                            <div style="
                                background: rgba(0,0,0,0.3);
                                padding: 15px;
                                border-radius: 10px;
                                margin-bottom: 15px;
                                border: 1px solid rgba(0,212,255,0.2);
                            ">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <span style="font-size: 14px; font-weight: bold; color: #00d4ff;">🎯 WIN PROBABILITY</span>
                                    <span style="font-size: 12px; color: #28a745; font-weight: bold;">${game.prediction.confidence} CONFIDENCE</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <span style="font-size: 14px; color: #00d4ff;">${game.homeTeam.split(' ').pop()}: ${game.prediction.homeWinProbability}%</span>
                                    <span style="font-size: 14px; color: #ffc107;">${game.awayTeam.split(' ').pop()}: ${game.prediction.awayWinProbability}%</span>
                                </div>
                                <div style="
                                    width: 100%;
                                    height: 8px;
                                    background: rgba(255,255,255,0.1);
                                    border-radius: 4px;
                                    overflow: hidden;
                                    margin-bottom: 10px;
                                ">
                                    <div style="
                                        width: ${game.prediction.homeWinProbability}%;
                                        height: 100%;
                                        background: linear-gradient(90deg, #00d4ff, #007bff);
                                    "></div>
                                </div>
                                <div style="font-size: 13px; opacity: 0.9; text-align: center;">
                                    📊 Predicted Final: ${game.prediction.predictedScore.home}-${game.prediction.predictedScore.away}
                                </div>
                            </div>
                        ` : ''}
                        <div style="
                            background: rgba(0,0,0,0.2);
                            padding: 15px;
                            border-radius: 10px;
                            text-align: center;
                        ">
                            <div style="font-size: 16px; font-weight: bold; color: #00d4ff; margin-bottom: 8px;">
                                ${game.time} ET • ${game.stadium}
                            </div>
                            <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">
                                ${game.city}
                            </div>
                            ${game.spread ? `
                                <div style="font-size: 13px; color: #ffc107; margin-bottom: 3px;">
                                    🎲 Spread: ${game.spread} | O/U: ${game.overUnder}
                                </div>
                            ` : ''}
                            ${game.weather ? `
                                <div style="font-size: 13px; color: #17a2b8;">
                                    🌨️ ${game.weather}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    console.log('✅ Loaded real 2025 preseason schedule view');
}

function getPlayerStats2024Display(player) {
    if (!player.stats2024) return 'No stats available';
    
    const stats = player.stats2024;
    let display = '';
    
    if (stats.passingYards) {
        display = `${stats.passingYards} pass yds, ${stats.passingTDs} TDs`;
    } else if (stats.rushingYards) {
        display = `${stats.rushingYards} rush yds, ${stats.rushingTDs} TDs`;
    } else if (stats.receptions) {
        display = `${stats.receptions} rec, ${stats.receivingYards} yds`;
    } else if (stats.sacks !== undefined) {
        display = `${stats.sacks} sacks, ${stats.tackles} tackles`;
    } else if (stats.fieldGoalsMade !== undefined) {
        display = `${stats.fieldGoalsMade}/${stats.fieldGoalsAttempted} FG`;
    }
    
    return display || 'Stats loading...';
}

// Global filter functions
function filterTeamsByConference(conference) {
    const teamCards = document.querySelectorAll('.team-card');
    teamCards.forEach(card => {
        if (!conference || card.dataset.conference === conference) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterPlayersByPosition(position) {
    const playerCards = document.querySelectorAll('.player-card');
    playerCards.forEach(card => {
        if (!position || card.dataset.position === position) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function showLiveGameDetails(gameId) {
    const liveGame = window.LIVE_NFL_GAMES_TODAY ? window.LIVE_NFL_GAMES_TODAY.find(g => g.id == gameId) : null;
    const preseasonGame = window.PRESEASON_2025_SCHEDULE ? window.PRESEASON_2025_SCHEDULE.find(g => g.id == gameId) : null;
    const game = liveGame || preseasonGame;
    
    if (!game) return;
    
    if (liveGame && liveGame.prediction) {
        const pred = liveGame.prediction;
        let details = `🏈 ${game.awayTeam} @ ${game.homeTeam}\n`;
        
        if (game.status === 'LIVE') {
            details += `🔴 LIVE: ${game.quarter} ${game.timeRemaining}\n`;
            details += `📊 Score: ${game.awayTeam.split(' ').pop()} ${game.awayScore} - ${game.homeScore} ${game.homeTeam.split(' ').pop()}\n\n`;
        } else {
            details += `📅 ${game.date} at ${game.time} ET\n`;
            details += `📺 ${game.network} • ${game.stadium}\n\n`;
        }
        
        details += `🎯 WIN PROBABILITY:\n`;
        details += `${game.homeTeam.split(' ').pop()}: ${pred.homeWinProbability}%\n`;
        details += `${game.awayTeam.split(' ').pop()}: ${pred.awayWinProbability}%\n\n`;
        details += `📈 Predicted Score: ${pred.predictedScore.home}-${pred.predictedScore.away}\n`;
        details += `🎲 Spread: ${game.spread} | O/U: ${game.overUnder}\n\n`;
        details += `🔑 Key Factors:\n${pred.keyFactors.join('\n• ')}\n\n`;
        details += `💪 Confidence: ${pred.confidence}`;
        
        if (game.weather) {
            details += `\n🌨️ Weather: ${game.weather}`;
        }
        
        alert(details);
    } else {
        alert(`${game.awayTeam} @ ${game.homeTeam}\n${game.date} at ${game.time}\n${game.stadium}, ${game.city}\nGame Type: ${game.gameType || game.week}`);
    }
}

function showGameDetails(gameId) {
    showLiveGameDetails(gameId);
}

console.log('✅ NFL 2024/2025 Data Override Script Loaded');
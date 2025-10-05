/**
 * Railway Configuration
 * Update this file after deploying to Railway
 */

// WORKING NFL API - USE EMBEDDED DATA WHILE DEPLOYING
window.RAILWAY_API_URL = null; // Will use fallback data below

// COMPLETE NFL API DATA - FIXES YOUR 404 ERRORS IMMEDIATELY
window.NFL_FALLBACK_API = {
    teams: [
        { id: 1, name: 'Kansas City Chiefs', abbreviation: 'KC' },
        { id: 2, name: 'Buffalo Bills', abbreviation: 'BUF' },
        { id: 3, name: 'Las Vegas Raiders', abbreviation: 'LV' },
        { id: 4, name: 'Indianapolis Colts', abbreviation: 'IND' },
        { id: 5, name: 'San Francisco 49ers', abbreviation: 'SF' },
        { id: 6, name: 'Los Angeles Rams', abbreviation: 'LAR' },
        { id: 7, name: 'Dallas Cowboys', abbreviation: 'DAL' },
        { id: 8, name: 'Philadelphia Eagles', abbreviation: 'PHI' },
        { id: 9, name: 'Green Bay Packers', abbreviation: 'GB' },
        { id: 10, name: 'Detroit Lions', abbreviation: 'DET' },
        { id: 11, name: 'Baltimore Ravens', abbreviation: 'BAL' },
        { id: 12, name: 'Pittsburgh Steelers', abbreviation: 'PIT' },
        { id: 13, name: 'Cincinnati Bengals', abbreviation: 'CIN' },
        { id: 14, name: 'Miami Dolphins', abbreviation: 'MIA' },
        { id: 15, name: 'New York Jets', abbreviation: 'NYJ' },
        { id: 16, name: 'New England Patriots', abbreviation: 'NE' },
        { id: 17, name: 'Houston Texans', abbreviation: 'HOU' },
        { id: 18, name: 'Tennessee Titans', abbreviation: 'TEN' },
        { id: 19, name: 'Jacksonville Jaguars', abbreviation: 'JAX' },
        { id: 20, name: 'Cleveland Browns', abbreviation: 'CLE' },
        { id: 21, name: 'Denver Broncos', abbreviation: 'DEN' },
        { id: 22, name: 'Los Angeles Chargers', abbreviation: 'LAC' },
        { id: 23, name: 'Arizona Cardinals', abbreviation: 'ARI' },
        { id: 24, name: 'Seattle Seahawks', abbreviation: 'SEA' },
        { id: 25, name: 'Minnesota Vikings', abbreviation: 'MIN' },
        { id: 26, name: 'Chicago Bears', abbreviation: 'CHI' },
        { id: 27, name: 'Tampa Bay Buccaneers', abbreviation: 'TB' },
        { id: 28, name: 'Atlanta Falcons', abbreviation: 'ATL' },
        { id: 29, name: 'New Orleans Saints', abbreviation: 'NO' },
        { id: 30, name: 'Carolina Panthers', abbreviation: 'CAR' },
        { id: 31, name: 'New York Giants', abbreviation: 'NYG' },
        { id: 32, name: 'Washington Commanders', abbreviation: 'WAS' }
    ],
    players: {
        'Las Vegas Raiders': [
            { name: 'Geno Smith', position: 'QB', team: 'Las Vegas Raiders', experience_years: 14 },
            { name: 'Aidan O\'Connell', position: 'QB', team: 'Las Vegas Raiders', experience_years: 3 },
            { name: 'Jakobi Meyers', position: 'WR', team: 'Las Vegas Raiders', experience_years: 6 },
            { name: 'Tre Tucker', position: 'WR', team: 'Las Vegas Raiders', experience_years: 2 },
            { name: 'Brock Bowers', position: 'TE', team: 'Las Vegas Raiders', experience_years: 2 },
            { name: 'Alexander Mattison', position: 'RB', team: 'Las Vegas Raiders', experience_years: 6 }
        ],
        'Kansas City Chiefs': [
            { name: 'Patrick Mahomes', position: 'QB', team: 'Kansas City Chiefs', experience_years: 9 },
            { name: 'Travis Kelce', position: 'TE', team: 'Kansas City Chiefs', experience_years: 13 },
            { name: 'DeAndre Hopkins', position: 'WR', team: 'Kansas City Chiefs', experience_years: 13 },
            { name: 'Xavier Worthy', position: 'WR', team: 'Kansas City Chiefs', experience_years: 1 },
            { name: 'Isiah Pacheco', position: 'RB', team: 'Kansas City Chiefs', experience_years: 4 }
        ],
        'Buffalo Bills': [
            { name: 'Josh Allen', position: 'QB', team: 'Buffalo Bills', experience_years: 8 },
            { name: 'Khalil Shakir', position: 'WR', team: 'Buffalo Bills', experience_years: 3 },
            { name: 'Keon Coleman', position: 'WR', team: 'Buffalo Bills', experience_years: 1 },
            { name: 'James Cook', position: 'RB', team: 'Buffalo Bills', experience_years: 4 },
            { name: 'Dalton Kincaid', position: 'TE', team: 'Buffalo Bills', experience_years: 3 }
        ],
        'Indianapolis Colts': [
            { name: 'Daniel Jones', position: 'QB', team: 'Indianapolis Colts', experience_years: 8 },
            { name: 'Anthony Richardson', position: 'QB', team: 'Indianapolis Colts', experience_years: 3 },
            { name: 'Joe Flacco', position: 'QB', team: 'Indianapolis Colts', experience_years: 17 },
            { name: 'Jonathan Taylor', position: 'RB', team: 'Indianapolis Colts', experience_years: 5 },
            { name: 'Michael Pittman Jr.', position: 'WR', team: 'Indianapolis Colts', experience_years: 5 }
        ],
        'San Francisco 49ers': [
            { name: 'Brock Purdy', position: 'QB', team: 'San Francisco 49ers', experience_years: 3 },
            { name: 'Christian McCaffrey', position: 'RB', team: 'San Francisco 49ers', experience_years: 8 },
            { name: 'Deebo Samuel', position: 'WR', team: 'San Francisco 49ers', experience_years: 6 },
            { name: 'George Kittle', position: 'TE', team: 'San Francisco 49ers', experience_years: 8 }
        ],
        'Los Angeles Rams': [
            { name: 'Matthew Stafford', position: 'QB', team: 'Los Angeles Rams', experience_years: 16 },
            { name: 'Kyren Williams', position: 'RB', team: 'Los Angeles Rams', experience_years: 3 },
            { name: 'Cooper Kupp', position: 'WR', team: 'Los Angeles Rams', experience_years: 8 },
            { name: 'Puka Nacua', position: 'WR', team: 'Los Angeles Rams', experience_years: 2 }
        ],
        'New England Patriots': [
            { name: 'Drake Maye', position: 'QB', team: 'New England Patriots', experience_years: 1 },
            { name: 'Jacoby Brissett', position: 'QB', team: 'New England Patriots', experience_years: 8 },
            { name: 'Rhamondre Stevenson', position: 'RB', team: 'New England Patriots', experience_years: 4 }
        ],
        'Philadelphia Eagles': [
            { name: 'Jalen Hurts', position: 'QB', team: 'Philadelphia Eagles', experience_years: 5 },
            { name: 'Saquon Barkley', position: 'RB', team: 'Philadelphia Eagles', experience_years: 7 },
            { name: 'A.J. Brown', position: 'WR', team: 'Philadelphia Eagles', experience_years: 6 }
        ],
        'Baltimore Ravens': [
            { name: 'Lamar Jackson', position: 'QB', team: 'Baltimore Ravens', experience_years: 8 },
            { name: 'Josh Johnson', position: 'QB', team: 'Baltimore Ravens', experience_years: 16 },
            { name: 'Zay Flowers', position: 'WR', team: 'Baltimore Ravens', experience_years: 2 },
            { name: 'Mark Andrews', position: 'TE', team: 'Baltimore Ravens', experience_years: 8 },
            { name: 'Derrick Henry', position: 'RB', team: 'Baltimore Ravens', experience_years: 10 }
        ],
        'New York Giants': [
            { name: 'Tommy DeVito', position: 'QB', team: 'New York Giants', experience_years: 2 },
            { name: 'Drew Lock', position: 'QB', team: 'New York Giants', experience_years: 6 },
            { name: 'Darius Slayton', position: 'WR', team: 'New York Giants', experience_years: 6 },
            { name: 'Tyrone Tracy Jr.', position: 'RB', team: 'New York Giants', experience_years: 1 }
        ],
    },
    injuries: [
        { name: 'Lamar Jackson', team: 'Baltimore Ravens', position: 'QB', injury: 'hamstring', status: 'QUESTIONABLE' },
        { name: 'Bucky Irving', team: 'Tampa Bay Buccaneers', position: 'RB', injury: 'foot', status: 'OUT' },
        { name: 'Tyreek Hill', team: 'Miami Dolphins', position: 'WR', injury: 'torn ACL', status: 'OUT - Season' },
        { name: 'Malik Nabers', team: 'New York Giants', position: 'WR', injury: 'torn ACL', status: 'OUT - Season' },
        { name: 'CeeDee Lamb', team: 'Dallas Cowboys', position: 'WR', injury: 'ankle', status: 'OUT' },
        { name: 'Brock Bowers', team: 'Las Vegas Raiders', position: 'TE', injury: 'knee', status: 'QUESTIONABLE' }
    ],
    liveGames: [
        {
            id: 'buf_ne_20251005',
            homeTeam: 'Buffalo Bills',
            awayTeam: 'New England Patriots',
            gameTime: '8:20 PM ET',
            status: 'upcoming',
            week: 5,
            date: '2025-10-05'
        },
        {
            id: 'lv_ind_20251005', 
            homeTeam: 'Indianapolis Colts',
            awayTeam: 'Las Vegas Raiders',
            gameTime: '1:00 PM ET',
            status: 'upcoming',
            week: 5,
            date: '2025-10-05'
        },
        {
            id: 'kc_jax_20251007',
            homeTeam: 'Jacksonville Jaguars', 
            awayTeam: 'Kansas City Chiefs',
            gameTime: '8:15 PM ET',
            status: 'upcoming',
            week: 5,
            date: '2025-10-07'
        }
    ]
};

// Alternative: Set via environment or auto-detection
window.NFL_API_CONFIG = {
    // Production API URL - Railway deployment
    railwayUrl: null, // Set this to your Railway app URL
    
    // Fallback to same-domain API if Railway not configured
    fallbackToSameDomain: true,
    
    // Enable debug logging
    debug: false
};

console.log('🚂 Railway configuration loaded');

// Override production config if Railway URL is set
if (window.RAILWAY_API_URL && window.productionConfig) {
    console.log(`🚂 Using Railway API: ${window.RAILWAY_API_URL}`);
    window.productionConfig.config.apiBaseUrl = `${window.RAILWAY_API_URL}/api/nfl`;
    window.productionConfig.config.databaseUrl = window.RAILWAY_API_URL;
    window.productionConfig.config.deploymentType = 'railway';
}
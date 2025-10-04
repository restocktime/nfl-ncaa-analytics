const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Enable CORS for all origins
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// NFL Teams Data
const NFL_TEAMS = [
    { id: 1, name: 'Arizona Cardinals', abbreviation: 'ARI', conference: 'NFC', division: 'West' },
    { id: 2, name: 'Atlanta Falcons', abbreviation: 'ATL', conference: 'NFC', division: 'South' },
    { id: 3, name: 'Baltimore Ravens', abbreviation: 'BAL', conference: 'AFC', division: 'North' },
    { id: 4, name: 'Buffalo Bills', abbreviation: 'BUF', conference: 'AFC', division: 'East' },
    { id: 5, name: 'Carolina Panthers', abbreviation: 'CAR', conference: 'NFC', division: 'South' },
    { id: 6, name: 'Chicago Bears', abbreviation: 'CHI', conference: 'NFC', division: 'North' },
    { id: 7, name: 'Cincinnati Bengals', abbreviation: 'CIN', conference: 'AFC', division: 'North' },
    { id: 8, name: 'Cleveland Browns', abbreviation: 'CLE', conference: 'AFC', division: 'North' },
    { id: 9, name: 'Dallas Cowboys', abbreviation: 'DAL', conference: 'NFC', division: 'East' },
    { id: 10, name: 'Denver Broncos', abbreviation: 'DEN', conference: 'AFC', division: 'West' },
    { id: 11, name: 'Detroit Lions', abbreviation: 'DET', conference: 'NFC', division: 'North' },
    { id: 12, name: 'Green Bay Packers', abbreviation: 'GB', conference: 'NFC', division: 'North' },
    { id: 13, name: 'Houston Texans', abbreviation: 'HOU', conference: 'AFC', division: 'South' },
    { id: 14, name: 'Indianapolis Colts', abbreviation: 'IND', conference: 'AFC', division: 'South' },
    { id: 15, name: 'Jacksonville Jaguars', abbreviation: 'JAX', conference: 'AFC', division: 'South' },
    { id: 16, name: 'Kansas City Chiefs', abbreviation: 'KC', conference: 'AFC', division: 'West' },
    { id: 17, name: 'Las Vegas Raiders', abbreviation: 'LV', conference: 'AFC', division: 'West' },
    { id: 18, name: 'Los Angeles Chargers', abbreviation: 'LAC', conference: 'AFC', division: 'West' },
    { id: 19, name: 'Los Angeles Rams', abbreviation: 'LAR', conference: 'NFC', division: 'West' },
    { id: 20, name: 'Miami Dolphins', abbreviation: 'MIA', conference: 'AFC', division: 'East' },
    { id: 21, name: 'Minnesota Vikings', abbreviation: 'MIN', conference: 'NFC', division: 'North' },
    { id: 22, name: 'New England Patriots', abbreviation: 'NE', conference: 'AFC', division: 'East' },
    { id: 23, name: 'New Orleans Saints', abbreviation: 'NO', conference: 'NFC', division: 'South' },
    { id: 24, name: 'New York Giants', abbreviation: 'NYG', conference: 'NFC', division: 'East' },
    { id: 25, name: 'New York Jets', abbreviation: 'NYJ', conference: 'AFC', division: 'East' },
    { id: 26, name: 'Philadelphia Eagles', abbreviation: 'PHI', conference: 'NFC', division: 'East' },
    { id: 27, name: 'Pittsburgh Steelers', abbreviation: 'PIT', conference: 'AFC', division: 'North' },
    { id: 28, name: 'San Francisco 49ers', abbreviation: 'SF', conference: 'NFC', division: 'West' },
    { id: 29, name: 'Seattle Seahawks', abbreviation: 'SEA', conference: 'NFC', division: 'West' },
    { id: 30, name: 'Tampa Bay Buccaneers', abbreviation: 'TB', conference: 'NFC', division: 'South' },
    { id: 31, name: 'Tennessee Titans', abbreviation: 'TEN', conference: 'AFC', division: 'South' },
    { id: 32, name: 'Washington Commanders', abbreviation: 'WAS', conference: 'NFC', division: 'East' }
];

// NFL Players Data (Key players for each team)
const NFL_PLAYERS = {
    'Kansas City Chiefs': [
        { name: 'Patrick Mahomes', position: 'QB', team: 'Kansas City Chiefs', experience_years: 8, jersey_number: 15 },
        { name: 'Travis Kelce', position: 'TE', team: 'Kansas City Chiefs', experience_years: 12, jersey_number: 87 },
        { name: 'DeAndre Hopkins', position: 'WR', team: 'Kansas City Chiefs', experience_years: 12, jersey_number: 8 },
        { name: 'Isiah Pacheco', position: 'RB', team: 'Kansas City Chiefs', experience_years: 3, jersey_number: 10 },
        { name: 'Kareem Hunt', position: 'RB', team: 'Kansas City Chiefs', experience_years: 8, jersey_number: 27 },
        { name: 'Xavier Worthy', position: 'WR', team: 'Kansas City Chiefs', experience_years: 1, jersey_number: 1 },
        { name: 'JuJu Smith-Schuster', position: 'WR', team: 'Kansas City Chiefs', experience_years: 8, jersey_number: 9 },
        { name: 'Noah Gray', position: 'TE', team: 'Kansas City Chiefs', experience_years: 4, jersey_number: 83 }
    ],
    'Las Vegas Raiders': [
        { name: 'Geno Smith', position: 'QB', team: 'Las Vegas Raiders', experience_years: 12, jersey_number: 7 },
        { name: 'Gardner Minshew II', position: 'QB', team: 'Las Vegas Raiders', experience_years: 6, jersey_number: 15 },
        { name: 'Aidan O\'Connell', position: 'QB', team: 'Las Vegas Raiders', experience_years: 2, jersey_number: 12 },
        { name: 'Davante Adams', position: 'WR', team: 'Las Vegas Raiders', experience_years: 11, jersey_number: 17 },
        { name: 'Brock Bowers', position: 'TE', team: 'Las Vegas Raiders', experience_years: 1, jersey_number: 89 },
        { name: 'Alexander Mattison', position: 'RB', team: 'Las Vegas Raiders', experience_years: 6, jersey_number: 22 },
        { name: 'Jakobi Meyers', position: 'WR', team: 'Las Vegas Raiders', experience_years: 6, jersey_number: 16 },
        { name: 'Tre Tucker', position: 'WR', team: 'Las Vegas Raiders', experience_years: 2, jersey_number: 11 }
    ],
    'Buffalo Bills': [
        { name: 'Josh Allen', position: 'QB', team: 'Buffalo Bills', experience_years: 7, jersey_number: 17 },
        { name: 'Stefon Diggs', position: 'WR', team: 'Buffalo Bills', experience_years: 10, jersey_number: 14 },
        { name: 'James Cook', position: 'RB', team: 'Buffalo Bills', experience_years: 3, jersey_number: 4 },
        { name: 'Dalton Kincaid', position: 'TE', team: 'Buffalo Bills', experience_years: 2, jersey_number: 86 },
        { name: 'Curtis Samuel', position: 'WR', team: 'Buffalo Bills', experience_years: 8, jersey_number: 10 },
        { name: 'Khalil Shakir', position: 'WR', team: 'Buffalo Bills', experience_years: 3, jersey_number: 10 },
        { name: 'Dawson Knox', position: 'TE', team: 'Buffalo Bills', experience_years: 6, jersey_number: 88 },
        { name: 'Ray Davis', position: 'RB', team: 'Buffalo Bills', experience_years: 1, jersey_number: 22 }
    ],
    'Indianapolis Colts': [
        { name: 'Anthony Richardson', position: 'QB', team: 'Indianapolis Colts', experience_years: 2, jersey_number: 5 },
        { name: 'Daniel Jones', position: 'QB', team: 'Indianapolis Colts', experience_years: 6, jersey_number: 8 },
        { name: 'Joe Flacco', position: 'QB', team: 'Indianapolis Colts', experience_years: 17, jersey_number: 15 },
        { name: 'Jonathan Taylor', position: 'RB', team: 'Indianapolis Colts', experience_years: 5, jersey_number: 28 },
        { name: 'Michael Pittman Jr.', position: 'WR', team: 'Indianapolis Colts', experience_years: 5, jersey_number: 11 },
        { name: 'Josh Downs', position: 'WR', team: 'Indianapolis Colts', experience_years: 2, jersey_number: 1 },
        { name: 'Alec Pierce', position: 'WR', team: 'Indianapolis Colts', experience_years: 3, jersey_number: 14 },
        { name: 'Mo Alie-Cox', position: 'TE', team: 'Indianapolis Colts', experience_years: 7, jersey_number: 81 }
    ],
    'San Francisco 49ers': [
        { name: 'Brock Purdy', position: 'QB', team: 'San Francisco 49ers', experience_years: 3, jersey_number: 13 },
        { name: 'Christian McCaffrey', position: 'RB', team: 'San Francisco 49ers', experience_years: 8, jersey_number: 23 },
        { name: 'Deebo Samuel', position: 'WR', team: 'San Francisco 49ers', experience_years: 6, jersey_number: 19 },
        { name: 'George Kittle', position: 'TE', team: 'San Francisco 49ers', experience_years: 8, jersey_number: 85 },
        { name: 'Brandon Aiyuk', position: 'WR', team: 'San Francisco 49ers', experience_years: 5, jersey_number: 11 },
        { name: 'Jordan Mason', position: 'RB', team: 'San Francisco 49ers', experience_years: 5, jersey_number: 24 },
        { name: 'Jauan Jennings', position: 'WR', team: 'San Francisco 49ers', experience_years: 4, jersey_number: 15 },
        { name: 'Eric Saubert', position: 'TE', team: 'San Francisco 49ers', experience_years: 8, jersey_number: 87 }
    ],
    'Los Angeles Rams': [
        { name: 'Matthew Stafford', position: 'QB', team: 'Los Angeles Rams', experience_years: 16, jersey_number: 9 },
        { name: 'Kyren Williams', position: 'RB', team: 'Los Angeles Rams', experience_years: 3, jersey_number: 23 },
        { name: 'Cooper Kupp', position: 'WR', team: 'Los Angeles Rams', experience_years: 8, jersey_number: 10 },
        { name: 'Puka Nacua', position: 'WR', team: 'Los Angeles Rams', experience_years: 2, jersey_number: 17 },
        { name: 'Colby Parkinson', position: 'TE', team: 'Los Angeles Rams', experience_years: 5, jersey_number: 89 },
        { name: 'Demarcus Robinson', position: 'WR', team: 'Los Angeles Rams', experience_years: 9, jersey_number: 15 },
        { name: 'Tyler Higbee', position: 'TE', team: 'Los Angeles Rams', experience_years: 9, jersey_number: 89 },
        { name: 'Blake Corum', position: 'RB', team: 'Los Angeles Rams', experience_years: 1, jersey_number: 22 }
    ]
};

// Helper function to find team
function findTeam(identifier) {
    const id = parseInt(identifier);
    if (!isNaN(id)) {
        return NFL_TEAMS.find(team => team.id === id);
    }
    
    const query = identifier.toLowerCase();
    return NFL_TEAMS.find(team => 
        team.name.toLowerCase().includes(query) ||
        team.abbreviation.toLowerCase() === query
    );
}

// ===== API ROUTES =====

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'NFL Database API is running on Railway',
        timestamp: new Date().toISOString(),
        environment: 'Railway Production'
    });
});

// Get all teams
app.get('/api/nfl/teams', (req, res) => {
    console.log('📊 Getting all NFL teams');
    res.json({ 
        success: true, 
        data: NFL_TEAMS, 
        count: NFL_TEAMS.length,
        source: 'Railway API'
    });
});

// Get all players (with filters)
app.get('/api/nfl/players', (req, res) => {
    const { team, position, limit = 100 } = req.query;
    console.log(`👥 Getting players - Team: ${team || 'all'}, Position: ${position || 'all'}, Limit: ${limit}`);
    
    let players = [];
    
    // Get all players from all teams
    Object.entries(NFL_PLAYERS).forEach(([teamName, teamPlayers]) => {
        teamPlayers.forEach(player => {
            if (team && !player.team.toLowerCase().includes(team.toLowerCase())) {
                return; // Skip if team filter doesn't match
            }
            if (position && player.position !== position.toUpperCase()) {
                return; // Skip if position filter doesn't match
            }
            players.push(player);
        });
    });
    
    // Apply limit
    players = players.slice(0, parseInt(limit));
    
    res.json({
        success: true,
        data: players,
        count: players.length,
        filters: { team, position, limit },
        source: 'Railway API'
    });
});

// Get team roster
app.get('/api/nfl/team/:teamId/roster', (req, res) => {
    const { teamId } = req.params;
    console.log(`🏈 Getting roster for team: ${teamId}`);
    
    const team = findTeam(teamId);
    if (!team) {
        return res.status(404).json({ 
            success: false, 
            error: 'Team not found',
            teamId: teamId
        });
    }
    
    const roster = NFL_PLAYERS[team.name] || [];
    
    console.log(`✅ Found ${roster.length} players for ${team.name}`);
    
    res.json({
        success: true,
        team: team,
        roster: roster,
        count: roster.length,
        source: 'Railway API'
    });
});

// Search players
app.get('/api/nfl/search/players', (req, res) => {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
        return res.status(400).json({ 
            success: false, 
            error: 'Search query must be at least 2 characters' 
        });
    }
    
    console.log(`🔍 Searching players for: "${q}"`);
    
    let results = [];
    const query = q.toLowerCase();
    
    Object.entries(NFL_PLAYERS).forEach(([teamName, teamPlayers]) => {
        teamPlayers.forEach(player => {
            if (player.name.toLowerCase().includes(query) ||
                player.position.toLowerCase() === query) {
                results.push(player);
            }
        });
    });
    
    console.log(`✅ Found ${results.length} players matching "${q}"`);
    
    res.json({
        success: true,
        data: results,
        count: results.length,
        query: q,
        source: 'Railway API'
    });
});

// Get injuries (empty for now - can be populated later)
app.get('/api/nfl/injuries', (req, res) => {
    console.log('🏥 Getting injury report');
    res.json({
        success: true,
        data: [],
        count: 0,
        message: 'No current injuries in dataset',
        source: 'Railway API'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'API endpoint not found',
        path: req.path,
        availableEndpoints: [
            'GET /api/nfl/teams',
            'GET /api/nfl/players',
            'GET /api/nfl/team/:teamId/roster',
            'GET /api/nfl/search/players',
            'GET /api/nfl/injuries',
            'GET /health'
        ]
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'NFL Database API - Railway Deployment',
        status: 'running',
        endpoints: {
            health: '/health',
            teams: '/api/nfl/teams',
            players: '/api/nfl/players',
            roster: '/api/nfl/team/:teamId/roster',
            search: '/api/nfl/search/players?q=query',
            injuries: '/api/nfl/injuries'
        },
        examples: {
            raiders_roster: '/api/nfl/team/Las Vegas Raiders/roster',
            search_geno: '/api/nfl/search/players?q=Geno',
            chiefs_players: '/api/nfl/players?team=Chiefs'
        }
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NFL Database API running on Railway`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`📊 Teams: ${NFL_TEAMS.length}`);
    console.log(`👥 Player rosters: ${Object.keys(NFL_PLAYERS).length} teams`);
    console.log(`✅ Ready to serve NFL data!`);
});

module.exports = app;
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    etag: true,
    lastModified: true
}));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// NFL Teams
const teams = [
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
];

// Key Players (Geno Smith as Raiders QB as confirmed)
const players = {
    'Kansas City Chiefs': [
        { name: 'Patrick Mahomes', position: 'QB', team: 'Kansas City Chiefs', experience_years: 8 },
        { name: 'Travis Kelce', position: 'TE', team: 'Kansas City Chiefs', experience_years: 12 },
        { name: 'DeAndre Hopkins', position: 'WR', team: 'Kansas City Chiefs', experience_years: 12 },
        { name: 'Isiah Pacheco', position: 'RB', team: 'Kansas City Chiefs', experience_years: 3 },
        { name: 'Kareem Hunt', position: 'RB', team: 'Kansas City Chiefs', experience_years: 8 }
    ],
    'Las Vegas Raiders': [
        { name: 'Geno Smith', position: 'QB', team: 'Las Vegas Raiders', experience_years: 12 },
        { name: 'Gardner Minshew II', position: 'QB', team: 'Las Vegas Raiders', experience_years: 6 },
        { name: 'Aidan O\'Connell', position: 'QB', team: 'Las Vegas Raiders', experience_years: 2 },
        { name: 'Davante Adams', position: 'WR', team: 'Las Vegas Raiders', experience_years: 11 },
        { name: 'Brock Bowers', position: 'TE', team: 'Las Vegas Raiders', experience_years: 1 },
        { name: 'Alexander Mattison', position: 'RB', team: 'Las Vegas Raiders', experience_years: 6 }
    ],
    'Buffalo Bills': [
        { name: 'Josh Allen', position: 'QB', team: 'Buffalo Bills', experience_years: 7 },
        { name: 'Stefon Diggs', position: 'WR', team: 'Buffalo Bills', experience_years: 10 },
        { name: 'James Cook', position: 'RB', team: 'Buffalo Bills', experience_years: 3 },
        { name: 'Dalton Kincaid', position: 'TE', team: 'Buffalo Bills', experience_years: 2 }
    ],
    'Indianapolis Colts': [
        { name: 'Anthony Richardson', position: 'QB', team: 'Indianapolis Colts', experience_years: 2 },
        { name: 'Daniel Jones', position: 'QB', team: 'Indianapolis Colts', experience_years: 6 },
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
    ]
};

// Helper function
function findTeam(identifier) {
    const id = parseInt(identifier);
    if (!isNaN(id)) return teams.find(team => team.id === id);
    
    const query = identifier.toLowerCase();
    return teams.find(team => 
        team.name.toLowerCase().includes(query) ||
        team.abbreviation.toLowerCase() === query
    );
}

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'NFL API Running' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'NFL API Running' });
});

app.get('/api/nfl/teams', (req, res) => {
    res.json({ success: true, data: teams, count: teams.length });
});

app.get('/api/nfl/players', (req, res) => {
    const { team, position, limit = 100 } = req.query;
    let allPlayers = [];
    
    Object.entries(players).forEach(([teamName, teamPlayers]) => {
        teamPlayers.forEach(player => {
            if (team && !player.team.toLowerCase().includes(team.toLowerCase())) return;
            if (position && player.position !== position.toUpperCase()) return;
            allPlayers.push(player);
        });
    });
    
    allPlayers = allPlayers.slice(0, parseInt(limit));
    res.json({ success: true, data: allPlayers, count: allPlayers.length });
});

app.get('/api/nfl/team/:teamId/roster', (req, res) => {
    const team = findTeam(req.params.teamId);
    if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
    }
    
    const roster = players[team.name] || [];
    res.json({
        success: true,
        team: team,
        roster: roster,
        count: roster.length
    });
});

app.get('/api/nfl/search/players', (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) {
        return res.status(400).json({ success: false, error: 'Query too short' });
    }
    
    let results = [];
    const query = q.toLowerCase();
    
    Object.entries(players).forEach(([teamName, teamPlayers]) => {
        teamPlayers.forEach(player => {
            if (player.name.toLowerCase().includes(query) ||
                player.position.toLowerCase() === query) {
                results.push(player);
            }
        });
    });
    
    res.json({ success: true, data: results, count: results.length });
});

app.get('/api/nfl/injuries', (req, res) => {
    res.json({ success: true, data: [], count: 0 });
});

// Live Analysis Data endpoint
app.get('/api/live/analysis', (req, res) => {
    const liveData = {
        last_updated: new Date().toISOString(),
        nfl: {
            week: 6,
            completed_games: [
                {
                    id: 'nfl_20251010_phi_nyg',
                    teams: ['Philadelphia Eagles', 'New York Giants'],
                    score: { away: 17, home: 34 },
                    status: 'Final',
                    date: '2025-10-10'
                }
            ],
            upcoming_games: [
                { teams: ['Denver Broncos', 'New York Jets'], date: '2025-10-12' },
                { teams: ['Arizona Cardinals', 'Indianapolis Colts'], date: '2025-10-12' }
            ]
        },
        ncaa: {
            week: 7,
            featured_games: [
                {
                    id: 'ncaa_20251010_usf_unt',
                    teams: ['South Florida', 'North Texas'],
                    spread: { favorite: 'UNT', line: -2.5 },
                    total: 66.5,
                    date: '2025-10-10T23:30Z',
                    tv: 'ESPN2'
                },
                {
                    id: 'ncaa_20251011_osu_ill',
                    teams: ['Ohio State', 'Illinois'],
                    rankings: { away: 1, home: 17 },
                    spread: { favorite: 'OSU', line: -14.5 },
                    total: 50.5,
                    date: '2025-10-11T16:00Z',
                    tv: 'FOX'
                },
                {
                    id: 'ncaa_20251011_ala_miz',
                    teams: ['Alabama', 'Missouri'],
                    rankings: { away: 8, home: 14 },
                    spread: { favorite: 'ALA', line: -2.5 },
                    total: 51.5,
                    date: '2025-10-11T16:00Z',
                    tv: 'ABC'
                }
            ]
        },
        betting_recommendations: [
            { game: 'USF @ UNT', bet: 'OVER 66.5', confidence: 5 },
            { game: 'Alabama @ Missouri', bet: 'Missouri +2.5', confidence: 5 },
            { game: 'Ohio State @ Illinois', bet: 'Illinois +14.5', confidence: 4 }
        ]
    };
    
    res.json({ success: true, data: liveData });
});

// ESPN NFL API Proxy endpoint
app.get('/api/proxy/espn/nfl/:path(*)', async (req, res) => {
    try {
        const espnPath = req.params.path;
        const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/${espnPath}`;

        const response = await fetch(espnUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; NFLAnalytics/1.0)',
                'Referer': 'https://www.espn.com/'
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('ESPN NFL proxy error:', error);
        res.status(500).json({ error: 'ESPN NFL API unavailable', message: error.message });
    }
});

// ESPN NCAA/College Football API Proxy endpoint
app.get('/api/proxy/espn/college/:path(*)', async (req, res) => {
    try {
        const espnPath = req.params.path;
        const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/${espnPath}`;

        const response = await fetch(espnUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; NCAAAnalytics/1.0)',
                'Referer': 'https://www.espn.com/'
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('ESPN College proxy error:', error);
        res.status(500).json({ error: 'ESPN College API unavailable', message: error.message });
    }
});

// Legacy ESPN API Proxy endpoint (maintains backward compatibility)
app.get('/api/proxy/espn/:path(*)', async (req, res) => {
    try {
        const espnPath = req.params.path;
        const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/${espnPath}`;

        const response = await fetch(espnUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; NFLAnalytics/1.0)',
                'Referer': 'https://www.espn.com/'
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('ESPN proxy error:', error);
        res.status(500).json({ error: 'ESPN API unavailable', message: error.message });
    }
});

// The Odds API Proxy endpoint
app.get('/api/proxy/odds/:endpoint(*)', async (req, res) => {
    try {
        const oddsEndpoint = req.params.endpoint;
        const apiKey = process.env.ODDS_API_KEY || '9de126998e0df996011a28e9527dd7b9';
        const oddsUrl = `https://api.the-odds-api.com/v4/${oddsEndpoint}?apiKey=${apiKey}`;

        const response = await fetch(oddsUrl);
        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Odds API proxy error:', error);
        res.status(500).json({ error: 'Odds API unavailable', message: error.message });
    }
});

// Fallback route - serve index.html for client-side routing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.url });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    console.log(`🚀 NFL API running on port ${PORT}`);
    console.log(`📊 ${teams.length} teams, ${Object.keys(players).length} team rosters loaded`);
    console.log('✅ Geno Smith listed as Raiders QB');
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

module.exports = app;
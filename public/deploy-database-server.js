#!/usr/bin/env node
/**
 * DEPLOYMENT-READY NFL Database Server
 * Single file that includes SQLite database + Express API
 * No Docker required - runs anywhere Node.js is available
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// In-memory database fallback for deployment (contains key players)
const FALLBACK_TEAMS = [
    { id: 1, name: 'Kansas City Chiefs', abbreviation: 'KC' },
    { id: 2, name: 'Buffalo Bills', abbreviation: 'BUF' },
    { id: 3, name: 'Las Vegas Raiders', abbreviation: 'LV' },
    { id: 4, name: 'Indianapolis Colts', abbreviation: 'IND' },
    { id: 5, name: 'New York Giants', abbreviation: 'NYG' },
    { id: 6, name: 'Seattle Seahawks', abbreviation: 'SEA' },
    { id: 7, name: 'Los Angeles Rams', abbreviation: 'LAR' },
    { id: 8, name: 'San Francisco 49ers', abbreviation: 'SF' },
    { id: 9, name: 'Dallas Cowboys', abbreviation: 'DAL' },
    { id: 10, name: 'Philadelphia Eagles', abbreviation: 'PHI' },
    { id: 11, name: 'Green Bay Packers', abbreviation: 'GB' },
    { id: 12, name: 'Minnesota Vikings', abbreviation: 'MIN' },
    { id: 13, name: 'Detroit Lions', abbreviation: 'DET' },
    { id: 14, name: 'Chicago Bears', abbreviation: 'CHI' },
    { id: 15, name: 'Tampa Bay Buccaneers', abbreviation: 'TB' },
    { id: 16, name: 'Atlanta Falcons', abbreviation: 'ATL' },
    { id: 17, name: 'New Orleans Saints', abbreviation: 'NO' },
    { id: 18, name: 'Carolina Panthers', abbreviation: 'CAR' },
    { id: 19, name: 'Baltimore Ravens', abbreviation: 'BAL' },
    { id: 20, name: 'Pittsburgh Steelers', abbreviation: 'PIT' },
    { id: 21, name: 'Cincinnati Bengals', abbreviation: 'CIN' },
    { id: 22, name: 'Cleveland Browns', abbreviation: 'CLE' },
    { id: 23, name: 'Houston Texans', abbreviation: 'HOU' },
    { id: 24, name: 'Tennessee Titans', abbreviation: 'TEN' },
    { id: 25, name: 'Jacksonville Jaguars', abbreviation: 'JAX' },
    { id: 26, name: 'Denver Broncos', abbreviation: 'DEN' },
    { id: 27, name: 'Los Angeles Chargers', abbreviation: 'LAC' },
    { id: 28, name: 'Arizona Cardinals', abbreviation: 'ARI' },
    { id: 29, name: 'Miami Dolphins', abbreviation: 'MIA' },
    { id: 30, name: 'New York Jets', abbreviation: 'NYJ' },
    { id: 31, name: 'New England Patriots', abbreviation: 'NE' },
    { id: 32, name: 'Washington Commanders', abbreviation: 'WAS' }
];

const FALLBACK_PLAYERS = {
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
        { name: 'Davante Adams', position: 'WR', team: 'Las Vegas Raiders', experience_years: 11 },
        { name: 'Brock Bowers', position: 'TE', team: 'Las Vegas Raiders', experience_years: 1 },
        { name: 'Alexander Mattison', position: 'RB', team: 'Las Vegas Raiders', experience_years: 6 }
    ],
    'Buffalo Bills': [
        { name: 'Josh Allen', position: 'QB', team: 'Buffalo Bills', experience_years: 7 },
        { name: 'Stefon Diggs', position: 'WR', team: 'Buffalo Bills', experience_years: 10 },
        { name: 'James Cook', position: 'RB', team: 'Buffalo Bills', experience_years: 3 },
        { name: 'Dalton Kincaid', position: 'TE', team: 'Buffalo Bills', experience_years: 2 },
        { name: 'Curtis Samuel', position: 'WR', team: 'Buffalo Bills', experience_years: 8 }
    ],
    'Indianapolis Colts': [
        { name: 'Anthony Richardson', position: 'QB', team: 'Indianapolis Colts', experience_years: 2 },
        { name: 'Daniel Jones', position: 'QB', team: 'Indianapolis Colts', experience_years: 6 },
        { name: 'Jonathan Taylor', position: 'RB', team: 'Indianapolis Colts', experience_years: 5 },
        { name: 'Michael Pittman Jr.', position: 'WR', team: 'Indianapolis Colts', experience_years: 5 },
        { name: 'Josh Downs', position: 'WR', team: 'Indianapolis Colts', experience_years: 2 }
    ],
    'San Francisco 49ers': [
        { name: 'Brock Purdy', position: 'QB', team: 'San Francisco 49ers', experience_years: 3 },
        { name: 'Christian McCaffrey', position: 'RB', team: 'San Francisco 49ers', experience_years: 8 },
        { name: 'Deebo Samuel', position: 'WR', team: 'San Francisco 49ers', experience_years: 6 },
        { name: 'George Kittle', position: 'TE', team: 'San Francisco 49ers', experience_years: 8 },
        { name: 'Brandon Aiyuk', position: 'WR', team: 'San Francisco 49ers', experience_years: 5 }
    ],
    'Los Angeles Rams': [
        { name: 'Matthew Stafford', position: 'QB', team: 'Los Angeles Rams', experience_years: 16 },
        { name: 'Kyren Williams', position: 'RB', team: 'Los Angeles Rams', experience_years: 3 },
        { name: 'Cooper Kupp', position: 'WR', team: 'Los Angeles Rams', experience_years: 8 },
        { name: 'Puka Nacua', position: 'WR', team: 'Los Angeles Rams', experience_years: 2 },
        { name: 'Colby Parkinson', position: 'TE', team: 'Los Angeles Rams', experience_years: 5 }
    ]
};

// Check if SQLite database exists
const DB_PATH = path.join(__dirname, 'nfl-analytics.db');
let sqlite3, db;

try {
    sqlite3 = require('sqlite3').verbose();
    if (fs.existsSync(DB_PATH)) {
        db = new sqlite3.Database(DB_PATH);
        console.log('✅ Using SQLite database');
    } else {
        console.log('⚠️ SQLite database not found, using fallback data');
    }
} catch (error) {
    console.log('⚠️ SQLite not available, using fallback data');
}

// Database query helper
function dbQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        if (db) {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        } else {
            // Fallback to in-memory data
            resolve([]);
        }
    });
}

// ===== API ENDPOINTS =====

// Get all NFL teams
app.get('/api/nfl/teams', async (req, res) => {
    try {
        console.log('🏈 Fetching all NFL teams...');
        
        let teams = [];
        if (db) {
            teams = await dbQuery('SELECT * FROM teams ORDER BY name');
        }
        
        if (teams.length === 0) {
            teams = FALLBACK_TEAMS;
            console.log('✅ Using fallback teams data');
        }
        
        console.log(`✅ Loaded ${teams.length} teams`);
        res.json({ success: true, data: teams, count: teams.length });
    } catch (error) {
        console.error('❌ Teams error:', error.message);
        res.json({ success: true, data: FALLBACK_TEAMS, count: FALLBACK_TEAMS.length });
    }
});

// Get team roster
app.get('/api/nfl/team/:teamId/roster', async (req, res) => {
    try {
        const { teamId } = req.params;
        console.log(`🏈 Fetching roster for team: ${teamId}`);
        
        let team = null;
        let roster = [];
        
        if (db) {
            // Try to get from database first
            const teamQuery = isNaN(teamId) 
                ? 'SELECT * FROM teams WHERE name LIKE ? OR abbreviation LIKE ?'
                : 'SELECT * FROM teams WHERE id = ?';
            const params = isNaN(teamId) ? [`%${teamId}%`, `%${teamId}%`] : [parseInt(teamId)];
            
            const teams = await dbQuery(teamQuery, params);
            if (teams.length > 0) {
                team = teams[0];
                const playerQuery = 'SELECT p.*, t.name as team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id WHERE t.name = ?';
                roster = await dbQuery(playerQuery, [team.name]);
            }
        }
        
        if (!team) {
            // Find team in fallback data
            team = FALLBACK_TEAMS.find(t => 
                t.name.toLowerCase().includes(teamId.toLowerCase()) ||
                t.abbreviation.toLowerCase() === teamId.toLowerCase() ||
                t.id === parseInt(teamId)
            );
        }
        
        if (!team) {
            return res.status(404).json({ success: false, error: 'Team not found' });
        }
        
        if (roster.length === 0) {
            // Use fallback roster data
            roster = FALLBACK_PLAYERS[team.name] || [];
            console.log(`✅ Using fallback roster for ${team.name}: ${roster.length} players`);
        }
        
        console.log(`✅ Loaded ${roster.length} players for ${team.name}`);
        res.json({ 
            success: true, 
            team: team,
            roster: roster, 
            count: roster.length 
        });
    } catch (error) {
        console.error('❌ Roster error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search players
app.get('/api/nfl/search/players', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ success: false, error: 'Search query must be at least 2 characters' });
        }
        
        console.log(`🔍 Searching players for: "${q}"`);
        let players = [];
        
        if (db) {
            const searchQuery = 'SELECT p.*, t.name as team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id WHERE p.name LIKE ? OR p.position = ? ORDER BY p.name LIMIT 20';
            players = await dbQuery(searchQuery, [`%${q}%`, q.toUpperCase()]);
        }
        
        if (players.length === 0) {
            // Search fallback data
            Object.values(FALLBACK_PLAYERS).flat().forEach(player => {
                if (player.name.toLowerCase().includes(q.toLowerCase()) || 
                    player.position.toLowerCase() === q.toLowerCase()) {
                    players.push(player);
                }
            });
        }
        
        console.log(`✅ Found ${players.length} players matching "${q}"`);
        res.json({ success: true, data: players, count: players.length });
    } catch (error) {
        console.error('❌ Search error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all players
app.get('/api/nfl/players', async (req, res) => {
    try {
        const { team, position, limit = 100 } = req.query;
        console.log('👥 Fetching players...', { team, position, limit });
        
        let players = [];
        
        if (db) {
            let query = 'SELECT p.*, t.name as team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id';
            let params = [];
            let conditions = [];
            
            if (team) {
                conditions.push('t.name LIKE ?');
                params.push(`%${team}%`);
            }
            
            if (position) {
                conditions.push('p.position = ?');
                params.push(position);
            }
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            query += ' ORDER BY p.name LIMIT ?';
            params.push(parseInt(limit));
            
            players = await dbQuery(query, params);
        }
        
        if (players.length === 0) {
            // Use fallback data
            players = Object.values(FALLBACK_PLAYERS).flat();
            if (team) {
                players = players.filter(p => p.team.toLowerCase().includes(team.toLowerCase()));
            }
            if (position) {
                players = players.filter(p => p.position === position);
            }
            players = players.slice(0, parseInt(limit));
        }
        
        console.log(`✅ Loaded ${players.length} players`);
        res.json({ success: true, data: players, count: players.length });
    } catch (error) {
        console.error('❌ Players error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'NFL Database Server is running',
        database: db ? 'SQLite' : 'Fallback Data',
        timestamp: new Date().toISOString() 
    });
});

// Catch all - serve index.html for client-side routing
app.get('*', (req, res) => {
    if (req.path.includes('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 NFL Database Server running on port ${PORT}`);
    console.log(`📊 Database: ${db ? 'SQLite with fallback' : 'Fallback data only'}`);
    console.log('📋 Available endpoints:');
    console.log('  GET /api/nfl/teams - All NFL teams');
    console.log('  GET /api/nfl/players - All players (with filters)');
    console.log('  GET /api/nfl/team/:teamId/roster - Team roster');
    console.log('  GET /api/nfl/search/players - Search players');
    console.log('  GET /health - Server health check');
});

module.exports = app;
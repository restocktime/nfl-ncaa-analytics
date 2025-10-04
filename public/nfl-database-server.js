const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Database configuration
const isDocker = process.env.NODE_ENV === 'production';
const dbConfig = isDocker ? {
    host: process.env.DB_HOST || 'nfl_database',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'nfl_analytics',
    user: process.env.DB_USER || 'nfl_admin',
    password: process.env.DB_PASSWORD || 'nfl_secure_2025',
    max: 20, // Maximum number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
} : null;

// PostgreSQL connection pool (for production)
let pgPool;
if (isDocker) {
    pgPool = new Pool(dbConfig);
    pgPool.on('error', (err, client) => {
        console.error('❌ Unexpected error on idle PostgreSQL client', err);
        process.exit(-1);
    });
}

// SQLite connection (for development)
let sqliteDb;
if (!isDocker) {
    const dbPath = path.join(__dirname, 'nfl-analytics.db');
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ SQLite connection error:', err.message);
        } else {
            console.log('✅ Connected to SQLite database');
        }
    });
}

// Database query helper
async function dbQuery(query, params = []) {
    if (isDocker && pgPool) {
        // PostgreSQL
        const client = await pgPool.connect();
        try {
            const result = await client.query(query, params);
            return result.rows;
        } finally {
            client.release();
        }
    } else if (sqliteDb) {
        // SQLite
        return new Promise((resolve, reject) => {
            sqliteDb.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    } else {
        throw new Error('No database connection available');
    }
}

// API Keys
const API_KEYS = {
    theoddsapi: process.env.THE_ODDS_API_KEY || '9de126998e0df996011a28e9527dd7b9',
    apisports: process.env.API_SPORTS_KEY || '47647545b8ddeb4b557a8482be930f09'
};

// ===== DATABASE ENDPOINTS =====

// Get all NFL teams
app.get('/api/nfl/teams', async (req, res) => {
    try {
        console.log('🏈 Fetching all NFL teams from database...');
        const teams = await dbQuery('SELECT * FROM teams ORDER BY name');
        console.log(`✅ Loaded ${teams.length} teams from database`);
        res.json({ success: true, data: teams, count: teams.length });
    } catch (error) {
        console.error('❌ Database error (teams):', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all players
app.get('/api/nfl/players', async (req, res) => {
    try {
        const { team, position, limit = 100 } = req.query;
        console.log('👥 Fetching players from database...', { team, position, limit });
        
        let query = 'SELECT * FROM players';
        let params = [];
        let conditions = [];
        
        if (team) {
            conditions.push(isDocker ? 'team = $' + (params.length + 1) : 'team = ?');
            params.push(team);
        }
        
        if (position) {
            conditions.push(isDocker ? 'position = $' + (params.length + 1) : 'position = ?');
            params.push(position);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY name LIMIT ' + (isDocker ? '$' + (params.length + 1) : '?');
        params.push(parseInt(limit));
        
        const players = await dbQuery(query, params);
        console.log(`✅ Loaded ${players.length} players from database`);
        res.json({ success: true, data: players, count: players.length });
    } catch (error) {
        console.error('❌ Database error (players):', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get team roster
app.get('/api/nfl/team/:teamId/roster', async (req, res) => {
    try {
        const { teamId } = req.params;
        console.log(`🏈 Fetching roster for team ID: ${teamId}`);
        
        // First get team info - handle both numeric ID and string name
        let teamQuery;
        let params;
        
        // Always treat as string name for now to avoid type conflicts
        teamQuery = isDocker ? 
            'SELECT * FROM teams WHERE name ILIKE $1 OR abbreviation ILIKE $1' :
            'SELECT * FROM teams WHERE name LIKE ? OR abbreviation LIKE ?';
        params = [`%${teamId}%`, `%${teamId}%`];
        
        console.log(`🔍 Team search query: ${teamQuery} with params:`, params);
        
        const teams = await dbQuery(teamQuery, params);
        
        if (teams.length === 0) {
            return res.status(404).json({ success: false, error: 'Team not found' });
        }
        
        const team = teams[0];
        console.log(`✅ Found team: ${team.name} (ID: ${team.id})`);
        
        // Get players for this team
        const rosterQuery = isDocker ? 'SELECT * FROM players WHERE team = $1 ORDER BY position, name' : 'SELECT * FROM players WHERE team = ? ORDER BY position, name';
        const roster = await dbQuery(rosterQuery, [team.name]);
        console.log(`📊 Query returned ${roster.length} players`);
        
        console.log(`✅ Loaded ${roster.length} players for ${team.name}`);
        res.json({ 
            success: true, 
            team: team,
            roster: roster, 
            count: roster.length 
        });
    } catch (error) {
        console.error('❌ Database error (roster):', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get injury report
app.get('/api/nfl/injuries', async (req, res) => {
    try {
        console.log('🏥 Fetching injury report from database...');
        const injuries = await dbQuery('SELECT * FROM injuries WHERE status != ? ORDER BY team, player_name', ['Healthy']);
        console.log(`✅ Loaded ${injuries.length} injury reports`);
        res.json({ success: true, data: injuries, count: injuries.length });
    } catch (error) {
        console.error('❌ Database error (injuries):', error.message);
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
        const searchQuery = isDocker ? 
            'SELECT * FROM players WHERE name ILIKE $1 OR position = $2 ORDER BY name LIMIT 20' :
            'SELECT * FROM players WHERE name LIKE ? OR position = ? ORDER BY name LIMIT 20';
        const searchPattern = `%${q}%`;
        
        const players = await dbQuery(searchQuery, [searchPattern, q.toUpperCase()]);
        console.log(`✅ Found ${players.length} players matching "${q}"`);
        res.json({ success: true, data: players, count: players.length });
    } catch (error) {
        console.error('❌ Database error (search):', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== EXTERNAL API ENDPOINTS (from your existing server) =====

// ESPN NFL Scoreboard
app.get('/api/nfl/games', async (req, res) => {
    try {
        console.log('🏈 Fetching real ESPN NFL games...');
        const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
        const data = await response.json();
        
        if (data.events && data.events.length > 0) {
            const games = data.events.map(event => {
                const competition = event.competitions[0];
                const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
                const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
                
                return {
                    id: event.id,
                    week: event.week?.number || 5,
                    date: event.date,
                    time: new Date(event.date).toLocaleTimeString('en-US'),
                    status: event.status?.type?.name,
                    homeTeam: {
                        name: homeTeam.team.displayName,
                        abbreviation: homeTeam.team.abbreviation,
                        logo: homeTeam.team.logo,
                        record: homeTeam.records?.[0]?.summary
                    },
                    awayTeam: {
                        name: awayTeam.team.displayName,
                        abbreviation: awayTeam.team.abbreviation,
                        logo: awayTeam.team.logo,
                        record: awayTeam.records?.[0]?.summary
                    },
                    homeScore: parseInt(homeTeam.score) || 0,
                    awayScore: parseInt(awayTeam.score) || 0,
                    network: competition.broadcasts?.[0]?.names?.[0],
                    venue: competition.venue?.fullName
                };
            });
            
            console.log(`✅ Loaded ${games.length} real NFL games from ESPN`);
            res.json({ success: true, data: games, source: 'ESPN' });
        } else {
            res.json({ success: false, data: [], message: 'No games found' });
        }
    } catch (error) {
        console.error('❌ ESPN API Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/health', async (req, res) => {
    try {
        // Test database connection
        await dbQuery('SELECT 1');
        res.json({ 
            status: 'OK', 
            message: 'NFL Database Server is running',
            database: isDocker ? 'PostgreSQL' : 'SQLite',
            timestamp: new Date().toISOString() 
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            message: 'Database connection failed',
            error: error.message,
            timestamp: new Date().toISOString() 
        });
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down server...');
    if (pgPool) {
        await pgPool.end();
        console.log('✅ PostgreSQL pool closed');
    }
    if (sqliteDb) {
        sqliteDb.close();
        console.log('✅ SQLite connection closed');
    }
    process.exit(0);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 NFL Database Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${isDocker ? 'PostgreSQL (Docker)' : 'SQLite (Local)'}`);
    console.log('📋 Available endpoints:');
    console.log('  GET /api/nfl/teams - All NFL teams');
    console.log('  GET /api/nfl/players - All players (with filters)');
    console.log('  GET /api/nfl/team/:teamId/roster - Team roster');
    console.log('  GET /api/nfl/injuries - Injury report');
    console.log('  GET /api/nfl/search/players - Search players');
    console.log('  GET /api/nfl/games - Live ESPN games');
    console.log('  GET /health - Server health check');
});

module.exports = app;
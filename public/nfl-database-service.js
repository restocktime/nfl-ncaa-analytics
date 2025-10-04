/**
 * NFL Database Service - Fast, reliable data storage
 * Replaces external API calls with local database queries
 * No more rate limits, 401 errors, or slow API responses!
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class NFLDatabaseService {
    constructor(dbPath = './nfl-analytics.db') {
        this.dbPath = dbPath;
        this.db = null;
    }

    /**
     * Initialize database connection and create tables
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Database connection failed:', err);
                    reject(err);
                } else {
                    console.log('✅ Connected to NFL Analytics database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    /**
     * Create all database tables from schema
     */
    async createTables() {
        const fs = require('fs');
        const schemaPath = path.join(__dirname, 'nfl-database-setup.sql');
        
        return new Promise((resolve, reject) => {
            fs.readFile(schemaPath, 'utf8', (err, schema) => {
                if (err) {
                    reject(err);
                    return;
                }

                this.db.exec(schema, (err) => {
                    if (err) {
                        console.error('❌ Failed to create tables:', err);
                        reject(err);
                    } else {
                        console.log('✅ Database tables created successfully');
                        resolve();
                    }
                });
            });
        });
    }

    /**
     * Get all teams - replaces ESPN teams API call
     */
    async getTeams() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT id, espn_team_id, name, abbreviation, city, division, 
                       conference, logo_url, primary_color, secondary_color
                FROM teams 
                ORDER BY conference, division, name
            `;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('❌ Failed to get teams:', err);
                    reject(err);
                } else {
                    console.log(`✅ Retrieved ${rows.length} teams from database`);
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get team roster - replaces ESPN roster API calls
     */
    async getTeamRoster(teamId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT p.id, p.name, p.position, p.jersey_number, p.height, 
                       p.weight, p.age, p.college, p.experience_years, p.status,
                       i.status as injury_status, i.injury_type, i.estimated_return
                FROM players p
                LEFT JOIN injuries i ON p.id = i.player_id AND i.is_active = 1
                WHERE p.team_id = ? AND p.status = 'active'
                ORDER BY 
                    CASE p.position 
                        WHEN 'QB' THEN 1 
                        WHEN 'RB' THEN 2 
                        WHEN 'WR' THEN 3 
                        WHEN 'TE' THEN 4 
                        ELSE 5 
                    END, p.jersey_number
            `;
            
            this.db.all(query, [teamId], (err, rows) => {
                if (err) {
                    console.error('❌ Failed to get team roster:', err);
                    reject(err);
                } else {
                    console.log(`✅ Retrieved ${rows.length} players for team ${teamId}`);
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get games for specific week - replaces ESPN schedule API
     */
    async getWeekGames(week, season = 2025) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT g.id, g.espn_game_id, g.week, g.season, g.game_date, 
                       g.status, g.home_score, g.away_score, g.venue,
                       ht.name as home_team_name, ht.abbreviation as home_team_abbr,
                       at.name as away_team_name, at.abbreviation as away_team_abbr,
                       ht.logo_url as home_team_logo, at.logo_url as away_team_logo
                FROM games g
                JOIN teams ht ON g.home_team_id = ht.id
                JOIN teams at ON g.away_team_id = at.id
                WHERE g.week = ? AND g.season = ? AND g.season_type = 2
                ORDER BY g.game_date
            `;
            
            this.db.all(query, [week, season], (err, rows) => {
                if (err) {
                    console.error('❌ Failed to get week games:', err);
                    reject(err);
                } else {
                    console.log(`✅ Retrieved ${rows.length} games for week ${week}`);
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get player statistics for a game
     */
    async getPlayerStats(gameId, playerId = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT ps.*, p.name as player_name, p.position, t.abbreviation as team_abbr
                FROM player_stats ps
                JOIN players p ON ps.player_id = p.id
                JOIN teams t ON ps.team_id = t.id
                WHERE ps.game_id = ?
            `;
            const params = [gameId];
            
            if (playerId) {
                query += ` AND ps.player_id = ?`;
                params.push(playerId);
            }
            
            query += ` ORDER BY p.position, ps.passing_yards + ps.rushing_yards + ps.receiving_yards DESC`;
            
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('❌ Failed to get player stats:', err);
                    reject(err);
                } else {
                    console.log(`✅ Retrieved stats for ${rows.length} players`);
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get current injury report
     */
    async getInjuryReport(teamId = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT i.*, p.name as player_name, p.position, p.jersey_number,
                       t.name as team_name, t.abbreviation as team_abbr
                FROM injuries i
                JOIN players p ON i.player_id = p.id  
                JOIN teams t ON p.team_id = t.id
                WHERE i.is_active = 1
            `;
            const params = [];
            
            if (teamId) {
                query += ` AND p.team_id = ?`;
                params.push(teamId);
            }
            
            query += ` ORDER BY t.name, p.position, p.name`;
            
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('❌ Failed to get injury report:', err);
                    reject(err);
                } else {
                    console.log(`✅ Retrieved ${rows.length} injury reports`);
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get team standings
     */
    async getStandings(season = 2025) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT t.id, t.name, t.abbreviation, t.division, t.conference,
                       ts.wins, ts.losses, ts.ties,
                       ts.points_scored, ts.points_allowed,
                       (ts.points_scored - ts.points_allowed) as point_differential,
                       ROUND((ts.wins * 1.0) / (ts.wins + ts.losses + ts.ties), 3) as win_percentage
                FROM teams t
                LEFT JOIN team_stats ts ON t.id = ts.team_id 
                    AND ts.season = ? 
                    AND ts.week = (SELECT MAX(week) FROM team_stats WHERE season = ?)
                ORDER BY t.conference, t.division, 
                         (ts.wins * 1.0) / NULLIF(ts.wins + ts.losses + ts.ties, 0) DESC,
                         ts.points_scored - ts.points_allowed DESC
            `;
            
            this.db.all(query, [season, season], (err, rows) => {
                if (err) {
                    console.error('❌ Failed to get standings:', err);
                    reject(err);
                } else {
                    console.log(`✅ Retrieved standings for ${rows.length} teams`);
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err);
                } else {
                    console.log('✅ Database connection closed');
                }
            });
        }
    }

    /**
     * Log sync operation
     */
    async logSync(syncType, recordsUpdated, success = true, errorMessage = null, durationMs = 0) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO sync_log (sync_type, records_updated, success, error_message, duration_ms)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(query, [syncType, recordsUpdated, success, errorMessage, durationMs], function(err) {
                if (err) {
                    console.error('❌ Failed to log sync:', err);
                    reject(err);
                } else {
                    console.log(`✅ Sync logged: ${syncType} - ${recordsUpdated} records`);
                    resolve(this.lastID);
                }
            });
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NFLDatabaseService;
} else {
    // Browser environment
    window.NFLDatabaseService = NFLDatabaseService;
}
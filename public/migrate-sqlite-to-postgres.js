#!/usr/bin/env node

/**
 * SQLite to PostgreSQL Migration Script
 * Migrates data from nfl-analytics.db to PostgreSQL container
 */

const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// SQLite database path
const sqlitePath = path.join(__dirname, 'nfl-analytics.db');

// PostgreSQL connection (adjust if needed)
const pgConfig = {
    host: 'localhost',
    port: 5432,
    database: 'nfl_analytics',
    user: 'nfl_admin',
    password: 'nfl_secure_2025',
};

async function migrateSQLiteToPostgreSQL() {
    console.log('🔄 Starting SQLite to PostgreSQL migration...');
    
    // Connect to SQLite
    const sqlite = new sqlite3.Database(sqlitePath, (err) => {
        if (err) {
            console.error('❌ SQLite connection error:', err.message);
            process.exit(1);
        }
        console.log('✅ Connected to SQLite database');
    });
    
    // Connect to PostgreSQL
    const pgPool = new Pool(pgConfig);
    
    try {
        // Test PostgreSQL connection
        await pgPool.query('SELECT 1');
        console.log('✅ Connected to PostgreSQL database');
        
        // Migrate teams
        await migrateTeams(sqlite, pgPool);
        
        // Migrate players
        await migratePlayers(sqlite, pgPool);
        
        // Migrate injuries (if table exists)
        await migrateInjuries(sqlite, pgPool);
        
        console.log('🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        sqlite.close();
        await pgPool.end();
    }
}

function migrateTeams(sqlite, pgPool) {
    return new Promise((resolve, reject) => {
        console.log('📊 Migrating teams...');
        
        sqlite.all('SELECT * FROM teams', async (err, rows) => {
            if (err) {
                console.log('⚠️ Teams table not found in SQLite, skipping...');
                return resolve();
            }
            
            try {
                // Clear existing data
                await pgPool.query('DELETE FROM teams WHERE id > 4'); // Keep sample data
                
                for (const row of rows) {
                    await pgPool.query(
                        `INSERT INTO teams (name, abbreviation, displayName, color, alternateColor, logo, conference, division, city, stadium, founded) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
                         ON CONFLICT (name) DO UPDATE SET 
                         abbreviation = EXCLUDED.abbreviation,
                         displayName = EXCLUDED.displayName,
                         updated_at = CURRENT_TIMESTAMP`,
                        [
                            row.name,
                            row.abbreviation || row.short_name,
                            row.displayName || row.display_name || row.name,
                            row.color,
                            row.alternateColor || row.alternate_color,
                            row.logo,
                            row.conference,
                            row.division,
                            row.city || row.location,
                            row.stadium || row.venue,
                            row.founded
                        ]
                    );
                }
                
                console.log(`✅ Migrated ${rows.length} teams`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

function migratePlayers(sqlite, pgPool) {
    return new Promise((resolve, reject) => {
        console.log('👥 Migrating players...');
        
        // Join with teams table to get team name
        sqlite.all(`
            SELECT p.*, t.name as team_name 
            FROM players p 
            LEFT JOIN teams t ON p.team_id = t.id
        `, async (err, rows) => {
            if (err) {
                console.error('❌ Players table error:', err.message);
                return reject(err);
            }
            
            try {
                // Clear existing data
                await pgPool.query('DELETE FROM players');
                
                let migrated = 0;
                for (const row of rows) {
                    // Skip players without team assignment
                    if (!row.team_name) {
                        console.log(`⚠️ Skipping player ${row.name} - no team assigned`);
                        continue;
                    }
                    
                    await pgPool.query(
                        `INSERT INTO players (name, position, team, jersey_number, height, weight, age, experience_years, college, status) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            row.name,
                            row.position,
                            row.team_name, // Use team_name from join
                            row.jersey_number,
                            row.height,
                            row.weight,
                            row.age,
                            row.experience_years || 0,
                            row.college,
                            row.status || 'Active'
                        ]
                    );
                    migrated++;
                    
                    // Progress indicator
                    if (migrated % 100 === 0) {
                        console.log(`   ... migrated ${migrated}/${rows.length} players`);
                    }
                }
                
                console.log(`✅ Migrated ${migrated} players (skipped ${rows.length - migrated} without teams)`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

function migrateInjuries(sqlite, pgPool) {
    return new Promise((resolve, reject) => {
        console.log('🏥 Migrating injuries...');
        
        sqlite.all('SELECT * FROM injuries', async (err, rows) => {
            if (err) {
                console.log('⚠️ Injuries table not found in SQLite, skipping...');
                return resolve();
            }
            
            try {
                // Clear existing data
                await pgPool.query('DELETE FROM injuries');
                
                for (const row of rows) {
                    await pgPool.query(
                        `INSERT INTO injuries (player_name, team, position, injury_type, body_part, status, date_occurred, expected_return, severity) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                        [
                            row.player_name || row.player,
                            row.team,
                            row.position,
                            row.injury_type || row.injury,
                            row.body_part || row.bodypart,
                            row.status,
                            row.date_occurred || row.date,
                            row.expected_return,
                            row.severity
                        ]
                    );
                }
                
                console.log(`✅ Migrated ${rows.length} injuries`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Run migration if called directly
if (require.main === module) {
    migrateSQLiteToPostgreSQL().catch(console.error);
}

module.exports = { migrateSQLiteToPostgreSQL };
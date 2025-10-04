/**
 * NFL Database API Server
 * Serves database queries via HTTP endpoints
 * Fast, reliable alternative to external APIs
 */

const express = require('express');
const cors = require('cors');
const NFLDatabaseService = require('./nfl-database-service.js');
const NFLDailySync = require('./nfl-daily-sync.js');

class NFLAPIServer {
    constructor(port = 3001) {
        this.port = port;
        this.app = express();
        this.db = new NFLDatabaseService();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        const router = express.Router();

        // System status
        router.get('/status', async (req, res) => {
            try {
                const status = {
                    status: 'online',
                    database: 'connected',
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                };
                res.json(status);
            } catch (error) {
                res.status(500).json({ 
                    status: 'error', 
                    message: error.message 
                });
            }
        });

        // Get all teams
        router.get('/teams', async (req, res) => {
            try {
                const teams = await this.db.getTeams();
                res.json(teams);
            } catch (error) {
                console.error('❌ Teams API error:', error);
                res.status(500).json({ error: 'Failed to fetch teams' });
            }
        });

        // Get team roster
        router.get('/teams/:teamId/roster', async (req, res) => {
            try {
                const teamId = parseInt(req.params.teamId);
                const roster = await this.db.getTeamRoster(teamId);
                res.json(roster);
            } catch (error) {
                console.error('❌ Roster API error:', error);
                res.status(500).json({ error: 'Failed to fetch roster' });
            }
        });

        // Get games for a week
        router.get('/games', async (req, res) => {
            try {
                const week = parseInt(req.query.week) || 1;
                const season = parseInt(req.query.season) || 2025;
                const games = await this.db.getWeekGames(week, season);
                res.json(games);
            } catch (error) {
                console.error('❌ Games API error:', error);
                res.status(500).json({ error: 'Failed to fetch games' });
            }
        });

        // Get player stats for a game
        router.get('/games/:gameId/stats', async (req, res) => {
            try {
                const gameId = parseInt(req.params.gameId);
                const stats = await this.db.getPlayerStats(gameId);
                res.json(stats);
            } catch (error) {
                console.error('❌ Stats API error:', error);
                res.status(500).json({ error: 'Failed to fetch stats' });
            }
        });

        // Get injury report
        router.get('/injuries', async (req, res) => {
            try {
                const teamId = req.query.team ? parseInt(req.query.team) : null;
                const injuries = await this.db.getInjuryReport(teamId);
                res.json(injuries);
            } catch (error) {
                console.error('❌ Injuries API error:', error);
                res.status(500).json({ error: 'Failed to fetch injury report' });
            }
        });

        // Get standings
        router.get('/standings', async (req, res) => {
            try {
                const season = parseInt(req.query.season) || 2025;
                const standings = await this.db.getStandings(season);
                res.json(standings);
            } catch (error) {
                console.error('❌ Standings API error:', error);
                res.status(500).json({ error: 'Failed to fetch standings' });
            }
        });

        // Trigger manual sync (for testing)
        router.post('/sync', async (req, res) => {
            try {
                console.log('🔄 Manual sync triggered via API');
                const sync = new NFLDailySync();
                
                // Run sync in background
                sync.runDailySync().then(() => {
                    console.log('✅ Manual sync completed');
                }).catch(error => {
                    console.error('❌ Manual sync failed:', error);
                });
                
                res.json({ 
                    message: 'Sync started in background',
                    status: 'started'
                });
            } catch (error) {
                console.error('❌ Sync API error:', error);
                res.status(500).json({ error: 'Failed to start sync' });
            }
        });

        // Mount router
        this.app.use('/api/nfl', router);

        // Serve static files from public directory
        this.app.use(express.static('.'));

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy',
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        });
    }

    async start() {
        try {
            // Initialize database
            await this.db.initialize();
            console.log('✅ Database initialized');

            // Start server
            this.server = this.app.listen(this.port, () => {
                console.log(`🚀 NFL Database API Server running on http://localhost:${this.port}`);
                console.log(`📊 API endpoints available at http://localhost:${this.port}/api/nfl/`);
                console.log(`🏥 Health check: http://localhost:${this.port}/health`);
            });

            // Graceful shutdown
            process.on('SIGTERM', () => this.shutdown());
            process.on('SIGINT', () => this.shutdown());

        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }

    async shutdown() {
        console.log('🛑 Shutting down NFL API Server...');
        
        if (this.server) {
            this.server.close(() => {
                console.log('✅ HTTP server closed');
            });
        }
        
        if (this.db) {
            this.db.close();
        }
        
        process.exit(0);
    }
}

// Create and start server if run directly
if (require.main === module) {
    const server = new NFLAPIServer();
    server.start().catch(error => {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    });
}

module.exports = NFLAPIServer;
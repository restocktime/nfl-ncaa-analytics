/**
 * NFL Daily Sync Cron Job Setup
 * Runs automatic data sync every day at 6 AM
 * Keeps database fresh with latest NFL data
 */

const cron = require('node-cron');
const NFLDailySync = require('./nfl-daily-sync.js');

class NFLCronScheduler {
    constructor() {
        this.syncService = new NFLDailySync();
        this.jobs = [];
    }

    /**
     * Start all scheduled jobs
     */
    startScheduler() {
        console.log('🏈 Starting NFL Data Sync Scheduler...');

        // Daily full sync at 6:00 AM
        const dailySync = cron.schedule('0 6 * * *', () => {
            console.log('🌅 Starting scheduled daily sync...');
            this.runSafeSync('daily_full_sync');
        }, {
            scheduled: false,
            timezone: "America/New_York"
        });

        // Quick injury update every 4 hours during season
        const injurySync = cron.schedule('0 */4 * * *', () => {
            console.log('🏥 Starting scheduled injury update...');
            this.runQuickInjurySync();
        }, {
            scheduled: false,
            timezone: "America/New_York"
        });

        // Game results update every hour on game days (Sunday, Monday, Thursday)
        const gameSync = cron.schedule('0 * * * 0,1,4', () => {
            console.log('🏈 Starting scheduled game results update...');
            this.runGameResultsSync();
        }, {
            scheduled: false,
            timezone: "America/New_York"
        });

        // Start all jobs
        dailySync.start();
        injurySync.start();
        gameSync.start();

        this.jobs = [
            { name: 'Daily Full Sync', schedule: '6:00 AM daily', job: dailySync },
            { name: 'Injury Updates', schedule: 'Every 4 hours', job: injurySync },
            { name: 'Game Results', schedule: 'Hourly on game days', job: gameSync }
        ];

        console.log('✅ NFL Data Sync Scheduler started successfully');
        console.log('📅 Scheduled jobs:');
        this.jobs.forEach(job => {
            console.log(`   - ${job.name}: ${job.schedule}`);
        });
    }

    /**
     * Run full sync with error handling
     */
    async runSafeSync(syncType = 'manual') {
        try {
            console.log(`🔄 Starting ${syncType} sync...`);
            const startTime = Date.now();
            
            await this.syncService.runDailySync();
            
            const duration = Date.now() - startTime;
            console.log(`✅ ${syncType} sync completed successfully in ${duration}ms`);
            
        } catch (error) {
            console.error(`❌ ${syncType} sync failed:`, error);
            
            // Could add notification/alerting here
            // e.g., send email, Slack message, etc.
        }
    }

    /**
     * Quick injury status update
     */
    async runQuickInjurySync() {
        try {
            const sync = new NFLDailySync();
            await sync.db.initialize();
            await sync.syncInjuries();
            sync.db.close();
            
            console.log('✅ Quick injury sync completed');
            
        } catch (error) {
            console.error('❌ Quick injury sync failed:', error);
        }
    }

    /**
     * Game results update for live/completed games
     */
    async runGameResultsSync() {
        try {
            const sync = new NFLDailySync();
            await sync.db.initialize();
            await sync.syncGames();
            await sync.syncGameStats();
            sync.db.close();
            
            console.log('✅ Game results sync completed');
            
        } catch (error) {
            console.error('❌ Game results sync failed:', error);
        }
    }

    /**
     * Stop all scheduled jobs
     */
    stopScheduler() {
        console.log('🛑 Stopping NFL Data Sync Scheduler...');
        
        this.jobs.forEach(job => {
            job.job.stop();
        });
        
        console.log('✅ All scheduled jobs stopped');
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            active: this.jobs.length > 0,
            jobs: this.jobs.map(job => ({
                name: job.name,
                schedule: job.schedule,
                running: job.job.getStatus() === 'scheduled'
            })),
            timezone: 'America/New_York'
        };
    }

    /**
     * Manual trigger for testing
     */
    async triggerManualSync() {
        console.log('🔧 Manual sync triggered');
        await this.runSafeSync('manual');
    }
}

// Create and start scheduler if run directly
if (require.main === module) {
    const scheduler = new NFLCronScheduler();
    
    // Start scheduler
    scheduler.startScheduler();
    
    // Keep process running
    process.on('SIGTERM', () => {
        console.log('🛑 Received SIGTERM, shutting down gracefully');
        scheduler.stopScheduler();
        process.exit(0);
    });
    
    process.on('SIGINT', () => {
        console.log('🛑 Received SIGINT, shutting down gracefully');
        scheduler.stopScheduler();
        process.exit(0);
    });
    
    console.log('🏈 NFL Cron Scheduler is running. Press Ctrl+C to stop.');
}

module.exports = NFLCronScheduler;
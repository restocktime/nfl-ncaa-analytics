/**
 * NFL Picks Tracker Service - Performance Analytics & Historical Tracking
 * Tracks all predictions by week with win/loss results and performance metrics
 */

class PicksTrackerService {
    constructor() {
        this.dbName = 'nfl_picks_tracker';
        this.dbVersion = 1;
        this.db = null;
        
        this.pickTypes = {
            SPREAD: 'spread',
            MONEYLINE: 'moneyline', 
            TOTAL: 'total',
            PLAYER_PROP: 'player_prop',
            TACKLE_PROP: 'tackle_prop',
            ML_PREDICTION: 'ml_prediction',
            PARLAY: 'parlay'
        };
        
        this.pickStatus = {
            PENDING: 'pending',
            WON: 'won',
            LOST: 'lost',
            PUSH: 'push',
            VOID: 'void'
        };
        
        this.confidence = {
            LOW: 'low',
            MEDIUM: 'medium', 
            HIGH: 'high',
            VERY_HIGH: 'very_high'
        };
        
        console.log('📊 Initializing NFL Picks Tracker Service...');
        this.initializeDatabase();
    }

    /**
     * Initialize IndexedDB for local storage of picks data
     */
    async initializeDatabase() {
        try {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('❌ Failed to open picks database:', request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Picks database initialized');
                this.loadHistoricalData();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create picks store
                const picksStore = db.createObjectStore('picks', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                
                // Create indexes for efficient querying
                picksStore.createIndex('week', 'week', { unique: false });
                picksStore.createIndex('season', 'season', { unique: false });
                picksStore.createIndex('type', 'type', { unique: false });
                picksStore.createIndex('status', 'status', { unique: false });
                picksStore.createIndex('timestamp', 'timestamp', { unique: false });
                picksStore.createIndex('gameId', 'gameId', { unique: false });
                
                // Create weekly performance store
                const weeklyStore = db.createObjectStore('weekly_performance', { 
                    keyPath: 'weekKey' // Format: "season_week"
                });
                
                // Create overall performance store  
                const performanceStore = db.createObjectStore('performance_metrics', {
                    keyPath: 'metricType'
                });
                
                console.log('🔧 Database schema created');
            };
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
        }
    }

    /**
     * Record a new pick
     */
    async recordPick(pickData) {
        try {
            const pick = {
                // Basic Info
                id: this.generatePickId(),
                timestamp: new Date().toISOString(),
                season: pickData.season || '2025',
                week: pickData.week || this.getCurrentWeek(),
                gameId: pickData.gameId,
                
                // Pick Details
                type: pickData.type,
                selection: pickData.selection,
                line: pickData.line,
                odds: pickData.odds,
                stake: pickData.stake || 1, // Units
                
                // Teams/Players
                homeTeam: pickData.homeTeam,
                awayTeam: pickData.awayTeam,
                player: pickData.player, // For player props
                
                // Analysis
                confidence: pickData.confidence,
                reasoning: pickData.reasoning,
                edge: pickData.edge, // Expected edge percentage
                modelProbability: pickData.modelProbability,
                
                // Tracking
                status: this.pickStatus.PENDING,
                result: null,
                payout: null,
                settledAt: null,
                
                // Metadata
                source: pickData.source || 'ai_analysis',
                tags: pickData.tags || [],
                notes: pickData.notes || ''
            };

            // Store in database
            const transaction = this.db.transaction(['picks'], 'readwrite');
            const store = transaction.objectStore('picks');
            await store.add(pick);
            
            console.log(`✅ Recorded ${pick.type} pick: ${pick.selection} (${pick.confidence} confidence)`);
            
            // Update weekly stats
            await this.updateWeeklyStats(pick.season, pick.week);
            
            return pick;
            
        } catch (error) {
            console.error('❌ Failed to record pick:', error);
            throw error;
        }
    }

    /**
     * Update pick result (won/lost/push)
     */
    async updatePickResult(pickId, result, actualResult = null) {
        try {
            const transaction = this.db.transaction(['picks'], 'readwrite');
            const store = transaction.objectStore('picks');
            const pick = await store.get(pickId);
            
            if (!pick) {
                throw new Error(`Pick ${pickId} not found`);
            }
            
            // Update pick status
            pick.status = result;
            pick.result = actualResult;
            pick.settledAt = new Date().toISOString();
            
            // Calculate payout
            if (result === this.pickStatus.WON) {
                pick.payout = this.calculatePayout(pick.stake, pick.odds);
            } else if (result === this.pickStatus.PUSH) {
                pick.payout = pick.stake; // Get stake back
            } else {
                pick.payout = -pick.stake; // Lose stake
            }
            
            await store.put(pick);
            
            console.log(`📊 Updated pick ${pickId}: ${result} (${pick.payout > 0 ? '+' : ''}${pick.payout} units)`);
            
            // Update weekly and overall performance
            await this.updateWeeklyStats(pick.season, pick.week);
            await this.updateOverallPerformance();
            
            return pick;
            
        } catch (error) {
            console.error('❌ Failed to update pick result:', error);
            throw error;
        }
    }

    /**
     * Get picks for a specific week
     */
    async getPicksByWeek(season, week) {
        try {
            const transaction = this.db.transaction(['picks'], 'readonly');
            const store = transaction.objectStore('picks');
            const index = store.index('week');
            
            const picks = [];
            const request = index.openCursor(IDBKeyRange.only(week));
            
            return new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        if (cursor.value.season === season) {
                            picks.push(cursor.value);
                        }
                        cursor.continue();
                    } else {
                        resolve(picks);
                    }
                };
                request.onerror = () => reject(request.error);
            });
            
        } catch (error) {
            console.error('❌ Failed to get picks by week:', error);
            return [];
        }
    }

    /**
     * Get weekly performance summary
     */
    async getWeeklyPerformance(season, week) {
        try {
            const picks = await this.getPicksByWeek(season, week);
            
            const performance = {
                weekKey: `${season}_${week}`,
                season,
                week,
                totalPicks: picks.length,
                settledPicks: picks.filter(p => p.status !== this.pickStatus.PENDING).length,
                pendingPicks: picks.filter(p => p.status === this.pickStatus.PENDING).length,
                
                // Win/Loss breakdown
                wins: picks.filter(p => p.status === this.pickStatus.WON).length,
                losses: picks.filter(p => p.status === this.pickStatus.LOST).length,
                pushes: picks.filter(p => p.status === this.pickStatus.PUSH).length,
                voids: picks.filter(p => p.status === this.pickStatus.VOID).length,
                
                // Performance by type
                byType: {},
                
                // Financial metrics
                totalStaked: picks.reduce((sum, p) => sum + (p.stake || 1), 0),
                totalReturn: picks.reduce((sum, p) => sum + (p.payout || 0), 0),
                netProfit: 0,
                roi: 0,
                
                // Accuracy metrics
                winRate: 0,
                avgEdge: picks.reduce((sum, p) => sum + (p.edge || 0), 0) / picks.length || 0,
                
                lastUpdated: new Date().toISOString()
            };
            
            // Calculate win rate
            if (performance.settledPicks > 0) {
                performance.winRate = (performance.wins / performance.settledPicks) * 100;
            }
            
            // Calculate ROI
            performance.netProfit = performance.totalReturn - performance.totalStaked;
            if (performance.totalStaked > 0) {
                performance.roi = (performance.netProfit / performance.totalStaked) * 100;
            }
            
            // Break down by pick type
            Object.values(this.pickTypes).forEach(type => {
                const typePicks = picks.filter(p => p.type === type);
                const typeSettled = typePicks.filter(p => p.status !== this.pickStatus.PENDING);
                
                performance.byType[type] = {
                    total: typePicks.length,
                    settled: typeSettled.length,
                    wins: typePicks.filter(p => p.status === this.pickStatus.WON).length,
                    losses: typePicks.filter(p => p.status === this.pickStatus.LOST).length,
                    winRate: typeSettled.length > 0 ? 
                        (typePicks.filter(p => p.status === this.pickStatus.WON).length / typeSettled.length) * 100 : 0
                };
            });
            
            return performance;
            
        } catch (error) {
            console.error('❌ Failed to calculate weekly performance:', error);
            return null;
        }
    }

    /**
     * Get overall performance summary
     */
    async getOverallPerformance() {
        try {
            const transaction = this.db.transaction(['picks'], 'readonly');
            const store = transaction.objectStore('picks');
            
            const allPicks = [];
            const request = store.openCursor();
            
            return new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        allPicks.push(cursor.value);
                        cursor.continue();
                    } else {
                        // Calculate overall metrics
                        const performance = this.calculateOverallMetrics(allPicks);
                        resolve(performance);
                    }
                };
                request.onerror = () => reject(request.error);
            });
            
        } catch (error) {
            console.error('❌ Failed to get overall performance:', error);
            return null;
        }
    }

    /**
     * Calculate overall performance metrics
     */
    calculateOverallMetrics(picks) {
        const settledPicks = picks.filter(p => p.status !== this.pickStatus.PENDING);
        const wins = picks.filter(p => p.status === this.pickStatus.WON);
        const losses = picks.filter(p => p.status === this.pickStatus.LOST);
        
        const totalStaked = picks.reduce((sum, p) => sum + (p.stake || 1), 0);
        const totalReturn = picks.reduce((sum, p) => sum + (p.payout || 0), 0);
        const netProfit = totalReturn - totalStaked;
        
        return {
            totalPicks: picks.length,
            settledPicks: settledPicks.length,
            pendingPicks: picks.filter(p => p.status === this.pickStatus.PENDING).length,
            
            wins: wins.length,
            losses: losses.length,
            pushes: picks.filter(p => p.status === this.pickStatus.PUSH).length,
            
            winRate: settledPicks.length > 0 ? (wins.length / settledPicks.length) * 100 : 0,
            totalStaked: totalStaked,
            totalReturn: totalReturn,
            netProfit: netProfit,
            roi: totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0,
            
            avgStake: totalStaked / picks.length || 0,
            avgEdge: picks.reduce((sum, p) => sum + (p.edge || 0), 0) / picks.length || 0,
            
            // Streaks
            currentStreak: this.calculateCurrentStreak(picks),
            longestWinStreak: this.calculateLongestStreak(picks, this.pickStatus.WON),
            longestLoseStreak: this.calculateLongestStreak(picks, this.pickStatus.LOST),
            
            // By confidence level
            byConfidence: this.calculatePerformanceByConfidence(picks),
            
            // By pick type
            byType: this.calculatePerformanceByType(picks),
            
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Helper methods for performance calculations
     */
    calculateCurrentStreak(picks) {
        const settledPicks = picks
            .filter(p => p.status !== this.pickStatus.PENDING)
            .sort((a, b) => new Date(b.settledAt) - new Date(a.settledAt));
            
        if (settledPicks.length === 0) return { type: 'none', count: 0 };
        
        const lastResult = settledPicks[0].status;
        let count = 0;
        
        for (const pick of settledPicks) {
            if (pick.status === lastResult) {
                count++;
            } else {
                break;
            }
        }
        
        return { type: lastResult, count };
    }

    calculateLongestStreak(picks, status) {
        const settledPicks = picks
            .filter(p => p.status !== this.pickStatus.PENDING)
            .sort((a, b) => new Date(a.settledAt) - new Date(b.settledAt));
            
        let maxStreak = 0;
        let currentStreak = 0;
        
        for (const pick of settledPicks) {
            if (pick.status === status) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        
        return maxStreak;
    }

    calculatePerformanceByConfidence(picks) {
        const byConfidence = {};
        
        Object.values(this.confidence).forEach(conf => {
            const confPicks = picks.filter(p => p.confidence === conf);
            const settledPicks = confPicks.filter(p => p.status !== this.pickStatus.PENDING);
            
            byConfidence[conf] = {
                total: confPicks.length,
                settled: settledPicks.length,
                wins: confPicks.filter(p => p.status === this.pickStatus.WON).length,
                losses: confPicks.filter(p => p.status === this.pickStatus.LOST).length,
                winRate: settledPicks.length > 0 ? 
                    (confPicks.filter(p => p.status === this.pickStatus.WON).length / settledPicks.length) * 100 : 0
            };
        });
        
        return byConfidence;
    }

    calculatePerformanceByType(picks) {
        const byType = {};
        
        Object.values(this.pickTypes).forEach(type => {
            const typePicks = picks.filter(p => p.type === type);
            const settledPicks = typePicks.filter(p => p.status !== this.pickStatus.PENDING);
            
            byType[type] = {
                total: typePicks.length,
                settled: settledPicks.length,
                wins: typePicks.filter(p => p.status === this.pickStatus.WON).length,
                losses: typePicks.filter(p => p.status === this.pickStatus.LOST).length,
                winRate: settledPicks.length > 0 ? 
                    (typePicks.filter(p => p.status === this.pickStatus.WON).length / settledPicks.length) * 100 : 0,
                netProfit: typePicks.reduce((sum, p) => sum + (p.payout || 0), 0) - 
                          typePicks.reduce((sum, p) => sum + (p.stake || 1), 0)
            };
        });
        
        return byType;
    }

    // Utility methods
    generatePickId() {
        return `pick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    calculatePayout(stake, odds) {
        if (odds > 0) {
            return stake * (odds / 100); // Positive odds
        } else {
            return stake * (100 / Math.abs(odds)); // Negative odds
        }
    }

    getCurrentWeek() {
        // Calculate current NFL week based on date
        const now = new Date();
        const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
        const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.max(1, Math.min(18, weeksSinceStart + 1));
    }

    async updateWeeklyStats(season, week) {
        // Update cached weekly performance data
        // Implementation would update the weekly_performance store
    }

    async updateOverallPerformance() {
        // Update cached overall performance metrics
        // Implementation would update the performance_metrics store
    }

    async loadHistoricalData() {
        // Load any existing historical performance data
        console.log('📈 Loading historical picks data...');
    }
}

// Initialize global picks tracker service
window.picksTrackerService = new PicksTrackerService();

console.log('📊 Picks Tracker Service loaded - Ready to track all predictions!');
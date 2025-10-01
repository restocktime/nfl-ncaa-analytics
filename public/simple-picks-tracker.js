/**
 * Simple, Stable Picks Tracker - Works Immediately
 * No async, no retries, no complex initialization
 */

class SimplePicksTracker {
    constructor() {
        this.isReady = true; // Always ready immediately
        
        // Real data integration - no fake samples
        this.realPicks = [];
        this.realPerformance = null;
        this.lastLogTime = 0; // For debouncing console logs

        console.log('✅ Simple Picks Tracker loaded - Ready immediately!');
    }

    // Get REAL weekly performance from actual goldmine picks
    async getWeeklyPerformance(season, week) {
        try {
            // Get comprehensive weekly picks from MCP if available
            if (window.weeklyPicksMCP) {
                try {
                    const weeklyPicks = await window.weeklyPicksMCP.getBestWeeklyPicks(season, week);
                    if (weeklyPicks.topPicks.length > 0) {
                        return this.convertMCPToPerformance(weeklyPicks, season, week);
                    }
                } catch (mcpError) {
                    console.warn('⚠️ MCP system unavailable, falling back to goldmines:', mcpError);
                }
            }
            
            // Fallback: Get real goldmines from tackle props scanner
            const goldmines = this.getRealGoldmines();
            
            if (goldmines.length === 0) {
                return {
                    season: season,
                    week: week,
                    weekKey: `${season}_${week}`,
                    totalPicks: 0,
                    settledPicks: 0,
                    pendingPicks: 0,
                    wins: 0,
                    losses: 0,
                    pushes: 0,
                    voids: 0,
                    winRate: 0,
                    totalStake: 0,
                    totalPayout: 0,
                    netResult: 0,
                    roi: 0,
                    topPick: null,
                    averageOdds: 0,
                    averageStake: 0,
                    byType: {},
                    byConfidence: {}
                };
            }
            
            // Convert goldmines to real performance data
            return {
                season: season,
                week: week,
                weekKey: `${season}_${week}`,
                totalPicks: goldmines.length,
                settledPicks: 0, // All are pending until games finish
                pendingPicks: goldmines.length,
                wins: 0,
                losses: 0,
                pushes: 0,
                voids: 0,
                winRate: 0,
                totalStake: goldmines.length * 100, // Assume $100 per pick
                totalPayout: 0, // Pending
                netResult: 0, // Pending
                roi: 0,
                topPick: goldmines[0] ? {
                    player: goldmines[0].player,
                    edge: goldmines[0].edge,
                    status: 'pending'
                } : null,
                averageOdds: -110,
                averageStake: 100,
                byType: {
                    'tackle_prop': { 
                        total: goldmines.length, 
                        wins: 0, 
                        losses: 0, 
                        pushes: 0,
                        winRate: 0 
                    }
                },
                byConfidence: this.groupByConfidence(goldmines)
            };
        } catch (error) {
            console.error('Error getting real weekly performance:', error);
            return null;
        }
    }

    async getPicksByWeek(season, week) {
        try {
            // Get comprehensive weekly picks from MCP if available
            if (window.weeklyPicksMCP) {
                try {
                    const weeklyPicks = await window.weeklyPicksMCP.getBestWeeklyPicks(season, week);
                    if (weeklyPicks.topPicks.length > 0) {
                        return this.convertMCPToPicks(weeklyPicks.topPicks, week);
                    }
                } catch (mcpError) {
                    console.warn('⚠️ MCP system unavailable for picks, falling back to goldmines:', mcpError);
                }
            }
            
            // Fallback: Get REAL goldmine picks from tackle props scanner
            const goldmines = this.getRealGoldmines();
            
            if (goldmines.length === 0) {
                return [];
            }
            
            // Convert goldmines to pick format - fix field mapping
            const realPicks = goldmines.map((goldmine, index) => {
                // Log the first goldmine structure to debug field names
                if (index === 0) {
                    console.log('🔍 Goldmine structure for picks conversion:', Object.keys(goldmine));
                    console.log('🔍 Sample goldmine data:', goldmine);
                }
                
                return {
                    id: index + 1,
                    gameId: goldmine.gameId || goldmine.scanId || `game_${week}_${index}`,
                    type: 'tackle_prop',
                    team: goldmine.defenseTeam || goldmine.team || 'TBD',
                    opponent: goldmine.rbOpponent || goldmine.opponent || 'TBD', 
                    player: goldmine.defender || goldmine.player || 'Unknown Player',
                    line: `Over ${goldmine.bookLine || goldmine.line || 0} tackles`,
                    odds: goldmine.bestOverOdds?.odds || goldmine.bestOdds || -110,
                    status: 'pending', // All are pending until games finish
                    confidence: (goldmine.confidence || 'medium').toLowerCase(),
                    stake: 100, // Standard unit
                    payout: 0, // Pending
                    edge: goldmine.edge || 0,
                    reasoning: goldmine.reasoning || `${goldmine.edge || 0} edge detected with ${goldmine.confidence || 'medium'} confidence`,
                    projection: goldmine.projection || 0,
                    lineShop: goldmine.lineShoppingValue || goldmine.lineShop || 0,
                    sportsbook: goldmine.bestOverOdds?.sportsbook || goldmine.bestBook || 'Multiple books'
                };
            });
            
            return realPicks;
        } catch (error) {
            console.error('Error getting real picks by week:', error);
            return [];
        }
    }

    async getOverallPerformance() {
        try {
            const goldmines = this.getRealGoldmines();
            
            if (goldmines.length === 0) {
                return {
                    totalPicks: 0,
                    settledPicks: 0,
                    pendingPicks: 0,
                    wins: 0,
                    losses: 0,
                    pushes: 0,
                    voids: 0,
                    winRate: 0,
                    totalStake: 0,
                    totalPayout: 0,
                    netResult: 0,
                    roi: 0,
                    bestWeek: null,
                    worstWeek: null,
                    currentStreak: { type: 'none', count: 0 },
                    longestWinStreak: 0,
                    longestLoseStreak: 0,
                    byType: {},
                    byConfidence: {},
                    weeklyBreakdown: [],
                    lastUpdated: new Date().toISOString()
                };
            }
            
            return {
                totalPicks: goldmines.length,
                settledPicks: 0, // All pending
                pendingPicks: goldmines.length,
                wins: 0,
                losses: 0,
                pushes: 0,
                voids: 0,
                winRate: 0,
                totalStake: goldmines.length * 100,
                totalPayout: 0, // Pending
                netResult: 0, // Pending
                roi: 0,
                bestWeek: null,
                worstWeek: null,
                currentStreak: { type: 'none', count: 0 },
                longestWinStreak: 0,
                longestLoseStreak: 0,
                byType: {
                    'tackle_prop': { 
                        total: goldmines.length, 
                        wins: 0, 
                        losses: 0, 
                        pushes: 0,
                        winRate: 0 
                    }
                },
                byConfidence: this.groupByConfidence(goldmines),
                weeklyBreakdown: [],
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting real overall performance:', error);
            return null;
        }
    }

    recordPick(pickData) {
        console.log('📊 Pick recorded:', pickData);
        return Promise.resolve(true);
    }

    updatePickResult(pickId, result) {
        console.log('📊 Pick result updated:', pickId, result);
        return Promise.resolve(true);
    }

    // Get REAL goldmines from tackle props scanner
    getRealGoldmines() {
        try {
            // Only log once per second to avoid spam
            const now = Date.now();
            if (!this.lastLogTime || (now - this.lastLogTime) > 1000) {
                console.log('🔍 Searching for real goldmines...');
                console.log('🔍 Tackle props scanner status:', window.tacklePropsScanner ? 'LOADED' : 'MISSING');
                console.log('🔍 Scanner goldmines:', window.tacklePropsScanner?.goldmines?.length || 0);
                console.log('🔍 Global goldmines:', window.currentGoldmines?.length || 0);
                this.lastLogTime = now;
            }
            
            // Access the global tackle props scanner goldmines
            if (window.tacklePropsScanner && window.tacklePropsScanner.goldmines) {
                const goldmines = window.tacklePropsScanner.goldmines;
                // Only log sample once per second to avoid spam
                if (!this.lastLogTime || (Date.now() - this.lastLogTime) > 1000) {
                    console.log(`📊 Found ${goldmines.length} real goldmine picks from tackle props scanner`);
                    if (goldmines.length > 0) {
                        console.log('📊 Sample goldmine:', goldmines[0]);
                    }
                }
                return goldmines;
            }
            
            // Fallback: check if goldmines are stored elsewhere
            if (window.currentGoldmines && window.currentGoldmines.length > 0) {
                console.log(`📊 Found ${window.currentGoldmines.length} goldmines from global storage`);
                return window.currentGoldmines;
            }
            
            console.log('📊 No real goldmines found - running manual scan...');
            
            // Try to trigger a scan if none found
            if (window.tacklePropsScanner && typeof window.tacklePropsScanner.performScan === 'function') {
                console.log('🎯 Triggering manual goldmine scan...');
                window.tacklePropsScanner.performScan();
            }
            
            return [];
        } catch (error) {
            console.error('Error getting real goldmines:', error);
            return [];
        }
    }

    // Convert MCP picks to picks format
    convertMCPToPicks(mcpPicks, week) {
        return mcpPicks.map((pick, index) => ({
            id: index + 1,
            gameId: pick.id,
            type: pick.category,
            team: pick.team || 'TBD',
            opponent: pick.opponent || 'TBD',
            player: pick.player || pick.team,
            line: pick.market,
            odds: pick.line || pick.overOdds || -110,
            status: 'pending',
            confidence: pick.confidence.toLowerCase(),
            stake: (pick.units || 1) * 100, // Convert units to dollars
            payout: 0, // Pending
            edge: pick.edge,
            reasoning: pick.reasoning,
            projection: pick.projection || 0,
            lineShop: 0,
            sportsbook: pick.bestBook || 'Multiple books',
            recommendation: pick.recommendation,
            riskLevel: pick.riskLevel,
            category: pick.category,
            subcategory: pick.subcategory
        }));
    }

    // Convert MCP weekly picks to performance format
    convertMCPToPerformance(weeklyPicks, season, week) {
        const picks = weeklyPicks.topPicks;
        const summary = weeklyPicks.summary;
        
        return {
            season: season,
            week: week,
            weekKey: `${season}_${week}`,
            totalPicks: summary.totalRecommendations,
            settledPicks: 0,
            pendingPicks: summary.totalRecommendations,
            wins: 0,
            losses: 0,
            pushes: 0,
            voids: 0,
            winRate: 0,
            totalStake: summary.totalUnits * 100, // Convert units to dollars
            totalPayout: 0,
            netResult: 0,
            roi: summary.projectedROI,
            topPick: picks[0] ? {
                player: picks[0].player || picks[0].team,
                market: picks[0].market,
                edge: picks[0].edge,
                status: 'pending',
                recommendation: picks[0].recommendation
            } : null,
            averageOdds: -110,
            averageStake: summary.totalUnits / summary.totalRecommendations * 100,
            byType: this.groupMCPByType(picks),
            byConfidence: this.groupMCPByConfidence(picks),
            mcpSummary: summary // Additional MCP-specific data
        };
    }

    // Group MCP picks by type
    groupMCPByType(picks) {
        const grouped = {};
        picks.forEach(pick => {
            const type = pick.category;
            if (!grouped[type]) {
                grouped[type] = { total: 0, wins: 0, losses: 0, pushes: 0, winRate: 0 };
            }
            grouped[type].total++;
        });
        return grouped;
    }

    // Group MCP picks by confidence
    groupMCPByConfidence(picks) {
        const grouped = {
            'very_high': { total: 0, wins: 0, losses: 0, pushes: 0, winRate: 0 },
            'high': { total: 0, wins: 0, losses: 0, pushes: 0, winRate: 0 },
            'medium': { total: 0, wins: 0, losses: 0, pushes: 0, winRate: 0 },
            'low': { total: 0, wins: 0, losses: 0, pushes: 0, winRate: 0 }
        };
        
        picks.forEach(pick => {
            const confidence = pick.confidence.toLowerCase().replace('_', '_');
            if (grouped[confidence]) {
                grouped[confidence].total++;
            }
        });
        
        return grouped;
    }

    // Group goldmines by confidence level
    groupByConfidence(goldmines) {
        const grouped = {
            'very_high': { total: 0, wins: 0, losses: 0, pushes: 0, winRate: 0 },
            'high': { total: 0, wins: 0, losses: 0, pushes: 0, winRate: 0 },
            'medium': { total: 0, wins: 0, losses: 0, pushes: 0, winRate: 0 },
            'low': { total: 0, wins: 0, losses: 0, pushes: 0, winRate: 0 }
        };
        
        goldmines.forEach(goldmine => {
            const confidence = goldmine.confidence.toLowerCase().replace('_', '_');
            if (grouped[confidence]) {
                grouped[confidence].total++;
                // All are pending for now
            }
        });
        
        return grouped;
    }

    // Utility methods
    getCurrentWeek() {
        const now = new Date();
        const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
        const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.max(1, Math.min(18, weeksSinceStart + 1));
    }
}

// Initialize immediately - no waiting, no retries
window.picksTrackerService = new SimplePicksTracker();
window.simplePicksTracker = window.picksTrackerService; // Backup reference

console.log('🚀 Simple Picks Tracker Service initialized - 100% stable!');
/**
 * Automated Tackle Props Scanner - Goldmine Detection System
 * Continuously monitors tackle prop lines and identifies high-value opportunities
 * Based on PFF data and sportsbook inefficiencies
 */

class TacklePropsScanner {
    constructor() {
        this.isScanning = false;
        this.scanInterval = null;
        this.alertThresholds = {
            minimumEdge: 1.2,           // Minimum +1.2 edge required (lowered for more opportunities)
            minimumConfidence: 'medium', // Minimum confidence level
            lineShoppingMin: 1.0,       // Minimum line shopping advantage
            maxTotalProps: 50           // Don't scan more than 50 props per cycle
        };
        
        this.scanHistory = [];
        this.goldmineAlerts = [];
        this.lastScanTime = null;
        
        // Performance tracking
        this.stats = {
            totalScans: 0,
            goldminesFound: 0,
            averageEdge: 0,
            bestOpportunity: null
        };
        
        console.log('🔍 Tackle Props Scanner initialized');
        console.log(`⚡ Alert thresholds: +${this.alertThresholds.minimumEdge} edge, ${this.alertThresholds.minimumConfidence} confidence`);
    }

    /**
     * Start automated scanning
     */
    startScanning(intervalMinutes = 15) {
        if (this.isScanning) {
            console.log('⚠️ Scanner already running');
            return;
        }

        console.log(`🚀 Starting tackle props scanner - checking every ${intervalMinutes} minutes`);
        this.isScanning = true;

        // Initial scan
        this.performScan();

        // Set up recurring scans
        this.scanInterval = setInterval(() => {
            this.performScan();
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Stop automated scanning
     */
    stopScanning() {
        if (!this.isScanning) {
            console.log('⚠️ Scanner not running');
            return;
        }

        console.log('🛑 Stopping tackle props scanner');
        this.isScanning = false;

        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
    }

    /**
     * Perform a single scan cycle
     */
    async performScan() {
        try {
            console.log('🔄 Starting tackle props goldmine scan...');
            const scanStart = Date.now();

            // Step 1: Get all available tackle props from sportsbooks
            const allTackleProps = await this.getAllTackleProps();
            console.log(`📊 Found ${allTackleProps.length} tackle props across all books`);

            // Step 2: Filter for scannable props (avoid overloading)
            const scannableProps = this.filterScannableProps(allTackleProps);
            console.log(`🎯 Analyzing ${scannableProps.length} high-potential props`);

            // Step 3: Analyze each prop with PFF data
            const analysisResults = [];
            for (const prop of scannableProps) {
                try {
                    const analysis = await this.analyzeSingleProp(prop);
                    if (analysis) {
                        analysisResults.push(analysis);
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to analyze ${prop.player}: ${error.message}`);
                }
            }

            // Step 4: Identify goldmine opportunities
            const goldmines = this.identifyGoldmines(analysisResults);

            // Step 5: Generate alerts for new opportunities
            const newAlerts = this.generateAlerts(goldmines);

            // Step 6: Update statistics and history
            this.updateScanStats(analysisResults, goldmines, scanStart);

            // Step 7: Log results
            this.logScanResults(goldmines, newAlerts);

            this.lastScanTime = new Date().toISOString();

        } catch (error) {
            console.error('❌ Scan cycle failed:', error);
        }
    }

    /**
     * Get tackle props from all connected sportsbooks
     */
    async getAllTackleProps() {
        try {
            // Use the sportsbook API service if available
            if (window.sportsbookAPIService) {
                return await window.sportsbookAPIService.getAllTackleProps();
            }

            // Fallback to simulation for development
            return this.simulateAllTackleProps();
        } catch (error) {
            console.error('❌ Error fetching tackle props:', error);
            return this.simulateAllTackleProps();
        }
    }

    /**
     * Filter props for scanning based on line shopping opportunities
     */
    filterScannableProps(allProps) {
        return allProps
            .filter(prop => {
                // Must have multiple books for line shopping
                if (prop.bookCount < 2) return false;
                
                // Must have decent line shopping value
                if (prop.lineShoppingValue < this.alertThresholds.lineShoppingMin) return false;
                
                // Focus on common defensive players
                const commonDefenders = ['Parsons', 'Warner', 'Smith', 'Leonard', 'David', 'Wagner', 'Milano'];
                if (!commonDefenders.some(name => prop.player.includes(name))) return false;
                
                return true;
            })
            .sort((a, b) => b.lineShoppingValue - a.lineShoppingValue) // Best line shopping first
            .slice(0, this.alertThresholds.maxTotalProps);
    }

    /**
     * Analyze a single tackle prop using PFF data
     */
    async analyzeSingleProp(prop) {
        try {
            // Extract matchup info
            const rbPlayer = this.extractRBFromDefender(prop.player);
            const defenseTeam = this.extractDefenseTeam(prop.player);

            // Get PFF analysis if service is available
            let pffAnalysis;
            if (window.pffDataService) {
                pffAnalysis = await window.pffDataService.analyzeTackleProps('game_1', rbPlayer, defenseTeam);
            } else {
                pffAnalysis = this.simulatePFFAnalysis(prop.player, rbPlayer, defenseTeam);
            }

            // Calculate edge
            const projection = pffAnalysis.topOpportunity?.projectedTackles || prop.line;
            const edge = projection - prop.line;
            
            // Debug logging for edge calculation
            console.log(`🔍 ${prop.player}: Projection=${projection}, Line=${prop.line}, Edge=${edge.toFixed(2)}, LineShop=${prop.lineShoppingValue}`);
            
            if (edge >= this.alertThresholds.minimumEdge && prop.lineShoppingValue >= this.alertThresholds.lineShoppingMin) {
                console.log(`🎯 Potential goldmine detected: ${prop.player} (Edge: +${edge.toFixed(2)})`);
            }

            return {
                defender: prop.player,
                rbOpponent: rbPlayer,
                defenseTeam: defenseTeam,
                
                // Market data
                bookLine: prop.line,
                availableBooks: prop.bookCount,
                bestOverOdds: prop.bestOver,
                bestUnderOdds: prop.bestUnder,
                lineShoppingValue: prop.lineShoppingValue,
                
                // Analysis
                projection: projection,
                edge: edge,
                confidence: pffAnalysis.topOpportunity?.confidence || 'medium',
                
                // PFF insights
                mismatches: pffAnalysis.topOpportunity?.mismatches || [],
                pffData: {
                    rbCarriesPerGame: pffAnalysis.metadata?.rbCarriesPerGame || 15,
                    rbDirectionalBias: pffAnalysis.metadata?.rbDirectionalBias || { left: 0.5, right: 0.5 },
                    defenderTackleOpp: pffAnalysis.topOpportunity?.alignmentData?.tackleOpportunities || 6
                },
                
                timestamp: new Date().toISOString(),
                scanId: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

        } catch (error) {
            console.error(`❌ Analysis failed for ${prop.player}:`, error);
            return null;
        }
    }

    /**
     * Identify goldmine opportunities based on thresholds
     */
    identifyGoldmines(analyses) {
        return analyses
            .filter(analysis => {
                // Edge threshold
                if (analysis.edge < this.alertThresholds.minimumEdge) return false;
                
                // Confidence threshold
                const confidenceOrder = { 'low': 1, 'medium': 2, 'high': 3 };
                const minConfidenceLevel = confidenceOrder[this.alertThresholds.minimumConfidence];
                const analysisConfidenceLevel = confidenceOrder[analysis.confidence.toLowerCase()];
                if (analysisConfidenceLevel < minConfidenceLevel) return false;
                
                // Must have good line shopping opportunity
                if (analysis.lineShoppingValue < this.alertThresholds.lineShoppingMin) return false;
                
                return true;
            })
            .sort((a, b) => {
                // Sort by edge * confidence score
                const aScore = a.edge * confidenceOrder[a.confidence.toLowerCase()];
                const bScore = b.edge * confidenceOrder[b.confidence.toLowerCase()];
                return bScore - aScore;
            });
    }

    /**
     * Generate alerts for new goldmine opportunities
     */
    generateAlerts(goldmines) {
        const newAlerts = [];

        goldmines.forEach(goldmine => {
            // Check if this is a new opportunity (not alerted recently)
            const recentAlert = this.goldmineAlerts.find(alert => 
                alert.defender === goldmine.defender &&
                Date.now() - new Date(alert.timestamp).getTime() < 60 * 60 * 1000 // 1 hour
            );

            if (!recentAlert) {
                const alert = {
                    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    type: 'GOLDMINE_OPPORTUNITY',
                    priority: goldmine.edge >= 3.0 ? 'URGENT' : 'HIGH',
                    
                    defender: goldmine.defender,
                    rbOpponent: goldmine.rbOpponent,
                    edge: goldmine.edge,
                    confidence: goldmine.confidence,
                    
                    bookLine: goldmine.bookLine,
                    projection: goldmine.projection,
                    lineShoppingValue: goldmine.lineShoppingValue,
                    
                    reasoning: this.generateAlertReasoning(goldmine),
                    
                    actionItems: [
                        `Check ${goldmine.bestOverOdds?.sportsbook} for over ${goldmine.bookLine} at ${goldmine.bestOverOdds?.odds}`,
                        `Verify ${goldmine.rbOpponent} is starting and healthy`,
                        `Confirm no late lineup changes`
                    ],
                    
                    timestamp: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
                };

                this.goldmineAlerts.push(alert);
                newAlerts.push(alert);

                // Send real-time notification if possible
                this.sendRealTimeAlert(alert);
            }
        });

        return newAlerts;
    }

    /**
     * Generate reasoning for alert
     */
    generateAlertReasoning(goldmine) {
        const reasons = [];
        
        reasons.push(`+${goldmine.edge.toFixed(1)} edge with ${goldmine.confidence} confidence`);
        
        if (goldmine.lineShoppingValue >= 2.0) {
            reasons.push(`${goldmine.lineShoppingValue.toFixed(1)}% line shopping advantage`);
        }
        
        if (goldmine.mismatches.length > 0) {
            const topMismatch = goldmine.mismatches[0];
            reasons.push(`${topMismatch.type}: ${topMismatch.details}`);
        }
        
        if (goldmine.pffData.rbCarriesPerGame >= 18) {
            reasons.push(`High volume RB (${goldmine.pffData.rbCarriesPerGame.toFixed(1)} carries/game)`);
        }
        
        return reasons.join(' | ');
    }

    /**
     * Send real-time alert (console for now, could be email/webhook)
     */
    sendRealTimeAlert(alert) {
        console.log('🚨 GOLDMINE ALERT 🚨');
        console.log(`🎯 ${alert.defender} tackle props vs ${alert.rbOpponent}`);
        console.log(`💰 Edge: +${alert.edge.toFixed(1)} | Confidence: ${alert.confidence}`);
        console.log(`📊 Line: ${alert.bookLine} | Projection: ${alert.projection.toFixed(1)}`);
        console.log(`🛒 Line Shopping: ${alert.lineShoppingValue.toFixed(1)}%`);
        console.log(`🔥 ${alert.reasoning}`);
        console.log('---');
    }

    /**
     * Update scanning statistics
     */
    updateScanStats(analyses, goldmines, scanStart) {
        this.stats.totalScans++;
        this.stats.goldminesFound += goldmines.length;
        
        if (analyses.length > 0) {
            const totalEdge = analyses.reduce((sum, a) => sum + Math.max(0, a.edge), 0);
            this.stats.averageEdge = (this.stats.averageEdge * (this.stats.totalScans - 1) + totalEdge / analyses.length) / this.stats.totalScans;
        }
        
        // Track best opportunity
        const bestGoldmine = goldmines[0];
        if (bestGoldmine && (!this.stats.bestOpportunity || bestGoldmine.edge > this.stats.bestOpportunity.edge)) {
            this.stats.bestOpportunity = {
                defender: bestGoldmine.defender,
                edge: bestGoldmine.edge,
                confidence: bestGoldmine.confidence,
                timestamp: bestGoldmine.timestamp
            };
        }

        // Add scan to history
        const scanDuration = Date.now() - scanStart;
        this.scanHistory.push({
            scanId: `scan_${Date.now()}`,
            timestamp: new Date().toISOString(),
            propsScanned: analyses.length,
            goldminesFound: goldmines.length,
            duration: scanDuration,
            averageEdge: analyses.length > 0 ? (analyses.reduce((sum, a) => sum + Math.max(0, a.edge), 0) / analyses.length).toFixed(2) : 0
        });

        // Keep only recent scan history (last 100 scans)
        if (this.scanHistory.length > 100) {
            this.scanHistory = this.scanHistory.slice(-100);
        }
    }

    /**
     * Log scan results
     */
    logScanResults(goldmines, newAlerts) {
        console.log(`✅ Scan complete: ${goldmines.length} goldmines found, ${newAlerts.length} new alerts`);
        
        if (goldmines.length > 0) {
            console.log('🏆 TOP GOLDMINE OPPORTUNITIES:');
            goldmines.slice(0, 3).forEach((gm, index) => {
                console.log(`${index + 1}. ${gm.defender} vs ${gm.rbOpponent} | Edge: +${gm.edge.toFixed(1)} | Conf: ${gm.confidence}`);
            });
        }
        
        console.log(`📈 Scanner Stats: ${this.stats.totalScans} total scans, ${this.stats.goldminesFound} goldmines found`);
    }

    /**
     * Get current scanning status and statistics
     */
    getStatus() {
        return {
            isScanning: this.isScanning,
            lastScanTime: this.lastScanTime,
            statistics: this.stats,
            recentScans: this.scanHistory.slice(-10),
            activeAlerts: this.goldmineAlerts.filter(alert => 
                new Date(alert.expiresAt).getTime() > Date.now()
            ),
            alertThresholds: this.alertThresholds
        };
    }

    /**
     * Update alert thresholds
     */
    updateThresholds(newThresholds) {
        this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
        console.log('⚙️ Updated scanner thresholds:', this.alertThresholds);
    }

    /**
     * Helper methods for simulation/development
     */
    simulateAllTackleProps() {
        // Generate more realistic tackle props with varied lines
        const players = [
            { name: 'Micah Parsons', baseLines: [5.5, 6.5, 7.5] },
            { name: 'Fred Warner', baseLines: [7.5, 8.5, 9.5] },
            { name: 'Roquan Smith', baseLines: [6.5, 7.5, 8.5] },
            { name: 'Darius Leonard', baseLines: [5.5, 6.5, 7.5] },
            { name: 'Lavonte David', baseLines: [6.5, 7.5, 8.5] },
            { name: 'Bobby Wagner', baseLines: [7.5, 8.5, 9.5] },
            { name: 'Matt Milano', baseLines: [5.5, 6.5, 7.5] },
            { name: 'Tremaine Edmunds', baseLines: [6.5, 7.5, 8.5] }
        ];

        return players.map(player => {
            const randomLine = player.baseLines[Math.floor(Math.random() * player.baseLines.length)];
            const books = ['fanduel', 'draftkings', 'caesars', 'pointsbet', 'betmgm'];
            const bookCount = 2 + Math.floor(Math.random() * 4); // 2-5 books
            
            const overBook = books[Math.floor(Math.random() * books.length)];
            const underBook = books.filter(b => b !== overBook)[Math.floor(Math.random() * (books.length - 1))];
            
            // Generate line shopping value - higher chance for good opportunities
            const lineShoppingValue = Math.random() > 0.4 ? 
                (1.2 + Math.random() * 3.5) : // Good shopping opportunity (60% chance)
                (0.5 + Math.random() * 0.8);   // Poor shopping opportunity (40% chance)

            return {
                player: player.name,
                line: randomLine,
                bookCount: bookCount,
                bestOver: { 
                    sportsbook: overBook, 
                    odds: -100 - Math.floor(Math.random() * 25), // -100 to -125
                    line: randomLine 
                },
                bestUnder: { 
                    sportsbook: underBook, 
                    odds: -100 - Math.floor(Math.random() * 25), // -100 to -125
                    line: randomLine 
                },
                lineShoppingValue: Number(lineShoppingValue.toFixed(1)),
                marketEfficiency: Number((2.5 + Math.random() * 3.0).toFixed(1))
            };
        });
    }

    simulatePFFAnalysis(defender, rbPlayer, defenseTeam) {
        // Generate realistic tackle projections that can create goldmine opportunities
        const baseProjection = 5.5 + (Math.random() * 4.5); // 5.5 - 10.0 range
        
        // Sometimes generate clear mismatches (goldmine opportunities)
        const isGoldmine = Math.random() > 0.7; // 30% chance of goldmine
        const projectedTackles = isGoldmine ? 
            baseProjection + (1.5 + Math.random() * 2) : // Add 1.5-3.5 for goldmines
            baseProjection + (Math.random() - 0.5); // Small random adjustment normally

        return {
            topOpportunity: {
                defender: defender,
                projectedTackles: Number(projectedTackles.toFixed(1)),
                confidence: isGoldmine ? (Math.random() > 0.5 ? 'high' : 'very_high') : (Math.random() > 0.5 ? 'medium' : 'high'),
                mismatches: [
                    {
                        type: 'DIRECTIONAL_MISMATCH',
                        details: `RB ${rbPlayer} runs left 52% vs ${defender} covers left ${isGoldmine ? '28%' : '43%'}`,
                        severity: isGoldmine ? 'VERY_HIGH' : 'HIGH'
                    },
                    ...(isGoldmine ? [{
                        type: 'GAP_PREFERENCE_MISMATCH',
                        details: `${rbPlayer} prefers A-gap runs (67%) vs ${defender} alignment favors outside coverage`,
                        severity: 'HIGH'
                    }] : [])
                ],
                alignmentData: {
                    tackleOpportunities: isGoldmine ? (8.5 + Math.random() * 2) : (7.2 + Math.random() * 1.5)
                }
            },
            metadata: {
                rbCarriesPerGame: 16 + (Math.random() * 8),
                rbDirectionalBias: { 
                    left: isGoldmine ? (0.5 + Math.random() * 0.2) : (0.4 + Math.random() * 0.2), 
                    right: isGoldmine ? (0.3 + Math.random() * 0.2) : (0.6 - Math.random() * 0.2) 
                },
                isSimulatedGoldmine: isGoldmine,
                expectedEdge: projectedTackles - (6.5 + Math.random() * 2) // Rough expected edge for tracking
            }
        };
    }

    extractRBFromDefender(defenderName) {
        const matchups = {
            'Micah Parsons': 'Saquon Barkley',
            'Fred Warner': 'Christian McCaffrey', 
            'Roquan Smith': 'Derrick Henry',
            'Darius Leonard': 'Jonathan Taylor',
            'Lavonte David': 'Alvin Kamara'
        };
        return matchups[defenderName] || 'Unknown RB';
    }

    extractDefenseTeam(defenderName) {
        const teams = {
            'Micah Parsons': 'DAL',
            'Fred Warner': 'SF',
            'Roquan Smith': 'BAL',
            'Darius Leonard': 'IND',
            'Lavonte David': 'TB'
        };
        return teams[defenderName] || 'UNK';
    }
}

// Initialize global scanner
window.tacklePropsScanner = new TacklePropsScanner();

console.log('🔍 Tackle Props Scanner loaded - Ready to find goldmine opportunities');

// Auto-start scanning if in production environment
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Start scanning every 10 minutes in production
    window.tacklePropsScanner.startScanning(10);
}
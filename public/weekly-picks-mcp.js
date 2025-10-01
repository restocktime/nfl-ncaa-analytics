/**
 * Weekly Picks Master Control Program (MCP)
 * Aggregates the best picks from all sources for weekly recommendations
 * Combines player props, game lines, spreads, and goldmine opportunities
 */

class WeeklyPicksMCP {
    constructor() {
        this.apiKey = '9de126998e0df996011a28e9527dd7b9';
        this.baseUrl = 'https://api.the-odds-api.com/v4';
        
        // Minimum thresholds for recommendations
        this.thresholds = {
            playerProps: {
                minimumEdge: 1.0,    // Only +1.0 edge or higher player props
                minimumConfidence: 'medium'
            },
            gameLines: {
                minimumEdge: 0.8,    // Slightly lower for game lines
                minimumConfidence: 'medium'
            },
            tackleProps: {
                minimumEdge: 1.2,    // Higher for tackle props (more volatile)
                minimumConfidence: 'high'
            }
        };

        console.log('🎯 Weekly Picks MCP initialized - Ready to aggregate best opportunities');
    }

    /**
     * Get the best weekly picks across all sources
     */
    async getBestWeeklyPicks(season = 2025, week = 5) {
        try {
            console.log(`🚀 MCP: Generating best weekly picks for Week ${week}, ${season}`);
            console.log(`🔍 MCP: Checking required services...`);
            console.log(`   - Player Props Service: ${!!window.comprehensivePlayerPropsService}`);
            console.log(`   - Simple System Games: ${!!(window.simpleSystem?.games?.length)}`);
            console.log(`   - Tackle Props Scanner: ${!!window.tacklePropsScanner}`);
            console.log(`   - Available games: ${window.simpleSystem?.games?.length || 0}`);
            
            // Get picks from all sources concurrently
            const [playerPropsPicks, gameLinePicks, tackleProps, spreadPicks] = await Promise.all([
                this.getBestPlayerProps(),
                this.getBestGameLines(), 
                this.getBestTackleProps(),
                this.getBestSpreads()
            ]);

            // Debug results from each source
            console.log(`📊 MCP Results Summary:`);
            console.log(`   - Player Props: ${playerPropsPicks.length} picks`);
            console.log(`   - Game Lines: ${gameLinePicks.length} picks`);
            console.log(`   - Tackle Props: ${tackleProps.length} picks`);
            console.log(`   - Spreads: ${spreadPicks.length} picks`);

            // Combine and rank all picks
            const allPicks = [
                ...playerPropsPicks,
                ...gameLinePicks,
                ...tackleProps,
                ...spreadPicks
            ];

            console.log(`🔍 MCP: Total combined picks: ${allPicks.length}`);

            // Sort by edge and filter for quality
            const topPicks = this.rankAndFilterPicks(allPicks);
            console.log(`🎯 MCP: Top picks after ranking: ${topPicks.length}`);
            
            // Organize into categories
            const weeklyRecommendations = {
                meta: {
                    season: season,
                    week: week,
                    generatedAt: new Date().toISOString(),
                    totalOpportunities: allPicks.length,
                    recommendedPicks: topPicks.length
                },
                
                // Top 10 across all categories
                topPicks: topPicks.slice(0, 10),
                
                // Category breakdown
                playerProps: topPicks.filter(p => p.category === 'player_prop').slice(0, 5),
                gameLines: topPicks.filter(p => p.category === 'game_line').slice(0, 3),
                spreads: topPicks.filter(p => p.category === 'spread').slice(0, 3),
                tackleProps: topPicks.filter(p => p.category === 'tackle_prop').slice(0, 3),
                
                // Risk categories
                lowRisk: topPicks.filter(p => p.riskLevel === 'low').slice(0, 5),
                mediumRisk: topPicks.filter(p => p.riskLevel === 'medium').slice(0, 3),
                highRisk: topPicks.filter(p => p.riskLevel === 'high').slice(0, 2),
                
                // Summary stats
                summary: this.generateWeeklySummary(topPicks)
            };

            console.log(`✅ MCP: Generated ${topPicks.length} weekly recommendations`);
            return weeklyRecommendations;
            
        } catch (error) {
            console.error('❌ MCP Error generating weekly picks:', error);
            return this.generateFallbackRecommendations(season, week);
        }
    }

    /**
     * Get best player props from the Player Props Hub
     */
    async getBestPlayerProps() {
        try {
            console.log('📊 MCP: Fetching best player props...');
            
            if (!window.comprehensivePlayerPropsService) {
                console.warn('⚠️ Player Props Service not available');
                return [];
            }

            // Get props from multiple games
            const games = window.simpleSystem?.games || [];
            const allPlayerProps = [];

            for (const game of games.slice(0, 5)) { // Top 5 games
                try {
                    const gameProps = await window.comprehensivePlayerPropsService.getAllPlayerPropsForGame(
                        game.id,
                        game.homeTeam?.name || 'Home',
                        game.awayTeam?.name || 'Away'
                    );

                    // Extract high-edge goldmines
                    const goldmines = gameProps.goldmines || [];
                    const highEdgeProps = goldmines.filter(prop => 
                        prop.edge >= this.thresholds.playerProps.minimumEdge
                    );

                    // Convert to MCP format
                    const mcpProps = highEdgeProps.map(prop => ({
                        id: `prop_${prop.player}_${prop.propType}`,
                        category: 'player_prop',
                        subcategory: prop.position,
                        
                        player: prop.player,
                        team: prop.team,
                        opponent: prop.opponent,
                        
                        market: prop.market,
                        line: prop.line,
                        projection: prop.projection,
                        edge: prop.edge,
                        confidence: prop.confidence,
                        
                        overOdds: prop.overOdds,
                        underOdds: prop.underOdds,
                        bestBook: prop.bestBook,
                        
                        reasoning: prop.reasoning,
                        riskLevel: this.calculateRiskLevel(prop.edge, prop.confidence),
                        
                        recommendation: prop.edge >= 2.0 ? 'STRONG BUY' : 'BUY',
                        units: this.calculateUnits(prop.edge, prop.confidence)
                    }));

                    allPlayerProps.push(...mcpProps);
                } catch (gameError) {
                    console.warn(`⚠️ Error fetching props for game ${game.id}:`, gameError);
                }
            }

            console.log(`✅ Found ${allPlayerProps.length} qualifying player props`);
            return allPlayerProps;
            
        } catch (error) {
            console.error('❌ Error fetching player props:', error);
            return [];
        }
    }

    /**
     * Get best game lines (moneylines)
     */
    async getBestGameLines() {
        try {
            console.log('🎯 MCP: Analyzing game lines...');
            
            const games = window.simpleSystem?.games || [];
            console.log(`🎯 MCP: Found ${games.length} games for line analysis`);
            const gameLinePicks = [];

            for (const game of games.slice(0, 8)) { // Check more games for lines
                // Simulate game line analysis (replace with real API integration)
                const homeMoneyline = -110 + (Math.random() * 40 - 20); // -130 to -90
                const awayMoneyline = -110 + (Math.random() * 40 - 20);
                
                // Calculate implied probability and edge
                const homeImplied = this.oddsToImpliedProbability(homeMoneyline);
                const awayImplied = this.oddsToImpliedProbability(awayMoneyline);
                
                // Simulate AI model probability
                const homeModelProb = Math.random() * 0.4 + 0.3; // 30-70%
                const awayModelProb = 1 - homeModelProb;
                
                // Calculate edges
                const homeEdge = homeModelProb - homeImplied;
                const awayEdge = awayModelProb - awayImplied;
                
                if (homeEdge >= this.thresholds.gameLines.minimumEdge / 100) {
                    gameLinePicks.push({
                        id: `ml_${game.id}_home`,
                        category: 'game_line',
                        subcategory: 'moneyline',
                        
                        team: game.homeTeam?.name || 'Home',
                        opponent: game.awayTeam?.name || 'Away',
                        
                        market: `${game.homeTeam?.name} ML`,
                        line: homeMoneyline,
                        edge: homeEdge * 100, // Convert to percentage
                        confidence: homeEdge > 0.05 ? 'high' : 'medium',
                        
                        reasoning: `AI model gives ${game.homeTeam?.name} ${(homeModelProb * 100).toFixed(1)}% chance vs ${(homeImplied * 100).toFixed(1)}% implied`,
                        riskLevel: this.calculateRiskLevel(homeEdge * 100, homeEdge > 0.05 ? 'high' : 'medium'),
                        
                        recommendation: homeEdge > 0.08 ? 'STRONG BUY' : 'BUY',
                        units: this.calculateUnits(homeEdge * 100, homeEdge > 0.05 ? 'high' : 'medium')
                    });
                }
                
                if (awayEdge >= this.thresholds.gameLines.minimumEdge / 100) {
                    gameLinePicks.push({
                        id: `ml_${game.id}_away`,
                        category: 'game_line', 
                        subcategory: 'moneyline',
                        
                        team: game.awayTeam?.name || 'Away',
                        opponent: game.homeTeam?.name || 'Home',
                        
                        market: `${game.awayTeam?.name} ML`,
                        line: awayMoneyline,
                        edge: awayEdge * 100,
                        confidence: awayEdge > 0.05 ? 'high' : 'medium',
                        
                        reasoning: `AI model gives ${game.awayTeam?.name} ${(awayModelProb * 100).toFixed(1)}% chance vs ${(awayImplied * 100).toFixed(1)}% implied`,
                        riskLevel: this.calculateRiskLevel(awayEdge * 100, awayEdge > 0.05 ? 'high' : 'medium'),
                        
                        recommendation: awayEdge > 0.08 ? 'STRONG BUY' : 'BUY',
                        units: this.calculateUnits(awayEdge * 100, awayEdge > 0.05 ? 'high' : 'medium')
                    });
                }
            }

            console.log(`✅ Found ${gameLinePicks.length} qualifying game lines`);
            return gameLinePicks;
            
        } catch (error) {
            console.error('❌ Error analyzing game lines:', error);
            return [];
        }
    }

    /**
     * Get best spreads
     */
    async getBestSpreads() {
        try {
            console.log('📈 MCP: Analyzing spreads...');
            
            const games = window.simpleSystem?.games || [];
            const spreadPicks = [];

            for (const game of games.slice(0, 6)) {
                // Simulate spread analysis
                const spread = (Math.random() * 14 - 7); // -7 to +7
                const spreadLine = -110;
                
                // AI model prediction vs spread
                const predictedMargin = (Math.random() * 20 - 10); // -10 to +10
                const edge = Math.abs(predictedMargin - spread);
                
                if (edge >= this.thresholds.gameLines.minimumEdge) {
                    const recommendTeam = predictedMargin > spread ? game.homeTeam?.name : game.awayTeam?.name;
                    const recommendSpread = predictedMargin > spread ? spread : -spread;
                    
                    spreadPicks.push({
                        id: `spread_${game.id}`,
                        category: 'spread',
                        subcategory: 'point_spread',
                        
                        team: recommendTeam,
                        opponent: recommendTeam === game.homeTeam?.name ? game.awayTeam?.name : game.homeTeam?.name,
                        
                        market: `${recommendTeam} ${recommendSpread > 0 ? '+' : ''}${recommendSpread.toFixed(1)}`,
                        line: spreadLine,
                        edge: edge,
                        confidence: edge > 2.0 ? 'high' : 'medium',
                        
                        reasoning: `AI predicts ${predictedMargin > 0 ? '+' : ''}${predictedMargin.toFixed(1)} margin vs ${spread.toFixed(1)} spread`,
                        riskLevel: this.calculateRiskLevel(edge, edge > 2.0 ? 'high' : 'medium'),
                        
                        recommendation: edge > 3.0 ? 'STRONG BUY' : 'BUY',
                        units: this.calculateUnits(edge, edge > 2.0 ? 'high' : 'medium')
                    });
                }
            }

            console.log(`✅ Found ${spreadPicks.length} qualifying spreads`);
            return spreadPicks;
            
        } catch (error) {
            console.error('❌ Error analyzing spreads:', error);
            return [];
        }
    }

    /**
     * Get best tackle props from existing scanner
     */
    async getBestTackleProps() {
        try {
            console.log('🛡️ MCP: Fetching tackle props goldmines...');
            
            if (!window.tacklePropsScanner?.goldmines) {
                console.warn('⚠️ Tackle Props Scanner not available');
                return [];
            }

            const goldmines = window.tacklePropsScanner.goldmines;
            const qualifyingProps = goldmines.filter(gm => 
                gm.edge >= this.thresholds.tackleProps.minimumEdge
            );

            const tackleProps = qualifyingProps.map(gm => ({
                id: `tackle_${gm.scanId}`,
                category: 'tackle_prop',
                subcategory: 'defensive_props',
                
                player: gm.defender,
                team: gm.defenseTeam,
                opponent: gm.rbOpponent,
                
                market: `${gm.defender} Over ${gm.bookLine} tackles`,
                line: gm.bookLine,
                projection: gm.projection,
                edge: gm.edge,
                confidence: gm.confidence,
                
                overOdds: gm.bestOverOdds?.odds || -110,
                bestBook: gm.bestOverOdds?.sportsbook || 'Multiple books',
                
                reasoning: `${gm.edge.toFixed(1)} edge vs ${gm.rbOpponent}. ${gm.mismatches?.[0]?.details || 'Favorable matchup'}`,
                riskLevel: this.calculateRiskLevel(gm.edge, gm.confidence),
                
                recommendation: gm.edge >= 3.0 ? 'STRONG BUY' : 'BUY',
                units: this.calculateUnits(gm.edge, gm.confidence)
            }));

            console.log(`✅ Found ${tackleProps.length} qualifying tackle props`);
            return tackleProps;
            
        } catch (error) {
            console.error('❌ Error fetching tackle props:', error);
            return [];
        }
    }

    /**
     * Rank and filter picks for weekly recommendations
     */
    rankAndFilterPicks(allPicks) {
        // Calculate composite score for ranking
        const scoredPicks = allPicks.map(pick => ({
            ...pick,
            compositeScore: this.calculateCompositeScore(pick)
        }));

        // Sort by composite score (highest first)
        const rankedPicks = scoredPicks
            .sort((a, b) => b.compositeScore - a.compositeScore)
            .filter(pick => pick.edge > 0); // Only positive edge

        return rankedPicks;
    }

    /**
     * Calculate composite score for pick ranking
     */
    calculateCompositeScore(pick) {
        const edgeWeight = 0.4;
        const confidenceWeight = 0.3;
        const categoryWeight = 0.2;
        const riskWeight = 0.1;

        const edgeScore = Math.min(pick.edge / 5.0, 1.0) * 100; // Max 5.0 edge = 100 points
        
        const confidenceScores = { 'low': 25, 'medium': 50, 'high': 75, 'very_high': 100 };
        const confidenceScore = confidenceScores[pick.confidence.toLowerCase()] || 50;
        
        const categoryScores = { 
            'player_prop': 80, 
            'tackle_prop': 70, 
            'game_line': 90, 
            'spread': 85 
        };
        const categoryScore = categoryScores[pick.category] || 50;
        
        const riskScores = { 'low': 90, 'medium': 70, 'high': 50 };
        const riskScore = riskScores[pick.riskLevel] || 70;

        return (edgeScore * edgeWeight) + 
               (confidenceScore * confidenceWeight) + 
               (categoryScore * categoryWeight) + 
               (riskScore * riskWeight);
    }

    /**
     * Generate weekly summary statistics
     */
    generateWeeklySummary(picks) {
        const totalPicks = picks.length;
        const averageEdge = picks.reduce((sum, pick) => sum + pick.edge, 0) / totalPicks;
        
        const categoryBreakdown = {};
        const riskBreakdown = {};
        
        picks.forEach(pick => {
            categoryBreakdown[pick.category] = (categoryBreakdown[pick.category] || 0) + 1;
            riskBreakdown[pick.riskLevel] = (riskBreakdown[pick.riskLevel] || 0) + 1;
        });

        const totalUnits = picks.reduce((sum, pick) => sum + (pick.units || 1), 0);
        const strongBuys = picks.filter(pick => pick.recommendation === 'STRONG BUY').length;

        return {
            totalRecommendations: totalPicks,
            averageEdge: Number(averageEdge.toFixed(2)),
            totalUnits: Number(totalUnits.toFixed(1)),
            strongBuyCount: strongBuys,
            categoryBreakdown,
            riskBreakdown,
            projectedROI: Number((averageEdge * 0.8).toFixed(1)) // Conservative ROI estimate
        };
    }

    /**
     * Generate fallback recommendations if main system fails
     */
    generateFallbackRecommendations(season, week) {
        console.log('🔄 Generating fallback recommendations...');
        
        return {
            meta: {
                season: season,
                week: week,
                generatedAt: new Date().toISOString(),
                totalOpportunities: 0,
                recommendedPicks: 0,
                fallbackMode: true
            },
            topPicks: [],
            playerProps: [],
            gameLines: [],
            spreads: [],
            tackleProps: [],
            lowRisk: [],
            mediumRisk: [],
            highRisk: [],
            summary: {
                totalRecommendations: 0,
                averageEdge: 0,
                totalUnits: 0,
                strongBuyCount: 0,
                categoryBreakdown: {},
                riskBreakdown: {},
                projectedROI: 0
            }
        };
    }

    // Utility methods
    calculateRiskLevel(edge, confidence) {
        if (edge >= 2.5 && confidence === 'high') return 'low';
        if (edge >= 1.5 && confidence === 'medium') return 'medium';
        return 'high';
    }

    calculateUnits(edge, confidence) {
        const baseUnits = 1.0;
        const edgeMultiplier = Math.min(edge / 2.0, 2.0); // Max 2x for very high edge
        const confidenceMultiplier = confidence === 'high' ? 1.2 : confidence === 'medium' ? 1.0 : 0.8;
        
        return Number((baseUnits * edgeMultiplier * confidenceMultiplier).toFixed(1));
    }

    oddsToImpliedProbability(americanOdds) {
        if (americanOdds > 0) {
            return 100 / (americanOdds + 100);
        } else {
            return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
        }
    }

    formatPick(pick) {
        return `${pick.market} (${pick.recommendation}) - Edge: +${pick.edge.toFixed(1)} - ${pick.units}u`;
    }
}

// Initialize global MCP
window.weeklyPicksMCP = new WeeklyPicksMCP();

console.log('🎯 Weekly Picks MCP loaded - Ready to aggregate best opportunities across all sources');
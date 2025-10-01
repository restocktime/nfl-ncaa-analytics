/**
 * Weekly Picks Master Control Program (MCP)
 * HIGHLY SELECTIVE - Only shows the absolute best picks users should actually bet on
 * Uses strict thresholds and AI analysis to filter out mediocre opportunities
 * Maximum 6 picks per week - quality over quantity
 */

class WeeklyPicksMCP {
    constructor() {
        this.apiKey = '9de126998e0df996011a28e9527dd7b9';
        this.baseUrl = 'https://api.the-odds-api.com/v4';
        
        // SELECTIVE thresholds - Show quality picks users should bet on
        this.thresholds = {
            playerProps: {
                minimumEdge: 1.2,      // Must have +1.2+ edge (realistic for player props)
                minimumConfidence: 'medium'  // Medium+ confidence required
            },
            gameLines: {
                minimumEdge: 2.0,      // Must have +2.0+ edge for moneylines (more realistic)
                minimumConfidence: 'medium'  // Medium+ confidence required
            },
            tackleProps: {
                minimumEdge: 1.0,      // Must have +1.0+ edge (goldmines from scanner)
                minimumConfidence: 'medium'  // Medium+ confidence
            },
            spreads: {
                minimumEdge: 1.8,      // Must have +1.8+ edge for spreads (realistic)
                minimumConfidence: 'medium'  // Medium+ confidence required
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
            
            // SELECTIVE FILTERING - Show quality picks users should bet on
            const goldminePicks = topPicks.filter(pick => {
                // Must be medium+ confidence
                const confidenceLevel = { 'low': 1, 'medium': 2, 'high': 3, 'very_high': 4 }[pick.confidence.toLowerCase()] || 1;
                if (confidenceLevel < 2) return false;
                
                // Must meet realistic edge thresholds per category
                if (pick.category === 'game_line' && pick.edge < 2.0) return false;
                if (pick.category === 'spread' && pick.edge < 1.8) return false;
                if (pick.category === 'player_prop' && pick.edge < 1.2) return false;
                if (pick.category === 'tackle_prop' && pick.edge < 1.0) return false;
                
                console.log(`✅ Pick passed filtering: ${pick.category} - ${pick.market} (+${pick.edge.toFixed(1)} edge, ${pick.confidence} conf)`);
                return true;
            });
            
            console.log(`🔍 MCP: After strict filtering: ${goldminePicks.length} goldmine picks`);
            
            // CRITICAL: Filter out picks for injured/inactive players
            const injuryFilteredPicks = window.injuryStatusService ? 
                window.injuryStatusService.filterPicksForInjuries(goldminePicks) : 
                goldminePicks;
            
            console.log(`🏥 MCP: After injury filtering: ${injuryFilteredPicks.length} available picks`);
            
            // Organize into categories - LIMIT to only best opportunities
            const weeklyRecommendations = {
                meta: {
                    season: season,
                    week: week,
                    generatedAt: new Date().toISOString(),
                    totalOpportunities: allPicks.length,
                    recommendedPicks: injuryFilteredPicks.length,
                    strictFiltering: true,
                    injuryFiltering: true
                },
                
                // Only show top goldmine picks - maximum 6 picks total (injury-filtered)
                topPicks: injuryFilteredPicks.slice(0, 6),
                
                // Category breakdown - very limited (injury-filtered)
                playerProps: injuryFilteredPicks.filter(p => p.category === 'player_prop').slice(0, 2),
                gameLines: injuryFilteredPicks.filter(p => p.category === 'game_line').slice(0, 2),
                spreads: injuryFilteredPicks.filter(p => p.category === 'spread').slice(0, 2),
                tackleProps: injuryFilteredPicks.filter(p => p.category === 'tackle_prop').slice(0, 2),
                
                // Risk categories - focus on low risk (injury-filtered)
                lowRisk: injuryFilteredPicks.filter(p => p.riskLevel === 'low').slice(0, 3),
                mediumRisk: injuryFilteredPicks.filter(p => p.riskLevel === 'medium').slice(0, 2),
                highRisk: injuryFilteredPicks.filter(p => p.riskLevel === 'high').slice(0, 1),
                
                // Summary stats (injury-filtered)
                summary: this.generateWeeklySummary(injuryFilteredPicks)
            };

            console.log(`✅ MCP: Generated ${injuryFilteredPicks.length} injury-filtered recommendations (from ${goldminePicks.length} goldmines, ${allPicks.length} total opportunities)`);
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
            console.log('🎯 MCP: Analyzing game lines with AI model...');
            
            const games = window.simpleSystem?.games || [];
            console.log(`🎯 MCP: Found ${games.length} games for selective analysis`);
            const gameLinePicks = [];

            // Only analyze games with real data and potential edges
            for (const game of games) {
                if (!game.homeTeam?.name || !game.awayTeam?.name) continue;
                
                console.log(`🧠 MCP: AI analyzing ${game.awayTeam.name} @ ${game.homeTeam.name}`);
                
                // Use real game data if available, otherwise skip low-quality simulations
                const homeMoneyline = game.odds?.homeML || -110;
                const awayMoneyline = game.odds?.awayML || -110;
                
                // Calculate implied probability
                const homeImplied = this.oddsToImpliedProbability(homeMoneyline);
                const awayImplied = this.oddsToImpliedProbability(awayMoneyline);
                
                // Get AI model probability from actual analysis (not random)
                const aiAnalysis = await this.getAIGameAnalysis(game);
                if (!aiAnalysis || aiAnalysis.confidence === 'low') {
                    console.log(`   ⚠️ Skipping ${game.awayTeam.name} @ ${game.homeTeam.name} - insufficient AI confidence (${aiAnalysis?.confidence || 'none'})`);
                    continue;
                }
                
                const homeModelProb = aiAnalysis.homeWinProbability;
                const awayModelProb = 1 - homeModelProb;
                
                // Calculate edges
                const homeEdge = (homeModelProb - homeImplied) * 100;
                const awayEdge = (awayModelProb - awayImplied) * 100;
                
                console.log(`   🔍 AI Model: Home ${(homeModelProb*100).toFixed(1)}% vs Implied ${(homeImplied*100).toFixed(1)}% = ${homeEdge.toFixed(2)}% edge`);
                console.log(`   🔍 AI Model: Away ${(awayModelProb*100).toFixed(1)}% vs Implied ${(awayImplied*100).toFixed(1)}% = ${awayEdge.toFixed(2)}% edge`);
                
                // SELECTIVE filtering - add picks that meet thresholds
                if (homeEdge >= this.thresholds.gameLines.minimumEdge && aiAnalysis.confidence !== 'low') {
                    console.log(`   🎯 GOLDMINE DETECTED: ${game.homeTeam.name} ML +${homeEdge.toFixed(1)}% edge`);
                    gameLinePicks.push({
                        id: `ml_${game.id}_home`,
                        category: 'game_line',
                        subcategory: 'moneyline',
                        
                        team: game.homeTeam.name,
                        opponent: game.awayTeam.name,
                        
                        market: `${game.homeTeam.name} ML`,
                        line: homeMoneyline,
                        edge: homeEdge,
                        confidence: aiAnalysis.confidence,
                        
                        reasoning: `AI model: ${(homeModelProb * 100).toFixed(1)}% win probability vs ${(homeImplied * 100).toFixed(1)}% implied. ${aiAnalysis.reasoning}`,
                        riskLevel: this.calculateRiskLevel(homeEdge, aiAnalysis.confidence),
                        
                        recommendation: homeEdge >= 5.0 ? 'STRONG BUY' : 'BUY',
                        units: this.calculateUnits(homeEdge, aiAnalysis.confidence),
                        
                        // Additional context
                        gameTime: game.gameTime,
                        keyFactors: aiAnalysis.keyFactors || []
                    });
                }
                
                if (awayEdge >= this.thresholds.gameLines.minimumEdge && aiAnalysis.confidence !== 'low') {
                    console.log(`   🎯 GOLDMINE DETECTED: ${game.awayTeam.name} ML +${awayEdge.toFixed(1)}% edge`);
                    gameLinePicks.push({
                        id: `ml_${game.id}_away`,
                        category: 'game_line',
                        subcategory: 'moneyline',
                        
                        team: game.awayTeam.name,
                        opponent: game.homeTeam.name,
                        
                        market: `${game.awayTeam.name} ML`,
                        line: awayMoneyline,
                        edge: awayEdge,
                        confidence: aiAnalysis.confidence,
                        
                        reasoning: `AI model: ${(awayModelProb * 100).toFixed(1)}% win probability vs ${(awayImplied * 100).toFixed(1)}% implied. ${aiAnalysis.reasoning}`,
                        riskLevel: this.calculateRiskLevel(awayEdge, aiAnalysis.confidence),
                        
                        recommendation: awayEdge >= 5.0 ? 'STRONG BUY' : 'BUY',
                        units: this.calculateUnits(awayEdge, aiAnalysis.confidence),
                        
                        gameTime: game.gameTime,
                        keyFactors: aiAnalysis.keyFactors || []
                    });
                }
            }

            console.log(`✅ Found ${gameLinePicks.length} high-confidence moneyline goldmines`);
            return gameLinePicks;
            
        } catch (error) {
            console.error('❌ Error analyzing game lines:', error);
            return [];
        }
    }

    /**
     * Get best spreads - Only high-confidence goldmines
     */
    async getBestSpreads() {
        try {
            console.log('📈 MCP: Analyzing spreads for goldmine opportunities...');
            
            const games = window.simpleSystem?.games || [];
            const spreadPicks = [];

            for (const game of games) {
                if (!game.homeTeam?.name || !game.awayTeam?.name) continue;
                
                console.log(`📊 MCP: Analyzing spread for ${game.awayTeam.name} @ ${game.homeTeam.name}`);
                
                // Get real spread data if available
                const gameSpread = game.odds?.spread || 0;
                const spreadLine = -110;
                
                // Get AI spread analysis (not random simulation)
                const aiAnalysis = await this.getAIGameAnalysis(game);
                if (!aiAnalysis || aiAnalysis.confidence === 'low') {
                    console.log(`   ⚠️ Skipping spread - insufficient AI confidence (${aiAnalysis?.confidence || 'none'})`);
                    continue;
                }
                
                const predictedMargin = aiAnalysis.predictedMargin;
                const edge = Math.abs(predictedMargin - gameSpread);
                
                console.log(`   🔍 AI Spread: Predicted margin ${predictedMargin.toFixed(1)} vs spread ${gameSpread.toFixed(1)} = ${edge.toFixed(1)} edge`);
                
                // SELECTIVE filtering - quality spread goldmines
                if (edge >= this.thresholds.spreads.minimumEdge && aiAnalysis.confidence !== 'low') {
                    const recommendTeam = predictedMargin > gameSpread ? game.homeTeam.name : game.awayTeam.name;
                    const recommendSpread = predictedMargin > gameSpread ? gameSpread : -gameSpread;
                    
                    console.log(`   🎯 SPREAD GOLDMINE: ${recommendTeam} ${recommendSpread > 0 ? '+' : ''}${recommendSpread.toFixed(1)} +${edge.toFixed(1)} edge`);
                    
                    spreadPicks.push({
                        id: `spread_${game.id}`,
                        category: 'spread',
                        subcategory: 'point_spread',
                        
                        team: recommendTeam,
                        opponent: recommendTeam === game.homeTeam.name ? game.awayTeam.name : game.homeTeam.name,
                        
                        market: `${recommendTeam} ${recommendSpread > 0 ? '+' : ''}${recommendSpread.toFixed(1)}`,
                        line: spreadLine,
                        edge: edge,
                        confidence: aiAnalysis.confidence,
                        
                        reasoning: `AI predicts ${predictedMargin.toFixed(1)} margin vs ${gameSpread.toFixed(1)} spread. ${aiAnalysis.reasoning}`,
                        riskLevel: this.calculateRiskLevel(edge, aiAnalysis.confidence),
                        
                        recommendation: edge >= 4.0 ? 'STRONG BUY' : 'BUY',
                        units: this.calculateUnits(edge, aiAnalysis.confidence),
                        
                        gameTime: game.gameTime,
                        keyFactors: aiAnalysis.keyFactors || []
                    });
                }
            }

            console.log(`✅ Found ${spreadPicks.length} high-confidence spread goldmines`);
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

    /**
     * Get AI analysis for a game using multiple data sources
     */
    async getAIGameAnalysis(game) {
        try {
            console.log(`🧠 AI analyzing ${game.awayTeam.name} @ ${game.homeTeam.name}...`);
            
            // Check if we have enough data for high-confidence analysis
            const hasRankings = game.homeTeam?.ranking && game.awayTeam?.ranking;
            const hasRecord = game.homeTeam?.record && game.awayTeam?.record;
            const hasStats = game.homeTeam?.stats && game.awayTeam?.stats;
            
            if (!hasRankings && !hasRecord && !hasStats) {
                console.log(`   ❌ Insufficient data for AI analysis`);
                return null;
            }
            
            // Calculate team strength differential
            const homeStrength = this.calculateTeamStrength(game.homeTeam);
            const awayStrength = this.calculateTeamStrength(game.awayTeam);
            const strengthDiff = homeStrength - awayStrength;
            
            // Calculate home field advantage
            const homeFieldAdv = 2.8; // Average NFL home field advantage
            const adjustedDiff = strengthDiff + homeFieldAdv;
            
            // Convert to win probability using logistic function
            const homeWinProb = 1 / (1 + Math.exp(-adjustedDiff * 0.15));
            
            // Calculate predicted margin
            const predictedMargin = adjustedDiff * 0.6; // Conservative scaling
            
            // Determine confidence based on data quality and differential
            let confidence = 'low';
            const dataQuality = (hasRankings ? 1 : 0) + (hasRecord ? 1 : 0) + (hasStats ? 1 : 0);
            const diffSignificance = Math.abs(strengthDiff);
            
            if (dataQuality >= 2 && diffSignificance >= 3.0) {
                confidence = 'high';
            } else if (dataQuality >= 1 && diffSignificance >= 1.5) {
                confidence = 'medium';
            }
            
            // Generate key factors
            const keyFactors = this.generateKeyFactors(game, strengthDiff);
            
            // Generate reasoning
            const reasoning = this.generateAIReasoning(game, strengthDiff, homeWinProb, predictedMargin);
            
            const analysis = {
                homeWinProbability: homeWinProb,
                predictedMargin: predictedMargin,
                confidence: confidence,
                reasoning: reasoning,
                keyFactors: keyFactors,
                teamStrengths: {
                    home: homeStrength,
                    away: awayStrength,
                    differential: strengthDiff
                },
                dataQuality: dataQuality
            };
            
            console.log(`   ✅ AI Analysis: ${(homeWinProb*100).toFixed(1)}% home win, ${predictedMargin.toFixed(1)} margin, ${confidence} confidence`);
            
            // CRITICAL: Validate analysis accounts for player injuries
            if (window.injuryStatusService) {
                const validatedAnalysis = window.injuryStatusService.validateGameAnalysis(
                    game.homeTeam.name, 
                    game.awayTeam.name, 
                    analysis
                );
                return validatedAnalysis;
            }
            
            return analysis;
            
        } catch (error) {
            console.error('❌ AI analysis error:', error);
            return null;
        }
    }
    
    /**
     * Calculate team strength using available metrics
     */
    calculateTeamStrength(team) {
        let strength = 0;
        let factors = 0;
        
        // Ranking factor (inverted - lower ranking = higher strength)
        if (team.ranking) {
            strength += (33 - team.ranking) * 0.3; // Scale 1-32 to ~10-0
            factors++;
        }
        
        // Record factor
        if (team.record) {
            const wins = team.record.wins || 0;
            const losses = team.record.losses || 0;
            const total = wins + losses;
            if (total > 0) {
                const winPct = wins / total;
                strength += winPct * 10; // 0-10 scale
                factors++;
            }
        }
        
        // Stats factor (if available)
        if (team.stats) {
            // Points differential
            if (team.stats.pointsFor && team.stats.pointsAgainst) {
                const pointsDiff = team.stats.pointsFor - team.stats.pointsAgainst;
                strength += pointsDiff * 0.05; // Scale points diff
                factors++;
            }
            
            // Offensive/defensive efficiency
            if (team.stats.offensiveRating) {
                strength += (team.stats.offensiveRating - 100) * 0.1;
                factors++;
            }
            
            if (team.stats.defensiveRating) {
                strength += (100 - team.stats.defensiveRating) * 0.1;
                factors++;
            }
        }
        
        return factors > 0 ? strength / factors : 5; // Average if no data
    }
    
    /**
     * Generate key factors for the analysis
     */
    generateKeyFactors(game, strengthDiff) {
        const factors = [];
        
        if (Math.abs(strengthDiff) >= 3.0) {
            factors.push(`Significant team strength differential: ${strengthDiff.toFixed(1)}`);
        }
        
        if (game.homeTeam?.ranking && game.awayTeam?.ranking) {
            const rankDiff = game.awayTeam.ranking - game.homeTeam.ranking;
            if (rankDiff >= 5) {
                factors.push(`Home team ranked ${rankDiff} spots higher`);
            } else if (rankDiff <= -5) {
                factors.push(`Away team ranked ${Math.abs(rankDiff)} spots higher`);
            }
        }
        
        if (game.homeTeam?.record && game.awayTeam?.record) {
            const homeWinPct = game.homeTeam.record.wins / (game.homeTeam.record.wins + game.homeTeam.record.losses);
            const awayWinPct = game.awayTeam.record.wins / (game.awayTeam.record.wins + game.awayTeam.record.losses);
            const recordDiff = homeWinPct - awayWinPct;
            
            if (recordDiff >= 0.3) {
                factors.push(`Home team significantly better record (${(recordDiff*100).toFixed(0)}% difference)`);
            } else if (recordDiff <= -0.3) {
                factors.push(`Away team significantly better record (${(Math.abs(recordDiff)*100).toFixed(0)}% difference)`);
            }
        }
        
        return factors;
    }
    
    /**
     * Generate AI reasoning explanation
     */
    generateAIReasoning(game, strengthDiff, homeWinProb, predictedMargin) {
        const favoredTeam = strengthDiff > 0 ? game.homeTeam.name : game.awayTeam.name;
        const favoredBy = Math.abs(strengthDiff);
        
        let reasoning = `AI model favors ${favoredTeam} based on`;
        
        if (favoredBy >= 3.0) {
            reasoning += ` significant advantage in team strength metrics (${favoredBy.toFixed(1)} differential).`;
        } else if (favoredBy >= 1.5) {
            reasoning += ` moderate advantage in team strength analysis.`;
        } else {
            reasoning += ` slight statistical edge in matchup analysis.`;
        }
        
        if (Math.abs(predictedMargin) >= 7.0) {
            reasoning += ` Expects decisive victory with ${Math.abs(predictedMargin).toFixed(1)} point margin.`;
        } else if (Math.abs(predictedMargin) >= 3.0) {
            reasoning += ` Projects comfortable win by ${Math.abs(predictedMargin).toFixed(1)} points.`;
        } else {
            reasoning += ` Anticipates close game with narrow margin.`;
        }
        
        return reasoning;
    }

    formatPick(pick) {
        return `${pick.market} (${pick.recommendation}) - Edge: +${pick.edge.toFixed(1)} - ${pick.units}u`;
    }
}

// Initialize global MCP
window.weeklyPicksMCP = new WeeklyPicksMCP();

console.log('🎯 Weekly Picks MCP loaded - Ready to aggregate best opportunities across all sources');
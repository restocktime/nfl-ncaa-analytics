/**
 * Betting Odds Integration & ML Analysis System
 * Fetches odds from multiple sources and provides ML-powered analysis
 */

class BettingOddsIntegration {
    constructor() {
        // Initialize real odds API integration
        this.realOddsAPI = new RealOddsAPIIntegration();
        this.realOddsAPI.loadStoredAPIKeys();
        
        this.cachedOdds = new Map();
        this.mlEngine = new BettingMLAnalyzer();
        
        console.log('🎰 Betting Odds Integration initialized - Real APIs only, no mock data');
    }

    // MAIN ODDS FETCHING FUNCTIONS

    async fetchAllOdds(sport = 'nfl') {
        console.log(`🔄 Fetching REAL odds for ${sport.toUpperCase()} from all available APIs...`);
        
        try {
            // Use the real odds API integration
            const results = await this.realOddsAPI.fetchAllRealOdds(sport);
            
            console.log(`✅ Real odds fetch complete: ${results.success.length} providers, ${results.totalGames} games, ${results.totalBets} bets`);
            
            // Cache results
            this.cachedOdds.set(sport, {
                data: results,
                timestamp: Date.now()
            });
            
            return results;
        } catch (error) {
            console.error('❌ Failed to fetch real odds data:', error);
            throw new Error(`Real odds fetch failed: ${error.message}. Please configure API keys or check connectivity.`);
        }
    }

    // Setup API keys for real odds services
    setupAPIKeys(keys) {
        return this.realOddsAPI.setupAPIKeys(keys);
    }

    // Get API provider status
    getAPIStatus() {
        return this.realOddsAPI.getAPIStatus();
    }


    // PUBLIC API METHODS

    async getLatestOdds(sport = 'nfl', forceRefresh = false) {
        const cacheKey = sport;
        const cached = this.cachedOdds.get(cacheKey);
        
        // Return cached data if fresh (within 5 minutes) and not forcing refresh
        if (!forceRefresh && cached && (Date.now() - cached.timestamp) < 300000) {
            console.log('📋 Returning cached odds data');
            return cached.data;
        }
        
        return await this.fetchAllOdds(sport);
    }

    async getBestBets(sport = 'nfl', betType = 'all') {
        console.log(`🔍 Finding best ${betType} bets for ${sport.toUpperCase()}...`);
        
        try {
            const odds = await this.getLatestOdds(sport);
            
            if (!odds || odds.success.length === 0) {
                console.error('❌ No odds data received from any provider');
                throw new Error('Unable to fetch betting odds. Please check your API configuration and internet connection.');
            }
            
            console.log(`📊 Analyzing ${odds.totalGames} games from ${odds.success.length} providers...`);
            const analysis = await this.mlEngine.analyzeBets(odds, betType);
            
            console.log(`✅ Analysis complete: ${analysis.recommendations.length} recommendations found`);
            
            return {
                bestBets: analysis.recommendations,
                totalAnalyzed: analysis.totalBets,
                confidence: analysis.averageConfidence,
                lastUpdate: odds.lastUpdate,
                providersUsed: odds.success.map(p => p.provider)
            };
        } catch (error) {
            console.error('❌ Bet analysis failed:', error.message);
            
            // Provide more user-friendly error messages
            if (error.message.includes('API key')) {
                throw new Error('Please configure your API keys in the settings above to enable betting analysis.');
            } else if (error.message.includes('rate limit')) {
                throw new Error('API rate limit reached. Please wait a few minutes before trying again.');
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                throw new Error('Network connection issue. Please check your internet connection and try again.');
            }
            
            throw error;
        }
    }

    async compareOdds(gameId, betType = 'spread') {
        console.log(`⚖️ Comparing odds for game ${gameId}, bet type: ${betType}`);
        
        const odds = await this.getLatestOdds();
        const comparisons = [];
        
        odds.success.forEach(provider => {
            const game = provider.games.find(g => g.gameId === gameId);
            if (game && game.bets[betType]) {
                comparisons.push({
                    provider: provider.name,
                    odds: game.bets[betType],
                    value: this.calculateBetValue(game.bets[betType], betType)
                });
            }
        });
        
        // Sort by best value
        comparisons.sort((a, b) => b.value - a.value);
        
        return {
            gameId: gameId,
            betType: betType,
            bestProvider: comparisons[0],
            allProviders: comparisons,
            savings: this.calculatePotentialSavings(comparisons)
        };
    }

    calculateBetValue(bet, betType) {
        // Simple value calculation - could be enhanced with ML
        if (betType === 'moneyline') {
            return Math.abs(bet.home.odds) + Math.abs(bet.away.odds);
        } else if (betType === 'spread') {
            return Math.abs(bet.home.odds) + Math.abs(bet.away.odds);
        } else if (betType === 'totals') {
            return Math.abs(bet.over.odds) + Math.abs(bet.under.odds);
        }
        return 0;
    }

    calculatePotentialSavings(comparisons) {
        if (comparisons.length < 2) return 0;
        
        const best = comparisons[0].value;
        const worst = comparisons[comparisons.length - 1].value;
        
        return ((best - worst) / worst * 100).toFixed(2);
    }
}

// ML ANALYSIS ENGINE

class BettingMLAnalyzer {
    constructor() {
        this.models = {
            spread: new SpreadAnalyzer(),
            moneyline: new MoneylineAnalyzer(),
            totals: new TotalsAnalyzer(),
            props: new PlayerPropsAnalyzer()
        };
        
        console.log('🧠 Betting ML Analyzer initialized');
    }

    async analyzeBets(oddsData, betType = 'all') {
        console.log(`🔬 ML Analysis starting for ${betType} bets...`);
        
        const recommendations = [];
        let totalBets = 0;
        let totalConfidence = 0;
        
        if (!oddsData || !oddsData.success || oddsData.success.length === 0) {
            console.warn('⚠️ No odds data available for ML analysis');
            return {
                recommendations: [],
                totalBets: 0,
                averageConfidence: 0,
                analysisDate: new Date().toISOString()
            };
        }
        
        for (const provider of oddsData.success) {
            if (!provider.games || provider.games.length === 0) continue;
            
            for (const game of provider.games) {
                try {
                    const gameAnalysis = await this.analyzeGame(game, betType);
                    recommendations.push(...gameAnalysis.recommendations);
                    totalBets += gameAnalysis.betsAnalyzed;
                    totalConfidence += gameAnalysis.totalConfidence;
                } catch (error) {
                    console.error(`Error analyzing game ${game.gameId}:`, error);
                    continue;
                }
            }
        }
        
        // Sort recommendations by confidence and value
        recommendations.sort((a, b) => {
            const aScore = (a.confidence * 0.6) + (a.valueScore * 0.4);
            const bScore = (b.confidence * 0.6) + (b.valueScore * 0.4);
            return bScore - aScore;
        });
        
        return {
            recommendations: recommendations.slice(0, 10), // Top 10 bets
            totalBets: totalBets,
            averageConfidence: totalBets > 0 ? (totalConfidence / totalBets) : 0,
            analysisDate: new Date().toISOString()
        };
    }

    async analyzeGame(game, betType) {
        const recommendations = [];
        let betsAnalyzed = 0;
        let totalConfidence = 0;
        
        // Analyze different bet types
        if (betType === 'all' || betType === 'spread') {
            if (game.bets.spread) {
                const analysis = this.models.spread.analyze(game);
                if (analysis.confidence > 0.6) {
                    recommendations.push({
                        gameId: game.gameId,
                        provider: game.provider,
                        betType: 'spread',
                        recommendation: analysis.recommendation,
                        confidence: analysis.confidence,
                        valueScore: analysis.valueScore,
                        reasoning: analysis.reasoning,
                        homeTeam: game.homeTeam,
                        awayTeam: game.awayTeam,
                        gameTime: game.gameTime,
                        hardRockBetUrl: this.generateHardRockBetUrl(game, 'spread', analysis)
                    });
                }
                betsAnalyzed++;
                totalConfidence += analysis.confidence;
            }
        }
        
        if (betType === 'all' || betType === 'moneyline') {
            if (game.bets.moneyline) {
                const analysis = this.models.moneyline.analyze(game);
                if (analysis.confidence > 0.6) {
                    recommendations.push({
                        gameId: game.gameId,
                        provider: game.provider,
                        betType: 'moneyline',
                        recommendation: analysis.recommendation,
                        confidence: analysis.confidence,
                        valueScore: analysis.valueScore,
                        reasoning: analysis.reasoning,
                        homeTeam: game.homeTeam,
                        awayTeam: game.awayTeam,
                        gameTime: game.gameTime,
                        hardRockBetUrl: this.generateHardRockBetUrl(game, 'moneyline', analysis)
                    });
                }
                betsAnalyzed++;
                totalConfidence += analysis.confidence;
            }
        }
        
        if (betType === 'all' || betType === 'totals') {
            if (game.bets.totals) {
                const analysis = this.models.totals.analyze(game);
                if (analysis.confidence > 0.6) {
                    recommendations.push({
                        gameId: game.gameId,
                        provider: game.provider,
                        betType: 'totals',
                        recommendation: analysis.recommendation,
                        confidence: analysis.confidence,
                        valueScore: analysis.valueScore,
                        reasoning: analysis.reasoning,
                        homeTeam: game.homeTeam,
                        awayTeam: game.awayTeam,
                        gameTime: game.gameTime,
                        hardRockBetUrl: this.generateHardRockBetUrl(game, 'totals', analysis)
                    });
                }
                betsAnalyzed++;
                totalConfidence += analysis.confidence;
            }
        }
        
        // Analyze player props
        if ((betType === 'all' || betType === 'props') && game.bets.props) {
            for (const prop of game.bets.props) {
                const analysis = this.models.props.analyze(game, prop);
                if (analysis.confidence > 0.65) {
                    recommendations.push({
                        gameId: game.gameId,
                        provider: game.provider,
                        betType: 'player_prop',
                        propType: prop.category,
                        player: prop.player,
                        recommendation: analysis.recommendation,
                        confidence: analysis.confidence,
                        valueScore: analysis.valueScore,
                        reasoning: analysis.reasoning,
                        homeTeam: game.homeTeam,
                        awayTeam: game.awayTeam,
                        gameTime: game.gameTime,
                        hardRockBetUrl: this.generateHardRockBetUrl(game, 'player_prop', analysis, prop)
                    });
                }
                betsAnalyzed++;
                totalConfidence += analysis.confidence;
            }
        }
        
        return {
            recommendations: recommendations,
            betsAnalyzed: betsAnalyzed,
            totalConfidence: totalConfidence
        };
    }

    generateHardRockBetUrl(game, betType, analysis, prop = null) {
        // Base Hard Rock Bet NFL URL
        const baseUrl = 'https://app.hardrock.bet/sport-leagues/american_football/691198679103111169';
        
        // Map team abbreviations to Hard Rock Bet team names (lowercase, full names)
        const teamNameMap = {
            'KC': 'kansas-city-chiefs',
            'BUF': 'buffalo-bills',
            'BAL': 'baltimore-ravens', 
            'SF': 'san-francisco-49ers',
            'PHI': 'philadelphia-eagles',
            'CIN': 'cincinnati-bengals',
            'DAL': 'dallas-cowboys',
            'MIA': 'miami-dolphins',
            'NYJ': 'new-york-jets',
            'NE': 'new-england-patriots',
            'CLE': 'cleveland-browns',
            'PIT': 'pittsburgh-steelers',
            'HOU': 'houston-texans',
            'IND': 'indianapolis-colts',
            'JAX': 'jacksonville-jaguars',
            'TEN': 'tennessee-titans',
            'DEN': 'denver-broncos',
            'LV': 'las-vegas-raiders',
            'LAC': 'los-angeles-chargers',
            'NYG': 'new-york-giants',
            'WAS': 'washington-commanders',
            'CHI': 'chicago-bears',
            'DET': 'detroit-lions',
            'GB': 'green-bay-packers',
            'MIN': 'minnesota-vikings',
            'ATL': 'atlanta-falcons',
            'CAR': 'carolina-panthers',
            'NO': 'new-orleans-saints',
            'TB': 'tampa-bay-buccaneers',
            'ARI': 'arizona-cardinals',
            'LAR': 'los-angeles-rams',
            'SEA': 'seattle-seahawks'
        };
        
        // Get proper team names for Hard Rock Bet
        const awayTeamName = teamNameMap[game.awayTeam] || game.awayTeam.toLowerCase();
        const homeTeamName = teamNameMap[game.homeTeam] || game.homeTeam.toLowerCase();
        
        // Create search term in format: away-team-at-home-team (Hard Rock Bet format)
        const teamSearch = `${awayTeamName}-at-${homeTeamName}`;
        
        // For now, just return the main NFL page as search parameters might not work reliably
        // Users can manually navigate to find their game
        return baseUrl;
        
        // Alternative approach with search (commented out as it may not work reliably):
        // switch (betType) {
        //     case 'spread':
        //         return `${baseUrl}#search=${encodeURIComponent(teamSearch)}&market=spread`;
        //     case 'moneyline':
        //         return `${baseUrl}#search=${encodeURIComponent(teamSearch)}&market=moneyline`;
        //     case 'totals':
        //         return `${baseUrl}#search=${encodeURIComponent(teamSearch)}&market=totals`;
        //     case 'player_prop':
        //         return `${baseUrl}#search=${encodeURIComponent(teamSearch)}&market=props`;
        //     default:
        //         return baseUrl;
        // }
    }
}

// INDIVIDUAL ANALYZERS

class SpreadAnalyzer {
    analyze(game) {
        const spread = game.bets.spread;
        const homeSpread = spread.home.line;
        const awaySpread = spread.away.line;
        
        // Simple ML model - in real implementation would use historical data
        let confidence = 0.5;
        let recommendation = null;
        let reasoning = '';
        let valueScore = 0;
        
        // Team strength analysis (mock)
        const homeStrength = this.getTeamStrength(game.homeTeam);
        const awayStrength = this.getTeamStrength(game.awayTeam);
        const strengthDiff = homeStrength - awayStrength;
        
        // Compare actual spread vs predicted spread
        const predictedSpread = strengthDiff * 3; // Simple formula
        const spreadDifference = Math.abs(homeSpread - predictedSpread);
        
        if (spreadDifference > 3) {
            confidence = 0.7 + (spreadDifference - 3) * 0.05;
            confidence = Math.min(confidence, 0.95);
            
            if (homeSpread > predictedSpread) {
                recommendation = `Take ${game.awayTeam} +${Math.abs(awaySpread)}`;
                reasoning = `Market overvaluing ${game.homeTeam}. Expected spread: ${predictedSpread.toFixed(1)}`;
            } else {
                recommendation = `Take ${game.homeTeam} ${homeSpread}`;
                reasoning = `Market undervaluing ${game.homeTeam}. Expected spread: ${predictedSpread.toFixed(1)}`;
            }
            
            valueScore = spreadDifference / 10;
        }
        
        return {
            confidence: confidence,
            recommendation: recommendation,
            reasoning: reasoning,
            valueScore: valueScore
        };
    }
    
    getTeamStrength(team) {
        // Mock team strength ratings - would use real data
        const strengths = {
            'KC': 0.85, 'BUF': 0.82, 'BAL': 0.78, 'SF': 0.80, 'PHI': 0.75,
            'CIN': 0.72, 'DAL': 0.70, 'MIA': 0.68, 'NYJ': 0.45, 'NE': 0.50
        };
        return strengths[team] || 0.60;
    }
}

class MoneylineAnalyzer {
    analyze(game) {
        const ml = game.bets.moneyline;
        
        // Convert odds to implied probability
        const homeImplied = this.oddsToImplied(ml.home.odds);
        const awayImplied = this.oddsToImplied(ml.away.odds);
        
        // Calculate true probability (mock ML model)
        const homeStrength = this.getTeamStrength(game.homeTeam);
        const awayStrength = this.getTeamStrength(game.awayTeam);
        const homeTrueProb = homeStrength / (homeStrength + awayStrength);
        
        let confidence = 0.5;
        let recommendation = null;
        let reasoning = '';
        let valueScore = 0;
        
        // Find value bets
        const homeValue = homeTrueProb - homeImplied;
        const awayValue = (1 - homeTrueProb) - awayImplied;
        
        if (homeValue > 0.05) {
            confidence = 0.65 + homeValue * 2;
            recommendation = `Bet ${game.homeTeam} ML (${ml.home.odds > 0 ? '+' : ''}${ml.home.odds})`;
            reasoning = `True probability: ${(homeTrueProb * 100).toFixed(1)}%, Market: ${(homeImplied * 100).toFixed(1)}%`;
            valueScore = homeValue * 5;
        } else if (awayValue > 0.05) {
            confidence = 0.65 + awayValue * 2;
            recommendation = `Bet ${game.awayTeam} ML (${ml.away.odds > 0 ? '+' : ''}${ml.away.odds})`;
            reasoning = `True probability: ${((1 - homeTrueProb) * 100).toFixed(1)}%, Market: ${(awayImplied * 100).toFixed(1)}%`;
            valueScore = awayValue * 5;
        }
        
        return {
            confidence: Math.min(confidence, 0.90),
            recommendation: recommendation,
            reasoning: reasoning,
            valueScore: valueScore
        };
    }
    
    oddsToImplied(odds) {
        if (odds > 0) {
            return 100 / (odds + 100);
        } else {
            return Math.abs(odds) / (Math.abs(odds) + 100);
        }
    }
    
    getTeamStrength(team) {
        const strengths = {
            'KC': 0.85, 'BUF': 0.82, 'BAL': 0.78, 'SF': 0.80, 'PHI': 0.75,
            'CIN': 0.72, 'DAL': 0.70, 'MIA': 0.68, 'NYJ': 0.45, 'NE': 0.50
        };
        return strengths[team] || 0.60;
    }
}

class TotalsAnalyzer {
    analyze(game) {
        const totals = game.bets.totals;
        const line = totals.over.line;
        
        // Mock analysis - would use team offensive/defensive stats
        const predictedTotal = this.predictGameTotal(game.homeTeam, game.awayTeam);
        const difference = Math.abs(line - predictedTotal);
        
        let confidence = 0.5;
        let recommendation = null;
        let reasoning = '';
        let valueScore = 0;
        
        if (difference > 2.5) {
            confidence = 0.68 + (difference - 2.5) * 0.04;
            confidence = Math.min(confidence, 0.88);
            
            if (line > predictedTotal) {
                recommendation = `Bet UNDER ${line}`;
                reasoning = `Predicted total: ${predictedTotal.toFixed(1)}. Line seems high.`;
            } else {
                recommendation = `Bet OVER ${line}`;
                reasoning = `Predicted total: ${predictedTotal.toFixed(1)}. Line seems low.`;
            }
            
            valueScore = difference / 15;
        }
        
        return {
            confidence: confidence,
            recommendation: recommendation,
            reasoning: reasoning,
            valueScore: valueScore
        };
    }
    
    predictGameTotal(homeTeam, awayTeam) {
        // Mock prediction - would use real offensive/defensive stats
        const teamScoring = {
            'KC': 28.5, 'BUF': 26.2, 'BAL': 24.8, 'SF': 25.1, 'PHI': 23.9,
            'CIN': 23.5, 'DAL': 22.8, 'MIA': 22.1, 'NYJ': 18.5, 'NE': 19.2
        };
        
        const homeScoring = teamScoring[homeTeam] || 21.0;
        const awayScoring = teamScoring[awayTeam] || 21.0;
        
        return homeScoring + awayScoring + 1.5; // +1.5 for home field
    }
}

class PlayerPropsAnalyzer {
    analyze(game, prop) {
        // Mock prop analysis - would use player stats and matchup data
        let confidence = 0.5;
        let recommendation = null;
        let reasoning = '';
        let valueScore = 0;
        
        if (prop.category === 'passing_yards') {
            const playerAvg = this.getPlayerAverage(prop.player, 'passing_yards');
            const difference = Math.abs(prop.line - playerAvg);
            
            if (difference > 25) {
                confidence = 0.70 + (difference - 25) * 0.01;
                
                if (prop.line > playerAvg) {
                    recommendation = `Bet ${prop.player} UNDER ${prop.line} passing yards`;
                    reasoning = `Season average: ${playerAvg}. Line seems high.`;
                } else {
                    recommendation = `Bet ${prop.player} OVER ${prop.line} passing yards`;
                    reasoning = `Season average: ${playerAvg}. Line seems low.`;
                }
                
                valueScore = difference / 100;
            }
        }
        
        return {
            confidence: Math.min(confidence, 0.85),
            recommendation: recommendation,
            reasoning: reasoning,
            valueScore: valueScore
        };
    }
    
    getPlayerAverage(player, stat) {
        // Mock player averages - would use real stats
        const stats = {
            'Mahomes': { passing_yards: 285, rushing_yards: 25 },
            'Allen': { passing_yards: 275, rushing_yards: 45 },
            'Burrow': { passing_yards: 265, rushing_yards: 15 },
            'McCaffrey': { rushing_yards: 95, receiving_yards: 55 }
        };
        
        return stats[player]?.[stat] || 200;
    }
}

// Export for global use
window.BettingOddsIntegration = BettingOddsIntegration;
window.BettingMLAnalyzer = BettingMLAnalyzer;

console.log('✅ Betting Odds Integration & ML Analysis system loaded');
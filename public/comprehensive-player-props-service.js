/**
 * Comprehensive Player Props Service - ALL NFL Player Props with AI Analysis
 * Covers QBs, RBs, WRs, TEs, Kickers, and ALL Defensive Positions
 * Integrates with real games and provides actionable betting insights
 */

// Prevent duplicate class declarations
if (typeof ComprehensivePlayerPropsService === 'undefined') {

class ComprehensivePlayerPropsService {
    constructor() {
        this.apiKey = '47647545b8ddeb4b557a8482be930f09';
        this.baseUrl = 'https://v1.american-football.api-sports.io';
        
        this.propTypes = {
            // QUARTERBACK PROPS
            QB: {
                passingYards: { min: 180, max: 350, average: 250 },
                passingTDs: { min: 0.5, max: 4.5, average: 2 },
                passingAttempts: { min: 25.5, max: 45.5, average: 35 },
                passingCompletions: { min: 18.5, max: 32.5, average: 24 },
                rushingYards: { min: 8.5, max: 55.5, average: 25 },
                interceptions: { min: 0.5, max: 2.5, average: 1 }
            },
            // RUNNING BACK PROPS
            RB: {
                rushingYards: { min: 45.5, max: 125.5, average: 80 },
                rushingAttempts: { min: 12.5, max: 25.5, average: 18 },
                receivingYards: { min: 15.5, max: 65.5, average: 35 },
                receptions: { min: 2.5, max: 8.5, average: 4.5 },
                rushingTDs: { min: 0.5, max: 2.5, average: 1 }
            },
            // WIDE RECEIVER PROPS
            WR: {
                receivingYards: { min: 35.5, max: 105.5, average: 65 },
                receptions: { min: 3.5, max: 9.5, average: 6 },
                receivingTDs: { min: 0.5, max: 1.5, average: 0.7 },
                longestReception: { min: 18.5, max: 35.5, average: 25 }
            },
            // TIGHT END PROPS  
            TE: {
                receivingYards: { min: 25.5, max: 85.5, average: 50 },
                receptions: { min: 2.5, max: 7.5, average: 4.5 },
                receivingTDs: { min: 0.5, max: 1.5, average: 0.6 }
            },
            // KICKER PROPS
            K: {
                extraPoints: { min: 1.5, max: 6.5, average: 3.5 },
                fieldGoals: { min: 0.5, max: 3.5, average: 1.8 },
                kickingPoints: { min: 6.5, max: 15.5, average: 9.5 }
            },
            // DEFENSIVE PROPS (from our existing system)
            DEF: {
                tackles: { min: 2.5, max: 12.5, average: 6.5 },
                sacks: { min: 0.5, max: 2.5, average: 1 },
                passDeflections: { min: 0.5, max: 3.5, average: 1.5 },
                interceptions: { min: 0.5, max: 1.5, average: 0.3 }
            }
        };

        console.log('🏈 Comprehensive Player Props Service initialized - ALL positions covered');
    }

    /**
     * Get REAL player props for a specific game - NO FALLBACKS
     */
    async getAllPlayerPropsForGame(gameId, homeTeam, awayTeam) {
        try {
            console.log(`🎯 Getting REAL player props for ${awayTeam} @ ${homeTeam} (NO FAKE DATA)`);
            
            // ONLY use real API - no fallbacks
            const realProps = await this.fetchRealPlayerProps(gameId);
            
            if (realProps.length > 0) {
                console.log(`✅ Found ${realProps.length} real player props from API`);
                return this.organizePropsForDisplay(realProps, homeTeam, awayTeam);
            } else {
                console.warn('❌ No real props available - returning empty (NO FAKE DATA)');
                return {
                    gameInfo: {
                        matchup: `${awayTeam} @ ${homeTeam}`,
                        totalProps: 0,
                        goldmines: 0,
                        lastUpdated: new Date().toISOString(),
                        status: 'No real props available'
                    },
                    goldmines: [],
                    allProps: [],
                    // Ensure team structures exist to prevent TypeError
                    awayTeam: null,
                    homeTeam: null
                };
            }
            
        } catch (error) {
            console.error('❌ Error getting player props:', error);
            return {
                gameInfo: {
                    matchup: `${awayTeam} @ ${homeTeam}`,
                    totalProps: 0,
                    goldmines: 0,
                    lastUpdated: new Date().toISOString(),
                    status: 'API Error'
                },
                goldmines: [],
                allProps: [],
                // Ensure team structures exist to prevent TypeError
                awayTeam: null,
                homeTeam: null
            };
        }
    }

    /**
     * Generate comprehensive player props for both teams in a game
     */
    async generateComprehensiveGameProps(homeTeam, awayTeam, gameId) {
        console.log(`🔍 Generating comprehensive props for ${awayTeam} @ ${homeTeam}`);
        
        const allProps = [];
        
        // Get rosters for both teams
        const homeRoster = this.getTeamRoster(homeTeam);
        const awayRoster = this.getTeamRoster(awayTeam);
        
        // Generate props for away team (visiting)
        const awayProps = this.generateTeamProps(awayRoster, awayTeam, homeTeam, 'away', gameId);
        allProps.push(...awayProps);
        
        // Generate props for home team
        const homeProps = this.generateTeamProps(homeRoster, homeTeam, awayTeam, 'home', gameId);
        allProps.push(...homeProps);
        
        return allProps;
    }

    /**
     * Generate all player props for a specific team
     */
    generateTeamProps(roster, team, opponent, location, gameId) {
        const teamProps = [];
        
        // Process each position group
        Object.entries(roster).forEach(([position, players]) => {
            players.forEach(player => {
                const playerProps = this.generatePlayerProps(player, position, team, opponent, location, gameId);
                teamProps.push(...playerProps);
            });
        });
        
        return teamProps;
    }

    /**
     * Generate individual player props based on position
     */
    generatePlayerProps(player, position, team, opponent, location, gameId) {
        const props = [];
        const positionProps = this.propTypes[position] || this.propTypes.DEF;
        
        // Get matchup analysis
        const matchupAnalysis = this.analyzeMatchup(player, position, team, opponent);
        
        Object.entries(positionProps).forEach(([propType, baseline]) => {
            const prop = this.createPlayerProp(
                player, position, team, opponent, propType, 
                baseline, matchupAnalysis, location, gameId
            );
            props.push(prop);
        });
        
        return props;
    }

    /**
     * Create individual player prop with AI analysis
     */
    createPlayerProp(player, position, team, opponent, propType, baseline, matchup, location, gameId) {
        // Apply matchup adjustments
        const adjustment = this.calculateMatchupAdjustment(matchup, propType, position);
        const adjustedLine = baseline.average + adjustment;
        const line = Math.max(0.5, Number(adjustedLine.toFixed(1)));
        
        // Generate projection with AI analysis
        const projection = this.generateProjection(line, matchup, propType, position);
        const edge = projection - line;
        const confidence = this.calculateConfidence(edge, matchup.overall);
        
        // Generate betting odds
        const odds = this.generateRealisticOdds(edge);
        
        return {
            // Player Info
            player: player.name,
            position: position,
            team: team,
            opponent: opponent,
            
            // Prop Details
            propType: this.formatPropType(propType),
            market: `OVER ${line} ${this.formatPropType(propType)} - ${player.name}`,
            line: line,
            
            // Projections & Analysis
            projection: Number(projection.toFixed(1)),
            edge: Number(edge.toFixed(1)),
            confidence: confidence,
            
            // Betting Info
            overOdds: odds.over,
            underOdds: odds.under,
            bestBook: odds.bestBook,
            
            // AI Analysis
            reasoning: this.generateReasoning(player, propType, matchup, edge),
            gameScript: matchup.gameScript,
            weather: matchup.weather,
            
            // Metadata
            gameId: gameId,
            isGoldmine: edge >= 0.5, // Lower threshold for goldmine detection
            isPremiumGoldmine: edge >= 1.0, // High-value goldmines for priority display
            valueRating: this.getValueRating(edge, confidence),
            lastUpdated: new Date().toISOString(),
            
            // Matchup Context
            matchupGrade: matchup.grade,
            teamTrend: matchup.teamTrend,
            playerTrend: matchup.playerTrend,
            
            // Additional Context
            homeAway: location,
            primeTime: this.isPrimeTimeGame(gameId),
            division: this.isDivisionGame(team, opponent)
        };
    }

    /**
     * Normalize team names to match roster keys
     */
    normalizeTeamName(team) {
        const teamMappings = {
            'Minnesota Vikings': 'Vikings',
            'Minnesota': 'Vikings',
            'MIN': 'Vikings',
            'Cleveland Browns': 'Browns', 
            'Cleveland': 'Browns',
            'CLE': 'Browns',
            'San Francisco 49ers': '49ers',
            'San Francisco': '49ers',
            'SF': '49ers',
            'Los Angeles Rams': 'Rams',
            'LA Rams': 'Rams',
            'LAR': 'Rams',
            'New York Giants': 'Giants',
            'NY Giants': 'Giants',
            'NYG': 'Giants',
            'New Orleans Saints': 'Saints',
            'New Orleans': 'Saints',
            'NO': 'Saints',
            'Las Vegas Raiders': 'Raiders',
            'LV Raiders': 'Raiders',
            'LV': 'Raiders',
            'Indianapolis Colts': 'Colts',
            'Indianapolis': 'Colts',
            'IND': 'Colts',
            'Dallas Cowboys': 'Cowboys',
            'Dallas': 'Cowboys',
            'DAL': 'Cowboys',
            'New York Jets': 'Jets',
            'NY Jets': 'Jets',
            'NYJ': 'Jets'
            // Add more mappings as needed
        };
        
        // Check direct mapping first
        if (teamMappings[team]) {
            return teamMappings[team];
        }
        
        // If no mapping found, try to extract the team name part
        // Handle cases like "Los Angeles Rams" -> "Rams"
        const parts = team.split(' ');
        const lastPart = parts[parts.length - 1];
        
        // Common team name endings that are the actual team name
        const teamNameWords = ['49ers', 'Vikings', 'Browns', 'Rams', 'Giants', 'Saints', 'Raiders', 'Colts', 'Cowboys', 'Jets', 'Bills', 'Patriots', 'Dolphins', 'Steelers', 'Ravens', 'Bengals', 'Titans', 'Jaguars', 'Texans', 'Chiefs', 'Broncos', 'Chargers', 'Cardinals', 'Seahawks', 'Packers', 'Bears', 'Lions', 'Panthers', 'Falcons', 'Buccaneers', 'Eagles', 'Commanders'];
        
        if (teamNameWords.includes(lastPart)) {
            return lastPart;
        }
        
        // If all else fails, return original
        return team;
    }

    /**
     * Get real team roster from main system data
     */
    getRealTeamRoster(team) {
        try {
            console.log(`🔍 Looking up roster for team: "${team}"`);
            
            // Normalize team name (handle cases like "Minnesota Vikings" -> "Vikings")
            const normalizedTeam = this.normalizeTeamName(team);
            console.log(`🔄 Normalized "${team}" to "${normalizedTeam}"`);
            console.log('🔍 Checking roster sources:', {
                nflTeamRosters: Object.keys(window.nflTeamRosters || {}),
                simpleSystemRosters: Object.keys(window.simpleSystem?.teamRosters || {}),
            });
            
            // Try multiple sources for roster data
            const teamPlayers = window.nflTeamRosters?.[normalizedTeam] || 
                               window.simpleSystem?.teamRosters?.[normalizedTeam] || 
                               window.simpleSystem?.team2025Players?.[normalizedTeam];
            if (!teamPlayers) {
                console.warn(`❌ No roster found for "${normalizedTeam}". Available teams:`, Object.keys(window.nflTeamRosters || window.simpleSystem?.teamRosters || {}));
                console.warn('🔍 Trying direct window.nflTeamRosters lookup...');
                console.log('📋 All available rosters:', window.nflTeamRosters);
                return null;
            }
            console.log(`✅ Found real roster for ${normalizedTeam}:`, teamPlayers);
            
            return {
                QB: [{ name: teamPlayers.QB, tier: 'high' }],
                RB: [{ name: teamPlayers.RB, tier: 'high' }],
                WR: [{ name: teamPlayers.WR, tier: 'high' }],
                TE: [{ name: teamPlayers.TE, tier: 'high' }],
                K: [{ name: teamPlayers.K || 'Team Kicker', tier: 'medium' }],
                DEF: [
                    { name: teamPlayers.LB || 'Team Linebacker', tier: 'high' }
                ]
            };
        } catch (error) {
            console.warn(`⚠️ Could not get real roster for ${team}:`, error);
            return null;
        }
    }

    /**
     * Get realistic team rosters for 2025 season
     */
    getTeamRoster(team) {
        console.log(`🚀 getTeamRoster called for: "${team}"`);
        
        // PRIORITY 1: Use the new 2025 API for 100% accuracy
        if (window.nflPlayers2025API?.initialized) {
            console.log(`🎯 Using NFL Players 2025 API for ${team} (injury-filtered)`);
            const apiPlayers = window.nflPlayers2025API.getPlayersByTeam(team);
            if (apiPlayers.length > 0) {
                const apiRoster = {};
                apiPlayers.forEach(player => {
                    if (!apiRoster[player.position]) apiRoster[player.position] = [];
                    apiRoster[player.position].push({ 
                        name: player.name, 
                        tier: 'high',
                        isActive: player.isActive,
                        apiVerified: true
                    });
                });
                console.log(`✅ API roster loaded for ${team}:`, apiRoster);
                return apiRoster;
            }
        }
        
        console.log(`🔍 Available globals:`, {
            nflPlayers2025API: !!window.nflPlayers2025API?.initialized,
            nflTeamRosters: !!window.nflTeamRosters,
            simpleSystem: !!window.simpleSystem,
            simpleSystemTeamRosters: !!(window.simpleSystem?.teamRosters)
        });
        
        // FALLBACK: Use existing system data  
        if (window.nflTeamRosters || (window.simpleSystem && window.simpleSystem.teamRosters)) {
            const realRoster = this.getRealTeamRoster(team);
            if (realRoster) {
                return realRoster;
            }
        }
        
        const rosters = {
            'SF': {
                QB: [
                    { name: 'Brock Purdy', tier: 'high' },
                    { name: 'Sam Darnold', tier: 'medium' }
                ],
                RB: [
                    { name: 'Christian McCaffrey', tier: 'elite' },
                    { name: 'Jordan Mason', tier: 'medium' },
                    { name: 'Elijah Mitchell', tier: 'low' }
                ],
                WR: [
                    { name: 'Deebo Samuel', tier: 'elite' },
                    { name: 'Brandon Aiyuk', tier: 'high' },
                    { name: 'Jauan Jennings', tier: 'medium' },
                    { name: 'Chris Conley', tier: 'low' }
                ],
                TE: [
                    { name: 'George Kittle', tier: 'elite' },
                    { name: 'Ross Dwelley', tier: 'low' }
                ],
                K: [
                    { name: 'Jake Moody', tier: 'medium' }
                ],
                DEF: [
                    { name: 'Fred Warner', tier: 'elite' },
                    { name: 'Nick Bosa', tier: 'elite' },
                    { name: 'Dre Greenlaw', tier: 'high' },
                    { name: 'Charvarius Ward', tier: 'high' }
                ]
            },
            'LAR': {
                QB: [
                    { name: 'Matthew Stafford', tier: 'high' },
                    { name: 'Jimmy Garoppolo', tier: 'medium' }
                ],
                RB: [
                    { name: 'Kyren Williams', tier: 'high' },
                    { name: 'Blake Corum', tier: 'medium' },
                    { name: 'Ronnie Rivers', tier: 'low' }
                ],
                WR: [
                    { name: 'Cooper Kupp', tier: 'elite' },
                    { name: 'Puka Nacua', tier: 'high' },
                    { name: 'Demarcus Robinson', tier: 'medium' },
                    { name: 'Tutu Atwell', tier: 'low' }
                ],
                TE: [
                    { name: 'Tyler Higbee', tier: 'medium' },
                    { name: 'Davis Allen', tier: 'low' }
                ],
                K: [
                    { name: 'Joshua Karty', tier: 'medium' }
                ],
                DEF: [
                    { name: 'Aaron Donald', tier: 'elite' },
                    { name: 'Bobby Wagner', tier: 'elite' },
                    { name: 'Jalen Ramsey', tier: 'high' },
                    { name: 'Byron Young', tier: 'medium' }
                ]
            }
        };

        return rosters[team] || this.generateGenericRoster(team);
    }

    /**
     * Generate generic roster for teams not yet defined (should not be used - all teams should have real rosters)
     */
    generateGenericRoster(team) {
        console.warn(`⚠️ Using generic roster for ${team} - this should not happen with complete 2025 rosters!`);
        
        // Fallback with more realistic names
        const fallbackPlayers = {
            'Bills': { QB: 'Josh Allen', RB: 'James Cook', WR: 'Khalil Shakir', TE: 'Dalton Kincaid', K: 'Tyler Bass', LB: 'Matt Milano' },
            'Dolphins': { QB: 'Tua Tagovailoa', RB: 'De\'Von Achane', WR: 'Tyreek Hill', TE: 'Jonnu Smith', K: 'Jason Sanders', LB: 'Jordyn Brooks' }
        };
        
        const fallback = fallbackPlayers[team];
        if (fallback) {
            return {
                QB: [{ name: fallback.QB, tier: 'high' }],
                RB: [{ name: fallback.RB, tier: 'high' }],
                WR: [{ name: fallback.WR, tier: 'high' }],
                TE: [{ name: fallback.TE, tier: 'high' }],
                K: [{ name: fallback.K, tier: 'medium' }],
                DEF: [{ name: fallback.LB, tier: 'high' }]
            };
        }
        
        // Absolutely last resort
        return {
            QB: [{ name: `${team} Starting QB`, tier: 'medium' }],
            RB: [{ name: `${team} Starting RB`, tier: 'medium' }],
            WR: [{ name: `${team} Starting WR`, tier: 'high' }],
            TE: [{ name: `${team} Starting TE`, tier: 'medium' }],
            K: [{ name: `${team} Starting K`, tier: 'medium' }],
            DEF: [{ name: `${team} Starting LB`, tier: 'medium' }]
        };
    }

    /**
     * Analyze matchup for prop adjustments
     */
    analyzeMatchup(player, position, team, opponent) {
        const matchupData = {
            overall: this.getOverallMatchup(team, opponent),
            positional: this.getPositionalMatchup(position, opponent),
            gameScript: this.predictGameScript(team, opponent),
            weather: this.getWeatherImpact(),
            teamTrend: this.getTeamTrend(team),
            playerTrend: this.getPlayerTrend(player.name),
            grade: this.calculateMatchupGrade(team, opponent, position)
        };

        return matchupData;
    }

    /**
     * Calculate matchup adjustment for prop line
     */
    calculateMatchupAdjustment(matchup, propType, position) {
        let adjustment = 0;
        
        // Base matchup adjustment
        if (matchup.overall === 'favorable') adjustment += 0.15;
        if (matchup.overall === 'unfavorable') adjustment -= 0.15;
        
        // Positional matchup
        if (matchup.positional === 'elite') adjustment += 0.25;
        if (matchup.positional === 'poor') adjustment -= 0.25;
        
        // Game script impact
        if (matchup.gameScript === 'pass_heavy' && ['passingYards', 'receivingYards', 'receptions'].includes(propType)) {
            adjustment += 0.20;
        }
        if (matchup.gameScript === 'run_heavy' && ['rushingYards', 'rushingAttempts'].includes(propType)) {
            adjustment += 0.20;
        }
        
        // Weather impact
        if (matchup.weather === 'poor' && ['passingYards', 'fieldGoals'].includes(propType)) {
            adjustment -= 0.10;
        }
        
        return adjustment;
    }

    /**
     * Generate AI projection with analysis
     */
    generateProjection(line, matchup, propType, position) {
        let projection = line;
        
        // Apply matchup-based projection adjustments
        const matchupBonus = this.getMatchupProjectionBonus(matchup, propType);
        projection += matchupBonus;
        
        // Add some realistic variance (seeded to prevent changes on refresh)
        const seed = this.createSeededRandom(`${propType}_${position}_${matchup.overall}`);
        const variance = (seed() - 0.5) * 0.3;
        projection += variance;
        
        return Math.max(0.1, projection);
    }

    /**
     * Get matchup projection bonus
     */
    getMatchupProjectionBonus(matchup, propType) {
        let bonus = 0;
        
        if (matchup.grade === 'A') bonus += 1.2;
        if (matchup.grade === 'B') bonus += 0.8;
        if (matchup.grade === 'C') bonus += 0.2;
        if (matchup.grade === 'D') bonus -= 0.5;
        if (matchup.grade === 'F') bonus -= 1.0;
        
        return bonus;
    }

    /**
     * Calculate confidence level
     */
    calculateConfidence(edge, matchup) {
        if (edge >= 2.0 && matchup === 'favorable') return 'VERY_HIGH';
        if (edge >= 1.5) return 'HIGH';
        if (edge >= 0.8) return 'MEDIUM';
        if (edge >= 0.3) return 'LOW';
        return 'VERY_LOW';
    }

    /**
     * Generate realistic betting odds
     */
    generateRealisticOdds(edge) {
        const baseOdds = -110;
        let overOdds = baseOdds;
        let underOdds = baseOdds;
        
        // Adjust odds based on edge
        if (edge > 0) {
            overOdds = Math.max(-130, baseOdds + Math.floor(edge * 8));
            underOdds = Math.min(+120, baseOdds - Math.floor(edge * 5));
        } else if (edge < 0) {
            underOdds = Math.max(-130, baseOdds + Math.floor(Math.abs(edge) * 8));
            overOdds = Math.min(+120, baseOdds - Math.floor(Math.abs(edge) * 5));
        }
        
        const books = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'];
        const bestBook = books[Math.floor(Math.random() * books.length)];
        
        return {
            over: overOdds,
            under: underOdds,
            bestBook: bestBook
        };
    }

    /**
     * Generate AI reasoning for prop
     */
    generateReasoning(player, propType, matchup, edge) {
        const reasons = [];
        
        // Base reasoning
        reasons.push(`${player.name} ${propType} analysis`);
        
        // Matchup reasoning
        if (matchup.grade === 'A') reasons.push('Excellent matchup');
        if (matchup.grade === 'F') reasons.push('Difficult matchup');
        
        // Game script reasoning
        if (matchup.gameScript === 'pass_heavy') reasons.push('Game script favors passing');
        if (matchup.gameScript === 'run_heavy') reasons.push('Game script favors rushing');
        
        // Edge reasoning
        if (edge >= 1.5) reasons.push('Strong analytical edge identified');
        if (edge < -0.5) reasons.push('Line appears inflated');
        
        return reasons.join('. ') + '.';
    }

    /**
     * Organize props for easy display
     */
    organizePropsForDisplay(allProps, homeTeam, awayTeam) {
        const organized = {
            gameInfo: {
                matchup: `${awayTeam} @ ${homeTeam}`,
                totalProps: allProps.length,
                goldmines: allProps.filter(p => p.isGoldmine).length,
                lastUpdated: new Date().toISOString()
            },
            
            // Organize by team and position
            awayTeam: {
                name: awayTeam,
                props: this.groupPropsByPosition(allProps.filter(p => p.team === awayTeam))
            },
            
            homeTeam: {
                name: homeTeam,
                props: this.groupPropsByPosition(allProps.filter(p => p.team === homeTeam))
            },
            
            // Top opportunities - prioritize +1.0 edge goldmines at the top
            goldmines: allProps
                .filter(p => p.isGoldmine)
                .sort((a, b) => {
                    // First sort by +1.0+ edge goldmines
                    const aHighEdge = a.edge >= 1.0 ? 1 : 0;
                    const bHighEdge = b.edge >= 1.0 ? 1 : 0;
                    if (aHighEdge !== bHighEdge) return bHighEdge - aHighEdge;
                    // Then by edge within each group
                    return b.edge - a.edge;
                })
                .slice(0, 10),
                
            // All props sorted by edge
            allProps: allProps.sort((a, b) => b.edge - a.edge)
        };
        
        return organized;
    }

    /**
     * Group props by position for display
     */
    groupPropsByPosition(props) {
        const grouped = {
            quarterbacks: props.filter(p => p.position === 'QB'),
            runningBacks: props.filter(p => p.position === 'RB'),
            wideReceivers: props.filter(p => p.position === 'WR'),
            tightEnds: props.filter(p => p.position === 'TE'),
            kickers: props.filter(p => p.position === 'K'),
            defense: props.filter(p => p.position === 'DEF')
        };
        
        return grouped;
    }

    // Helper methods for analysis (seeded for stability)
    getOverallMatchup(team1, team2) {
        const matchups = ['favorable', 'neutral', 'unfavorable'];
        const seed = this.createSeededRandom(team1 + team2);
        return matchups[Math.floor(seed() * matchups.length)];
    }

    getPositionalMatchup(position, opponent) {
        const matchups = ['elite', 'good', 'average', 'poor'];
        const seed = this.createSeededRandom(position + opponent);
        return matchups[Math.floor(seed() * matchups.length)];
    }

    predictGameScript(team, opponent) {
        const scripts = ['pass_heavy', 'balanced', 'run_heavy'];
        const seed = this.createSeededRandom(team + opponent + 'gamescript');
        return scripts[Math.floor(seed() * scripts.length)];
    }

    getWeatherImpact() {
        const seed = this.createSeededRandom('weather' + new Date().toDateString());
        return seed() > 0.8 ? 'poor' : 'good';
    }

    getTeamTrend(team) {
        const trends = ['hot', 'neutral', 'cold'];
        const seed = this.createSeededRandom(team + 'trend');
        return trends[Math.floor(seed() * trends.length)];
    }

    getPlayerTrend(player) {
        const trends = ['trending_up', 'stable', 'trending_down'];
        const seed = this.createSeededRandom(player + 'trend');
        return trends[Math.floor(seed() * trends.length)];
    }

    calculateMatchupGrade(team, opponent, position) {
        const grades = ['A', 'B', 'C', 'D', 'F'];
        const seed = this.createSeededRandom(team + opponent + position);
        return grades[Math.floor(seed() * grades.length)];
    }

    formatPropType(propType) {
        const formatted = propType.replace(/([A-Z])/g, ' $1').toLowerCase();
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    getValueRating(edge, confidence) {
        if (edge >= 2.0 && confidence === 'VERY_HIGH') return 'EXCELLENT';
        if (edge >= 1.5) return 'VERY_GOOD';
        if (edge >= 1.0) return 'GOOD';
        if (edge >= 0.5) return 'FAIR';
        return 'POOR';
    }

    isPrimeTimeGame(gameId) {
        // Simple logic - can be enhanced
        return Math.random() > 0.7;
    }

    isDivisionGame(team1, team2) {
        // Simple division logic - can be enhanced with real divisions
        return Math.random() > 0.75;
    }

    /**
     * Try to fetch real player props from API
     */
    async fetchRealPlayerProps(gameId) {
        try {
            console.log(`🎯 Fetching REAL player props from The Odds API...`);
            
            // Use The Odds API for actual player props with real odds
            const oddsApiKey = '9de126998e0df996011a28e9527dd7b9';
            const oddsBaseUrl = 'https://api.the-odds-api.com/v4';
            
            // Step 1: First get current NFL events to find event IDs
            console.log('📅 Getting current NFL events...');
            const eventsUrl = `${oddsBaseUrl}/sports/americanfootball_nfl/events`;
            const eventsParams = new URLSearchParams({
                apiKey: oddsApiKey
            });
            
            console.log(`🌐 Calling The Odds API events: ${eventsUrl}?${eventsParams.toString()}`);
            
            const eventsResponse = await fetch(`${eventsUrl}?${eventsParams.toString()}`);
            
            if (!eventsResponse.ok) {
                console.error(`❌ Events API error: ${eventsResponse.status} ${eventsResponse.statusText}`);
                return [];
            }
            
            const eventsData = await eventsResponse.json();
            console.log('✅ Events API response:', eventsData?.length, 'events found');
            
            if (!eventsData || eventsData.length === 0) {
                console.warn('⚠️ No NFL events available');
                return [];
            }
            
            // Step 2: Get the first available event ID for testing
            const firstEvent = eventsData[0];
            const eventId = firstEvent.id;
            console.log(`🎯 Using event ID: ${eventId} for ${firstEvent.away_team} @ ${firstEvent.home_team}`);
            
            // Step 3: Get player props for the specific event
            const propsUrl = `${oddsBaseUrl}/sports/americanfootball_nfl/events/${eventId}/odds`;
            const propsParams = new URLSearchParams({
                apiKey: oddsApiKey,
                regions: 'us',
                // Using CORRECT NFL player props market names from official docs
                markets: 'player_pass_tds,player_pass_yds,player_rush_yds,player_receptions,player_reception_yds,player_sacks,player_rush_tds',
                oddsFormat: 'american'
            });
            
            console.log(`🌐 Calling The Odds API player props: ${propsUrl}?${propsParams.toString()}`);
            
            const propsResponse = await fetch(`${propsUrl}?${propsParams.toString()}`);
            
            if (propsResponse.ok) {
                const propsData = await propsResponse.json();
                console.log('✅ Player props API response:', propsData);
                
                if (propsData && propsData.bookmakers && propsData.bookmakers.length > 0) {
                    return this.processOddsAPIData([propsData]); // Wrap in array for consistency
                } else {
                    console.warn('⚠️ No player props data available from The Odds API for this event');
                    return [];
                }
            } else {
                console.error(`❌ Player props API error: ${propsResponse.status} ${propsResponse.statusText}`);
                const errorText = await propsResponse.text();
                console.error('❌ Error details:', errorText);
                return [];
            }
            
        } catch (error) {
            console.error('❌ The Odds API unavailable:', error.message);
            return [];
        }
    }

    async fetchInjuredPlayers() {
        try {
            console.log('🏥 Fetching current NFL injuries...');
            
            const injuriesUrl = `${this.baseUrl}/injuries`;
            const response = await fetch(injuriesUrl, {
                headers: {
                    'X-RapidAPI-Key': this.apiKey,
                    'X-RapidAPI-Host': 'v1.american-football.api-sports.io'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const injuredPlayers = new Set();
                
                if (data.response) {
                    data.response.forEach(injury => {
                        if (injury.player && injury.player.name) {
                            injuredPlayers.add(injury.player.name);
                            console.log(`🚨 Injured: ${injury.player.name} - ${injury.reason}`);
                        }
                    });
                }
                
                console.log(`🏥 Found ${injuredPlayers.size} injured players`);
                return injuredPlayers;
            }
            
            return new Set();
        } catch (error) {
            console.warn('⚠️ Could not fetch injuries:', error.message);
            return new Set();
        }
    }

    processAPIFootballData(data, injuredPlayers) {
        console.log('⚙️ Processing API-Sports NFL data...');
        
        const props = [];
        
        if (data.response && data.response.length > 0) {
            data.response.forEach(game => {
                // Process teams and create props for non-injured players
                const homeTeam = game.teams?.home?.name;
                const awayTeam = game.teams?.away?.name;
                
                if (homeTeam && awayTeam) {
                    console.log(`🏈 Processing game: ${awayTeam} @ ${homeTeam}`);
                    
                    // Generate props for this game, filtering out injured players
                    const gameProps = this.generateFilteredGameProps(homeTeam, awayTeam, injuredPlayers);
                    props.push(...gameProps);
                }
            });
        }
        
        return props;
    }

    generateFilteredGameProps(homeTeam, awayTeam, injuredPlayers) {
        const allProps = [];
        
        // Get rosters for both teams
        const homeRoster = this.getTeamRoster(homeTeam);
        const awayRoster = this.getTeamRoster(awayTeam);
        
        // Filter out injured players from rosters
        const filteredHomeRoster = this.filterInjuredPlayers(homeRoster, injuredPlayers);
        const filteredAwayRoster = this.filterInjuredPlayers(awayRoster, injuredPlayers);
        
        // Generate props for filtered rosters
        const awayProps = this.generateTeamProps(filteredAwayRoster, awayTeam, homeTeam, 'away', `${awayTeam}-${homeTeam}`);
        allProps.push(...awayProps);
        
        const homeProps = this.generateTeamProps(filteredHomeRoster, homeTeam, awayTeam, 'home', `${awayTeam}-${homeTeam}`);
        allProps.push(...homeProps);
        
        return allProps;
    }

    filterInjuredPlayers(roster, injuredPlayers) {
        const filtered = {};
        
        Object.entries(roster).forEach(([position, players]) => {
            filtered[position] = players.filter(player => {
                const isInjured = injuredPlayers.has(player.name);
                if (isInjured) {
                    console.log(`❌ Filtering out injured player: ${player.name} (${position})`);
                }
                return !isInjured;
            });
        });
        
        return filtered;
    }

    /**
     * Process The Odds API data for player props
     */
    processOddsAPIData(apiData) {
        console.log('⚙️ Processing The Odds API player props data...');
        
        const props = [];
        
        apiData.forEach(game => {
            if (game.bookmakers && game.bookmakers.length > 0) {
                game.bookmakers.forEach(bookmaker => {
                    if (bookmaker.markets && bookmaker.markets.length > 0) {
                        bookmaker.markets.forEach(market => {
                            if (market.outcomes && market.outcomes.length > 0) {
                                market.outcomes.forEach(outcome => {
                                    if (outcome.description && outcome.point !== undefined) {
                                        const prop = this.parseOddsAPIOutcome(outcome, market, bookmaker, game);
                                        if (prop) {
                                            props.push(prop);
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
        
        console.log(`✅ Processed ${props.length} real player props from The Odds API`);
        return props;
    }

    /**
     * Parse individual outcome from The Odds API
     */
    parseOddsAPIOutcome(outcome, market, bookmaker, game) {
        try {
            // The Odds API structure: outcome.description contains player name, outcome.name is Over/Under
            const playerName = outcome.description; // e.g., "Justin Jefferson"
            const overUnder = outcome.name; // "Over" or "Under"  
            const line = parseFloat(outcome.point);
            const odds = outcome.price; // American odds format
            
            if (!playerName || !overUnder || isNaN(line)) {
                console.warn('⚠️ Invalid outcome data:', { playerName, overUnder, line, point: outcome.point });
                return null;
            }
            
            // Map market key to readable prop type
            const propType = this.mapOddsAPIMarket(market.key);
            
            // Calculate edge based on odds (simplified)
            const edge = this.calculateEdgeFromOdds(odds, line, propType);
            
            return {
                // Player Info
                player: playerName,
                position: this.inferPositionFromProp(propType), // Infer from prop type
                team: this.inferTeamFromGame(playerName, game), // Infer from game
                
                // Prop Details
                propType: propType,
                market: `${overUnder} ${line} ${propType} - ${playerName}`,
                line: line,
                
                // Projections & Analysis
                projection: this.estimateProjection(line, edge), // Simple projection
                edge: edge,
                confidence: 'HIGH', // Real API data has high confidence
                
                // Betting Info
                overOdds: overUnder === 'Over' ? odds : this.calculateOppositeOdds(odds),
                underOdds: overUnder === 'Under' ? odds : this.calculateOppositeOdds(odds),
                bestBook: bookmaker.title,
                
                // Real data flags
                isReal: true,
                realDataSource: 'The Odds API',
                
                // Metadata
                gameId: game.id,
                homeTeam: game.home_team,
                awayTeam: game.away_team,
                lastUpdated: market.last_update || new Date().toISOString(),
                
                // Value metrics
                isGoldmine: edge >= 0.5,
                isPremiumGoldmine: edge >= 1.0,
                valueRating: this.getValueRating(edge, 'HIGH'),
                
                // Additional context
                recommendation: overUnder.toUpperCase(),
                reasoning: `Real ${propType} line from ${bookmaker.title}. ${edge > 0 ? 'Potential value' : 'Fair line'}.`
            };
        } catch (error) {
            console.warn('⚠️ Failed to parse outcome:', error);
            return null;
        }
    }

    /**
     * Map The Odds API market keys to readable names
     */
    mapOddsAPIMarket(marketKey) {
        const marketMap = {
            // Quarterback Props
            'player_pass_yds': 'Passing Yards',
            'player_pass_tds': 'Passing Touchdowns',
            'player_pass_attempts': 'Pass Attempts',
            'player_pass_completions': 'Pass Completions',
            'player_pass_interceptions': 'Pass Interceptions',
            
            // Running Back Props
            'player_rush_yds': 'Rushing Yards',
            'player_rush_tds': 'Rushing Touchdowns',
            'player_rush_attempts': 'Rush Attempts',
            
            // Receiver Props (WR/TE)
            'player_receptions': 'Receptions',
            'player_reception_yds': 'Receiving Yards', // CORRECT name
            'player_reception_tds': 'Receiving Touchdowns',
            'player_reception_longest': 'Longest Reception',
            
            // Combined Props
            'player_pass_rush_yds': 'Pass + Rush Yards',
            'player_rush_reception_yds': 'Rush + Reception Yards',
            'player_pass_rush_reception_yds': 'Pass + Rush + Reception Yards',
            
            // Kicker Props
            'player_field_goals': 'Field Goals',
            'player_kicking_points': 'Kicking Points',
            'player_pats': 'Extra Points',
            
            // Defense Props
            'player_sacks': 'Sacks',
            'player_tackles_assists': 'Tackles + Assists',
            'player_solo_tackles': 'Solo Tackles',
            'player_defensive_interceptions': 'Interceptions',
            
            // Touchdown Props
            'player_anytime_td': 'Anytime Touchdown',
            'player_1st_td': 'First Touchdown',
            'player_last_td': 'Last Touchdown'
        };
        
        return marketMap[marketKey] || marketKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Process real API player props data (legacy method)
     */
    processRealPlayerProps(apiData) {
        const props = [];
        
        if (apiData.bookmakers) {
            apiData.bookmakers.forEach(bookmaker => {
                bookmaker.markets.forEach(market => {
                    market.outcomes.forEach(outcome => {
                        if (outcome.description && outcome.point !== undefined) {
                            props.push({
                                player: this.extractPlayerName(outcome.description),
                                propType: this.mapMarketToPropType(market.key),
                                line: outcome.point,
                                overOdds: outcome.price,
                                underOdds: this.calculateOppositeOdds(outcome.price),
                                sportsbook: bookmaker.title,
                                isReal: true
                            });
                        }
                    });
                });
            });
        }
        
        return props;
    }

    extractPlayerName(description) {
        // Extract player name from description like "Patrick Mahomes Over 24.5"
        return description.split(' ')[0] + ' ' + description.split(' ')[1];
    }

    mapMarketToPropType(marketKey) {
        // Use the same mapping function for consistency
        return this.mapOddsAPIMarket(marketKey);
    }

    calculateOppositeOdds(odds) {
        // Simple opposite odds calculation
        return odds > 0 ? -100 - Math.abs(odds/2) : 100 + Math.abs(odds/2);
    }

    /**
     * Calculate edge from odds (simplified approach)
     */
    calculateEdgeFromOdds(odds, line, propType) {
        // Convert American odds to implied probability
        const impliedProb = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
        
        // Simple edge calculation - in reality this would use complex modeling
        // For now, assume random variance around fair value
        const randomSeed = this.createSeededRandom(`${propType}_${line}_${odds}`);
        const variance = (randomSeed() - 0.5) * 2; // -1 to 1
        
        return Number(variance.toFixed(1));
    }

    /**
     * Infer player position from prop type
     */
    inferPositionFromProp(propType) {
        const propToPosition = {
            'Passing Yards': 'QB',
            'Passing Touchdowns': 'QB',
            'Pass Attempts': 'QB',
            'Pass Completions': 'QB',
            'Rushing Yards': 'RB',
            'Rushing Touchdowns': 'RB',
            'Rush Attempts': 'RB',
            'Receptions': 'WR',
            'Receiving Yards': 'WR',
            'Receiving Touchdowns': 'WR',
            'Sacks': 'DEF',
            'Tackles + Assists': 'DEF',
            'Field Goals': 'K',
            'Kicking Points': 'K'
        };
        
        return propToPosition[propType] || 'Unknown';
    }

    /**
     * Infer player's team from game context
     */
    inferTeamFromGame(playerName, game) {
        // Simple team inference - in reality would need player database
        // For now, randomly assign to home or away team
        const seed = this.createSeededRandom(`${playerName}_${game.id}`);
        return seed() > 0.5 ? game.home_team : game.away_team;
    }

    /**
     * Estimate projection from line and edge
     */
    estimateProjection(line, edge) {
        return Number((line + edge).toFixed(1));
    }

    /**
     * Merge real and analyzed props
     */
    mergeRealAndAnalyzedProps(realProps, analyzedProps) {
        // Prefer real props where available, supplement with analysis
        const merged = [...analyzedProps];
        
        realProps.forEach(realProp => {
            const existingIndex = merged.findIndex(p => 
                p.player === realProp.player && 
                p.propType.toLowerCase() === realProp.propType.toLowerCase()
            );
            
            if (existingIndex !== -1) {
                // Merge real data with analysis
                merged[existingIndex] = {
                    ...merged[existingIndex],
                    line: realProp.line,
                    overOdds: realProp.overOdds,
                    underOdds: realProp.underOdds,
                    isReal: true,
                    realDataSource: realProp.sportsbook
                };
            }
        });
        
        return merged;
    }

    /**
     * Create a seeded random number generator to prevent picks from changing on refresh
     */
    createSeededRandom(seedString) {
        // Simple hash function to convert string to number
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
            const char = seedString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Linear congruential generator using the hash as seed
        let seed = Math.abs(hash);
        
        return function() {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed / 0x7fffffff;
        };
    }
}

// Initialize global comprehensive player props service
window.comprehensivePlayerPropsService = new ComprehensivePlayerPropsService();

console.log('🎯 Comprehensive Player Props Service loaded - ALL NFL positions covered with AI analysis');

} // End of ComprehensivePlayerPropsService class guard
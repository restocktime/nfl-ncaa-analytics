/**
 * Fantasy Football Roster Manager
 * Manages user rosters, draft data, and lineup optimization
 */

class FantasyRosterManager {
    constructor() {
        this.userRosters = new Map();
        this.leagueSettings = {
            rosterSize: 16,
            startingLineup: {
                QB: 1,
                RB: 2,
                WR: 2,
                TE: 1,
                FLEX: 1, // RB/WR/TE
                K: 1,
                DEF: 1
            },
            benchSize: 6,
            scoringType: 'PPR' // PPR, Half-PPR, Standard
        };
        
        this.currentUser = null;
        this.allPlayers = new Map();
        
        console.log('👥 Fantasy Roster Manager initialized');
        this.initializeSystem();
    }

    async initializeSystem() {
        // Load sample roster data
        await this.loadSampleRosters();
        
        // Set default user (prefer custom roster if available)
        const userRoster = this.loadUserRoster();
        if (userRoster) {
            this.setCurrentUser(userRoster.userId);
        } else {
            this.setCurrentUser('user_12345');
        }
        
        console.log('✅ Roster system ready');
    }

    async loadSampleRosters() {
        // Check for user's custom roster first
        const userRoster = this.loadUserRoster();
        if (userRoster) {
            console.log(`📋 Loading user's custom roster: ${userRoster.teamName}`);
            this.userRosters.set(userRoster.userId, userRoster);
            
            userRoster.roster.forEach(player => {
                this.allPlayers.set(player.playerId, {
                    ...player,
                    ownedBy: userRoster.userId,
                    ownerTeamName: userRoster.teamName
                });
            });
            
            console.log(`✅ Loaded user roster with ${userRoster.roster.length} players`);
            return;
        }

        // Fallback to sample data if no user roster
        console.log('📋 Loading sample rosters...');
        const sampleRosters = [
            {
                userId: 'user_12345',
                username: 'FantasyPro23',
                teamName: 'Championship Bound',
                draftPosition: 3,
                roster: [
                    // Starters
                    { playerId: 'josh_allen', name: 'Josh Allen', team: 'BUF', position: 'QB', draftRound: 2, draftPick: 15, status: 'starter', injury: 'Healthy' },
                    { playerId: 'christian_mccaffrey', name: 'Christian McCaffrey', team: 'SF', position: 'RB', draftRound: 1, draftPick: 3, status: 'starter', injury: 'Healthy' },
                    { playerId: 'saquon_barkley', name: 'Saquon Barkley', team: 'PHI', position: 'RB', draftRound: 3, draftPick: 27, status: 'starter', injury: 'Questionable' },
                    { playerId: 'tyreek_hill', name: 'Tyreek Hill', team: 'MIA', position: 'WR', draftRound: 4, draftPick: 45, status: 'starter', injury: 'Probable' },
                    { playerId: 'davante_adams', name: 'Davante Adams', team: 'LV', position: 'WR', draftRound: 5, draftPick: 55, status: 'starter', injury: 'Healthy' },
                    { playerId: 'travis_kelce', name: 'Travis Kelce', team: 'KC', position: 'TE', draftRound: 6, draftPick: 67, status: 'starter', injury: 'Healthy' },
                    { playerId: 'jayden_reed', name: 'Jayden Reed', team: 'GB', position: 'WR', draftRound: 8, draftPick: 95, status: 'flex', injury: 'Healthy' },
                    { playerId: 'justin_tucker', name: 'Justin Tucker', team: 'BAL', position: 'K', draftRound: 15, draftPick: 195, status: 'starter', injury: 'Healthy' },
                    { playerId: 'eagles_def', name: 'Eagles Defense', team: 'PHI', position: 'DEF', draftRound: 14, draftPick: 183, status: 'starter', injury: 'Healthy' },
                    
                    // Bench
                    { playerId: 'derrick_henry', name: 'Derrick Henry', team: 'BAL', position: 'RB', draftRound: 7, draftPick: 75, status: 'bench', injury: 'Healthy' },
                    { playerId: 'stefon_diggs', name: 'Stefon Diggs', team: 'HOU', position: 'WR', draftRound: 9, draftPick: 105, status: 'bench', injury: 'Healthy' },
                    { playerId: 'george_kittle', name: 'George Kittle', team: 'SF', position: 'TE', draftRound: 10, draftPick: 123, status: 'bench', injury: 'Healthy' },
                    { playerId: 'jordan_love', name: 'Jordan Love', team: 'GB', position: 'QB', draftRound: 11, draftPick: 135, status: 'bench', injury: 'Healthy' },
                    { playerId: 'tank_dell', name: 'Tank Dell', team: 'HOU', position: 'WR', draftRound: 12, draftPick: 147, status: 'bench', injury: 'IR' },
                    { playerId: 'roschon_johnson', name: 'Roschon Johnson', team: 'CHI', position: 'RB', draftRound: 13, draftPick: 165, status: 'bench', injury: 'Healthy' },
                    { playerId: 'darnell_mooney', name: 'Darnell Mooney', team: 'ATL', position: 'WR', draftRound: 16, draftPick: 203, status: 'bench', injury: 'Healthy' }
                ],
                record: { wins: 8, losses: 4, ties: 0 },
                pointsFor: 1456.8,
                pointsAgainst: 1329.4,
                playoffSeed: 2
            },
            
            {
                userId: 'user_67890',
                username: 'GridironGuru',
                teamName: 'Dynasty Dreams',
                draftPosition: 1,
                roster: [
                    // Starters
                    { playerId: 'patrick_mahomes', name: 'Patrick Mahomes', team: 'KC', position: 'QB', draftRound: 1, draftPick: 1, status: 'starter', injury: 'Healthy' },
                    { playerId: 'austin_ekeler', name: 'Austin Ekeler', team: 'WAS', position: 'RB', draftRound: 2, draftPick: 24, status: 'starter', injury: 'Healthy' },
                    { playerId: 'alvin_kamara', name: 'Alvin Kamara', team: 'NO', position: 'RB', draftRound: 3, draftPick: 25, status: 'starter', injury: 'Healthy' },
                    { playerId: 'cooper_kupp', name: 'Cooper Kupp', team: 'LAR', position: 'WR', draftRound: 4, draftPick: 48, status: 'starter', injury: 'Healthy' },
                    { playerId: 'amon_ra_st_brown', name: 'Amon-Ra St. Brown', team: 'DET', position: 'WR', draftRound: 5, draftPick: 49, status: 'starter', injury: 'Healthy' },
                    { playerId: 'mark_andrews', name: 'Mark Andrews', team: 'BAL', position: 'TE', draftRound: 6, draftPick: 72, status: 'starter', injury: 'Healthy' },
                    { playerId: 'deebo_samuel', name: 'Deebo Samuel', team: 'SF', position: 'WR', draftRound: 7, draftPick: 73, status: 'flex', injury: 'Healthy' },
                    { playerId: 'harrison_butker', name: 'Harrison Butker', team: 'KC', position: 'K', draftRound: 15, draftPick: 193, status: 'starter', injury: 'Healthy' },
                    { playerId: 'bills_def', name: 'Bills Defense', team: 'BUF', position: 'DEF', draftRound: 14, draftPick: 192, status: 'starter', injury: 'Healthy' },
                    
                    // Bench
                    { playerId: 'breece_hall', name: 'Breece Hall', team: 'NYJ', position: 'RB', draftRound: 8, draftPick: 96, status: 'bench', injury: 'Healthy' },
                    { playerId: 'mike_evans', name: 'Mike Evans', team: 'TB', position: 'WR', draftRound: 9, draftPick: 97, status: 'bench', injury: 'Healthy' },
                    { playerId: 'dallas_goedert', name: 'Dallas Goedert', team: 'PHI', position: 'TE', draftRound: 10, draftPick: 120, status: 'bench', injury: 'Healthy' },
                    { playerId: 'kenny_pickett', name: 'Kenny Pickett', team: 'PHI', position: 'QB', draftRound: 11, draftPick: 121, status: 'bench', injury: 'Healthy' },
                    { playerId: 'rome_odunze', name: 'Rome Odunze', team: 'CHI', position: 'WR', draftRound: 12, draftPick: 144, status: 'bench', injury: 'Healthy' },
                    { playerId: 'tyjae_spears', name: 'Tyjae Spears', team: 'TEN', position: 'RB', draftRound: 13, draftPick: 145, status: 'bench', injury: 'Healthy' },
                    { playerId: 'quentin_johnston', name: 'Quentin Johnston', team: 'LAC', position: 'WR', draftRound: 16, draftPick: 216, status: 'bench', injury: 'Healthy' }
                ],
                record: { wins: 7, losses: 5, ties: 0 },
                pointsFor: 1398.2,
                pointsAgainst: 1367.9,
                playoffSeed: 4
            }
        ];

        // Store rosters
        sampleRosters.forEach(roster => {
            this.userRosters.set(roster.userId, roster);
            
            // Index all players
            roster.roster.forEach(player => {
                this.allPlayers.set(player.playerId, {
                    ...player,
                    ownedBy: roster.userId,
                    ownerTeamName: roster.teamName
                });
            });
        });

        console.log(`📋 Loaded ${sampleRosters.length} user rosters with ${this.allPlayers.size} total players`);
    }

    loadUserRoster() {
        try {
            const saved = localStorage.getItem('userFantasyRoster');
            if (saved) {
                const roster = JSON.parse(saved);
                console.log(`💾 Found saved roster: ${roster.teamName}`);
                return roster;
            }
        } catch (error) {
            console.warn('⚠️ Error loading user roster from localStorage:', error);
        }
        return null;
    }

    setCurrentUser(userId) {
        if (this.userRosters.has(userId)) {
            this.currentUser = userId;
            console.log(`👤 Current user set to: ${this.getUserRoster(userId).teamName}`);
            return true;
        }
        return false;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserRoster(userId = null) {
        const targetUser = userId || this.currentUser;
        return this.userRosters.get(targetUser);
    }

    getStartingLineup(userId = null) {
        const roster = this.getUserRoster(userId);
        if (!roster) return [];

        return roster.roster.filter(player => 
            ['starter', 'flex'].includes(player.status)
        );
    }

    getBench(userId = null) {
        const roster = this.getUserRoster(userId);
        if (!roster) return [];

        return roster.roster.filter(player => player.status === 'bench');
    }

    getPlayersByPosition(position, userId = null) {
        const roster = this.getUserRoster(userId);
        if (!roster) return [];

        return roster.roster.filter(player => player.position === position);
    }

    async generateOptimalLineup(userId = null) {
        const roster = this.getUserRoster(userId);
        if (!roster) return null;

        try {
            // Get live projections for all rostered players
            const projections = await this.getPlayerProjections(roster.roster);
            
            // Build optimal lineup
            const optimalLineup = this.optimizeLineup(projections, this.leagueSettings.startingLineup);
            
            return {
                lineup: optimalLineup,
                totalProjection: optimalLineup.reduce((sum, player) => sum + (player.projection || 0), 0),
                confidence: this.calculateLineupConfidence(optimalLineup),
                recommendations: this.generateLineupRecommendations(optimalLineup, roster.roster)
            };

        } catch (error) {
            console.error('Error generating optimal lineup:', error);
            return this.getFallbackLineup(roster);
        }
    }

    async getPlayerProjections(players) {
        // Integration with fantasy data service for live projections
        if (window.fantasyDataService) {
            const allProjections = await window.fantasyDataService.getPlayerProjections();
            
            return players.map(player => {
                const projection = allProjections.find(p => 
                    p.name.toLowerCase() === player.name.toLowerCase() ||
                    p.playerId === player.playerId
                );
                
                return {
                    ...player,
                    projection: projection?.projection || this.getStaticProjection(player),
                    floor: projection?.floor || 0,
                    ceiling: projection?.ceiling || 0,
                    confidence: projection?.confidence || 'Medium',
                    matchup: projection?.matchup || 'TBD'
                };
            });
        } else {
            // Fallback to static projections
            return players.map(player => ({
                ...player,
                projection: this.getStaticProjection(player),
                floor: this.getStaticProjection(player) * 0.7,
                ceiling: this.getStaticProjection(player) * 1.4,
                confidence: 'Medium',
                matchup: 'TBD'
            }));
        }
    }

    getStaticProjection(player) {
        // Static projections based on player tier and position
        const baseProjections = {
            'QB': { elite: 24, solid: 18, flex: 14, bench: 10 },
            'RB': { elite: 20, solid: 15, flex: 12, bench: 8 },
            'WR': { elite: 18, solid: 14, flex: 11, bench: 7 },
            'TE': { elite: 16, solid: 10, flex: 8, bench: 5 },
            'K': { elite: 10, solid: 8, flex: 7, bench: 6 },
            'DEF': { elite: 12, solid: 9, flex: 7, bench: 5 }
        };

        const positionBase = baseProjections[player.position] || baseProjections['WR'];
        
        // Determine tier based on draft round
        let tier = 'bench';
        if (player.draftRound <= 3) tier = 'elite';
        else if (player.draftRound <= 6) tier = 'solid';
        else if (player.draftRound <= 10) tier = 'flex';

        // Adjust for injury
        let injuryMultiplier = 1.0;
        if (player.injury === 'Questionable') injuryMultiplier = 0.8;
        else if (player.injury === 'Doubtful') injuryMultiplier = 0.3;
        else if (player.injury === 'Out' || player.injury === 'IR') injuryMultiplier = 0;

        return Math.round(positionBase[tier] * injuryMultiplier * 10) / 10;
    }

    optimizeLineup(projectedPlayers, lineupRequirements) {
        const lineup = [];
        const availablePlayers = [...projectedPlayers].sort((a, b) => b.projection - a.projection);
        
        // Fill required positions first
        Object.entries(lineupRequirements).forEach(([position, count]) => {
            if (position === 'FLEX') return; // Handle FLEX separately
            
            const positionPlayers = availablePlayers
                .filter(p => p.position === position && !lineup.includes(p))
                .slice(0, count);
                
            lineup.push(...positionPlayers);
        });

        // Fill FLEX with best remaining RB/WR/TE
        if (lineupRequirements.FLEX) {
            const flexEligible = availablePlayers
                .filter(p => ['RB', 'WR', 'TE'].includes(p.position) && !lineup.includes(p))
                .slice(0, lineupRequirements.FLEX);
            
            lineup.push(...flexEligible);
        }

        return lineup.map(player => ({
            ...player,
            lineupPosition: this.getLineupPosition(player, lineup)
        }));
    }

    getLineupPosition(player, lineup) {
        const positionCounts = lineup.reduce((counts, p) => {
            counts[p.position] = (counts[p.position] || 0) + 1;
            return counts;
        }, {});

        // Determine if this player is in a flex spot
        const requiredForPosition = this.leagueSettings.startingLineup[player.position] || 0;
        const currentCount = positionCounts[player.position];

        if (currentCount > requiredForPosition) {
            return 'FLEX';
        } else {
            return player.position;
        }
    }

    calculateLineupConfidence(lineup) {
        if (!lineup.length) return 'Low';
        
        const avgConfidence = lineup.reduce((sum, player) => {
            const confidenceValues = { 'High': 3, 'Medium': 2, 'Low': 1 };
            return sum + (confidenceValues[player.confidence] || 1);
        }, 0) / lineup.length;

        if (avgConfidence >= 2.5) return 'High';
        if (avgConfidence >= 2) return 'Medium';
        return 'Low';
    }

    generateLineupRecommendations(optimalLineup, allPlayers) {
        const recommendations = [];
        
        // Check for better bench options
        const bench = allPlayers.filter(p => p.status === 'bench');
        const starters = optimalLineup;

        bench.forEach(benchPlayer => {
            const worstStarter = starters
                .filter(s => s.position === benchPlayer.position || 
                       (s.lineupPosition === 'FLEX' && ['RB', 'WR', 'TE'].includes(benchPlayer.position)))
                .sort((a, b) => a.projection - b.projection)[0];

            if (worstStarter && benchPlayer.projection > worstStarter.projection + 2) {
                recommendations.push({
                    type: 'swap',
                    message: `Consider starting ${benchPlayer.name} over ${worstStarter.name}`,
                    impact: `+${(benchPlayer.projection - worstStarter.projection).toFixed(1)} points`,
                    confidence: 'Medium'
                });
            }
        });

        // Injury recommendations
        starters.forEach(player => {
            if (player.injury === 'Questionable' || player.injury === 'Doubtful') {
                recommendations.push({
                    type: 'injury_alert',
                    message: `Monitor ${player.name} injury status - ${player.injury}`,
                    impact: 'Potential 0 points if inactive',
                    confidence: 'High'
                });
            }
        });

        return recommendations.slice(0, 3); // Limit to top 3 recommendations
    }

    getFallbackLineup(roster) {
        // Fallback lineup using current starter/flex designations
        const starters = roster.roster.filter(p => ['starter', 'flex'].includes(p.status));
        
        return {
            lineup: starters.map(player => ({
                ...player,
                projection: this.getStaticProjection(player),
                lineupPosition: player.status === 'flex' ? 'FLEX' : player.position
            })),
            totalProjection: starters.reduce((sum, player) => sum + this.getStaticProjection(player), 0),
            confidence: 'Medium',
            recommendations: [{ 
                type: 'info', 
                message: 'Using current lineup - enable live data for optimization',
                impact: 'May not be optimal',
                confidence: 'Low'
            }]
        };
    }

    getSitStartRecommendations(userId = null) {
        const roster = this.getUserRoster(userId);
        if (!roster) return [];

        const recommendations = [];
        const positions = ['QB', 'RB', 'WR', 'TE'];

        positions.forEach(position => {
            const players = this.getPlayersByPosition(position, userId);
            if (players.length > 1) {
                const sorted = players.sort((a, b) => this.getStaticProjection(b) - this.getStaticProjection(a));
                
                recommendations.push({
                    position,
                    start: sorted[0],
                    sit: sorted.slice(1),
                    reasoning: `${sorted[0].name} has the highest projection for ${position} this week`
                });
            }
        });

        return recommendations;
    }

    getRosterAnalysis(userId = null) {
        const roster = this.getUserRoster(userId);
        if (!roster) return null;

        const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
        const analysis = {
            strengths: [],
            weaknesses: [],
            depthChart: {},
            overallGrade: 'B'
        };

        positions.forEach(position => {
            const players = this.getPlayersByPosition(position, userId);
            analysis.depthChart[position] = players.sort((a, b) => 
                this.getStaticProjection(b) - this.getStaticProjection(a)
            );

            const avgProjection = players.length > 0 ? 
                players.reduce((sum, p) => sum + this.getStaticProjection(p), 0) / players.length : 0;

            if (avgProjection > 15) {
                analysis.strengths.push(`Strong ${position} depth`);
            } else if (avgProjection < 10 && players.length > 0) {
                analysis.weaknesses.push(`${position} needs upgrade`);
            }
        });

        return analysis;
    }

    // User management functions
    addPlayer(userId, player) {
        const roster = this.getUserRoster(userId);
        if (roster && roster.roster.length < this.leagueSettings.rosterSize) {
            player.status = 'bench'; // New players go to bench by default
            roster.roster.push(player);
            this.allPlayers.set(player.playerId, { ...player, ownedBy: userId });
            return true;
        }
        return false;
    }

    dropPlayer(userId, playerId) {
        const roster = this.getUserRoster(userId);
        if (roster) {
            roster.roster = roster.roster.filter(p => p.playerId !== playerId);
            this.allPlayers.delete(playerId);
            return true;
        }
        return false;
    }

    setPlayerStatus(userId, playerId, status) {
        const roster = this.getUserRoster(userId);
        if (roster) {
            const player = roster.roster.find(p => p.playerId === playerId);
            if (player) {
                player.status = status;
                return true;
            }
        }
        return false;
    }
}

// Initialize the roster manager
window.fantasyRosterManager = new FantasyRosterManager();
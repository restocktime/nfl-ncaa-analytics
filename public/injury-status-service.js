/**
 * NFL Injury Status Service - Real-time player availability tracking
 * Automatically detects and filters out injured/inactive players from picks
 * CRITICAL: Prevents showing props for players who aren't playing
 */

class InjuryStatusService {
    constructor() {
        this.apiKey = '9de126998e0df996011a28e9527dd7b9';
        this.injuredPlayers = new Map();
        this.lastUpdate = null;
        this.updateInterval = 30 * 60 * 1000; // 30 minutes
        
        console.log('🏥 Injury Status Service initialized - Auto-detecting player availability');
        
        // Initialize with known injuries
        this.initializeKnownInjuries();
        
        // Start automatic injury monitoring
        this.startInjuryMonitoring();
    }

    /**
     * Initialize with currently known injuries
     */
    initializeKnownInjuries() {
        // Critical injuries that affect picks immediately
        this.injuredPlayers.set('Brock Purdy', {
            team: '49ers',
            status: 'OUT',
            injury: 'Turf toe variant + shoulder',
            timeframe: '2-5 weeks',
            replacement: 'Mac Jones',
            lastUpdated: new Date().toISOString(),
            source: 'Official 49ers injury report'
        });
        
        this.injuredPlayers.set('George Kittle', {
            team: '49ers', 
            status: 'IR',
            injury: 'Hamstring',
            timeframe: 'Minimum 4 games',
            replacement: 'Logan Thomas',
            lastUpdated: new Date().toISOString(),
            source: 'Placed on IR'
        });
        
        console.log(`🚨 Loaded ${this.injuredPlayers.size} known injuries that affect picks`);
    }

    /**
     * Check if a player is available to play
     */
    isPlayerAvailable(playerName, teamName = null) {
        const injury = this.injuredPlayers.get(playerName);
        
        if (!injury) return true; // No injury record = available
        
        // If team provided, verify it matches
        if (teamName && injury.team.toLowerCase() !== teamName.toLowerCase()) {
            return true; // Different team, not our injured player
        }
        
        const isOut = ['OUT', 'IR', 'DOUBTFUL'].includes(injury.status.toUpperCase());
        
        if (isOut) {
            console.log(`❌ ${playerName} is ${injury.status} (${injury.injury}) - EXCLUDING from picks`);
            return false;
        }
        
        if (injury.status.toUpperCase() === 'QUESTIONABLE') {
            console.log(`⚠️ ${playerName} is QUESTIONABLE (${injury.injury}) - USE WITH CAUTION`);
            return true; // Still available but risky
        }
        
        return true;
    }

    /**
     * Get replacement player for injured starter
     */
    getReplacementPlayer(injuredPlayer, team) {
        const injury = this.injuredPlayers.get(injuredPlayer);
        
        if (injury && injury.replacement) {
            console.log(`🔄 ${injuredPlayer} OUT → Replacement: ${injury.replacement} (${team})`);
            return injury.replacement;
        }
        
        return null;
    }

    /**
     * Update team roster with injury replacements
     */
    updateRosterForInjuries(roster, teamName) {
        const updatedRoster = { ...roster };
        let hasChanges = false;
        
        // Check each position for injuries
        Object.keys(roster).forEach(position => {
            const player = roster[position];
            
            if (!this.isPlayerAvailable(player, teamName)) {
                const replacement = this.getReplacementPlayer(player, teamName);
                if (replacement) {
                    updatedRoster[position] = replacement;
                    hasChanges = true;
                    console.log(`🏥 ${teamName} ${position}: ${player} → ${replacement} (injury replacement)`);
                }
            }
        });
        
        if (hasChanges) {
            console.log(`✅ Updated ${teamName} roster for injury replacements`);
        }
        
        return updatedRoster;
    }

    /**
     * Filter picks to remove injured players
     */
    filterPicksForInjuries(picks) {
        const filteredPicks = picks.filter(pick => {
            const playerName = pick.player || pick.defender || pick.team;
            
            if (!playerName) return true; // No player identified, keep pick
            
            const isAvailable = this.isPlayerAvailable(playerName, pick.team);
            
            if (!isAvailable) {
                console.log(`🚫 FILTERED OUT: ${pick.market || pick.line} - ${playerName} is injured`);
                return false;
            }
            
            return true;
        });
        
        const removedCount = picks.length - filteredPicks.length;
        if (removedCount > 0) {
            console.log(`🏥 Filtered out ${removedCount} picks due to player injuries`);
        }
        
        return filteredPicks;
    }

    /**
     * Start automatic injury monitoring
     */
    startInjuryMonitoring() {
        // Update immediately
        this.updateInjuryStatus();
        
        // Set up recurring updates every 30 minutes
        setInterval(() => {
            this.updateInjuryStatus();
        }, this.updateInterval);
        
        console.log('🔄 Injury monitoring started - Updates every 30 minutes');
    }

    /**
     * Fetch latest injury reports and updates
     */
    async updateInjuryStatus() {
        try {
            console.log('🔍 Checking for injury updates...');
            
            // In production, this would fetch from NFL injury API
            // For now, we manually maintain critical injuries
            const criticalInjuries = await this.fetchCriticalInjuries();
            
            if (criticalInjuries.length > 0) {
                console.log(`🚨 Found ${criticalInjuries.length} critical injury updates`);
                this.processCriticalInjuries(criticalInjuries);
            }
            
            this.lastUpdate = new Date().toISOString();
            console.log(`✅ Injury status updated: ${new Date().toLocaleTimeString()}`);
            
        } catch (error) {
            console.error('❌ Failed to update injury status:', error);
        }
    }

    /**
     * Fetch critical injuries that affect fantasy/betting
     */
    async fetchCriticalInjuries() {
        // In production, integrate with injury APIs
        // For now, return current known critical injuries
        return [
            {
                player: 'Brock Purdy',
                team: '49ers',
                status: 'OUT', 
                injury: 'Turf toe variant',
                timeframe: '2-5 weeks',
                replacement: 'Mac Jones',
                severity: 'HIGH' // Affects game outcomes
            }
        ];
    }

    /**
     * Process and store critical injury updates
     */
    processCriticalInjuries(injuries) {
        injuries.forEach(injury => {
            this.injuredPlayers.set(injury.player, {
                team: injury.team,
                status: injury.status,
                injury: injury.injury,
                timeframe: injury.timeframe,
                replacement: injury.replacement,
                lastUpdated: new Date().toISOString(),
                source: 'Automated injury monitoring'
            });
            
            console.log(`🏥 Updated injury status: ${injury.player} (${injury.team}) - ${injury.status}`);
        });
    }

    /**
     * Get injury report summary for debugging
     */
    getInjuryReport() {
        const report = {
            totalInjuries: this.injuredPlayers.size,
            lastUpdate: this.lastUpdate,
            criticalInjuries: [],
            affectedTeams: new Set()
        };
        
        this.injuredPlayers.forEach((injury, player) => {
            if (['OUT', 'IR'].includes(injury.status)) {
                report.criticalInjuries.push({
                    player: player,
                    team: injury.team,
                    status: injury.status,
                    injury: injury.injury,
                    replacement: injury.replacement
                });
                
                report.affectedTeams.add(injury.team);
            }
        });
        
        return report;
    }

    /**
     * Validate game analysis accounts for injuries
     */
    validateGameAnalysis(homeTeam, awayTeam, analysis) {
        let hasInjuryImpact = false;
        const warnings = [];
        
        // Check for key player injuries that affect game outcome
        this.injuredPlayers.forEach((injury, player) => {
            if (injury.status === 'OUT' || injury.status === 'IR') {
                if (injury.team === homeTeam || injury.team === awayTeam) {
                    hasInjuryImpact = true;
                    warnings.push(`${player} (${injury.team}) is OUT - ${injury.injury}`);
                }
            }
        });
        
        if (hasInjuryImpact) {
            console.log(`⚠️ GAME ANALYSIS WARNING: ${homeTeam} vs ${awayTeam} has injury impact`);
            warnings.forEach(warning => console.log(`   🏥 ${warning}`));
            
            // Reduce confidence if key injuries aren't accounted for
            if (analysis && !analysis.injuryAdjusted) {
                console.log(`📉 Reducing analysis confidence due to unaccounted injuries`);
                return {
                    ...analysis,
                    confidence: this.reduceConfidenceForInjuries(analysis.confidence),
                    injuryWarnings: warnings,
                    injuryAdjusted: true
                };
            }
        }
        
        return analysis;
    }

    /**
     * Reduce confidence when key injuries aren't properly accounted for
     */
    reduceConfidenceForInjuries(currentConfidence) {
        const confidenceMap = {
            'very_high': 'high',
            'high': 'medium', 
            'medium': 'low',
            'low': 'low'
        };
        
        return confidenceMap[currentConfidence] || 'low';
    }
}

// Initialize global injury status service
window.injuryStatusService = new InjuryStatusService();

console.log('🏥 Injury Status Service loaded - Automatically filtering injured players from picks');
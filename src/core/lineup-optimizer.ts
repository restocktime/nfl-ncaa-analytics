import { 
  OptimalLineup, 
  LineupRecommendation, 
  PlayerProjection, 
  FantasyPlayer, 
  LeagueSettings, 
  OptimizationConstraints,
  RiskLevel,
  AlternativeOption
} from '../types/fantasy.types';

export interface LineupConstraints {
  positions: { [key: string]: number };
  maxSalary?: number;
  minSalary?: number;
  mustStart?: string[];
  mustBench?: string[];
  maxRisk?: RiskLevel;
  correlations?: CorrelationRule[];
}

export interface CorrelationRule {
  type: 'QB_WR_STACK' | 'QB_TE_STACK' | 'GAME_STACK' | 'TEAM_STACK';
  players: string[];
  bonus: number;
}

export interface OptimizationResult {
  lineup: OptimalLineup;
  projectedPoints: number;
  salary?: number;
  riskScore: number;
  correlationBonus: number;
}

export class LineupOptimizer {
  /**
   * Optimize lineup using mathematical optimization
   */
  async optimizeLineup(
    players: FantasyPlayer[],
    projections: PlayerProjection[],
    constraints: LineupConstraints
  ): Promise<OptimalLineup> {
    try {
      console.log(`Optimizing lineup with ${players.length} players`);

      // Create player lookup map
      const projectionMap = new Map(
        projections.map(p => [p.playerId, p])
      );

      // Filter available players and add projections
      const availablePlayers = players
        .filter(p => projectionMap.has(p.playerId))
        .map(p => ({
          ...p,
          projection: projectionMap.get(p.playerId)!
        }));

      // Run optimization algorithm
      const result = await this.runOptimization(availablePlayers, constraints);

      return result.lineup;
    } catch (error) {
      console.error('Error optimizing lineup:', error);
      throw error;
    }
  }

  /**
   * Generate multiple optimal lineups with diversity
   */
  async generateMultipleLineups(
    players: FantasyPlayer[],
    projections: PlayerProjection[],
    constraints: LineupConstraints,
    count: number = 3
  ): Promise<OptimalLineup[]> {
    const lineups: OptimalLineup[] = [];
    const usedPlayers = new Set<string>();

    for (let i = 0; i < count; i++) {
      // Add diversity constraint to avoid same players
      const diversityConstraints = {
        ...constraints,
        mustBench: [...(constraints.mustBench || []), ...Array.from(usedPlayers)]
      };

      try {
        const lineup = await this.optimizeLineup(players, projections, diversityConstraints);
        lineups.push(lineup);

        // Add some players to used set for diversity
        this.addPlayersToUsedSet(lineup, usedPlayers, 0.3); // 30% overlap allowed
      } catch (error) {
        console.warn(`Could not generate lineup ${i + 1}:`, error);
        break;
      }
    }

    return lineups;
  }

  /**
   * Calculate lineup projection and validate
   */
  async calculateLineupProjection(
    lineup: OptimalLineup,
    projections: PlayerProjection[]
  ): Promise<{
    totalProjection: number;
    positionBreakdown: { [key: string]: number };
    riskScore: number;
    confidence: number;
  }> {
    const projectionMap = new Map(projections.map(p => [p.playerId, p]));
    
    let totalProjection = 0;
    let totalVariance = 0;
    const positionBreakdown: { [key: string]: number } = {};

    // Calculate QB projection
    if (lineup.QB) {
      const proj = projectionMap.get(lineup.QB.playerId);
      if (proj) {
        totalProjection += proj.projectedPoints;
        totalVariance += this.calculatePlayerVariance(proj);
        positionBreakdown['QB'] = proj.projectedPoints;
      }
    }

    // Calculate RB projections
    lineup.RB.forEach(rb => {
      const proj = projectionMap.get(rb.playerId);
      if (proj) {
        totalProjection += proj.projectedPoints;
        totalVariance += this.calculatePlayerVariance(proj);
        positionBreakdown['RB'] = (positionBreakdown['RB'] || 0) + proj.projectedPoints;
      }
    });

    // Calculate WR projections
    lineup.WR.forEach(wr => {
      const proj = projectionMap.get(wr.playerId);
      if (proj) {
        totalProjection += proj.projectedPoints;
        totalVariance += this.calculatePlayerVariance(proj);
        positionBreakdown['WR'] = (positionBreakdown['WR'] || 0) + proj.projectedPoints;
      }
    });

    // Calculate TE projection
    if (lineup.TE) {
      const proj = projectionMap.get(lineup.TE.playerId);
      if (proj) {
        totalProjection += proj.projectedPoints;
        totalVariance += this.calculatePlayerVariance(proj);
        positionBreakdown['TE'] = proj.projectedPoints;
      }
    }

    // Calculate FLEX projection
    if (lineup.FLEX) {
      const proj = projectionMap.get(lineup.FLEX.playerId);
      if (proj) {
        totalProjection += proj.projectedPoints;
        totalVariance += this.calculatePlayerVariance(proj);
        positionBreakdown['FLEX'] = proj.projectedPoints;
      }
    }

    // Calculate K projection
    if (lineup.K) {
      const proj = projectionMap.get(lineup.K.playerId);
      if (proj) {
        totalProjection += proj.projectedPoints;
        totalVariance += this.calculatePlayerVariance(proj);
        positionBreakdown['K'] = proj.projectedPoints;
      }
    }

    // Calculate DEF projection
    if (lineup.DEF) {
      const proj = projectionMap.get(lineup.DEF.playerId);
      if (proj) {
        totalProjection += proj.projectedPoints;
        totalVariance += this.calculatePlayerVariance(proj);
        positionBreakdown['DEF'] = proj.projectedPoints;
      }
    }

    const riskScore = Math.sqrt(totalVariance) / totalProjection;
    const confidence = Math.max(0.1, Math.min(0.95, 1 - riskScore));

    return {
      totalProjection: Math.round(totalProjection * 10) / 10,
      positionBreakdown,
      riskScore: Math.round(riskScore * 100) / 100,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  /**
   * Validate lineup against league rules
   */
  async validateLineup(
    lineup: OptimalLineup,
    settings: LeagueSettings
  ): Promise<{
    isValid: boolean;
    violations: string[];
    warnings: string[];
  }> {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Check position requirements
    const positions = settings.rosterPositions;

    // Validate QB
    if (positions.QB > 0 && !lineup.QB) {
      violations.push('Missing required QB');
    } else if (positions.QB === 0 && lineup.QB) {
      violations.push('QB not allowed in this league');
    }

    // Validate RB
    if (lineup.RB.length < positions.RB) {
      violations.push(`Need ${positions.RB} RBs, have ${lineup.RB.length}`);
    } else if (lineup.RB.length > positions.RB + (positions.FLEX || 0)) {
      violations.push(`Too many RBs: ${lineup.RB.length}`);
    }

    // Validate WR
    if (lineup.WR.length < positions.WR) {
      violations.push(`Need ${positions.WR} WRs, have ${lineup.WR.length}`);
    } else if (lineup.WR.length > positions.WR + (positions.FLEX || 0)) {
      violations.push(`Too many WRs: ${lineup.WR.length}`);
    }

    // Validate TE
    if (positions.TE > 0 && !lineup.TE) {
      violations.push('Missing required TE');
    } else if (positions.TE === 0 && lineup.TE) {
      violations.push('TE not allowed in this league');
    }

    // Validate K
    if (positions.K > 0 && !lineup.K) {
      violations.push('Missing required K');
    } else if (positions.K === 0 && lineup.K) {
      violations.push('K not allowed in this league');
    }

    // Validate DEF
    if (positions.DEF > 0 && !lineup.DEF) {
      violations.push('Missing required DEF');
    } else if (positions.DEF === 0 && lineup.DEF) {
      violations.push('DEF not allowed in this league');
    }

    // Check for bye week conflicts
    const byeWeeks = this.getLineupByeWeeks(lineup);
    if (byeWeeks.length > 0) {
      warnings.push(`Players on bye: ${byeWeeks.join(', ')}`);
    }

    // Check for injury concerns
    const injuredPlayers = this.getInjuredPlayers(lineup);
    if (injuredPlayers.length > 0) {
      warnings.push(`Injury concerns: ${injuredPlayers.join(', ')}`);
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Generate lineup recommendations with reasoning
   */
  async generateRecommendations(
    players: FantasyPlayer[],
    projections: PlayerProjection[],
    constraints: LineupConstraints,
    settings: LeagueSettings
  ): Promise<LineupRecommendation[]> {
    try {
      // Generate multiple lineup options
      const lineups = await this.generateMultipleLineups(players, projections, constraints, 3);
      
      const recommendations: LineupRecommendation[] = [];

      for (const lineup of lineups) {
        // Calculate projection and metrics
        const metrics = await this.calculateLineupProjection(lineup, projections);
        
        // Validate lineup
        const validation = await this.validateLineup(lineup, settings);
        
        // Generate reasoning
        const reasoning = this.generateLineupReasoning(lineup, projections, metrics);
        
        // Generate alternatives
        const alternatives = await this.generateAlternatives(lineup, players, projections);
        
        // Determine risk level
        const riskLevel = this.determineRiskLevel(metrics.riskScore);

        recommendations.push({
          lineup,
          projectedPoints: metrics.totalProjection,
          confidence: metrics.confidence,
          reasoning,
          alternatives,
          riskLevel
        });
      }

      // Sort by projected points
      return recommendations.sort((a, b) => b.projectedPoints - a.projectedPoints);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  // Private helper methods

  private async runOptimization(
    players: any[],
    constraints: LineupConstraints
  ): Promise<OptimizationResult> {
    // This is a simplified greedy algorithm
    // In production, you'd use a proper MILP solver like GLPK or CBC
    
    const lineup: any = {};
    let totalProjection = 0;
    let totalSalary = 0;
    const usedPlayers = new Set<string>();

    // Sort players by value (points per dollar for DFS, or just points for season-long)
    const sortedPlayers = players.sort((a, b) => {
      const aValue = constraints.maxSalary ? 
        a.projection.projectedPoints / (a.salary || 1) :
        a.projection.projectedPoints;
      const bValue = constraints.maxSalary ?
        b.projection.projectedPoints / (b.salary || 1) :
        b.projection.projectedPoints;
      return bValue - aValue;
    });

    // Fill required positions
    for (const [position, count] of Object.entries(constraints.positions)) {
      const positionPlayers = sortedPlayers.filter(p => 
        p.position === position && 
        !usedPlayers.has(p.playerId) &&
        !constraints.mustBench?.includes(p.playerId)
      );

      if (position === 'QB' && count > 0) {
        const qb = positionPlayers[0];
        if (qb) {
          lineup.QB = qb;
          usedPlayers.add(qb.playerId);
          totalProjection += qb.projection.projectedPoints;
          totalSalary += qb.salary || 0;
        }
      } else if (position === 'RB') {
        lineup.RB = [];
        for (let i = 0; i < count && i < positionPlayers.length; i++) {
          const rb = positionPlayers[i];
          lineup.RB.push(rb);
          usedPlayers.add(rb.playerId);
          totalProjection += rb.projection.projectedPoints;
          totalSalary += rb.salary || 0;
        }
      } else if (position === 'WR') {
        lineup.WR = [];
        for (let i = 0; i < count && i < positionPlayers.length; i++) {
          const wr = positionPlayers[i];
          lineup.WR.push(wr);
          usedPlayers.add(wr.playerId);
          totalProjection += wr.projection.projectedPoints;
          totalSalary += wr.salary || 0;
        }
      } else if (position === 'TE' && count > 0) {
        const te = positionPlayers[0];
        if (te) {
          lineup.TE = te;
          usedPlayers.add(te.playerId);
          totalProjection += te.projection.projectedPoints;
          totalSalary += te.salary || 0;
        }
      } else if (position === 'K' && count > 0) {
        const k = positionPlayers[0];
        if (k) {
          lineup.K = k;
          usedPlayers.add(k.playerId);
          totalProjection += k.projection.projectedPoints;
          totalSalary += k.salary || 0;
        }
      } else if (position === 'DEF' && count > 0) {
        const def = positionPlayers[0];
        if (def) {
          lineup.DEF = def;
          usedPlayers.add(def.playerId);
          totalProjection += def.projection.projectedPoints;
          totalSalary += def.salary || 0;
        }
      }
    }

    // Fill FLEX if required
    if (constraints.positions.FLEX) {
      const flexEligible = sortedPlayers.filter(p => 
        ['RB', 'WR', 'TE'].includes(p.position) &&
        !usedPlayers.has(p.playerId) &&
        !constraints.mustBench?.includes(p.playerId)
      );

      if (flexEligible.length > 0) {
        const flex = flexEligible[0];
        lineup.FLEX = flex;
        usedPlayers.add(flex.playerId);
        totalProjection += flex.projection.projectedPoints;
        totalSalary += flex.salary || 0;
      }
    }

    return {
      lineup,
      projectedPoints: totalProjection,
      salary: totalSalary,
      riskScore: this.calculateLineupRisk(lineup),
      correlationBonus: 0
    };
  }

  private calculatePlayerVariance(projection: PlayerProjection): number {
    const range = projection.confidenceInterval[1] - projection.confidenceInterval[0];
    return Math.pow(range / 4, 2); // Approximate variance from confidence interval
  }

  private calculateLineupRisk(lineup: any): number {
    // Calculate overall lineup risk based on player variance and correlations
    let totalRisk = 0;
    let playerCount = 0;

    Object.values(lineup).forEach((player: any) => {
      if (Array.isArray(player)) {
        player.forEach(p => {
          if (p && p.projection) {
            totalRisk += this.calculatePlayerVariance(p.projection);
            playerCount++;
          }
        });
      } else if (player && player.projection) {
        totalRisk += this.calculatePlayerVariance(player.projection);
        playerCount++;
      }
    });

    return playerCount > 0 ? totalRisk / playerCount : 0;
  }

  private addPlayersToUsedSet(lineup: OptimalLineup, usedPlayers: Set<string>, overlapRate: number) {
    const allPlayers = [
      lineup.QB,
      ...lineup.RB,
      ...lineup.WR,
      lineup.TE,
      lineup.FLEX,
      lineup.K,
      lineup.DEF
    ].filter(Boolean);

    // Add a percentage of players to create diversity
    const playersToAdd = Math.ceil(allPlayers.length * overlapRate);
    for (let i = 0; i < playersToAdd && i < allPlayers.length; i++) {
      usedPlayers.add(allPlayers[i].playerId);
    }
  }

  private getLineupByeWeeks(lineup: OptimalLineup): string[] {
    const byePlayers: string[] = [];
    const currentWeek = new Date().getWeek(); // You'd implement this

    [lineup.QB, ...lineup.RB, ...lineup.WR, lineup.TE, lineup.FLEX, lineup.K, lineup.DEF]
      .filter(Boolean)
      .forEach(player => {
        if (player.byeWeek === currentWeek) {
          byePlayers.push(player.name);
        }
      });

    return byePlayers;
  }

  private getInjuredPlayers(lineup: OptimalLineup): string[] {
    const injuredPlayers: string[] = [];

    [lineup.QB, ...lineup.RB, ...lineup.WR, lineup.TE, lineup.FLEX, lineup.K, lineup.DEF]
      .filter(Boolean)
      .forEach(player => {
        if (['QUESTIONABLE', 'DOUBTFUL', 'OUT'].includes(player.injuryStatus)) {
          injuredPlayers.push(`${player.name} (${player.injuryStatus})`);
        }
      });

    return injuredPlayers;
  }

  private generateLineupReasoning(
    lineup: OptimalLineup,
    projections: PlayerProjection[],
    metrics: any
  ): string[] {
    const reasoning: string[] = [];
    const projectionMap = new Map(projections.map(p => [p.playerId, p]));

    // Analyze top performers
    const topPerformers = [lineup.QB, ...lineup.RB, ...lineup.WR, lineup.TE, lineup.FLEX]
      .filter(Boolean)
      .map(player => ({
        player,
        projection: projectionMap.get(player.playerId)
      }))
      .filter(p => p.projection)
      .sort((a, b) => b.projection!.projectedPoints - a.projection!.projectedPoints)
      .slice(0, 3);

    topPerformers.forEach(({ player, projection }) => {
      if (projection!.projectedPoints > 15) {
        reasoning.push(`${player.name} has high upside (${projection!.projectedPoints} proj)`);
      }
      if (projection!.matchupRating.overall > 7) {
        reasoning.push(`${player.name} has favorable matchup`);
      }
    });

    // Risk assessment
    if (metrics.riskScore < 0.2) {
      reasoning.push('Conservative lineup with consistent players');
    } else if (metrics.riskScore > 0.4) {
      reasoning.push('High-upside lineup with boom/bust potential');
    }

    // Confidence level
    if (metrics.confidence > 0.8) {
      reasoning.push('High confidence in projections');
    } else if (metrics.confidence < 0.6) {
      reasoning.push('Lower confidence due to uncertainty');
    }

    return reasoning.length > 0 ? reasoning : ['Optimal lineup based on projections'];
  }

  private async generateAlternatives(
    lineup: OptimalLineup,
    players: FantasyPlayer[],
    projections: PlayerProjection[]
  ): Promise<AlternativeOption[]> {
    const alternatives: AlternativeOption[] = [];
    const projectionMap = new Map(projections.map(p => [p.playerId, p]));
    const lineupPlayerIds = new Set([
      lineup.QB?.playerId,
      ...lineup.RB.map(p => p.playerId),
      ...lineup.WR.map(p => p.playerId),
      lineup.TE?.playerId,
      lineup.FLEX?.playerId,
      lineup.K?.playerId,
      lineup.DEF?.playerId
    ].filter(Boolean));

    // Find alternatives for each position
    const availableAlternatives = players
      .filter(p => !lineupPlayerIds.has(p.playerId) && projectionMap.has(p.playerId))
      .map(p => ({
        player: p,
        projection: projectionMap.get(p.playerId)!
      }))
      .sort((a, b) => b.projection.projectedPoints - a.projection.projectedPoints)
      .slice(0, 5);

    availableAlternatives.forEach(({ player, projection }) => {
      alternatives.push({
        player,
        position: player.fantasyPosition,
        reasoning: `Alternative option with ${projection.projectedPoints} projected points`,
        projectionDifference: projection.projectedPoints - (lineup.QB?.projectedPoints || 0)
      });
    });

    return alternatives;
  }

  private determineRiskLevel(riskScore: number): RiskLevel {
    if (riskScore < 0.25) return 'CONSERVATIVE';
    if (riskScore < 0.4) return 'MODERATE';
    return 'AGGRESSIVE';
  }
}

// Utility extension for Date to get week number
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function(): number {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};
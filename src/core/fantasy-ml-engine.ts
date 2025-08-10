import { 
  PlayerProjection, 
  MatchupRating, 
  InjuryRisk, 
  WeatherImpact,
  UsageProjection,
  GameScriptImpact 
} from '../types/fantasy.types';
import { Player } from '../models/Player';
import { MLModelService } from './ml-model-service';
import { WeatherAPIConnector } from './weather-api-connector';
import { DatabaseService } from './database-service';

export interface FantasyPrediction {
  projectedPoints: number;
  confidenceInterval: [number, number];
  ceiling: number;
  floor: number;
  variance: number;
}

export interface Matchup {
  homeTeam: string;
  awayTeam: string;
  week: number;
  season: number;
  isHomeGame: boolean;
}

export class FantasyMLEngine {
  private mlModelService: MLModelService;
  private weatherConnector: WeatherAPIConnector;
  private databaseService: DatabaseService;

  constructor(
    mlModelService: MLModelService,
    weatherConnector: WeatherAPIConnector,
    databaseService: DatabaseService
  ) {
    this.mlModelService = mlModelService;
    this.weatherConnector = weatherConnector;
    this.databaseService = databaseService;
  }

  /**
   * Generate comprehensive fantasy prediction for a player
   */
  async predictFantasyPoints(
    player: Player, 
    matchup: Matchup, 
    weather?: any
  ): Promise<FantasyPrediction> {
    try {
      console.log(`Generating fantasy prediction for ${player.name} (${player.position})`);

      // Get base statistical prediction from existing ML models
      const baseStats = await this.mlModelService.predictPlayerPerformance(
        player.id, 
        matchup.week
      );

      // Convert base stats to fantasy points
      const fantasyPoints = this.convertStatsToFantasyPoints(baseStats, player.position);

      // Apply matchup adjustments
      const matchupRating = await this.calculateMatchupDifficulty(player, matchup);
      const matchupAdjustment = this.calculateMatchupAdjustment(matchupRating, player.position);

      // Apply weather impact
      const weatherImpact = weather ? 
        this.calculateWeatherImpact(weather, player.position) : 0;

      // Apply game script impact
      const gameScript = await this.predictGameScript(matchup);
      const gameScriptAdjustment = this.calculateGameScriptImpact(gameScript, player.position);

      // Calculate final projection with all adjustments
      const adjustedPoints = fantasyPoints * (1 + matchupAdjustment + weatherImpact + gameScriptAdjustment);

      // Calculate variance and confidence intervals
      const variance = this.calculateProjectionVariance(player, matchup, adjustedPoints);
      const confidenceInterval = this.calculateConfidenceInterval(adjustedPoints, variance);

      return {
        projectedPoints: Math.round(adjustedPoints * 10) / 10,
        confidenceInterval,
        ceiling: Math.round(adjustedPoints * 1.6 * 10) / 10,
        floor: Math.round(adjustedPoints * 0.4 * 10) / 10,
        variance
      };
    } catch (error) {
      console.error('Error generating fantasy prediction:', error);
      throw error;
    }
  }

  /**
   * Calculate matchup difficulty rating
   */
  async calculateMatchupDifficulty(player: Player, matchup: Matchup): Promise<MatchupRating> {
    try {
      // Get opponent defensive stats
      const opponentTeam = matchup.isHomeGame ? matchup.awayTeam : matchup.homeTeam;
      const defenseStats = await this.getDefensiveStats(opponentTeam);

      // Calculate position-specific matchup ratings
      const positionRatings = this.calculatePositionMatchupRatings(
        player.position, 
        defenseStats
      );

      // Factor in home/away advantage
      const homeAwayImpact = matchup.isHomeGame ? 0.5 : -0.5;

      // Get team pace and style factors
      const paceRating = await this.calculatePaceImpact(opponentTeam);

      return {
        overall: this.calculateOverallMatchupRating(positionRatings),
        passDefense: positionRatings.passDefense,
        rushDefense: positionRatings.rushDefense,
        redZoneDefense: positionRatings.redZoneDefense,
        homeAwayImpact,
        pace: paceRating,
        reasoning: this.generateMatchupReasoning(positionRatings, player.position)
      };
    } catch (error) {
      console.error('Error calculating matchup difficulty:', error);
      // Return neutral matchup rating on error
      return {
        overall: 5,
        passDefense: 5,
        rushDefense: 5,
        redZoneDefense: 5,
        homeAwayImpact: 0,
        pace: 5,
        reasoning: ['Matchup analysis unavailable']
      };
    }
  }

  /**
   * Assess injury risk for a player
   */
  async assessInjuryRisk(player: Player): Promise<InjuryRisk> {
    try {
      // Get recent injury history
      const injuryHistory = await this.getPlayerInjuryHistory(player.id);
      
      // Calculate risk based on age, position, and history
      const ageRisk = this.calculateAgeInjuryRisk(player.age);
      const positionRisk = this.calculatePositionInjuryRisk(player.position);
      const historyRisk = this.calculateHistoryInjuryRisk(injuryHistory);

      const totalRisk = (ageRisk + positionRisk + historyRisk) / 3;

      let level: 'LOW' | 'MEDIUM' | 'HIGH';
      let impact: 'MINOR' | 'MODERATE' | 'SEVERE';

      if (totalRisk < 0.2) {
        level = 'LOW';
        impact = 'MINOR';
      } else if (totalRisk < 0.5) {
        level = 'MEDIUM';
        impact = 'MODERATE';
      } else {
        level = 'HIGH';
        impact = 'SEVERE';
      }

      return {
        level,
        probability: totalRisk,
        impact,
        description: this.generateInjuryRiskDescription(level, injuryHistory)
      };
    } catch (error) {
      console.error('Error assessing injury risk:', error);
      return {
        level: 'LOW',
        probability: 0.1,
        impact: 'MINOR',
        description: 'No significant injury concerns'
      };
    }
  }

  /**
   * Generate projection range with confidence intervals
   */
  async generateProjectionRange(player: Player, week: number): Promise<{
    projection: PlayerProjection;
    scenarios: { conservative: number; aggressive: number; };
  }> {
    try {
      // Get matchup info
      const matchup = await this.getPlayerMatchup(player, week);
      
      // Generate base prediction
      const prediction = await this.predictFantasyPoints(player, matchup);
      
      // Get additional context
      const matchupRating = await this.calculateMatchupDifficulty(player, matchup);
      const injuryRisk = await this.assessInjuryRisk(player);
      const weatherImpact = await this.getWeatherImpact(player, week);
      const usage = await this.projectPlayerUsage(player, week);
      const gameScript = await this.predictGameScript(matchup);

      const projection: PlayerProjection = {
        playerId: player.id,
        week,
        projectedPoints: prediction.projectedPoints,
        confidenceInterval: prediction.confidenceInterval,
        ceiling: prediction.ceiling,
        floor: prediction.floor,
        matchupRating,
        injuryRisk,
        weatherImpact,
        usage,
        gameScript: {
          gameScript: gameScript.script,
          impact: gameScript.impact,
          reasoning: gameScript.reasoning
        }
      };

      return {
        projection,
        scenarios: {
          conservative: prediction.floor,
          aggressive: prediction.ceiling
        }
      };
    } catch (error) {
      console.error('Error generating projection range:', error);
      throw error;
    }
  }

  // Private helper methods

  private convertStatsToFantasyPoints(stats: any, position: string): number {
    let points = 0;

    switch (position) {
      case 'QB':
        points = (stats.passingYards || 0) * 0.04 +
                (stats.passingTDs || 0) * 4 +
                (stats.interceptions || 0) * -2 +
                (stats.rushingYards || 0) * 0.1 +
                (stats.rushingTDs || 0) * 6;
        break;

      case 'RB':
        points = (stats.rushingYards || 0) * 0.1 +
                (stats.rushingTDs || 0) * 6 +
                (stats.receptions || 0) * 1 +
                (stats.receivingYards || 0) * 0.1 +
                (stats.receivingTDs || 0) * 6;
        break;

      case 'WR':
      case 'TE':
        points = (stats.receptions || 0) * 1 +
                (stats.receivingYards || 0) * 0.1 +
                (stats.receivingTDs || 0) * 6 +
                (stats.rushingYards || 0) * 0.1 +
                (stats.rushingTDs || 0) * 6;
        break;

      case 'K':
        points = (stats.fieldGoalsMade || 0) * 3 +
                (stats.extraPointsMade || 0) * 1 +
                (stats.fieldGoalsMissed || 0) * -1;
        break;

      case 'DEF':
        points = (stats.sacks || 0) * 1 +
                (stats.interceptions || 0) * 2 +
                (stats.fumbleRecoveries || 0) * 2 +
                (stats.defensiveTDs || 0) * 6 +
                (stats.safeties || 0) * 2 +
                this.calculateDefensePointsAllowed(stats.pointsAllowed || 0);
        break;

      default:
        points = 0;
    }

    return Math.max(0, points);
  }

  private calculateDefensePointsAllowed(pointsAllowed: number): number {
    if (pointsAllowed === 0) return 10;
    if (pointsAllowed <= 6) return 7;
    if (pointsAllowed <= 13) return 4;
    if (pointsAllowed <= 20) return 1;
    if (pointsAllowed <= 27) return 0;
    if (pointsAllowed <= 34) return -1;
    return -4;
  }

  private calculateMatchupAdjustment(matchupRating: MatchupRating, position: string): number {
    const overallImpact = (matchupRating.overall - 5) * 0.02; // 2% per point above/below 5

    let positionSpecificImpact = 0;
    switch (position) {
      case 'QB':
      case 'WR':
      case 'TE':
        positionSpecificImpact = (matchupRating.passDefense - 5) * 0.015;
        break;
      case 'RB':
        positionSpecificImpact = (matchupRating.rushDefense - 5) * 0.015;
        break;
    }

    const homeAwayImpact = matchupRating.homeAwayImpact * 0.01;
    const paceImpact = (matchupRating.pace - 5) * 0.005;

    return overallImpact + positionSpecificImpact + homeAwayImpact + paceImpact;
  }

  private calculateWeatherImpact(weather: any, position: string): number {
    let impact = 0;

    // Wind impact (affects passing more)
    if (position === 'QB' || position === 'WR' || position === 'TE' || position === 'K') {
      if (weather.windSpeed > 15) impact -= 0.05;
      if (weather.windSpeed > 25) impact -= 0.1;
    }

    // Temperature impact
    if (weather.temperature < 32) {
      impact -= 0.02;
    } else if (weather.temperature > 90) {
      impact -= 0.01;
    }

    // Precipitation impact
    if (weather.precipitation > 0.1) {
      impact -= 0.03;
      if (position === 'K') impact -= 0.05; // Kickers more affected
    }

    return Math.max(-0.2, Math.min(0.05, impact));
  }

  private calculateGameScriptImpact(gameScript: any, position: string): number {
    let impact = 0;

    switch (gameScript.script) {
      case 'POSITIVE': // Team expected to lead
        if (position === 'RB') impact += 0.05;
        if (position === 'QB' || position === 'WR') impact -= 0.02;
        break;
      case 'NEGATIVE': // Team expected to trail
        if (position === 'QB' || position === 'WR' || position === 'TE') impact += 0.05;
        if (position === 'RB') impact -= 0.03;
        break;
      case 'NEUTRAL':
      default:
        impact = 0;
    }

    return impact;
  }

  private calculateProjectionVariance(player: Player, matchup: Matchup, projection: number): number {
    // Base variance by position
    const positionVariance = {
      'QB': 0.15,
      'RB': 0.20,
      'WR': 0.25,
      'TE': 0.22,
      'K': 0.30,
      'DEF': 0.25
    };

    let variance = positionVariance[player.position as keyof typeof positionVariance] || 0.20;

    // Adjust for matchup uncertainty
    const matchupRating = matchup ? 5 : 5; // Default neutral if no matchup
    if (matchupRating < 3 || matchupRating > 7) {
      variance *= 1.2; // Higher variance for extreme matchups
    }

    // Adjust for player consistency (would use historical data)
    // For now, use a default adjustment
    variance *= (1 + Math.random() * 0.1); // Add some randomness

    return variance;
  }

  private calculateConfidenceInterval(projection: number, variance: number): [number, number] {
    const standardDeviation = projection * variance;
    const lower = Math.max(0, projection - (1.96 * standardDeviation));
    const upper = projection + (1.96 * standardDeviation);
    
    return [
      Math.round(lower * 10) / 10,
      Math.round(upper * 10) / 10
    ];
  }

  private async getDefensiveStats(teamName: string) {
    // This would query the database for defensive statistics
    // For now, return mock data
    return {
      passYardsAllowedPerGame: 250,
      rushYardsAllowedPerGame: 120,
      passingTDsAllowed: 1.5,
      rushingTDsAllowed: 1.0,
      redZoneDefenseRank: 15,
      sacks: 2.5,
      interceptions: 1.0
    };
  }

  private calculatePositionMatchupRatings(position: string, defenseStats: any) {
    // Calculate ratings on 1-10 scale (10 = best matchup for offense)
    const passDefense = Math.max(1, Math.min(10, 
      10 - (defenseStats.passYardsAllowedPerGame - 200) / 20
    ));
    
    const rushDefense = Math.max(1, Math.min(10,
      10 - (defenseStats.rushYardsAllowedPerGame - 100) / 15
    ));

    const redZoneDefense = Math.max(1, Math.min(10,
      11 - (defenseStats.redZoneDefenseRank / 3.2)
    ));

    return {
      passDefense: Math.round(passDefense * 10) / 10,
      rushDefense: Math.round(rushDefense * 10) / 10,
      redZoneDefense: Math.round(redZoneDefense * 10) / 10
    };
  }

  private calculateOverallMatchupRating(ratings: any): number {
    return Math.round(((ratings.passDefense + ratings.rushDefense + ratings.redZoneDefense) / 3) * 10) / 10;
  }

  private generateMatchupReasoning(ratings: any, position: string): string[] {
    const reasoning = [];

    if (position === 'QB' || position === 'WR' || position === 'TE') {
      if (ratings.passDefense > 7) {
        reasoning.push('Favorable matchup against weak pass defense');
      } else if (ratings.passDefense < 4) {
        reasoning.push('Difficult matchup against strong pass defense');
      }
    }

    if (position === 'RB') {
      if (ratings.rushDefense > 7) {
        reasoning.push('Excellent matchup against poor run defense');
      } else if (ratings.rushDefense < 4) {
        reasoning.push('Tough matchup against elite run defense');
      }
    }

    if (ratings.redZoneDefense > 7) {
      reasoning.push('High touchdown potential in red zone');
    } else if (ratings.redZoneDefense < 4) {
      reasoning.push('Limited red zone opportunities expected');
    }

    return reasoning.length > 0 ? reasoning : ['Neutral matchup expected'];
  }

  private async calculatePaceImpact(teamName: string): Promise<number> {
    // This would analyze team pace and return impact rating
    // For now, return neutral
    return 5;
  }

  private async getPlayerInjuryHistory(playerId: string) {
    // Query injury history from database
    // For now, return empty array
    return [];
  }

  private calculateAgeInjuryRisk(age: number): number {
    if (age < 25) return 0.1;
    if (age < 30) return 0.15;
    if (age < 33) return 0.25;
    return 0.35;
  }

  private calculatePositionInjuryRisk(position: string): number {
    const riskByPosition = {
      'QB': 0.15,
      'RB': 0.30,
      'WR': 0.20,
      'TE': 0.25,
      'K': 0.05,
      'DEF': 0.10
    };
    return riskByPosition[position as keyof typeof riskByPosition] || 0.15;
  }

  private calculateHistoryInjuryRisk(history: any[]): number {
    // Calculate risk based on injury history
    return history.length * 0.05;
  }

  private generateInjuryRiskDescription(level: string, history: any[]): string {
    if (level === 'LOW') return 'No significant injury concerns';
    if (level === 'MEDIUM') return 'Some injury risk based on position/age';
    return 'Higher injury risk - monitor closely';
  }

  private async getPlayerMatchup(player: Player, week: number): Promise<Matchup> {
    // This would query the schedule to get the player's matchup
    // For now, return mock matchup
    return {
      homeTeam: player.team,
      awayTeam: 'Opponent',
      week,
      season: 2024,
      isHomeGame: true
    };
  }

  private async getWeatherImpact(player: Player, week: number): Promise<WeatherImpact> {
    try {
      const weather = await this.weatherConnector.getGameWeather(player.team, week);
      
      return {
        temperature: weather?.temperature || 70,
        windSpeed: weather?.windSpeed || 5,
        precipitation: weather?.precipitation || 0,
        impact: this.calculateWeatherImpact(weather, player.position),
        description: weather ? 'Weather conditions factored in' : 'No weather impact'
      };
    } catch (error) {
      return {
        temperature: 70,
        windSpeed: 5,
        precipitation: 0,
        impact: 0,
        description: 'Weather data unavailable'
      };
    }
  }

  private async projectPlayerUsage(player: Player, week: number): Promise<UsageProjection> {
    // This would analyze recent usage trends and project forward
    // For now, return position-based defaults
    const usageByPosition = {
      'QB': { snapShare: 1.0 },
      'RB': { snapShare: 0.65, carryShare: 0.6, redZoneTargets: 2 },
      'WR': { snapShare: 0.75, targetShare: 0.15, redZoneTargets: 1 },
      'TE': { snapShare: 0.70, targetShare: 0.12, redZoneTargets: 2 },
      'K': { snapShare: 0.1 },
      'DEF': { snapShare: 1.0 }
    };

    return usageByPosition[player.position as keyof typeof usageByPosition] || { snapShare: 0.5 };
  }

  private async predictGameScript(matchup: Matchup): Promise<{
    script: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    impact: number;
    reasoning: string;
  }> {
    // This would analyze team strengths, betting lines, etc.
    // For now, return neutral
    return {
      script: 'NEUTRAL',
      impact: 0,
      reasoning: 'Even game script expected'
    };
  }
}
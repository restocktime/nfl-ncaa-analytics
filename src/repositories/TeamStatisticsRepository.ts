import { DataSource, Between, In } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { TeamStatistics } from '../entities/TeamStatistics.entity';

export class TeamStatisticsRepository extends BaseRepository<TeamStatistics> {
  constructor(dataSource: DataSource) {
    super(dataSource, TeamStatistics);
  }

  async findByTeam(teamId: string, season?: number): Promise<TeamStatistics[]> {
    const whereClause: any = { teamId };
    if (season) {
      whereClause.season = season;
    }

    return this.repository.find({
      where: whereClause,
      relations: ['team'],
      order: { 
        season: 'DESC',
        week: 'DESC' 
      }
    });
  }

  async findBySeason(season: number): Promise<TeamStatistics[]> {
    return this.repository.find({
      where: { season },
      relations: ['team'],
      order: { 
        week: 'DESC',
        pointsScored: 'DESC'
      }
    });
  }

  async findByWeek(season: number, week: number): Promise<TeamStatistics[]> {
    return this.repository.find({
      where: { season, week },
      relations: ['team'],
      order: { pointsScored: 'DESC' }
    });
  }

  async findSeasonTotals(teamId: string, season: number): Promise<any> {
    const stats = await this.repository
      .createQueryBuilder('stats')
      .select([
        'SUM(stats.points_scored) as totalPointsScored',
        'SUM(stats.total_yards) as totalYards',
        'SUM(stats.passing_yards) as totalPassingYards',
        'SUM(stats.rushing_yards) as totalRushingYards',
        'SUM(stats.first_downs) as totalFirstDowns',
        'SUM(stats.third_down_conversions) as totalThirdDownConversions',
        'SUM(stats.third_down_attempts) as totalThirdDownAttempts',
        'SUM(stats.red_zone_conversions) as totalRedZoneConversions',
        'SUM(stats.red_zone_attempts) as totalRedZoneAttempts',
        'SUM(stats.turnovers) as totalTurnovers',
        'SUM(stats.penalties) as totalPenalties',
        'SUM(stats.penalty_yards) as totalPenaltyYards',
        'SUM(stats.points_allowed) as totalPointsAllowed',
        'SUM(stats.yards_allowed) as totalYardsAllowed',
        'SUM(stats.passing_yards_allowed) as totalPassingYardsAllowed',
        'SUM(stats.rushing_yards_allowed) as totalRushingYardsAllowed',
        'SUM(stats.sacks) as totalSacks',
        'SUM(stats.interceptions) as totalInterceptions',
        'SUM(stats.fumbles_recovered) as totalFumblesRecovered',
        'SUM(stats.tackles_for_loss) as totalTacklesForLoss',
        'AVG(stats.offensive_efficiency) as avgOffensiveEfficiency',
        'AVG(stats.defensive_efficiency) as avgDefensiveEfficiency',
        'AVG(stats.expected_points_added) as avgExpectedPointsAdded',
        'AVG(stats.success_rate) as avgSuccessRate',
        'COUNT(*) as gamesPlayed'
      ])
      .where('stats.team_id = :teamId', { teamId })
      .andWhere('stats.season = :season', { season })
      .getRawOne();

    return stats;
  }

  async findHomeVsAwayStats(teamId: string, season: number): Promise<{
    home: TeamStatistics[];
    away: TeamStatistics[];
  }> {
    const homeStats = await this.repository.find({
      where: { teamId, season, isHome: true },
      relations: ['team'],
      order: { week: 'ASC' }
    });

    const awayStats = await this.repository.find({
      where: { teamId, season, isHome: false },
      relations: ['team'],
      order: { week: 'ASC' }
    });

    return { home: homeStats, away: awayStats };
  }

  async findOpponentStats(teamId: string, opponentId: string): Promise<TeamStatistics[]> {
    return this.repository.find({
      where: { teamId, opponentId },
      relations: ['team'],
      order: { 
        season: 'DESC',
        week: 'DESC' 
      }
    });
  }

  async getTopOffenses(season: number, limit: number = 10): Promise<any[]> {
    return this.repository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.team', 'team')
      .select([
        'stats.team_id as teamId',
        'team.name as teamName',
        'AVG(stats.points_scored) as avgPointsScored',
        'AVG(stats.total_yards) as avgTotalYards',
        'AVG(stats.offensive_efficiency) as avgOffensiveEfficiency'
      ])
      .where('stats.season = :season', { season })
      .groupBy('stats.team_id, team.name')
      .orderBy('avgPointsScored', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getTopDefenses(season: number, limit: number = 10): Promise<any[]> {
    return this.repository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.team', 'team')
      .select([
        'stats.team_id as teamId',
        'team.name as teamName',
        'AVG(stats.points_allowed) as avgPointsAllowed',
        'AVG(stats.yards_allowed) as avgYardsAllowed',
        'AVG(stats.defensive_efficiency) as avgDefensiveEfficiency'
      ])
      .where('stats.season = :season', { season })
      .groupBy('stats.team_id, team.name')
      .orderBy('avgPointsAllowed', 'ASC')
      .limit(limit)
      .getRawMany();
  }

  async findRedZoneStats(teamId: string, season: number): Promise<{
    offensiveRedZonePercentage: number;
    defensiveRedZonePercentage: number;
  }> {
    const stats = await this.repository
      .createQueryBuilder('stats')
      .select([
        'SUM(stats.red_zone_conversions) as totalRedZoneConversions',
        'SUM(stats.red_zone_attempts) as totalRedZoneAttempts'
      ])
      .where('stats.team_id = :teamId', { teamId })
      .andWhere('stats.season = :season', { season })
      .getRawOne();

    const offensiveRedZonePercentage = stats.totalRedZoneAttempts > 0 
      ? (stats.totalRedZoneConversions / stats.totalRedZoneAttempts) * 100 
      : 0;

    // For defensive red zone stats, we'd need opponent data
    // This is a simplified version
    const defensiveRedZonePercentage = 0; // Would need more complex query

    return {
      offensiveRedZonePercentage,
      defensiveRedZonePercentage
    };
  }

  async findThirdDownStats(teamId: string, season: number): Promise<{
    thirdDownConversionPercentage: number;
    thirdDownDefensePercentage: number;
  }> {
    const stats = await this.repository
      .createQueryBuilder('stats')
      .select([
        'SUM(stats.third_down_conversions) as totalThirdDownConversions',
        'SUM(stats.third_down_attempts) as totalThirdDownAttempts'
      ])
      .where('stats.team_id = :teamId', { teamId })
      .andWhere('stats.season = :season', { season })
      .getRawOne();

    const thirdDownConversionPercentage = stats.totalThirdDownAttempts > 0 
      ? (stats.totalThirdDownConversions / stats.totalThirdDownAttempts) * 100 
      : 0;

    // For defensive third down stats, we'd need opponent data
    const thirdDownDefensePercentage = 0; // Would need more complex query

    return {
      thirdDownConversionPercentage,
      thirdDownDefensePercentage
    };
  }

  async bulkInsertStatistics(statistics: Partial<TeamStatistics>[]): Promise<TeamStatistics[]> {
    const entities = statistics.map(stat => this.repository.create(stat));
    return this.repository.save(entities);
  }

  async findTrendingStats(teamId: string, season: number, weeks: number = 4): Promise<TeamStatistics[]> {
    return this.repository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.team', 'team')
      .where('stats.team_id = :teamId', { teamId })
      .andWhere('stats.season = :season', { season })
      .orderBy('stats.week', 'DESC')
      .limit(weeks)
      .getMany();
  }
}
import { DataSource, Between, In } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { PlayerStatistics } from '../entities/PlayerStatistics.entity';
import { Position } from '../entities/Player.entity';

export class PlayerStatisticsRepository extends BaseRepository<PlayerStatistics> {
  constructor(dataSource: DataSource) {
    super(dataSource, PlayerStatistics);
  }

  async findByPlayer(playerId: string, season?: number): Promise<PlayerStatistics[]> {
    const whereClause: any = { playerId };
    if (season) {
      whereClause.season = season;
    }

    return this.repository.find({
      where: whereClause,
      relations: ['player', 'player.team'],
      order: { 
        season: 'DESC',
        week: 'DESC' 
      }
    });
  }

  async findBySeason(season: number, position?: Position): Promise<PlayerStatistics[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.player', 'player')
      .leftJoinAndSelect('player.team', 'team')
      .where('stats.season = :season', { season });

    if (position) {
      queryBuilder.andWhere('player.position = :position', { position });
    }

    return queryBuilder
      .orderBy('stats.week', 'DESC')
      .getMany();
  }

  async findByWeek(season: number, week: number): Promise<PlayerStatistics[]> {
    return this.repository.find({
      where: { season, week },
      relations: ['player', 'player.team'],
      order: { 
        passingYards: 'DESC',
        rushingYards: 'DESC',
        receivingYards: 'DESC'
      }
    });
  }

  async findSeasonTotals(playerId: string, season: number): Promise<any> {
    const stats = await this.repository
      .createQueryBuilder('stats')
      .select([
        'SUM(stats.games_played) as totalGamesPlayed',
        'SUM(stats.games_started) as totalGamesStarted',
        'SUM(stats.passing_attempts) as totalPassingAttempts',
        'SUM(stats.passing_completions) as totalPassingCompletions',
        'SUM(stats.passing_yards) as totalPassingYards',
        'SUM(stats.passing_touchdowns) as totalPassingTouchdowns',
        'SUM(stats.interceptions_thrown) as totalInterceptionsThrown',
        'SUM(stats.sacks_taken) as totalSacksTaken',
        'AVG(stats.qb_rating) as avgQbRating',
        'SUM(stats.rushing_attempts) as totalRushingAttempts',
        'SUM(stats.rushing_yards) as totalRushingYards',
        'SUM(stats.rushing_touchdowns) as totalRushingTouchdowns',
        'SUM(stats.fumbles) as totalFumbles',
        'SUM(stats.receptions) as totalReceptions',
        'SUM(stats.receiving_yards) as totalReceivingYards',
        'SUM(stats.receiving_touchdowns) as totalReceivingTouchdowns',
        'SUM(stats.targets) as totalTargets',
        'SUM(stats.drops) as totalDrops',
        'SUM(stats.tackles) as totalTackles',
        'SUM(stats.assists) as totalAssists',
        'SUM(stats.sacks) as totalSacks',
        'SUM(stats.tackles_for_loss) as totalTacklesForLoss',
        'SUM(stats.interceptions) as totalInterceptions',
        'SUM(stats.pass_deflections) as totalPassDeflections',
        'SUM(stats.forced_fumbles) as totalForcedFumbles',
        'SUM(stats.fumble_recoveries) as totalFumbleRecoveries',
        'COUNT(*) as weeksPlayed'
      ])
      .where('stats.player_id = :playerId', { playerId })
      .andWhere('stats.season = :season', { season })
      .getRawOne();

    return stats;
  }

  async getTopPassers(season: number, limit: number = 10): Promise<any[]> {
    return this.repository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.player', 'player')
      .leftJoinAndSelect('player.team', 'team')
      .select([
        'stats.player_id as playerId',
        'player.name as playerName',
        'team.name as teamName',
        'SUM(stats.passing_yards) as totalPassingYards',
        'SUM(stats.passing_touchdowns) as totalPassingTouchdowns',
        'AVG(stats.qb_rating) as avgQbRating'
      ])
      .where('stats.season = :season', { season })
      .andWhere('player.position = :position', { position: 'QB' })
      .groupBy('stats.player_id, player.name, team.name')
      .orderBy('totalPassingYards', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getTopRushers(season: number, limit: number = 10): Promise<any[]> {
    return this.repository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.player', 'player')
      .leftJoinAndSelect('player.team', 'team')
      .select([
        'stats.player_id as playerId',
        'player.name as playerName',
        'team.name as teamName',
        'SUM(stats.rushing_yards) as totalRushingYards',
        'SUM(stats.rushing_touchdowns) as totalRushingTouchdowns',
        'AVG(stats.rushing_yards / NULLIF(stats.rushing_attempts, 0)) as avgYardsPerCarry'
      ])
      .where('stats.season = :season', { season })
      .andWhere('player.position IN (:...positions)', { positions: ['RB', 'FB', 'QB'] })
      .groupBy('stats.player_id, player.name, team.name')
      .orderBy('totalRushingYards', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getTopReceivers(season: number, limit: number = 10): Promise<any[]> {
    return this.repository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.player', 'player')
      .leftJoinAndSelect('player.team', 'team')
      .select([
        'stats.player_id as playerId',
        'player.name as playerName',
        'team.name as teamName',
        'SUM(stats.receiving_yards) as totalReceivingYards',
        'SUM(stats.receiving_touchdowns) as totalReceivingTouchdowns',
        'SUM(stats.receptions) as totalReceptions',
        'AVG(stats.receiving_yards / NULLIF(stats.receptions, 0)) as avgYardsPerReception'
      ])
      .where('stats.season = :season', { season })
      .andWhere('player.position IN (:...positions)', { positions: ['WR', 'TE', 'RB'] })
      .groupBy('stats.player_id, player.name, team.name')
      .orderBy('totalReceivingYards', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getTopDefenders(season: number, limit: number = 10): Promise<any[]> {
    return this.repository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.player', 'player')
      .leftJoinAndSelect('player.team', 'team')
      .select([
        'stats.player_id as playerId',
        'player.name as playerName',
        'team.name as teamName',
        'SUM(stats.tackles) as totalTackles',
        'SUM(stats.assists) as totalAssists',
        'SUM(stats.sacks) as totalSacks',
        'SUM(stats.interceptions) as totalInterceptions',
        'SUM(stats.forced_fumbles) as totalForcedFumbles'
      ])
      .where('stats.season = :season', { season })
      .andWhere('player.position IN (:...positions)', { 
        positions: ['LB', 'ILB', 'OLB', 'CB', 'S', 'FS', 'SS', 'DE', 'DT', 'NT'] 
      })
      .groupBy('stats.player_id, player.name, team.name')
      .orderBy('totalTackles', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async findPlayerVsOpponent(playerId: string, opponentId: string): Promise<PlayerStatistics[]> {
    return this.repository.find({
      where: { playerId, opponentId },
      relations: ['player', 'player.team'],
      order: { 
        season: 'DESC',
        week: 'DESC' 
      }
    });
  }

  async findHomeVsAwayStats(playerId: string, season: number): Promise<{
    home: PlayerStatistics[];
    away: PlayerStatistics[];
  }> {
    const homeStats = await this.repository.find({
      where: { playerId, season, isHome: true },
      relations: ['player', 'player.team'],
      order: { week: 'ASC' }
    });

    const awayStats = await this.repository.find({
      where: { playerId, season, isHome: false },
      relations: ['player', 'player.team'],
      order: { week: 'ASC' }
    });

    return { home: homeStats, away: awayStats };
  }

  async getRedZoneStats(playerId: string, season: number): Promise<any> {
    // This would require more detailed play-by-play data
    // For now, return a placeholder structure
    return {
      redZoneTargets: 0,
      redZoneReceptions: 0,
      redZoneTouchdowns: 0,
      redZoneConversionRate: 0
    };
  }

  async bulkInsertStatistics(statistics: Partial<PlayerStatistics>[]): Promise<PlayerStatistics[]> {
    const entities = statistics.map(stat => this.repository.create(stat));
    return this.repository.save(entities);
  }

  async findTrendingStats(playerId: string, season: number, weeks: number = 4): Promise<PlayerStatistics[]> {
    return this.repository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.player', 'player')
      .leftJoinAndSelect('player.team', 'team')
      .where('stats.player_id = :playerId', { playerId })
      .andWhere('stats.season = :season', { season })
      .orderBy('stats.week', 'DESC')
      .limit(weeks)
      .getMany();
  }

  async getFantasyRelevantStats(season: number, position: Position, limit: number = 20): Promise<any[]> {
    let selectFields: string[] = [];
    let orderByField = '';

    switch (position) {
      case Position.QB:
        selectFields = [
          'SUM(stats.passing_yards) as totalPassingYards',
          'SUM(stats.passing_touchdowns) as totalPassingTouchdowns',
          'SUM(stats.rushing_yards) as totalRushingYards',
          'SUM(stats.rushing_touchdowns) as totalRushingTouchdowns',
          'SUM(stats.interceptions_thrown) as totalInterceptions'
        ];
        orderByField = 'totalPassingYards';
        break;
      case Position.RB:
        selectFields = [
          'SUM(stats.rushing_yards) as totalRushingYards',
          'SUM(stats.rushing_touchdowns) as totalRushingTouchdowns',
          'SUM(stats.receiving_yards) as totalReceivingYards',
          'SUM(stats.receiving_touchdowns) as totalReceivingTouchdowns',
          'SUM(stats.receptions) as totalReceptions'
        ];
        orderByField = 'totalRushingYards';
        break;
      case Position.WR:
      case Position.TE:
        selectFields = [
          'SUM(stats.receiving_yards) as totalReceivingYards',
          'SUM(stats.receiving_touchdowns) as totalReceivingTouchdowns',
          'SUM(stats.receptions) as totalReceptions',
          'SUM(stats.targets) as totalTargets'
        ];
        orderByField = 'totalReceivingYards';
        break;
      default:
        selectFields = ['SUM(stats.tackles) as totalTackles'];
        orderByField = 'totalTackles';
    }

    return this.repository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.player', 'player')
      .leftJoinAndSelect('player.team', 'team')
      .select([
        'stats.player_id as playerId',
        'player.name as playerName',
        'team.name as teamName',
        ...selectFields
      ])
      .where('stats.season = :season', { season })
      .andWhere('player.position = :position', { position })
      .groupBy('stats.player_id, player.name, team.name')
      .orderBy(orderByField, 'DESC')
      .limit(limit)
      .getRawMany();
  }
}
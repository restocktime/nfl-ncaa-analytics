import { DataSource, Like, In } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { Team } from '../entities/Team.entity';

export class TeamRepository extends BaseRepository<Team> {
  constructor(dataSource: DataSource) {
    super(dataSource, Team);
  }

  async findByName(name: string): Promise<Team | null> {
    return this.repository.findOne({
      where: { name },
      relations: ['players', 'statistics']
    });
  }

  async findByAbbreviation(abbreviation: string): Promise<Team | null> {
    return this.repository.findOne({
      where: { abbreviation },
      relations: ['players', 'statistics']
    });
  }

  async findByConference(conference: string): Promise<Team[]> {
    return this.repository.find({
      where: { conference },
      relations: ['players'],
      order: { name: 'ASC' }
    });
  }

  async findByDivision(division: string): Promise<Team[]> {
    return this.repository.find({
      where: { division },
      relations: ['players'],
      order: { name: 'ASC' }
    });
  }

  async searchByName(searchTerm: string): Promise<Team[]> {
    return this.repository.find({
      where: { name: Like(`%${searchTerm}%`) },
      order: { name: 'ASC' }
    });
  }

  async findWithPlayers(teamId: string): Promise<Team | null> {
    return this.repository.findOne({
      where: { id: teamId },
      relations: ['players'],
      order: {
        players: {
          depthChartPosition: 'ASC',
          name: 'ASC'
        }
      }
    });
  }

  async findWithStatistics(teamId: string, season?: number): Promise<Team | null> {
    const whereClause: any = { id: teamId };
    
    return this.repository.findOne({
      where: whereClause,
      relations: ['statistics'],
      order: {
        statistics: {
          season: 'DESC',
          week: 'DESC'
        }
      }
    });
  }

  async findByIds(teamIds: string[]): Promise<Team[]> {
    return this.repository.find({
      where: { id: In(teamIds) },
      relations: ['players']
    });
  }

  async getTeamRoster(teamId: string, activeOnly: boolean = true): Promise<Team | null> {
    const team = await this.repository.findOne({
      where: { id: teamId },
      relations: ['players']
    });

    if (team && activeOnly) {
      team.players = team.players.filter(player => 
        player.injuryStatus !== 'ir' && player.injuryStatus !== 'out'
      );
    }

    return team;
  }

  async updateCoachingStaff(teamId: string, coachingStaff: any): Promise<Team | null> {
    await this.repository.update(teamId, { coachingStaff });
    return this.findById(teamId);
  }

  async findTeamsWithRecentGames(days: number = 7): Promise<Team[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return this.repository
      .createQueryBuilder('team')
      .leftJoin('games', 'game', 'game.home_team_id = team.id OR game.away_team_id = team.id')
      .where('game.scheduled_time >= :cutoffDate', { cutoffDate })
      .groupBy('team.id')
      .getMany();
  }
}
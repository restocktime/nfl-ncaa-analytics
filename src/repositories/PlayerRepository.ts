import { DataSource, Like, In } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { Player, Position, InjuryStatus } from '../entities/Player.entity';

export class PlayerRepository extends BaseRepository<Player> {
  constructor(dataSource: DataSource) {
    super(dataSource, Player);
  }

  async findByTeam(teamId: string): Promise<Player[]> {
    return this.repository.find({
      where: { teamId },
      relations: ['team', 'statistics'],
      order: { 
        depthChartPosition: 'ASC',
        name: 'ASC' 
      }
    });
  }

  async findByPosition(position: Position, teamId?: string): Promise<Player[]> {
    const whereClause: any = { position };
    if (teamId) {
      whereClause.teamId = teamId;
    }

    return this.repository.find({
      where: whereClause,
      relations: ['team', 'statistics'],
      order: { name: 'ASC' }
    });
  }

  async findByInjuryStatus(injuryStatus: InjuryStatus): Promise<Player[]> {
    return this.repository.find({
      where: { injuryStatus },
      relations: ['team'],
      order: { name: 'ASC' }
    });
  }

  async findStarters(teamId: string): Promise<Player[]> {
    return this.repository.find({
      where: { 
        teamId,
        isStarter: true 
      },
      relations: ['team', 'statistics'],
      order: { depthChartPosition: 'ASC' }
    });
  }

  async findByName(name: string): Promise<Player[]> {
    return this.repository.find({
      where: { name: Like(`%${name}%`) },
      relations: ['team'],
      order: { name: 'ASC' }
    });
  }

  async findByJerseyNumber(jerseyNumber: number, teamId?: string): Promise<Player[]> {
    const whereClause: any = { jerseyNumber };
    if (teamId) {
      whereClause.teamId = teamId;
    }

    return this.repository.find({
      where: whereClause,
      relations: ['team']
    });
  }

  async findInjuredPlayers(teamId?: string): Promise<Player[]> {
    const whereClause: any = {
      injuryStatus: In(['questionable', 'doubtful', 'out', 'ir', 'pup'])
    };
    
    if (teamId) {
      whereClause.teamId = teamId;
    }

    return this.repository.find({
      where: whereClause,
      relations: ['team'],
      order: { injuryDate: 'DESC' }
    });
  }

  async findHealthyPlayers(teamId?: string): Promise<Player[]> {
    const whereClause: any = { injuryStatus: InjuryStatus.HEALTHY };
    if (teamId) {
      whereClause.teamId = teamId;
    }

    return this.repository.find({
      where: whereClause,
      relations: ['team'],
      order: { name: 'ASC' }
    });
  }

  async updateInjuryStatus(
    playerId: string, 
    injuryStatus: InjuryStatus, 
    injuryDescription?: string,
    expectedReturn?: Date
  ): Promise<Player | null> {
    const updateData: any = { 
      injuryStatus,
      injuryDate: injuryStatus !== InjuryStatus.HEALTHY ? new Date() : null
    };
    
    if (injuryDescription) {
      updateData.injuryDescription = injuryDescription;
    }
    
    if (expectedReturn) {
      updateData.expectedReturn = expectedReturn;
    }

    await this.repository.update(playerId, updateData);
    return this.findById(playerId);
  }

  async updateDepthChart(playerId: string, position: number, isStarter: boolean): Promise<Player | null> {
    await this.repository.update(playerId, { 
      depthChartPosition: position,
      isStarter 
    });
    return this.findById(playerId);
  }

  async findWithStatistics(playerId: string, season?: number): Promise<Player | null> {
    return this.repository.findOne({
      where: { id: playerId },
      relations: ['team', 'statistics'],
      order: {
        statistics: {
          season: 'DESC',
          week: 'DESC'
        }
      }
    });
  }

  async findByCollege(college: string): Promise<Player[]> {
    return this.repository.find({
      where: { college: Like(`%${college}%`) },
      relations: ['team'],
      order: { name: 'ASC' }
    });
  }

  async findRookies(season: number): Promise<Player[]> {
    return this.repository.find({
      where: { experience: 0 },
      relations: ['team', 'statistics'],
      order: { name: 'ASC' }
    });
  }

  async findVeterans(minExperience: number = 5): Promise<Player[]> {
    return this.repository
      .createQueryBuilder('player')
      .leftJoinAndSelect('player.team', 'team')
      .where('player.experience >= :minExperience', { minExperience })
      .orderBy('player.experience', 'DESC')
      .addOrderBy('player.name', 'ASC')
      .getMany();
  }

  async getTeamDepthChart(teamId: string, position?: Position): Promise<Player[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('player')
      .leftJoinAndSelect('player.team', 'team')
      .where('player.team_id = :teamId', { teamId });

    if (position) {
      queryBuilder.andWhere('player.position = :position', { position });
    }

    return queryBuilder
      .orderBy('player.position', 'ASC')
      .addOrderBy('player.depth_chart_position', 'ASC')
      .addOrderBy('player.is_starter', 'DESC')
      .getMany();
  }
}
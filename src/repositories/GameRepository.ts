import { DataSource, Between, In } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { Game, GameStatus } from '../entities/Game.entity';

export class GameRepository extends BaseRepository<Game> {
  constructor(dataSource: DataSource) {
    super(dataSource, Game);
  }

  async findByStatus(status: GameStatus): Promise<Game[]> {
    return this.repository.find({
      where: { status },
      relations: ['homeTeam', 'awayTeam']
    });
  }

  async findByTeam(teamId: string): Promise<Game[]> {
    return this.repository.find({
      where: [
        { homeTeamId: teamId },
        { awayTeamId: teamId }
      ],
      relations: ['homeTeam', 'awayTeam'],
      order: { scheduledTime: 'DESC' }
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Game[]> {
    return this.repository.find({
      where: {
        scheduledTime: Between(startDate, endDate)
      },
      relations: ['homeTeam', 'awayTeam'],
      order: { scheduledTime: 'ASC' }
    });
  }

  async findLiveGames(): Promise<Game[]> {
    return this.repository.find({
      where: { status: GameStatus.IN_PROGRESS },
      relations: ['homeTeam', 'awayTeam', 'gameStates', 'probabilities'],
      order: { scheduledTime: 'ASC' }
    });
  }

  async findUpcomingGames(limit: number = 10): Promise<Game[]> {
    return this.repository.find({
      where: { 
        status: GameStatus.SCHEDULED,
        scheduledTime: Between(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      },
      relations: ['homeTeam', 'awayTeam'],
      order: { scheduledTime: 'ASC' },
      take: limit
    });
  }

  async findByTeams(homeTeamId: string, awayTeamId: string): Promise<Game[]> {
    return this.repository.find({
      where: [
        { homeTeamId, awayTeamId },
        { homeTeamId: awayTeamId, awayTeamId: homeTeamId }
      ],
      relations: ['homeTeam', 'awayTeam'],
      order: { scheduledTime: 'DESC' }
    });
  }

  async findBySeason(season: number): Promise<Game[]> {
    const startDate = new Date(season, 8, 1); // September 1st
    const endDate = new Date(season + 1, 1, 31); // January 31st of next year
    
    return this.findByDateRange(startDate, endDate);
  }

  async updateScore(gameId: string, homeScore: number, awayScore: number): Promise<Game | null> {
    await this.repository.update(gameId, { homeScore, awayScore });
    return this.findById(gameId);
  }

  async updateStatus(gameId: string, status: GameStatus): Promise<Game | null> {
    await this.repository.update(gameId, { status });
    return this.findById(gameId);
  }

  async findWithProbabilities(gameId: string): Promise<Game | null> {
    return this.repository.findOne({
      where: { id: gameId },
      relations: ['homeTeam', 'awayTeam', 'probabilities']
    });
  }
}
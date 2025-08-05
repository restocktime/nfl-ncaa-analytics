import { DataSource, Between, MoreThan } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { GameProbabilities } from '../entities/GameProbabilities.entity';

export class GameProbabilitiesRepository extends BaseRepository<GameProbabilities> {
  constructor(dataSource: DataSource) {
    super(dataSource, GameProbabilities);
  }

  async findByGame(gameId: string, limit: number = 100): Promise<GameProbabilities[]> {
    return this.repository.find({
      where: { gameId },
      relations: ['game'],
      order: { timestamp: 'DESC' },
      take: limit
    });
  }

  async findLatestByGame(gameId: string): Promise<GameProbabilities | null> {
    return this.repository.findOne({
      where: { gameId },
      relations: ['game'],
      order: { timestamp: 'DESC' }
    });
  }

  async findByTimeRange(gameId: string, startTime: Date, endTime: Date): Promise<GameProbabilities[]> {
    return this.repository.find({
      where: {
        gameId,
        timestamp: Between(startTime, endTime)
      },
      relations: ['game'],
      order: { timestamp: 'ASC' }
    });
  }

  async findRecentProbabilities(gameId: string, minutes: number = 10): Promise<GameProbabilities[]> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    
    return this.repository.find({
      where: {
        gameId,
        timestamp: MoreThan(cutoffTime)
      },
      relations: ['game'],
      order: { timestamp: 'DESC' }
    });
  }

  async createProbabilities(probabilities: Partial<GameProbabilities>): Promise<GameProbabilities> {
    const newProbabilities = this.repository.create({
      ...probabilities,
      timestamp: probabilities.timestamp || new Date()
    });
    return this.repository.save(newProbabilities);
  }

  async findByModelVersion(modelVersion: string, limit: number = 100): Promise<GameProbabilities[]> {
    return this.repository.find({
      where: { modelVersion },
      relations: ['game'],
      order: { timestamp: 'DESC' },
      take: limit
    });
  }

  async getProbabilityHistory(gameId: string, limit: number = 50): Promise<GameProbabilities[]> {
    return this.repository.find({
      where: { gameId },
      select: [
        'id', 
        'timestamp', 
        'homeWinProbability', 
        'awayWinProbability',
        'spreadProbability',
        'spreadValue',
        'overProbability',
        'underProbability',
        'totalPoints'
      ],
      order: { timestamp: 'DESC' },
      take: limit
    });
  }

  async findHighConfidencePredictions(
    confidenceThreshold: number = 0.8, 
    limit: number = 20
  ): Promise<GameProbabilities[]> {
    return this.repository
      .createQueryBuilder('probabilities')
      .leftJoinAndSelect('probabilities.game', 'game')
      .where('probabilities.home_win_probability >= :threshold OR probabilities.away_win_probability >= :threshold', 
        { threshold: confidenceThreshold })
      .orderBy('probabilities.timestamp', 'DESC')
      .limit(limit)
      .getMany();
  }

  async findSpreadMovement(gameId: string): Promise<GameProbabilities[]> {
    return this.repository.find({
      where: { gameId },
      select: ['id', 'timestamp', 'spreadValue', 'spreadProbability'],
      order: { timestamp: 'ASC' }
    });
  }

  async findTotalMovement(gameId: string): Promise<GameProbabilities[]> {
    return this.repository.find({
      where: { gameId },
      select: ['id', 'timestamp', 'totalPoints', 'overProbability', 'underProbability'],
      order: { timestamp: 'ASC' }
    });
  }

  async bulkInsertProbabilities(probabilities: Partial<GameProbabilities>[]): Promise<GameProbabilities[]> {
    const entities = probabilities.map(prob => this.repository.create({
      ...prob,
      timestamp: prob.timestamp || new Date()
    }));
    
    return this.repository.save(entities);
  }

  async getAverageProbabilityByTimeRange(
    gameId: string, 
    startTime: Date, 
    endTime: Date
  ): Promise<{
    avgHomeWinProbability: number;
    avgAwayWinProbability: number;
    avgSpreadProbability: number;
    avgOverProbability: number;
    avgUnderProbability: number;
  } | null> {
    const result = await this.repository
      .createQueryBuilder('probabilities')
      .select([
        'AVG(probabilities.home_win_probability) as avgHomeWinProbability',
        'AVG(probabilities.away_win_probability) as avgAwayWinProbability',
        'AVG(probabilities.spread_probability) as avgSpreadProbability',
        'AVG(probabilities.over_probability) as avgOverProbability',
        'AVG(probabilities.under_probability) as avgUnderProbability'
      ])
      .where('probabilities.game_id = :gameId', { gameId })
      .andWhere('probabilities.timestamp BETWEEN :startTime AND :endTime', { startTime, endTime })
      .getRawOne();

    return result || null;
  }
}
import { DataSource, Between, MoreThan } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { GameState } from '../entities/GameState.entity';

export class GameStateRepository extends BaseRepository<GameState> {
  constructor(dataSource: DataSource) {
    super(dataSource, GameState);
  }

  async findByGame(gameId: string, limit: number = 100): Promise<GameState[]> {
    return this.repository.find({
      where: { gameId },
      relations: ['game', 'possessionTeam'],
      order: { timestamp: 'DESC' },
      take: limit
    });
  }

  async findLatestByGame(gameId: string): Promise<GameState | null> {
    return this.repository.findOne({
      where: { gameId },
      relations: ['game', 'possessionTeam'],
      order: { timestamp: 'DESC' }
    });
  }

  async findByTimeRange(gameId: string, startTime: Date, endTime: Date): Promise<GameState[]> {
    return this.repository.find({
      where: {
        gameId,
        timestamp: Between(startTime, endTime)
      },
      relations: ['game', 'possessionTeam'],
      order: { timestamp: 'ASC' }
    });
  }

  async findRecentStates(gameId: string, minutes: number = 10): Promise<GameState[]> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    
    return this.repository.find({
      where: {
        gameId,
        timestamp: MoreThan(cutoffTime)
      },
      relations: ['game', 'possessionTeam'],
      order: { timestamp: 'DESC' }
    });
  }

  async createGameState(gameState: Partial<GameState>): Promise<GameState> {
    const newState = this.repository.create({
      ...gameState,
      timestamp: gameState.timestamp || new Date()
    });
    return this.repository.save(newState);
  }

  async findByQuarter(gameId: string, quarter: number): Promise<GameState[]> {
    return this.repository.find({
      where: { gameId, quarter },
      relations: ['game', 'possessionTeam'],
      order: { timestamp: 'ASC' }
    });
  }

  async findRedZoneStates(gameId: string): Promise<GameState[]> {
    return this.repository.find({
      where: { gameId, redZone: true },
      relations: ['game', 'possessionTeam'],
      order: { timestamp: 'DESC' }
    });
  }

  async findGoalToGoStates(gameId: string): Promise<GameState[]> {
    return this.repository.find({
      where: { gameId, goalToGo: true },
      relations: ['game', 'possessionTeam'],
      order: { timestamp: 'DESC' }
    });
  }

  async getMomentumHistory(gameId: string, limit: number = 50): Promise<GameState[]> {
    return this.repository.find({
      where: { gameId },
      select: ['id', 'timestamp', 'momentumScore', 'homeScore', 'awayScore'],
      order: { timestamp: 'DESC' },
      take: limit
    });
  }

  async getScoreProgression(gameId: string): Promise<GameState[]> {
    return this.repository.find({
      where: { gameId },
      select: ['id', 'timestamp', 'homeScore', 'awayScore', 'quarter', 'timeRemaining'],
      order: { timestamp: 'ASC' }
    });
  }

  async bulkInsertStates(gameStates: Partial<GameState>[]): Promise<GameState[]> {
    const entities = gameStates.map(state => this.repository.create({
      ...state,
      timestamp: state.timestamp || new Date()
    }));
    
    return this.repository.save(entities);
  }
}
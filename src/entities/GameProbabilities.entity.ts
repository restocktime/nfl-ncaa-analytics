import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Game } from './Game.entity';

@Entity('game_probabilities')
@Index(['gameId', 'timestamp'])
@Index(['timestamp'])
export class GameProbabilities {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'game_id' })
  gameId: string;

  @ManyToOne(() => Game, game => game.probabilities)
  game: Game;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ name: 'home_win_probability', type: 'decimal', precision: 5, scale: 4 })
  homeWinProbability: number;

  @Column({ name: 'away_win_probability', type: 'decimal', precision: 5, scale: 4 })
  awayWinProbability: number;

  @Column({ name: 'spread_probability', type: 'decimal', precision: 5, scale: 4, nullable: true })
  spreadProbability: number;

  @Column({ name: 'spread_value', type: 'decimal', precision: 4, scale: 1, nullable: true })
  spreadValue: number;

  @Column({ name: 'over_probability', type: 'decimal', precision: 5, scale: 4, nullable: true })
  overProbability: number;

  @Column({ name: 'under_probability', type: 'decimal', precision: 5, scale: 4, nullable: true })
  underProbability: number;

  @Column({ name: 'total_points', type: 'decimal', precision: 4, scale: 1, nullable: true })
  totalPoints: number;

  @Column({ name: 'confidence_interval_lower', type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidenceIntervalLower: number;

  @Column({ name: 'confidence_interval_upper', type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidenceIntervalUpper: number;

  @Column({ name: 'model_version', nullable: true })
  modelVersion: string;

  @Column({ name: 'simulation_iterations', nullable: true })
  simulationIterations: number;

  @Column({ name: 'key_factors', type: 'jsonb', nullable: true })
  keyFactors: any[];

  @Column({ name: 'player_props', type: 'jsonb', nullable: true })
  playerProps: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
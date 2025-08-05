import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Player } from './Player.entity';

@Entity('player_statistics')
@Index(['playerId', 'season', 'week'])
@Index(['season'])
export class PlayerStatistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'player_id' })
  playerId: string;

  @ManyToOne(() => Player, player => player.statistics)
  player: Player;

  @Column()
  season: number;

  @Column({ nullable: true })
  week: number;

  @Column({ name: 'opponent_id', nullable: true })
  opponentId: string;

  @Column({ name: 'is_home', default: false })
  isHome: boolean;

  @Column({ name: 'games_played', default: 0 })
  gamesPlayed: number;

  @Column({ name: 'games_started', default: 0 })
  gamesStarted: number;

  // Passing Statistics
  @Column({ name: 'passing_attempts', default: 0 })
  passingAttempts: number;

  @Column({ name: 'passing_completions', default: 0 })
  passingCompletions: number;

  @Column({ name: 'passing_yards', default: 0 })
  passingYards: number;

  @Column({ name: 'passing_touchdowns', default: 0 })
  passingTouchdowns: number;

  @Column({ name: 'interceptions_thrown', default: 0 })
  interceptionsThrown: number;

  @Column({ name: 'sacks_taken', default: 0 })
  sacksTaken: number;

  @Column({ name: 'qb_rating', type: 'decimal', precision: 5, scale: 2, nullable: true })
  qbRating: number;

  // Rushing Statistics
  @Column({ name: 'rushing_attempts', default: 0 })
  rushingAttempts: number;

  @Column({ name: 'rushing_yards', default: 0 })
  rushingYards: number;

  @Column({ name: 'rushing_touchdowns', default: 0 })
  rushingTouchdowns: number;

  @Column({ name: 'fumbles', default: 0 })
  fumbles: number;

  // Receiving Statistics
  @Column({ name: 'receptions', default: 0 })
  receptions: number;

  @Column({ name: 'receiving_yards', default: 0 })
  receivingYards: number;

  @Column({ name: 'receiving_touchdowns', default: 0 })
  receivingTouchdowns: number;

  @Column({ name: 'targets', default: 0 })
  targets: number;

  @Column({ name: 'drops', default: 0 })
  drops: number;

  // Defensive Statistics
  @Column({ name: 'tackles', default: 0 })
  tackles: number;

  @Column({ name: 'assists', default: 0 })
  assists: number;

  @Column({ name: 'sacks', default: 0 })
  sacks: number;

  @Column({ name: 'tackles_for_loss', default: 0 })
  tacklesForLoss: number;

  @Column({ name: 'interceptions', default: 0 })
  interceptions: number;

  @Column({ name: 'pass_deflections', default: 0 })
  passDeflections: number;

  @Column({ name: 'forced_fumbles', default: 0 })
  forcedFumbles: number;

  @Column({ name: 'fumble_recoveries', default: 0 })
  fumbleRecoveries: number;

  // Special Teams Statistics
  @Column({ name: 'field_goals_made', default: 0 })
  fieldGoalsMade: number;

  @Column({ name: 'field_goals_attempted', default: 0 })
  fieldGoalsAttempted: number;

  @Column({ name: 'extra_points_made', default: 0 })
  extraPointsMade: number;

  @Column({ name: 'extra_points_attempted', default: 0 })
  extraPointsAttempted: number;

  @Column({ name: 'punts', default: 0 })
  punts: number;

  @Column({ name: 'punt_yards', default: 0 })
  puntYards: number;

  @Column({ name: 'punt_returns', default: 0 })
  puntReturns: number;

  @Column({ name: 'punt_return_yards', default: 0 })
  puntReturnYards: number;

  @Column({ name: 'kickoff_returns', default: 0 })
  kickoffReturns: number;

  @Column({ name: 'kickoff_return_yards', default: 0 })
  kickoffReturnYards: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Team } from './Team.entity';
import { GameState } from './GameState.entity';
import { GameProbabilities } from './GameProbabilities.entity';

export enum GameStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  POSTPONED = 'postponed',
  CANCELLED = 'cancelled'
}

@Entity('games')
@Index(['scheduledTime'])
@Index(['status'])
@Index(['homeTeamId', 'awayTeamId'])
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'home_team_id' })
  homeTeamId!: string;

  @Column({ name: 'away_team_id' })
  awayTeamId!: string;

  @ManyToOne(() => Team, { eager: true })
  homeTeam!: Team;

  @ManyToOne(() => Team, { eager: true })
  awayTeam!: Team;

  @Column({ name: 'scheduled_time', type: 'timestamptz' })
  scheduledTime!: Date;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.SCHEDULED
  })
  status!: GameStatus;

  @Column({ nullable: true })
  venue?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ name: 'home_score', default: 0 })
  homeScore!: number;

  @Column({ name: 'away_score', default: 0 })
  awayScore!: number;

  @Column({ nullable: true })
  quarter?: number;

  @Column({ name: 'time_remaining', nullable: true })
  timeRemaining?: string;

  @Column({ name: 'weather_conditions', type: 'jsonb', nullable: true })
  weatherConditions?: any;

  @Column({ name: 'betting_lines', type: 'jsonb', nullable: true })
  bettingLines?: any;

  @Column({ type: 'jsonb', nullable: true })
  officials?: any[];

  @OneToMany(() => GameState, gameState => gameState.game)
  gameStates!: GameState[];

  @OneToMany(() => GameProbabilities, probabilities => probabilities.game)
  probabilities!: GameProbabilities[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Game } from './Game.entity';
import { Team } from './Team.entity';

@Entity('game_states')
@Index(['gameId', 'timestamp'])
@Index(['timestamp'])
export class GameState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'game_id' })
  gameId: string;

  @ManyToOne(() => Game, game => game.gameStates)
  game: Game;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ name: 'home_score' })
  homeScore: number;

  @Column({ name: 'away_score' })
  awayScore: number;

  @Column({ nullable: true })
  quarter: number;

  @Column({ name: 'time_remaining', nullable: true })
  timeRemaining: string;

  @Column({ name: 'possession_team_id', nullable: true })
  possessionTeamId: string;

  @ManyToOne(() => Team, { nullable: true })
  possessionTeam: Team;

  @Column({ name: 'field_position', nullable: true })
  fieldPosition: number;

  @Column({ nullable: true })
  down: number;

  @Column({ name: 'yards_to_go', nullable: true })
  yardsToGo: number;

  @Column({ name: 'red_zone', default: false })
  redZone: boolean;

  @Column({ name: 'goal_to_go', default: false })
  goalToGo: boolean;

  @Column({ name: 'momentum_score', type: 'decimal', precision: 5, scale: 3, nullable: true })
  momentumScore: number;

  @Column({ name: 'home_timeouts', default: 3 })
  homeTimeouts: number;

  @Column({ name: 'away_timeouts', default: 3 })
  awayTimeouts: number;

  @Column({ name: 'play_clock', nullable: true })
  playClock: number;

  @Column({ name: 'game_clock', nullable: true })
  gameClock: string;

  @Column({ name: 'weather_conditions', type: 'jsonb', nullable: true })
  weatherConditions: any;

  @Column({ name: 'last_play', type: 'jsonb', nullable: true })
  lastPlay: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
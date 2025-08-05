import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Team } from './Team.entity';

@Entity('team_statistics')
@Index(['teamId', 'season', 'week'])
@Index(['season'])
export class TeamStatistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'team_id' })
  teamId: string;

  @ManyToOne(() => Team, team => team.statistics)
  team: Team;

  @Column()
  season: number;

  @Column({ nullable: true })
  week: number;

  @Column({ name: 'opponent_id', nullable: true })
  opponentId: string;

  @Column({ name: 'is_home', default: false })
  isHome: boolean;

  // Offensive Statistics
  @Column({ name: 'points_scored', default: 0 })
  pointsScored: number;

  @Column({ name: 'total_yards', default: 0 })
  totalYards: number;

  @Column({ name: 'passing_yards', default: 0 })
  passingYards: number;

  @Column({ name: 'rushing_yards', default: 0 })
  rushingYards: number;

  @Column({ name: 'first_downs', default: 0 })
  firstDowns: number;

  @Column({ name: 'third_down_conversions', default: 0 })
  thirdDownConversions: number;

  @Column({ name: 'third_down_attempts', default: 0 })
  thirdDownAttempts: number;

  @Column({ name: 'red_zone_conversions', default: 0 })
  redZoneConversions: number;

  @Column({ name: 'red_zone_attempts', default: 0 })
  redZoneAttempts: number;

  @Column({ name: 'turnovers', default: 0 })
  turnovers: number;

  @Column({ name: 'penalties', default: 0 })
  penalties: number;

  @Column({ name: 'penalty_yards', default: 0 })
  penaltyYards: number;

  @Column({ name: 'time_of_possession', nullable: true })
  timeOfPossession: string;

  // Defensive Statistics
  @Column({ name: 'points_allowed', default: 0 })
  pointsAllowed: number;

  @Column({ name: 'yards_allowed', default: 0 })
  yardsAllowed: number;

  @Column({ name: 'passing_yards_allowed', default: 0 })
  passingYardsAllowed: number;

  @Column({ name: 'rushing_yards_allowed', default: 0 })
  rushingYardsAllowed: number;

  @Column({ name: 'sacks', default: 0 })
  sacks: number;

  @Column({ name: 'interceptions', default: 0 })
  interceptions: number;

  @Column({ name: 'fumbles_recovered', default: 0 })
  fumblesRecovered: number;

  @Column({ name: 'tackles_for_loss', default: 0 })
  tacklesForLoss: number;

  // Advanced Metrics
  @Column({ name: 'offensive_efficiency', type: 'decimal', precision: 5, scale: 3, nullable: true })
  offensiveEfficiency: number;

  @Column({ name: 'defensive_efficiency', type: 'decimal', precision: 5, scale: 3, nullable: true })
  defensiveEfficiency: number;

  @Column({ name: 'expected_points_added', type: 'decimal', precision: 6, scale: 3, nullable: true })
  expectedPointsAdded: number;

  @Column({ name: 'success_rate', type: 'decimal', precision: 5, scale: 3, nullable: true })
  successRate: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
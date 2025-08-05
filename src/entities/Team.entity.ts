import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Player } from './Player.entity';
import { TeamStatistics } from './TeamStatistics.entity';

@Entity('teams')
@Index(['name'])
@Index(['conference'])
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  abbreviation: string;

  @Column()
  conference: string;

  @Column({ nullable: true })
  division: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ name: 'primary_color', nullable: true })
  primaryColor: string;

  @Column({ name: 'secondary_color', nullable: true })
  secondaryColor: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'head_coach', nullable: true })
  headCoach: string;

  @Column({ name: 'offensive_coordinator', nullable: true })
  offensiveCoordinator: string;

  @Column({ name: 'defensive_coordinator', nullable: true })
  defensiveCoordinator: string;

  @Column({ name: 'coaching_staff', type: 'jsonb', nullable: true })
  coachingStaff: any;

  @Column({ name: 'home_venue', nullable: true })
  homeVenue: string;

  @Column({ name: 'venue_capacity', nullable: true })
  venueCapacity: number;

  @Column({ name: 'founded_year', nullable: true })
  foundedYear: number;

  @OneToMany(() => Player, player => player.team)
  players: Player[];

  @OneToMany(() => TeamStatistics, stats => stats.team)
  statistics: TeamStatistics[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
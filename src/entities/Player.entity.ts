import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Team } from './Team.entity';
import { PlayerStatistics } from './PlayerStatistics.entity';

export enum Position {
  QB = 'QB',
  RB = 'RB',
  FB = 'FB',
  WR = 'WR',
  TE = 'TE',
  OL = 'OL',
  C = 'C',
  G = 'G',
  T = 'T',
  DL = 'DL',
  DE = 'DE',
  DT = 'DT',
  NT = 'NT',
  LB = 'LB',
  ILB = 'ILB',
  OLB = 'OLB',
  DB = 'DB',
  CB = 'CB',
  S = 'S',
  FS = 'FS',
  SS = 'SS',
  K = 'K',
  P = 'P',
  LS = 'LS'
}

export enum InjuryStatus {
  HEALTHY = 'healthy',
  QUESTIONABLE = 'questionable',
  DOUBTFUL = 'doubtful',
  OUT = 'out',
  IR = 'ir',
  PUP = 'pup'
}

@Entity('players')
@Index(['teamId'])
@Index(['position'])
@Index(['injuryStatus'])
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'jersey_number', nullable: true })
  jerseyNumber: number;

  @Column({
    type: 'enum',
    enum: Position
  })
  position: Position;

  @Column({ nullable: true })
  height: string;

  @Column({ nullable: true })
  weight: number;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  experience: number;

  @Column({ nullable: true })
  college: string;

  @Column({ name: 'team_id' })
  teamId: string;

  @ManyToOne(() => Team, team => team.players)
  team: Team;

  @Column({
    name: 'injury_status',
    type: 'enum',
    enum: InjuryStatus,
    default: InjuryStatus.HEALTHY
  })
  injuryStatus: InjuryStatus;

  @Column({ name: 'injury_description', nullable: true })
  injuryDescription: string;

  @Column({ name: 'injury_date', type: 'timestamptz', nullable: true })
  injuryDate: Date;

  @Column({ name: 'expected_return', type: 'timestamptz', nullable: true })
  expectedReturn: Date;

  @Column({ name: 'depth_chart_position', nullable: true })
  depthChartPosition: number;

  @Column({ name: 'is_starter', default: false })
  isStarter: boolean;

  @Column({ name: 'contract_details', type: 'jsonb', nullable: true })
  contractDetails: any;

  @OneToMany(() => PlayerStatistics, stats => stats.player)
  statistics: PlayerStatistics[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
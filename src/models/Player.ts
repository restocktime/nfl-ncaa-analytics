import { 
  IsString, 
  IsNumber, 
  IsEnum, 
  IsOptional, 
  ValidateNested, 
  IsArray, 
  Min, 
  Max,
  IsNotEmpty,
  Length
} from 'class-validator';
import { Type } from 'class-transformer';
import { Position, InjuryStatus, PlayerStatistics, PlayerProp, Contract, InjuryReport } from '../types';

export class Player {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string;

  @IsNumber()
  @Min(0)
  @Max(99)
  jerseyNumber!: number;

  @IsEnum(Position)
  position!: Position;

  @IsNumber()
  @Min(60)
  @Max(84)
  height!: number; // inches

  @IsNumber()
  @Min(150)
  @Max(400)
  weight!: number; // pounds

  @IsNumber()
  @Min(18)
  @Max(50)
  age!: number;

  @IsNumber()
  @Min(0)
  @Max(25)
  experience!: number; // years in league

  @IsOptional()
  @IsString()
  college?: string;

  @IsEnum(InjuryStatus)
  injuryStatus!: InjuryStatus;

  @ValidateNested()
  @Type(() => Object)
  statistics!: PlayerStatistics;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  props!: PlayerProp[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  contract?: Contract;

  constructor(data: Partial<Player> = {}) {
    Object.assign(this, data);
  }

  /**
   * Check if player is active (not injured)
   */
  isActive(): boolean {
    return this.injuryStatus === InjuryStatus.HEALTHY || 
           this.injuryStatus === InjuryStatus.QUESTIONABLE;
  }

  /**
   * Check if player is a rookie
   */
  isRookie(): boolean {
    return this.experience === 0;
  }

  /**
   * Check if player is a veteran (5+ years)
   */
  isVeteran(): boolean {
    return this.experience >= 5;
  }

  /**
   * Get player's BMI
   */
  getBMI(): number {
    const heightInMeters = this.height * 0.0254;
    const weightInKg = this.weight * 0.453592;
    return weightInKg / (heightInMeters * heightInMeters);
  }

  /**
   * Check if player is offensive
   */
  isOffensivePlayer(): boolean {
    const offensivePositions = [
      Position.QB, Position.RB, Position.FB, Position.WR, Position.TE,
      Position.LT, Position.LG, Position.C, Position.RG, Position.RT
    ];
    return offensivePositions.includes(this.position);
  }

  /**
   * Check if player is defensive
   */
  isDefensivePlayer(): boolean {
    const defensivePositions = [
      Position.DE, Position.DT, Position.NT, Position.OLB, Position.MLB,
      Position.ILB, Position.CB, Position.FS, Position.SS
    ];
    return defensivePositions.includes(this.position);
  }

  /**
   * Check if player is special teams
   */
  isSpecialTeamsPlayer(): boolean {
    const specialTeamsPositions = [Position.K, Position.P, Position.LS];
    return specialTeamsPositions.includes(this.position);
  }

  /**
   * Get available props for this player
   */
  getAvailableProps(): PlayerProp[] {
    return this.props.filter(prop => prop.available);
  }
}
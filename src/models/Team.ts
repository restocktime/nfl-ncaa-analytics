import { 
  IsString, 
  IsArray, 
  ValidateNested, 
  IsNotEmpty, 
  Length,
  IsHexColor,
  IsUrl
} from 'class-validator';
import { Type } from 'class-transformer';
import { Player } from './Player';
import { CoachingStaff, TeamStatistics } from '../types';

export class Team {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 5)
  abbreviation!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  city!: string;

  @IsString()
  @IsNotEmpty()
  conference!: string;

  @IsString()
  @IsNotEmpty()
  division?: string;

  @IsUrl()
  logo!: string;

  @IsHexColor()
  primaryColor!: string;

  @IsHexColor()
  secondaryColor!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Player)
  roster!: Player[];

  @ValidateNested()
  @Type(() => Object)
  coaching!: CoachingStaff;

  @ValidateNested()
  @Type(() => Object)
  statistics!: TeamStatistics;

  @IsString()
  @IsNotEmpty()
  homeVenue!: string;

  constructor(data: Partial<Team> = {}) {
    Object.assign(this, data);
  }

  /**
   * Get active players (not injured)
   */
  getActivePlayers(): Player[] {
    return this.roster.filter(player => player.isActive());
  }

  /**
   * Get players by position
   */
  getPlayersByPosition(position: string): Player[] {
    return this.roster.filter(player => player.position === position);
  }

  /**
   * Get team's win percentage
   */
  getWinPercentage(): number {
    const totalGames = this.statistics.wins + this.statistics.losses + (this.statistics.ties || 0);
    if (totalGames === 0) return 0;
    return this.statistics.wins / totalGames;
  }

  /**
   * Check if team is in playoffs contention (simplified logic)
   */
  isPlayoffContender(): boolean {
    return this.getWinPercentage() >= 0.5;
  }

  /**
   * Get roster size
   */
  getRosterSize(): number {
    return this.roster.length;
  }
}
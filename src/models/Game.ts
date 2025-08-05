import { 
  IsString, 
  IsDate, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  ValidateNested, 
  IsArray, 
  Min, 
  Max,
  IsNotEmpty 
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Team } from './Team';
import { GameStatus, GameType, Venue, WeatherCondition, Official, BroadcastInfo } from '../types';

export class Game {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ValidateNested()
  @Type(() => Team)
  homeTeam!: Team;

  @ValidateNested()
  @Type(() => Team)
  awayTeam!: Team;

  @ValidateNested()
  @Type(() => Object)
  venue!: Venue;

  @IsDate()
  @Type(() => Date)
  scheduledTime!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  actualStartTime?: Date;

  @IsEnum(GameStatus)
  status!: GameStatus;

  @IsNumber()
  @Min(1900)
  @Max(2100)
  season!: number;

  @IsNumber()
  @Min(1)
  @Max(22)
  week!: number;

  @IsEnum(GameType)
  gameType!: GameType;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  weather?: WeatherCondition;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  officials!: Official[];

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  broadcast?: BroadcastInfo;

  @IsOptional()
  @IsNumber()
  @Min(0)
  attendance?: number;

  constructor(data: Partial<Game> = {}) {
    Object.assign(this, data);
  }

  /**
   * Check if the game is currently in progress
   */
  isInProgress(): boolean {
    return this.status === GameStatus.IN_PROGRESS;
  }

  /**
   * Check if the game is completed
   */
  isCompleted(): boolean {
    return this.status === GameStatus.FINAL;
  }

  /**
   * Get the game duration in minutes (if completed)
   */
  getDuration(): number | null {
    if (!this.actualStartTime || !this.isCompleted()) {
      return null;
    }
    // Assuming game end time would be tracked separately
    // For now, return typical game duration
    return 180; // 3 hours typical
  }

  /**
   * Check if game is a playoff game
   */
  isPlayoffGame(): boolean {
    return this.gameType === GameType.PLAYOFF || this.gameType === GameType.CHAMPIONSHIP;
  }
}
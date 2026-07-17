import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ALLOWED_DURATION_MINUTES } from '../../interview.constants';

export class CreateConversationDto {
  @IsString()
  @MinLength(1)
  formatId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  track!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  focusAreas?: string[];

  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty!: 'EASY' | 'MEDIUM' | 'HARD';

  @IsIn([...ALLOWED_DURATION_MINUTES])
  durationMinutes!: number;

  @IsString()
  @MinLength(2)
  @MaxLength(32)
  language!: string;
}

import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChoiceDto } from './choice.dto';

export class UpdateQuestionDto {
  @IsEnum(['single_choice', 'multiple_choice', 'text_input'])
  @IsOptional()
  questionType?: 'single_choice' | 'multiple_choice' | 'text_input';

  @IsString()
  @IsOptional()
  question?: string;

  @IsString()
  @IsOptional()
  answer?: string;

  @IsString()
  @IsOptional()
  quiz?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  matchKeywords?: string[];

  @IsEnum(['easy', 'medium', 'hard'])
  @IsOptional()
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsString()
  @IsOptional()
  topic?: string;

  @IsBoolean()
  @IsOptional()
  practical?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChoiceDto)
  @IsOptional()
  choices?: ChoiceDto[];
}

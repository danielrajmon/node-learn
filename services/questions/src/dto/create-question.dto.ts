import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChoiceDto } from './choice.dto';

export class CreateQuestionDto {
  @IsEnum(['single_choice', 'multiple_choice', 'text_input'])
  questionType: 'single_choice' | 'multiple_choice' | 'text_input';

  @IsString()
  question: string;

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
  difficulty: 'easy' | 'medium' | 'hard';

  @IsString()
  topic: string;

  @IsBoolean()
  practical: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChoiceDto)
  @IsOptional()
  choices?: ChoiceDto[];
}

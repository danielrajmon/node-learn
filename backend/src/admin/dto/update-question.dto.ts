import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateQuestionDto {
  @ApiProperty({
    example: 'text_input',
    enum: ['single_choice', 'multiple_choice', 'text_input'],
    description: 'Type of question',
    required: false,
  })
  @IsEnum(['single_choice', 'multiple_choice', 'text_input'])
  @IsOptional()
  questionType?: 'single_choice' | 'multiple_choice' | 'text_input';

  @ApiProperty({
    example: 'What are the three pillars of OOP?',
    description: 'The interview question text',
    required: false,
  })
  @IsString()
  @IsOptional()
  questionText?: string;

  @ApiProperty({
    example: 'The three pillars of OOP are Encapsulation, Inheritance, and Polymorphism...',
    description: 'Long-form answer',
    required: false,
  })
  @IsString()
  @IsOptional()
  longAnswer?: string;

  @ApiProperty({
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
    description: 'Difficulty level of the question',
    required: false,
  })
  @IsEnum(['easy', 'medium', 'hard'])
  @IsOptional()
  difficulty?: 'easy' | 'medium' | 'hard';

  @ApiProperty({
    example: 'OOP',
    description: 'Topic covered by the question',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  topic?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the question is active',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

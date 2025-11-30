import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, MaxLength } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({
    example: 'text_input',
    enum: ['single_choice', 'multiple_choice', 'text_input'],
    description: 'Type of question',
  })
  @IsEnum(['single_choice', 'multiple_choice', 'text_input'])
  questionType: 'single_choice' | 'multiple_choice' | 'text_input';

  @ApiProperty({
    example: 'What are the three pillars of OOP?',
    description: 'The interview question text',
  })
  @IsString()
  questionText: string;

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
  })
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty: 'easy' | 'medium' | 'hard';

  @ApiProperty({
    example: 'OOP',
    description: 'Topic covered by the question',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  topic: string;

  @ApiProperty({
    example: true,
    description: 'Whether the question is active',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

import { ApiProperty } from '@nestjs/swagger';

export class QuestionDto {
  @ApiProperty({ example: 1, description: 'Unique identifier of the question' })
  id: number;

  @ApiProperty({
    example: 'What are the three pillars of OOP?',
    description: 'The interview question text',
  })
  questionText: string;

  @ApiProperty({
    example: 'The three pillars of OOP are Encapsulation, Inheritance, and Polymorphism...',
    description: 'Long-form answer for text input questions',
    required: false,
  })
  longAnswer?: string | null;

  @ApiProperty({
    example: ['encapsulation', 'inheritance', 'polymorphism'],
    description: 'Keywords that must match in text input answers',
    type: [String],
    required: false,
  })
  matchKeywords?: string[] | null;

  @ApiProperty({
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
    description: 'Difficulty level of the question',
  })
  difficulty: 'easy' | 'medium' | 'hard';

  @ApiProperty({
    example: 'OOP',
    description: 'Topic covered by the question',
  })
  topic: string;

  @ApiProperty({
    example: true,
    description: 'Whether the question is active',
  })
  isActive: boolean;
}

export class QuestionWithoutAnswerDto {
  @ApiProperty({ example: 1, description: 'Unique identifier of the question' })
  id: number;

  @ApiProperty({
    example: 'What are the three pillars of OOP?',
    description: 'The interview question text',
  })
  questionText: string;

  @ApiProperty({
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
    description: 'Difficulty level of the question',
  })
  difficulty: 'easy' | 'medium' | 'hard';

  @ApiProperty({
    example: 'OOP',
    description: 'Topic covered by the question',
  })
  topic: string;

  @ApiProperty({
    example: true,
    description: 'Whether the question is active',
  })
  isActive: boolean;
}

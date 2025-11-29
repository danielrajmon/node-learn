import { ApiProperty } from '@nestjs/swagger';

export class QuestionDto {
  @ApiProperty({ example: 1, description: 'Unique identifier of the question' })
  id: number;

  @ApiProperty({
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
    description: 'Difficulty level of the question',
  })
  difficulty: 'easy' | 'medium' | 'hard';

  @ApiProperty({
    example: 'What is a Clean Architecture?',
    description: 'The interview question text',
  })
  question: string;

  @ApiProperty({
    example: 'Clean Architecture is a way of structuring your code...',
    description: 'The answer to the question',
  })
  answer: string;

  @ApiProperty({
    example: ['Architecture', 'Design Patterns'],
    description: 'Topics covered by the question',
    type: [String],
  })
  topics: string[];
}

export class QuestionWithoutAnswerDto {
  @ApiProperty({ example: 1, description: 'Unique identifier of the question' })
  id: number;

  @ApiProperty({
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
    description: 'Difficulty level of the question',
  })
  difficulty: 'easy' | 'medium' | 'hard';

  @ApiProperty({
    example: 'What is a Clean Architecture?',
    description: 'The interview question text',
  })
  question: string;

  @ApiProperty({
    example: ['Architecture', 'Design Patterns'],
    description: 'Topics covered by the question',
    type: [String],
  })
  topics: string[];
}

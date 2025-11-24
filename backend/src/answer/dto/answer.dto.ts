import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({
    example: 'Clean Architecture is a way of structuring your code...',
    description: 'User-provided answer',
  })
  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class AnswerResultDto {
  @ApiProperty({
    example: true,
    description: 'Whether the answer is correct',
  })
  isCorrect: boolean;

  @ApiProperty({
    example: 'Your answer is correct!',
    description: 'Feedback message',
  })
  message: string;

  @ApiProperty({
    example: 1,
    description: 'Question ID',
  })
  questionId: number;

  @ApiProperty({
    example: 'Clean Architecture is a way of structuring your code...',
    description: 'The correct answer',
  })
  correctAnswer: string;
}

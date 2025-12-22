import { Controller, Get, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuizService, QuizMode } from './quiz.service';

@Controller('quiz')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private dataSource: DataSource,
  ) {}

  @Get('modes')
  async getQuizModes(): Promise<QuizMode[]> {
    const result = await this.dataSource.query(
      'SELECT id, name, description, filters FROM quiz_modes ORDER BY id'
    );
    return result;
  }
}

import { Controller, Get, Logger, Param } from '@nestjs/common';
import { QuizService } from './quiz.service';

@Controller('stats')
export class StatsController {
  private logger = new Logger('StatsController');

  constructor(private readonly quizService: QuizService) {}

  /**
   * Get user statistics
   * GET /stats/user/:userId
   */
  @Get('user/:userId')
  async getUserStats(@Param('userId') userId: string) {
    this.logger.debug(`Fetching stats for user ${userId}`);
    return this.quizService.getUserStats(+userId);
  }

  /**
   * Get user wrong questions
   * GET /stats/user/:userId/wrong-questions
   */
  @Get('user/:userId/wrong-questions')
  async getUserWrongQuestions(@Param('userId') userId: string) {
    this.logger.debug(`Fetching wrong questions for user ${userId}`);
    return this.quizService.getUserWrongQuestions(+userId);
  }
}

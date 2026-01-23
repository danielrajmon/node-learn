import { Controller, Get, Post, Logger, Param, Body } from '@nestjs/common';
import { QuizService } from './quiz.service';

export interface RecordAnswerDto {
  userId: string;
  questionId: number;
  selectedChoiceId: number;
  quizModeId: number;
  isCorrect: boolean;
}

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

  /**
   * Record answer and get achievements
   * POST /stats/record
   */
  @Post('record')
  async recordAnswer(@Body() dto: RecordAnswerDto) {
    this.logger.debug(`Recording answer for user ${dto.userId}, question ${dto.questionId}`);
    const result = await this.quizService.recordAnswer(dto);
    
    return {
      success: true,
      awardedAchievements: result.awardedAchievements || [],
      leaderboardUpdated: result.leaderboardUpdated || false,
    };
  }
}

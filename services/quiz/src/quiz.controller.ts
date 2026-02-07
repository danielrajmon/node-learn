import { Controller, Post, Body, Get, Logger, Param } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { RecordAnswerDto } from './dto/record-answer.dto';
import { RecordAnswerResultDto } from './dto/record-answer-result.dto';

@Controller('quiz')
export class QuizController {
  private logger = new Logger('QuizController');

  constructor(private readonly quizService: QuizService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'quiz', timestamp: new Date().toISOString() };
  }

  /**
   * Get quiz modes
   * GET /modes
   */
  @Get('modes')
  async getQuizModes() {
    this.logger.debug('Fetching quiz modes');
    return this.quizService.getQuizModes();
  }

  /**
   * Record answer submission
   * POST /answer
   */
  @Post('answer')
  async recordAnswer(@Body() dto: RecordAnswerDto): Promise<RecordAnswerResultDto> {
    this.logger.debug(`Recording answer: user=${dto.userId}, question=${dto.questionId}, correct=${dto.isCorrect}`);
    
    const result = await this.quizService.recordAnswer(dto);
    
    return {
      success: true,
      awardedAchievements: result.awardedAchievements || [],
      leaderboardUpdated: result.leaderboardUpdated || false,
    };
  }

  /**
   * Record stats (alias for backward compatibility)
   * POST /stats/record
   */
  @Post('stats/record')
  async recordStats(@Body() dto: RecordAnswerDto): Promise<RecordAnswerResultDto> {
    return this.recordAnswer(dto);
  }
}

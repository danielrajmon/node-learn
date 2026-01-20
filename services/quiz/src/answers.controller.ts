import { Controller, Get, Logger, Param } from '@nestjs/common';
import { QuizService } from './quiz.service';

/**
 * Answers Controller
 * Handles GET /answers/:questionId endpoint (from monolith's Answer module)
 * Root-level controller to match frontend API expectations
 */
@Controller('answers')
export class AnswersController {
  private logger = new Logger('AnswersController');

  constructor(private readonly quizService: QuizService) {}

  /**
   * Get correct answer for a question
   * GET /answers/:questionId
   */
  @Get(':questionId')
  async getAnswer(@Param('questionId') questionId: string) {
    this.logger.debug(`Fetching answer for question ${questionId}`);
    return this.quizService.getAnswer(+questionId);
  }
}

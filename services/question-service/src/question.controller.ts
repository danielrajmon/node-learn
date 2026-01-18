import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import type { QuestionWithoutAnswer, QuestionFilters } from './interfaces/question.interface';

@Controller('questions')
export class QuestionController {
  private readonly logger = new Logger('QuestionController');

  constructor(private readonly questionService: QuestionService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('difficulty') difficulty?: 'easy' | 'medium' | 'hard',
    @Query('topic') topicParam?: string,
    @Query('questionType') questionType?: 'single_choice' | 'multiple_choice' | 'text_input',
    @Query('practical') practicalParam?: string,
  ): Promise<QuestionWithoutAnswer[]> {
    const topic = topicParam ? topicParam.split(',').map((t) => t.trim()) : undefined;
    const practical = practicalParam !== undefined ? practicalParam === 'true' : undefined;
    const filters: QuestionFilters = { search, difficulty, topic, questionType, practical };
    this.logger.debug(`[findAll] Fetching questions with filters: ${JSON.stringify(filters)}`);
    return await this.questionService.findAll(filters);
  }

  @Get('random')
  async findRandom(): Promise<QuestionWithoutAnswer> {
    this.logger.debug('[findRandom] Fetching random question');
    const question = await this.questionService.findRandom();
    if (!question) {
      throw new NotFoundException('No active questions found in database.');
    }
    return question;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<QuestionWithoutAnswer> {
    this.logger.debug(`[findOne] Fetching question with ID: ${id}`);
    const question = await this.questionService.findOneWithoutAnswer(+id);
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }
}

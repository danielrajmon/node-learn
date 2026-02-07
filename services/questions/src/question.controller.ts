import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  Logger,
  Post,
  Put,
  Delete,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import type { QuestionWithoutAnswer, QuestionFilters } from './interfaces/question.interface';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller('questions')
export class QuestionController {
  private readonly logger = new Logger('QuestionController');

  constructor(private readonly questionService: QuestionService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'questions', timestamp: new Date().toISOString() };
  }

  @Get('admin')
  async findAllAdmin(
    @Query('search') search?: string,
    @Query('difficulty') difficulty?: 'easy' | 'medium' | 'hard',
    @Query('topic') topicParam?: string,
    @Query('questionType') questionType?: 'single_choice' | 'multiple_choice' | 'text_input',
    @Query('practical') practicalParam?: string,
    @Query('includeInactive') includeInactiveParam?: string,
  ) {
    const topic = topicParam ? topicParam.split(',').map((t) => t.trim()) : undefined;
    const practical = practicalParam !== undefined ? practicalParam === 'true' : undefined;
    const includeInactive = includeInactiveParam !== undefined ? includeInactiveParam === 'true' : true;
    const filters: QuestionFilters = { search, difficulty, topic, questionType, practical };
    this.logger.debug(`[findAllAdmin] Fetching questions with filters: ${JSON.stringify(filters)}`);
    return await this.questionService.findAllWithAnswers(filters, includeInactive);
  }

  @Get('admin/export')
  async exportQuestions() {
    this.logger.debug('[exportQuestions] Exporting questions');
    return this.questionService.exportQuestions();
  }

  @Get('admin/:id')
  async getAdminQuestion(@Param('id', ParseIntPipe) id: number) {
    this.logger.debug(`[getAdminQuestion] Fetching question ${id}`);
    const question = await this.questionService.findOne(id);
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  @Post('admin')
  async createQuestion(@Body() createQuestionDto: CreateQuestionDto) {
    this.logger.debug('[createQuestion] Creating new question');
    return await this.questionService.createQuestion(createQuestionDto);
  }

  @Put('admin/:id')
  async updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    this.logger.debug(`[updateQuestion] Updating question ${id}`);
    return await this.questionService.updateQuestion(id, updateQuestionDto);
  }

  @Delete('admin/:id')
  async deleteQuestion(@Param('id', ParseIntPipe) id: number) {
    this.logger.debug(`[deleteQuestion] Deleting question ${id}`);
    await this.questionService.deleteQuestion(id);
    return { success: true };
  }

  @Post('admin/import')
  async importQuestions(@Body() body: { questions: CreateQuestionDto[] }) {
    this.logger.debug(`[importQuestions] Importing ${body.questions.length} questions`);
    return this.questionService.importQuestions(body.questions);
  }

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

  @Get(':id/answer')
  async getAnswer(@Param('id', ParseIntPipe) id: number) {
    this.logger.debug(`[getAnswer] Fetching answer for question ${id}`);
    const question = await this.questionService.findOne(id);
    if (!question) {
      return { questionId: id, answer: null, choices: [], matchKeywords: [] };
    }

    return {
      questionId: question.id,
      answer: question.answer || '',
      choices: question.choices || [],
      matchKeywords: question.matchKeywords || [],
    };
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

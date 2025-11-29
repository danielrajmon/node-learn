import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import type { QuestionWithoutAnswer, QuestionFilters } from './interfaces/question.interface';
import { QuestionWithoutAnswerDto } from './dto/question.dto';

@ApiTags('questions')
@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all questions', description: 'Retrieve all questions with optional filtering (answers not included)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in question and topics' })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard'], description: 'Filter by difficulty level' })
  @ApiQuery({ name: 'topic', required: false, description: 'Filter by topic (comma-separated for multiple topics)' })
  @ApiResponse({ status: 200, description: 'List of questions without answers', type: [QuestionWithoutAnswerDto] })
  async findAll(
    @Query('search') search?: string,
    @Query('difficulty') difficulty?: 'easy' | 'medium' | 'hard',
    @Query('topic') topicParam?: string,
  ): Promise<QuestionWithoutAnswer[]> {
    const topic = topicParam ? topicParam.split(',').map((t) => t.trim()) : undefined;
    const filters: QuestionFilters = { search, difficulty, topic };
    return await this.questionService.findAll(filters);
  }

  @Get('random')
  @ApiOperation({ summary: 'Get a random question', description: 'Retrieve a random question from the collection (answer not included)' })
  @ApiResponse({ status: 200, description: 'A random question without answer', type: QuestionWithoutAnswerDto })
  async findRandom(): Promise<QuestionWithoutAnswer> {
    return await this.questionService.findRandom();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a question by ID', description: 'Retrieve a specific question by its ID (answer not included)' })
  @ApiParam({ name: 'id', description: 'Question ID', type: Number })
  @ApiResponse({ status: 200, description: 'The question without answer', type: QuestionWithoutAnswerDto })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findOne(@Param('id') id: string): Promise<QuestionWithoutAnswer> {
    const question = await this.questionService.findOneWithoutAnswer(+id);
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }
}

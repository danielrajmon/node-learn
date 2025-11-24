import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import type { Question, QuestionFilters } from './interfaces/question.interface';
import { QuestionDto } from './dto/question.dto';

@ApiTags('questions')
@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all questions', description: 'Retrieve all questions with optional filtering' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in question, answer, and topics' })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['junior', 'medior', 'senior'], description: 'Filter by difficulty level' })
  @ApiQuery({ name: 'topic', required: false, description: 'Filter by topic (comma-separated for multiple topics)' })
  @ApiResponse({ status: 200, description: 'List of questions', type: [QuestionDto] })
  findAll(
    @Query('search') search?: string,
    @Query('difficulty') difficulty?: 'junior' | 'medior' | 'senior',
    @Query('topic') topicParam?: string,
  ): Question[] {
    const topic = topicParam ? topicParam.split(',').map((t) => t.trim()) : undefined;
    const filters: QuestionFilters = { search, difficulty, topic };
    return this.questionService.findAll(filters);
  }

  @Get('random')
  @ApiOperation({ summary: 'Get a random question', description: 'Retrieve a random question from the collection' })
  @ApiResponse({ status: 200, description: 'A random question', type: QuestionDto })
  findRandom(): Question {
    return this.questionService.findRandom();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a question by ID', description: 'Retrieve a specific question by its ID' })
  @ApiParam({ name: 'id', description: 'Question ID', type: Number })
  @ApiResponse({ status: 200, description: 'The question', type: QuestionDto })
  @ApiResponse({ status: 404, description: 'Question not found' })
  findOne(@Param('id') id: string): Question {
    const question = this.questionService.findOne(+id);
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }
}

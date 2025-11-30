import { Controller, Post, Put, Delete, Body, Param, ParseIntPipe, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionDto } from '../question/dto/question.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('questions')
  @ApiOperation({ summary: 'Get all questions (including inactive)' })
  @ApiResponse({ status: 200, description: 'List of all questions', type: [QuestionDto] })
  async getAllQuestions(
    @Query('search') search?: string,
    @Query('difficulty') difficulty?: 'easy' | 'medium' | 'hard',
    @Query('topic') topicParam?: string,
  ): Promise<QuestionDto[]> {
    const topic = topicParam ? topicParam.split(',').map((t) => t.trim()) : undefined;
    const filters = { search, difficulty, topic };
    return await this.adminService.findAllQuestions(filters);
  }

  @Post('questions')
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({ status: 201, description: 'Question created successfully', type: QuestionDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createQuestion(@Body() createQuestionDto: CreateQuestionDto): Promise<QuestionDto> {
    return await this.adminService.createQuestion(createQuestionDto);
  }

  @Put('questions/:id')
  @ApiOperation({ summary: 'Update an existing question' })
  @ApiResponse({ status: 200, description: 'Question updated successfully', type: QuestionDto })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto
  ): Promise<QuestionDto> {
    return await this.adminService.updateQuestion(id, updateQuestionDto);
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Delete a question' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async deleteQuestion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.adminService.deleteQuestion(id);
  }
}

import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionDto } from '../question/dto/question.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('questions')
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({ status: 201, description: 'Question created successfully', type: QuestionDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createQuestion(@Body() createQuestionDto: CreateQuestionDto): Promise<QuestionDto> {
    return await this.adminService.createQuestion(createQuestionDto);
  }
}

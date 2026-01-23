import { Controller, Post, Put, Delete, Body, Param, ParseIntPipe, Get, Query, UseGuards, Req, UnauthorizedException, Injectable, ExecutionContext } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // If there's an error or no user, return undefined (not false)
    // This allows the controller to check for req.user existence
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}
import { AdminService } from './admin.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionDto } from './dto/question.dto';

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
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({ status: 201, description: 'Question created successfully', type: QuestionDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createQuestion(@Req() req, @Body() createQuestionDto: CreateQuestionDto): Promise<QuestionDto> {
    if (!req.user) {
      throw new UnauthorizedException('User must be logged in to create questions!');
    }
    if (!req.user.isAdmin) {
      throw new UnauthorizedException('User has no admin privileges!');
    }
    return await this.adminService.createQuestion(createQuestionDto);
  }

  @Put('questions/:id')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Update an existing question' })
  @ApiResponse({ status: 200, description: 'Question updated successfully', type: QuestionDto })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async updateQuestion(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto
  ): Promise<QuestionDto> {
    if (!req.user) {
      throw new UnauthorizedException('User must be logged in to update questions!');
    }
    if (!req.user.isAdmin) {
      throw new UnauthorizedException('User has no admin privileges!');
    }
    return await this.adminService.updateQuestion(id, updateQuestionDto);
  }

  @Delete('questions/:id')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Delete a question' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async deleteQuestion(@Req() req, @Param('id', ParseIntPipe) id: number): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedException('User must be logged in to delete questions!');
    }
    if (!req.user.isAdmin) {
      throw new UnauthorizedException('User has no admin privileges!');
    }
    return await this.adminService.deleteQuestion(id);
  }

  @Get('users')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  async getUsers(@Req() req): Promise<any[]> {
    if (!req.user || !req.user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }
    return await this.adminService.getAllUsers();
  }
}

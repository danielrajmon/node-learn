import { Controller, Get, Post, Put, Delete, Body, Param, Logger, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionDto } from './dto/question.dto';

@Controller('admin')
export class AdminController {
  private logger = new Logger('AdminController');

  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  health() {
    return { 
      status: 'ok', 
      service: 'admin', 
      timestamp: new Date().toISOString() 
    };
  }

  @Get('questions')
  async getAllQuestions(
    @Query('search') search?: string,
    @Query('difficulty') difficulty?: 'easy' | 'medium' | 'hard',
    @Query('topic') topicParam?: string,
  ): Promise<QuestionDto[]> {
    this.logger.debug('Fetching all questions for admin');
    const topic = topicParam ? topicParam.split(',').map((t) => t.trim()) : undefined;
    const filters = { search, difficulty, topic };
    return await this.adminService.findAllQuestions(filters);
  }

  @Get('questions/export')
  async exportQuestions() {
    this.logger.debug('Exporting questions to JSON');
    return this.adminService.exportQuestions();
  }

  @Get('questions/:id')
  async getQuestion(@Param('id', ParseIntPipe) id: number) {
    this.logger.debug(`Fetching question ${id} for admin`);
    return this.adminService.getQuestion(id);
  }

  @Post('questions')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createQuestion(@Body() createQuestionDto: CreateQuestionDto): Promise<QuestionDto> {
    this.logger.debug('Creating new question');
    return await this.adminService.createQuestion(createQuestionDto);
  }

  @Put('questions/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto
  ): Promise<QuestionDto> {
    this.logger.debug(`Updating question ${id}`);
    return await this.adminService.updateQuestion(id, updateQuestionDto);
  }

  @Delete('questions/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteQuestion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.debug(`Deleting question ${id}`);
    return await this.adminService.deleteQuestion(id);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllUsers() {
    this.logger.debug('Fetching all users for admin');
    return this.adminService.getAllUsers();
  }

  @Put('users/:id/role')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateUserRole(@Param('id', ParseIntPipe) id: number, @Body() roleData: { isAdmin: boolean }) {
    this.logger.debug(`Updating role for user ${id}`);
    return this.adminService.updateUserRole(id, roleData.isAdmin);
  }

  @Post('migrations/init-table/:tableName')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async initializeTable(@Param('tableName') tableName: string) {
    this.logger.debug(`Initializing table: ${tableName}`);
    return this.adminService.initializeTable(tableName);
  }

  @Get('migrations/table-status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getTableStatus() {
    this.logger.debug('Fetching table status across all databases');
    return this.adminService.getTableStatus();
  }

  @Post('questions/import')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async importQuestions(@Body() body: { questions: any[] }) {
    this.logger.debug(`Importing ${body.questions.length} questions`);
    return this.adminService.importQuestions(body.questions);
  }
}

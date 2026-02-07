import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionDto, QuestionFilters } from './dto/question.dto';

@Injectable()
export class AdminService {
  private logger = new Logger('AdminService');
  private questionsServiceUrl = process.env.QUESTION_SERVICE_URL || 'http://questions:3002';
  private maintenanceServiceUrl = process.env.MAINTENANCE_SERVICE_URL || 'http://maintenance:3010';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject('NATS_CLIENT') private natsClient: ClientProxy,
  ) {}

  private async requestQuestionsService<T>(
    path: string,
    options: { method?: string; headers?: Record<string, string>; body?: string } = {},
  ): Promise<T> {
    const url = `${this.questionsServiceUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Questions service error ${response.status}: ${text}`);
      throw new Error(`Questions service error ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async requestMaintenanceService<T>(
    path: string,
    options: { method?: string; headers?: Record<string, string>; body?: string } = {},
  ): Promise<T> {
    const url = `${this.maintenanceServiceUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Maintenance service error ${response.status}: ${text}`);
      throw new Error(`Maintenance service error ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async findAllQuestions(filters?: QuestionFilters): Promise<QuestionDto[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.difficulty) params.set('difficulty', filters.difficulty);
    if (filters?.topic && Array.isArray(filters.topic)) params.set('topic', filters.topic.join(','));
    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.requestQuestionsService<QuestionDto[]>(`/questions/admin${query}`);
  }

  async getQuestion(id: number): Promise<QuestionDto> {
    try {
      return await this.requestQuestionsService<QuestionDto>(`/questions/admin/${id}`);
    } catch (error) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
  }

  async createQuestion(createQuestionDto: CreateQuestionDto): Promise<QuestionDto> {
    const result = await this.requestQuestionsService<QuestionDto>(
      '/questions/admin',
      {
        method: 'POST',
        body: JSON.stringify(createQuestionDto),
      },
    );

    // Emit event to NATS (keep emit; not request-reply)
    const correlationId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.natsClient.emit('question.created', {
      correlationId,
      timestamp: new Date().toISOString(),
      data: result,
    });
    this.logger.log(`Published question.created event for question ${result.id}`);

    return result;
  }

  async updateQuestion(id: number, updateQuestionDto: UpdateQuestionDto): Promise<QuestionDto> {
    let result: QuestionDto;
    try {
      result = await this.requestQuestionsService<QuestionDto>(
        `/questions/admin/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateQuestionDto),
        },
      );
    } catch (error) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const correlationId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.natsClient.emit('question.updated', {
      correlationId,
      timestamp: new Date().toISOString(),
      data: result,
    });
    this.logger.log(`Published question.updated event for question ${result.id}`);

    return result;
  }

  async deleteQuestion(id: number): Promise<void> {
    try {
      await this.requestQuestionsService(`/questions/admin/${id}`, { method: 'DELETE' });
    } catch (error) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const correlationId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.natsClient.emit('question.deleted', {
      correlationId,
      timestamp: new Date().toISOString(),
      data: { id },
    });
    this.logger.log(`Published question.deleted event for question ${id}`);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async updateUserRole(id: number, isAdmin: boolean): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.isAdmin = isAdmin;
    const updatedUser = await this.userRepository.save(user);

    // Emit event to NATS
    const correlationId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.natsClient.emit('user.role.updated', {
      correlationId,
      timestamp: new Date().toISOString(),
      data: { userId: id, isAdmin }
    });
    this.logger.log(`Published user.role.updated event for user ${id}`);

    return updatedUser;
  }

  async initializeTable(tableName: string): Promise<{ message: string; success: boolean }> {
    this.logger.log(`Initializing table: ${tableName}`);

    return await this.requestMaintenanceService<{ message: string; success: boolean }>(
      `/maintenance/migrations/init-table/${tableName}`,
      { method: 'POST' },
    );
  }


  async getTableStatus(): Promise<any[]> {
    return await this.requestMaintenanceService<any[]>(
      '/maintenance/migrations/table-status',
    );
  }

  async exportQuestions(): Promise<any[]> {
    return await this.requestQuestionsService<any[]>(`/questions/admin/export`);
  }

  async importQuestions(questions: any[]): Promise<{ message: string }> {
    return await this.requestQuestionsService<{ message: string }>(
      '/questions/admin/import',
      {
        method: 'POST',
        body: JSON.stringify({ questions }),
      },
    );
  }
}

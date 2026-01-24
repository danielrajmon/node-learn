import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { QuestionEntity } from './entities/question.entity';
import { ChoiceEntity } from './entities/choice.entity';
import { User } from './entities/user.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionDto, QuestionFilters } from './dto/question.dto';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { execSync } from 'child_process';

@Injectable()
export class AdminService {
  private logger = new Logger('AdminService');

  constructor(
    @InjectRepository(QuestionEntity, 'questions')
    private questionRepository: Repository<QuestionEntity>,
    @InjectRepository(ChoiceEntity, 'questions')
    private choiceRepository: Repository<ChoiceEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject('NATS_CLIENT') private natsClient: ClientProxy,
    private dataSource: DataSource,
  ) {}

  private entityToDto(entity: QuestionEntity): QuestionDto {
    return {
      id: entity.id,
      questionType: entity.questionType,
      practical: entity.practical,
      question: entity.question,
      answer: entity.answer,
      quiz: entity.quiz,
      matchKeywords: entity.matchKeywords,
      difficulty: entity.difficulty,
      topic: entity.topic,
      isActive: entity.isActive,
      choices: entity.choices?.map(choice => ({
        id: choice.id,
        choiceText: choice.choiceText,
        isGood: choice.isGood,
        explanation: choice.explanation,
      })) || [],
    };
  }

  async findAllQuestions(filters?: QuestionFilters): Promise<QuestionDto[]> {
    const questions = await this.questionRepository.find({
      relations: ['choices'],
      order: {
        id: 'DESC',
        choices: {
          id: 'ASC',
        },
      },
    });
    return questions.map((q) => this.entityToDto(q));
  }

  async getQuestion(id: number): Promise<QuestionDto> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['choices'],
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return this.entityToDto(question);
  }

  async createQuestion(createQuestionDto: CreateQuestionDto): Promise<QuestionDto> {
    const { choices, ...questionData } = createQuestionDto;

    const question = this.questionRepository.create(questionData);
    const savedQuestion = await this.questionRepository.save(question);

    if (choices && choices.length > 0) {
      const choiceEntities = choices.map((choice) =>
        this.choiceRepository.create({
          ...choice,
          questionId: savedQuestion.id,
        }),
      );
      await this.choiceRepository.save(choiceEntities);
    }

    const result = await this.questionRepository.findOne({
      where: { id: savedQuestion.id },
      relations: ['choices'],
    });

    if (!result) {
      throw new Error('Failed to create question');
    }

    // Emit event to NATS (keep emit; not request-reply)
    const correlationId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.natsClient.emit('question.created', {
      correlationId,
      timestamp: new Date().toISOString(),
      data: result,
    });
    this.logger.log(`Published question.created event for question ${result.id}`);

    return this.entityToDto(result);
  }

  async updateQuestion(id: number, updateQuestionDto: UpdateQuestionDto): Promise<QuestionDto> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['choices'],
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const { choices, ...questionData } = updateQuestionDto;

    const savedQuestion = await this.questionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.delete(ChoiceEntity, { questionId: id });

        Object.assign(question, questionData);
        question.choices = [] as any;
        const saved = await transactionalEntityManager.save(QuestionEntity, question);

        if (choices && choices.length > 0) {
          const choiceEntities = choices.map((choice) =>
            transactionalEntityManager.create(ChoiceEntity, {
              ...choice,
              questionId: saved.id,
            }),
          );
          await transactionalEntityManager.save(ChoiceEntity, choiceEntities);
        }

        return saved;
      },
    );

    const result = await this.questionRepository.findOne({
      where: { id: savedQuestion.id },
      relations: ['choices'],
    });

    if (!result) {
      throw new Error('Failed to update question');
    }

    const correlationId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.natsClient.emit('question.updated', {
      correlationId,
      timestamp: new Date().toISOString(),
      data: result,
    });
    this.logger.log(`Published question.updated event for question ${result.id}`);

    return this.entityToDto(result);
  }

  async deleteQuestion(id: number): Promise<void> {
    const question = await this.questionRepository.findOne({ where: { id } });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    await this.questionRepository.delete(id);

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

    try {
      const sqlFilePath = path.join(__dirname, '..', '..', '..', 'scripts', 'sql', `${tableName}.sql`);
      
      if (!fs.existsSync(sqlFilePath)) {
        throw new Error(`SQL file not found for table: ${tableName}`);
      }

      // Map tables to their respective databases
      const tableDbMap: Record<string, string> = {
        'users': 'auth',
        'questions': 'admin',
        'choices': 'admin',
        'achievements': 'achievements',
        'user_achievements': 'achievements',
        'leaderboards': 'leaderboard',
        'quiz_modes': 'quiz',
        'user_question_stats': 'quiz',
      };

      const targetDb = tableDbMap[tableName] || 'admin';
      
      // Use psql command to execute the SQL file
      const host = process.env.POSTGRES_HOST || 'postgres';
      const port = process.env.POSTGRES_PORT || '5432';
      const user = process.env.POSTGRES_USER || 'postgres';
      const password = process.env.POSTGRES_PASSWORD || 'postgres';

      const psqlCmd = `PGPASSWORD='${password}' psql -h ${host} -p ${port} -U ${user} -d ${targetDb} -f ${sqlFilePath}`;
      
      this.logger.debug(`Executing: ${psqlCmd}`);
      const output = execSync(psqlCmd, { encoding: 'utf8' });
      
      this.logger.log(`Table ${tableName} initialized successfully in ${targetDb} database`);
      this.logger.debug(`psql output: ${output}`);
      
      return {
        message: `Table ${tableName} initialized successfully in ${targetDb} database`,
        success: true
      };
    } catch (error) {
      this.logger.error(`Error initializing table ${tableName}:`, error);
      throw new Error(`Failed to initialize table ${tableName}: ${error.message}`);
    }
  }


  async getTableStatus(): Promise<any[]> {
    // Map tables to their respective databases
    const tableDbMap: Record<string, string> = {
      'users': 'auth',
      'questions': 'admin',
      'choices': 'admin',
      'achievements': 'achievements',
      'user_achievements': 'achievements',
      'leaderboards': 'leaderboard',
      'quiz_modes': 'quiz',
      'user_question_stats': 'quiz',
    };

    const tableNames = Object.keys(tableDbMap);
    const statuses = await Promise.all(
      tableNames.map(async (tableName) => {
        const dbName = tableDbMap[tableName];
        
        try {
          const client = new Client({
            host: process.env.POSTGRES_HOST || 'postgres',
            port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'postgres',
            database: dbName,
          });

          try {
            await client.connect();
            const result = await client.query(
              `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
              ) as exists`,
              [tableName]
            );
            
            return {
              name: tableName,
              database: dbName,
              exists: result.rows[0]?.exists || false
            };
          } finally {
            await client.end();
          }
        } catch (error) {
          this.logger.error(`Error checking table ${tableName} in database ${dbName}:`, error);
          return {
            name: tableName,
            database: dbName,
            exists: false,
            error: error.message
          };
        }
      })
    );

    return statuses;
  }

  async exportQuestions(): Promise<any[]> {
    const questions = await this.questionRepository.find({
      relations: ['choices']
    });
    return questions.map(q => this.entityToDto(q));
  }

  async importQuestions(questions: any[]): Promise<{ message: string }> {
    for (const questionData of questions) {
      await this.createQuestion(questionData);
    }
    return { message: `Successfully imported ${questions.length} questions` };
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { QuestionEntity } from './entities/question.entity';
import { ChoiceEntity } from './entities/choice.entity';
import { User } from './entities/user.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionDto, QuestionFilters } from './dto/question.dto';

@Injectable()
export class AdminService {
  private logger = new Logger('AdminService');

  constructor(
    @InjectRepository(QuestionEntity)
    private questionRepository: Repository<QuestionEntity>,
    @InjectRepository(ChoiceEntity)
    private choiceRepository: Repository<ChoiceEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject('NATS_CLIENT') private natsClient: ClientProxy,
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
      choices: entity.choices,
    };
  }

  async findAllQuestions(filters?: QuestionFilters): Promise<QuestionDto[]> {
    const questions = await this.questionRepository.find({
      relations: ['choices'],
      order: { 
        id: 'DESC',
        choices: {
          id: 'ASC'
        }
      }
    });
    return questions.map(q => this.entityToDto(q));
  }

  async getQuestion(id: number): Promise<QuestionDto> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['choices']
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
      const choiceEntities = choices.map(choice => 
        this.choiceRepository.create({
          ...choice,
          questionId: savedQuestion.id
        })
      );
      await this.choiceRepository.save(choiceEntities);
    }
    
    const result = await this.questionRepository.findOne({
      where: { id: savedQuestion.id },
      relations: ['choices']
    });
    
    if (!result) {
      throw new Error('Failed to create question');
    }

    // Emit event to NATS
    const correlationId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.natsClient.emit('question.created', {
      correlationId,
      timestamp: new Date().toISOString(),
      data: result
    });
    this.logger.log(`Published question.created event for question ${result.id}`);
    
    return this.entityToDto(result);
  }

  async updateQuestion(id: number, updateQuestionDto: UpdateQuestionDto): Promise<QuestionDto> {
    const question = await this.questionRepository.findOne({ 
      where: { id },
      relations: ['choices']
    });
    
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const { choices, ...questionData } = updateQuestionDto;
    
    // Use transaction to ensure all operations succeed or fail together
    const savedQuestion = await this.questionRepository.manager.transaction(async (transactionalEntityManager) => {
      // Delete all existing choices first
      await transactionalEntityManager.delete(ChoiceEntity, { questionId: id });
      
      // Update question fields
      Object.assign(question, questionData);
      question.choices = [];
      const savedQuestion = await transactionalEntityManager.save(QuestionEntity, question);
      
      // Create new choices if provided
      if (choices && choices.length > 0) {
        const choiceEntities = choices.map(choice => 
          transactionalEntityManager.create(ChoiceEntity, {
            ...choice,
            questionId: savedQuestion.id
          })
        );
        await transactionalEntityManager.save(ChoiceEntity, choiceEntities);
      }
      
      return savedQuestion;
    });

    const result = await this.questionRepository.findOne({
      where: { id: savedQuestion.id },
      relations: ['choices']
    });

    if (!result) {
      throw new Error('Failed to update question');
    }

    // Emit event to NATS
    const correlationId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.natsClient.emit('question.updated', {
      correlationId,
      timestamp: new Date().toISOString(),
      data: result
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

    // Emit event to NATS
    const correlationId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.natsClient.emit('question.deleted', {
      correlationId,
      timestamp: new Date().toISOString(),
      data: { id }
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
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionEntity } from '../question/entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionService } from '../question/question.service';
import { QuestionFilters } from '../question/interfaces/question.interface';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(QuestionEntity)
    private questionRepository: Repository<QuestionEntity>,
    private questionService: QuestionService,
  ) {}

  async findAllQuestions(filters?: QuestionFilters): Promise<QuestionEntity[]> {
    return await this.questionService.findAllWithAnswers(filters, true);
  }

  async createQuestion(createQuestionDto: CreateQuestionDto): Promise<QuestionEntity> {
    const question = this.questionRepository.create(createQuestionDto);
    return await this.questionRepository.save(question);
  }

  async updateQuestion(id: number, updateQuestionDto: any): Promise<QuestionEntity> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new Error('Question not found');
    }
    Object.assign(question, updateQuestionDto);
    return await this.questionRepository.save(question);
  }

  async deleteQuestion(id: number): Promise<void> {
    const result = await this.questionRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Question not found');
    }
  }
}

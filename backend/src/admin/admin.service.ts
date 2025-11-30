import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionEntity } from '../question/entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(QuestionEntity)
    private questionRepository: Repository<QuestionEntity>,
  ) {}

  async createQuestion(createQuestionDto: CreateQuestionDto): Promise<QuestionEntity> {
    const question = this.questionRepository.create(createQuestionDto);
    return await this.questionRepository.save(question);
  }
}

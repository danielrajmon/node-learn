import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionEntity } from '../question/entities/question.entity';
import { ChoiceEntity } from '../question/entities/choice.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionService } from '../question/question.service';
import { QuestionFilters } from '../question/interfaces/question.interface';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(QuestionEntity)
    private questionRepository: Repository<QuestionEntity>,
    @InjectRepository(ChoiceEntity)
    private choiceRepository: Repository<ChoiceEntity>,
    private questionService: QuestionService,
  ) {}

  async findAllQuestions(filters?: QuestionFilters): Promise<QuestionEntity[]> {
    const questions = await this.questionRepository.find({
      relations: ['choices'],
      order: { id: 'DESC' }
    });
    return questions;
  }

  async createQuestion(createQuestionDto: CreateQuestionDto): Promise<QuestionEntity> {
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
    
    return result;
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

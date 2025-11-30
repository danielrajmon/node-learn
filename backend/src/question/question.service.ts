import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Question,
  QuestionWithoutAnswer,
  QuestionFilters,
} from './interfaces/question.interface';
import { QuestionEntity } from './entities/question.entity';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(QuestionEntity)
    private questionRepository: Repository<QuestionEntity>,
  ) {}

  private removeAnswer(question: Question | QuestionEntity): QuestionWithoutAnswer {
    const { longAnswer, matchKeywords, ...rest } = question;
    return rest as QuestionWithoutAnswer;
  }

  async findAll(filters?: QuestionFilters): Promise<QuestionWithoutAnswer[]> {
    const queryBuilder = this.questionRepository.createQueryBuilder('q')
      .where('q.isActive = :isActive', { isActive: true });

    if (filters?.search) {
      const searchLower = `%${filters.search.toLowerCase()}%`;
      queryBuilder.andWhere(
        'LOWER(q.questionText) LIKE :search',
        { search: searchLower },
      );
    }

    if (filters?.difficulty) {
      queryBuilder.andWhere('q.difficulty = :difficulty', {
        difficulty: filters.difficulty,
      });
    }

    if (filters?.topic) {
      queryBuilder.andWhere('q.topic = :topic', {
        topic: filters.topic,
      });
    }

    const questions = await queryBuilder.getMany();
    return questions.map((q) => this.removeAnswer(q));
  }

  async findOne(id: number): Promise<QuestionEntity | null> {
    return await this.questionRepository.findOne({
      where: { id },
    });
  }

  async findOneWithoutAnswer(
    id: number,
  ): Promise<QuestionWithoutAnswer | null> {
    const question = await this.findOne(id);
    return question ? this.removeAnswer(question) : null;
  }

  async findRandom(): Promise<QuestionWithoutAnswer | null> {
    const count = await this.questionRepository.count({ where: { isActive: true } });
    if (count === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * count);
    const [question] = await this.questionRepository.find({
      where: { isActive: true },
      skip: randomIndex,
      take: 1,
    });
    if (!question) {
      return null;
    }
    return this.removeAnswer(question);
  }
}

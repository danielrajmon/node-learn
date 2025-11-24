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
    const { answer, ...rest } = question;
    return rest as QuestionWithoutAnswer;
  }

  async findAll(filters?: QuestionFilters): Promise<QuestionWithoutAnswer[]> {
    const queryBuilder = this.questionRepository.createQueryBuilder('q');

    if (filters?.search) {
      const searchLower = `%${filters.search.toLowerCase()}%`;
      queryBuilder.where(
        'LOWER(q.question) LIKE :search',
        { search: searchLower },
      );
    }

    if (filters?.difficulty) {
      queryBuilder.andWhere('q.difficulty = :difficulty', {
        difficulty: filters.difficulty,
      });
    }

    if (filters?.topic) {
      const topicsToFilter = Array.isArray(filters.topic)
        ? filters.topic
        : [filters.topic];
      queryBuilder.andWhere('q.topics && ARRAY[:...topics]', {
        topics: topicsToFilter,
      });
    }

    const questions = await queryBuilder.getMany();
    return questions.map((q) => this.removeAnswer(q));
  }

  async findOne(id: number): Promise<QuestionEntity | null> {
    return await this.questionRepository.findOne({ where: { id } });
  }

  async findOneWithoutAnswer(
    id: number,
  ): Promise<QuestionWithoutAnswer | null> {
    const question = await this.findOne(id);
    return question ? this.removeAnswer(question) : null;
  }

  async findRandom(): Promise<QuestionWithoutAnswer> {
    const count = await this.questionRepository.count();
    const randomIndex = Math.floor(Math.random() * count);
    const [question] = await this.questionRepository.find({
      skip: randomIndex,
      take: 1,
    });
    return this.removeAnswer(question);
  }
}

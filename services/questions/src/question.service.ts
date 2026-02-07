import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Question,
  QuestionWithoutAnswer,
  QuestionFilters,
} from './interfaces/question.interface';
import { QuestionEntity } from './entities/question.entity';
import { ChoiceEntity } from './entities/choice.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionService {
  private readonly logger = new Logger('QuestionService');

  constructor(
    @InjectRepository(QuestionEntity)
    private questionRepository: Repository<QuestionEntity>,
    @InjectRepository(ChoiceEntity)
    private choiceRepository: Repository<ChoiceEntity>,
  ) {}

  private removeAnswer(question: Question | QuestionEntity): QuestionWithoutAnswer {
    const { answer, matchKeywords, ...rest } = question;
    // Remove isGood from choices to prevent exposing correct answers
    const result: any = { ...rest };
    if ('choices' in question && question.choices) {
      const allChoices = question.choices.map(({ isGood, ...choice }: any) => ({ ...choice, isGood }));
      const correctChoices = allChoices.filter((c: any) => c.isGood);
      const wrongChoices = allChoices.filter((c: any) => !c.isGood);
      
      // For single_choice: 1 correct + 3 wrong
      // For multiple_choice: all correct (up to 4) + random wrong to make 4 total
      let selectedChoices: any[] = [];
      
      if (question.questionType === 'single_choice') {
        // ALWAYS include 1 correct answer (randomly selected if multiple exist)
        const randomCorrect = correctChoices.length > 0 
          ? [correctChoices[Math.floor(Math.random() * correctChoices.length)]]
          : [];
        
        // Add 3 random wrong answers
        const randomWrong = wrongChoices.sort(() => Math.random() - 0.5).slice(0, 3);
        
        selectedChoices = [...randomCorrect, ...randomWrong];
        
        // Shuffle the final 4 choices so correct answer is not always first
        selectedChoices = selectedChoices.sort(() => Math.random() - 0.5);
      } else if (question.questionType === 'multiple_choice') {
        // For multiple choice: completely random mix of correct and wrong choices (up to 4 total)
        const allAvailableChoices = [...correctChoices, ...wrongChoices];
        selectedChoices = allAvailableChoices
          .sort(() => Math.random() - 0.5)
          .slice(0, 4);
      } else {
        // Fallback: just send all choices
        selectedChoices = allChoices;
      }
      
      // Remove isGood from the selected choices before sending
      result.choices = selectedChoices.map(({ isGood, ...choice }: any) => choice);
    }
    // Add keyword count for text input questions without exposing the actual keywords
    if (matchKeywords && Array.isArray(matchKeywords) && matchKeywords.length > 0) {
      result.keywordCount = matchKeywords.length;
    }
    return result as QuestionWithoutAnswer;
  }

  async findAll(filters?: QuestionFilters, includeInactive: boolean = false): Promise<QuestionWithoutAnswer[]> {
    const queryBuilder = this.questionRepository.createQueryBuilder('q')
      .leftJoinAndSelect('q.choices', 'choices');
    
    if (!includeInactive) {
      queryBuilder.where('q.isActive = :isActive', { isActive: true });
    }

    if (filters?.search) {
      const searchLower = `%${filters.search.toLowerCase()}%`;
      const condition = includeInactive ? 'where' : 'andWhere';
      queryBuilder[condition](
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
      if (Array.isArray(filters.topic)) {
        queryBuilder.andWhere('q.topic IN (:...topic)', {
          topic: filters.topic,
        });
      } else {
        queryBuilder.andWhere('q.topic = :topic', {
          topic: filters.topic,
        });
      }
    }

    if (filters?.questionType) {
      queryBuilder.andWhere('q.questionType = :questionType', {
        questionType: filters.questionType,
      });
    }

    if (filters?.practical !== undefined) {
      queryBuilder.andWhere('q.practical = :practical', {
        practical: filters.practical,
      });
    }

    const questions = await queryBuilder.getMany();
    return questions.map((q) => this.removeAnswer(q));
  }

  async findAllWithAnswers(filters?: QuestionFilters, includeInactive: boolean = false): Promise<QuestionEntity[]> {
    const queryBuilder = this.questionRepository.createQueryBuilder('q')
      .leftJoinAndSelect('q.choices', 'choices');
    
    if (!includeInactive) {
      queryBuilder.where('q.isActive = :isActive', { isActive: true });
    }

    if (filters?.search) {
      const searchLower = `%${filters.search.toLowerCase()}%`;
      const condition = includeInactive ? 'where' : 'andWhere';
      queryBuilder[condition](
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
      if (Array.isArray(filters.topic)) {
        queryBuilder.andWhere('q.topic IN (:...topic)', {
          topic: filters.topic,
        });
      } else {
        queryBuilder.andWhere('q.topic = :topic', {
          topic: filters.topic,
        });
      }
    }

    if (filters?.questionType) {
      queryBuilder.andWhere('q.questionType = :questionType', {
        questionType: filters.questionType,
      });
    }

    if (filters?.practical !== undefined) {
      queryBuilder.andWhere('q.practical = :practical', {
        practical: filters.practical,
      });
    }

    queryBuilder.orderBy('q.id', 'DESC').addOrderBy('choices.id', 'ASC');

    return await queryBuilder.getMany();
  }

  async findOne(id: number): Promise<QuestionEntity | null> {
    return await this.questionRepository.findOne({
      where: { id },
      relations: ['choices'],
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

  async createQuestion(createQuestionDto: CreateQuestionDto): Promise<QuestionEntity> {
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

    return result;
  }

  async updateQuestion(id: number, updateQuestionDto: UpdateQuestionDto): Promise<QuestionEntity> {
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

    return result;
  }

  async deleteQuestion(id: number): Promise<void> {
    const question = await this.questionRepository.findOne({ where: { id } });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    await this.questionRepository.delete(id);
  }

  async exportQuestions(): Promise<QuestionEntity[]> {
    return await this.questionRepository.find({
      relations: ['choices'],
      order: {
        id: 'DESC',
        choices: {
          id: 'ASC',
        },
      },
    });
  }

  async importQuestions(questions: CreateQuestionDto[]): Promise<{ message: string }>{
    for (const questionData of questions) {
      await this.createQuestion(questionData);
    }
    return { message: `Successfully imported ${questions.length} questions` };
  }
}

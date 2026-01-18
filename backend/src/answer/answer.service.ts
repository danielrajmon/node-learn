import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionEntity } from '../shared/entities/question.entity';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class AnswerService {
  constructor(
    @InjectRepository(QuestionEntity)
    private questionRepository: Repository<QuestionEntity>,
    private readonly achievementsService: AchievementsService,
  ) {}

  async getAnswer(questionId: number): Promise<{ questionId: number; answer: string; choices?: any[]; matchKeywords?: string[] } | null> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['choices'],
    });

    if (!question) {
      return null;
    }

    return {
      questionId,
      answer: question.answer || '',
      choices: question.choices || [],
      matchKeywords: question.matchKeywords || [],
    };
  }

  async recordAnswerWithAchievements(
    userId: number,
    questionId: number,
    isCorrect: boolean,
  ): Promise<{ awardedAchievements: any[] }> {
    // Check and award achievements
    const awardedAchievements = await this.achievementsService.checkAndAwardAchievements(
      userId,
      questionId,
      isCorrect,
    );

    return { awardedAchievements };
  }
}


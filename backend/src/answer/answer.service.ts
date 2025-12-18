import { Injectable } from '@nestjs/common';
import { QuestionService } from '../question/question.service';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class AnswerService {
  constructor(
    private readonly questionService: QuestionService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async getAnswer(questionId: number): Promise<{ questionId: number; answer: string; choices?: any[]; matchKeywords?: string[] } | null> {
    const question = await this.questionService.findOne(questionId);

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


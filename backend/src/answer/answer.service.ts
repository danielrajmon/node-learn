import { Injectable } from '@nestjs/common';
import { QuestionService } from '../question/question.service';
import { DataSource } from 'typeorm';

@Injectable()
export class AnswerService {
  constructor(
    private readonly questionService: QuestionService,
    private readonly dataSource: DataSource,
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

  async recordAnswer(userId: number, questionId: number, isCorrect: boolean): Promise<void> {
    const query = `
      INSERT INTO user_question_stats (user_id, question_id, correct_count, incorrect_count)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, question_id) 
      DO UPDATE SET 
        correct_count = user_question_stats.correct_count + CASE WHEN $5 THEN 1 ELSE 0 END,
        incorrect_count = user_question_stats.incorrect_count + CASE WHEN NOT $5 THEN 1 ELSE 0 END
    `;

    await this.dataSource.query(query, [
      userId,
      questionId,
      isCorrect ? 1 : 0,
      isCorrect ? 0 : 1,
      isCorrect,
    ]);
  }
}


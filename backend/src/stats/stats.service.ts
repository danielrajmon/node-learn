import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StatsService {
  constructor(private readonly dataSource: DataSource) {}

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

  async getUserStats(userId: number): Promise<any> {
    const query = `
      SELECT 
        uqs.id,
        uqs.user_id,
        uqs.question_id,
        uqs.correct_count,
        uqs.incorrect_count,
        q.question,
        q.topic,
        q.difficulty,
        (uqs.correct_count + uqs.incorrect_count) as total_attempts,
        ROUND((uqs.correct_count::float / (uqs.correct_count + uqs.incorrect_count)::float * 100)::numeric, 2) as accuracy_percentage
      FROM user_question_stats uqs
      JOIN questions q ON uqs.question_id = q.id
      WHERE uqs.user_id = $1
      ORDER BY uqs.id DESC
    `;

    const stats = await this.dataSource.query(query, [userId]);
    
    // Calculate overall statistics
    const totalCorrect = stats.reduce((sum: number, s: any) => sum + s.correct_count, 0);
    const totalIncorrect = stats.reduce((sum: number, s: any) => sum + s.incorrect_count, 0);
    const totalAttempts = totalCorrect + totalIncorrect;
    const overallAccuracy = totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).toFixed(2) : 0;

    return {
      overall: {
        totalCorrect,
        totalIncorrect,
        totalAttempts,
        overallAccuracy,
      },
      questions: stats,
    };
  }
}

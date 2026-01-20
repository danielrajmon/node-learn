import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { NatsService } from './nats.service';
import { RecordAnswerDto } from './quiz.controller';

@Injectable()
export class QuizService {
  private logger = new Logger('QuizService');

  constructor(
    private db: DatabaseService,
    private nats: NatsService,
  ) {}

  /**
   * Record answer submission using Saga pattern
   * Coordinates: stats recording → achievement check → leaderboard update
   */
  async recordAnswer(dto: RecordAnswerDto) {
    const correlationId = `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.debug(`[${correlationId}] Starting answer submission saga`);

    try {
      // Step 1: Record answer in stats table
      await this.recordStats(dto, correlationId);

      // Step 2: Publish answer.submitted event
      await this.nats.publish('answer.submitted', {
        userId: dto.userId,
        questionId: dto.questionId,
        selectedChoiceId: dto.selectedChoiceId,
        quizModeId: dto.quizModeId,
        isCorrect: dto.isCorrect,
        timestamp: new Date().toISOString(),
        correlationId,
      });

      // Step 3: If correct, trigger achievement and leaderboard checks
      let awardedAchievements = [];
      let leaderboardUpdated = false;

      if (dto.isCorrect) {
        // Publish achievement check event
        await this.nats.publish('achievement.check', {
          userId: dto.userId,
          questionId: dto.questionId,
          quizModeId: dto.quizModeId,
          correlationId,
        });

        // Publish leaderboard update event
        await this.nats.publish('leaderboard.update', {
          userId: dto.userId,
          quizModeId: dto.quizModeId,
          correlationId,
        });

        // For now, return empty results (other services will handle asynchronously)
        // In a future phase, we could wait for responses via NATS request-reply
        leaderboardUpdated = true;
      }

      this.logger.log(`[${correlationId}] Answer submission saga completed successfully`);

      return {
        success: true,
        awardedAchievements,
        leaderboardUpdated,
      };
    } catch (error) {
      this.logger.error(`[${correlationId}] Saga failed: ${error.message}`);
      
      // Publish compensation event
      await this.nats.publish('answer.submission.failed', {
        userId: dto.userId,
        questionId: dto.questionId,
        error: error.message,
        correlationId,
      });

      throw error;
    }
  }

  /**
   * Record answer stats in database
   */
  private async recordStats(dto: RecordAnswerDto, correlationId: string) {
    const query = `
      INSERT INTO user_question_stats (user_id, question_id, correct_count, incorrect_count)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, question_id)
      DO UPDATE SET
        correct_count = user_question_stats.correct_count + $3,
        incorrect_count = user_question_stats.incorrect_count + $4
    `;

    const correctCount = dto.isCorrect ? 1 : 0;
    const incorrectCount = dto.isCorrect ? 0 : 1;

    await this.db.query(query, [dto.userId, dto.questionId, correctCount, incorrectCount]);
    
    this.logger.debug(`[${correlationId}] Stats recorded in database`);
  }

  /**
   * Get quiz modes from database
   */
  async getQuizModes() {
    const query = 'SELECT id, name, description, filters FROM quiz_modes ORDER BY id';
    const result = await this.db.query(query, []);
    return result.rows;
  }

  /**
   * Get correct answer and choices for a question
   */
  async getAnswer(questionId: number): Promise<any> {
    const query = `
      SELECT
        q.id as questionId,
        c.id as correctChoiceId,
        c.choice_text as answer,
        (SELECT json_agg(json_build_object('id', id, 'choice_text', choice_text))
         FROM choices WHERE question_id = q.id) as choices
      FROM questions q
      JOIN choices c ON q.id = c.question_id AND c.is_good = true
      WHERE q.id = $1
      LIMIT 1
    `;
    
    const result = await this.db.query(query, [questionId]);
    const row = result.rows[0];
    
    if (!row) {
      return { questionId, answer: null, choices: [] };
    }

    return {
      questionId: row.questionId,
      answer: row.answer,
      choices: row.choices || [],
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: number): Promise<any> {
    const overallQuery = `
      SELECT
        SUM(correct_count + incorrect_count) as total_attempts,
        SUM(correct_count) as correct_answers,
        SUM(incorrect_count) as wrong_answers,
        ROUND(100.0 * SUM(correct_count) / 
              NULLIF(SUM(correct_count + incorrect_count), 0), 2) as accuracy_percentage
      FROM user_question_stats
      WHERE user_id = $1
    `;
    
    const questionsQuery = `
      SELECT
        q.id as question_id,
        q.question,
        q.topic,
        q.difficulty,
        uqs.correct_count,
        uqs.incorrect_count,
        ROUND(100.0 * uqs.correct_count / 
              NULLIF(uqs.correct_count + uqs.incorrect_count, 0), 2) as accuracy_percentage
      FROM user_question_stats uqs
      JOIN questions q ON uqs.question_id = q.id
      WHERE uqs.user_id = $1
      ORDER BY q.id
    `;
    
    const overallResult = await this.db.query(overallQuery, [userId]);
    const questionsResult = await this.db.query(questionsQuery, [userId]);
    
    const overallRow = overallResult.rows[0];
    
    if (!overallRow || !overallRow.total_attempts) {
      return {
        overall: {
          totalCorrect: 0,
          totalIncorrect: 0,
          totalAttempts: 0,
          overallAccuracy: '0.00',
        },
        questions: [],
      };
    }

    // Convert snake_case to camelCase for frontend compatibility
    return {
      overall: {
        totalCorrect: parseInt(overallRow.correct_answers) || 0,
        totalIncorrect: parseInt(overallRow.wrong_answers) || 0,
        totalAttempts: parseInt(overallRow.total_attempts) || 0,
        overallAccuracy: overallRow.accuracy_percentage || '0.00',
      },
      questions: questionsResult.rows.map((row: any) => ({
        id: row.question_id,
        question_id: row.question_id,
        question: row.question,
        topic: row.topic || '',
        difficulty: row.difficulty || 'medium',
        correct_count: row.correct_count,
        incorrect_count: row.incorrect_count,
        accuracy_percentage: row.accuracy_percentage || '0.00',
      })),
    };
  }

  /**
   * Get user wrong questions (questions where incorrect_count > 0)
   */
  async getUserWrongQuestions(userId: number): Promise<number[]> {
    const query = `
      SELECT question_id
      FROM user_question_stats
      WHERE user_id = $1 AND incorrect_count > 0
      ORDER BY question_id
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows.map((row: any) => row.question_id);
  }
}

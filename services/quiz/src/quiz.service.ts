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
}

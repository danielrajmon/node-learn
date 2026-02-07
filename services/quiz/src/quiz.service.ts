import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NatsService } from '@node-learn/messaging';
import { NATS_SUBJECTS } from '@node-learn/events';
import { UserQuestionStatsEntity } from './entities/user-question-stats.entity';
import { QuizModeEntity } from './entities/quiz-mode.entity';
import { RecordAnswerDto } from './dto/record-answer.dto';
import { UserStatsDto } from './dto/user-stats.dto';

@Injectable()
export class QuizService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger('QuizService');
  private questionsServiceUrl = process.env.QUESTION_SERVICE_URL || 'http://questions:3002';

  constructor(
    @InjectRepository(UserQuestionStatsEntity)
    private statsRepository: Repository<UserQuestionStatsEntity>,
    @InjectRepository(QuizModeEntity)
    private quizModeRepository: Repository<QuizModeEntity>,
    private nats: NatsService,
  ) {}

  async onModuleInit() {
    try {
      await this.nats.connect();
    } catch (error) {
      this.logger.warn(`Failed to connect to NATS: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.nats.disconnect();
  }

  private async requestQuestionsService<T>(
    path: string,
    options: { method?: string; headers?: Record<string, string>; body?: string } = {},
  ): Promise<T> {
    const url = `${this.questionsServiceUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Questions service error ${response.status}: ${text}`);
      throw new Error(`Questions service error ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async fetchQuestion(questionId: number) {
    return await this.requestQuestionsService<any>(`/questions/${questionId}`);
  }

  /**
   * Record answer submission using Saga pattern
   * Coordinates: stats recording → achievement check → leaderboard update
   */
  async recordAnswer(dto: RecordAnswerDto) {
    const correlationId = `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.debug(`[${correlationId}] Starting answer submission saga`);

    try {
      const question = await this.fetchQuestion(dto.questionId).catch(() => null);

      // Step 1: Record answer in stats table
      await this.recordStats(dto, correlationId);

      // Step 2: Publish answer.submitted event
      await this.nats.publish(NATS_SUBJECTS.ANSWER_SUBMITTED, {
        userId: dto.userId,
        questionId: dto.questionId,
        selectedChoiceId: dto.selectedChoiceId,
        quizModeId: dto.quizModeId,
        isCorrect: dto.isCorrect,
        timestamp: new Date().toISOString(),
        correlationId,
        questionType: question?.questionType,
        practical: question?.practical,
        difficulty: question?.difficulty,
      });

      // Step 3: If correct, trigger achievement and leaderboard checks
      let awardedAchievements = [];
      let leaderboardUpdated = false;

      if (dto.isCorrect) {
        // Publish achievement check event
        await this.nats.publish(NATS_SUBJECTS.ACHIEVEMENT_CHECK, {
          userId: dto.userId,
          questionId: dto.questionId,
          quizModeId: dto.quizModeId,
          correlationId,
        });

        // Publish leaderboard update event
        await this.nats.publish(NATS_SUBJECTS.LEADERBOARD_UPDATE, {
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
      await this.nats.publish(NATS_SUBJECTS.ANSWER_SUBMISSION_FAILED, {
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
    const correctCount = dto.isCorrect ? 1 : 0;
    const incorrectCount = dto.isCorrect ? 0 : 1;

    await this.statsRepository.upsert(
      {
        userId: Number(dto.userId),
        questionId: Number(dto.questionId),
        correctCount,
        incorrectCount,
      } as Partial<UserQuestionStatsEntity>,
      {
        conflictPaths: ['userId', 'questionId'],
        skipUpdateIfNoValuesChanged: true,
      }
    );
    
    this.logger.debug(`[${correlationId}] Stats recorded in database`);
  }

  /**
   * Get quiz modes from database
   */
  /**
   * Get quiz modes from database
   */
  async getQuizModes() {
    const modes = await this.quizModeRepository.find({
      order: { id: 'ASC' }
    });
    return modes.map(mode => ({
      id: mode.id.toString(),
      name: mode.name,
      description: mode.description,
      filters: mode.filters || {}
    }));
  }

  /**
   * Get correct answer and choices for a question
   */
  async getAnswer(questionId: number): Promise<any> {
    return await this.requestQuestionsService<any>(`/questions/${questionId}/answer`);
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: number): Promise<UserStatsDto> {
    const stats = await this.statsRepository.find({
      where: { userId },
    });

    if (stats.length === 0) {
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

    const totalAttempts = stats.reduce((sum, s) => sum + s.correctCount + s.incorrectCount, 0);
    const totalCorrect = stats.reduce((sum, s) => sum + s.correctCount, 0);
    const totalIncorrect = stats.reduce((sum, s) => sum + s.incorrectCount, 0);
    const overallAccuracy = totalAttempts > 0 
      ? (100.0 * totalCorrect / totalAttempts).toFixed(2)
      : '0.00';

    const questions = await Promise.all(stats.map(async (s) => {
      const q = await this.fetchQuestion(s.questionId).catch(() => null);
      return {
        id: s.questionId,
        question_id: s.questionId,
        question: q?.question || '',
        topic: q?.topic || '',
        difficulty: (q?.difficulty as any) || 'medium',
        correct_count: s.correctCount,
        incorrect_count: s.incorrectCount,
        accuracy_percentage: (s.correctCount + s.incorrectCount > 0
          ? (100.0 * s.correctCount / (s.correctCount + s.incorrectCount)).toFixed(2)
          : '0.00'),
      };
    }));

    return {
      overall: {
        totalCorrect,
        totalIncorrect,
        totalAttempts,
        overallAccuracy,
      },
      questions,
    };
  }

  /**
   * Get user wrong questions (questions where incorrect_count > 0)
   */
  async getUserWrongQuestions(userId: number): Promise<number[]> {
    const stats = await this.statsRepository.find({
      where: { userId },
    });

    return stats
      .filter(s => s.incorrectCount > 0)
      .map(s => s.questionId)
      .sort();
  }
}

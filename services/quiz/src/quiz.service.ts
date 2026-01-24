import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NatsService } from './nats.service';
import { QuestionEntity } from './entities/question.entity';
import { ChoiceEntity } from './entities/choice.entity';
import { UserQuestionStatsEntity } from './entities/user-question-stats.entity';
import { QuizModeEntity } from './entities/quiz-mode.entity';
import { RecordAnswerDto } from './stats.controller';

@Injectable()
export class QuizService {
  private logger = new Logger('QuizService');

  constructor(
    @InjectRepository(QuestionEntity, 'questions')
    private questionRepository: Repository<QuestionEntity>,
    @InjectRepository(ChoiceEntity, 'questions')
    private choiceRepository: Repository<ChoiceEntity>,
    @InjectRepository(UserQuestionStatsEntity)
    private statsRepository: Repository<UserQuestionStatsEntity>,
    @InjectRepository(QuizModeEntity)
    private quizModeRepository: Repository<QuizModeEntity>,
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
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['choices'],
    });

    if (!question) {
      return { questionId, answer: null, choices: [], matchKeywords: [] };
    }

    return {
      questionId: question.id,
      answer: question.answer || '',
      choices: question.choices || [],
      matchKeywords: question.matchKeywords || [],
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: number): Promise<any> {
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
      const q = await this.questionRepository.findOne({ where: { id: s.questionId } });
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

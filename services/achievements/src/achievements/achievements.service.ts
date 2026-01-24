import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

export interface Achievement {
  id: number;
  title: string;
  description: string;
  sprite_col: number;
  sprite_row: number;
  created_at?: string;
}

export interface UserAchievement extends Achievement {
  unlocked: boolean;
  unlocked_at?: string;
  progress?: {
    current: number;
    total: number;
    label: string;
  };
}

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger('AchievementsService');

  constructor(
    @InjectDataSource()
    private readonly achievementsDataSource: DataSource,
  ) {}

  async findAll(): Promise<Achievement[]> {
    this.logger.debug('Fetching all achievements from database');
    try {
      const query = `
        SELECT 
          id,
          title,
          description,
          sprite_col,
          sprite_row,
          created_at
        FROM achievements
        ORDER BY id ASC
      `;
      return await this.achievementsDataSource.query(query);
    } catch (error) {
      this.logger.error('Error fetching achievements:', error);
      throw error;
    }
  }

  async findOne(id: number): Promise<Achievement | null> {
    this.logger.debug(`Fetching achievement with ID: ${id}`);
    try {
      const query = `
        SELECT 
          id,
          title,
          description,
          sprite_col,
          sprite_row,
          created_at
        FROM achievements
        WHERE id = $1
      `;
      const result = await this.achievementsDataSource.query(query, [id]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logger.error(`Error fetching achievement ${id}:`, error);
      throw error;
    }
  }

  async findUserAchievements(userId: string): Promise<UserAchievement[]> {
    this.logger.debug(`Fetching achievements for user: ${userId}`);
    try {
      // Get all achievements
      const allAchievements = await this.findAll();

      // Get user's unlocked achievements
      const unlockedQuery = `
        SELECT achievement_id, unlocked_at 
        FROM user_achievements 
        WHERE user_id = $1
      `;
      const unlockedAchievements = await this.achievementsDataSource.query(unlockedQuery, [userId]);
      const unlockedIds = new Set(unlockedAchievements.map((a) => a.achievement_id));
      const unlockedMap = new Map(
        unlockedAchievements.map((a) => [a.achievement_id, a.unlocked_at as string | undefined]),
      );

      // Return all achievements with unlock status
      return allAchievements.map((achievement) => {
        const result: UserAchievement = {
          ...achievement,
          unlocked: unlockedIds.has(achievement.id),
          unlocked_at: unlockedMap.get(achievement.id) as string | undefined,
        };
        return result;
      });
    } catch (error) {
      this.logger.error(`Error fetching achievements for user ${userId}:`, error);
      throw error;
    }
  }

  async awardAchievement(userId: string | number, achievementId: number): Promise<void> {
    const userIdStr = String(userId);
    this.logger.debug(`Awarding achievement ${achievementId} to user ${userIdStr}`);
    try {
      const query = `
        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
        SELECT $1::varchar, $2::int, NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM user_achievements WHERE user_id = $1::varchar AND achievement_id = $2::int
        )
      `;
      await this.achievementsDataSource.query(query, [userIdStr, achievementId]);
    } catch (error) {
      this.logger.error(
        `Error awarding achievement ${achievementId} to user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async checkAndAwardAchievements(
    userId: number,
    questionId: number,
    isCorrect: boolean,
  ): Promise<Achievement[]> {
    this.logger.debug(`Checking achievements for user ${userId}, question ${questionId}, correct: ${isCorrect}`);
    
    try {
      const userIdStr = String(userId);

      const aggregates = await this.achievementsDataSource.query(
        `SELECT 
          COALESCE(SUM(correct_count), 0) AS total_correct,
          COALESCE(COUNT(*) FILTER (WHERE question_type = 'single_choice' AND correct_count > 0), 0) AS single_choice_correct,
          COALESCE(COUNT(*) FILTER (WHERE question_type = 'multiple_choice' AND correct_count > 0), 0) AS multi_choice_correct,
          COALESCE(COUNT(*) FILTER (WHERE question_type = 'text_input' AND correct_count > 0), 0) AS text_input_correct
         FROM achievement_user_question_stats
         WHERE user_id = $1`,
        [userIdStr],
      );

      const stats = aggregates[0] || {
        total_correct: 0,
        single_choice_correct: 0,
        multi_choice_correct: 0,
        text_input_correct: 0,
      };

      const totalCorrect = parseInt(stats.total_correct, 10) || 0;
      const singleChoiceCorrect = parseInt(stats.single_choice_correct, 10) || 0;
      const multiChoiceCorrect = parseInt(stats.multi_choice_correct, 10) || 0;
      const textInputCorrect = parseInt(stats.text_input_correct, 10) || 0;

      // Get already obtained achievements
      const obtainedAchievements = await this.achievementsDataSource.query(
        'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
        [userIdStr],
      );
      const obtainedIds = new Set(obtainedAchievements.map((a: any) => a.achievement_id));

      // Achievement checks
      const achievementsToCheck = [
        { id: 1, check: () => !obtainedIds.has(1) && singleChoiceCorrect >= 1 },
        { id: 2, check: () => !obtainedIds.has(2) && multiChoiceCorrect >= 1 },
        { id: 3, check: () => !obtainedIds.has(3) && textInputCorrect >= 1 },
        { id: 6, check: () => !obtainedIds.has(6) && singleChoiceCorrect >= 10 },
        { id: 7, check: () => !obtainedIds.has(7) && multiChoiceCorrect >= 10 },
        { id: 8, check: () => !obtainedIds.has(8) && textInputCorrect >= 10 },
        { id: 9, check: () => !obtainedIds.has(9) && totalCorrect >= 10 },
        { id: 11, check: () => !obtainedIds.has(11) && singleChoiceCorrect >= 25 },
        { id: 12, check: () => !obtainedIds.has(12) && multiChoiceCorrect >= 25 },
        { id: 13, check: () => !obtainedIds.has(13) && textInputCorrect >= 25 },
        { id: 14, check: () => !obtainedIds.has(14) && totalCorrect >= 100 },
      ];

      // Check and award
      const awardedAchievementIds: number[] = [];
      for (const achievement of achievementsToCheck) {
        try {
          if (achievement.check()) {
            await this.achievementsDataSource.query(
              `INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
               SELECT $1::varchar, $2::int, NOW()
               WHERE NOT EXISTS (
                 SELECT 1 FROM user_achievements WHERE user_id = $1::varchar AND achievement_id = $2::int
               )`,
              [userIdStr, achievement.id],
            );
            awardedAchievementIds.push(achievement.id);
          }
        } catch (error) {
          this.logger.error(`Error checking achievement ${achievement.id}:`, error);
        }
      }

      // Fetch full achievement details for awarded achievements
      if (awardedAchievementIds.length > 0) {
        const achievementDetails = await this.achievementsDataSource.query(
          `SELECT id, title, description, sprite_col, sprite_row FROM achievements 
           WHERE id = ANY($1)`,
          [awardedAchievementIds],
        );
        return achievementDetails;
      }

      return [];
    } catch (error) {
      this.logger.error('Error checking and awarding achievements:', error);
      return [];
    }
  }

  async recordAnswerProjection(params: {
    userId: string | number;
    questionId: number;
    isCorrect: boolean;
    questionType?: string;
    practical?: boolean;
    difficulty?: string | null;
  }) {
    const userIdStr = String(params.userId);
    const questionType = params.questionType || 'unknown';
    const practical = params.practical === true;
    const difficulty = params.difficulty || null;

    const correctInc = params.isCorrect ? 1 : 0;
    const incorrectInc = params.isCorrect ? 0 : 1;

    await this.achievementsDataSource.query(
      `INSERT INTO achievement_user_question_stats (
         user_id, question_id, question_type, practical, difficulty,
         correct_count, incorrect_count, last_answered_at)
       VALUES ($1::varchar, $2::int, $3::varchar, $4::boolean, $5::varchar,
               $6::int, $7::int, NOW())
       ON CONFLICT (user_id, question_id) DO UPDATE
       SET question_type = EXCLUDED.question_type,
           practical = EXCLUDED.practical,
           difficulty = COALESCE(EXCLUDED.difficulty, achievement_user_question_stats.difficulty),
           correct_count = achievement_user_question_stats.correct_count + EXCLUDED.correct_count,
           incorrect_count = achievement_user_question_stats.incorrect_count + EXCLUDED.incorrect_count,
           last_answered_at = NOW();
      `,
      [userIdStr, params.questionId, questionType, practical, difficulty, correctInc, incorrectInc],
    );
  }
}

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface Achievement {
  id: number;
  title: string;
  description: string;
  sprite_col: number;
  sprite_row: number;
  created_at: string;
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
  constructor(private readonly dataSource: DataSource) {}

  async getGuestUserId(): Promise<number> {
    const result = await this.dataSource.query(
      "SELECT id FROM users WHERE google_id = 'guest-user' LIMIT 1",
    );
    if (result.length === 0) {
      throw new Error('Guest user not found. Please run migrations.');
    }
    return result[0].id;
  }

  async getAllAchievements(): Promise<Achievement[]> {
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

    return await this.dataSource.query(query);
  }

  async checkAndAwardAchievements(
    userId: number,
    questionId: number,
    isCorrect: boolean,
  ): Promise<Achievement[]> {
    // Get question details
    const question = await this.dataSource.query(
      'SELECT id, question_type, difficulty, practical FROM questions WHERE id = $1',
      [questionId],
    );

    if (!question || question.length === 0) {
      return [];
    }

    const questionType = question[0].question_type;
    const difficulty = question[0].difficulty;
    const isPractical = question[0].practical;

    // Get user stats
    const userStats = await this.dataSource.query(
      `SELECT 
        user_id,
        SUM(correct_count) as total_correct,
        COUNT(DISTINCT question_id) as unique_questions_answered,
        SUM(CASE WHEN q.question_type = 'single_choice' AND user_question_stats.correct_count > 0 THEN 1 ELSE 0 END) as single_choice_correct,
        SUM(CASE WHEN q.question_type = 'multiple_choice' AND user_question_stats.correct_count > 0 THEN 1 ELSE 0 END) as multi_choice_correct,
        SUM(CASE WHEN q.question_type = 'text_input' AND user_question_stats.correct_count > 0 THEN 1 ELSE 0 END) as text_input_correct
       FROM user_question_stats
       JOIN questions q ON user_question_stats.question_id = q.id
       WHERE user_id = $1
       GROUP BY user_id`,
      [userId],
    );

    const stats = userStats[0] || {
      total_correct: 0,
      unique_questions_answered: 0,
      single_choice_correct: 0,
      multi_choice_correct: 0,
      text_input_correct: 0,
    };

    // Convert string values to numbers
    const totalCorrect = parseInt(stats.total_correct, 10) || 0;
    const singleChoiceCorrect = parseInt(stats.single_choice_correct, 10) || 0;
    const multiChoiceCorrect = parseInt(stats.multi_choice_correct, 10) || 0;
    const textInputCorrect = parseInt(stats.text_input_correct, 10) || 0;

    // Get already obtained achievements
    const obtainedAchievements = await this.dataSource.query(
      'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
      [userId],
    );
    const obtainedIds = new Set(obtainedAchievements.map((a: any) => a.achievement_id));

    // Check each achievement
    const achievementsToCheck = [
      // 1. First Steps - Answered first single choice question correctly
      {
        id: 1,
        check: async () =>
          !obtainedIds.has(1) &&
          singleChoiceCorrect >= 1,
      },
      // 2. Lucky Guess - Answered first multi-choice question correctly
      {
        id: 2,
        check: async () =>
          !obtainedIds.has(2) &&
          multiChoiceCorrect >= 1,
      },
      // 3. You Did the Thing - Answered first text input question correctly
      {
        id: 3,
        check: async () =>
          !obtainedIds.has(3) &&
          textInputCorrect >= 1,
      },
      // 4. Easy Peasy - Mastered all easy-level questions
      {
        id: 4,
        check: async () => {
          if (obtainedIds.has(4)) return false;
          const easyQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as easy_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.difficulty = 'easy' AND uqs.correct_count > 0`,
            [userId],
          );
          const totalEasy = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_easy FROM questions WHERE difficulty = 'easy'`,
          );
          const easyCorrectCount = parseInt(easyQuestions[0].easy_correct, 10) || 0;
          const totalEasyCount = parseInt(totalEasy[0].total_easy, 10) || 0;
          return easyCorrectCount > 0 && easyCorrectCount === totalEasyCount;
        },
      },
      // 5. Redemption Arc - Answered a previously missed question correctly
      {
        id: 5,
        check: async () => {
          if (obtainedIds.has(5)) return false;
          if (!isCorrect) return false;
          const prevIncorrect = await this.dataSource.query(
            `SELECT incorrect_count FROM user_question_stats WHERE user_id = $1 AND question_id = $2`,
            [userId, questionId],
          );
          return prevIncorrect.length > 0 && prevIncorrect[0].incorrect_count > 0;
        },
      },
      // 6. Click Clicker - Answered 10 single choice questions correctly
      {
        id: 6,
        check: async () =>
          !obtainedIds.has(6) &&
          singleChoiceCorrect >= 10,
      },
      // 7. Brain Overload - Answered 10 multi-choice questions correctly
      {
        id: 7,
        check: async () =>
          !obtainedIds.has(7) &&
          multiChoiceCorrect >= 10,
      },
      // 8. Keyboard Warrior - Answered 10 text input questions correctly
      {
        id: 8,
        check: async () =>
          !obtainedIds.has(8) &&
          textInputCorrect >= 10,
      },
      // 9. X Marks the Spot - Answered 10 questions correctly
      {
        id: 9,
        check: async () =>
          !obtainedIds.has(9) &&
          totalCorrect >= 10,
      },
      // 10. Getting There - Mastered all medium-level questions
      {
        id: 10,
        check: async () => {
          if (obtainedIds.has(10)) return false;
          const mediumQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as medium_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.difficulty = 'medium' AND uqs.correct_count > 0`,
            [userId],
          );
          const totalMedium = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_medium FROM questions WHERE difficulty = 'medium'`,
          );
          const mediumCorrectCount = parseInt(mediumQuestions[0].medium_correct, 10) || 0;
          const totalMediumCount = parseInt(totalMedium[0].total_medium, 10) || 0;
          return mediumCorrectCount > 0 && mediumCorrectCount === totalMediumCount;
        },
      },
      // 11. Clickety Click - Answered 25 single choice questions correctly
      {
        id: 11,
        check: async () =>
          !obtainedIds.has(11) &&
          singleChoiceCorrect >= 25,
      },
      // 12. Choice Champion - Answered 25 multi-choice questions correctly
      {
        id: 12,
        check: async () =>
          !obtainedIds.has(12) &&
          multiChoiceCorrect >= 25,
      },
      // 13. Type Master - Answered 25 text input questions correctly
      {
        id: 13,
        check: async () =>
          !obtainedIds.has(13) &&
          textInputCorrect >= 25,
      },
      // 14. Quiz Legend - Answered 100 questions correctly
      {
        id: 14,
        check: async () =>
          !obtainedIds.has(14) &&
          totalCorrect >= 100,
      },
      // 15. Code Wizard - Mastered all code-based questions
      {
        id: 15,
        check: async () => {
          if (obtainedIds.has(15)) return false;
          const codeQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as code_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.practical = true AND uqs.correct_count > 0`,
            [userId],
          );
          const totalCode = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_code FROM questions WHERE practical = true`,
          );
          const codeCorrectCount = parseInt(codeQuestions[0].code_correct, 10) || 0;
          const totalCodeCount = parseInt(totalCode[0].total_code, 10) || 0;
          return codeCorrectCount > 0 && codeCorrectCount === totalCodeCount;
        },
      },
      // 16. Book Smarts - Mastered all theoretical questions
      {
        id: 16,
        check: async () => {
          if (obtainedIds.has(16)) return false;
          const theoreticalQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as theoretical_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.practical = false AND uqs.correct_count > 0`,
            [userId],
          );
          const totalTheoretical = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_theoretical FROM questions WHERE practical = false`,
          );
          const theoreticalCorrectCount = parseInt(theoreticalQuestions[0].theoretical_correct, 10) || 0;
          const totalTheoreticalCount = parseInt(totalTheoretical[0].total_theoretical, 10) || 0;
          return theoreticalCorrectCount > 0 && theoreticalCorrectCount === totalTheoreticalCount;
        },
      },
      // 17. Single Threat - Mastered all single choice questions
      {
        id: 17,
        check: async () => {
          if (obtainedIds.has(17)) return false;
          const singleQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as single_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.question_type = 'single_choice' AND uqs.correct_count > 0`,
            [userId],
          );
          const totalSingle = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_single FROM questions WHERE question_type = 'single_choice'`,
          );
          const singleCorrectCount = parseInt(singleQuestions[0].single_correct, 10) || 0;
          const totalSingleCount = parseInt(totalSingle[0].total_single, 10) || 0;
          return singleCorrectCount > 0 && singleCorrectCount === totalSingleCount;
        },
      },
      // 18. Multiple Personality - Mastered all multi-choice questions
      {
        id: 18,
        check: async () => {
          if (obtainedIds.has(18)) return false;
          const multiQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as multi_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.question_type = 'multiple_choice' AND uqs.correct_count > 0`,
            [userId],
          );
          const totalMulti = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_multi FROM questions WHERE question_type = 'multiple_choice'`,
          );
          const multiCorrectCount = parseInt(multiQuestions[0].multi_correct, 10) || 0;
          const totalMultiCount = parseInt(totalMulti[0].total_multi, 10) || 0;
          return multiCorrectCount > 0 && multiCorrectCount === totalMultiCount;
        },
      },
      // 19. Type Champion - Mastered all text input questions
      {
        id: 19,
        check: async () => {
          if (obtainedIds.has(19)) return false;
          const textQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as text_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.question_type = 'text_input' AND uqs.correct_count > 0`,
            [userId],
          );
          const totalText = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_text FROM questions WHERE question_type = 'text_input'`,
          );
          const textCorrectCount = parseInt(textQuestions[0].text_correct, 10) || 0;
          const totalTextCount = parseInt(totalText[0].total_text, 10) || 0;
          return textCorrectCount > 0 && textCorrectCount === totalTextCount;
        },
      },
      // 20. Masochist - Completed all hard-level questions
      {
        id: 20,
        check: async () => {
          if (obtainedIds.has(20)) return false;
          const hardQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as hard_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.difficulty = 'hard' AND uqs.correct_count > 0`,
            [userId],
          );
          const totalHard = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_hard FROM questions WHERE difficulty = 'hard'`,
          );
          const hardCorrectCount = parseInt(hardQuestions[0].hard_correct, 10) || 0;
          const totalHardCount = parseInt(totalHard[0].total_hard, 10) || 0;
          return hardCorrectCount > 0 && hardCorrectCount === totalHardCount;
        },
      },
      // 50. NodeJS Ninja - You are now well prepared for a NodeJS interview!
      {
        id: 50,
        check: async () => {
          if (obtainedIds.has(50)) return false;
          const hasTopicMastery = await this.dataSource.query(
            `SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1 AND achievement_id IN (4, 10, 20, 15, 16)`,
            [userId],
          );
          return parseInt(hasTopicMastery[0].count, 10) >= 3;
        },
      },
    ];

    // Check each achievement and award if earned
    const awardedAchievementIds: number[] = [];
    for (const achievement of achievementsToCheck) {
      try {
        const isEarned = await achievement.check();
        if (isEarned) {
          await this.dataSource.query(
            `INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id, achievement_id) DO NOTHING`,
            [userId, achievement.id],
          );
          awardedAchievementIds.push(achievement.id);
        }
      } catch (error) {
        console.error(
          `Error checking achievement ${achievement.id} for user ${userId}:`,
          error,
        );
      }
    }

    // Fetch full achievement details for awarded achievements
    if (awardedAchievementIds.length > 0) {
      const achievementDetails = await this.dataSource.query(
        `SELECT id, title, description, sprite_col, sprite_row FROM achievements 
         WHERE id = ANY($1)`,
        [awardedAchievementIds],
      );
      return achievementDetails;
    }

    return [];
  }

  async getUserAchievementsWithProgress(userId: number): Promise<UserAchievement[]> {
    // Get all achievements
    const allAchievements = await this.getAllAchievements();

    // Get user's unlocked achievements
    const unlockedAchievements = await this.dataSource.query(
      'SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1',
      [userId],
    );
    const unlockedIds = new Set(unlockedAchievements.map((a: any) => a.achievement_id));
    const unlockedMap = new Map(unlockedAchievements.map((a: any) => [a.achievement_id, a.unlocked_at]));

    // Get user stats for progress calculation
    const userStats = await this.dataSource.query(
      `SELECT 
        SUM(correct_count) as total_correct,
        SUM(CASE WHEN q.question_type = 'single_choice' AND user_question_stats.correct_count > 0 THEN 1 ELSE 0 END) as single_choice_correct,
        SUM(CASE WHEN q.question_type = 'multiple_choice' AND user_question_stats.correct_count > 0 THEN 1 ELSE 0 END) as multi_choice_correct,
        SUM(CASE WHEN q.question_type = 'text_input' AND user_question_stats.correct_count > 0 THEN 1 ELSE 0 END) as text_input_correct
       FROM user_question_stats
       JOIN questions q ON user_question_stats.question_id = q.id
       WHERE user_id = $1`,
      [userId],
    );

    const stats = userStats[0] || {
      total_correct: 0,
      single_choice_correct: 0,
      multi_choice_correct: 0,
      text_input_correct: 0,
    };

    const singleChoiceCorrect = parseInt(stats.single_choice_correct, 10) || 0;
    const multiChoiceCorrect = parseInt(stats.multi_choice_correct, 10) || 0;
    const textInputCorrect = parseInt(stats.text_input_correct, 10) || 0;
    const totalCorrect = parseInt(stats.total_correct, 10) || 0;

    // Map achievements with progress info
    return Promise.all(allAchievements.map(async (achievement: Achievement): Promise<UserAchievement> => {
      const unlocked = unlockedIds.has(achievement.id);
      const result: UserAchievement = {
        ...achievement,
        unlocked,
      };

      if (unlocked) {
        result.unlocked_at = unlockedMap.get(achievement.id) as string | undefined;
      } else {
        // Add progress for locked achievements
        const progress = await this.getAchievementProgress(userId, achievement.id, {
          singleChoiceCorrect,
          multiChoiceCorrect,
          textInputCorrect,
          totalCorrect,
        });
        if (progress) {
          result.progress = progress;
        }
      }

      return result;
    }));
  }

  private async getAchievementProgress(
    userId: number,
    achievementId: number,
    stats: {
      singleChoiceCorrect: number;
      multiChoiceCorrect: number;
      textInputCorrect: number;
      totalCorrect: number;
    },
  ): Promise<{ current: number; total: number; label: string } | undefined> {
    switch (achievementId) {
      case 1: // First Steps - Answered first single choice question correctly
        return {
          current: Math.min(stats.singleChoiceCorrect, 1),
          total: 1,
          label: `${stats.singleChoiceCorrect} / 1 single choice`,
        };
      case 2: // Lucky Guess - Answered first multi-choice question correctly
        return {
          current: Math.min(stats.multiChoiceCorrect, 1),
          total: 1,
          label: `${stats.multiChoiceCorrect} / 1 multiple choice`,
        };
      case 3: // You Did the Thing - Answered first text input question correctly
        return {
          current: Math.min(stats.textInputCorrect, 1),
          total: 1,
          label: `${stats.textInputCorrect} / 1 text input`,
        };
      case 4: // Easy Peasy - Mastered all easy-level questions
        {
          const easyQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as easy_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.difficulty = 'easy' AND uqs.correct_count > 0`,
            [userId],
          );
          const totalEasy = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_easy FROM questions WHERE difficulty = 'easy'`,
          );
          const easyCorrectCount = parseInt(easyQuestions[0]?.easy_correct, 10) || 0;
          const totalEasyCount = parseInt(totalEasy[0]?.total_easy, 10) || 0;
          return {
            current: easyCorrectCount,
            total: totalEasyCount,
            label: `${easyCorrectCount} / ${totalEasyCount} easy questions`,
          };
        }
      case 5: // Redemption Arc - Answered a previously missed question correctly
        return {
          current: 0,
          total: 1,
          label: 'Answer a previously incorrect question',
        };
      case 6: // Click Clicker - 10 single choice
        return {
          current: Math.min(stats.singleChoiceCorrect, 10),
          total: 10,
          label: `${stats.singleChoiceCorrect} / 10 single choice`,
        };
      case 7: // Choice Master - 25 multi-choice
        return {
          current: Math.min(stats.multiChoiceCorrect, 25),
          total: 25,
          label: `${stats.multiChoiceCorrect} / 25 multiple choice`,
        };
      case 8: // Typo Slayer - 10 text input
        return {
          current: Math.min(stats.textInputCorrect, 10),
          total: 10,
          label: `${stats.textInputCorrect} / 10 text input`,
        };
      case 9: // Centenarian - 100 total correct
        return {
          current: Math.min(stats.totalCorrect, 100),
          total: 100,
          label: `${stats.totalCorrect} / 100 correct answers`,
        };
      case 10: // Medium Mastery - Mastered all medium-level questions
        {
          const mediumQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as medium_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.difficulty = 'medium' AND uqs.correct_count > 0`,
            [userId],
          );
          const totalMedium = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_medium FROM questions WHERE difficulty = 'medium'`,
          );
          const mediumCorrectCount = parseInt(mediumQuestions[0]?.medium_correct, 10) || 0;
          const totalMediumCount = parseInt(totalMedium[0]?.total_medium, 10) || 0;
          return {
            current: mediumCorrectCount,
            total: totalMediumCount,
            label: `${mediumCorrectCount} / ${totalMediumCount} medium questions`,
          };
        }
      case 11: // Single Threat - 25 single choice
        return {
          current: Math.min(stats.singleChoiceCorrect, 25),
          total: 25,
          label: `${stats.singleChoiceCorrect} / 25 single choice`,
        };
      case 12: // Multi-Task Master - 50 multi-choice
        return {
          current: Math.min(stats.multiChoiceCorrect, 50),
          total: 50,
          label: `${stats.multiChoiceCorrect} / 50 multiple choice`,
        };
      case 13: // Word Wizard - 50 text input
        return {
          current: Math.min(stats.textInputCorrect, 50),
          total: 50,
          label: `${stats.textInputCorrect} / 50 text input`,
        };
      case 14: // Thousandaire - 1000 total correct
        return {
          current: Math.min(stats.totalCorrect, 1000),
          total: 1000,
          label: `${stats.totalCorrect} / 1000 correct answers`,
        };
      case 15: // Single Champion - Mastered all single choice questions
        {
          const singleQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as single_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.question_type = 'single_choice' AND uqs.correct_count > 0`,
            [userId],
          );
          const totalSingle = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_single FROM questions WHERE question_type = 'single_choice'`,
          );
          const singleCorrectCount = parseInt(singleQuestions[0]?.single_correct, 10) || 0;
          const totalSingleCount = parseInt(totalSingle[0]?.total_single, 10) || 0;
          return {
            current: singleCorrectCount,
            total: totalSingleCount,
            label: `${singleCorrectCount} / ${totalSingleCount} single choice`,
          };
        }
      case 16: // Multi Champion - Mastered all multiple choice questions
        {
          const multiQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as multi_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.question_type = 'multiple_choice' AND uqs.correct_count > 0`,
            [userId],
          );
          const totalMulti = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_multi FROM questions WHERE question_type = 'multiple_choice'`,
          );
          const multiCorrectCount = parseInt(multiQuestions[0]?.multi_correct, 10) || 0;
          const totalMultiCount = parseInt(totalMulti[0]?.total_multi, 10) || 0;
          return {
            current: multiCorrectCount,
            total: totalMultiCount,
            label: `${multiCorrectCount} / ${totalMultiCount} multiple choice`,
          };
        }
      case 17: // Practical Master - Mastered all practical questions
        {
          const practicalQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as practical_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.practical = true AND uqs.correct_count > 0`,
            [userId],
          );
          const totalPractical = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_practical FROM questions WHERE practical = true`,
          );
          const practicalCorrectCount = parseInt(practicalQuestions[0]?.practical_correct, 10) || 0;
          const totalPracticalCount = parseInt(totalPractical[0]?.total_practical, 10) || 0;
          return {
            current: practicalCorrectCount,
            total: totalPracticalCount,
            label: `${practicalCorrectCount} / ${totalPracticalCount} practical questions`,
          };
        }
      case 18: // Theoretical Master - Mastered all theoretical questions
        {
          const theoreticalQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as theoretical_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.practical = false AND uqs.correct_count > 0`,
            [userId],
          );
          const totalTheoretical = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_theoretical FROM questions WHERE practical = false`,
          );
          const theoreticalCorrectCount = parseInt(theoreticalQuestions[0]?.theoretical_correct, 10) || 0;
          const totalTheoreticalCount = parseInt(totalTheoretical[0]?.total_theoretical, 10) || 0;
          return {
            current: theoreticalCorrectCount,
            total: totalTheoreticalCount,
            label: `${theoreticalCorrectCount} / ${totalTheoreticalCount} theoretical questions`,
          };
        }
      case 19: // Type Champion - Mastered all text input questions
        {
          const textQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as text_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.question_type = 'text_input' AND uqs.correct_count > 0`,
            [userId],
          );
          const totalText = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_text FROM questions WHERE question_type = 'text_input'`,
          );
          const textCorrectCount = parseInt(textQuestions[0]?.text_correct, 10) || 0;
          const totalTextCount = parseInt(totalText[0]?.total_text, 10) || 0;
          return {
            current: textCorrectCount,
            total: totalTextCount,
            label: `${textCorrectCount} / ${totalTextCount} text input`,
          };
        }
      case 20: // Masochist - Completed all hard-level questions
        {
          const hardQuestions = await this.dataSource.query(
            `SELECT COUNT(DISTINCT uqs.question_id) as hard_correct
             FROM user_question_stats uqs
             JOIN questions q ON uqs.question_id = q.id
             WHERE uqs.user_id = $1 AND q.difficulty = 'hard' AND uqs.correct_count > 0`,
            [userId],
          );
          const totalHard = await this.dataSource.query(
            `SELECT COUNT(DISTINCT id) as total_hard FROM questions WHERE difficulty = 'hard'`,
          );
          const hardCorrectCount = parseInt(hardQuestions[0]?.hard_correct, 10) || 0;
          const totalHardCount = parseInt(totalHard[0]?.total_hard, 10) || 0;
          return {
            current: hardCorrectCount,
            total: totalHardCount,
            label: `${hardCorrectCount} / ${totalHardCount} hard questions`,
          };
        }
      case 50: // NodeJS Ninja - 3+ major masteries
        {
          const majorMasteries = await this.dataSource.query(
            `SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1 AND achievement_id IN (4, 10, 20, 15, 16)`,
            [userId],
          );
          const count = parseInt(majorMasteries[0]?.count, 10) || 0;
          return {
            current: Math.min(count, 3),
            total: 3,
            label: `${count} / 3 major masteries`,
          };
        }
      default:
        return undefined;
    }
  }
}

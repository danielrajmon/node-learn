import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

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

  constructor(private readonly dataSource: DataSource) {}

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
      return await this.dataSource.query(query);
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
      const result = await this.dataSource.query(query, [id]);
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
      const unlockedAchievements = await this.dataSource.query(unlockedQuery, [userId]);
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

  async awardAchievement(userId: string, achievementId: number): Promise<void> {
    this.logger.debug(`Awarding achievement ${achievementId} to user ${userId}`);
    try {
      const query = `
        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id, achievement_id) DO NOTHING
      `;
      await this.dataSource.query(query, [userId, achievementId]);
    } catch (error) {
      this.logger.error(
        `Error awarding achievement ${achievementId} to user ${userId}:`,
        error,
      );
      throw error;
    }
  }
}

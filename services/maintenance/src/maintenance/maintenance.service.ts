import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class MaintenanceService {
  constructor(private readonly dataSource: DataSource) {}

  @Cron('0 0 * * *')  // Runs every day at midnight (00:00 UTC)
  async resetGuestUserDaily(): Promise<void> {
    try {
      const guestId = await this.getGuestUserId();

      // Delete achievements
      await this.dataSource.query(
        'DELETE FROM user_achievements WHERE user_id = $1',
        [guestId],
      );

      // Delete question stats
      await this.dataSource.query(
        'DELETE FROM user_question_stats WHERE user_id = $1',
        [guestId],
      );

      console.log('Guest user stats reset at midnight');
    } catch (error) {
      console.error('Failed to reset guest user stats:', error);
    }
  }

  private async getGuestUserId(): Promise<number> {
    const result = await this.dataSource.query(
      "SELECT id FROM users WHERE google_id = 'guest-user' LIMIT 1",
    );
    if (result.length === 0) {
      throw new Error('Guest user not found. Please run migrations.');
    }
    return result[0].id;
  }
}

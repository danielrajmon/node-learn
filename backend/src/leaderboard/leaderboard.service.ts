import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface LeaderboardEntry {
  quiz_mode_id: string;
  position: number;
  user_id: number;
  correct_answers: number;
  total_questions: number;
  streak: number;
  achieved_at: Date;
  username?: string;
}

@Injectable()
export class LeaderboardService {
  constructor(private dataSource: DataSource) {}

  async updateLeaderboard(
    modeId: string,
    userId: number,
    correctAnswers: number,
    totalQuestions: number,
    streak: number,
    username: string
  ): Promise<void> {
    // Check if user already exists in leaderboard for this mode
    const existing = await this.dataSource.query(
      `SELECT correct_answers, total_questions, streak FROM leaderboards WHERE quiz_mode_id = $1 AND user_id = $2`,
      [modeId, userId]
    );

    if (existing.length > 0) {
      // User exists - update with new stats
      await this.dataSource.query(
        `UPDATE leaderboards SET correct_answers = $1, total_questions = $2, streak = $3, achieved_at = CURRENT_TIMESTAMP 
         WHERE quiz_mode_id = $4 AND user_id = $5`,
        [correctAnswers, totalQuestions, streak, modeId, userId]
      );
    } else {
      // User doesn't exist yet - get current top 10
      const topEntries = await this.dataSource.query(
        `SELECT user_id, correct_answers, streak FROM leaderboards WHERE quiz_mode_id = $1 ORDER BY correct_answers DESC, streak DESC LIMIT 10`,
        [modeId]
      );

      // If less than 10 entries, always add the user
      if (topEntries.length < 10) {
        // Find an available position
        const usedPositions = await this.dataSource.query(
          `SELECT position FROM leaderboards WHERE quiz_mode_id = $1 ORDER BY position`,
          [modeId]
        );
        
        let nextPosition = 1;
        const usedSet = new Set(usedPositions.map((p: any) => p.position));
        while (usedSet.has(nextPosition)) {
          nextPosition++;
        }
        
        await this.dataSource.query(
          `INSERT INTO leaderboards (quiz_mode_id, position, user_id, correct_answers, total_questions, streak, achieved_at) 
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [modeId, nextPosition, userId, correctAnswers, totalQuestions, streak]
        );
      } else {
        // Check if correct_answers beats the 10th place
        const lowestCorrectAnswers = topEntries[topEntries.length - 1].correct_answers;
        if (correctAnswers > lowestCorrectAnswers) {
          // Delete the lowest entry and add the new user
          const lowestUserId = topEntries[topEntries.length - 1].user_id;
          await this.dataSource.query(
            `DELETE FROM leaderboards WHERE quiz_mode_id = $1 AND user_id = $2`,
            [modeId, lowestUserId]
          );
          
          await this.dataSource.query(
            `INSERT INTO leaderboards (quiz_mode_id, position, user_id, correct_answers, total_questions, streak, achieved_at) 
             VALUES ($1, 10, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
            [modeId, userId, correctAnswers, totalQuestions, streak]
          );
        }
      }
    }

    // Recalculate all positions for this mode
    await this.recalculatePositions(modeId);
  }

  private async recalculatePositions(modeId: string): Promise<void> {
    // Get all entries sorted by correct_answers DESC, streak DESC
    const entries = await this.dataSource.query(
      `SELECT user_id, correct_answers, total_questions, streak FROM leaderboards WHERE quiz_mode_id = $1 ORDER BY correct_answers DESC, streak DESC LIMIT 10`,
      [modeId]
    );

    // Delete all entries for this mode and re-insert with correct positions
    await this.dataSource.query(
      `DELETE FROM leaderboards WHERE quiz_mode_id = $1`,
      [modeId]
    );

    // Re-insert with correct positions
    for (let i = 0; i < entries.length; i++) {
      const position = i + 1;
      await this.dataSource.query(
        `INSERT INTO leaderboards (quiz_mode_id, position, user_id, correct_answers, total_questions, streak, achieved_at) 
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [modeId, position, entries[i].user_id, entries[i].correct_answers, entries[i].total_questions, entries[i].streak]
      );
    }
  }

  async getLeaderboard(modeId: string): Promise<LeaderboardEntry[]> {
    const result = await this.dataSource.query(
      `SELECT l.quiz_mode_id, l.position, l.user_id, l.correct_answers, l.total_questions, l.streak, l.achieved_at, u.name as username
       FROM leaderboards l
       JOIN users u ON l.user_id = u.id
       WHERE l.quiz_mode_id = $1
       ORDER BY l.position ASC`,
      [modeId]
    );
    return result;
  }
}

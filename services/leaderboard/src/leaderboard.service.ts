import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardEntity } from './entities/leaderboard.entity';

export interface LeaderboardEntry {
  quiz_mode_id: string;
  position: number;
  user_id: number;
  correct_answers: number;
  total_questions: number;
  correct_answers_count: number;  // Correct answers in session for leaderboard ranking
  achieved_at: Date;
  username?: string;
}

@Injectable()
export class LeaderboardService {
  private logger = new Logger('LeaderboardService');

  constructor(
    @InjectRepository(LeaderboardEntity)
    private leaderboardRepository: Repository<LeaderboardEntity>,
  ) {}

  async updateLeaderboard(
    modeId: string,
    userId: number,
    correctAnswers: number,
    totalQuestions: number,
    correctAnswersCount: number,  // Correct answers count for leaderboard ranking
    username: string
  ): Promise<void> {
    const modeIdNum = Number(modeId);
    
    // Check if user already exists in leaderboard for this mode
    const existing = await this.leaderboardRepository.findOne({
      where: { quizModeId: modeIdNum, userId }
    });

    if (existing) {
      // User exists - update with new stats
      await this.leaderboardRepository.update(
        { quizModeId: modeIdNum, userId },
        { 
          correctAnswers, 
          totalQuestions, 
          streak: correctAnswersCount, 
          achievedAt: new Date() 
        }
      );
    } else {
      // User doesn't exist yet - get current top 6
      const topEntries = await this.leaderboardRepository.find({
        where: { quizModeId: modeIdNum },
        order: { correctAnswers: 'DESC', streak: 'DESC' },
        take: 6
      });

      // If less than 6 entries, always add the user
      if (topEntries.length < 6) {
        // Find an available position
        const usedPositions = await this.leaderboardRepository.find({
          where: { quizModeId: modeIdNum },
          select: ['position'],
          order: { position: 'ASC' }
        });

        let nextPosition = 1;
        const usedSet = new Set(usedPositions.map(p => p.position));
        while (usedSet.has(nextPosition)) {
          nextPosition++;
        }

        await this.leaderboardRepository.save({
          quizModeId: modeIdNum,
          position: nextPosition,
          userId,
          correctAnswers,
          totalQuestions,
          streak,
          achievedAt: new Date()
        });
      } else {
        // Check if correct_answers beats the 6th place
        const lowestCorrectAnswers = topEntries[topEntries.length - 1].correctAnswers;
        if (correctAnswers > lowestCorrectAnswers) {
          // Delete the lowest entry and add the new user
          const lowestUserId = topEntries[topEntries.length - 1].userId;
          await this.leaderboardRepository.delete({
            quizModeId: modeIdNum,
            userId: lowestUserId
          });

          await this.leaderboardRepository.save({
            quizModeId: modeIdNum,
            position: 6,
            userId,
            correctAnswers,
            totalQuestions,
            streak: correctAnswersCount,
            achievedAt: new Date()
          });
        }
      }
    }

    // Recalculate all positions for this mode
    await this.recalculatePositions(modeIdNum);
  }

  private async recalculatePositions(modeId: number): Promise<void> {
    // Get all entries sorted by correct_answers DESC, correct_answers_count DESC
    const entries = await this.leaderboardRepository.find({
      where: { quizModeId: modeId },
      order: { correctAnswers: 'DESC', streak: 'DESC' },
      take: 6
    });

    // Delete all entries for this mode and re-insert with correct positions
    await this.leaderboardRepository.delete({ quizModeId: modeId });

    // Re-insert with correct positions
    for (let i = 0; i < entries.length; i++) {
      const position = i + 1;
      await this.leaderboardRepository.save({
        quizModeId: modeId,
        position,
        userId: entries[i].userId,
        correctAnswers: entries[i].correctAnswers,
        totalQuestions: entries[i].totalQuestions,
        streak: entries[i].streak,
        achievedAt: new Date()
      });
    }
  }

  async getLeaderboard(modeId: string): Promise<LeaderboardEntry[]> {
    const modeIdNum = Number(modeId);
    
    const entries = await this.leaderboardRepository.find({
      where: { quizModeId: modeIdNum },
      relations: ['user'],
      order: { position: 'ASC' }
    });

    const result: LeaderboardEntry[] = entries.map(entry => ({
      quiz_mode_id: entry.quizModeId.toString(),
      position: entry.position,
      user_id: entry.userId,
      correct_answers: entry.correctAnswers,
      total_questions: entry.totalQuestions,
      correct_answers_count: entry.streak,
      achieved_at: entry.achievedAt,
      username: entry.user?.name
    }));

    // If fewer than 6 entries, add fake entries to fill the leaderboard
    if (result.length < 6) {
      const firstNames = [
        'James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda',
        'David', 'Barbara', 'Richard', 'Elizabeth', 'Joseph', 'Susan', 'Thomas', 'Jessica',
        'Charles', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa',
        'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra', 'Steven', 'Ashley',
        'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle',
        'Kevin', 'Dorothy', 'Brian', 'Carol', 'Edward', 'Amanda', 'Ronald', 'Melissa'
      ];

      const lastNames = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
        'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
        'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Young',
        'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Peterson', 'Phillips', 'Campbell',
        'Parker', 'Evans', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales'
      ];

      const getRandomName = () => {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        return `${firstName} ${lastName}`;
      };

      for (let i = result.length; i < 6; i++) {
        const fakeEntry: LeaderboardEntry = {
          quiz_mode_id: modeId,
          position: i + 1,
          user_id: 0,
          correct_answers: 0,
          total_questions: 0,
          correct_answers_count: 0,
          achieved_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          username: getRandomName()
        };
        result.push(fakeEntry);
      }
    }

    return result;
  }

  async getUserLeaderboardPosition(userId: number) {
    const entries = await this.leaderboardRepository.find({
      where: { userId },
      relations: ['user'],
      order: { quizModeId: 'ASC' }
    });

    return entries.map(entry => ({
      quiz_mode_id: entry.quizModeId.toString(),
      position: entry.position,
      user_id: entry.userId,
      correct_answers: entry.correctAnswers,
      total_questions: entry.totalQuestions,
      correct_answers_count: entry.streak,
      achieved_at: entry.achievedAt,
      username: entry.user?.name
    }));
  }
}

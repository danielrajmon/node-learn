import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Post('update')
  async updateLeaderboard(
    @Body() body: { modeId: string; userId: number; correctAnswers: number; totalQuestions: number; streak: number; username: string }
  ): Promise<{ success: boolean }> {
    await this.leaderboardService.updateLeaderboard(
      body.modeId,
      body.userId,
      body.correctAnswers,
      body.totalQuestions,
      body.streak,
      body.username
    );
    return { success: true };
  }

  @Get('mode/:modeId')
  async getLeaderboard(@Param('modeId') modeId: string) {
    return this.leaderboardService.getLeaderboard(modeId);
  }
}

import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import {
  LeaderboardEntryDto,
  LeaderboardUpdateDto,
  LeaderboardUpdateResponseDto,
} from './dto/leaderboard.dto';

@Controller('leaderboard')
export class LeaderboardController {
  private logger = new Logger('LeaderboardController');

  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'leaderboard', timestamp: new Date().toISOString() };
  }

  @Post('update')
  async updateLeaderboard(
    @Body() body: LeaderboardUpdateDto
  ): Promise<LeaderboardUpdateResponseDto> {
    this.logger.debug(`Updating leaderboard: mode=${body.modeId}, user=${body.userId}, correct=${body.correctAnswers}`);
    await this.leaderboardService.updateLeaderboard(
      body.modeId,
      body.userId,
      body.correctAnswers,
      body.totalQuestions,
      body.correctAnswersCount,
      body.username
    );
    return { success: true };
  }

  @Get('mode/:modeId')
  async getLeaderboard(@Param('modeId') modeId: string): Promise<LeaderboardEntryDto[]> {
    this.logger.debug(`Fetching leaderboard for mode: ${modeId}`);
    return this.leaderboardService.getLeaderboard(modeId);
  }

  @Get('user/:userId')
  async getUserLeaderboardPosition(@Param('userId') userId: string): Promise<LeaderboardEntryDto[]> {
    this.logger.debug(`Fetching leaderboard position for user: ${userId}`);
    return this.leaderboardService.getUserLeaderboardPosition(Number(userId));
  }
}

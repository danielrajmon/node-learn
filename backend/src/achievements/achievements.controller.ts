import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AchievementsService, Achievement, UserAchievement } from './achievements.service';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async getAllAchievements(): Promise<Achievement[]> {
    return this.achievementsService.getAllAchievements();
  }

  @Get('guest-id')
  async getGuestUserId(): Promise<{ userId: number }> {
    const guestId = await this.achievementsService.getGuestUserId();
    return { userId: guestId };
  }

  @Get('user/:userId')
  async getUserAchievements(@Param('userId') userId: string): Promise<UserAchievement[]> {
    return this.achievementsService.getUserAchievementsWithProgress(parseInt(userId, 10));
  }

  @Post('check')
  async checkAndAwardAchievements(
    @Body() body: { userId: number; questionId: number; isCorrect: boolean },
  ): Promise<{ awardedAchievements: any[] }> {
    const awardedAchievements = await this.achievementsService.checkAndAwardAchievements(
      body.userId,
      body.questionId,
      body.isCorrect,
    );
    return { awardedAchievements };
  }
}

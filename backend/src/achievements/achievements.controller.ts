import { Controller, Get, Post, Body } from '@nestjs/common';
import { AchievementsService, Achievement } from './achievements.service';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async getAllAchievements(): Promise<Achievement[]> {
    return this.achievementsService.getAllAchievements();
  }

  @Post('check')
  async checkAndAwardAchievements(
    @Body() body: { userId: number; questionId: number; isCorrect: boolean },
  ): Promise<{ awardedAchievementIds: number[] }> {
    const awardedAchievementIds = await this.achievementsService.checkAndAwardAchievements(
      body.userId,
      body.questionId,
      body.isCorrect,
    );
    return { awardedAchievementIds };
  }
}

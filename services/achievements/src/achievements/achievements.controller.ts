import { Body, Controller, Get, Param, Logger, Post, Query } from '@nestjs/common';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
export class AchievementsController {
  private readonly logger = new Logger('AchievementsController');

  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'achievements', timestamp: new Date().toISOString() };
  }

  @Get()
  async findAll(@Query('userId') userId?: string) {
    this.logger.debug(`[findAll] Fetching achievements${userId ? ` for user ${userId}` : ''}`);
    if (userId) {
      return await this.achievementsService.findUserAchievements(userId);
    }
    return await this.achievementsService.findAll();
  }

  @Get('user/:userId')
  async getUserAchievements(@Param('userId') userId: string) {
    this.logger.debug(`[getUserAchievements] Fetching achievements for user: ${userId}`);
    return await this.achievementsService.findUserAchievements(userId);
  }

  @Post('check')
  async checkAndAward(@Body() body: any) {
    const { userId, questionId, isCorrect, questionType, practical, difficulty } = body || {};
    const qid = Number(questionId);

    if (!userId || Number.isNaN(qid)) {
      return { awarded: [] };
    }

    // Update projection and compute awards synchronously
    await this.achievementsService.recordAnswerProjection({
      userId,
      questionId: qid,
      isCorrect: Boolean(isCorrect),
      questionType,
      practical,
      difficulty,
    });

    const awarded = await this.achievementsService.checkAndAwardAchievements(
      Number(userId),
      qid,
      Boolean(isCorrect),
    );

    return { awardedAchievements: awarded };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.debug(`[findOne] Fetching achievement with ID: ${id}`);
    return await this.achievementsService.findOne(+id);
  }
}

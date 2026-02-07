import { Body, Controller, Get, Param, Logger, Post, Query } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import {
  AchievementAwardResponseDto,
  AchievementCheckDto,
  AchievementDto,
  UserAchievementDto,
} from '../dto/achievement.dto';

@Controller('achievements')
export class AchievementsController {
  private readonly logger = new Logger('AchievementsController');

  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'achievements', timestamp: new Date().toISOString() };
  }

  @Get()
  async findAll(@Query('userId') userId?: string): Promise<AchievementDto[] | UserAchievementDto[]> {
    this.logger.debug(`[findAll] Fetching achievements${userId ? ` for user ${userId}` : ''}`);
    if (userId) {
      return await this.achievementsService.findUserAchievements(userId);
    }
    return await this.achievementsService.findAll();
  }

  @Get('user/:userId')
  async getUserAchievements(@Param('userId') userId: string): Promise<UserAchievementDto[]> {
    this.logger.debug(`[getUserAchievements] Fetching achievements for user: ${userId}`);
    return await this.achievementsService.findUserAchievements(userId);
  }

  @Post('check')
  async checkAndAward(@Body() body: AchievementCheckDto): Promise<AchievementAwardResponseDto> {
    const { userId, questionId, isCorrect, questionType, practical, difficulty } = body || {};
    const qid = Number(questionId);

    if (!userId || Number.isNaN(qid)) {
      return { awardedAchievements: [], awarded: [] };
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
  async findOne(@Param('id') id: string): Promise<AchievementDto | null> {
    this.logger.debug(`[findOne] Fetching achievement with ID: ${id}`);
    return await this.achievementsService.findOne(+id);
  }
}

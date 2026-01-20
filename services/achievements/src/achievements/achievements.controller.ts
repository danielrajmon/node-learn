import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.debug(`[findOne] Fetching achievement with ID: ${id}`);
    return await this.achievementsService.findOne(+id);
  }
}

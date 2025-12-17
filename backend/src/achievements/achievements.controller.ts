import { Controller, Get } from '@nestjs/common';
import { AchievementsService, Achievement } from './achievements.service';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async getAllAchievements(): Promise<Achievement[]> {
    return this.achievementsService.getAllAchievements();
  }
}

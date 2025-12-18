import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [TypeOrmModule, AchievementsModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerController } from './answer.controller';
import { AnswerService } from './answer.service';
import { QuestionEntity } from '../shared/entities/question.entity';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionEntity]), AchievementsModule],
  controllers: [AnswerController],
  providers: [AnswerService],
})
export class AnswerModule {}


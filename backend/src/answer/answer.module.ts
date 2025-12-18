import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerController } from './answer.controller';
import { AnswerService } from './answer.service';
import { QuestionModule } from '../question/question.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [QuestionModule, TypeOrmModule, AchievementsModule],
  controllers: [AnswerController],
  providers: [AnswerService],
})
export class AnswerModule {}


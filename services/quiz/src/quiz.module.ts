import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { StatsController } from './stats.controller';
import { AnswersController } from './answers.controller';
import { QuizService } from './quiz.service';
import { DatabaseService } from './database.service';
import { NatsService } from './nats.service';

@Module({
  imports: [],
  controllers: [QuizController, StatsController, AnswersController],
  providers: [QuizService, DatabaseService, NatsService],
})
export class QuizModule {}

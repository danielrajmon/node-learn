import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizController } from './quiz.controller';
import { StatsController } from './stats.controller';
import { AnswersController } from './answers.controller';
import { QuizService } from './quiz.service';
import { NatsService } from './nats.service';
import { QuestionEntity } from './entities/question.entity';
import { ChoiceEntity } from './entities/choice.entity';
import { UserQuestionStatsEntity } from './entities/user-question-stats.entity';
import { QuizModeEntity } from './entities/quiz-mode.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL') || 
          `postgresql://${configService.get('POSTGRES_USER')}:${configService.get('POSTGRES_PASSWORD')}@${configService.get('POSTGRES_HOST')}:${configService.get('POSTGRES_PORT')}/${configService.get('POSTGRES_DB')}`;
        
        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [QuestionEntity, ChoiceEntity, UserQuestionStatsEntity, QuizModeEntity],
          synchronize: false,
          logging: false,
        };
      },
    }),
    TypeOrmModule.forFeature([QuestionEntity, ChoiceEntity, UserQuestionStatsEntity, QuizModeEntity]),
  ],
  controllers: [QuizController, StatsController, AnswersController],
  providers: [QuizService, NatsService],
})
export class QuizModule {}

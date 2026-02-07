import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizController } from './quiz.controller';
import { StatsController } from './stats.controller';
import { AnswersController } from './answers.controller';
import { QuizService } from './quiz.service';
import { NatsModule } from '@node-learn/messaging';
import { UserQuestionStatsEntity } from './entities/user-question-stats.entity';
import { QuizModeEntity } from './entities/quiz-mode.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Primary connection: quiz database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL') || 
          `postgresql://${configService.get('POSTGRES_USER')}:${configService.get('POSTGRES_PASSWORD')}@${configService.get('POSTGRES_HOST')}:${configService.get('POSTGRES_PORT')}/${configService.get('POSTGRES_DB')}`;
        
        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [UserQuestionStatsEntity, QuizModeEntity],
          synchronize: false,
          logging: false,
        };
      },
    }),
    TypeOrmModule.forFeature([UserQuestionStatsEntity, QuizModeEntity]),
    NatsModule,
  ],
  controllers: [QuizController, StatsController, AnswersController],
  providers: [QuizService],
})
export class QuizModule {}

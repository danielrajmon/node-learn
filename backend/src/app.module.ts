import { config } from 'dotenv';
config({ path: '../.env' });

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuestionModule } from './question/question.module';
import { AnswerModule } from './answer/answer.module';
import { AdminModule } from './admin/admin.module';
import { QuestionEntity } from './question/entities/question.entity';
import { ChoiceEntity } from './question/entities/choice.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      entities: [QuestionEntity, ChoiceEntity],
      synchronize: false, // Don't auto-create tables, we already have them
    }),
    QuestionModule,
    AnswerModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

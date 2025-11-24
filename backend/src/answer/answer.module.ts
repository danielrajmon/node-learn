import { Module } from '@nestjs/common';
import { AnswerController } from './answer.controller';
import { AnswerService } from './answer.service';
import { QuestionModule } from '../question/question.module';

@Module({
  imports: [QuestionModule],
  controllers: [AnswerController],
  providers: [AnswerService],
})
export class AnswerModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { QuestionEntity } from './entities/question.entity';
import { ChoiceEntity } from './entities/choice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionEntity, ChoiceEntity]),
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}

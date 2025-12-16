import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { QuestionEntity } from '../question/entities/question.entity';
import { ChoiceEntity } from '../question/entities/choice.entity';
import { User } from '../auth/entities/user.entity';
import { QuestionModule } from '../question/question.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionEntity, ChoiceEntity, User]),
    QuestionModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

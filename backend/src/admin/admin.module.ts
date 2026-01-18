import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { QuestionEntity } from '../shared/entities/question.entity';
import { ChoiceEntity } from '../shared/entities/choice.entity';
import { User } from '../shared/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionEntity, ChoiceEntity, User]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

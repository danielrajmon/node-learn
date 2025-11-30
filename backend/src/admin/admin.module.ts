import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { QuestionEntity } from '../question/entities/question.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionEntity])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

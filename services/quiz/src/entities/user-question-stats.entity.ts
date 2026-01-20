import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { QuestionEntity } from './question.entity';

@Entity('user_question_stats')
export class UserQuestionStatsEntity {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn({ name: 'question_id' })
  questionId: number;

  @Column({ name: 'correct_count', type: 'integer', default: 0 })
  correctCount: number;

  @Column({ name: 'incorrect_count', type: 'integer', default: 0 })
  incorrectCount: number;

  @ManyToOne(() => QuestionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: QuestionEntity;
}
